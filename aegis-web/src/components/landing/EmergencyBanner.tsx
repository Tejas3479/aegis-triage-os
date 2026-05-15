import { AlertTriangle, Phone } from 'lucide-react';

export function EmergencyBanner() {
  return (
    <div
      className="relative z-20 w-full bg-rose-950/90 border-b border-rose-900/50 text-rose-100"
      role="alert"
    >
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center sm:text-left">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" aria-hidden />
          <span>Medical emergency? Do not use this app — call emergency services immediately.</span>
        </div>
        <a
          href="tel:108"
          className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
        >
          <Phone className="w-3.5 h-3.5" aria-hidden />
          Call 108 (India)
        </a>
      </div>
    </div>
  );
}
