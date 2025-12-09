import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import FeatureCard from "@/components/FeatureCard";
import StepTimeline from "@/components/StepTimeline";
import ScoreCard from "@/components/ScoreCard";
import {
  ArrowRight,
  Play,
  Upload,
  UserCheck,
  Video,
  FileText,
  Target,
  Camera,
  Star,
  MessageSquare,
  Sparkles,
  Github,
  Twitter,
} from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: Target,
      title: "Role-Specific Questions",
      description: "AI generates questions tailored to your target role and seniority level, ensuring relevant practice.",
    },
    {
      icon: Camera,
      title: "Body Language Analysis",
      description: "Real-time analysis of your facial expressions, eye contact, and overall presence during answers.",
    },
    {
      icon: Star,
      title: "STAR Method Scoring",
      description: "Your answers are evaluated using the proven STAR framework for structured, impactful responses.",
    },
    {
      icon: MessageSquare,
      title: "Improvement Insights",
      description: "Receive actionable feedback and personalized suggestions to strengthen your interview skills.",
    },
  ];

  const steps = [
    {
      icon: Upload,
      title: "Upload Your Resume",
      description: "Simply drag and drop your resume. Our AI analyzes your experience to generate personalized questions.",
    },
    {
      icon: UserCheck,
      title: "Select Your Target Role",
      description: "Choose the position you're interviewing for and your desired seniority level.",
    },
    {
      icon: Video,
      title: "Practice Live Interview",
      description: "Answer AI-generated questions while we analyze your responses, delivery, and body language.",
    },
    {
      icon: FileText,
      title: "Review Detailed Report",
      description: "Get comprehensive feedback on your performance with actionable improvement suggestions.",
    },
  ];

  const sampleScores = [
    {
      title: "Content Score",
      score: 7.8,
      insights: [
        "Good use of specific examples",
        "Could add more quantifiable results",
        "Strong storytelling structure",
      ],
    },
    {
      title: "Delivery Score",
      score: 8.2,
      insights: [
        "Clear and articulate speech",
        "Good pacing and rhythm",
        "Minimal filler words used",
      ],
    },
    {
      title: "Confidence Score",
      score: 7.5,
      insights: [
        "Consistent eye contact",
        "Open body posture",
        "Room for more assertiveness",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6"
              >
                <Sparkles className="h-4 w-4" />
                AI-Powered Interview Coaching
              </motion.div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                AI Interview Coach for{" "}
                <span className="gradient-text">Your Next Big Role</span>
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Upload your resume, choose your target role, and practice with AI-generated 
                questions. Get detailed feedback on your answers, expressions, and delivery to 
                ace your next interview.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/setup">
                  <Button variant="hero" size="xl">
                    Start Interview Practice
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="hero-secondary" size="xl">
                  <Play className="h-5 w-5" />
                  Watch Demo
                </Button>
              </div>
            </motion.div>

            {/* Right: Mock interview card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="glass-card p-6 relative">
                {/* Glow effect behind card */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-2xl blur-xl opacity-50" />
                
                <div className="relative">
                  {/* Question preview */}
                  <div className="mb-4 p-4 rounded-xl bg-muted/50 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                        Behavioral
                      </span>
                      <span className="text-xs text-muted-foreground">Q2 of 8</span>
                    </div>
                    <p className="text-sm text-foreground">
                      "Tell me about a time you had to lead a team through a challenging project. 
                      What was your approach?"
                    </p>
                  </div>

                  {/* Webcam preview mockup */}
                  <div className="flex gap-4">
                    <div className="flex-1 aspect-video rounded-xl bg-muted/30 border border-border/50 flex items-center justify-center">
                      <div className="text-center">
                        <Video className="h-8 w-8 text-muted-foreground mb-2 mx-auto" />
                        <p className="text-xs text-muted-foreground">Camera Preview</p>
                      </div>
                    </div>
                    
                    {/* AI Feedback snippet */}
                    <div className="w-40 space-y-2">
                      <div className="p-2 rounded-lg bg-success/10 border border-success/20">
                        <p className="text-xs text-success">✓ Great eye contact</p>
                      </div>
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-xs text-primary">→ Add specific metrics</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted border border-border/50">
                        <p className="text-xs text-muted-foreground">Timer: 01:34</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 bg-card/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Four simple steps to transform your interview preparation
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <StepTimeline steps={steps} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Key Features
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to prepare for your dream job
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Sample Report Preview */}
      <section className="py-20 bg-card/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Sample Report Preview
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              See how detailed feedback helps you improve
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {sampleScores.map((score, index) => (
              <ScoreCard key={score.title} {...score} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="glass-card p-12 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Ready to Ace Your Interview?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                Start practicing now and get the confidence you need to land your dream job.
              </p>
              <Link to="/setup">
                <Button variant="hero" size="xl">
                  Start Free Practice
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-bold text-foreground">
                Interview<span className="text-primary">Aura</span>
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Practice smarter. Interview with confidence.
            </p>
            
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
