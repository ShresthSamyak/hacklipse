"""
Report Generation Service.

Strategy:
  1. Primary attempt  — full prompt on PRIMARY LLM (task: report_generation)
  2. Rate-limit retry — wait 2 s, retry on primary once
  3. Lightweight fallback — reduced prompt on FAST LLM (task: testimony_summary_report)
  4. Hard fallback     — minimal static ReportGenerationResult, never empty

Report is GUARANTEED to return meaningful content in every case.
"""

import asyncio
import json

from app.core.ai.base_provider import LLMRequest, LLMMessage
from app.core.ai.orchestrator import get_orchestrator
from app.core.ai.prompt_registry import prompt_registry
from app.core.ai.response_parser import extract_json
from app.core.logging import get_logger
from app.models.schemas.report import ReportGenerationResult

logger = get_logger(__name__)

# Groq rate-limit error fragments to detect
_RATE_LIMIT_SIGNALS = ("rate_limit", "rate limit", "429", "too many requests", "ratelimit")

_LIGHTWEIGHT_REPORT_PROMPT = """You are a case analyst generating a brief report from witness data.

Transcript:
{transcript}

Key Events ({event_count} total):
{events_snippet}

Conflicts detected: {conflict_count}
Emotional tone: {emotion}

Output ONLY this JSON — no markdown, no preamble:
{{
  "summary": "<2-3 sentence factual summary>",
  "key_events": ["<event 1>", "<event 2>", "<event 3>"],
  "conflicts": [],
  "emotional_analysis": "<1 sentence>",
  "uncertainty_analysis": "<1 sentence>",
  "recommended_next_steps": ["<step 1>", "<step 2>"]
}}"""


def _format_analysis(testimony_analysis: dict | list[dict] | None) -> str:
    """Serialize analysis for prompt — handles single or multi-witness input."""
    if testimony_analysis is None:
        return "{}"
    if isinstance(testimony_analysis, list):
        if not testimony_analysis:
            return "[]"
        parts = []
        for i, analysis in enumerate(testimony_analysis):
            label = f"Witness {chr(65 + i)}"  # A, B, C…
            parts.append(f"{label}:\n{json.dumps(analysis, indent=2)}")
        return "\n\n".join(parts)
    return json.dumps(testimony_analysis, indent=2)


def _is_rate_limit(exc: Exception) -> bool:
    """Detect Groq / HTTP 429 rate-limit errors by message inspection."""
    msg = str(exc).lower()
    return any(sig in msg for sig in _RATE_LIMIT_SIGNALS)


def _safe_parse(raw: str) -> ReportGenerationResult | None:
    """Try to parse + validate a JSON string. Returns None on any failure."""
    try:
        parsed = extract_json(raw)
        if isinstance(parsed, dict) and parsed.get("summary"):
            return ReportGenerationResult.model_validate(parsed)
    except Exception:
        pass
    return None


def _build_lightweight_prompt(
    transcript: str,
    events: list[dict],
    conflicts: dict,
    testimony_analysis: dict | list[dict] | None,
) -> str:
    """Build a stripped-down prompt for the fast LLM fallback."""
    # Grab the top 5 event descriptions only — avoids token overflow on fast model
    top_events = [e.get("description", "") for e in events[:5] if e.get("description")]

    # Detect emotion from analysis
    if isinstance(testimony_analysis, list) and testimony_analysis:
        emotion = testimony_analysis[0].get("emotion", "unknown")
    elif isinstance(testimony_analysis, dict):
        emotion = testimony_analysis.get("emotion", "unknown")
    else:
        emotion = "unknown"

    return _LIGHTWEIGHT_REPORT_PROMPT.format(
        transcript=transcript[:800],   # cap to ~200 tokens
        event_count=len(events),
        events_snippet="\n".join(f"- {e}" for e in top_events) or "No events extracted.",
        conflict_count=conflicts.get("conflict_count", 0),
        emotion=emotion,
    )


async def generate_final_report(
    transcript: str,
    testimony_analysis: dict | list[dict],
    events: list[dict],
    timeline: dict,
    conflicts: dict,
    mode: str = "investigator",
) -> ReportGenerationResult:
    """
    Synthesize all pipeline artifacts into a final investigation report.

    Execution order:
      1. Primary LLM (full prompt)
      2. On rate-limit: sleep 2 s, retry once on primary
      3. On any remaining failure: lightweight prompt on FAST LLM
      4. Hard fallback: non-empty static result

    Args:
        testimony_analysis: Single-witness dict OR list of per-witness dicts.
        mode:               "survivor" (supportive) or "investigator" (analytical).
    """
    orchestrator = get_orchestrator()
    multi = isinstance(testimony_analysis, list)

    # ── Build the full primary prompt ─────────────────────────────────────────
    full_prompt = prompt_registry.render(
        "report_generation",
        transcript=transcript,
        testimony_analysis=_format_analysis(testimony_analysis),
        events=json.dumps(events, indent=2),
        timeline=json.dumps(timeline, indent=2),
        conflicts=json.dumps(conflicts, indent=2),
        mode=mode,
    )

    primary_request = LLMRequest(
        messages=[LLMMessage(role="user", content=full_prompt)],
        temperature=0.3,
        max_tokens=2500,
    )

    logger.debug("Report generation — primary attempt", mode=mode, multi_witness=multi)

    # ── Attempt 1: Primary LLM ────────────────────────────────────────────────
    last_exc: Exception | None = None
    for attempt in range(2):  # attempt 0 = first try, attempt 1 = retry after rate-limit
        if attempt == 1:
            logger.warning(
                "Report generation — primary rate-limited, sleeping 2 s then retrying",
                mode=mode,
            )
            await asyncio.sleep(2.0)

        try:
            response = await orchestrator.complete(
                primary_request,
                task_name="report_generation",
            )
            raw = response.content or "{}"
            result = _safe_parse(raw)
            if result is not None:
                logger.info(
                    "Report generation successful (primary LLM)",
                    mode=mode,
                    multi_witness=multi,
                    attempt=attempt,
                    event_count=len(result.key_events),
                    conflict_count=len(result.conflicts),
                )
                return result

            logger.warning(
                "Report primary LLM returned unparseable content",
                attempt=attempt,
                raw_snippet=raw[:200],
            )
            # Treat bad JSON like a transient failure — let lightweight take over
            break

        except Exception as exc:
            last_exc = exc
            if _is_rate_limit(exc) and attempt == 0:
                # Only retry once on rate-limit; all other errors fall through
                continue
            logger.warning(
                "Report generation primary failed",
                attempt=attempt,
                error=str(exc),
            )
            break

    # ── Attempt 2: Lightweight prompt on FAST LLM ─────────────────────────────
    logger.warning(
        "Report generation — falling back to lightweight fast-LLM report",
        mode=mode,
        last_error=str(last_exc) if last_exc else "bad JSON",
    )

    lightweight_prompt = _build_lightweight_prompt(
        transcript, events, conflicts, testimony_analysis
    )
    fast_request = LLMRequest(
        messages=[LLMMessage(role="user", content=lightweight_prompt)],
        temperature=0.1,
        max_tokens=800,
    )

    try:
        fast_response = await orchestrator.complete(
            fast_request,
            # Prefix starts with "testimony_summary" → routed to fast LLM by orchestrator
            task_name="testimony_summary_report",
        )
        raw_fast = fast_response.content or "{}"
        result_fast = _safe_parse(raw_fast)
        if result_fast is not None:
            logger.info(
                "Report generation successful (lightweight fast LLM)",
                mode=mode,
                multi_witness=multi,
            )
            return result_fast

        logger.warning("Lightweight report also returned unparseable JSON", raw_snippet=raw_fast[:200])

    except Exception as fast_exc:
        logger.error("Lightweight report generation failed", error=str(fast_exc))

    # ── Hard fallback: never return an empty structure ─────────────────────────
    logger.error(
        "Report generation fully failed — returning enriched static fallback",
        mode=mode,
        event_count=len(events),
    )
    return _enriched_fallback(events, conflicts, testimony_analysis)


def _enriched_fallback(
    events: list[dict],
    conflicts: dict,
    testimony_analysis: dict | list[dict] | None,
) -> ReportGenerationResult:
    """
    Build a meaningful fallback from raw pipeline data — never empty.
    Uses extracted events and conflict counts to produce a real summary.
    """
    top_events = [
        e.get("description", "")
        for e in events[:5]
        if e.get("description")
    ]

    conflict_count = conflicts.get("conflict_count", 0)
    has_conflicts = conflicts.get("has_conflicts", False)

    if isinstance(testimony_analysis, list) and testimony_analysis:
        emotion = testimony_analysis[0].get("emotion", "unknown")
    elif isinstance(testimony_analysis, dict):
        emotion = testimony_analysis.get("emotion", "unknown")
    else:
        emotion = "unknown"

    summary_parts = []
    if top_events:
        summary_parts.append(
            f"The testimony describes {len(events)} event(s), including: "
            + "; ".join(top_events[:3]) + "."
        )
    else:
        summary_parts.append("No events were clearly extracted from the testimony.")

    if has_conflicts:
        summary_parts.append(
            f"{conflict_count} conflict(s) were detected across witness accounts."
        )

    summary = " ".join(summary_parts) or "Testimony received but report synthesis was unavailable."

    return ReportGenerationResult(
        summary=summary,
        key_events=top_events or ["No events extracted — review raw transcript."],
        conflicts=[],
        emotional_analysis=f"Witness emotional tone detected as: {emotion}.",
        uncertainty_analysis="Full uncertainty analysis unavailable — review testimony_analysis field.",
        recommended_next_steps=[
            "Manually review the extracted events and timeline.",
            "Re-run the pipeline if the LLM API was temporarily unavailable.",
        ],
    )
