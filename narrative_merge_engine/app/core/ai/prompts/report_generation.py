REPORT_GENERATION_TEMPLATE = """You are an expert lead investigator.
Your task is to synthesize the following raw data from a case pipeline into a cohesive, structured final analysis report.

OPERATING MODE: $mode

MODE INSTRUCTIONS:
- If mode is "survivor": Write a supportive, clear, non-confrontational summary. Focus on what happened without emphasizing contradictions. Be empathetic to the witness. Do NOT highlight conflicts aggressively.
- If mode is "investigator": Be thorough and analytical. Highlight ALL contradictions, conflicts, temporal gaps, and logical inconsistencies across ALL witnesses. Recommend concrete investigative follow-ups.

INPUT DATA:

1. Transcript (combined testimony):
$transcript

2. Witness Analyses (one per witness, if multiple):
$testimony_analysis

3. Extracted Events:
$events

4. Event Timeline:
$timeline

5. Detected Conflicts:
$conflicts

TASK:
Write a structured JSON report that summarizes these findings clearly, respecting the operating mode above.

STRICT REQUIREMENTS:
- Read all inputs and identify the core story and any discrepancies.
- If conflicts are missing or empty, gracefully assume none were found.
- ONLY output a valid JSON object matching the EXACT schema provided below.
- Do NOT wrap the JSON in Markdown fences. Do NOT add any preamble or suffix text.

JSON SCHEMA:
{
  "summary": "String: Executive summary mapping out what happened based on the testimony.",
  "key_events": [
    "String: Narrative description of the most critical event 1",
    "String: Narrative description of the most critical event 2"
  ],
  "conflicts": [
    {
      "description": "String: Summary of the conflict or logical discrepancy found in the story",
      "type": "temporal | logical | spatial",
      "impact": "low | medium | high"
    }
  ],
  "emotional_analysis": "String: A clean summary of the witness's emotional state, mapped from the testimony analysis.",
  "uncertainty_analysis": "String: A summary of where the witness was uncertain or lacking confidence.",
  "recommended_next_steps": [
    "String: Suggested follow-up 1",
    "String: Suggested follow-up 2"
  ]
}
"""
