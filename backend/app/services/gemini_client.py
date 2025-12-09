import os
import json
import re

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment. Please set it in your .env file.")

genai.configure(api_key=API_KEY)


# ------------------------------------------------------
# 1. SCORE ONE ANSWER (used by /api/interview/answer)
# ------------------------------------------------------
async def score_answer_gemini(question: str, transcript: str):
    """
    Calls Gemini to evaluate a single interview answer.
    Returns a dict like:
    {
      "content_score": number,
      "structure_score": number,
      "clarity_score": number,
      "confidence_score": number,
      "feedback": "..."
    }

    This version is tolerant to Gemini returning markdown / extra text.
    """

    model = genai.GenerativeModel("gemini-2.5-flash")

    prompt = f"""
You are an interview evaluator.

Question:
{question}

Candidate answer (transcript):
{transcript}

Rate from 1-10:
- content_score
- structure_score
- clarity_score
- confidence_score

Also include:
- feedback: 3–5 sentences of specific, actionable feedback.

Return ONLY JSON.
Do NOT wrap in markdown.
Do NOT add explanations.
Format:

{{
  "content_score": number,
  "structure_score": number,
  "clarity_score": number,
  "confidence_score": number,
  "feedback": "text"
}}
"""

    response = model.generate_content(prompt)
    text = (response.text or "").strip()

    # 1) Try direct JSON
    try:
        return json.loads(text)
    except Exception:
        pass

    # 2) Try to extract a JSON object from within the text (handles code fences, etc.)
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            pass

    # 3) Fallback if everything fails
    return {
        "content_score": 5,
        "structure_score": 5,
        "clarity_score": 5,
        "confidence_score": 5,
        "feedback": (
            "AI could not reliably parse your answer for detailed scoring. "
            "This usually happens when the spoken answer is very short or "
            "the response format was unexpected."
        ),
    }


# ------------------------------------------------------
# 2. FULL SESSION SUMMARY (used by /api/report)
# ------------------------------------------------------
async def run_gemini_summary(role, seniority, questions, overall):
    """
    Asks Gemini to generate:
      - strengths: list[str]
      - improvements: list[str]
      - summary: str (3–5 sentences)

    Used by the report endpoint.
    """

    model = genai.GenerativeModel("gemini-2.5-flash")

    prompt = f"""
You are an interview coaching assistant.

The candidate interviewed for:
Role: {role}
Seniority: {seniority}

Their average scores were:
- Content: {overall.get('content_score')}
- Structure: {overall.get('structure_score')}
- Clarity: {overall.get('clarity_score')}
- Confidence: {overall.get('confidence_score')}
- Dominant emotion: {overall.get('emotion_summary', {}).get('dominant_emotion')}

Here are per-question results as a JSON-like list (each with question_text, transcript, scores, and expression):
{questions}

Based on this, produce a concise evaluation.

Return ONLY JSON (no markdown, no extra text) in this format:

{{
  "strengths": ["point 1", "point 2", "..."],
  "improvements": ["point 1", "point 2", "..."],
  "summary": "3-5 sentence narrative summary of their performance."
}}
"""

    response = model.generate_content(prompt)
    text = (response.text or "").strip()

    # 1) Try direct JSON
    try:
        return json.loads(text)
    except Exception:
        pass

    # 2) Try extracting JSON block
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            pass

    # 3) Fallback summary
    return {
        "strengths": [
            "Shows potential in answering questions clearly.",
            "Demonstrates some structured thinking in responses.",
        ],
        "improvements": [
            "Add more specific, measurable results to examples.",
            "Improve overall structure using the STAR method consistently.",
        ],
        "summary": (
            "The candidate delivered a generally solid performance with room for growth in "
            "how they structure answers and highlight impact. With practice, they can present "
            "their experience in a more compelling and confident way."
        ),
    }
