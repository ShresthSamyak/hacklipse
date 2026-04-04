import json
from typing import Any

from app.core.ai.base_provider import LLMRequest, LLMMessage
from app.core.ai.orchestrator import get_orchestrator
from app.core.ai.prompt_registry import prompt_registry
from app.core.ai.response_parser import extract_json
from app.core.logging import get_logger
from app.models.schemas.report import ReportGenerationResult

logger = get_logger(__name__)


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


async def generate_final_report(
    transcript: str,
    testimony_analysis: dict | list[dict],
    events: list[dict],
    timeline: dict,
    conflicts: dict,
    mode: str = "investigator",
) -> ReportGenerationResult:
    """
    Synthesize all pipeline artifacts into a final cohesive investigation report.
    Uses the PRIMARY LLM because it requires sophisticated reasoning and synthesis.

    Args:
        testimony_analysis: Single-witness dict OR list of per-witness dicts.
        mode:               "survivor" (soft, supportive) or "investigator" (analytical).
    """
    orchestrator = get_orchestrator()

    prompt = prompt_registry.render(
        "report_generation",
        transcript=transcript,
        testimony_analysis=_format_analysis(testimony_analysis),
        events=json.dumps(events, indent=2),
        timeline=json.dumps(timeline, indent=2),
        conflicts=json.dumps(conflicts, indent=2),
        mode=mode,
    )

    request = LLMRequest(
        messages=[LLMMessage(role="user", content=prompt)],
        temperature=0.3,
        max_tokens=2500,
    )

    multi = isinstance(testimony_analysis, list)
    logger.debug("Executing final report generation", mode=mode, multi_witness=multi)

    try:
        response = await orchestrator.complete(
            request,
            task_name="report_generation",
        )

        raw_content = response.content or "{}"
        parsed_json = extract_json(raw_content)
        result = ReportGenerationResult.model_validate(parsed_json)

        logger.info(
            "Report generation successful",
            mode=mode,
            multi_witness=multi,
            event_count=len(result.key_events),
            conflict_count=len(result.conflicts),
        )
        return result

    except Exception as exc:
        logger.error(
            "Report generation failed, falling back to minimal report",
            error=str(exc),
        )
        return ReportGenerationResult.fallback()
