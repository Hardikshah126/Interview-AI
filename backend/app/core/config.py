# backend/app/core/config.py

from pydantic import BaseModel
from typing import List
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()


class Settings(BaseModel):
    PROJECT_NAME: str = "Interview AI Backend"

    # Frontend URLs that are allowed to call this API
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # API keys
    GEMINI_API_KEY: str | None = os.getenv("GEMINI_API_KEY")


# 👇 This is what `from app.core.config import settings` will import
settings = Settings()
