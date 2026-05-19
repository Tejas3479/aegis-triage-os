import Link from 'next/link';
import { ShieldCheck, Stethoscope } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="relative z-10 border-t border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-10 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-12">
          <div className="space-y-4 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md">
                <Stethoscope className="w-5 h-5 text-white" aria-hidden />
              </div>
              <span className="font-bold text-slate-900 tracking-tight text-lg">Aegis Triage OS</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              Autonomous clinical intent orchestration for underserved communities. Engineered for high-precision, privacy-first healthcare hand-offs.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-12 text-sm">
            <div>
              <h3 className="text-slate-900 font-bold text-xs uppercase tracking-widest mb-4">
                Clinical Access
              </h3>
              <ul className="space-y-3 text-slate-500 font-medium">
                <li>
                  <Link href="/patient" className="hover:text-indigo-600 transition-colors">
                    Patient Portal
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-indigo-600 transition-colors">
                    Doctor Login
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="hover:text-indigo-600 transition-colors">
                    Clinical Provisioning
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-slate-900 font-bold text-xs uppercase tracking-widest mb-4">
                Governance
              </h3>
              <ul className="space-y-3 text-slate-500 font-medium">
                <li>
                  <Link href="/privacy" className="hover:text-indigo-600 transition-colors">
                    Privacy & DPDP
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-indigo-600 transition-colors">
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link href="/ethics" className="hover:text-indigo-600 transition-colors">
                    Clinical Ethics
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest text-center md:text-left">
            © {new Date().getFullYear()} Aegis Triage OS // Clinical Governance Protocol Active
          </p>
          <div className="flex items-center gap-6">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">DPDP & GDPR Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
