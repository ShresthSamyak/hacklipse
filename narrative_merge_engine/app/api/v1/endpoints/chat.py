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
    role:   str = "assistant"


# ── System prompt ─────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """\
You are an expert forensic investigation assistant for the Narrative Merge Engine.

You help investigators understand testimony evidence by answering their questions
clearly and accurately.

STRICT RULES:
1. ONLY use information explicitly provided in the context below.
2. DO NOT fabricate facts, events, timestamps, or witness statements.
3. If the context does not contain enough information to answer, say so clearly:
   "The available evidence does not provide enough information to answer this."
4. Be concise but thorough. Use bullet points for lists of facts.
5. Reference witnesses by name when citing specific evidence.
6. When discussing conflicts, explain WHAT differs and BETWEEN WHICH witnesses.

You are assisting a real investigator — accuracy is more important than
appearing confident. Uncertainty is always better than fabrication.
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
    """
    context_text = _build_context_block(body.context)

    user_prompt = (
        f"CASE CONTEXT:\n{context_text}\n\n"
        f"INVESTIGATOR QUESTION:\n{body.query}"
    )

    messages: list[LLMMessage] = [
        LLMMessage(role="system", content=_SYSTEM_PROMPT),
        LLMMessage(role="user",   content=user_prompt),
    ]

    request = LLMRequest(
        messages=messages,
        temperature=0.3,
        max_tokens=512,
    )

    logger.info(
        "Chat query received",
        query_preview=body.query[:80],
        has_timeline=bool(body.context.timeline),
        has_conflicts=bool(body.context.conflicts),
        testimony_count=len(body.context.testimonies or []),
    )

    try:
        response = await llm.complete(request, task_name="investigation_chat")
        logger.info("Chat response generated", response_length=len(response.content))
        return ChatResponse(answer=response.content.strip())

    except Exception as exc:
        logger.warning(
            "Chat LLM call failed — using offline fallback",
            error=str(exc)[:200],
        )
        # Graceful offline fallback: keyword-match against context text
        answer = _offline_fallback(body.query, body.context, context_text)
        return ChatResponse(answer=answer)


def _offline_fallback(query: str, ctx: ChatContext, context_text: str) -> str:
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
        body_text = "\n".join(f"• {l}" for l in relevant[:8])
    else:
        body_text = (
            "No directly matching evidence found in the current context. "
            "Try running the pipeline first or rephrasing your query."
        )

    return header + body_text

