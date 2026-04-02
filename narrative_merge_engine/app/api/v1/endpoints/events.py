"""
Event extraction endpoints.

Exposes:
  - POST /events/testimonies/{id}/extract  → full pipeline (load testimony → extract → persist)
  - POST /events/extract-preview           → extract from raw text (no DB persistence)
  - GET  /events/testimonies/{id}          → list persisted events
  - GET  /events/{id}                      → get single persisted event
"""

import uuid

from fastapi import APIRouter, status
from pydantic import BaseModel, Field

from app.api.deps import CurrentUser, EventSvc
from app.models.schemas.entities import EventRead
from app.models.schemas.event_extraction import ExtractionResult

router = APIRouter(prefix="/events", tags=["Events"])


# ── Request schemas ──────────────────────────────────────────────────────────

class ExtractPreviewRequest(BaseModel):
    """Request body for the preview extraction endpoint."""
    text: str = Field(
        ...,
        min_length=10,
        description="Raw testimony text to extract events from (no persistence).",
        examples=[
            "I think I entered around night... maybe 9 or 10... "
            "there was someone near the table... I heard a noise later"
        ],
    )


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post(
    "/testimonies/{testimony_id}/extract",
    response_model=ExtractionResult,
    status_code=status.HTTP_201_CREATED,
    summary="Extract events from a persisted testimony",
    description=(
        "Loads a testimony from the database, runs the full extraction pipeline "
        "(LLM call → parse → validate → deduplicate → persist), and returns "
        "structured events with confidence scores and uncertainty tracking."
    ),
)
async def extract_events(
    testimony_id: uuid.UUID,
    svc: EventSvc,
    _user: CurrentUser,
) -> ExtractionResult:
    return await svc.extract_events(testimony_id)


@router.post(
    "/extract-preview",
    response_model=ExtractionResult,
    status_code=status.HTTP_200_OK,
    summary="Preview event extraction from raw text (no persistence)",
    description=(
        "Runs the extraction pipeline on raw text without loading from or "
        "writing to the database.  Useful for testing, previewing, and "
        "fine-tuning extraction before committing."
    ),
)
async def extract_preview(
    payload: ExtractPreviewRequest,
    svc: EventSvc,
    _user: CurrentUser,
) -> ExtractionResult:
    return await svc.extract_events_from_text(payload.text)


@router.get(
    "/testimonies/{testimony_id}",
    response_model=list[EventRead],
    summary="List events for a testimony",
)
async def list_events(
    testimony_id: uuid.UUID,
    svc: EventSvc,
    _user: CurrentUser,
) -> list[EventRead]:
    return await svc.list_events(testimony_id)


@router.get("/{event_id}", response_model=EventRead, summary="Get a single event")
async def get_event(
    event_id: uuid.UUID,
    svc: EventSvc,
    _user: CurrentUser,
) -> EventRead:
    return await svc.get_event(event_id)
