import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Award,
  BarChart2,
  Smile,
  FileText,
  ChevronRight,
  Download,
} from "lucide-react";
import { motion } from "framer-motion";

const API_BASE = "http://localhost:8000";

// -------- Types --------

type QuestionReport = {
  question_id: string;
  question_text?: string;
  transcript?: string;
  content_score?: number;
  structure_score?: number;
  clarity_score?: number;
  confidence_score?: number;
  feedback?: string;
  expression?: {
    dominant_emotion?: string;
    emotion_scores?: Record<string, number>;
  };
};

type OverallScores = {
  content_score?: number;
  structure_score?: number;
  clarity_score?: number;
  confidence_score?: number;
  emotion_summary?: {
    dominant_emotion?: string;
    emotion_counts?: Record<string, number>;
  };
};

type AiSummary = {
  strengths?: string[];
  improvements?: string[];
  summary?: string;
};

type CombinedOverall = OverallScores & AiSummary;

type ReportResponse = {
  session_id: string;
  role?: string;
  seniority?: string;
  overall?: OverallScores;
  ai_summary?: AiSummary;
  questions?: QuestionReport[];
};

// ---------------- Component ----------------

const Report = () => {
  const navigate = useNavigate();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [report, setReport] = useState<ReportResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // -------- Get session id from storage --------

  useEffect(() => {
    let sid = sessionStorage.getItem("interview-session-id");

    if (!sid) {
      const raw = sessionStorage.getItem("interview-session");
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as { sessionId?: string };
          if (parsed.sessionId) {
            sid = parsed.sessionId;
          }
        } catch (e) {
          console.error("Failed to parse interview-session:", e);
        }
      }
    }

    if (!sid) {
      setSessionId(null);
      setLoading(false);
      setError("No interview session found. Please complete an interview first.");
      return;
    }

    setSessionId(sid);
  }, []);

  // -------- Fetch report from backend --------

  useEffect(() => {
    const fetchReport = async () => {
      if (!sessionId) return;

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${API_BASE}/api/report/${encodeURIComponent(sessionId)}`
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Backend error: ${res.status}`);
        }

        const data = (await res.json()) as ReportResponse;
        setReport(data);
      } catch (err: any) {
        console.error("Failed to load report:", err);
        setError(
          err.message ||
            "Could not load your report. Try again or re-run your interview."
        );
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchReport();
    }
  }, [sessionId]);

  // -------- Download PDF --------

  const handleDownloadPdf = async () => {
    if (!sessionId) return;
    try {
      setDownloading(true);
      const res = await fetch(
        `${API_BASE}/api/report/${encodeURIComponent(sessionId)}/pdf`
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to download PDF: ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `interview-report-${sessionId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("PDF download failed:", err);
      setError(
        err.message || "Failed to download report as PDF. Please try again."
      );
    } finally {
      setDownloading(false);
    }
  };

  // -------- Helpers --------

  const formatScore = (n?: number) =>
    typeof n === "number" ? n.toFixed(1) : "–";

  const computeFallbackOverall = (questions: QuestionReport[]): OverallScores => {
    if (!questions.length) return {};

    const safeAvg = (key: keyof QuestionReport): number | undefined => {
      const vals = questions
        .map((q) => q[key])
        .filter((v): v is number => typeof v === "number");

      if (!vals.length) return undefined;
      const sum = vals.reduce((a, b) => a + b, 0);
      return sum / vals.length;
    };

    return {
      content_score: safeAvg("content_score"),
      structure_score: safeAvg("structure_score"),
      clarity_score: safeAvg("clarity_score"),
      confidence_score: safeAvg("confidence_score"),
    };
  };

  const overall: CombinedOverall = (() => {
    if (!report) return {};

    const numeric = report.overall
      ? report.overall
      : report.questions && report.questions.length > 0
      ? computeFallbackOverall(report.questions)
      : {};

    return {
      ...numeric,
      ...(report.ai_summary || {}),
    };
  })();

  const questions = report?.questions || [];

  // -------- Render states --------

  if (!sessionId && !loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 flex justify-center px-4">
          <div className="glass-card max-w-md w-full p-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              No interview session found.
            </p>
            <Button variant="hero" onClick={() => navigate("/setup")}>
              Go to Setup
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          {/* Back button */}
          <div className="mb-4 flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 px-0"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/setup")}
              >
                Practice Again
              </Button>
              <Button
                variant="hero-secondary"
                size="sm"
                onClick={handleDownloadPdf}
                disabled={downloading || loading || !report}
              >
                {downloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    Preparing PDF…
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1" />
                    Download Report
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Title / header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
                Interview Performance Report
              </h1>
              {report && (
                <p className="text-sm text-muted-foreground mt-1">
                  Role:{" "}
                  <span className="font-medium text-foreground">
                    {report.role || "Not specified"}
                  </span>{" "}
                  • Level:{" "}
                  <span className="font-medium text-foreground">
                    {report.seniority || "Not specified"}
                  </span>{" "}
                  • Session:{" "}
                  <span className="font-mono text-xs">
                    {report.session_id.slice(0, 8)}…
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Loading / error */}
          {loading && (
            <div className="flex justify-center mt-16">
              <div className="glass-card p-6 flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Generating your report…
                </span>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="glass-card p-6 flex gap-3 items-start border-red-500/30 bg-red-500/5 mb-8">
              <AlertCircle className="h-5 w-5 text-red-500 mt-1" />
              <div>
                <p className="text-sm font-medium text-red-500">
                  Could not load report
                </p>
                <p className="text-xs text-red-200 mt-1">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && report && (
            <div className="space-y-8">
              {/* Overall summary */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid md:grid-cols-3 gap-6"
              >
                {/* Score summary */}
                <div className="glass-card p-5 md:col-span-2 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart2 className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold text-foreground">
                      Overall Scores
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                      <p className="text-[11px] text-muted-foreground">
                        Content
                      </p>
                      <p className="text-lg font-semibold">
                        {formatScore(overall.content_score)}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                      <p className="text-[11px] text-muted-foreground">
                        Structure
                      </p>
                      <p className="text-lg font-semibold">
                        {formatScore(overall.structure_score)}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                      <p className="text-[11px] text-muted-foreground">
                        Clarity
                      </p>
                      <p className="text-lg font-semibold">
                        {formatScore(overall.clarity_score)}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                      <p className="text-[11px] text-muted-foreground">
                        Confidence
                      </p>
                      <p className="text-lg font-semibold">
                        {formatScore(overall.confidence_score)}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Scores are out of 10 and averaged across all your answers.
                  </p>
                </div>

                {/* Emotion summary */}
                <div className="glass-card p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Smile className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold text-foreground">
                      Expression Summary
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Dominant emotion detected:
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {overall.emotion_summary?.dominant_emotion ||
                      "Not enough data"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    This is inferred from your facial expressions across all
                    answers.
                  </p>
                </div>
              </motion.div>

              {/* Strengths / improvements */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid md:grid-cols-2 gap-6"
              >
                <div className="glass-card p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-emerald-400" />
                    <h2 className="text-sm font-semibold text-foreground">
                      Strengths
                    </h2>
                  </div>
                  <ul className="space-y-2 mt-1">
                    {overall.strengths && overall.strengths.length > 0 ? (
                      overall.strengths.map((s, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-emerald-100"
                        >
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                          {s}
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-muted-foreground">
                        AI didn&apos;t generate specific strengths. Still, you
                        likely did well if your scores are decent!
                      </li>
                    )}
                  </ul>
                </div>

                <div className="glass-card p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-300" />
                    <h2 className="text-sm font-semibold text-foreground">
                      Areas to Improve
                    </h2>
                  </div>
                  <ul className="space-y-2 mt-1">
                    {overall.improvements && overall.improvements.length > 0 ? (
                      overall.improvements.map((s, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-yellow-100"
                        >
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-yellow-300 flex-shrink-0" />
                          {s}
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-muted-foreground">
                        Keep practicing your structure and try to use more
                        concrete examples with metrics.
                      </li>
                    )}
                  </ul>
                </div>
              </motion.div>

              {/* AI Summary */}
              {overall.summary && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold text-foreground">
                      AI Summary
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {overall.summary}
                  </p>
                </motion.div>
              )}

              {/* Per-question breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  Question-wise Breakdown
                </h2>

                {questions.length === 0 ? (
                  <div className="glass-card p-5 text-xs text-muted-foreground">
                    No per-question data available. Try answering at least one
                    question in your next session.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((q, index) => (
                      <div key={q.question_id || index} className="glass-card p-5">
                        <p className="text-xs text-muted-foreground mb-1">
                          Question {index + 1}
                        </p>
                        <p className="text-sm font-medium text-foreground mb-3">
                          {q.question_text || "Question text not available."}
                        </p>

                        <p className="text-xs text-muted-foreground mb-2">
                          <span className="font-semibold text-foreground">
                            Transcript:
                          </span>{" "}
                          {q.transcript || "Transcript not available."}
                        </p>

                        <div className="flex flex-wrap gap-2 text-[11px] text-foreground mb-2">
                          <span className="px-2 py-1 rounded-full bg-muted/60">
                            Content: {formatScore(q.content_score)}/10
                          </span>
                          <span className="px-2 py-1 rounded-full bg-muted/60">
                            Structure: {formatScore(q.structure_score)}/10
                          </span>
                          <span className="px-2 py-1 rounded-full bg-muted/60">
                            Clarity: {formatScore(q.clarity_score)}/10
                          </span>
                          <span className="px-2 py-1 rounded-full bg-muted/60">
                            Confidence: {formatScore(q.confidence_score)}/10
                          </span>
                          {q.expression?.dominant_emotion && (
                            <span className="px-2 py-1 rounded-full bg-muted/60">
                              Emotion: {q.expression.dominant_emotion}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-foreground">
                          {q.feedback || "No detailed feedback for this question."}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Report;
