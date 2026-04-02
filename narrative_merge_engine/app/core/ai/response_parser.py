"""
Response parser: extract structured data from LLM text output.

This module is the CRITICAL bridge between raw LLM prose and typed Python
objects.  LLMs routinely produce:
  - JSON wrapped in ```json...``` fences
  - JSON with trailing commas
  - JSON with single quotes instead of double
  - JSON with embedded comments (// or /* */)
  - Truncated JSON (token limit hit mid-array)
  - Multiple JSON blocks in one response
  - Text preamble before the JSON starts

Each strategy below is ordered by likelihood; we bail on the first success.
"""

from __future__ import annotations

import json
import re
import uuid
from typing import Any

from pydantic import ValidationError as PydanticValidationError

from app.core.exceptions import ValidationError
from app.core.logging import get_logger

logger = get_logger(__name__)

# ─── Regex patterns ──────────────────────────────────────────────────────────

# Matches ```json ... ``` or ``` ... ``` blocks (single or multiline)
_JSON_BLOCK_RE = re.compile(r"```(?:json)?\s*([\s\S]*?)```", re.IGNORECASE)

# Matches // single-line comments
_SINGLE_LINE_COMMENT_RE = re.compile(r'//[^\n]*')

# Matches /* multi-line comments */
_MULTI_LINE_COMMENT_RE = re.compile(r'/\*[\s\S]*?\*/')

# Trailing commas before } or ]
_TRAILING_COMMA_RE = re.compile(r',\s*([}\]])')

# Single-quoted strings → double-quoted (naive but effective for LLM output)
_SINGLE_QUOTE_RE = re.compile(r"(?<![\\])'")


# ─── Sanitisation ────────────────────────────────────────────────────────────

def _sanitise_json_string(raw: str) -> str:
    """
    Best-effort repair of common LLM JSON mistakes.
    Applied BEFORE json.loads() as a fallback.
    """
    s = raw.strip()

    # Strip BOM
    s = s.lstrip("\ufeff")

    # Remove comments
    s = _SINGLE_LINE_COMMENT_RE.sub("", s)
    s = _MULTI_LINE_COMMENT_RE.sub("", s)

    # Trailing commas
    s = _TRAILING_COMMA_RE.sub(r"\1", s)

    return s


def _try_parse(text: str) -> Any | None:
    """Attempt json.loads, then fallback to sanitised version."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    sanitised = _sanitise_json_string(text)
    try:
        return json.loads(sanitised)
    except json.JSONDecodeError:
        pass

    return None


# ─── Extraction Strategies ───────────────────────────────────────────────────

def _strategy_direct(text: str) -> Any | None:
    """Strategy 1: The entire string is valid JSON."""
    return _try_parse(text.strip())


def _strategy_fenced(text: str) -> Any | None:
    """Strategy 2: JSON inside a markdown code fence."""
    for match in _JSON_BLOCK_RE.finditer(text):
        result = _try_parse(match.group(1).strip())
        if result is not None:
            return result
    return None


def _strategy_bracket_scan(text: str) -> Any | None:
    """
    Strategy 3: Find the outermost matching brackets.
    Handles cases where LLM adds preamble text before JSON.
    Tries [] first (expected for event arrays), then {}.
    """
    for open_char, close_char in [("[", "]"), ("{", "}")]:
        start = text.find(open_char)
        if start == -1:
            continue

        # Find matching close bracket using a depth counter
        depth = 0
        in_string = False
        escape_next = False
        for i in range(start, len(text)):
            ch = text[i]
            if escape_next:
                escape_next = False
                continue
            if ch == "\\":
                escape_next = True
                continue
            if ch == '"':
                in_string = not in_string
                continue
            if in_string:
                continue
            if ch == open_char:
                depth += 1
            elif ch == close_char:
                depth -= 1
                if depth == 0:
                    candidate = text[start : i + 1]
                    result = _try_parse(candidate)
                    if result is not None:
                        return result
                    break  # mismatched content, try next bracket pair
    return None


def _strategy_truncated_array(text: str) -> Any | None:
    """
    Strategy 4: Handle truncated arrays (LLM hit token limit mid-output).
    Find the last complete object in a '[{...}, {incomplete' pattern.
    """
    start = text.find("[")
    if start == -1:
        return None

    # Find the last complete '}'
    last_close = text.rfind("}")
    if last_close == -1 or last_close <= start:
        return None

    candidate = text[start : last_close + 1] + "]"
    result = _try_parse(candidate)
    if result is not None and isinstance(result, list) and len(result) > 0:
        logger.warning(
            "Recovered truncated JSON array",
            original_length=len(text),
            recovered_items=len(result),
        )
        return result
    return None


# ─── Public API ──────────────────────────────────────────────────────────────

def extract_json(text: str) -> Any:
    """
    Extract and parse JSON from an LLM response using multiple fallback
    strategies.  Returns the parsed Python object (list or dict).

    Strategies (in order of preference):
      1. Direct parse (whole string is JSON)
      2. Markdown code fence extraction
      3. Bracket-depth scanning with preamble skip
      4. Truncated array recovery

    Raises ValidationError if all strategies fail.
    """
    if not text or not text.strip():
        raise ValidationError("Empty LLM response — cannot extract JSON")

    for strategy_name, strategy_fn in [
        ("direct", _strategy_direct),
        ("fenced", _strategy_fenced),
        ("bracket_scan", _strategy_bracket_scan),
        ("truncated_array", _strategy_truncated_array),
    ]:
        result = strategy_fn(text)
        if result is not None:
            logger.debug("JSON extracted", strategy=strategy_name)
            return result

    logger.warning(
        "All JSON extraction strategies failed",
        text_preview=text[:300],
        text_length=len(text),
    )
    raise ValidationError(
        "LLM response did not contain parseable JSON",
        detail={"preview": text[:500], "length": len(text)},
    )


def extract_json_array(text: str) -> list[dict]:
    """
    Like extract_json, but guarantees a list of dicts is returned.
    If the LLM returns a single object, wraps it in a list.
    """
    parsed = extract_json(text)

    if isinstance(parsed, dict):
        # Single event returned — wrap in list
        return [parsed]
    if isinstance(parsed, list):
        # Filter out non-dict items (rare but possible)
        return [item for item in parsed if isinstance(item, dict)]

    raise ValidationError(
        "Expected a JSON array of objects",
        detail={"actual_type": type(parsed).__name__, "preview": str(parsed)[:200]},
    )


def validate_events(
    raw_events: list[dict],
    schema_class: type,
) -> tuple[list[Any], list[dict[str, Any]]]:
    """
    Validate a list of raw event dicts against a Pydantic schema.

    Returns:
        (valid_events, dropped_events) — valid objects and error details
        for events that failed validation.

    This NEVER raises on individual event failures — it logs and drops.
    The caller decides what to do if too many events are dropped.
    """
    valid: list[Any] = []
    dropped: list[dict[str, Any]] = []

    for i, raw in enumerate(raw_events):
        # Ensure each event has an ID
        if "id" not in raw or not raw["id"]:
            raw["id"] = str(uuid.uuid4())

        try:
            event = schema_class.model_validate(raw)
            valid.append(event)
        except PydanticValidationError as exc:
            logger.warning(
                "Event validation failed — dropping",
                event_index=i,
                errors=exc.error_count(),
                preview=str(raw)[:200],
            )
            dropped.append({
                "index": i,
                "raw": raw,
                "errors": exc.errors(),
            })
        except Exception as exc:
            logger.warning(
                "Unexpected validation error — dropping event",
                event_index=i,
                error=str(exc),
            )
            dropped.append({
                "index": i,
                "raw": raw,
                "errors": [{"msg": str(exc)}],
            })

    return valid, dropped


def extract_text(text: str) -> str:
    """Strip markdown code fences and return plain text."""
    cleaned = _JSON_BLOCK_RE.sub("", text)
    return cleaned.strip()
