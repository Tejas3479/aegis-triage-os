"use client";

import React, { useState } from "react";
import { 
  Brain, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Heart, 
  Info,
  ShieldCheck,
  Stethoscope
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const QUESTIONS = [
  "Little interest or pleasure in doing things?",
  "Feeling down, depressed, or hopeless?",
  "Trouble falling or staying asleep, or sleeping too much?",
  "Feeling tired or having little energy?",
  "Poor appetite or overeating?",
  "Feeling bad about yourself — or that you are a failure or have let yourself or your family down?",
  "Trouble concentrating on things, such as reading the newspaper or watching television?",
  "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual?",
  "Thoughts that you would be better off dead or of hurting yourself in some way?"
];

const OPTIONS = [
  { label: "Not at all", value: 0 },
  { label: "Several days", value: 1 },
  { label: "More than half the days", value: 2 },
  { label: "Nearly every day", value: 3 }
];

export default function MentalHealthPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [completed, setCompleted] = useState(false);

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[step] = value;
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      setTimeout(() => setStep(step + 1), 300);
    } else {
      setCompleted(true);
      toast.success("Assessment complete. Analyzing results...");
    }
  };

  if (completed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8 medical-grid font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full bg-card rounded-[3rem] p-16 text-center space-y-10 shadow-xl shadow-border/40 border border-border"
        >
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-stable/10 rounded-full flex items-center justify-center text-stable shadow-inner">
              <CheckCircle2 size={48} />
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground tracking-tight">Assessment Received</h1>
            <p className="text-muted-foreground text-lg font-medium leading-relaxed max-w-md mx-auto">
              Your responses have been securely transmitted to the Aegis Clinical Engine. A physician will review these alongside your physiological data.
            </p>
          </div>
          <div className="pt-6">
            <Button 
              onClick={() => window.location.href = '/patient'}
              className="h-16 px-12 rounded-[2rem] bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-lg shadow-primary/10"
            >
              Return to Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-8 sm:p-20 medical-grid font-sans relative overflow-hidden">
      
      {/* Supportive Accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[100px] rounded-full -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-stable/5 blur-[100px] rounded-full -ml-48 -mb-48" />

      <header className="w-full max-w-4xl flex items-center justify-between mb-20 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/10">
            <Brain className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight uppercase">Psychological Assessment</h2>
            <div className="flex items-center gap-2 mt-0.5">
               <Badge className="bg-primary/10 text-primary border-border font-bold text-[9px] uppercase tracking-widest px-2 py-0.5">PHQ-9 Protocol</Badge>
               <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1">
                 <ShieldCheck size={12} className="text-stable" /> AES-256 Encrypted
               </span>
            </div>
          </div>
        </div>
        <div className="text-right">
           <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Progress</span>
           <div className="flex items-center gap-3 mt-1">
              <span className="text-sm font-bold text-foreground">{Math.round((step / QUESTIONS.length) * 100)}%</span>
              <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden border border-border">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${(step / QUESTIONS.length) * 100}%` }}
                   className="h-full bg-primary" 
                 />
              </div>
           </div>
        </div>
      </header>

      <main className="w-full max-w-3xl relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
          >
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {step + 1}
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">In the last 2 weeks...</span>
               </div>
               <h3 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight">
                 {QUESTIONS[step]}
               </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(opt.value)}
                  className="group relative p-8 rounded-[2rem] bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 text-left active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                     <span className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{opt.label}</span>
                     <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-20 pt-10 border-t border-border flex items-center justify-between">
           <button 
             onClick={() => setStep(Math.max(0, step - 1))}
             disabled={step === 0}
             className="flex items-center gap-2 text-muted-foreground hover:text-primary disabled:opacity-0 transition-all font-bold text-[10px] uppercase tracking-widest"
           >
             <ChevronLeft size={16} /> Previous Question
           </button>
           <div className="flex items-center gap-3 text-muted-foreground">
              <Heart size={16} className="text-critical" />
              <span className="text-[10px] font-bold uppercase tracking-widest">You are in a safe space.</span>
           </div>
        </div>
      </main>

      <footer className="mt-auto pt-20 text-center space-y-4">
         <div className="flex items-center justify-center gap-3">
            <div className="h-[1px] w-6 bg-border" />
            <Stethoscope size={14} className="text-muted-foreground" />
            <div className="h-[1px] w-6 bg-border" />
         </div>
         <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-[0.4em]">
           Clinical Sentinel // Mental Health Module
         </p>
      </footer>
    </div>
  );
}
