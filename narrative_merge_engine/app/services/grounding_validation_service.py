"""
Grounding Validation Service — Anti-Hallucination Layer
========================================================

Validates that every extracted event is genuinely present in the original
testimony text.  Uses fuzzy substring matching to account for LLM
paraphrasing while still catching outright fabrications.

Design:
    ┌──────────────┐      ┌───────────────┐      ┌─────────────────┐
    │ Extracted     │─────▶│  validate_    │─────▶│ GroundingResult │
    │ Events        │      │  grounding()  │      │  .grounded[]    │
    │ + source text │      │               │      │  .ungrounded[]  │
    └──────────────┘      └───────────────┘      └─────────────────┘
                                 ▲
                                 │
                          ┌──────┴──────┐
                          │ Original    │
                          │ Testimony   │
                          └─────────────┘

Matching strategies (tried in order):
  1. Exact substring match (fastest)
  2. Normalised match (lowercase, collapsed whitespace)
  3. Token overlap ratio (handles paraphrasing)
  4. Key-phrase extraction (handles heavy rewording)

An event is considered GROUNDED if any strategy produces a match
above the configured threshold.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

from app.core.logging import get_logger

logger = get_logger(__name__)


# ── Configuration ─────────────────────────────────────────────────────────────

# Minimum token overlap ratio for fuzzy match (0.0–1.0)
_TOKEN_OVERLAP_THRESHOLD = 0.45

# Minimum key-phrase overlap (nouns/verbs) for semantic match
_KEYPHRASE_OVERLAP_THRESHOLD = 0.50

# Words too common to be useful for matching
_STOP_WORDS = frozenset({
    "i", "me", "my", "we", "our", "you", "your", "he", "she", "it", "they",
    "them", "his", "her", "its", "the", "a", "an", "and", "or", "but", "in",
    "on", "at", "to", "for", "of", "with", "by", "from", "was", "were",
    "is", "are", "be", "been", "being", "have", "has", "had", "do", "does",
    "did", "will", "would", "could", "should", "may", "might", "shall",
    "can", "that", "this", "these", "those", "there", "here", "when",
    "where", "what", "which", "who", "whom", "how", "not", "no", "nor",
    "so", "if", "then", "than", "too", "very", "just", "about", "also",
    "some", "any", "all", "each", "every", "both", "few", "more", "most",
    "other", "into", "over", "after", "before", "between", "under",
    "again", "once", "up", "down", "out", "off", "only", "own", "same",
    "as", "until", "while", "during", "through", "above", "below",
})


# ── Result types ─────────────────────────────────────────────────────────────

@dataclass(frozen=True, slots=True)
class GroundedEvent:
    """An event that passed grounding validation."""
    event: dict
    source_text_span: str   # The matched span from the original text
    match_strategy: str     # Which strategy succeeded
    match_score: float      # How strong the match was (0.0–1.0)


@dataclass(frozen=True, slots=True)
class UngroundedEvent:
    """An event that failed grounding validation."""
    event: dict
    reason: str
    best_score: float       # Highest score achieved (still below threshold)


@dataclass(slots=True)
class GroundingResult:
    """Complete output of the grounding validation pass."""
    grounded: list[GroundedEvent] = field(default_factory=list)
    ungrounded: list[UngroundedEvent] = field(default_factory=list)
    total_events: int = 0
    grounded_count: int = 0
    ungrounded_count: int = 0
    grounding_rate: float = 0.0

    def to_dict(self) -> dict:
        return {
            "total_events": self.total_events,
            "grounded_count": self.grounded_count,
            "ungrounded_count": self.ungrounded_count,
            "grounding_rate": round(self.grounding_rate, 3),
        }


# ── Text normalisation helpers ───────────────────────────────────────────────

def _normalise(text: str) -> str:
    """Lowercase, collapse whitespace, strip punctuation edges."""
    text = text.lower().strip()
    text = re.sub(r"\s+", " ", text)
    return text


def _tokenise(text: str) -> list[str]:
    """Split into lowercase alpha-numeric tokens, remove stop words."""
    return [
        w for w in re.findall(r"[a-z0-9]+", text.lower())
        if w not in _STOP_WORDS and len(w) > 1
    ]


def _extract_keyphrases(text: str) -> set[str]:
    """Extract content-bearing words (pseudo key-phrases)."""
    tokens = _tokenise(text)
    # Also capture 2-grams for better semantic matching
    bigrams = {f"{tokens[i]} {tokens[i+1]}" for i in range(len(tokens) - 1)}
    return set(tokens) | bigrams


# ── Matching strategies ──────────────────────────────────────────────────────

def _exact_substring_match(source_text: str, testimony: str) -> tuple[bool, float, str]:
    """Strategy 1: exact substring match."""
    if source_text in testimony:
        return True, 1.0, source_text
    return False, 0.0, ""


def _normalised_match(source_text: str, testimony: str) -> tuple[bool, float, str]:
    """Strategy 2: normalised (case-insensitive, whitespace-collapsed) match."""
    norm_source = _normalise(source_text)
    norm_testimony = _normalise(testimony)

    if norm_source in norm_testimony:
        # Find the approximate position in the original
        idx = norm_testimony.find(norm_source)
        # Map back to original text (approximate)
        span = testimony[max(0, idx):idx + len(source_text) + 10].strip()
        return True, 0.95, span

    return False, 0.0, ""


def _token_overlap_match(
    source_text: str, testimony: str
) -> tuple[bool, float, str]:
    """Strategy 3: token overlap ratio."""
    source_tokens = set(_tokenise(source_text))
    if not source_tokens:
        return False, 0.0, ""

    testimony_tokens = set(_tokenise(testimony))
    overlap = source_tokens & testimony_tokens
    ratio = len(overlap) / len(source_tokens)

    if ratio >= _TOKEN_OVERLAP_THRESHOLD:
        # Find the best matching window in the testimony
        span = _find_best_window(source_text, testimony, overlap)
        return True, round(ratio, 3), span

    return False, round(ratio, 3), ""


def _keyphrase_match(
    description: str, testimony: str
) -> tuple[bool, float, str]:
    """Strategy 4: key-phrase overlap on the event description itself."""
    desc_phrases = _extract_keyphrases(description)
    if not desc_phrases:
        return False, 0.0, ""

    testimony_phrases = _extract_keyphrases(testimony)
    overlap = desc_phrases & testimony_phrases
    ratio = len(overlap) / len(desc_phrases) if desc_phrases else 0.0

    if ratio >= _KEYPHRASE_OVERLAP_THRESHOLD:
        span = _find_best_window(description, testimony, overlap)
        return True, round(ratio, 3), span

    return False, round(ratio, 3), ""


def _find_best_window(
    query: str, testimony: str, overlap_tokens: set[str]
) -> str:
    """Find the best matching window in the testimony for a set of overlap tokens."""
    if not overlap_tokens:
        return ""

    words = testimony.split()
    best_start = 0
    best_count = 0
    window_size = min(len(query.split()) + 5, len(words))

    for start in range(max(1, len(words) - window_size + 1)):
        window = " ".join(words[start:start + window_size]).lower()
        count = sum(1 for t in overlap_tokens if t in window)
        if count > best_count:
            best_count = count
            best_start = start

    span = " ".join(words[best_start:best_start + window_size])
    return span.strip()


# ── Public API ────────────────────────────────────────────────────────────────

def validate_grounding(
    events: list[dict],
    testimony_text: str,
) -> GroundingResult:
    """
    Validate that each extracted event is grounded in the original testimony.

    Args:
        events: List of event dicts (each must have 'description' and
                optionally 'source_text').
        testimony_text: The original raw testimony text.

    Returns:
        GroundingResult with grounded/ungrounded event lists.
    """
    result = GroundingResult(total_events=len(events))

    if not testimony_text or not testimony_text.strip():
        # No testimony to validate against — mark all as ungrounded
        for ev in events:
            result.ungrounded.append(UngroundedEvent(
                event=ev,
                reason="No testimony text available for grounding validation.",
                best_score=0.0,
            ))
        result.ungrounded_count = len(events)
        return result

    for ev in events:
        source_text = ev.get("source_text", "") or ""
        description = ev.get("description", "") or ""

        # Try matching strategies in order of strictness
        strategies = [
            ("exact_substring", lambda: _exact_substring_match(source_text, testimony_text)),
            ("normalised", lambda: _normalised_match(source_text, testimony_text)),
            ("token_overlap", lambda: _token_overlap_match(source_text, testimony_text)),
            ("keyphrase_description", lambda: _keyphrase_match(description, testimony_text)),
        ]

        matched = False
        best_score = 0.0

        for strategy_name, strategy_fn in strategies:
            is_match, score, span = strategy_fn()
            best_score = max(best_score, score)

            if is_match:
                result.grounded.append(GroundedEvent(
                    event=ev,
                    source_text_span=span,
                    match_strategy=strategy_name,
                    match_score=score,
                ))
                matched = True
                break

        if not matched:
            result.ungrounded.append(UngroundedEvent(
                event=ev,
                reason=(
                    f"Event '{description[:60]}' could not be matched to any "
                    f"span in the testimony (best score: {best_score:.2f})."
                ),
                best_score=best_score,
            ))

    result.grounded_count = len(result.grounded)
    result.ungrounded_count = len(result.ungrounded)
    result.grounding_rate = (
        result.grounded_count / result.total_events
        if result.total_events > 0 else 1.0
    )

    logger.info(
        "Grounding validation complete",
        total=result.total_events,
        grounded=result.grounded_count,
        ungrounded=result.ungrounded_count,
        rate=f"{result.grounding_rate:.1%}",
    )

    if result.ungrounded:
        logger.warning(
            "Hallucinated events detected and removed",
            count=result.ungrounded_count,
            events=[ue.event.get("description", "?")[:50] for ue in result.ungrounded],
        )

    return result


def ground_events(
    events: list[dict],
    testimony_text: str,
) -> tuple[list[dict], list[dict], dict]:
    """
    Convenience function: validate and return split lists.

    Returns:
        (grounded_events, all_events_with_flags, grounding_stats)

    Each event in all_events_with_flags gets extra fields:
        - grounded: bool
        - source_text_span: str | None
        - grounding_score: float
        - grounding_strategy: str | None
    """
    validation = validate_grounding(events, testimony_text)

    # Build grounded events list (only validated ones)
    grounded_events: list[dict] = []
    for ge in validation.grounded:
        enriched = {**ge.event}
        enriched["grounded"] = True
        enriched["source_text_span"] = ge.source_text_span
        enriched["grounding_score"] = ge.match_score
        enriched["grounding_strategy"] = ge.match_strategy
        grounded_events.append(enriched)

    # Build full list with flags (for transparency)
    all_flagged: list[dict] = []
    for ge in validation.grounded:
        enriched = {**ge.event}
        enriched["grounded"] = True
        enriched["source_text_span"] = ge.source_text_span
        enriched["grounding_score"] = ge.match_score
        enriched["grounding_strategy"] = ge.match_strategy
        all_flagged.append(enriched)

    for ue in validation.ungrounded:
        flagged = {**ue.event}
        flagged["grounded"] = False
        flagged["source_text_span"] = None
        flagged["grounding_score"] = ue.best_score
        flagged["grounding_strategy"] = None
        flagged["grounding_reason"] = ue.reason
        all_flagged.append(flagged)

    return grounded_events, all_flagged, validation.to_dict()
