from typing import Any

from app.core.ai.base_provider import LLMRequest, LLMMessage
from app.core.ai.orchestrator import get_orchestrator
from app.core.ai.prompt_registry import prompt_registry
from app.core.ai.response_parser import extract_json
from app.core.logging import get_logger
from app.models.schemas.testimony_analysis import TestimonyAnalysisResult

logger = get_logger(__name__)


async def analyze_testimony_sensitivity(transcript: str) -> TestimonyAnalysisResult:
    """
    Extracts emotional and confidence contexts strictly from raw transcription text.
    Uses the fast LLM by default via orchestrator routing rules.
    """
    orchestrator = get_orchestrator()

    prompt = prompt_registry.render(
        "testimony_analysis_v2",
        transcript=transcript,
    )

    request = LLMRequest(
        messages=[LLMMessage(role="user", content=prompt)],
        temperature=0.0,  # Zero-temp to ensure strictly reproducible JSON models
        max_tokens=600,
    )

    logger.debug("Executing high-sensitivity testimony analysis")

    response = await orchestrator.complete(
        request,
        task_name="testimony_analysis_v2",
    )

    # Use the centralized json parser which handles validation and fallback cleanup
    raw_content = response.content or "{}"
    parsed_json = extract_json(raw_content)
    result = TestimonyAnalysisResult.model_validate(parsed_json)

    logger.debug(
        "Testimony analysis complete",
        emotion=result.emotion,
        confidence=result.confidence_level
    )
    return result
