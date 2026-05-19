"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, Variants, useReducedMotion } from "framer-motion";
import {
  Mic,
  ShieldCheck,
  Activity,
  Stethoscope,
  FileCheck,
  Brain,
  ArrowRight,
  Users,
  MapPin,
  Heart,
  Zap,
  ChevronRight
} from "lucide-react";
import { EmergencyBanner } from "@/components/landing/EmergencyBanner";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

const FEATURES = [
  {
    icon: Mic,
    title: "Voice & Text Triage",
    description:
      "Patients describe symptoms via voice or chat. Transcriptions are processed locally before clinical AI reasoning.",
    color: "indigo",
  },
  {
    icon: ShieldCheck,
    title: "Privacy-First Pipeline",
    description:
      "DPDP consent gate & Presidio scrubbing ensure the highest levels of data ethics and session security.",
    color: "emerald",
  },
  {
    icon: Activity,
    title: "Clinical Intelligence",
    description:
      "Fusing real-time biometric telemetry with deterministic multi-agent reasoning for absolute precision.",
    color: "cyan",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Secure Onboarding",
    text: "Patients review privacy protocols and initialize a high-security session.",
    icon: FileCheck,
  },
  {
    step: "02",
    title: "Intelligent Triage",
    text: "Symptoms are mapped against clinical guidelines with real-time safety guardrails.",
    icon: Brain,
  },
  {
    step: "03",
    title: "Seamless Handoff",
    text: "Physicians receive a structured, evidence-backed narrative for immediate action.",
    icon: Stethoscope,
  },
];

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: reduceMotion ? 0 : 0.15 },
    },
  };

  const itemVariants: Variants = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
      };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden flex flex-col medical-grid">
      
      <header className={`px-10 py-6 flex items-center justify-between sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-card shadow-md border-b border-border/50' : 'bg-card border-b border-border/50'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/10">
            <Stethoscope className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground uppercase">Aegis OS</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest">Clinician Access</Link>
          <Link href="/patient">
            <Button className="rounded-full px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 shadow-lg shadow-indigo-100">
              Patient Portal <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      <motion.main
        id="main-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex-grow"
      >
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 px-10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            
            <motion.div variants={itemVariants} className="text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-100 bg-indigo-50/50 mb-10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600">
                  Clinical Intelligence Core v2.5
                </span>
              </div>
              
              <h1 className="text-6xl sm:text-7xl font-bold tracking-tighter leading-[0.9] mb-10 text-slate-900">
                Precision Care <br />
                <span className="text-indigo-600">Orchestrated.</span>
              </h1>
              
              <p className="text-lg text-slate-500 max-w-xl mb-12 leading-relaxed font-medium">
                Aegis Triage OS fuses high-fidelity AI reasoning with deterministic safety rails to eliminate the healthcare hand-off crisis.
              </p>
              
              <div className="flex flex-wrap gap-6">
                <Link href="/patient">
                  <Button size="lg" className="h-16 px-12 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-2xl shadow-indigo-200 transition-all active:scale-95">
                    Initialize Triage
                  </Button>
                </Link>
                <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
                   <div className="flex -space-x-3">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                           DR
                        </div>
                      ))}
                   </div>
                   <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                     Trusted by 500+<br/>Clinical Nodes
                   </p>
                </div>
              </div>
            </motion.div>

            {/* Hero Visual */}
            <motion.div 
              variants={itemVariants}
              className="relative aspect-square lg:h-[650px] flex items-center justify-center pt-10"
            >
              <div className="absolute inset-0 bg-indigo-100/40 blur-[120px] rounded-full" />
              <div className="relative z-10 w-full h-full bg-card rounded-[4rem] border border-border shadow-2xl overflow-hidden group">
                <Image 
                  src="/clinical_ai_hero.png" 
                  alt="" 
                  fill
                  className="object-cover opacity-100 group-hover:scale-105 transition-transform duration-1000 grayscale-[0.1]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
                <div className="absolute bottom-12 left-12 right-12">
                  <div className="p-8 bg-card/80 backdrop-blur-3xl rounded-3xl border border-border shadow-xl">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
                        <Activity className="text-white w-6 h-6" />
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Live Telemetry</span>
                        <span className="text-base font-bold text-foreground tracking-tight">Active Biometric Stream</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: "70%" }}
                          transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                          className="h-full bg-indigo-600" 
                        />
                      </div>
                      <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>Ingestion</span>
                        <span className="text-indigo-600">Deliberating</span>
                        <span>Clinical Outcome</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-40 px-10 relative">
          <div className="max-w-7xl mx-auto">
            <motion.div variants={itemVariants} className="max-w-2xl mb-24">
              <h2 className="text-5xl font-bold mb-6 tracking-tight text-foreground leading-tight">Engineering Clinical <br/> Resilience.</h2>
              <p className="text-muted-foreground font-medium text-lg leading-relaxed">Built for the high-stakes reality of healthcare, where precision and privacy are non-negotiable.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {FEATURES.map((feature, idx) => (
                <motion.div 
                  key={feature.title} 
                  variants={itemVariants}
                  className="p-12 rounded-[3rem] bg-card border border-border hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-10 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">
                    <feature.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-5 text-foreground tracking-tight">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed font-medium">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Steps Visualizer */}
        <section className="py-40 px-10 bg-secondary/40">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
              <motion.div variants={itemVariants}>
                <h2 className="text-5xl font-bold mb-12 tracking-tight text-foreground leading-[1.1]">
                  A Frictionless Path <br />
                  <span className="text-primary">to Clinical Action.</span>
                </h2>
                <div className="space-y-16">
                  {STEPS.map((step, idx) => (
                    <div key={step.title} className="flex gap-10 group relative">
                      <div className="flex-shrink-0 w-16 h-16 rounded-[1.5rem] bg-secondary border border-border flex items-center justify-center font-bold text-primary text-xl group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm">
                        {step.step}
                      </div>
                      <div className="pt-2">
                        <h3 className="text-2xl font-bold text-foreground mb-3 tracking-tight">{step.title}</h3>
                        <p className="text-muted-foreground font-medium leading-relaxed">{step.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants} className="relative">
                <div className="absolute inset-0 bg-indigo-100/30 blur-[100px] rounded-full" />
                <div className="relative bg-card rounded-[4rem] p-6 border border-border shadow-2xl overflow-hidden">
                  <div className="relative w-full h-[400px]">
                    <Image 
                      src="/medical_pulse_viz_1778850726919.png" 
                      alt="Clinical Data Interface" 
                      fill
                      className="rounded-[3.5rem] opacity-90 grayscale-[0.2] hover:grayscale-0 transition-all duration-1000 object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent" />
                  <div className="absolute top-12 right-12">
                    <Badge className="bg-card/80 text-primary border-primary/20 px-6 py-2 backdrop-blur-xl shadow-lg shadow-primary/5 text-xs font-bold uppercase tracking-widest">
                      Audit Stream Active
                    </Badge>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-60 px-10 relative text-center">
          <div className="max-w-4xl mx-auto relative z-10">
            <h2 className="text-6xl font-bold mb-10 tracking-tighter text-foreground leading-[0.9]">Ready to Evolve?</h2>
            <p className="text-xl text-muted-foreground mb-16 font-medium max-w-2xl mx-auto leading-relaxed">
              Experience the next generation of clinical orchestration. Secure, intelligent, and designed for human resilience.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/patient">
                <Button size="lg" className="h-20 px-20 rounded-[2.5rem] bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-2xl shadow-primary/20 transition-all active:scale-95">
                  Launch Patient Portal
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="lg" className="h-20 px-16 rounded-[2.5rem] text-muted-foreground font-bold text-lg hover:bg-card hover:text-primary transition-all">
                  Clinician Access
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </motion.main>

      <LandingFooter />
    </div>
  );
}
