"""
Pydantic schemas for the Event Extraction pipeline.

These are the *intelligence-layer* schemas — they model what the LLM
returns and what downstream consumers (timeline builder, conflict detector)
consume.  They are deliberately separate from the ORM-oriented schemas
in `entities.py` because the LLM output shape differs from the DB row shape.

Key design decisions:
  ─ `time` is always a free-text string, not a parsed datetime, because
    testimony language is inherently vague ("around night", "baad mein").
  ─ `time_uncertainty` captures WHY the time is uncertain (hedging language,
    relative references, missing information).
  ─ `confidence` is a continuous float [0,1], not a 3-bucket enum, because
    the extraction layer needs fine-grained signal for downstream ranking.
  ─ `source_text` preserves the exact span from the input, enabling
    provenance tracking and human review.
"""

from __future__ import annotations

import uuid
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, field_validator, model_validator


class UncertaintyType(str, Enum):
    """Categorises the *kind* of uncertainty detected."""
    HEDGED = "hedged"               # "I think", "maybe", "shayad"
    APPROXIMATE = "approximate"     # "around 9", "lagbhag"
    RELATIVE = "relative"           # "after that", "later", "pehle"
    MISSING = "missing"             # no temporal marker at all
    CONFLICTING = "conflicting"     # self-contradictory within same stmt
    NONE = "none"                   # time is stated with no hedging


class ExtractedEvent(BaseModel):
    """
    A single atomic event extracted from testimony text.

    This is the core output type of the intelligence layer.
    Every field is designed to preserve the witness's original language
    and NOT inject precision that doesn't exist in the source.
    """

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Unique identifier for this extracted event.",
    )
    description: str = Field(
        ...,
        min_length=5,
        description=(
            "A concise, factual description of what happened. "
            "Must NOT add information not present in the source."
        ),
    )
    time: str | None = Field(
        default=None,
        description=(
            "The temporal marker as stated by the witness, in their own words. "
            "Examples: 'around 9 or 10 at night', 'baad mein', 'later'. "
            "NULL if no temporal information is available."
        ),
    )
    time_uncertainty: str | None = Field(
        default=None,
        description=(
            "Explanation of WHY the time is uncertain. Must reference the "
            "specific hedging language used: 'Witness used \"maybe\" and "
            "\"around\", indicating approximate recall.' NULL only when "
            "time is stated without any hedging."
        ),
    )
    uncertainty_type: UncertaintyType = Field(
        default=UncertaintyType.MISSING,
        description="Categorical classification of the uncertainty.",
    )
    location: str | None = Field(
        default=None,
        description=(
            "Location as described by the witness. Preserve vague references: "
            "'near the table', 'bahar', 'somewhere upstairs'."
        ),
    )
    actors: list[str] = Field(
        default_factory=list,
        description=(
            "People or entities involved. Use descriptive labels for unknowns: "
            "'unidentified person', 'someone', 'a group'. "
            "Preserve the witness's own phrasing when possible."
        ),
    )
    confidence: float = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description=(
            "Confidence that this event was accurately extracted. "
            "Consider: clarity of language, presence of hedging, "
            "completeness of the statement, potential for misinterpretation."
        ),
    )
    source_text: str = Field(
        ...,
        min_length=3,
        description=(
            "The EXACT substring from the original testimony that this "
            "event was extracted from. Must be a verbatim quote."
        ),
    )

    # ── Validators ───────────────────────────────────────────────────────

    @field_validator("confidence", mode="before")
    @classmethod
    def clamp_confidence(cls, v: Any) -> float:
        """Clamp to [0, 1] and handle string/percent inputs."""
        if isinstance(v, str):
            v = v.strip().rstrip("%")
            try:
                v = float(v)
            except ValueError:
                # Map text labels to floats
                label_map = {"low": 0.3, "medium": 0.5, "high": 0.8, "very high": 0.9}
                v = label_map.get(v.lower(), 0.5)
        if isinstance(v, (int, float)):
            if v > 1.0:
                v = v / 100.0  # handle 0-100 scale
            return max(0.0, min(1.0, float(v)))
        return 0.5

    @field_validator("actors", mode="before")
    @classmethod
    def normalise_actors(cls, v: Any) -> list[str]:
        """Accept string or list, deduplicate."""
        if isinstance(v, str):
            return [v] if v.strip() else []
        if isinstance(v, list):
            seen: set[str] = set()
            result: list[str] = []
            for item in v:
                s = str(item).strip()
                if s and s.lower() not in seen:
                    seen.add(s.lower())
                    result.append(s)
            return result
        return []

    @field_validator("uncertainty_type", mode="before")
    @classmethod
    def normalise_uncertainty_type(cls, v: Any) -> str:
        """Accept various spellings and map to enum."""
        if isinstance(v, UncertaintyType):
            return v.value
        if isinstance(v, str):
            mapping = {
                "hedge": "hedged",
                "hedged": "hedged",
                "hedging": "hedged",
                "approx": "approximate",
                "approximate": "approximate",
                "approximation": "approximate",
                "relative": "relative",
                "temporal_relative": "relative",
                "missing": "missing",
                "absent": "missing",
                "none": "none",
                "certain": "none",
                "exact": "none",
                "conflicting": "conflicting",
                "contradictory": "conflicting",
            }
            return mapping.get(v.strip().lower(), "hedged")
        return "missing"

    @model_validator(mode="after")
    def ensure_uncertainty_consistency(self) -> "ExtractedEvent":
        """If time is None, uncertainty_type must be MISSING."""
        if self.time is None and self.uncertainty_type != UncertaintyType.MISSING:
            self.uncertainty_type = UncertaintyType.MISSING
        if self.time is not None and self.uncertainty_type == UncertaintyType.MISSING:
            # Has time but uncertainty wasn't classified — default to hedged
            if self.time_uncertainty:
                self.uncertainty_type = UncertaintyType.HEDGED
            else:
                self.uncertainty_type = UncertaintyType.NONE
        return self


class ExtractionResult(BaseModel):
    """Complete output of the event extraction pipeline."""
    events: list[ExtractedEvent]
    testimony_id: str | None = None
    raw_event_count: int = Field(
        default=0,
        description="Number of events the LLM attempted to return (before validation filtering).",
    )
    dropped_event_count: int = Field(
        default=0,
        description="Events dropped during validation.",
    )
    extraction_metadata: dict[str, Any] = Field(
        default_factory=dict,
        description="Debugging metadata: model used, token counts, latency, etc.",
    )
