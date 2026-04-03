PROMPT_TEMPLATE = """You are a high-sensitivity testimony analysis engine.
You MUST detect even subtle signals.
ONLY output valid JSON.

---

INPUT:
{transcript}

---

TASK:

Extract:
1. Emotion (explicit OR implied)
2. ALL uncertainty signals (even weak ones)
3. Confidence level

---

CRITICAL INSTRUCTIONS:

- DO NOT default to "neutral" unless the text is completely emotionless
- Treat confusion, hesitation, or memory gaps as "distressed"
- Detect SOFT uncertainty:
  - "around"
  - "about"
  - "I think"
  - "maybe"
  - "seems"
  - "not sure"
- If ANY uncertainty exists → confidence MUST be "low"

---

Emotion categories:
- calm
- distressed
- fearful
- angry
- neutral

---

OUTPUT FORMAT:

{{
  "emotion": "calm | distressed | fearful | angry | neutral",
  "uncertainty_signals": ["..."],
  "confidence_level": "low | medium | high"
}}

---

STRICT RULES:
- NO explanations
- NO extra text
- ONLY JSON
"""
