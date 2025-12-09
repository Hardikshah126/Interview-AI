import json
from typing import Dict, Any

import google.generativeai as genai

from app.core.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

MODEL_NAME = "gemini-2.5-flash-lite"


EVAL_SYSTEM_PROMPT = """
You are an interview coach evaluating a SINGLE answer.

Return a STRICT JSON object with these keys only:
- content_score: number 0-10
- structure_score: number 0-10
- clarity_score: number 0-10
- confidence_score: number 0-10
- feedback: short paragraph of feedback

content_score: how well the answer actually addresses the question with relevant details.
structure_score: how well the answer is structured (STAR, logical flow).
clarity_score: how clear and easy to follow the answer is.
confidence_score: how confident and assertive the answer sounds (words, tone implied in text).

Do NOT add extra keys or text. Only output valid JSON.
""".strip()


def evaluate_answer(
    question: str,
    answer: str,
    role: str,
    seniority: str,
) -> Dict[str, Any]:
    """
    Use Gemini to evaluate the transcript of an answer and return scores + feedback.
    """

    model = genai.GenerativeModel(MODEL_NAME)

    user_prompt = f"""
Role: {role}
Seniority: {seniority}

Interview question:
{question}

Candidate answer transcript:
{answer}
""".strip()

    response = model.generate_content(
        [
            EVAL_SYSTEM_PROMPT,
            user_prompt,
        ]
    )

    raw_text = (response.text or "").strip()

    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError:
        # Very defensive fallback
        return {
            "content_score": 6.0,
            "structure_score": 6.0,
            "clarity_score": 6.0,
            "confidence_score": 6.0,
            "feedback": (
                "Could not parse AI evaluation JSON. "
                "However, your answer addressed the question reasonably well. "
                "Try to use concrete examples and a clear STAR structure."
            ),
        }

    # Fill missing keys defensively
    return {
        "content_score": float(data.get("content_score", 6.0)),
        "structure_score": float(data.get("structure_score", 6.0)),
        "clarity_score": float(data.get("clarity_score", 6.0)),
        "confidence_score": float(data.get("confidence_score", 6.0)),
        "feedback": str(data.get("feedback", "")),
    }
