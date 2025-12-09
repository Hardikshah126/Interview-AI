import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

import Navbar from "@/components/Navbar";
import QuestionCard from "@/components/QuestionCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Upload,
  FileText,
  X,
  Sparkles,
  Loader2,
  ArrowRight,
  Code,
  Users,
  Lightbulb,
  MessageSquare,
} from "lucide-react";

const API_BASE = "http://localhost:8000";

const roles = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Analyst",
  "Product Designer",
  "Product Manager",
  "Marketing Manager",
  "Software Engineer",
  "DevOps Engineer",
  "Data Scientist",
];

const seniorityLevels = ["Intern", "Junior", "Mid-Level", "Senior", "Lead", "Principal"];

const focusAreas = [
  { id: "system-design", label: "System Design", icon: Code },
  { id: "behavioral", label: "Behavioral", icon: Users },
  { id: "problem-solving", label: "Problem Solving", icon: Lightbulb },
  { id: "communication", label: "Communication", icon: MessageSquare },
];

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

const Setup = () => {
  const navigate = useNavigate();

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [role, setRole] = useState("");
  const [seniority, setSeniority] = useState("");
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [questionsGenerated, setQuestionsGenerated] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ---------- Drag & Drop handlers ----------

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      setResumeFile(file);
      setUploadedFileName(file.name);
      setError(null);
    }
  };

  // ---------- File selection (click) ----------

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setResumeFile(file);
      setUploadedFileName(file.name);
      setError(null);
    }
  };

  const removeFile = () => {
    setResumeFile(null);
    setUploadedFileName(null);
  };

  // ---------- Focus area toggle ----------

  const toggleFocus = (id: string) => {
    setSelectedFocus((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  // ---------- Generate questions (backend integration) ----------

  const canGenerate = !!resumeFile && !!role && !!seniority;

  const handleGenerateQuestions = async () => {
    if (!canGenerate || !resumeFile) {
      setError("Please upload a resume and select role & seniority.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", resumeFile);
      formData.append("role", role.toLowerCase());
      formData.append("seniority", seniority.toLowerCase());

      const res = await fetch(`${API_BASE}/api/resume/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Backend error: ${res.status}`);
      }

      const data = await res.json();

      // Normalize questions coming from backend
      const backendQuestions = (data.questions || []) as any[];
      const normalizedQuestions: Question[] = backendQuestions.map((q, index) => ({
        id: q.id?.toString() ?? String(index + 1),
        text: q.text ?? q.question ?? `Question ${index + 1}`,
        type: q.type ?? "behavioral",
        difficulty: q.difficulty ?? "medium",
      }));

      const sessionId: string = data.session_id;

      // Save session for Interview.tsx
      const interviewSession: InterviewSession = {
        sessionId,
        role,
        seniority,
        questions: normalizedQuestions,
      };

      sessionStorage.setItem("interview-session", JSON.stringify(interviewSession));

      // Optional: show preview on this page before going to interview
      setQuestions(normalizedQuestions.slice(0, 3)); // show first 3 as preview
      setQuestionsGenerated(true);

      // If you want to go directly to interview, uncomment this:
      // navigate("/interview");
    } catch (err: any) {
      console.error("Failed to generate questions:", err);
      setError(err.message || "Failed to generate questions. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContinueToInterview = () => {
    navigate("/interview");
  };

  // ---------- Render ----------

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Set Up Your Practice Session
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Upload your resume and tell us about your target role to get personalized interview questions.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-card p-8 max-w-4xl mx-auto"
          >
            <div className="grid md:grid-cols-2 gap-8">
              {/* LEFT: Resume Upload */}
              <div>
                <Label className="text-lg font-semibold text-foreground mb-4 block">
                  Upload Resume
                </Label>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`
                    relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300
                    ${isDragging
                      ? "border-primary bg-primary/10"
                      : resumeFile
                        ? "border-emerald-500/50 bg-emerald-500/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }
                  `}
                >
                  {/* IMPORTANT: this input is ONLY over the dropzone */}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />

                  {resumeFile ? (
                    <div className="space-y-3 pointer-events-none">
                      <div className="flex items-center justify-center gap-2 text-emerald-400">
                        <FileText className="h-8 w-8" />
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm text-foreground font-medium">
                          {uploadedFileName}
                        </span>
                        {/* This button sits below the invisible input, so we stop propagation */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile();
                          }}
                          className="p-1 rounded-full hover:bg-muted transition-colors relative z-20"
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">File uploaded!</p>
                    </div>
                  ) : (
                    <div className="space-y-3 pointer-events-none">
                      <div className="flex items-center justify-center">
                        <div className="p-4 rounded-full bg-muted">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-foreground font-medium">
                          Drag &amp; drop your resume here
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          or click to browse (PDF, DOC, DOCX)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: Role & Preferences */}
              <div className="space-y-6">
                <div>
                  <Label className="text-lg font-semibold text-foreground mb-4 block">
                    Role &amp; Preferences
                  </Label>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="role" className="text-sm text-muted-foreground mb-2 block">
                        Target Role
                      </Label>
                      <Select value={role} onValueChange={setRole}>
                        <SelectTrigger className="w-full bg-muted/50 border-border">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label
                        htmlFor="seniority"
                        className="text-sm text-muted-foreground mb-2 block"
                      >
                        Seniority Level
                      </Label>
                      <Select value={seniority} onValueChange={setSeniority}>
                        <SelectTrigger className="w-full bg-muted/50 border-border">
                          <SelectValue placeholder="Select seniority" />
                        </SelectTrigger>
                        <SelectContent>
                          {seniorityLevels.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground mb-3 block">
                    Focus Areas (Optional)
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {focusAreas.map((area) => {
                      const Icon = area.icon;
                      const isSelected = selectedFocus.includes(area.id);
                      return (
                        <button
                          key={area.id}
                          type="button"
                          onClick={() => toggleFocus(area.id)}
                          className={`
                            flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all
                            ${isSelected
                              ? "bg-primary/10 border-primary/30 text-primary"
                              : "bg-muted/50 border-border text-muted-foreground hover:border-primary/30"
                            }
                          `}
                        >
                          <Icon className="h-4 w-4" />
                          {area.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="mt-4 text-xs text-destructive">
                {error}
              </p>
            )}

            {/* Generate Button */}
            <div className="mt-8">
              <Button
                variant="hero"
                size="lg"
                className="w-full"
                disabled={!canGenerate || isGenerating}
                onClick={handleGenerateQuestions}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Generate Interview Questions
                  </>
                )}
              </Button>
            </div>

            {/* Generated Questions Preview */}
            <AnimatePresence>
              {questionsGenerated && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-8 pt-8 border-t border-border"
                >
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Sample Questions Generated
                  </h3>

                  <div className="space-y-4 mb-6">
                    {questions.map((q, i) => (
                      <QuestionCard
                        key={q.id}
                        question={q.text}
                        type={q.type ?? "behavioral"}
                        difficulty={q.difficulty ?? "medium"}
                        index={i}
                        compact
                      />
                    ))}
                  </div>

                  <Button
                    variant="glow"
                    size="lg"
                    className="w-full"
                    onClick={handleContinueToInterview}
                  >
                    Continue to Interview
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Setup;
