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
} from "lucide-react";
import { EmergencyBanner } from "@/components/landing/EmergencyBanner";
import { LandingFooter } from "@/components/landing/LandingFooter";

const FEATURES = [
  {
    icon: Mic,
    title: "Voice & text triage",
    description:
      "Patients describe symptoms by voice or chat. Audio is transcribed on-server (local STT by default) before any cloud AI reasoning.",
    color: "indigo",
  },
  {
    icon: ShieldCheck,
    title: "Privacy-first pipeline",
    description:
      "DPDP consent gate, Presidio PII scrubbing, and session-scoped access. Designed to minimize exposure of identifiable data.",
    color: "emerald",
  },
  {
    icon: Activity,
    title: "Outbreak intelligence",
    description:
      "Geospatial clustering helps public-health teams spot emerging patterns — for clinicians and administrators only.",
    color: "cyan",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Consent & session",
    text: "Patients review a clear privacy notice and start an anonymous triage session.",
    icon: FileCheck,
  },
  {
    step: "02",
    title: "AI-assisted assessment",
    text: "Symptoms are analyzed with clinical guardrails and care-level guidance (home, clinic, or emergency).",
    icon: Brain,
  },
  {
    step: "03",
    title: "Clinician handoff",
    text: "Licensed staff prioritize cases on a live queue and access structured reports when needed.",
    icon: Stethoscope,
  },
];

const TRUST_ITEMS = [
  { label: "DPDP consent logging", icon: FileCheck },
  { label: "Local voice STT option", icon: Mic },
  { label: "Role-separated portals", icon: Users },
  { label: "Rural-first design", icon: MapPin },
];

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const cards = document.getElementsByClassName("mouse-glow-card");
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i] as HTMLElement;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
      card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: reduceMotion ? 0 : 0.12 },
    },
  };

  const itemVariants: Variants = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
      };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-50 font-sans relative overflow-hidden flex flex-col"
      onMouseMove={handleMouseMove}
      ref={containerRef}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>

      <EmergencyBanner />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none animate-mesh" />

      <motion.header
        initial={reduceMotion ? false : { y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 px-6 py-4 border-b border-white/5 bg-slate-950/60 backdrop-blur-md"
      >
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group" aria-label="Aegis Triage OS home">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
            <span className="font-extrabold tracking-tight text-xl text-slate-100">Aegis Triage OS</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4" aria-label="Main navigation">
            <Link
              href="/privacy"
              className="hidden sm:inline text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/login"
              className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-2 min-h-[44px] inline-flex items-center"
            >
              Clinician login
            </Link>
            <Link
              href="/patient"
              className="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 min-h-[44px] rounded-full inline-flex items-center transition-colors shadow-lg shadow-indigo-900/30"
            >
              Start triage
            </Link>
          </nav>
        </div>
      </motion.header>

      <motion.main
        id="main-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex-grow"
      >
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 text-center">
          <motion.div variants={itemVariants}>
            <p className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-emerald-400/90 border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden />
              DPDP-aligned · AI clinical decision support
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-50 max-w-4xl mx-auto leading-[1.1]">
              Accessible triage for communities{" "}
              <span className="bg-gradient-to-r from-indigo-300 via-slate-100 to-indigo-400 bg-clip-text text-transparent">
                far from the hospital
              </span>
            </h1>
            <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mt-6 leading-relaxed">
              Aegis helps patients understand how urgently they should seek care — through voice or
              text — while giving clinicians a prioritized queue and outbreak visibility.
            </p>
            <p className="text-xs text-slate-500 max-w-xl mx-auto mt-4">
              This is an AI assistant, not emergency services or a licensed diagnosis.
            </p>
          </motion.div>

          {/* Trust zones — patient vs clinical */}
          <motion.div
            variants={itemVariants}
            className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto"
          >
            <Link
              href="/patient"
              className="group flex flex-col items-start text-left p-6 rounded-2xl bg-indigo-600/90 hover:bg-indigo-500 border border-indigo-500/30 min-h-[120px] transition-all shadow-xl shadow-indigo-950/40"
            >
              <Users className="w-6 h-6 text-indigo-100 mb-3" aria-hidden />
              <span className="font-semibold text-white text-lg">Patient triage</span>
              <span className="text-indigo-100/80 text-sm mt-1">
                Voice or chat · consent required · no account
              </span>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-white">
                Begin session <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
            <Link
              href="/login"
              className="group flex flex-col items-start text-left p-6 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 min-h-[120px] transition-all"
            >
              <Stethoscope className="w-6 h-6 text-slate-300 mb-3" aria-hidden />
              <span className="font-semibold text-slate-100 text-lg">Clinician portal</span>
              <span className="text-slate-400 text-sm mt-1">
                Priority queue · reports · epidemic radar (admin)
              </span>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-slate-300">
                Sign in <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </motion.div>

          {/* Trust strip */}
          <motion.ul
            variants={itemVariants}
            className="mt-12 flex flex-wrap justify-center gap-3 sm:gap-6"
            aria-label="Platform capabilities"
          >
            {TRUST_ITEMS.map(({ label, icon: Icon }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-500 font-mono uppercase tracking-wide"
              >
                <Icon className="w-3.5 h-3.5 text-slate-600" aria-hidden />
                {label}
              </li>
            ))}
          </motion.ul>
        </section>

        {/* How it works */}
        <section className="border-y border-white/5 bg-slate-900/30 py-16 px-6" aria-labelledby="how-it-works">
          <div className="max-w-6xl mx-auto">
            <motion.div variants={itemVariants} className="text-center mb-12">
              <h2 id="how-it-works" className="text-2xl sm:text-3xl font-bold text-slate-100">
                How it works
              </h2>
              <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">
                A clear path from patient symptom to clinician action.
              </p>
            </motion.div>
            <motion.ol variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {STEPS.map(({ step, title, text, icon: Icon }) => (
                <li key={step} className="relative">
                  <span className="text-[10px] font-mono text-indigo-400/80 uppercase tracking-widest">
                    Step {step}
                  </span>
                  <div className="mt-3 p-5 rounded-xl border border-white/5 bg-slate-950/50">
                    <Icon className="w-8 h-8 text-indigo-400 mb-3" aria-hidden />
                    <h3 className="font-semibold text-slate-200">{title}</h3>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">{text}</p>
                  </div>
                </li>
              ))}
            </motion.ol>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-6" aria-labelledby="features-heading">
          <div className="max-w-6xl mx-auto">
            <motion.h2
              id="features-heading"
              variants={itemVariants}
              className="text-2xl font-bold text-center text-slate-100 mb-10"
            >
              Built for real clinical constraints
            </motion.h2>
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {FEATURES.map(({ icon: Icon, title, description, color }) => (
                <article
                  key={title}
                  className="mouse-glow-card p-6 rounded-2xl bg-slate-900/40 backdrop-blur border border-white/5 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                      color === "indigo"
                        ? "bg-indigo-500/10"
                        : color === "emerald"
                          ? "bg-emerald-500/10"
                          : "bg-cyan-500/10"
                    }`}
                  >
                    <Icon
                      className={
                        color === "indigo"
                          ? "text-indigo-400"
                          : color === "emerald"
                            ? "text-emerald-400"
                            : "text-cyan-400"
                      }
                      size={24}
                      aria-hidden
                    />
                  </div>
                  <h3 className="text-lg font-bold text-slate-200 mb-2">{title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
                </article>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA band */}
        <section className="px-6 pb-20">
          <motion.div
            variants={itemVariants}
            className="max-w-3xl mx-auto text-center p-8 sm:p-10 rounded-3xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/40 to-slate-950"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
              Ready to try patient triage?
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              You will be asked to accept our privacy notice before any symptom data is processed.
            </p>
            <Link
              href="/patient"
              className="mt-6 inline-flex items-center justify-center gap-2 min-h-[48px] px-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
            >
              Open patient portal
              <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </motion.div>
        </section>
      </motion.main>

      <LandingFooter />
    </div>
  );
}
