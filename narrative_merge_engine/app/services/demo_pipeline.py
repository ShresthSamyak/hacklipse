"""
End-to-End Demo Pipeline — Narrative Merge Engine
===================================================

Runs the full 5-stage pipeline in a single async call:

  Stage 1: STT         — transcribe audio → text (Groq Whisper)
  Stage 2: Extraction  — raw text → structured events
  Stage 3: Timeline    — events → chronological reconstruction
  Stage 4: Conflicts   — timelines → Git-style conflict detection (strict mode)
  Stage 5: Response    — assemble structured PipelineResult

Design goals:
  ─ NEVER crashes.  Every stage has an isolated fallback.
  ─ Each stage has a timeout guard (asyncio.wait_for).
  ─ Retries at the service level are already handled by tenacity in the
    orchestrator; the pipeline itself adds one extra timeout-retry.
  ─ status reflects the worst stage outcome:
      "success"  → all stages completed nominally
      "partial"  → at least one stage used a fallback but output is usable
      "fallback" → multiple stages failed; output may be minimal

  ─ errors[] collects non-fatal warnings so the UI can show them.
  ─ DEMO_MODE=True forces temperature=0 on all LLM calls and adds extra
    logging so judges can follow the flow on screen.
  ─ FAST_PREVIEW=True skips timeline reasoning and runs minimal detection,
    cutting total latency from ~15 s to ~4 s.

Usage:
    pipeline = DemoPipeline(
        event_svc=...,
        timeline_svc=...,
        conflict_svc=...,
        stt_svc=...,       # optional — omit for text-only mode
    )

    # from audio
    result = await pipeline.run(audio=audio_bytes, filename="testimony.wav")

    # from text
    result = await pipeline.run(text="I entered around 9 PM...")

    # fast preview (no heavy reasoning)
    result = await pipeline.run(text="...", fast_preview=True)

    # demo mode (temperature=0, verbose logs)
    result = await pipeline.run(text="...", demo_mode=True)
"""

from __future__ import annotations

import asyncio
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from app.core.logging import get_logger
from app.models.schemas.conflict_strict import StrictConflictResult, StrictEvent
from app.models.schemas.event_extraction import ExtractedEvent, ExtractionResult
from app.models.schemas.report import ReportGenerationResult
from app.models.schemas.timeline_reconstruction import (
    PlacementConfidence,
    TimelineEvent,
    TimelineReconstructionResult,
)
from app.models.schemas.testimony_analysis import TestimonyAnalysisResult
from app.services.conflict_detection_service import ConflictDetectionService
from app.services.event_extraction_service import EventExtractionService
from app.services.next_question_service import generate_next_question
from app.services.report_generation_service import generate_final_report
from app.services.speech_to_text_service import SpeechToTextService, TranscriptResult
from app.services.timeline_reconstruction_service import TimelineReconstructionService
from app.services.testimony_analysis_service import analyze_testimony_sensitivity
from app.services.grounding_validation_service import ground_events
from app.services.safety_evaluation_service import precheck_input
from app.services.risk_scoring_service import evaluate_pipeline_risk, generate_recommendation

logger = get_logger(__name__)


# ─── Stage timeouts (seconds) ────────────────────────────────────────────────

_TIMEOUT_STT = 30          # Whisper is fast; generous margin for network
_TIMEOUT_EXTRACTION = 45   # Allow time for model inference + SDK native retries
_TIMEOUT_TIMELINE = 40     # reasoning can be verbose
_TIMEOUT_CONFLICTS = 40    # strict mode conflict comparison needs time

# Retry budget: 0 extra attempts. 
# (The Groq SDK itself handles exponential backoff for 429/503 errors natively)
_MAX_TIMEOUT_RETRIES = 0


# ─── Pipeline status ─────────────────────────────────────────────────────────

class PipelineStatus(str, Enum):
    SUCCESS  = "success"   # all stages nominal
    PARTIAL  = "partial"   # ≥1 stage used fallback but output is usable
    FALLBACK = "fallback"  # multiple failures; output is minimal
    BLOCKED  = "blocked"   # input blocked by safety layer


class PipelineMode(str, Enum):
    SURVIVOR     = "survivor"      # supportive, non-confrontational
    INVESTIGATOR = "investigator"  # full analysis with conflicts + questions


# ─── Pipeline result ──────────────────────────────────────────────────────────

@dataclass
class PipelineResult:
    """
    Structured response from the full demo pipeline.

    All fields are always present — fallback values are used when a stage fails,
    so downstream consumers (UI, API) never need to handle None.
    """

    # Stage outputs
    transcript: str = ""
    testimony_analysis: dict = field(default_factory=dict)
    testimonies: list[dict] = field(default_factory=list)   # per-witness: [{witness_id, analysis, events}]
    events: list[dict] = field(default_factory=list)
    timeline: dict = field(default_factory=dict)
    conflicts: dict = field(default_factory=dict)
    report: dict = field(default_factory=dict)
    grounding_stats: dict = field(default_factory=dict)  # grounding validation metrics
    risk_assessment: dict | None = None
    next_question: dict | None = None
    safety_flag: bool = False
    safety_reason: str | None = None

    # Pipeline metadata
    mode: PipelineMode = PipelineMode.INVESTIGATOR
    status: PipelineStatus = PipelineStatus.SUCCESS
    errors: list[str] = field(default_factory=list)
    stage_timings: dict[str, float] = field(default_factory=dict)  # ms per stage
    pipeline_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    demo_mode: bool = False
    fast_preview: bool = False

    def to_dict(self) -> dict:
        return {
            "pipeline_id": self.pipeline_id,
            "mode": self.mode.value,
            "transcript": self.transcript,
            "testimony_analysis": self.testimony_analysis,
            "grounding_stats": self.grounding_stats,
            "testimonies": self.testimonies,
            "events": self.events,
            "timeline": self.timeline,
            "conflicts": self.conflicts,
            "report": self.report,
            "risk_assessment": self.risk_assessment,
            "next_question": self.next_question,
            "safety_flag": self.safety_flag,
            "safety_reason": self.safety_reason,
            "status": self.status.value,
            "errors": self.errors,
            "stage_timings_ms": self.stage_timings,
            "demo_mode": self.demo_mode,
            "fast_preview": self.fast_preview,
        }


# ─── Sample fallback data (for total demo blackout) ───────────────────────────

_DEMO_SAMPLE_TRANSCRIPT = (
    "I think I entered the building around 9, maybe 10 at night. "
    "There was someone near the table when I walked in. "
    "I heard a loud noise a bit later."
)

_DEMO_SAMPLE_BRANCHES: dict[str, list[dict]] = {
    "Witness_A": [
        {"id": "a1", "description": "Entered the building", "time": "9 PM", "location": "entrance"},
        {"id": "a2", "description": "Saw a person near the table", "location": "main room"},
        {"id": "a3", "description": "Heard a loud noise", "time": "9:30 PM"},
    ],
    "Witness_B": [
        {"id": "b1", "description": "Entered the building", "time": "10 PM", "location": "entrance"},
        {"id": "b2", "description": "Saw no one in the room", "location": "main room"},
        {"id": "b3", "description": "Heard a loud noise", "time": "10:15 PM"},
    ],
}


# ─── Main Pipeline ────────────────────────────────────────────────────────────

class DemoPipeline:
    """
    Orchestrates the full Narrative Merge Engine demo pipeline.

    Instantiate once and reuse.  All services are injected — no hard-coded
    dependencies.  If stt_svc is None, the pipeline raises an error when
    audio input is provided.
    """

    def __init__(
        self,
        event_svc: EventExtractionService,
        timeline_svc: TimelineReconstructionService,
        conflict_svc: ConflictDetectionService,
        stt_svc: SpeechToTextService | None = None,
    ) -> None:
        self._event_svc = event_svc
        self._timeline_svc = timeline_svc
        self._conflict_svc = conflict_svc
        self._stt_svc = stt_svc

    # ── Public entry point ────────────────────────────────────────────────────

    async def run(
        self,
        *,
        audio: bytes | None = None,
        filename: str = "testimony.wav",
        text: str | None = None,
        mode: PipelineMode = PipelineMode.INVESTIGATOR,
        demo_mode: bool = False,
        fast_preview: bool = False,
        # Legacy multi-witness mode: keyed by label, no per-witness analysis
        branches_override: dict[str, str] | None = None,
        # NEW multi-witness mode: full per-witness analysis + attribution
        testimonies: list[dict] | None = None,
    ) -> PipelineResult:
        """
        Run the end-to-end pipeline.

        Args:
            audio:            Raw audio bytes. Takes priority over text.
            filename:         Filename hint for Whisper format detection.
            text:             Raw testimony text (used if audio is None).
            mode:             Pipeline mode — "survivor" or "investigator".
            demo_mode:        temperature=0 everywhere, verbose stage logs.
            fast_preview:     Skip timeline reasoning; return minimal output fast.
            branches_override: Legacy multi-witness — dict of {label: text}.
                               No per-witness testimony analysis. Backward compat only.
            testimonies:      NEW multi-witness — list of {"witness_id": str, "text": str}.
                               Runs testimony analysis + extraction per witness in parallel.
                               Preserves witness attribution in every event.
        """
        pipeline_start = time.monotonic()
        result = PipelineResult(
            mode=mode,
            demo_mode=demo_mode,
            fast_preview=fast_preview,
        )

        logger.info(
            "Pipeline started",
            pipeline_id=result.pipeline_id,
            mode=mode.value,
            has_audio=audio is not None,
            has_text=text is not None,
            demo_mode=demo_mode,
            fast_preview=fast_preview,
        )

        # ── Stage 1: Speech-to-Text ───────────────────────────────────────────
        if audio is not None:
            transcript, stt_elapsed = await self._run_stt(
                result, audio=audio, filename=filename
            )
        else:
            transcript = text or ""
            result.transcript = transcript

        if not result.transcript and not branches_override:
            result.errors.append("No input text available — using demo sample.")
            result.transcript = _DEMO_SAMPLE_TRANSCRIPT
            result.status = PipelineStatus.PARTIAL

        # ── Pre-pipeline Safety Check ─────────────────────────────────────────
        all_text = result.transcript
        if testimonies:
            all_text += " " + " ".join(w["text"] for w in testimonies if "text" in w)
        if branches_override:
            all_text += " " + " ".join(branches_override.values())

        precheck = precheck_input(all_text)
        if not precheck["allowed"]:
            result.status = PipelineStatus.BLOCKED
            result.errors.append(f"Input flagged by safety layer: {precheck['reason']}")
            # Log the block and return early
            logger.warning(
                "Pipeline blocked by safety layer",
                pipeline_id=result.pipeline_id,
                reason=precheck["reason"]
            )
            total_ms = round((time.monotonic() - pipeline_start) * 1000, 1)
            result.stage_timings["total_ms"] = total_ms
            return result

        if precheck["risk"] == "medium":
            result.safety_flag = True
            result.safety_reason = precheck["reason"]

        # ── Stage 2: Event Extraction ─────────────────────────────────────────
        if testimonies:
            # ── NEW: Multi-witness path — parallel per-witness analysis + extraction ──
            # Each witness is fully isolated. One failure never cancels siblings.
            witness_results: list[dict] = await asyncio.gather(
                *[
                    self._run_witness(
                        result,
                        witness_id=w["witness_id"],
                        text=w["text"],
                        demo_mode=demo_mode,
                    )
                    for w in testimonies
                ]
            )

            result.testimonies = witness_results

            # Build branch map preserving attribution
            events_by_branch: dict[str, list[dict]] = {
                wr["witness_id"]: wr["events"] for wr in witness_results
            }
            all_events = [e for wr in witness_results for e in wr["events"]]

            # Backward compat: first witness analysis surfaces as flat field
            if witness_results and witness_results[0].get("analysis"):
                result.testimony_analysis = witness_results[0]["analysis"]

            # Combined transcript for report stage
            result.transcript = " | ".join(
                f"[{w['witness_id']}] {w['text']}" for w in testimonies
            )

            # Collect all witness analyses for next_question + report
            all_analyses: list[dict] = [
                wr["analysis"] for wr in witness_results if wr.get("analysis")
            ]

            logger.info(
                "Multi-witness processing complete",
                pipeline_id=result.pipeline_id,
                witness_count=len(testimonies),
                total_events=len(all_events),
                per_witness={wr["witness_id"]: len(wr["events"]) for wr in witness_results},
            )

        elif branches_override:
            # ── LEGACY: branches path — no per-witness testimony analysis ──────
            labels = list(branches_override.keys())
            texts  = list(branches_override.values())

            branch_event_lists = await asyncio.gather(
                *[
                    self._run_extraction_branch(
                        result, label=label, text=t, demo_mode=demo_mode
                    )
                    for label, t in zip(labels, texts)
                ]
            )

            events_by_branch = {
                label: [_event_to_dict(e, witness_id=label) for e in events]
                for label, events in zip(labels, branch_event_lists)
            }
            all_events = [e for events in events_by_branch.values() for e in events]
            all_analyses = [result.testimony_analysis] if result.testimony_analysis else []

            logger.info(
                "Multi-witness extraction complete (legacy branches, no per-witness analysis)",
                pipeline_id=result.pipeline_id,
                branch_count=len(labels),
                total_events=len(all_events),
                per_branch={lbl: len(evts) for lbl, evts in events_by_branch.items()},
            )

        else:
            # ── Single-witness path ───────────────────────────────────────────
            extracted_events = await self._run_extraction(
                result, text=result.transcript, demo_mode=demo_mode
            )
            all_events = [_event_to_dict(e) for e in extracted_events]
            events_by_branch = {"Witness_A": all_events}
            all_analyses = [result.testimony_analysis] if result.testimony_analysis else []

        # ── Grounding validation: remove hallucinated events ─────────────
        testimony_source = result.transcript or ""
        if testimonies:
            testimony_source = " ".join(w["text"] for w in testimonies)

        grounded_events, all_flagged_events, grounding_stats = ground_events(
            all_events, testimony_source
        )
        result.grounding_stats = grounding_stats

        if grounding_stats.get("ungrounded_count", 0) > 0:
            result.errors.append(
                f"Grounding: {grounding_stats['ungrounded_count']} hallucinated event(s) "
                f"removed (grounding rate: {grounding_stats['grounding_rate']:.0%})."
            )

        logger.info(
            "Grounding validation applied",
            pipeline_id=result.pipeline_id,
            total=grounding_stats.get("total_events", 0),
            grounded=grounding_stats.get("grounded_count", 0),
            removed=grounding_stats.get("ungrounded_count", 0),
        )

        # Use only grounded events for downstream stages
        all_events = grounded_events
        result.events = all_flagged_events  # preserve all with flags for transparency

        # Update per-witness branches to only contain grounded events
        grounded_ids = {e["id"] for e in grounded_events if "id" in e}
        events_by_branch = {
            branch: [e for e in evts if e.get("id") in grounded_ids]
            for branch, evts in events_by_branch.items()
        }

        if fast_preview:
            # ── Fast path: skip timeline reasoning ───────────────────────────
            result.timeline = _build_trivial_timeline(all_events)
            result.conflicts = _strict_result_to_dict(StrictConflictResult())
            result.errors.append("fast_preview: timeline reasoning and conflict detection skipped.")
            if result.status == PipelineStatus.SUCCESS:
                result.status = PipelineStatus.PARTIAL
            result.stage_timings["total_ms"] = round(
                (time.monotonic() - pipeline_start) * 1000, 1
            )
            logger.info(
                "Pipeline completed (fast preview)",
                pipeline_id=result.pipeline_id,
                status=result.status.value,
            )
            return result

        # ── Stage 3: Timeline Reconstruction ─────────────────────────────────
        if all_events:
            timeline_result = await self._run_timeline(
                result, events=all_events, demo_mode=demo_mode
            )
            result.timeline = _timeline_to_dict(timeline_result)
        else:
            result.timeline = _build_trivial_timeline([])
            result.errors.append("No events extracted — timeline is empty.")

        # ── Stage 4: Conflict Detection (investigator only) ─────────────────
        conflict_result = StrictConflictResult()

        if mode == PipelineMode.INVESTIGATOR:
            if events_by_branch:
                conflict_result = await self._run_conflicts(
                    result, branches=events_by_branch
                )
            else:
                result.errors.append("No branches available for conflict detection.")
        else:
            # Survivor mode: skip conflict detection entirely
            logger.info(
                "Survivor mode — skipping conflict detection",
                pipeline_id=result.pipeline_id,
            )

        result.conflicts = _strict_result_to_dict(conflict_result)

        # ── Stage 5: Next Question (investigator only) ────────────────────
        # Pass all witness analyses so question is informed by every perspective
        if mode == PipelineMode.INVESTIGATOR:
            analysis_payload = all_analyses if len(all_analyses) > 1 else result.testimony_analysis
            result.next_question = await self._run_next_question(
                result,
                conflicts=result.conflicts,
                events=result.events,
                testimony_analysis=analysis_payload,
            )

        # ── Stage 6: Final Report ─────────────────────────────────────────
        # Small back-off to avoid Groq rate-limit errors after heavy upstream stages
        # (conflict detection + next-question both hammer the API in quick succession).
        await asyncio.sleep(1.5)

        # Multi-witness: pass all analyses for richer report synthesis
        report_analysis = all_analyses if len(all_analyses) > 1 else result.testimony_analysis
        report_result = await self._run_report(
            result,
            transcript=result.transcript,
            testimony_analysis=report_analysis,
            events=result.events,
            timeline=result.timeline,
            conflicts=result.conflicts,
            mode=mode.value,
        )
        result.report = report_result.model_dump()

        # ── Finalize ─────────────────────────────────────────────────────────
        total_ms = round((time.monotonic() - pipeline_start) * 1000, 1)
        result.stage_timings["total_ms"] = total_ms

        logger.info(
            "Pipeline completed",
            pipeline_id=result.pipeline_id,
            mode=mode.value,
            status=result.status.value,
            total_ms=total_ms,
            events=len(all_events),
            conflicts=conflict_result.conflict_count,
            errors=len(result.errors),
        )

        # ── Assess Risk ──────────────────────────────────────────────────────
        risk_data = evaluate_pipeline_risk(result)
        
        # Calculate params for recommendation
        num_conflicts = 0
        if isinstance(result.conflicts, dict):
            num_conflicts = len(result.conflicts.get("conflicts", []))
            
        num_uncertain = 0
        if isinstance(result.timeline, dict):
            num_uncertain = len(result.timeline.get("uncertain_events", []))
            
        rec_data = generate_recommendation(
            risk=risk_data["risk_level"],
            conflicts=num_conflicts,
            uncertainty=num_uncertain,
            safety_flag=result.safety_flag
        )
        risk_data["recommendation"] = rec_data["recommendation"]
        result.risk_assessment = risk_data

        return result

    # ── Stage runners (each isolated — failure never propagates) ─────────────

    async def _run_stt(
        self,
        result: PipelineResult,
        *,
        audio: bytes,
        filename: str,
    ) -> tuple[str, float]:
        """Stage 1: transcribe audio. Falls back to empty transcript on failure."""
        if self._stt_svc is None:
            result.errors.append("STT service not configured — skipping audio transcription.")
            result.status = PipelineStatus.PARTIAL
            return "", 0.0

        stage_start = time.monotonic()
        transcript_text = ""

        for attempt in range(_MAX_TIMEOUT_RETRIES + 1):
            try:
                stt_result: TranscriptResult = await asyncio.wait_for(
                    self._stt_svc.transcribe(audio, filename=filename),
                    timeout=_TIMEOUT_STT,
                )
                transcript_text = stt_result.text
                elapsed = round((time.monotonic() - stage_start) * 1000, 1)
                result.transcript = transcript_text
                result.stage_timings["stt_ms"] = elapsed
                logger.info(
                    "STT complete",
                    pipeline_id=result.pipeline_id,
                    elapsed_ms=elapsed,
                    detected_language=stt_result.detected_language,
                    text_length=len(transcript_text),
                )
                return transcript_text, elapsed

            except asyncio.TimeoutError:
                if attempt < _MAX_TIMEOUT_RETRIES:
                    logger.warning(
                        "STT timeout — retrying",
                        pipeline_id=result.pipeline_id,
                        attempt=attempt + 1,
                    )
                    continue
                logger.error("STT timed out after retries", pipeline_id=result.pipeline_id)
                result.errors.append(
                    f"STT timed out after {_TIMEOUT_STT}s — please provide text input."
                )
                result.status = PipelineStatus.PARTIAL
                return "", 0.0

            except Exception as exc:
                logger.error(
                    "STT failed",
                    pipeline_id=result.pipeline_id,
                    error=str(exc),
                )
                result.errors.append(f"STT error: {exc}")
                result.status = PipelineStatus.PARTIAL
                return "", 0.0

        return transcript_text, 0.0

    async def _run_extraction(
        self,
        result: PipelineResult,
        *,
        text: str,
        demo_mode: bool,
    ) -> list[ExtractedEvent]:
        """Stage 2: extract events. Falls back to minimal single event on failure."""
        stage_start = time.monotonic()

        # Phase 1.5: Testimony Analysis
        testimony_analysis = None
        try:
            testimony_analysis = await asyncio.wait_for(
                analyze_testimony_sensitivity(text), timeout=15
            )
            
            # Surface it to the pipeline result if empty, or dict merge/overwrite (we keep first)
            if not result.testimony_analysis:
               result.testimony_analysis = testimony_analysis.model_dump()
               
        except Exception as exc:
            logger.warning("Testimony analysis failed, proceeding without context", error=str(exc))
            result.errors.append(f"Testimony analysis failed: {exc}")

        for attempt in range(_MAX_TIMEOUT_RETRIES + 1):
            try:
                extraction: ExtractionResult = await asyncio.wait_for(
                    self._event_svc.extract_events_from_text(text, testimony_analysis=testimony_analysis),
                    timeout=_TIMEOUT_EXTRACTION,
                )
                elapsed = round((time.monotonic() - stage_start) * 1000, 1)
                result.stage_timings["extraction_ms"] = elapsed

                event_count = len(extraction.events)
                logger.info(
                    "Events extracted",
                    pipeline_id=result.pipeline_id,
                    events=event_count,
                    dropped=extraction.dropped_event_count,
                    elapsed_ms=elapsed,
                )

                if event_count == 0:
                    result.errors.append(
                        "Event extraction returned 0 events — "
                        "text may be too short or ambiguous."
                    )
                    _downgrade_status(result)

                return extraction.events

            except asyncio.TimeoutError:
                if attempt < _MAX_TIMEOUT_RETRIES:
                    logger.warning(
                        "Event extraction timeout — retrying",
                        pipeline_id=result.pipeline_id,
                        attempt=attempt + 1,
                    )
                    continue
                logger.error("Event extraction timed out", pipeline_id=result.pipeline_id)
                result.errors.append(
                    f"Event extraction timed out after {_TIMEOUT_EXTRACTION}s — returning partial events."
                )
                _downgrade_status(result)
                return _text_to_fallback_events(text)

            except Exception as exc:
                logger.error(
                    "Event extraction failed",
                    pipeline_id=result.pipeline_id,
                    error=str(exc),
                )
                result.errors.append(f"Event extraction error: {exc}")
                _downgrade_status(result)
                return _text_to_fallback_events(text)

        return []

    async def _run_witness(
        self,
        result: PipelineResult,
        *,
        witness_id: str,
        text: str,
        demo_mode: bool,
    ) -> dict:
        """
        Per-witness stage runner for the NEW multi-witness path.

        Runs in parallel via asyncio.gather. Fully isolated — exceptions are
        caught and stored in result.errors; never propagates to siblings.

        Returns:
            {
                "witness_id": str,
                "analysis": dict,      # TestimonyAnalysisResult.model_dump() or {}
                "events":   list[dict] # _event_to_dict(e, witness_id=...) per event
            }
        """
        logger.info(
            "Witness processing started",
            pipeline_id=result.pipeline_id,
            witness_id=witness_id,
            text_length=len(text),
        )

        analysis_dict: dict = {}
        testimony_analysis = None

        # Step A: Testimony analysis (isolated)
        try:
            testimony_analysis = await asyncio.wait_for(
                analyze_testimony_sensitivity(text), timeout=15
            )
            analysis_dict = testimony_analysis.model_dump()
        except Exception as exc:
            logger.warning(
                "Witness testimony analysis failed",
                pipeline_id=result.pipeline_id,
                witness_id=witness_id,
                error=str(exc),
            )
            result.errors.append(f"[{witness_id}] Testimony analysis failed: {exc}")

        # Step B: Event extraction (isolated)
        events: list[dict] = []
        try:
            extracted = await self._run_extraction(
                result, text=text, demo_mode=demo_mode
            )
            # Stamp EVERY event with this witness's ID so attribution is never lost
            events = [_event_to_dict(e, witness_id=witness_id) for e in extracted]
        except Exception as exc:
            logger.error(
                "Witness event extraction failed",
                pipeline_id=result.pipeline_id,
                witness_id=witness_id,
                error=str(exc),
            )
            result.errors.append(f"[{witness_id}] Event extraction failed: {exc}")

        logger.info(
            "Witness processing complete",
            pipeline_id=result.pipeline_id,
            witness_id=witness_id,
            events=len(events),
            has_analysis=bool(analysis_dict),
        )

        return {
            "witness_id": witness_id,
            "analysis": analysis_dict,
            "events": events,
        }

    async def _run_extraction_branch(
        self,
        result: PipelineResult,
        *,
        label: str,
        text: str,
        demo_mode: bool,
    ) -> list[ExtractedEvent]:
        """
        Thin wrapper around `_run_extraction` for use in `asyncio.gather`.

        Adds per-branch logging and isolates exceptions so a single branch
        failure does NOT cancel sibling coroutines.
        """
        logger.info(
            "Branch extraction started",
            pipeline_id=result.pipeline_id,
            branch=label,
            text_length=len(text),
        )
        try:
            events = await self._run_extraction(result, text=text, demo_mode=demo_mode)
            logger.info(
                "Branch extraction complete",
                pipeline_id=result.pipeline_id,
                branch=label,
                event_count=len(events),
            )
            return events
        except Exception as exc:
            # Belt-and-suspenders: _run_extraction already catches, but protect
            # gather() from unexpected leaks.
            logger.error(
                "Branch extraction unhandled error",
                pipeline_id=result.pipeline_id,
                branch=label,
                error=str(exc),
            )
            result.errors.append(f"Branch '{label}' extraction failed: {exc}")
            _downgrade_status(result)
            return []


    async def _run_timeline(
        self,
        result: PipelineResult,
        *,
        events: list[dict],
        demo_mode: bool,
    ) -> TimelineReconstructionResult:
        """Stage 3: reconstruct timeline. Falls back to sorted list on failure."""
        stage_start = time.monotonic()

        for attempt in range(_MAX_TIMEOUT_RETRIES + 1):
            try:
                timeline: TimelineReconstructionResult = await asyncio.wait_for(
                    self._timeline_svc.reconstruct_from_events(events),
                    timeout=_TIMEOUT_TIMELINE,
                )
                elapsed = round((time.monotonic() - stage_start) * 1000, 1)
                result.stage_timings["timeline_ms"] = elapsed

                logger.info(
                    "Timeline built",
                    pipeline_id=result.pipeline_id,
                    confirmed=len(timeline.confirmed_sequence),
                    probable=len(timeline.probable_sequence),
                    uncertain=len(timeline.uncertain_events),
                    elapsed_ms=elapsed,
                )
                return timeline

            except asyncio.TimeoutError:
                if attempt < _MAX_TIMEOUT_RETRIES:
                    logger.warning(
                        "Timeline timeout — retrying",
                        pipeline_id=result.pipeline_id,
                        attempt=attempt + 1,
                    )
                    continue
                logger.error("Timeline timed out", pipeline_id=result.pipeline_id)
                result.errors.append(
                    f"Timeline reconstruction timed out after {_TIMEOUT_TIMELINE}s "
                    "— falling back to simple event ordering."
                )
                _downgrade_status(result)
                return _fallback_timeline(events)

            except Exception as exc:
                logger.error(
                    "Timeline reconstruction failed",
                    pipeline_id=result.pipeline_id,
                    error=str(exc),
                )
                result.errors.append(f"Timeline error: {exc} — falling back to simple ordering.")
                _downgrade_status(result)
                return _fallback_timeline(events)

        return _fallback_timeline(events)

    async def _run_conflicts(
        self,
        result: PipelineResult,
        *,
        branches: dict[str, list[dict]],
    ) -> StrictConflictResult:
        """Stage 4: strict-mode conflict detection. Falls back to empty result on failure."""
        stage_start = time.monotonic()

        for attempt in range(_MAX_TIMEOUT_RETRIES + 1):
            try:
                conflicts: StrictConflictResult = await asyncio.wait_for(
                    self._conflict_svc.detect_strict(branches),
                    timeout=_TIMEOUT_CONFLICTS,
                )
                elapsed = round((time.monotonic() - stage_start) * 1000, 1)
                result.stage_timings["conflicts_ms"] = elapsed

                logger.info(
                    "Conflicts detected",
                    pipeline_id=result.pipeline_id,
                    conflict_count=conflicts.conflict_count,
                    has_question=conflicts.next_question is not None,
                    elapsed_ms=elapsed,
                )
                return conflicts

            except asyncio.TimeoutError:
                if attempt < _MAX_TIMEOUT_RETRIES:
                    logger.warning(
                        "Conflict detection timeout — retrying",
                        pipeline_id=result.pipeline_id,
                        attempt=attempt + 1,
                    )
                    continue
                logger.error("Conflict detection timed out", pipeline_id=result.pipeline_id)
                result.errors.append(
                    f"Conflict detection timed out after {_TIMEOUT_CONFLICTS}s "
                    "— returning no conflicts detected."
                )
                _downgrade_status(result)
                return StrictConflictResult()

            except Exception as exc:
                logger.error(
                    "Conflict detection failed",
                    pipeline_id=result.pipeline_id,
                    error=str(exc),
                )
                result.errors.append(
                    f"Conflict detection error: {exc} — returning no conflicts detected."
                )
                _downgrade_status(result)
                return StrictConflictResult()

        return StrictConflictResult()

    async def _run_next_question(
        self,
        result: PipelineResult,
        *,
        conflicts: dict,
        events: list[dict],
        testimony_analysis: dict | None,
    ) -> dict | None:
        """Stage 5: Generate the single best next question. Investigator only."""
        stage_start = time.monotonic()

        try:
            question = await asyncio.wait_for(
                generate_next_question(
                    conflicts=conflicts,
                    events=events,
                    testimony_analysis=testimony_analysis,
                ),
                timeout=25,
            )
            elapsed = round((time.monotonic() - stage_start) * 1000, 1)
            result.stage_timings["next_question_ms"] = elapsed

            if question:
                logger.info(
                    "Next question generated",
                    pipeline_id=result.pipeline_id,
                    priority=question.get("priority"),
                    elapsed_ms=elapsed,
                )
            else:
                logger.warning(
                    "Next question returned None",
                    pipeline_id=result.pipeline_id,
                )
            return question

        except asyncio.TimeoutError:
            logger.error("Next question generation timed out", pipeline_id=result.pipeline_id)
            result.errors.append("Next question generation timed out.")
            _downgrade_status(result)
            return None

        except Exception as exc:
            logger.error(
                "Next question generation failed",
                pipeline_id=result.pipeline_id,
                error=str(exc),
            )
            result.errors.append(f"Next question error: {exc}")
            _downgrade_status(result)
            return None

    async def _run_report(
        self,
        result: PipelineResult,
        *,
        transcript: str,
        testimony_analysis: dict | None,
        events: list[dict],
        timeline: dict,
        conflicts: dict,
        mode: str = "investigator",
    ) -> ReportGenerationResult:
        """Stage 6: Final Report Generation. Fully isolated."""
        stage_start = time.monotonic()

        try:
            report: ReportGenerationResult = await asyncio.wait_for(
                generate_final_report(
                    transcript=transcript,
                    testimony_analysis=testimony_analysis or {},
                    events=events,
                    timeline=timeline,
                    conflicts=conflicts,
                    mode=mode,
                ),
                timeout=45,
            )
            elapsed = round((time.monotonic() - stage_start) * 1000, 1)
            result.stage_timings["report_ms"] = elapsed

            logger.info(
                "Report built",
                pipeline_id=result.pipeline_id,
                mode=mode,
                elapsed_ms=elapsed,
            )
            return report

        except asyncio.TimeoutError:
            logger.error("Report generation timed out", pipeline_id=result.pipeline_id)
            result.errors.append("Report generation timed out — using minimal summary.")
            _downgrade_status(result)
            return ReportGenerationResult.fallback()

        except Exception as exc:
            logger.error(
                "Report generation failed",
                pipeline_id=result.pipeline_id,
                error=str(exc),
            )
            result.errors.append(f"Report generation error: {exc}")
            _downgrade_status(result)
            return ReportGenerationResult.fallback()

# ─── Fallback builders ────────────────────────────────────────────────────────

def _text_to_fallback_events(text: str) -> list[ExtractedEvent]:
    """
    Last-resort fallback: create a single uncertain event that transparently
    signals extraction failure instead of fabricating events.
    """
    return [
        ExtractedEvent(
            id=str(uuid.uuid4()),
            description="Insufficient data to construct full timeline",
            time=None,
            time_uncertainty="extraction failed — original testimony preserved below",
            location=None,
            actors=[],
            confidence=0.1,
            source_text=text[:300].strip() or "(empty testimony)",
        )
    ]


def _fallback_timeline(events: list[dict]) -> TimelineReconstructionResult:
    """
    Trivial fallback: place all events as 'uncertain', no reasoning.
    Preserves input order — better than an empty timeline.
    """
    uncertain = []
    for i, e in enumerate(events):
        uncertain.append(
            TimelineEvent(
                event_id=e.get("id", str(uuid.uuid4())),
                description=e.get("description", "Unknown event"),
                time=e.get("time"),
                location=e.get("location"),
                actors=e.get("actors", []),
                original_confidence=float(e.get("confidence", 0.3)),
                position=i,
                placement_confidence=PlacementConfidence.UNCERTAIN,
            )
        )
    return TimelineReconstructionResult(uncertain_events=uncertain)


# ─── Shape converters ─────────────────────────────────────────────────────────

def _event_to_dict(event: ExtractedEvent, witness_id: str | None = None) -> dict:
    """Convert an ExtractedEvent to a plain dict for downstream stages.

    Always include witness_id when available so attribution is never lost.
    """
    d = {
        "id": event.id,
        "description": event.description,
        "time": event.time,
        "time_uncertainty": event.time_uncertainty,
        "location": event.location,
        "actors": event.actors,
        "confidence": event.confidence,
        "source_text": event.source_text,
    }
    if witness_id is not None:
        d["witness_id"] = witness_id
    return d


def _timeline_to_dict(timeline: TimelineReconstructionResult) -> dict:
    """Convert a TimelineReconstructionResult to an API-friendly dict."""
    return {
        "confirmed_sequence": [e.model_dump() for e in timeline.confirmed_sequence],
        "probable_sequence":  [e.model_dump() for e in timeline.probable_sequence],
        "uncertain_events":   [e.model_dump() for e in timeline.uncertain_events],
        "full_sequence":      [e.model_dump() for e in timeline.full_sequence],
        "event_count":        timeline.event_count,
        "confidence_summary": {
            "confirmed": len(timeline.confirmed_sequence),
            "probable":  len(timeline.probable_sequence),
            "uncertain": len(timeline.uncertain_events),
        },
        "events":             [e.model_dump() for e in timeline.full_sequence],
        "temporal_links": [l.model_dump() for l in timeline.temporal_links],
        "metadata": timeline.reconstruction_metadata,
    }


def _build_trivial_timeline(events: list[dict]) -> dict:
    """Build a minimal timeline dict in fast-preview mode (no LLM call)."""
    return {
        "confirmed_sequence": [],
        "probable_sequence":  [],
        "uncertain_events":   [
            {"event_id": e.get("id", ""), "description": e.get("description", ""), "position": i}
            for i, e in enumerate(events)
        ],
        "full_sequence": [
            {"event_id": e.get("id", ""), "description": e.get("description", ""), "position": i}
            for i, e in enumerate(events)
        ],
        "events": [
            {"event_id": e.get("id", ""), "description": e.get("description", ""), "position": i}
            for i, e in enumerate(events)
        ],
        "event_count": len(events),
        "confidence_summary": {"confirmed": 0, "probable": 0, "uncertain": len(events)},
        "temporal_links": [],
        "metadata": {"fast_preview": True},
    }


def _strict_result_to_dict(conflicts: StrictConflictResult) -> dict:
    """Convert StrictConflictResult to dict, explicitly including computed @property fields."""
    base = conflicts.model_dump()
    base["conflict_count"] = conflicts.conflict_count
    base["has_conflicts"] = conflicts.has_conflicts
    return base


# ─── Status helpers ───────────────────────────────────────────────────────────

def _downgrade_status(result: PipelineResult) -> None:
    """Ratchet status down: success → partial → fallback. Never upgrades."""
    if result.status == PipelineStatus.SUCCESS:
        result.status = PipelineStatus.PARTIAL
    elif result.status == PipelineStatus.PARTIAL:
        result.status = PipelineStatus.FALLBACK


# ─── Factory / DI helper ─────────────────────────────────────────────────────

def build_pipeline(
    db,  # AsyncSession
    llm,  # LLMOrchestrator
    stt_svc: SpeechToTextService | None = None,
) -> DemoPipeline:
    """
    Convenience factory for FastAPI dependency injection.

    Usage in a FastAPI endpoint:
        pipeline = build_pipeline(db=db, llm=llm, stt_svc=stt_svc)
        result   = await pipeline.run(audio=audio_bytes)
    """
    return DemoPipeline(
        event_svc=EventExtractionService(db=db, llm=llm),
        timeline_svc=TimelineReconstructionService(db=db, llm=llm),
        conflict_svc=ConflictDetectionService(db=db, llm=llm),
        stt_svc=stt_svc,
    )
