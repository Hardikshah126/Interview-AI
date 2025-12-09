import * as React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Zap, Code, Users, Flag } from "lucide-react";

export type QuestionType = "behavioral" | "technical" | "situational" | "cultural";
export type Difficulty = "easy" | "medium" | "hard";

interface QuestionCardProps {
  question: string;
  type: QuestionType;
  difficulty: Difficulty;
  index?: number;
  compact?: boolean;
  showFlag?: boolean;
  onFlag?: () => void;
}

const typeConfig: Record<
  QuestionType,
  { icon: typeof MessageSquare; label: string; color: string }
> = {
  behavioral: {
    icon: Users,
    label: "Behavioral",
    color: "bg-primary/10 text-primary border-primary/30",
  },
  technical: {
    icon: Code,
    label: "Technical",
    color: "bg-secondary/20 text-secondary border-secondary/30",
  },
  situational: {
    icon: MessageSquare,
    label: "Situational",
    color: "bg-accent/20 text-accent border-accent/30",
  },
  cultural: {
    icon: Zap,
    label: "Cultural Fit",
    color: "bg-success/10 text-success border-success/30",
  },
};

const difficultyConfig: Record<Difficulty, string> = {
  easy: "bg-success/10 text-success",
  medium: "bg-warning/10 text-warning",
  hard: "bg-destructive/10 text-destructive",
};

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  type,
  difficulty,
  index = 0,
  compact = false,
  showFlag = false,
  onFlag,
}) => {
  const TypeIcon = typeConfig[type].icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={`glass-card ${compact ? "p-4" : "p-6"}`}
    >
      {/* Tags row */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Badge
          variant="outline"
          className={`flex items-center gap-1.5 ${typeConfig[type].color} border`}
        >
          <TypeIcon className="h-3 w-3" />
          {typeConfig[type].label}
        </Badge>
        <Badge
          variant="secondary"
          className={`capitalize ${difficultyConfig[difficulty]}`}
        >
          {difficulty}
        </Badge>
        {showFlag && (
          <button
            onClick={onFlag}
            className="ml-auto p-1.5 rounded-lg hover:bg-muted transition-colors group"
          >
            <Flag className="h-4 w-4 text-muted-foreground group-hover:text-warning transition-colors" />
          </button>
        )}
      </div>

      {/* Question text */}
      <p
        className={`text-foreground leading-relaxed ${
          compact ? "text-sm" : "text-base"
        }`}
      >
        {question}
      </p>
    </motion.div>
  );
};

export default QuestionCard;
