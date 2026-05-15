"use client";

import React from "react";
import Link from "next/link";
import { Shield, ArrowLeft, Lock, Eye, Database, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-12">
        <header className="space-y-4">
          <Link href="/">
            <Button variant="ghost" className="text-slate-400 hover:text-white -ml-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Aegis
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-indigo-400" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tighter">Privacy Policy</h1>
          </div>
          <p className="text-slate-400 font-mono text-sm uppercase tracking-widest">
            Last Updated: May 15, 2026 // DPDP Compliance Revision
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 space-y-4">
              <div className="flex items-center gap-3 text-indigo-400">
                <Lock className="w-5 h-5" />
                <h2 className="font-bold uppercase tracking-wide">Data Protection</h2>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Aegis Triage OS utilizes a zero-trust architecture. Your clinical data is encrypted at rest and in transit. For voice triage, transcription occurs on our secure servers, and raw audio is purged immediately after processing.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 space-y-4">
              <div className="flex items-center gap-3 text-emerald-400">
                <Eye className="w-5 h-5" />
                <h2 className="font-bold uppercase tracking-wide">Anonymity</h2>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Patient sessions are ephemeral. We use session-scoped anonymous JWTs to prevent long-term tracking of individuals. Personal Identifiable Information (PII) is automatically scrubbed using clinical-grade redaction engines.
              </p>
            </div>
          </div>

          <div className="space-y-8 text-slate-300">
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" /> Information We Collect
              </h3>
              <p className="text-sm leading-relaxed">
                We collect only the minimum data necessary for clinical triage:
              </p>
              <ul className="list-disc pl-5 text-sm space-y-2 text-slate-400">
                <li>Voice or text symptom descriptions.</li>
                <li>Anonymized geospatial coordinates for outbreak monitoring.</li>
                <li>Device diagnostics for session stability.</li>
                <li>Mental health psychometric scores (PHQ-9) when explicitly shared.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" /> Your Rights (DPDP)
              </h3>
              <p className="text-sm leading-relaxed">
                Under the Digital Personal Data Protection Act, you have the right to:
              </p>
              <ul className="list-disc pl-5 text-sm space-y-2 text-slate-400">
                <li>Access a summary of your triage session.</li>
                <li>Request correction or erasure of your clinical record.</li>
                <li>Withdraw consent at any time via the session interface.</li>
                <li>Lodge a grievance with the Data Protection Board.</li>
              </ul>
            </div>
          </div>
        </section>

        <footer className="pt-12 border-t border-white/5 text-center">
          <p className="text-xs text-slate-500 max-w-2xl mx-auto">
            Aegis Triage OS is an AI-assisted tool. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
          </p>
        </footer>
      </div>
    </div>
  );
}
