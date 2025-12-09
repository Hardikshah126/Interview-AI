AI Interview Coach

A web application that helps users practice interviews by generating role-specific questions, recording video answers, and evaluating performance using NLP + GenAI + emotion analysis.

🧩 Problem This Solves

Candidates struggle to self-evaluate their interview skills.

There is no structured way to practice answers with real-time feedback on delivery, clarity, and confidence.

🛠️ Tech Stack
Frontend

React (Vite)

TailwindCSS + ShadCN UI

Framer Motion

MediaRecorder API (for webcam recording)

Backend

FastAPI

Python

Uvicorn

PyPDF2 (resume parsing)

FER + OpenCV (facial emotion analysis)

Google Gemini 2.5 Flash (NLP scoring + question generation)

AI / NLP

LLM-based question generation

Transcript extraction

Answer scoring (content, clarity, structure, confidence)

Summary generation (strengths, improvements, overall report)

⭐ Key Features

Upload resume → extract skills and generate tailored questions

Record video answers directly in the browser

AI scoring using structured NLP rubrics

Facial expression & confidence detection

Final performance report with:

Scores for each answer

Transcript

Emotion analysis

Personalized strengths & improvements

PDF export of full report
