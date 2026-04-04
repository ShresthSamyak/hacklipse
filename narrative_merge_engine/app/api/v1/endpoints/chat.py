"""
Chat endpoint — interactive investigation assistant.

POST /api/v1/chat

Accepts a natural-language query plus the current case context
(timeline, conflicts, testimonies) and returns a grounded answer from
the LLM.  It NEVER hallucinates — every answer is derived strictly from
the supplied context.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.api.deps import CurrentUser, LLMDep
from app.core.ai.base_provider import LLMMessage, LLMRequest
from app.core.logging import get_logger
from app.services.safety_evaluation_service import SafetyCategory, evaluate_and_rewrite

logger = get_logger(__name__)

router = APIRouter(prefix="/chat", tags=["Investigation Chat"])


# ── Request / Response schemas ────────────────────────────────────────────────

class ChatContext(BaseModel):
    timeline:    dict[str, Any] | None = None
    conflicts:   dict[str, Any] | None = None
    testimonies: list[dict[str, Any]] | None = None
    report:      dict[str, Any] | None = None


class ChatRequest(BaseModel):
    query:   str         = Field(..., min_length=1,  max_length=1000)
    context: ChatContext = Field(default_factory=ChatContext)


class ChatResponse(BaseModel):
    answer: str
    confidence: str = "medium"
    evidence: list[str] = Field(default_factory=list)
    role:   str = "assistant"
    safety: dict | None = None  # included when safety flagged something


# ── System prompt ─────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """\
You are an expert forensic investigation assistant for the Narrative Merge Engine.

STRICT RULES:
1. Answer ONLY using provided case context.
2. DO NOT hallucinate beyond data. DO NOT fabricate facts, events, timestamps, or witness statements.
3. If unknown or context does not contain enough information to answer → say exactly "Insufficient information available".
4. When discussing conflicts, explain WHAT differs and BETWEEN WHICH witnesses.

OUTPUT FORMAT:
You must return valid JSON matching this schema:
{
  "answer": "Your detailed answer or 'Insufficient information available'",
  "confidence": "low" | "medium" | "high",
  "evidence": ["Exact timeline event or testimony snippet that proves your answer", "Another exact piece of evidence"]
}
If no evidence is available, return an empty array for evidence.
"""


# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_context_block(ctx: ChatContext) -> str:
    """Serialize the pipeline context into a readable text block for the LLM."""
    parts: list[str] = []

    # Timeline
    if ctx.timeline:
        events = ctx.timeline.get("events") or []
        confirmed = ctx.timeline.get("confirmed_sequence") or []
        probable  = ctx.timeline.get("probable_sequence") or []
        uncertain = ctx.timeline.get("uncertain_events") or []
        all_events = events or confirmed + probable + uncertain

        if all_events:
            parts.append("=== TIMELINE ===")
            for i, ev in enumerate(all_events[:20], 1):  # cap at 20
                desc  = ev.get("description", "?")
                time  = ev.get("time") or ev.get("time_reference") or "unknown time"
                wid   = ev.get("witness_id", "")
                conf  = ev.get("placement_confidence") or ev.get("original_confidence", "")
                line  = f"{i}. [{conf}] {desc}"
                if time != "unknown time":
                    line += f" (at {time})"
                if wid:
                    line += f" [Witness: {wid}]"
                parts.append(line)

    # Conflicts
    if ctx.conflicts:
        conflict_list = ctx.conflicts.get("conflicts") or []
        count = ctx.conflicts.get("conflict_count", len(conflict_list))
        if conflict_list:
            parts.append(f"\n=== CONFLICTS ({count} detected) ===")
            for c in conflict_list[:10]:
                desc     = c.get("description") or c.get("type") or "Unknown conflict"
                severity = c.get("severity", "")
                witnesses = ", ".join(c.get("witnesses") or [])
                parts.append(f"- [{severity}] {desc}" + (f" (between: {witnesses})" if witnesses else ""))

    # Testimonies
    if ctx.testimonies:
        parts.append("\n=== TESTIMONY ANALYSES ===")
        for t in ctx.testimonies:
            wid = t.get("witness_id", "Unknown")
            analysis = t.get("analysis") or {}
            emotion = analysis.get("emotion", "unknown")
            conf    = analysis.get("confidence_level", "unknown")
            signals = analysis.get("uncertainty_signals") or []
            events  = t.get("events") or []
            parts.append(
                f"Witness {wid}: emotion={emotion}, confidence={conf}, "
                f"events extracted={len(events)}, "
                f"uncertainty signals={', '.join(signals[:3]) or 'none'}"
            )

    # Report summary
    if ctx.report:
        summary = ctx.report.get("summary") or ctx.report.get("content") or ""
        if summary:
            parts.append(f"\n=== REPORT SUMMARY ===\n{summary[:600]}")

    if not parts:
        return "No case context has been provided."

    return "\n".join(parts)


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("", response_model=ChatResponse, summary="Ask a question about the case")
async def chat(
    body: ChatRequest,
    llm:  LLMDep,
    _:    CurrentUser,
) -> ChatResponse:
    """
    Answer the investigator's natural-language query strictly from the
    provided case context (timeline, conflicts, testimonies, report).
    Falls back to a keyword-based offline answer if the LLM is unavailable.

    Safety guard: queries are screened before reaching the LLM.
    Blocked queries are refused immediately; exploitative queries are
    rewritten to ethical equivalents.
    """
    # ── Safety gate ───────────────────────────────────────────────────────
    safety_result, safe_query = evaluate_and_rewrite(body.query)

    if safety_result.category == SafetyCategory.BLOCKED:
        logger.warning(
            "Chat query BLOCKED by safety layer",
            reason=safety_result.reason,
            query_preview=body.query[:80],
        )
        return ChatResponse(
            answer=(
                "⛔ This query has been blocked by the safety evaluation layer.\n\n"
                f"**Reason:** {safety_result.reason}\n\n"
                "The Narrative Merge Engine is designed for lawful investigation "
                "assistance only. If you believe this is an error, please "
                "rephrase your question."
            ),
            safety=safety_result.to_dict(),
        )

    context_text = _build_context_block(body.context)

    user_prompt = (
        f"CASE CONTEXT:\n{context_text}\n\n"
        f"INVESTIGATOR QUESTION:\n{safe_query}"
    )

    messages: list[LLMMessage] = [
        LLMMessage(role="system", content=_SYSTEM_PROMPT),
        LLMMessage(role="user",   content=user_prompt),
    ]

    request = LLMRequest(
        messages=messages,
        temperature=0.1,  # Keep temperature low for deterministic JSON
        max_tokens=512,
        extra={"response_format": {"type": "json_object"}}
    )

    logger.info(
        "Chat query received",
        query_preview=safe_query[:80],
        safety_category=safety_result.category.value,
        was_rewritten=safe_query != body.query,
        has_timeline=bool(body.context.timeline),
        has_conflicts=bool(body.context.conflicts),
        testimony_count=len(body.context.testimonies or []),
    )

    try:
        response = await llm.complete(request, task_name="investigation_chat")
        logger.info("Chat response generated", response_length=len(response.content))
        
        try:
            import json
            parsed = json.loads(response.content.strip())
            answer = parsed.get("answer", "Insufficient information available")
            confidence = parsed.get("confidence", "medium")
            evidence = parsed.get("evidence", [])
            if not isinstance(evidence, list):
                evidence = []
        except Exception:
            answer = response.content.strip()
            confidence = "low"
            evidence = []
            
        return ChatResponse(
            answer=answer,
            confidence=confidence,
            evidence=evidence,
            safety=safety_result.to_dict() if safety_result.category != SafetyCategory.SAFE else None,
        )

    except Exception as exc:
        logger.warning(
            "Chat LLM call failed — using offline fallback",
            error=str(exc)[:200],
        )
        # Graceful offline fallback: keyword-match against context text
        answer, confidence, evidence = _offline_fallback(safe_query, body.context, context_text)
        return ChatResponse(answer=answer, confidence=confidence, evidence=evidence)

def _offline_fallback(query: str, ctx: ChatContext, context_text: str) -> tuple[str, str, list[str]]:
    """
    Keyword-based fallback when the LLM is unavailable.
    Searches the context block for relevant sentences and returns
    a transparent message rather than silently failing.
    """
    q = query.lower()

    # Surface relevant lines from the context
    relevant: list[str] = []
    
    # Keep words > 3 chars OR words that contain digits (like '9' or '9pm')
    search_terms = [w for w in q.split() if len(w) > 3 or any(c.isdigit() for c in w)]
    
    for line in context_text.splitlines():
        line = line.strip()
        if not line or line.startswith("==="):
            continue
            
        if any(w in line.lower() for w in search_terms):
            relevant.append(line)

    header = (
        "⚠️ The AI assistant is temporarily unavailable (LLM provider error). "
        "Here is the raw case evidence relevant to your query:\n\n"
    )

    if relevant:
        body_text = "See evidence below."
        confidence = "medium"
        evidence = relevant[:8]
    else:
        body_text = "Insufficient information available"
        confidence = "low"
        evidence = []

    return header + body_text, confidence, evidence

