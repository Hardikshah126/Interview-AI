# backend/app/models/schemas.py
from pydantic import BaseModel
from typing import List, Optional


class GenerateQuestionsRequest(BaseModel):
    role: str
    seniority: str
    resume_text: str  # or you can send file instead; see below


class Question(BaseModel):
    id: str
    text: str


class GenerateQuestionsResponse(BaseModel):
    session_id: str
    questions: List[Question]


class StartInterviewRequest(BaseModel):
    session_id: str


class AnswerEvaluation(BaseModel):
    question_id: str
    transcript: str
    content_score: float
    structure_score: float
    clarity_score: float
    confidence_score: float
    feedback: str


class ExpressionSummary(BaseModel):
    dominant_emotion: Optional[str] = None
    emotion_scores: dict[str, float] = {}


class FinalReport(BaseModel):
    session_id: str
    overall_score: float
    strengths: List[str]
    improvements: List[str]
    per_question: List[AnswerEvaluation]
    expressions: ExpressionSummary
