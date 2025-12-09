# backend/app/services/question_gen.py

from __future__ import annotations

import google.generativeai as genai

from app.core.config import settings

# Configure Gemini once
if not settings.GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is not set in environment/.env")

genai.configure(api_key=settings.GEMINI_API_KEY)


def generate_questions(
    resume_text: str,
    role: str,
    seniority: str,
    num_questions: int = 5,
) -> list[str]:
    """
    Use Gemini to generate personalized interview questions
    based on the candidate's resume, role, and seniority.
    """

    prompt = f"""
    You are an expert technical + behavioral interviewer.

    Candidate resume:
    {resume_text}

    Target role: {role}
    Seniority level: {seniority}

    Task:
    - Generate {num_questions} interview questions.
    - Mix of:
        - behavioral questions,
        - role-specific technical or domain questions,
        - a couple of deep-dive questions about their past projects.
    - Questions should be concise and clear.
    - Do NOT number them with 1., 2., etc.
    - Return them as a plain list, one question per line.

    Output format example:
    Why are you interested in this role at our company?
    Tell me about a challenging project you worked on...
    ...
    """

    model = genai.GenerativeModel("gemini-2.5-flash-lite")

    response = model.generate_content(prompt)

    raw = (response.text or "").strip()

    # Split into lines and clean
    lines = [line.strip() for line in raw.split("\n") if line.strip()]

    # Remove leading numbering like "1.", "Q1:", etc.
    cleaned_questions: list[str] = []
    for line in lines:
        # common patterns: "1. question", "1) question", "Q1: question"
        for prefix in ["Q:", "Q1:", "Q.", "Q)"]:
            if line.startswith(prefix):
                line = line[len(prefix):].strip()

        # remove numeric prefixes
        # e.g., "1. ", "2) ", "3 - "
        import re

        line = re.sub(r"^[0-9]+[\.\-\)]\s*", "", line).strip()
        cleaned_questions.append(line)

    # Keep only up to num_questions
    if len(cleaned_questions) < num_questions and len(cleaned_questions) > 0:
        # if Gemini returns fewer, it's fine; just use what we got
        return cleaned_questions
    else:
        return cleaned_questions[:num_questions]
