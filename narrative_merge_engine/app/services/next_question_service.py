"""
Next Question Service — lightweight, in-memory question generation.

Generates exactly ONE high-priority clarifying question from pipeline data.
No database dependency. Designed for sub-3s execution on the fast LLM.

Supports both single-witness (dict) and multi-witness (list[dict]) analysis input.
"""

import json
from string import Template

from app.core.ai.base_provider import LLMMessage, LLMRequest
from app.core.ai.orchestrator import get_orchestrator
from app.core.ai.response_parser import extract_json
from app.core.logging import get_logger

logger = get_logger(__name__)

_NEXT_QUESTION_PROMPT = """You are an expert investigator reviewing testimony analysis data.

Based on the conflicts, uncertain events, and emotional analysis below, generate EXACTLY ONE clarifying question that would most effectively advance the investigation.

INPUT DATA:

1. Conflicts Detected:
$conflicts

2. Uncertain Events:
$uncertain_events

3. Witness Analyses:
$testimony_analysis

TASK:
Identify the single most impactful question an investigator should ask next.

STRICT REQUIREMENTS:
- Return ONLY a valid JSON object. No preamble, no markdown fences.
- The question must target the biggest gap, contradiction, or uncertainty.
- Be specific — reference event details, times, or locations where possible.
- If multiple witnesses are present, prefer questions that resolve cross-witness conflicts.

JSON SCHEMA:
{
  "question": "The clarifying question to ask the witness or investigate further.",
  "reason": "Why this question matters — what gap or conflict it resolves.",
  "priority": "low | medium | high",
  "target_event_ids": ["Optional list of event IDs this question relates to"]
}
"""


def _format_analysis(testimony_analysis: dict | list[dict] | None) -> str:
    """Serialize analysis for prompt — handles single or multi-witness input."""
    if testimony_analysis is None:
        return "{}"
    if isinstance(testimony_analysis, list):
        if not testimony_analysis:
            return "[]"
        # Format as labeled blocks when multiple witnesses
        parts = []
        for i, analysis in enumerate(testimony_analysis):
            label = f"Witness {chr(65 + i)}"  # A, B, C…
            parts.append(f"{label}:\n{json.dumps(analysis, indent=2)}")
        return "\n\n".join(parts)
    return json.dumps(testimony_analysis, indent=2)


async def generate_next_question(
    conflicts: dict,
    events: list[dict],
    testimony_analysis: dict | list[dict] | None = None,
) -> dict | None:
    """
    Generate exactly one high-priority clarifying question from in-memory data.

    Args:
        conflicts:         StrictConflictResult dict from conflict detection stage.
        events:            All extracted events (may include witness_id per event).
        testimony_analysis: Single-witness dict OR list of per-witness dicts.

    Returns a dict with {question, reason, priority, target_event_ids}
    or None on failure. Never raises.
    """
    orchestrator = get_orchestrator()

    # Extract uncertain events from the events list
    uncertain_events = [
        e for e in events
        if e.get("confidence", 1.0) < 0.6
        or e.get("time_uncertainty") not in (None, "", "none")
    ]

    prompt = Template(_NEXT_QUESTION_PROMPT).safe_substitute(
        conflicts=json.dumps(conflicts, indent=2),
        uncertain_events=json.dumps(uncertain_events, indent=2),
        testimony_analysis=_format_analysis(testimony_analysis),
    )

    request = LLMRequest(
        messages=[LLMMessage(role="user", content=prompt)],
        temperature=0.2,
        max_tokens=500,
    )

    try:
        response = await orchestrator.complete(
            request,
            task_name="next_question",
        )

        raw = response.content or "{}"
        parsed = extract_json(raw)

        # Validate minimal structure
        if isinstance(parsed, dict) and "question" in parsed:
            result = {
                "question": str(parsed["question"]),
                "reason": str(parsed.get("reason", "")),
                "priority": str(parsed.get("priority", "medium")),
                "target_event_ids": parsed.get("target_event_ids", []),
            }
            logger.info(
                "Next question generated",
                priority=result["priority"],
                multi_witness=isinstance(testimony_analysis, list),
            )
            return result

        logger.warning("Next question response missing 'question' key", parsed=str(parsed)[:200])
        return None

    except Exception as exc:
        logger.error("Next question generation failed", error=str(exc))
        return None
