'use client';

import React from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  Mic, 
  Brain, 
  ShieldCheck, 
  Activity,
  ArrowRight,
  HeartPulse,
  ShieldAlert,
  Radar,
  Zap,
  ChevronRight,
  Stethoscope
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const PATIENT_FEATURES = [
  {
    title: "AI Chat Triage",
    description: "Initialize high-precision symptomatic assessment via secure chat.",
    href: "/patient/chat",
    icon: MessageSquare,
    color: "bg-indigo-50 text-indigo-600 border-indigo-100",
    status: "Active"
  },
  {
    title: "Voice Analysis",
    description: "Record audio symptoms for clinical-grade transcription and analysis.",
    href: "/patient/voice",
    icon: Mic,
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    status: "Ready"
  },
  {
    title: "Mental Health",
    description: "Complete your PHQ-9 baseline and crisis trauma assessment.",
    href: "/patient/mental",
    icon: Brain,
    color: "bg-purple-50 text-purple-600 border-purple-100",
    status: "Recommended"
  },
  {
    title: "Wearable Sync",
    description: "Link real-time heart rate and SpO2 sensors for Bio-Drift monitoring.",
    href: "/patient/wearables",
    icon: HeartPulse,
    color: "bg-rose-50 text-rose-600 border-rose-100",
    status: "Optional"
  },
  {
    title: "Data Ethics",
    description: "Manage your DPDP consent and active session privacy controls.",
    href: "/patient/consent",
    icon: ShieldCheck,
    color: "bg-slate-50 text-slate-600 border-slate-100",
    status: "Protected"
  }
];

export default function PatientDashboard() {
  return (
    <div className="min-h-screen bg-background p-8 sm:p-16 medical-grid font-sans selection:bg-primary/10">
      <div className="max-w-7xl mx-auto">
        
        {/* Refined Patient Header */}
        <header className="mb-20 relative">
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-primary/5 blur-[120px] rounded-full" />
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-4 mb-8">
               <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/10">
                  <Stethoscope className="text-white w-6 h-6" />
               </div>
               <Badge className="bg-primary/10 text-primary border-border font-bold uppercase tracking-widest px-4 py-1.5 shadow-sm">
                  Clinical Command Center // v2.5 ICE
               </Badge>
            </div>
            
            <h1 className="text-6xl font-bold tracking-tighter text-foreground mb-8 leading-[1.1]">
              Welcome to <br />
              <span className="text-primary">Secure Care.</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl text-lg font-medium leading-relaxed">
              Your triage environment is active and protected by the Aegis Guardian Engine. 
              Select a module below to begin your high-precision clinical assessment.
            </p>
          </motion.div>
        </header>

        {/* Dynamic ICE HUD (The "New Features" explicit highlight) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-8 p-10 bg-card rounded-[3rem] border border-border shadow-xl shadow-border/10 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <Radar size={120} className="text-primary animate-spin-slow" />
            </div>
            <div className="flex-1 space-y-6 relative z-10">
               <Badge className="bg-primary/10 text-primary border-border uppercase text-[10px] tracking-widest px-4 py-1 font-bold">ICE Sentinel Active</Badge>
               <h3 className="text-3xl font-bold text-foreground tracking-tight">Active Care-Continuity Monitor</h3>
               <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-md">
                 Aegis is currently tracking your physiological baseline for deviations and cross-referencing all symptoms against pharmacological safety guidelines.
               </p>
            </div>
            <div className="grid grid-cols-2 gap-4 shrink-0 relative z-10">
               <div className="p-6 rounded-[2rem] bg-primary/10 border border-border flex flex-col items-center justify-center gap-2">
                  <Activity size={24} className="text-primary" />
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Bio-Drift</span>
               </div>
               <div className="p-6 rounded-[2rem] bg-stable/10 border border-border flex flex-col items-center justify-center gap-2">
                  <ShieldCheck size={24} className="text-stable" />
                  <span className="text-[10px] font-bold text-stable uppercase tracking-widest">Safe Audit</span>
               </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-4 p-10 bg-primary rounded-[3rem] shadow-xl shadow-primary/10 flex flex-col justify-between text-white"
          >
             <div>
                <ShieldAlert size={32} className="mb-6 opacity-80" />
                <h4 className="text-xl font-bold mb-3 tracking-tight">Emergency Protocol</h4>
                <p className="text-primary-foreground/80 text-sm font-medium leading-relaxed">
                   If you are experiencing severe chest pain or shortness of breath, bypass triage immediately.
                </p>
             </div>
             <Button className="mt-8 bg-white text-primary hover:bg-white/90 rounded-2xl h-12 font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                Call Local EMS
             </Button>
          </motion.div>
        </div>

        {/* Feature Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {PATIENT_FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
              >
                <Link href={feature.href} className="group block h-full">
                  <div className="h-full bg-card p-10 rounded-[3rem] border border-border hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 relative flex flex-col justify-between overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                       <Icon size={120} />
                    </div>
                    <div>
                      <div className="flex justify-between items-start mb-10 relative z-10">
                        <div className={cn(
                          "w-16 h-16 rounded-[1.5rem] flex items-center justify-center border transition-all duration-500 group-hover:scale-110 shadow-sm",
                          feature.color
                        )}>
                          <Icon size={30} />
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest border-border text-muted-foreground group-hover:text-primary transition-colors py-1 px-3">
                          {feature.status}
                        </Badge>
                      </div>
                      <h2 className="text-2xl font-bold text-foreground mb-4 tracking-tight relative z-10">
                        {feature.title}
                      </h2>
                      <p className="text-muted-foreground font-medium leading-relaxed mb-10 relative z-10">
                        {feature.description}
                      </p>
                    </div>
                    <div className="flex items-center text-[11px] font-bold text-primary uppercase tracking-widest gap-2 group-hover:gap-4 transition-all relative z-10">
                      Initialize Module <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Footer Audit Context */}
        <footer className="py-10 border-t border-border flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex items-center gap-3">
              <Zap size={16} className="text-primary/70" />
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Clinical Engine: Operational // Node_BLR_ICE_1</span>
           </div>
           <div className="flex items-center gap-10">
              <div className="flex flex-col items-end">
                 <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Session Integrity</span>
                 <span className="text-stable font-bold text-xs">ENCRYPTED // VERIFIED</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-secondary border border-border flex items-center justify-center text-muted-foreground">
                 <ShieldCheck size={20} />
              </div>
           </div>
        </footer>
      </div>

      <style jsx global>{`
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: rotate-slow 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
