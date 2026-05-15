import Link from 'next/link';
import { Mic, ShieldCheck, Activity, Github, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-200 overflow-hidden relative">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 z-0 pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-10 px-6 py-4 border-b border-white/5 bg-slate-950/40 backdrop-blur-xl flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
          <span className="text-xl font-extrabold tracking-tighter bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
            Aegis OS
          </span>
        </div>
        <a 
          href="https://github.com/Tejas3479/aegis-triage-os" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          <Github className="w-4 h-4" />
          <span>GitHub</span>
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-4 py-20 text-center">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter bg-gradient-to-r from-slate-100 via-white to-slate-400 bg-clip-text text-transparent pb-2">
            Enterprise AI Triage for the Next Billion.
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Aegis OS merges hardware-accelerated multimodal voice ingestion with HDBSCAN epidemiological tracking to deliver instantaneous, clinical-grade triage to rural communities worldwide.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link 
              href="/patient"
              className="group flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold tracking-wide shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]"
            >
              <span>Patient Voice Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              href="/login"
              className="flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-slate-900/50 hover:bg-slate-800/80 text-slate-300 border border-slate-700 hover:border-slate-500 rounded-lg font-semibold tracking-wide backdrop-blur-sm transition-all"
            >
              Clinical Portal
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-32 w-full">
          <div className="flex flex-col items-center p-8 bg-slate-900/40 backdrop-blur border border-white/5 rounded-2xl shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-indigo-500/10 hover:bg-slate-800/40 cursor-default text-center">
            <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center mb-6 shadow-inner">
              <Mic className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">Voice-Native Triage</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Real-time WebAudio ingestion powered by LangGraph & Gemini 2.5 Pro for seamless, multimodal patient reasoning.
            </p>
          </div>

          <div className="flex flex-col items-center p-8 bg-slate-900/40 backdrop-blur border border-white/5 rounded-2xl shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-emerald-500/10 hover:bg-slate-800/40 cursor-default text-center">
            <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center mb-6 shadow-inner">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">Zero-Trust Privacy</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Microsoft Presidio integration actively scrubs PII from the clinical stream before any LLM inference occurs.
            </p>
          </div>

          <div className="flex flex-col items-center p-8 bg-slate-900/40 backdrop-blur border border-white/5 rounded-2xl shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-rose-500/10 hover:bg-slate-800/40 cursor-default text-center">
            <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center mb-6 shadow-inner">
              <Activity className="w-6 h-6 text-rose-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">Epidemic Radar</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              HDBSCAN vector clustering autonomously tracks geospatial disease outbreaks via the public health command center.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
