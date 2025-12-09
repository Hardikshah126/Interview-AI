import * as React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type ScoreStatus = "strong" | "good" | "needs-improvement";

interface ScoreCardProps {
  title: string;
  score: number;
  maxScore?: number;
  insights: string[];
  index?: number;
  size?: "default" | "large";
}

const getStatus = (score: number): ScoreStatus => {
  if (score >= 8) return "strong";
  if (score >= 6) return "good";
  return "needs-improvement";
};

const getStatusConfig = (status: ScoreStatus) => {
  switch (status) {
    case "strong":
      return {
        label: "Strong",
        icon: TrendingUp,
        bgColor: "bg-success/10",
        textColor: "text-success",
        borderColor: "border-success/30",
        progressColor: "bg-success",
      };
    case "good":
      return {
        label: "Good",
        icon: Minus,
        bgColor: "bg-primary/10",
        textColor: "text-primary",
        borderColor: "border-primary/30",
        progressColor: "bg-primary",
      };
    case "needs-improvement":
      return {
        label: "Needs Improvement",
        icon: TrendingDown,
        bgColor: "bg-warning/10",
        textColor: "text-warning",
        borderColor: "border-warning/30",
        progressColor: "bg-warning",
      };
  }
};

const ScoreCard: React.FC<ScoreCardProps> = ({
  title,
  score,
  maxScore = 10,
  insights,
  index = 0,
  size = "default",
}) => {
  const status = getStatus(score);
  const config = getStatusConfig(status);
  const Icon = config.icon;
  const percentage = (score / maxScore) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className={`glass-card p-6 ${size === "large" ? "p-8" : ""}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h3
          className={`font-semibold text-foreground ${
            size === "large" ? "text-xl" : "text-lg"
          }`}
        >
          {title}
        </h3>
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor}`}
        >
          <Icon className="h-3 w-3" />
          {config.label}
        </div>
      </div>

      {/* Score */}
      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          <span
            className={`font-bold text-foreground ${
              size === "large" ? "text-5xl" : "text-4xl"
            }`}
          >
            {score.toFixed(1)}
          </span>
          <span className="text-lg text-muted-foreground">/{maxScore}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${percentage}%` }}
            transition={{ duration: 1, delay: 0.3 }}
            viewport={{ once: true }}
            className={`h-full rounded-full ${config.progressColor}`}
          />
        </div>
      </div>

      {/* Insights */}
      <ul className="space-y-2">
        {insights.map((insight, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm text-muted-foreground"
          >
            <span
              className={`mt-1.5 h-1.5 w-1.5 rounded-full ${config.progressColor} flex-shrink-0`}
            />
            {insight}
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

export default ScoreCard;
