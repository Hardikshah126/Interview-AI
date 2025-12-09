# backend/app/api/routes/interview.py

import os
import uuid
import json
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Dict, Any

from app.services.speech_to_text import transcribe_video_file
from app.services.face_analysis import analyze_video_emotions
from app.services.gemini_client import score_answer_gemini


router = APIRouter()

SESSIONS_DIR = "sessions"
UPLOADS_DIR = "uploads"

os.makedirs(SESSIONS_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)


# ---------------------------------------------------------------------
#  START INTERVIEW (Generate Questions is already done in setup)
# ---------------------------------------------------------------------

@router.post("/start")
async def start_interview(role: str = Form(...), seniority: str = Form(...), questions: str = Form(...)):
    """
    Creates a new session file and returns session_id.
    'questions' is passed from frontend as JSON string.
    """

    session_id = str(uuid.uuid4())

    try:
        question_list = json.loads(questions)
    except:
        raise HTTPException(400, "Invalid question format")

    session_path = os.path.join(SESSIONS_DIR, f"{session_id}.json")

    with open(session_path, "w", encoding="utf-8") as f:
        json.dump({
            "session_id": session_id,
            "role": role,
            "seniority": seniority,
            "questions": []
        }, f, indent=2)

    return {
        "session_id": session_id,
        "questions": question_list
    }


# ---------------------------------------------------------------------
#  SAVE ANSWER (This is called after EACH question)
# ---------------------------------------------------------------------

@router.post("/answer")
async def save_answer(
    session_id: str = Form(...),
    question_id: str = Form(...),
    question_text: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Receives a video blob recording from frontend.
    Saves → transcribes → scores → emotion analysis → stores in session file
    """

    # Validate session exists
    session_path = os.path.join(SESSIONS_DIR, f"{session_id}.json")
    if not os.path.exists(session_path):
        raise HTTPException(404, "Session not found")

    # Save uploaded video
    session_upload_dir = os.path.join(UPLOADS_DIR, session_id)
    os.makedirs(session_upload_dir, exist_ok=True)

    video_path = os.path.join(session_upload_dir, f"{question_id}.webm")

    with open(video_path, "wb") as f:
        f.write(await file.read())

    # ----------------------------------------------------
    # 1. TRANSCRIBE
    # ----------------------------------------------------
    try:
        transcript = transcribe_video_file(video_path)
    except Exception as e:
        transcript = ""
        print("Transcription failed:", e)

    # ----------------------------------------------------
    # 2. EMOTION ANALYSIS
    # ----------------------------------------------------
    try:
        emotion_result = analyze_video_emotions(video_path)
    except Exception as e:
        emotion_result = {
            "dominant_emotion": "unknown",
            "emotion_scores": {}
        }
        print("Emotion analysis failed:", e)

    # ----------------------------------------------------
    # 3. SCORING WITH GEMINI
    # ----------------------------------------------------
    try:
        ai_score = await score_answer_gemini(
            question=question_text,
            transcript=transcript
        )
    except Exception as e:
        ai_score = {
            "content_score": 0,
            "structure_score": 0,
            "clarity_score": 0,
            "confidence_score": 0,
            "feedback": "AI Scoring failed."
        }
        print("Gemini scoring failed:", e)

    # ----------------------------------------------------
    # 4. SAVE INTO SESSION JSON
    # ----------------------------------------------------
    with open(session_path, "r", encoding="utf-8") as f:
        session_data = json.load(f)

    session_data["questions"].append({
        "question_id": question_id,
        "question_text": question_text,
        "transcript": transcript,
        **ai_score,
        "expression": emotion_result
    })

    with open(session_path, "w", encoding="utf-8") as f:
        json.dump(session_data, f, indent=2)

    return {
        "message": "Answer saved successfully",
        "transcript": transcript,
        "emotion": emotion_result,
        "scores": ai_score
    }


# ---------------------------------------------------------------------
#  END INTERVIEW
# ---------------------------------------------------------------------

@router.post("/end")
async def end_interview(session_id: str = Form(...)):
    """
    (Optional) Marks the session as complete.
    """

    session_path = os.path.join(SESSIONS_DIR, f"{session_id}.json")

    if not os.path.exists(session_path):
        raise HTTPException(404, "Session not found")

    return {
        "message": "Interview session finished",
        "session_id": session_id
    }
