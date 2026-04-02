"""
Tests for the Event Extraction Intelligence Layer.

Covers:
  - Pydantic schema validation (ExtractedEvent)
  - Response parser (all 4 strategies + sanitisation)
  - Service-level extraction logic (mocked LLM)
  - Edge cases: empty input, truncated JSON, multilingual, etc.
"""

from __future__ import annotations

import json
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.ai.base_provider import LLMResponse
from app.core.ai.response_parser import (
    extract_json,
    extract_json_array,
    validate_events,
)
from app.core.exceptions import ValidationError
from app.models.schemas.event_extraction import (
    ExtractedEvent,
    ExtractionResult,
    UncertaintyType,
)


# ============================================================================
# Pydantic Schema Tests
# ============================================================================

class TestExtractedEvent:
    """Tests for the ExtractedEvent Pydantic model."""

    def test_basic_valid_event(self):
        event = ExtractedEvent(
            description="Witness entered the building",
            time="around 9 PM",
            time_uncertainty="Used 'around', indicating approximate time",
            uncertainty_type="approximate",
            location="the building entrance",
            actors=["witness (self)"],
            confidence=0.7,
            source_text="I entered the building around 9 PM",
        )
        assert event.description == "Witness entered the building"
        assert event.confidence == 0.7
        assert event.uncertainty_type == UncertaintyType.APPROXIMATE

    def test_confidence_clamping_from_percentage(self):
        """LLMs sometimes return 75 instead of 0.75."""
        event = ExtractedEvent(
            description="Some event happened clearly",
            confidence=75,
            source_text="Something happened",
        )
        assert event.confidence == 0.75

    def test_confidence_clamping_from_string(self):
        event = ExtractedEvent(
            description="Some event happened clearly",
            confidence="high",
            source_text="Something happened",
        )
        assert event.confidence == 0.8

    def test_confidence_clamping_from_percent_string(self):
        event = ExtractedEvent(
            description="Some event happened clearly",
            confidence="65%",
            source_text="Something happened",
        )
        assert event.confidence == 0.65

    def test_actors_deduplication(self):
        event = ExtractedEvent(
            description="Multiple people were present",
            actors=["John", "john", "JOHN", "Jane"],
            source_text="John and Jane were present",
        )
        assert len(event.actors) == 2
        assert "Jane" in event.actors

    def test_actors_from_string(self):
        event = ExtractedEvent(
            description="A person was present",
            actors="unidentified person",
            source_text="Someone was there",
        )
        assert event.actors == ["unidentified person"]

    def test_uncertainty_type_normalisation(self):
        """Various spellings should normalise to valid enum values."""
        for input_val, expected in [
            ("hedge", UncertaintyType.HEDGED),
            ("hedging", UncertaintyType.HEDGED),
            ("approx", UncertaintyType.APPROXIMATE),
            ("temporal_relative", UncertaintyType.RELATIVE),
            ("absent", UncertaintyType.MISSING),
            ("certain", UncertaintyType.NONE),
            ("exact", UncertaintyType.NONE),
            ("contradictory", UncertaintyType.CONFLICTING),
        ]:
            event = ExtractedEvent(
                description="Test event for normalisation",
                uncertainty_type=input_val,
                time="some time",
                source_text="test source text here",
            )
            assert event.uncertainty_type == expected, f"Failed for {input_val}"

    def test_missing_time_forces_uncertainty_type(self):
        """If time is None, uncertainty_type must be MISSING."""
        event = ExtractedEvent(
            description="Event with no time",
            time=None,
            uncertainty_type="hedged",  # wrong — model_validator should fix
            source_text="no time was mentioned at all",
        )
        assert event.uncertainty_type == UncertaintyType.MISSING

    def test_has_time_but_no_uncertainty_gets_none_type(self):
        """If time is set but no uncertainty explanation, type should be NONE."""
        event = ExtractedEvent(
            description="Event with clear time",
            time="exactly 3 PM",
            time_uncertainty=None,
            uncertainty_type="missing",  # wrong — validator should fix
            source_text="It happened at exactly 3 PM",
        )
        assert event.uncertainty_type == UncertaintyType.NONE

    def test_minimum_description_length(self):
        with pytest.raises(Exception):  # Pydantic ValidationError
            ExtractedEvent(
                description="Hi",  # too short — min 5 chars
                source_text="some source text here",
            )

    def test_auto_generated_id(self):
        event = ExtractedEvent(
            description="Event without explicit ID",
            source_text="source text for this event",
        )
        assert event.id is not None
        # Should be a valid UUID string
        uuid.UUID(event.id)


# ============================================================================
# Response Parser Tests
# ============================================================================

class TestResponseParser:
    """Tests for the JSON extraction pipeline."""

    def test_direct_json_array(self):
        text = '[{"id": "1", "description": "test"}]'
        result = extract_json(text)
        assert isinstance(result, list)
        assert result[0]["id"] == "1"

    def test_fenced_json(self):
        text = 'Here are the events:\n```json\n[{"id": "1"}]\n```\nDone.'
        result = extract_json(text)
        assert isinstance(result, list)

    def test_preamble_with_bracket_scan(self):
        text = 'I found the following events:\n\n[{"id": "1", "description": "walking"}]'
        result = extract_json(text)
        assert isinstance(result, list)

    def test_trailing_commas(self):
        text = '[{"id": "1", "name": "test",}]'
        result = extract_json(text)
        assert isinstance(result, list)

    def test_truncated_array(self):
        """Simulate LLM hitting token limit mid-array."""
        text = '[{"id": "1", "description": "first"}, {"id": "2", "description": "second"}, {"id": "3", "desc'
        result = extract_json(text)
        assert isinstance(result, list)
        assert len(result) >= 2  # at least the first two should be recovered

    def test_empty_string_raises(self):
        with pytest.raises(ValidationError):
            extract_json("")

    def test_unparseable_raises(self):
        with pytest.raises(ValidationError):
            extract_json("This is just plain text with no JSON at all.")

    def test_extract_json_array_wraps_dict(self):
        """Single object → wrapped in list."""
        text = '{"id": "1", "description": "single event"}'
        result = extract_json_array(text)
        assert isinstance(result, list)
        assert len(result) == 1

    def test_single_line_comments_removed(self):
        text = '[\n  {"id": "1"} // this is a comment\n]'
        result = extract_json(text)
        assert isinstance(result, list)


class TestValidateEvents:
    """Test per-event validation with graceful degradation."""

    def test_valid_events_pass(self):
        raw = [
            {
                "id": "e1",
                "description": "Witness entered the room",
                "time": "around 9 PM",
                "time_uncertainty": "hedged with 'around'",
                "uncertainty_type": "approximate",
                "confidence": 0.7,
                "source_text": "I entered the room around 9 PM",
            },
        ]
        valid, dropped = validate_events(raw, ExtractedEvent)
        assert len(valid) == 1
        assert len(dropped) == 0

    def test_invalid_events_dropped(self):
        raw = [
            {
                "id": "e1",
                "description": "Good event with proper description",
                "source_text": "something valid here",
            },
            {
                "id": "e2",
                "description": "Hi",  # too short — will fail
                "source_text": "x",   # also too short
            },
        ]
        valid, dropped = validate_events(raw, ExtractedEvent)
        assert len(valid) == 1
        assert len(dropped) == 1

    def test_missing_id_auto_generated(self):
        raw = [
            {
                "description": "Event without ID should still work",
                "source_text": "source text for auto-id test",
            },
        ]
        valid, dropped = validate_events(raw, ExtractedEvent)
        assert len(valid) == 1
        assert valid[0].id is not None


# ============================================================================
# Service Integration Tests (mocked LLM)
# ============================================================================

class TestEventExtractionService:
    """Tests for the full extraction pipeline with mocked dependencies."""

    @pytest.fixture()
    def mock_llm_response(self):
        """A realistic LLM response for the test testimony."""
        events = [
            {
                "id": "evt-001",
                "description": "Witness entered a location at night",
                "time": "around night, maybe 9 or 10",
                "time_uncertainty": "Witness used 'I think', 'around', and 'maybe'",
                "uncertainty_type": "hedged",
                "location": None,
                "actors": ["witness (self)"],
                "confidence": 0.55,
                "source_text": "I think I entered around night... maybe 9 or 10",
            },
            {
                "id": "evt-002",
                "description": "Witness observed an unidentified person near a table",
                "time": None,
                "time_uncertainty": "No explicit time given",
                "uncertainty_type": "missing",
                "location": "near the table",
                "actors": ["witness (self)", "unidentified person"],
                "confidence": 0.6,
                "source_text": "there was someone near the table",
            },
            {
                "id": "evt-003",
                "description": "Witness heard a noise",
                "time": "later",
                "time_uncertainty": "'Later' is a relative marker with no anchor",
                "uncertainty_type": "relative",
                "location": None,
                "actors": ["witness (self)"],
                "confidence": 0.7,
                "source_text": "I heard a noise later",
            },
        ]
        return LLMResponse(
            content=json.dumps(events),
            model="gpt-4o",
            usage={"prompt_tokens": 500, "completion_tokens": 300, "total_tokens": 800},
        )

    @pytest.fixture()
    def mock_llm(self, mock_llm_response):
        llm = MagicMock()
        llm.complete = AsyncMock(return_value=mock_llm_response)
        return llm

    @pytest.fixture()
    def mock_db(self):
        return AsyncMock()

    @pytest.mark.asyncio
    async def test_extract_from_text(self, mock_db, mock_llm):
        from app.services.event_extraction_service import EventExtractionService

        svc = EventExtractionService(db=mock_db, llm=mock_llm)
        result = await svc.extract_events_from_text(
            "I think I entered around night... maybe 9 or 10... "
            "there was someone near the table... I heard a noise later"
        )

        assert isinstance(result, ExtractionResult)
        assert len(result.events) == 3
        assert result.raw_event_count == 3
        assert result.dropped_event_count == 0

        # Check uncertainty handling
        evt1 = result.events[0]
        assert evt1.time is not None
        assert "maybe" in evt1.time or "around" in evt1.time
        assert evt1.time_uncertainty is not None
        assert evt1.uncertainty_type == UncertaintyType.HEDGED

        evt2 = result.events[1]
        assert evt2.time is None
        assert evt2.uncertainty_type == UncertaintyType.MISSING
        assert evt2.location == "near the table"

        evt3 = result.events[2]
        assert evt3.uncertainty_type == UncertaintyType.RELATIVE

    @pytest.mark.asyncio
    async def test_graceful_degradation_on_partial_bad_output(self, mock_db):
        """Even if some events are malformed, good ones should survive."""
        mixed_response = LLMResponse(
            content=json.dumps([
                {
                    "id": "good",
                    "description": "A valid event with proper structure",
                    "time": "3 PM",
                    "uncertainty_type": "none",
                    "confidence": 0.9,
                    "source_text": "At 3 PM something valid happened",
                },
                {
                    "id": "bad",
                    "description": "Hi",  # too short
                    "source_text": "x",   # too short
                },
            ]),
            model="gpt-4o",
            usage={},
        )
        llm = MagicMock()
        llm.complete = AsyncMock(return_value=mixed_response)

        from app.services.event_extraction_service import EventExtractionService

        svc = EventExtractionService(db=mock_db, llm=llm)
        result = await svc.extract_events_from_text("At 3 PM something valid happened. x.")

        assert len(result.events) >= 1
        assert result.dropped_event_count >= 1

    @pytest.mark.asyncio
    async def test_fenced_json_response(self, mock_db):
        """LLM wraps response in markdown fences — should still work."""
        fenced_response = LLMResponse(
            content='Here are the events:\n```json\n[{"id": "e1", "description": "Something happened at the park", "confidence": 0.8, "source_text": "something happened at the park"}]\n```',
            model="gpt-4o",
            usage={},
        )
        llm = MagicMock()
        llm.complete = AsyncMock(return_value=fenced_response)

        from app.services.event_extraction_service import EventExtractionService

        svc = EventExtractionService(db=mock_db, llm=llm)
        result = await svc.extract_events_from_text("something happened at the park")

        assert len(result.events) == 1


# ============================================================================
# Post-processing Tests
# ============================================================================

class TestPostProcessing:
    """Tests for dedup, source verification, confidence recalibration."""

    def test_deduplication(self):
        from app.services.event_extraction_service import _deduplicate_events

        events = [
            ExtractedEvent(
                id="a",
                description="Witness heard a noise",
                confidence=0.7,
                source_text="I heard a noise",
            ),
            ExtractedEvent(
                id="b",
                description="Witness heard a noise",  # same
                confidence=0.5,  # lower
                source_text="I heard a noise",         # same
            ),
        ]
        result = _deduplicate_events(events)
        assert len(result) == 1
        assert result[0].confidence == 0.7  # kept the higher one

    def test_confidence_recalibration_short_description(self):
        from app.services.event_extraction_service import _recalibrate_confidence

        events = [
            ExtractedEvent(
                description="A noise",  # short
                confidence=0.9,
                source_text="there was a noise",
            ),
        ]
        result = _recalibrate_confidence(events)
        assert result[0].confidence < 0.9  # should be penalised

    def test_source_text_verification_exact_match(self):
        from app.services.event_extraction_service import _verify_source_text

        event = ExtractedEvent(
            description="Witness entered the room",
            source_text="I entered the room",
            confidence=0.8,
        )
        original = "So then I entered the room and saw nobody."
        verified = _verify_source_text(event, original)
        assert verified.confidence == 0.8  # no penalty — exact match

    def test_source_text_verification_no_match_penalises(self):
        from app.services.event_extraction_service import _verify_source_text

        event = ExtractedEvent(
            description="A completely fabricated event",
            source_text="this text does not exist anywhere in original",
            confidence=0.8,
        )
        original = "The actual testimony is about something entirely different."
        verified = _verify_source_text(event, original)
        assert verified.confidence < 0.8  # penalised

    def test_text_normalisation(self):
        from app.services.event_extraction_service import _normalise_text

        raw = "  Hello   \n\n world  \t foo  "
        result = _normalise_text(raw)
        assert result == "Hello world foo"

    def test_chunking_short_text(self):
        from app.services.event_extraction_service import _chunk_testimony

        short = "This is a short testimony."
        chunks = _chunk_testimony(short)
        assert len(chunks) == 1

    def test_chunking_long_text(self):
        from app.services.event_extraction_service import _chunk_testimony, _MAX_SINGLE_PROMPT_LENGTH

        # Create a text longer than the threshold
        long_text = ". ".join([f"Sentence number {i} with some content" for i in range(500)])
        assert len(long_text) > _MAX_SINGLE_PROMPT_LENGTH

        chunks = _chunk_testimony(long_text)
        assert len(chunks) > 1
