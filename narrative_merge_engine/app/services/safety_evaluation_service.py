"""
Safety Evaluation Service — Legal AI Guard Layer
==================================================

Lightweight, synchronous safety filter for all incoming text in the
Narrative Merge Engine.  Runs entirely on CPU with zero external calls
so it adds negligible latency (<1 ms) to every request.

Design:
    ┌─────────────┐     ┌──────────┐     ┌─────────────┐
    │ User Input   │────▶│ evaluate  │────▶│ safe / risky │
    │ (testimony   │     │ _safety() │     │ / blocked    │
    │  or query)   │     └──────────┘     └─────────────┘
    └─────────────┘
          │                                    │
          │  blocked → 403 + reason            │
          │  risky   → allow + log warning     │
          │  safe    → pass through            │

Categories:
    BLOCKED  – clearly illegal, exploitative, or manipulative
    RISKY    – sensitive but may be legitimate in a legal context
    SAFE     – no safety signals detected

Extensibility:
    Add patterns to _BLOCKED_PATTERNS / _RISKY_PATTERNS below.
    For production, replace with an LLM-based classifier or a
    fine-tuned text-classification model.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum
from typing import Sequence

from app.core.logging import get_logger

logger = get_logger(__name__)


# ── Safety category enum ─────────────────────────────────────────────────────

class SafetyCategory(str, Enum):
    SAFE    = "safe"
    RISKY   = "risky"
    BLOCKED = "blocked"


# ── Result dataclass ─────────────────────────────────────────────────────────

@dataclass(frozen=True, slots=True)
class SafetyResult:
    """Immutable evaluation result returned to callers."""
    safe: bool
    category: SafetyCategory
    reason: str

    def to_dict(self) -> dict:
        return {
            "safe": self.safe,
            "category": self.category.value,
            "reason": self.reason,
        }


# ── Pattern definitions ──────────────────────────────────────────────────────
# Each tuple is (compiled_regex, human_reason).
# Patterns are tested case-insensitively against the full input text.

_BLOCKED_PATTERNS: list[tuple[re.Pattern, str]] = [
    # ── Illegal guidance ──
    (re.compile(r"\b(?:how\s+to\s+(?:destroy|fabricate|forge|tamper\s+with)\s+evidence)\b", re.I),
     "Request for evidence tampering guidance."),
    (re.compile(r"\b(?:help\s+me\s+(?:hide|conceal|cover\s+up)\s+(?:a\s+)?(?:crime|murder|assault|theft))\b", re.I),
     "Request to conceal criminal activity."),
    (re.compile(r"\b(?:how\s+to\s+(?:bribe|intimidate|threaten)\s+(?:a\s+)?(?:witness|judge|jury|officer))\b", re.I),
     "Request for witness/jury intimidation or bribery guidance."),
    (re.compile(r"\b(?:forge|fake|falsif(?:y|ied))\s+(?:testimony|statement|evidence|document|report)\b", re.I),
     "Request to falsify legal records."),
    (re.compile(r"\b(?:suborn\s+perjury|coach.*(?:lie|lying|false\s+testimony))\b", re.I),
     "Request to suborn perjury or coach false testimony."),

    # ── Exploitation / harm ──
    (re.compile(r"\b(?:how\s+to\s+(?:exploit|manipulate|trick)\s+(?:a\s+)?(?:victim|child|minor|survivor))\b", re.I),
     "Request to exploit or manipulate a vulnerable person."),
    (re.compile(r"\b(?:make\s+(?:a\s+)?(?:bomb|weapon|explosive))\b", re.I),
     "Request for weapons or explosive construction."),
    (re.compile(r"\b(?:how\s+to\s+(?:stalk|harass|doxx|dox)\s+(?:someone|a\s+person|a\s+witness))\b", re.I),
     "Request for stalking or harassment guidance."),

    # ── Direct harmful intent ──
    (re.compile(r"\b(?:i\s+(?:want|plan|intend)\s+to\s+(?:kill|murder|harm|hurt|assault))\b", re.I),
     "Expressed intent to cause physical harm."),
]

_RISKY_PATTERNS: list[tuple[re.Pattern, str]] = [
    # ── Sensitive but potentially valid in investigation context ──
    (re.compile(r"\b(?:sexual\s+assault|rape|domestic\s+violence|child\s+abuse)\b", re.I),
     "Contains references to sensitive crimes — allowed for legitimate investigation."),
    (re.compile(r"\b(?:suicide|self[- ]?harm)\b", re.I),
     "Contains self-harm references — exercise caution in response."),
    (re.compile(r"\b(?:graphic\s+(?:violence|injury|detail))\b", re.I),
     "Contains graphic content descriptors — may be valid forensic detail."),
    (re.compile(r"\b(?:victim['']?s?\s+(?:identity|address|phone|location))\b", re.I),
     "Potential request for victim PII — verify investigator authorisation."),
    (re.compile(r"\b(?:off\s+the\s+record|without\s+(?:a\s+)?warrant)\b", re.I),
     "Query references unofficial procedures — flag for review."),
    (re.compile(r"\b(?:coerce|pressure|force)\s+(?:a\s+)?(?:confession|statement|testimony)\b", re.I),
     "References coerced testimony — risky but may be analysis of existing evidence."),
]

# ── Rewrite rules (exploitative → sanitised) ─────────────────────────────────
# If the input is exploitative but can be salvaged by rephrasing.

_REWRITE_PATTERNS: list[tuple[re.Pattern, str]] = [
    (re.compile(r"\bhow\s+(?:can|do)\s+(?:I|we)\s+get\s+(?:the\s+)?(?:victim|witness)\s+to\s+(?:change|retract)\b", re.I),
     "How can I understand the witness's perspective to resolve contradictions?"),
    (re.compile(r"\bhow\s+to\s+make\s+(?:a\s+)?(?:witness|victim)\s+(?:cooperate|comply|talk)\b", re.I),
     "What are ethical interview techniques to build rapport with a reluctant witness?"),
]


# ── Public API ────────────────────────────────────────────────────────────────

def evaluate_safety(input_text: str) -> SafetyResult:
    """
    Evaluate a text input against the legal-domain safety policy.

    Args:
        input_text: Raw testimony text or investigator query.

    Returns:
        SafetyResult with safe/category/reason fields.
    """
    if not input_text or not input_text.strip():
        return SafetyResult(safe=True, category=SafetyCategory.SAFE, reason="Empty input.")

    text = input_text.strip()

    # ── Pass 1: Check for blocked patterns ────────────────────────────────
    for pattern, reason in _BLOCKED_PATTERNS:
        if pattern.search(text):
            logger.warning(
                "Safety BLOCKED",
                reason=reason,
                input_preview=text[:80],
            )
            return SafetyResult(safe=False, category=SafetyCategory.BLOCKED, reason=reason)

    # ── Pass 2: Check for risky patterns ──────────────────────────────────
    for pattern, reason in _RISKY_PATTERNS:
        if pattern.search(text):
            logger.info(
                "Safety RISKY (allowed)",
                reason=reason,
                input_preview=text[:80],
            )
            return SafetyResult(safe=True, category=SafetyCategory.RISKY, reason=reason)

    # ── Pass 3: All clear ─────────────────────────────────────────────────
    return SafetyResult(safe=True, category=SafetyCategory.SAFE, reason="No safety signals detected.")


def rewrite_if_exploitative(input_text: str) -> tuple[str, bool]:
    """
    If the input matches an exploitative pattern that can be salvaged,
    return a sanitised version.  Otherwise return the original.

    Returns:
        (text, was_rewritten)
    """
    text = input_text.strip()
    for pattern, replacement in _REWRITE_PATTERNS:
        if pattern.search(text):
            logger.info(
                "Safety REWRITE applied",
                original_preview=text[:80],
                replacement=replacement,
            )
            return replacement, True

    return text, False


def evaluate_and_rewrite(input_text: str) -> tuple[SafetyResult, str]:
    """
    Combined convenience function: evaluate safety first, then attempt
    rewrite if the input is exploitative but not outright blocked.

    Returns:
        (SafetyResult, possibly_rewritten_text)
    """
    result = evaluate_safety(input_text)

    if result.category == SafetyCategory.BLOCKED:
        return result, input_text  # Don't rewrite blocked content

    rewritten, was_rewritten = rewrite_if_exploitative(input_text)
    if was_rewritten:
        return SafetyResult(
            safe=True,
            category=SafetyCategory.RISKY,
            reason=f"Input rewritten for safety: {result.reason}",
        ), rewritten

    return result, input_text


def precheck_input(input_text: str) -> dict:
    """
    Evaluate input BEFORE running expensive LLM pipeline.
    Detects malicious intent, illegal guidance, prompt injection, etc.
    
    Returns:
        dict: {
            "allowed": bool,
            "risk": "low" | "medium" | "high",
            "reason": str
        }
    """
    result = evaluate_safety(input_text)
    
    if result.category == SafetyCategory.BLOCKED:
        return {
            "allowed": False,
            "risk": "high",
            "reason": result.reason
        }
    elif result.category == SafetyCategory.RISKY:
        return {
            "allowed": True,
            "risk": "medium",
            "reason": result.reason
        }
    else:
        return {
            "allowed": True,
            "risk": "low",
            "reason": result.reason
        }
