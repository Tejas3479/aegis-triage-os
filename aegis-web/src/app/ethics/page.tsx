"use client";

import React from "react";
import { 
  ShieldCheck, 
  ArrowLeft,
  Stethoscope,
  ChevronRight,
  UserCheck,
  Scale,
  Heart,
  Users
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ETHICS_PILLARS = [
  {
    icon: Heart,
    title: "Patient-First Autonomy",
    description: "Aegis is designed to augment, not replace, human clinical judgment. Patients retain full sovereignty over their healthcare decisions."
  },
  {
    icon: Scale,
    title: "Algorithmic Equity",
    description: "Our models are continuously audited to eliminate demographic, socioeconomic, and geographic bias in triage prioritization."
  },
  {
    icon: Users,
    title: "Community-Led Governance",
    description: "We work directly with local healthcare providers to ensure the AI respects community standards and cultural contexts."
  }
];

export default function EthicsPage() {
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
                 <Scale className="text-white w-8 h-8" />
               </div>
               <div className="space-y-1">
                  <h1 className="text-5xl font-bold tracking-tighter text-foreground">Clinical Ethics</h1>
                  <p className="text-muted-foreground font-medium text-lg">Governing AI in clinical decision support.</p>
               </div>
            </div>
            <div className="flex flex-wrap gap-3">
               <Badge className="bg-primary/10 text-primary border-primary/20 uppercase text-[9px] font-bold tracking-widest px-3 py-1">Ethics Aligned</Badge>
               <Badge className="bg-stable/10 text-stable border-stable/20 uppercase text-[9px] font-bold tracking-widest px-3 py-1">Human-in-the-Loop</Badge>
               <Badge className="bg-secondary text-muted-foreground border-border uppercase text-[9px] font-bold tracking-widest px-3 py-1">Bias Audited</Badge>
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
                <ShieldCheck size={200} className="text-primary" />
             </div>
             <div className="max-w-2xl space-y-12 relative z-10">
                <div className="space-y-4">
                   <h2 className="text-3xl font-bold text-foreground tracking-tight">The Aegis Ethical Framework</h2>
                   <p className="text-muted-foreground font-medium leading-relaxed">
                     Aegis operates under a strict &quot;Human-in-the-Loop&quot; philosophy. Our AI does not make final clinical diagnoses; it orchestrates intent and prioritizes cases so that human physicians can deliver care where it is needed most, equitably and efficiently.
                   </p>
                </div>

                <div className="space-y-8">
                   {[
                     { title: "No Black Boxes", text: "Every clinical recommendation includes a trace of the symptoms and reasoning that led to it, allowing physicians to audit the logic." },
                     { title: "Equitable Access", text: "We prioritize deployment in underserved areas, ensuring that advanced clinical support is not a luxury." },
                     { title: "Continuous Auditing", text: "Our models are regularly tested against diverse datasets to prevent drift and ensure consistent safety standards." }
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
             Clinical Governance Protocol v2.5 // Hardened Node
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
