# backend/app/services/resume_parser.py

from __future__ import annotations

import os
from typing import Dict, Any

from PyPDF2 import PdfReader
import google.generativeai as genai

from app.core.config import settings


# Configure Gemini once
if not settings.GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is not set in environment/.env")

genai.configure(api_key=settings.GEMINI_API_KEY)


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract raw text from a PDF resume.

    :param file_path: path to the PDF file on disk
    :return: full text as a single string
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Resume file not found: {file_path}")

    reader = PdfReader(file_path)
    pages_text: list[str] = []

    for page in reader.pages:
        text = page.extract_text() or ""
        pages_text.append(text)

    full_text = "\n".join(pages_text).strip()

    if not full_text:
        raise ValueError("No text could be extracted from the resume PDF.")

    return full_text


def extract_structured_profile(resume_text: str) -> Dict[str, Any]:
    """
    Use Gemini to turn the raw resume text into a structured profile.

    This is optional but useful for:
    - better question generation
    - showing 'parsed resume' on the UI
    - analytics/search later

    :param resume_text: text extracted from the resume
    :return: dict with fields like name, title, skills, experience, etc.
    """
    prompt = f"""
    You are a resume parsing engine.

    I will give you the raw text of a candidate's resume.
    Extract a structured JSON object with the following fields:

    - name: string
    - current_title: string
    - total_experience_years: number (approximate if needed)
    - primary_skills: array of strings
    - secondary_skills: array of strings
    - tools_and_technologies: array of strings
    - education: array of objects with fields:
        - degree
        - field_of_study
        - institution
        - graduation_year (if present)
    - experiences: array of objects with fields:
        - company
        - role
        - start_date (string, as in resume)
        - end_date (string, as in resume, or "Present")
        - responsibilities: array of bullet points
    - summary: short 2–3 sentence description of the candidate

    Return ONLY valid JSON. No extra commentary.

    Resume text:
    {resume_text}
    """

    model = genai.GenerativeModel("gemini-2.5-flash-lite")


    response = model.generate_content(prompt)

    raw_text = (response.text or "").strip()

    # Try to parse JSON safely
    import json

    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError:
        # If Gemini returns something slightly off, you can handle or log it.
        # For now, fall back to a minimal structure.
        data = {
            "name": None,
            "current_title": None,
            "total_experience_years": None,
            "primary_skills": [],
            "secondary_skills": [],
            "tools_and_technologies": [],
            "education": [],
            "experiences": [],
            "summary": "",
        }

    return data
