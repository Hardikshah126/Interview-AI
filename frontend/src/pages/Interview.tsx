// src/pages/Interview.tsx

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

import Navbar from "@/components/Navbar";
import QuestionCard from "@/components/QuestionCard";
import EmotionBadge from "@/components/EmotionBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
  ArrowRight,
  Flag,
  Video,
  Circle,
  Smile,
  Meh,
  Zap,
  AlertCircle,
  Lightbulb,
  Eye,
  Clock,
  SkipForward,
} from "lucide-react";

const API_BASE = "http://localhost:8000";

// --------- Types ---------

type EmotionType = "calm" | "confident" | "hesitant" | "neutral";

type Question = {
  id: string;
  text: string;
  type?: "behavioral" | "technical" | "situational" | "cultural";
  difficulty?: "easy" | "medium" | "hard";
};

type InterviewSession = {
  sessionId: string;
  role: string;
  seniority: string;
  questions: Question[];
};

// ---------- UI helpers ----------

const emotionBadges: { type: EmotionType; icon: typeof Smile }[] = [
  { type: "calm", icon: Smile },
  { type: "confident", icon: Zap },
  { type: "hesitant", icon: AlertCircle },
  { type: "neutral", icon: Meh },
];

const liveTips = [
  "Use the STAR framework: Situation, Task, Action, Result.",
  "Look at the camera as if it's the interviewer.",
  "Pause for a second before answering to organize your thoughts.",
];

// --------------- Component ---------------

const Interview = () => {
  const navigate = useNavigate();

  // session + questions
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // webcam recording
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // timer
  const [timer, setTimer] = useState(0);

  // ui state
  const [notes, setNotes] = useState("");
  const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>([]);
  const [activeEmotion, setActiveEmotion] = useState<EmotionType>("neutral");
  const [error, setError] = useState<string | null>(null);
  const [savedAnswers, setSavedAnswers] = useState<Record<string, boolean>>({});

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  // -------- Load session from sessionStorage --------

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("interview-session");
      if (!raw) {
        setSession(null);
        setQuestions([]);
        return;
      }

      const parsed = JSON.parse(raw) as InterviewSession;

      const normalizedQuestions: Question[] =
        parsed.questions?.map((q, i) => ({
          id: q.id ?? String(i + 1),
          text: (q as any).text ?? (q as any).question ?? "",
          type: q.type ?? "behavioral",
          difficulty: q.difficulty ?? "medium",
        })) ?? [];

      setSession({
        sessionId: parsed.sessionId,
        role: parsed.role,
        seniority: parsed.seniority,
        questions: normalizedQuestions,
      });
      setQuestions(normalizedQuestions);
    } catch (e) {
      console.error("Failed to parse interview-session:", e);
      setSession(null);
      setQuestions([]);
    }
  }, []);

  // -------- Timer per question --------

  useEffect(() => {
    setTimer(0);
    const interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [currentIndex]);

  // -------- Fake live emotion badges --------

  useEffect(() => {
    const interval = setInterval(() => {
      const candidates: EmotionType[] = ["calm", "confident", "neutral"];
      const random = candidates[Math.floor(Math.random() * candidates.length)];
      setActiveEmotion(random);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // -------- Setup webcam --------

  useEffect(() => {
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setError(
          "Could not access camera/microphone. Please check browser permissions."
        );
      }
    };

    setupCamera();

    return () => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // -------- Helpers --------

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleFlagQuestion = () => {
    if (!flaggedQuestions.includes(currentIndex)) {
      setFlaggedQuestions((prev) => [...prev, currentIndex]);
    }
  };

  const handleSkip = () => {
    if (isRecording || isUploading) return;
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
      setNotes("");
      setError(null);
    } else {
      if (session?.sessionId) {
        sessionStorage.setItem("interview-session-id", session.sessionId);
      }
      navigate("/report");
    }
  };

  // -------- Recording --------

  const startRecording = () => {
    if (!streamRef.current) {
      setError("Camera not ready yet.");
      return;
    }
    if (isUploading) return;

    setError(null);
    chunksRef.current = [];

    try {
      const recorder = new MediaRecorder(streamRef.current, {
        mimeType: "video/webm",
      });
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        chunksRef.current = [];
        uploadAnswer(blob);
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setError("Failed to start recording. Try refreshing the page.");
    }
  };

  const stopRecording = () => {
    if (!recorderRef.current) return;
    if (recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // -------- Upload & save (NO feedback UI) --------

  const uploadAnswer = async (videoBlob: Blob) => {
    if (!session || !currentQuestion) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("session_id", session.sessionId);
      formData.append("question_id", currentQuestion.id);
      formData.append("question_text", currentQuestion.text);
      // IMPORTANT: field name must be "file" to match backend
      formData.append("file", videoBlob, `answer-${currentQuestion.id}.webm`);

      const res = await fetch(`${API_BASE}/api/interview/answer`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Answer upload failed:", res.status, text);
        throw new Error(text || `Backend error: ${res.status}`);
      }

      // We don't use the body for UI (no per-question feedback)
      await res.json().catch(() => null);

      // Mark this question as saved
      setSavedAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: true,
      }));
    } catch (err: any) {
      console.error("Upload failed:", err);
      setError(
        err.message ||
          "Failed to upload answer. Please try again or re-record your answer."
      );
    } finally {
      setIsUploading(false);
    }
  };

  // -------- Navigation --------

  const goToNextQuestion = () => {
    if (isRecording || isUploading) return;
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
      setNotes("");
      setError(null);
    } else {
      if (session?.sessionId) {
        sessionStorage.setItem("interview-session-id", session.sessionId);
      }
      navigate("/report");
    }
  };

  // -------- Render missing session --------

  if (!session || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 flex items-center justify-center">
          <div className="glass-card p-6 max-w-md text-center">
            <p className="text-sm text-muted-foreground mb-4">
              No active interview session found.
            </p>
            <Button onClick={() => navigate("/setup")} variant="hero">
              Go to Setup
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // ------------- UI --------------

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Top bar */}
      <div className="fixed top-16 left-0 right-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-12 items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-foreground">
                Q{currentIndex + 1} of {totalQuestions}
              </span>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 border border-destructive/20">
                <Circle className="h-2 w-2 fill-destructive text-destructive animate-pulse" />
                <span className="text-xs font-medium text-destructive">
                  {isRecording
                    ? "Recording..."
                    : isUploading
                    ? "Uploading…"
                    : "Ready"}
                </span>
              </div>
              {savedAnswers[currentQuestion.id] && !isUploading && (
                <span className="text-xs text-emerald-400">
                  Answer saved • You can re-record or go next
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-mono">{formatTime(timer)}</span>
            </div>
          </div>
        </div>
      </div>

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* LEFT: Question + notes + controls */}
            <div className="lg:col-span-2 space-y-6">
              {/* Question */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <QuestionCard
                    question={currentQuestion.text}
                    type={currentQuestion.type ?? "behavioral"}
                    difficulty={currentQuestion.difficulty ?? "medium"}
                    showFlag
                    onFlag={handleFlagQuestion}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Notes */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="glass-card p-6"
              >
                <label className="block text-sm font-medium text-foreground mb-3">
                  Notes (optional)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Write key points you want to mention. Your spoken response is what gets analyzed."
                  className="min-h-[120px] bg-muted/50 border-border resize-none"
                />
              </motion.div>

              {/* Controls */}
              <div className="flex flex-wrap gap-3 items-center">
                <Button
                  variant="hero"
                  size="lg"
                  onClick={startRecording}
                  disabled={isRecording || isUploading}
                >
                  {savedAnswers[currentQuestion.id]
                    ? "Re-record Answer"
                    : "Start Recording"}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={stopRecording}
                  disabled={!isRecording}
                >
                  Stop
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleFlagQuestion}
                  className={
                    flaggedQuestions.includes(currentIndex)
                      ? "text-warning border-warning/30"
                      : ""
                  }
                >
                  <Flag className="h-5 w-5 mr-1" />
                  {flaggedQuestions.includes(currentIndex)
                    ? "Flagged"
                    : "Flag Question"}
                </Button>

                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleSkip}
                  disabled={isRecording || isUploading}
                >
                  <SkipForward className="h-5 w-5 mr-1" />
                  {currentIndex < totalQuestions - 1 ? "Skip Question" : "Skip & Finish"}
                </Button>

                <Button
                  variant="ghost"
                  size="lg"
                  onClick={goToNextQuestion}
                  disabled={isRecording || isUploading}
                >
                  {currentIndex < totalQuestions - 1 ? "Next" : "Finish & View Report"}
                  <ArrowRight className="h-5 w-5 ml-1" />
                </Button>
              </div>

              {isUploading && (
                <p className="text-xs text-primary mt-1">
                  Uploading & saving your answer…
                </p>
              )}
              {error && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {error}
                </p>
              )}
            </div>

            {/* RIGHT: Camera + emotions + tips */}
            <div className="space-y-6">
              {/* Camera preview */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="glass-card p-4"
              >
                <div className="aspect-video rounded-xl bg-muted/30 border border-border/50 overflow-hidden relative flex items-center justify-center">
                  <video
                    ref={videoRef}
                    className="h-full w-full object-cover"
                    autoPlay
                    muted
                    playsInline
                  />
                  {!streamRef.current && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                      <Video className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground text-center">
                        Waiting for camera permission…
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Emotion badges */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="glass-card p-4"
              >
                <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  Detected Emotion (live mock)
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {emotionBadges.map((emo, i) => (
                    <EmotionBadge
                      key={emo.type}
                      emotion={emo.type}
                      icon={emo.icon}
                      active={activeEmotion === emo.type}
                      index={i}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Tips */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="glass-card p-4"
              >
                <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-400" />
                  Live Tips
                </h3>
                <ul className="space-y-2">
                  {liveTips.map((tip, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-muted-foreground"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Interview;
