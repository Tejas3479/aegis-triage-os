import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="relative z-10 border-t border-white/5 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="space-y-3 max-w-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" aria-hidden />
              <span className="font-bold text-slate-200">Aegis Triage OS</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              AI-assisted symptom guidance for underserved communities. Not a substitute for
              licensed medical diagnosis or emergency care.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <h3 className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-3">
                Product
              </h3>
              <ul className="space-y-2 text-slate-500">
                <li>
                  <Link href="/patient" className="hover:text-slate-200 transition-colors">
                    Patient triage
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-slate-200 transition-colors">
                    Clinician login
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="hover:text-slate-200 transition-colors">
                    Request access
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-3">
                Legal
              </h3>
              <ul className="space-y-2 text-slate-500">
                <li>
                  <Link href="/privacy" className="hover:text-slate-200 transition-colors">
                    Privacy & DPDP
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-slate-200 transition-colors">
                    Terms of use
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-8 pt-6 border-t border-white/5 text-[10px] text-slate-600 font-mono text-center md:text-left">
          © {new Date().getFullYear()} Aegis Triage OS · DPDP-aligned consent · Local voice transcription by default
        </p>
      </div>
    </footer>
  );
}
