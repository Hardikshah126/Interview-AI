# backend/app/services/speech_to_text.py

import os
from typing import Literal

import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables (GEMINI_API_KEY)
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment. Please set it in your .env file.")

# Configure Gemini
genai.configure(api_key=API_KEY)


# Supported audio mime types (extend if needed)
AudioMimeType = Literal[
    "audio/wav",
    "audio/x-wav",
    "audio/mpeg",
    "audio/mp3",
    "audio/webm",
    "audio/ogg",
]


def guess_mime_type(file_path: str) -> AudioMimeType:
    """
    Very small helper to guess mime type from extension.
    You can improve this later if needed.
    """
    ext = os.path.splitext(file_path)[1].lower()

    if ext in [".wav"]:
        return "audio/wav"
    if ext in [".mp3"]:
        return "audio/mpeg"
    if ext in [".webm"]:
        return "audio/webm"
    if ext in [".ogg"]:
        return "audio/ogg"

    # Default fallback
    return "audio/wav"  # safe default if you're mainly using wav


def transcribe_audio_file(file_path: str) -> str:
    """
    Transcribe an audio file using Gemini.

    :param file_path: path to local audio/video file (wav, mp3, webm, etc.)
    :return: transcript as plain text
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Audio file not found: {file_path}")

    mime_type = guess_mime_type(file_path)

    # Read bytes
    with open(file_path, "rb") as f:
        audio_bytes = f.read()

    # Build Gemini model
    model = genai.GenerativeModel("gemini-2.5-flash-lite")

    try:
        response = model.generate_content(
            [
                "You are a transcription engine. Transcribe the following audio accurately. "
                "Only return the raw transcript, no extra commentary.",
                {
                    "mime_type": mime_type,
                    "data": audio_bytes,
                },
            ]
        )
    except Exception as e:
        raise RuntimeError(f"Gemini transcription failed: {e}")

    transcript = (response.text or "").strip()

    if not transcript:
        raise RuntimeError("Gemini returned an empty transcript.")

    return transcript


def transcribe_video_file(file_path: str) -> str:
    """
    Thin wrapper so other code can call transcribe_video_file().
    We treat the video (e.g., .webm) as an audio container and reuse the same logic.
    """
    return transcribe_audio_file(file_path)
