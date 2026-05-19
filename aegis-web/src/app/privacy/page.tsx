"use client";

import React from "react";
import { 
  ShieldCheck, 
  Lock, 
  EyeOff, 
  FileText, 
  Database, 
  Globe, 
  ArrowLeft,
  Stethoscope,
  ChevronRight,
  UserCheck
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ETHICS_PILLARS = [
  {
    icon: EyeOff,
    title: "Presidio PII Scrubbing",
    description: "Every symptomatic narrative is scrubbed of PII (Personally Identifiable Information) before it ever touches our clinical reasoning core."
  },
  {
    icon: Database,
    title: "Session Scoping",
    description: "Clinical sessions are strictly scoped and volatile by default. Your data is not sold or repurposed for training without explicit audit consent."
  },
  {
    icon: Globe,
    title: "Local-First Processing",
    description: "Whenever possible, we process voice and biometric data locally on your device or a secure hospital node, minimizing cloud exposure."
  }
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans medical-grid p-8 sm:p-20 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full -mr-32 -mt-32" />

      <div className="max-w-4xl mx-auto relative z-10">
        <header className="mb-20 space-y-8">
            <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-bold text-muted-foreground hover:text-primary uppercase tracking-widest transition-colors">
              <ArrowLeft size={14} /> Back to Hub
            </Link>
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                 <ShieldCheck className="text-white w-8 h-8" />
               </div>
               <div className="space-y-1">
                  <h1 className="text-5xl font-bold tracking-tighter text-foreground">Privacy & Ethics</h1>
                  <p className="text-muted-foreground font-medium text-lg">Our commitment to Clinical Intent Sovereignty.</p>
               </div>
            </div>
            <div className="flex flex-wrap gap-3">
               <Badge className="bg-primary/10 text-primary border-primary/20 uppercase text-[9px] font-bold tracking-widest px-3 py-1">DPDP 2023 Aligned</Badge>
               <Badge className="bg-stable/10 text-stable border-stable/20 uppercase text-[9px] font-bold tracking-widest px-3 py-1">DPDP Compliant</Badge>
               <Badge className="bg-secondary text-muted-foreground border-border uppercase text-[9px] font-bold tracking-widest px-3 py-1">Zero-Trust Architecture</Badge>
            </div>
        </header>

        <main className="space-y-24">
          
          {/* Ethics Pillars */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
               {ETHICS_PILLARS.map((pillar, i) => (
                 <motion.div 
                   key={i}
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.1 }}
                   viewport={{ once: true }}
                   className="p-10 rounded-[3rem] bg-card border border-border shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group"
                 >
                    <div className="w-12 h-12 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-all">
                       <pillar.icon size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-4 tracking-tight">{pillar.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">{pillar.description}</p>
                 </motion.div>
               ))}
            </div>
          </section>

          {/* Deep Protocol Section */}
          <section className="bg-card rounded-[4rem] p-16 border border-border shadow-2xl shadow-slate-200/40 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-16 opacity-[0.03]">
                <FileText size={200} className="text-primary" />
             </div>
             <div className="max-w-2xl space-y-12 relative z-10">
                <div className="space-y-4">
                   <h2 className="text-3xl font-bold text-foreground tracking-tight">The Aegis Privacy Protocol</h2>
                   <p className="text-muted-foreground font-medium leading-relaxed">
                     Aegis was architected during the 2026 Clinical Intelligence Crisis to solve the problem of medical data extraction. We believe your clinical symptoms belong to you and your licensed physician—no one else.
                   </p>
                </div>

                <div className="space-y-8">
                   {[
                     { title: "Consent Logging", text: "Every interaction is timestamped and logged against a verifiable consent hash on your project's private instance." },
                     { title: "Right to Erasure", text: "End your session at any time to purge ephemeral neural weights associated with your assessment." },
                     { title: "Clinical Handoff Security", text: "Doctors only access data through a hardware-encrypted tunnel using multi-factor biometric authentication." }
                   ].map((item, i) => (
                     <div key={i} className="flex gap-6 group">
                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                           <UserCheck size={18} />
                        </div>
                        <div>
                           <h4 className="font-bold text-foreground mb-1">{item.title}</h4>
                           <p className="text-sm text-muted-foreground font-medium">{item.text}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </section>
        </main>

        <footer className="mt-40 pt-10 border-t border-border text-center space-y-6">
           <div className="flex items-center justify-center gap-4">
              <div className="h-[1px] w-12 bg-border" />
              <Stethoscope size={18} className="text-muted-foreground" />
              <div className="h-[1px] w-12 bg-border" />
           </div>
           <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.5em]">
             Data Sovereignty Protocol v2.5 // Hardened Node
           </p>
           <div className="pt-10 pb-20">
              <Link href="/patient">
                <Button className="rounded-full px-10 h-14 bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all active:scale-95">
                  Proceed to Patient Portal <ChevronRight size={16} className="ml-2" />
                </Button>
              </Link>
           </div>
        </footer>
      </div>
    </div>
  );
}
