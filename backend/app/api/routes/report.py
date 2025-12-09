# backend/app/api/routes/report.py

import os
import json
from typing import Dict, Any, List
from io import BytesIO

from fastapi import APIRouter, HTTPException, Response

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from app.services.gemini_client import run_gemini_summary

router = APIRouter()

SESSIONS_DIR = "sessions"
os.makedirs(SESSIONS_DIR, exist_ok=True)


def _load_session(session_id: str) -> Dict[str, Any]:
    session_path = os.path.join(SESSIONS_DIR, f"{session_id}.json")
    if not os.path.exists(session_path):
        raise HTTPException(status_code=404, detail="Session not found")

    with open(session_path, "r", encoding="utf-8") as f:
        return json.load(f)


def _compute_overall_scores(questions: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not questions:
        return {
            "content_score": 0,
            "structure_score": 0,
            "clarity_score": 0,
            "confidence_score": 0,
            "emotion_summary": {
                "dominant_emotion": "unknown",
                "emotion_counts": {},
            },
        }

    total_content = 0.0
    total_structure = 0.0
    total_clarity = 0.0
    total_confidence = 0.0

    emotion_counts: Dict[str, int] = {}

    for q in questions:
        total_content += float(q.get("content_score", 0) or 0)
        total_structure += float(q.get("structure_score", 0) or 0)
        total_clarity += float(q.get("clarity_score", 0) or 0)
        total_confidence += float(q.get("confidence_score", 0) or 0)

        expr = q.get("expression") or {}
        emo = expr.get("dominant_emotion")
        if emo:
            emotion_counts[emo] = emotion_counts.get(emo, 0) + 1

    n = len(questions)

    dominant_emotion = "unknown"
    if emotion_counts:
        dominant_emotion = max(emotion_counts, key=emotion_counts.get)

    return {
        "content_score": round(total_content / n, 2),
        "structure_score": round(total_structure / n, 2),
        "clarity_score": round(total_clarity / n, 2),
        "confidence_score": round(total_confidence / n, 2),
        "emotion_summary": {
            "dominant_emotion": dominant_emotion,
            "emotion_counts": emotion_counts,
        },
    }


@router.get("/{session_id}")
async def get_report(session_id: str):
    """
    Returns a full interview report for the given session_id.
    Path: GET /api/report/{session_id}
    """
    session_data = _load_session(session_id)

    role = session_data.get("role", "Unknown role")
    seniority = session_data.get("seniority", "Unknown level")
    questions = session_data.get("questions", [])

    overall = _compute_overall_scores(questions)

    # Ask Gemini to summarize
    ai_summary = await run_gemini_summary(
        role=role,
        seniority=seniority,
        questions=questions,
        overall=overall,
    )

    return {
        "session_id": session_id,
        "role": role,
        "seniority": seniority,
        "questions": questions,
        "overall": overall,
        "ai_summary": ai_summary,
    }


def _build_pdf(
    session_id: str,
    role: str,
    seniority: str,
    questions: List[Dict[str, Any]],
    overall: Dict[str, Any],
    ai_summary: Dict[str, Any],
) -> bytes:
    """
    Build a simple but clean PDF report using reportlab.
    """

    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    margin = 40
    y = height - margin

    def write_line(text: str, size: int = 11, bold: bool = False, leading: int = 14):
        nonlocal y
        if y < margin + leading:
            c.showPage()
            y = height - margin

        if bold:
            c.setFont("Helvetica-Bold", size)
        else:
            c.setFont("Helvetica", size)

        c.drawString(margin, y, text[:120])  # truncate long lines
        y -= leading

    # Header
    write_line("Interview Performance Report", size=16, bold=True, leading=22)
    write_line(f"Session ID: {session_id}", size=9)
    write_line(f"Role: {role} | Level: {seniority}", size=10)
    write_line(" ", size=8)

    # Overall scores
    write_line("Overall Scores", size=13, bold=True, leading=18)
    write_line(f"Content: {overall.get('content_score', '-')} / 10")
    write_line(f"Structure: {overall.get('structure_score', '-')} / 10")
    write_line(f"Clarity: {overall.get('clarity_score', '-')} / 10")
    write_line(f"Confidence: {overall.get('confidence_score', '-')} / 10")
    emo_summary = overall.get("emotion_summary") or {}
    write_line(
        f"Dominant Emotion: {emo_summary.get('dominant_emotion', 'unknown')}",
        size=10,
    )
    write_line(" ", size=8)

    # AI summary
    if ai_summary:
        strengths = ai_summary.get("strengths") or []
        improvements = ai_summary.get("improvements") or []
        summary = ai_summary.get("summary") or ""

        write_line("AI Summary", size=13, bold=True, leading=18)
        if summary:
            for line in summary.split(". "):
                if line.strip():
                    write_line(f"- {line.strip()}", size=10)
        write_line(" ", size=6)

        if strengths:
            write_line("Strengths:", size=12, bold=True, leading=16)
            for s in strengths:
                write_line(f"• {s}", size=10)
            write_line(" ", size=6)

        if improvements:
            write_line("Areas to Improve:", size=12, bold=True, leading=16)
            for s in improvements:
                write_line(f"• {s}", size=10)
            write_line(" ", size=10)

    # Per-question breakdown
    write_line("Question-wise Breakdown", size=13, bold=True, leading=18)

    for idx, q in enumerate(questions, start=1):
        q_text = q.get("question_text") or "Question text not available."
        transcript = q.get("transcript") or "Transcript not available."
        content = q.get("content_score", "-")
        structure = q.get("structure_score", "-")
        clarity = q.get("clarity_score", "-")
        confidence = q.get("confidence_score", "-")
        expr = q.get("expression") or {}
        dom_emo = expr.get("dominant_emotion", "unknown")
        feedback = q.get("feedback") or ""

        write_line(f"Q{idx}: {q_text}", size=11, bold=True, leading=14)
        write_line(f"Transcript: {transcript}", size=9, leading=12)
        write_line(
            f"Scores - Content: {content}, Structure: {structure}, "
            f"Clarity: {clarity}, Confidence: {confidence}",
            size=9,
            leading=12,
        )
        write_line(f"Dominant Emotion: {dom_emo}", size=9, leading=12)
        if feedback:
            write_line(f"Feedback: {feedback}", size=9, leading=12)
        write_line(" ", size=6)

    c.showPage()
    c.save()

    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


@router.get("/{session_id}/pdf")
async def download_report_pdf(session_id: str):
    """
    Generate and download the interview report as a PDF.
    Path: GET /api/report/{session_id}/pdf
    """
    session_data = _load_session(session_id)

    role = session_data.get("role", "Unknown role")
    seniority = session_data.get("seniority", "Unknown level")
    questions = session_data.get("questions", [])

    overall = _compute_overall_scores(questions)
    ai_summary = await run_gemini_summary(
        role=role,
        seniority=seniority,
        questions=questions,
        overall=overall,
    )

    pdf_bytes = _build_pdf(
        session_id=session_id,
        role=role,
        seniority=seniority,
        questions=questions,
        overall=overall,
        ai_summary=ai_summary,
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="interview-report-{session_id}.pdf"'
        },
    )
