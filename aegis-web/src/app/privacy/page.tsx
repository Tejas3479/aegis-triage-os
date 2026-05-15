import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy & DPDP | Aegis Triage OS",
  description: "How Aegis Triage OS collects, processes, and protects patient data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="border-b border-white/5 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400" aria-hidden />
          <h1 className="text-lg font-bold">Privacy & Data Protection</h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-10 prose prose-invert prose-sm prose-slate">
        <p className="text-slate-400 text-sm not-prose">
          Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <section className="mt-8 space-y-4 text-slate-300 text-sm leading-relaxed">
          <h2 className="text-base font-semibold text-slate-100">Overview</h2>
          <p>
            Aegis Triage OS provides AI-assisted symptom guidance. We process the minimum data
            required for triage, outbreak analytics, and clinician workflows, in line with India&apos;s
            Digital Personal Data Protection Act (DPDP) principles.
          </p>

          <h2 className="text-base font-semibold text-slate-100">What we collect</h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-400">
            <li>Symptom descriptions you submit via voice or text (after consent)</li>
            <li>Anonymous session identifiers and coarse geolocation for outbreak mapping</li>
            <li>Hashed IP address at consent time (not stored in plain text)</li>
            <li>Psychometric screening scores if you complete optional assessments</li>
          </ul>

          <h2 className="text-base font-semibold text-slate-100">How we protect data</h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-400">
            <li>Consent is required before any clinical processing</li>
            <li>PII scrubbing (Presidio) before cloud AI clinical reasoning</li>
            <li>Local speech-to-text option so raw audio need not leave our servers</li>
            <li>Role-based access for clinician and administrator portals</li>
          </ul>

          <h2 className="text-base font-semibold text-slate-100">Your choices</h2>
          <p className="text-slate-400">
            You may decline consent and leave the patient portal. Where supported, you may revoke
            consent for your session. This app is not for medical emergencies — contact local
            emergency services (e.g. 108 in India).
          </p>

          <h2 className="text-base font-semibold text-slate-100">Contact</h2>
          <p className="text-slate-400">
            For privacy requests, contact your deploying organisation&apos;s data protection officer.
            This demo deployment does not constitute a commercial HIPAA certification.
          </p>
        </section>

        <Link
          href="/"
          className="not-prose inline-flex items-center gap-2 mt-10 text-sm text-indigo-400 hover:text-indigo-300 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Back to home
        </Link>
      </main>
    </div>
  );
}
