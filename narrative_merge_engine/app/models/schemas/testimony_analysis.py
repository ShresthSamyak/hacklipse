from enum import Enum
from pydantic import BaseModel, Field


class EmotionCategory(str, Enum):
    CALM = "calm"
    DISTRESSED = "distressed"
    FEARFUL = "fearful"
    ANGRY = "angry"
    NEUTRAL = "neutral"


class ConfidenceLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TestimonyAnalysisResult(BaseModel):
    """
    Structured extraction of a witness's emotional tone and underlying certainty.
    Designed to guide downstream reasoning tasks without distorting factual extraction.
    """
    emotion: EmotionCategory = Field(
        ...,
        description="The dominant emotional tone detected from explicit statements or implied phrasing."
    )
    uncertainty_signals: list[str] = Field(
        ...,
        description="Exact quotes or phrases representing hesitation, memory gaps, or hedging (e.g. 'I think', 'maybe')."
    )
    confidence_level: ConfidenceLevel = Field(
        ...,
        description="Overall confidence bounds. If ANY uncertainty signals exist, this should logically be constrained."
    )
