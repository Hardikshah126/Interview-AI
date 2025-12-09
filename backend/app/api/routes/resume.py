# backend/app/api/routes/resume.py

import os
import uuid
import json
import traceback

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from app.services.resume_parser import extract_text_from_pdf
from app.services.question_gen import generate_questions

router = APIRouter()

SESSIONS_DIR = "sessions"
os.makedirs(SESSIONS_DIR, exist_ok=True)


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    role: str = Form(...),
    seniority: str = Form(...),
):
    """
    1. Save uploaded resume to a temp folder
    2. Extract text from PDF
    3. Generate interview questions using Gemini
    4. Create a session file on disk
    5. Return session_id + questions
    """

    # 1) Save file
    try:
      os.makedirs("app/storage/tmp", exist_ok=True)
      tmp_path = os.path.join(
          "app/storage/tmp",
          f"{uuid.uuid4()}_{file.filename}",
      )
      with open(tmp_path, "wb") as f:
          f.write(await file.read())
    except Exception as e:
      print("ERROR: Failed to save uploaded file:", e)
      traceback.print_exc()
      raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    # 2) Extract resume text
    try:
      resume_text = extract_text_from_pdf(tmp_path)
    except Exception as e:
      print("ERROR: Failed to parse resume PDF:", e)
      traceback.print_exc()
      raise HTTPException(status_code=400, detail=f"Failed to parse resume: {e}")

    # 3) Generate questions via Gemini (with fallback)
    try:
      questions_list = generate_questions(
          resume_text=resume_text,
          role=role,
          seniority=seniority,
          num_questions=5,
      )
    except Exception as e:
      print("ERROR: generate_questions() failed:", e)
      traceback.print_exc()

      # Fallback dummy questions so the endpoint still works
      questions_list = [
          f"Fallback question {i+1} for role {role} ({seniority}). "
          f'This exists because Gemini failed: "{e}"'
          for i in range(5)
      ]

    # 4) Create a session file on disk
    session_id = str(uuid.uuid4())
    session_path = os.path.join(SESSIONS_DIR, f"{session_id}.json")

    try:
      with open(session_path, "w", encoding="utf-8") as f:
          json.dump(
              {
                  "session_id": session_id,
                  "role": role,
                  "seniority": seniority,
                  "questions": [],  # answers will be appended in /api/interview/answer
              },
              f,
              indent=2,
          )
    except Exception as e:
      print("ERROR: Failed to create session file:", e)
      traceback.print_exc()
      raise HTTPException(status_code=500, detail=f"Failed to create session: {e}")

    # 5) Build response
    return {
      "session_id": session_id,
      "questions": [
          {"id": str(i + 1), "text": q}
          for i, q in enumerate(questions_list)
      ],
    }
