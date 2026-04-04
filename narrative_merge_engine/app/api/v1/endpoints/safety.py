"""
Safety evaluation endpoint — /api/v1/safety

Exposes the safety evaluation layer as a standalone REST endpoint
so the frontend can optionally pre-screen inputs before sending them
through the full pipeline.
"""

from __future__ import annotations

from fastapi import APIRouter, status
from pydantic import BaseModel, Field

from app.api.deps import CurrentUser
from app.services.safety_evaluation_service import (
    SafetyCategory,
    evaluate_and_rewrite,
    evaluate_safety,
)

router = APIRouter(prefix="/safety", tags=["Safety Evaluation"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class SafetyEvalRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Text to evaluate.")


class SafetyEvalResponse(BaseModel):
    safe: bool
    category: str  # "safe" | "risky" | "blocked"
    reason: str
    rewritten_text: str | None = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post(
    "/evaluate",
    response_model=SafetyEvalResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate text safety for legal AI context",
    description=(
        "Runs the input text through the safety evaluation layer and returns "
        "a classification (safe / risky / blocked) with an explanation. "
        "Exploitative inputs that can be salvaged are automatically rewritten."
    ),
)
async def evaluate_text_safety(
    body: SafetyEvalRequest,
    _user: CurrentUser,
) -> SafetyEvalResponse:
    """
    Screen input text for harmful intent, illegal guidance,
    exploitation attempts, or victim manipulation.
    """
    result, rewritten = evaluate_and_rewrite(body.text)

    return SafetyEvalResponse(
        safe=result.safe,
        category=result.category.value,
        reason=result.reason,
        rewritten_text=rewritten if rewritten != body.text else None,
    )
