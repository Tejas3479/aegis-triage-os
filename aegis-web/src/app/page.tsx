"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { Mic, ShieldCheck, Activity, Code } from "lucide-react";

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const cards = document.getElementsByClassName("mouse-glow-card");
    for (const card of cards as any) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      transition: { duration: 0.8, ease: "easeOut" }
    },
  };

  return (
    <div 
      className="min-h-screen bg-slate-950 text-slate-50 font-sans relative overflow-hidden flex flex-col"
      onMouseMove={handleMouseMove}
      ref={containerRef}
    >
      {/* Absolute Background Glow Physics with Animation */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none animate-mesh" />

      {/* Header: Logo & Mock GitHub */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 px-6 py-4 border-b border-white/5 bg-slate-950/40 backdrop-blur-md flex justify-between items-center"
      >
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
          <span className="font-extrabold tracking-tight text-xl">
            Aegis OS
          </span>
        </div>
        <Link
          href="https://github.com"
          target="_blank"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <Code size={18} />
          <span>GitHub</span>
        </Link>
      </motion.header>

      {/* Main Content Area */}
      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex-grow flex flex-col justify-center pt-20 pb-16"
      >
        {/* Hero Section */}
        <motion.div variants={itemVariants} className="text-center max-w-4xl mx-auto px-6 mb-20">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent pb-4 relative overflow-hidden">
            Enterprise AI Triage <br className="hidden md:block" /> for the Next
            Billion.
            <div className="absolute inset-0 animate-shimmer pointer-events-none" />
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-light tracking-wide max-w-3xl mx-auto mt-6 leading-relaxed">
            Aegis OS merges hardware-accelerated multimodal voice ingestion with
            HDBSCAN epidemiological tracking to deliver instantaneous,
            clinical-grade triage to rural communities worldwide.
          </p>

          {/* Call To Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link
              href="/patient"
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-8 rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(79,70,229,0.6)]"
            >
              Patient Voice Portal &rarr;
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto bg-slate-900/50 hover:bg-slate-800 backdrop-blur-md border border-white/10 text-white font-medium py-3 px-8 rounded-full transition-all duration-300 hover:-translate-y-1"
            >
              Clinical Portal
            </Link>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto px-6">

          {/* Feature 1 */}
          <div className="mouse-glow-card p-6 rounded-2xl bg-slate-900/40 backdrop-blur border border-white/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-indigo-500/10 group overflow-hidden">
            <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mic className="text-indigo-400" size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">
              Voice-Native Triage
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Hardware-accelerated DSP audio processing captures nuanced patient
              vitals in the noisiest rural environments.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="mouse-glow-card p-6 rounded-2xl bg-slate-900/40 backdrop-blur border border-white/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald-500/10 group overflow-hidden">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="text-emerald-400" size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">
              Zero-Trust Privacy
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Military-grade PII scrubbers and Presidio NLP pipelines ensure total
              HIPAA compliance before data reaches the LLM.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="mouse-glow-card p-6 rounded-2xl bg-slate-900/40 backdrop-blur border border-white/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-cyan-500/10 group overflow-hidden">
            <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Activity className="text-cyan-400" size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">
              Epidemic Radar
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Real-time Haversine clustering and HDBSCAN algorithms detect
              infectious outbreaks before they spread.
            </p>
          </div>

        </motion.div>
      </motion.main>
    </div>
  );
}