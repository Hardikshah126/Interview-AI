import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface StepTimelineProps {
  steps: Step[];
}

const StepTimeline = ({ steps }: StepTimelineProps) => {
  return (
    <div className="relative">
      {/* Connecting line */}
      <div className="absolute left-6 top-12 bottom-12 w-px bg-gradient-to-b from-primary/50 via-secondary/50 to-accent/50 hidden md:block" />
      
      <div className="grid gap-8 md:gap-12">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              viewport={{ once: true }}
              className="relative flex gap-6 items-start"
            >
              {/* Step number circle */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 border border-primary/40 text-primary font-bold text-lg">
                  {index + 1}
                </div>
                <div className="mt-2 flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default StepTimeline;
