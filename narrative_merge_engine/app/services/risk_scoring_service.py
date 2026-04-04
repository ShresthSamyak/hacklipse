"""
Risk Assessment Service
=======================

Evaluates the overall reliability and conflicting nature of a pipeline run.
Outputs a simple risk level (low, medium, high) to help investigators assess case reliability.
"""

from app.models.schemas.timeline_reconstruction import TimelineReconstructionResult
from typing import Any

def evaluate_pipeline_risk(result: Any) -> dict:
    """
    Evaluates the pipeline run and assigns a risk score.
    
    1. number of conflicts
    2. uncertainty levels 
    3. missing data (ungrounded events / empty timeline)
    """
    # 1. Evaluate Conflicts
    num_conflicts = 0
    if isinstance(result.conflicts, dict):
        num_conflicts = len(result.conflicts.get("conflicts", []))
        
    # 2. Evaluate Uncertainty
    num_uncertain = 0
    total_events = 0
    if isinstance(result.timeline, dict):
        num_uncertain = len(result.timeline.get("uncertain_events", []))
        total_events = result.timeline.get("event_count", 0)

    # 3. Evaluate Missing Data / Grounding
    num_hallucinated = 0
    if isinstance(result.grounding_stats, dict):
        num_hallucinated = result.grounding_stats.get("ungrounded_count", 0)
        
    # Heuristics
    # HIGH: 2+ conflicts, or >50% events are uncertain, or 3+ hallucinated events
    # MEDIUM: 1 conflict, or >20% events are uncertain, or 1-2 hallucinated events
    # LOW: 0 conflicts, mostly solid events, no hallucinations
    
    if total_events == 0:
        return {
            "risk_level": "none",
            "explanation": "No events found to assess."
        }

    uncertainty_ratio = num_uncertain / total_events if total_events > 0 else 0

    if num_conflicts >= 2 or uncertainty_ratio > 0.5 or num_hallucinated >= 3:
        level = "high"
        explanation = f"Conflicting narratives detected ({num_conflicts} conflicts)." if num_conflicts >= 2 else (
            f"High uncertainty in timeline ({num_uncertain} uncertain events)." if uncertainty_ratio > 0.5 else
            f"Significant hallucination risk ({num_hallucinated} ungrounded events removed)."
        )
    elif num_conflicts == 1 or uncertainty_ratio > 0.2 or num_hallucinated > 0:
        level = "medium"
        explanation = f"Some uncertainty present."
        if num_conflicts == 1:
            explanation = "One conflict detected between witnesses."
        elif num_hallucinated > 0:
            explanation = f"Minor hallucination risk ({num_hallucinated} events removed)."
    else:
        level = "low"
        explanation = "Clear timeline with no major conflicts."

    return {
        "risk_level": level,
        "explanation": explanation
    }

def generate_recommendation(risk: str, conflicts: int, uncertainty: int, safety_flag: bool) -> dict:
    """
    Generates a recommended action for the investigator based on pipeline heuristics.
    """
    risk = risk.lower()
    rec = ""
    
    if risk == "high":
        rec = "Manual review required. Do not rely on automated conclusions."
    elif risk == "medium":
        rec = "Proceed with caution. Verify conflicting statements."
    elif risk == "low":
        rec = "Timeline is reliable. Safe to proceed with analysis."
        
    if safety_flag is True:
        if rec:
            rec += " "
        rec += "Sensitive testimony detected — handle with care."
        
    return {"recommendation": rec}
