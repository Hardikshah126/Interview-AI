import cv2
from fer import FER


def analyze_video_emotions(video_path: str) -> dict:
    """
    Very lightweight facial emotion analysis using FER.
    It scans frames in the video and averages detected emotions.
    """

    detector = FER(mtcnn=True)
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        return {
            "dominant_emotion": "unknown",
            "emotion_scores": {},
        }

    emotion_aggregate = {}
    frame_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1
        # Sample every 5th frame to reduce compute
        if frame_count % 5 != 0:
            continue

        results = detector.detect_emotions(frame)
        if not results:
            continue

        emotions = results[0]["emotions"]
        for emo, score in emotions.items():
            emotion_aggregate[emo] = emotion_aggregate.get(emo, 0.0) + score

    cap.release()

    if not emotion_aggregate:
        return {
            "dominant_emotion": "unknown",
            "emotion_scores": {},
        }

    # Normalize by total frames counted
    total = sum(emotion_aggregate.values())
    if total == 0:
        return {
            "dominant_emotion": "unknown",
            "emotion_scores": {},
        }

    normalized = {k: v / total for k, v in emotion_aggregate.items()}
    dominant = max(normalized, key=normalized.get)

    return {
        "dominant_emotion": dominant,
        "emotion_scores": normalized,
    }
