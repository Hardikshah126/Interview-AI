import * as React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export type EmotionType =
  | "calm"
  | "confident"
  | "hesitant"
  | "neutral"
  | "nervous"
  | "engaged";

interface EmotionBadgeProps {
  emotion: EmotionType;
  icon: LucideIcon;
  active?: boolean;
  index?: number;
}

const emotionConfig: Record<
  EmotionType,
  { bg: string; text: string; border: string }
> = {
  calm: {
    bg: "bg-success/10",
    text: "text-success",
    border: "border-success/30",
  },
  confident: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/30",
  },
  hesitant: {
    bg: "bg-warning/10",
    text: "text-warning",
    border: "border-warning/30",
  },
  neutral: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
  },
  nervous: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    border: "border-destructive/30",
  },
  engaged: {
    bg: "bg-secondary/20",
    text: "text-secondary",
    border: "border-secondary/30",
  },
};

const EmotionBadge: React.FC<EmotionBadgeProps> = ({
  emotion,
  icon: Icon,
  active = false,
  index = 0,
}) => {
  const config = emotionConfig[emotion];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-300
        ${config.bg} ${config.border}
        ${active ? "ring-2 ring-offset-2 ring-offset-background ring-current" : ""}
      `}
    >
      <Icon className={`h-4 w-4 ${config.text}`} />
      <span className={`text-sm font-medium capitalize ${config.text}`}>
        {emotion}
      </span>
      {active && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`h-2 w-2 rounded-full ${config.text.replace(
            "text-",
            "bg-"
          )} animate-pulse`}
        />
      )}
    </motion.div>
  );
};

export default EmotionBadge;
