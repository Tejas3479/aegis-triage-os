import { AlertTriangle, Phone } from 'lucide-react';

export function EmergencyBanner() {
  return (
    <div
      className="relative z-50 w-full bg-rose-50 border-b border-rose-100 text-rose-700"
      role="alert"
    >
      <div className="max-w-7xl mx-auto px-10 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" aria-hidden />
          <span>Medical Emergency? Please call 108 or your local emergency number immediately.</span>
        </div>
        <a
          href="tel:108"
          className="inline-flex items-center gap-2 h-10 px-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-100 transition-all active:scale-95"
        >
          <Phone className="w-3.5 h-3.5" aria-hidden />
          Call Emergency Services
        </a>
      </div>
    </div>
  );
}
