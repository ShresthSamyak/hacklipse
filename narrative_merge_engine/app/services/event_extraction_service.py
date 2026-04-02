"""
Event Extraction Service — Core Intelligence Layer
====================================================

This is the most critical service in the Narrative Merge Engine.  It converts
raw, fragmented, potentially multilingual human testimony into structured
events with explicit uncertainty tracking.

Architecture:
  ┌──────────────────────┐
  │   Raw Testimony Text │
  └──────────┬───────────┘
             │
    ┌────────▼────────┐
    │  Pre-processing  │  Normalise whitespace, detect language, chunk long texts
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │  LLM Extraction  │  v2 prompt → Orchestrator → Provider (retry + log)
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │  Response Parse   │  4-strategy JSON extraction + JSON sanitisation
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │  Validation       │  Per-event Pydantic validation — drop bad, keep good
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │  Post-processing  │  Dedup, source_text verification, confidence recalibration
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │  Persist + Return │  ORM write → ExtractionResult
    └────────┘────────┘

Production considerations:
  - The service never crashes on bad LLM output — it degrades gracefully.
  - Every event is individually validated; bad events are dropped, not
    the whole batch.
  - Source text is verified against the original testimony (fuzzy match).
  - Long testimonies are chunked with overlap to avoid truncation.
  - Full structured logging at every stage for observability.
  - The LLM call has its own retry (in orchestrator) + additional
    service-level retry for validation failures (re-prompt the LLM).
"""

from __future__ import annotations

import hashlib
import re
import time
import unicodedata
import uuid
from difflib import SequenceMatcher
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ai.base_provider import LLMMessage, LLMRequest
from app.core.ai.orchestrator import LLMOrchestrator
from app.core.ai.prompt_registry import prompt_registry
from app.core.ai.response_parser import extract_json_array, validate_events
from app.core.exceptions import NotFoundError, ValidationError
from app.core.logging import get_logger
from app.models.orm.event import Event, EventConfidence
from app.models.schemas.entities import EventRead
from app.models.schemas.event_extraction import (
    ExtractedEvent,
    ExtractionResult,
    UncertaintyType,
)
from app.repositories.entity_repos import EventRepository
from app.repositories.testimony_repo import TestimonyRepository

logger = get_logger(__name__)

# ─── Configuration ───────────────────────────────────────────────────────────

# Maximum testimony length (chars) before chunking kicks in
_MAX_SINGLE_PROMPT_LENGTH = 6000

# Chunk size and overlap for long testimonies
_CHUNK_SIZE = 4000
_CHUNK_OVERLAP = 500

# Minimum fuzzy match ratio for source_text verification
_SOURCE_TEXT_MIN_SIMILARITY = 0.5

# Maximum validation retry attempts (re-prompt the LLM if output is garbage)
_MAX_VALIDATION_RETRIES = 2

# Minimum number of events expected (below this → suspicious LLM output)
_MIN_EXPECTED_EVENTS = 1

# Maximum allowed drop ratio before we retry
_MAX_DROP_RATIO = 0.6


# ─── Text Pre-processing ────────────────────────────────────────────────────

def _normalise_text(text: str) -> str:
    """
    Normalise raw testimony text for consistent LLM processing.
    Does NOT alter semantic content.
    """
    # Unicode normalisation (NFC: composed form)
    text = unicodedata.normalize("NFC", text)

    # Collapse multiple whitespace/newlines into single spaces
    text = re.sub(r"\s+", " ", text)

    # Strip leading/trailing whitespace
    text = text.strip()

    # Remove zero-width characters
    text = re.sub(r"[\u200b\u200c\u200d\ufeff]", "", text)

    return text


def _chunk_testimony(text: str) -> list[str]:
    """
    Split long testimony into overlapping chunks for separate LLM calls.
    Each chunk is self-contained enough for event extraction.

    Strategy: split on sentence boundaries within chunk size limits,
    with overlap so events spanning chunk boundaries aren't lost.
    """
    if len(text) <= _MAX_SINGLE_PROMPT_LENGTH:
        return [text]

    # Split on sentence-ending punctuation (. ! ? | or Devanagari danda)
    sentences = re.split(r"(?<=[.!?|।])\s+", text)

    chunks: list[str] = []
    current_chunk: list[str] = []
    current_length = 0

    for sentence in sentences:
        if current_length + len(sentence) > _CHUNK_SIZE and current_chunk:
            chunk_text = " ".join(current_chunk)
            chunks.append(chunk_text)

            # Overlap: keep last N characters worth of sentences
            overlap_sentences: list[str] = []
            overlap_length = 0
            for s in reversed(current_chunk):
                if overlap_length + len(s) > _CHUNK_OVERLAP:
                    break
                overlap_sentences.insert(0, s)
                overlap_length += len(s)

            current_chunk = overlap_sentences
            current_length = overlap_length

        current_chunk.append(sentence)
        current_length += len(sentence)

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    logger.info(
        "Testimony chunked",
        original_length=len(text),
        chunk_count=len(chunks),
        chunk_sizes=[len(c) for c in chunks],
    )
    return chunks


# ─── Post-processing ────────────────────────────────────────────────────────

def _verify_source_text(event: ExtractedEvent, original_text: str) -> ExtractedEvent:
    """
    Check that event.source_text actually appears in (or closely matches)
    the original testimony.  If not, attempt fuzzy recovery.

    This prevents the LLM from fabricating source attributions.
    """
    source = event.source_text.strip()
    normalised_original = original_text.lower().strip()
    normalised_source = source.lower().strip()

    # Exact substring match (case-insensitive)
    if normalised_source in normalised_original:
        return event

    # Fuzzy match — find the best matching substring
    best_ratio = 0.0
    best_match = source

    # Slide a window of similar length across the original
    window_size = len(source)
    for i in range(0, max(1, len(normalised_original) - window_size + 1)):
        window = normalised_original[i : i + window_size + 20]  # slight padding
        ratio = SequenceMatcher(None, normalised_source, window).ratio()
        if ratio > best_ratio:
            best_ratio = ratio
            # Use the ORIGINAL casing from the testimony
            best_match = original_text[i : i + len(window)].strip()

    if best_ratio >= _SOURCE_TEXT_MIN_SIMILARITY:
        if best_ratio < 1.0:
            logger.debug(
                "Source text fuzzy-matched",
                original_source=source[:80],
                matched_source=best_match[:80],
                similarity=round(best_ratio, 3),
            )
        event.source_text = best_match
    else:
        # Cannot verify — penalise confidence
        logger.warning(
            "Source text verification failed",
            source_text=source[:80],
            best_similarity=round(best_ratio, 3),
        )
        event.confidence = max(0.1, event.confidence * 0.6)

    return event


def _deduplicate_events(events: list[ExtractedEvent]) -> list[ExtractedEvent]:
    """
    Remove near-duplicate events (same source_text and description).
    Keeps the event with higher confidence.
    """
    if len(events) <= 1:
        return events

    seen_hashes: dict[str, ExtractedEvent] = {}

    for event in events:
        # Hash on normalised description + source_text
        key = hashlib.md5(
            (event.description.lower().strip() + "|" + event.source_text.lower().strip()).encode()
        ).hexdigest()

        if key in seen_hashes:
            existing = seen_hashes[key]
            if event.confidence > existing.confidence:
                seen_hashes[key] = event
                logger.debug("Duplicate replaced (higher confidence)", event_id=event.id)
            else:
                logger.debug("Duplicate dropped", event_id=event.id)
        else:
            seen_hashes[key] = event

    deduped = list(seen_hashes.values())
    if len(deduped) < len(events):
        logger.info(
            "Events deduplicated",
            before=len(events),
            after=len(deduped),
            dropped=len(events) - len(deduped),
        )
    return deduped


def _recalibrate_confidence(events: list[ExtractedEvent]) -> list[ExtractedEvent]:
    """
    Post-hoc confidence adjustment based on extraction context.

    Rules:
      - Events with missing time AND missing location get a penalty.
      - Events with very short descriptions (<15 chars) get a penalty.
      - Events with verified source_text get a slight boost.
    """
    for event in events:
        # Short description penalty
        if len(event.description) < 15:
            event.confidence = max(0.1, event.confidence * 0.8)

        # No temporal or spatial grounding
        if event.time is None and event.location is None:
            event.confidence = max(0.1, event.confidence * 0.85)

        # Very uncertain events shouldn't have high confidence
        if event.uncertainty_type == UncertaintyType.CONFLICTING:
            event.confidence = min(event.confidence, 0.4)

        # Clamp final value
        event.confidence = round(max(0.0, min(1.0, event.confidence)), 3)

    return events


# ─── Confidence mapping for ORM persistence ──────────────────────────────────

def _float_to_event_confidence(score: float) -> EventConfidence:
    """Map continuous [0,1] score to the ORM's 3-bucket enum."""
    if score >= 0.7:
        return EventConfidence.HIGH
    elif score >= 0.4:
        return EventConfidence.MEDIUM
    else:
        return EventConfidence.LOW


# ============================================================================
# Main Service
# ============================================================================

class EventExtractionService:
    """
    Core intelligence service: testimony text → structured events.

    This service:
      1. Pre-processes and optionally chunks the input.
      2. Calls the LLM with the v2 event extraction prompt.
      3. Parses the JSON response with 4-strategy fallback.
      4. Validates each event individually (drops bad ones).
      5. Verifies source_text provenance against the original.
      6. Deduplicates and recalibrates confidence.
      7. Persists valid events to the database.
      8. Returns a typed ExtractionResult with full metadata.
    """

    def __init__(self, db: AsyncSession, llm: LLMOrchestrator) -> None:
        self.event_repo = EventRepository(db)
        self.testimony_repo = TestimonyRepository(db)
        self.llm = llm

    # ── Public API ───────────────────────────────────────────────────────────

    async def extract_events(self, testimony_id: uuid.UUID) -> ExtractionResult:
        """
        Full extraction pipeline for a single testimony.

        Returns an ExtractionResult with:
          - events: list[ExtractedEvent]
          - dropped_event_count: how many events failed validation
          - extraction_metadata: model, tokens, latency, etc.
        """
        start_time = time.monotonic()

        testimony = await self.testimony_repo.get_by_id(testimony_id)
        if not testimony:
            raise NotFoundError(f"Testimony {testimony_id} not found")

        logger.info(
            "Event extraction started",
            testimony_id=str(testimony_id),
            raw_text_length=len(testimony.raw_text),
        )

        # ── 1. Pre-process ───────────────────────────────────────────────
        normalised_text = _normalise_text(testimony.raw_text)
        chunks = _chunk_testimony(normalised_text)

        # ── 2. Extract from each chunk ───────────────────────────────────
        all_events: list[ExtractedEvent] = []
        total_raw_count = 0
        total_dropped_count = 0
        chunk_metadata: list[dict[str, Any]] = []

        for chunk_index, chunk_text in enumerate(chunks):
            events, raw_count, dropped, meta = await self._extract_from_chunk(
                chunk_text=chunk_text,
                original_full_text=normalised_text,
                chunk_index=chunk_index,
                total_chunks=len(chunks),
            )
            all_events.extend(events)
            total_raw_count += raw_count
            total_dropped_count += dropped
            chunk_metadata.append(meta)

        # ── 3. Cross-chunk post-processing ───────────────────────────────
        all_events = _deduplicate_events(all_events)
        all_events = _recalibrate_confidence(all_events)

        # ── 4. Persist to database ───────────────────────────────────────
        persisted_events = await self._persist_events(
            events=all_events,
            testimony_id=testimony_id,
        )

        elapsed_ms = round((time.monotonic() - start_time) * 1000, 1)

        logger.info(
            "Event extraction completed",
            testimony_id=str(testimony_id),
            events_extracted=len(all_events),
            events_persisted=len(persisted_events),
            raw_count=total_raw_count,
            dropped_count=total_dropped_count,
            elapsed_ms=elapsed_ms,
        )

        return ExtractionResult(
            events=all_events,
            testimony_id=str(testimony_id),
            raw_event_count=total_raw_count,
            dropped_event_count=total_dropped_count,
            extraction_metadata={
                "elapsed_ms": elapsed_ms,
                "chunks_processed": len(chunks),
                "chunk_details": chunk_metadata,
                "text_length_original": len(testimony.raw_text),
                "text_length_normalised": len(normalised_text),
            },
        )

    async def extract_events_from_text(self, text: str) -> ExtractionResult:
        """
        Extract events from raw text WITHOUT persisting to DB.
        Useful for previewing / testing the extraction pipeline.
        """
        start_time = time.monotonic()

        normalised_text = _normalise_text(text)
        chunks = _chunk_testimony(normalised_text)

        all_events: list[ExtractedEvent] = []
        total_raw_count = 0
        total_dropped_count = 0

        for chunk_index, chunk_text in enumerate(chunks):
            events, raw_count, dropped, _ = await self._extract_from_chunk(
                chunk_text=chunk_text,
                original_full_text=normalised_text,
                chunk_index=chunk_index,
                total_chunks=len(chunks),
            )
            all_events.extend(events)
            total_raw_count += raw_count
            total_dropped_count += dropped

        all_events = _deduplicate_events(all_events)
        all_events = _recalibrate_confidence(all_events)

        elapsed_ms = round((time.monotonic() - start_time) * 1000, 1)

        return ExtractionResult(
            events=all_events,
            raw_event_count=total_raw_count,
            dropped_event_count=total_dropped_count,
            extraction_metadata={
                "elapsed_ms": elapsed_ms,
                "chunks_processed": len(chunks),
                "text_length_normalised": len(normalised_text),
            },
        )

    async def list_events(self, testimony_id: uuid.UUID) -> list[EventRead]:
        """List all previously extracted events for a testimony."""
        events = await self.event_repo.get_by_testimony(testimony_id)
        return [EventRead.model_validate(e) for e in events]

    async def get_event(self, event_id: uuid.UUID) -> EventRead:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundError(f"Event {event_id} not found")
        return EventRead.model_validate(event)

    # ── Internal extraction pipeline ─────────────────────────────────────────

    async def _extract_from_chunk(
        self,
        *,
        chunk_text: str,
        original_full_text: str,
        chunk_index: int,
        total_chunks: int,
    ) -> tuple[list[ExtractedEvent], int, int, dict[str, Any]]:
        """
        Extract events from a single text chunk.

        Returns:
            (valid_events, raw_count, dropped_count, metadata)

        Includes service-level retry: if >60% of events fail validation,
        we re-prompt the LLM with a more explicit instruction.
        """
        meta: dict[str, Any] = {
            "chunk_index": chunk_index,
            "chunk_length": len(chunk_text),
        }

        for attempt in range(_MAX_VALIDATION_RETRIES + 1):
            try:
                events, raw_count, dropped_count, llm_meta = await self._llm_extract(
                    chunk_text=chunk_text,
                    original_full_text=original_full_text,
                    is_retry=attempt > 0,
                )

                meta.update(llm_meta)
                meta["attempts"] = attempt + 1

                # Check if too many events were dropped
                if raw_count > 0 and dropped_count / raw_count > _MAX_DROP_RATIO:
                    if attempt < _MAX_VALIDATION_RETRIES:
                        logger.warning(
                            "High drop ratio — retrying extraction",
                            attempt=attempt + 1,
                            raw_count=raw_count,
                            dropped_count=dropped_count,
                            drop_ratio=round(dropped_count / raw_count, 2),
                        )
                        continue

                return events, raw_count, dropped_count, meta

            except ValidationError as exc:
                if attempt < _MAX_VALIDATION_RETRIES:
                    logger.warning(
                        "Extraction validation failed — retrying",
                        attempt=attempt + 1,
                        error=str(exc),
                    )
                    continue
                # Final attempt — return empty with error
                logger.error(
                    "Extraction failed after all retries",
                    chunk_index=chunk_index,
                    error=str(exc),
                )
                meta["error"] = str(exc)
                return [], 0, 0, meta

        # Unreachable, but makes type-checker happy
        return [], 0, 0, meta

    async def _llm_extract(
        self,
        *,
        chunk_text: str,
        original_full_text: str,
        is_retry: bool,
    ) -> tuple[list[ExtractedEvent], int, int, dict[str, Any]]:
        """
        Single LLM call → parse → validate → post-process.

        Returns:
            (valid_events, raw_count, dropped_count, metadata)
        """
        # ── Build prompt ─────────────────────────────────────────────────
        prompt_key = "event_extraction_v2"
        user_prompt = prompt_registry.render(prompt_key, testimony_text=chunk_text)
        system_prompt = prompt_registry.get_system_prompt(prompt_key)

        if is_retry:
            # On retry, add an explicit instruction to be more careful
            user_prompt += (
                "\n\n⚠️ IMPORTANT: Your previous response contained invalid JSON "
                "or events that failed schema validation. Please be very careful to:\n"
                "1. Return ONLY a valid JSON array\n"
                "2. Ensure every event has all required fields\n"
                "3. Use the exact schema specified above\n"
                "4. Ensure source_text is a verbatim quote from the testimony"
            )

        messages: list[LLMMessage] = []
        if system_prompt:
            messages.append(LLMMessage(role="system", content=system_prompt))
        messages.append(LLMMessage(role="user", content=user_prompt))

        request = LLMRequest(
            messages=messages,
            temperature=0.05,  # near-deterministic; tiny temp for natural phrasing
            max_tokens=4096,
        )

        # ── Call LLM ─────────────────────────────────────────────────────
        response = await self.llm.complete(request, task_name="event_extraction_v2")

        meta: dict[str, Any] = {
            "model": response.model,
            "usage": response.usage,
            "is_retry": is_retry,
        }

        # ── Parse JSON ───────────────────────────────────────────────────
        raw_events = extract_json_array(response.content)
        raw_count = len(raw_events)

        logger.info(
            "LLM returned raw events",
            raw_count=raw_count,
            response_length=len(response.content),
        )

        # ── Validate ─────────────────────────────────────────────────────
        valid_events, dropped_details = validate_events(raw_events, ExtractedEvent)
        dropped_count = len(dropped_details)

        if dropped_details:
            logger.warning(
                "Events dropped during validation",
                dropped_count=dropped_count,
                total_raw=raw_count,
                dropped_previews=[d["raw"].get("description", "?")[:50] for d in dropped_details[:5]],
            )

        meta["raw_event_count"] = raw_count
        meta["dropped_count"] = dropped_count

        # ── Post-process: verify source text ─────────────────────────────
        verified_events: list[ExtractedEvent] = []
        for event in valid_events:
            event = _verify_source_text(event, original_full_text)
            verified_events.append(event)

        return verified_events, raw_count, dropped_count, meta

    # ── Persistence ──────────────────────────────────────────────────────────

    async def _persist_events(
        self,
        events: list[ExtractedEvent],
        testimony_id: uuid.UUID,
    ) -> list[Event]:
        """
        Convert ExtractedEvent (intelligence layer) → ORM Event (data layer)
        and persist to the database.
        """
        created: list[Event] = []

        for extracted in events:
            orm_event = Event(
                testimony_id=testimony_id,
                description=extracted.description,
                timestamp_hint=extracted.time,
                resolved_timestamp=None,  # downstream timeline service fills this
                location=extracted.location,
                participants=extracted.actors,
                confidence=_float_to_event_confidence(extracted.confidence),
                meta={
                    "source_text": extracted.source_text,
                    "time_uncertainty": extracted.time_uncertainty,
                    "uncertainty_type": extracted.uncertainty_type.value,
                    "confidence_raw": extracted.confidence,
                    "extraction_id": extracted.id,
                },
            )
            orm_event = await self.event_repo.create(orm_event)
            created.append(orm_event)

        return created
