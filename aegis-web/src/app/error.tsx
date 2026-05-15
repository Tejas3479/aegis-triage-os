"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an enterprise monitoring service (Sentry placeholder)
    console.error("Clinical Engine Fault:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Warning Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-950/20 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-red-950/10 backdrop-blur-2xl border border-red-500/20 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="mx-auto w-16 h-16 bg-slate-950 border border-red-500/30 rounded-2xl flex items-center justify-center shadow-inner group">
            <ShieldAlert className="w-8 h-8 text-red-500 group-hover:scale-110 transition-transform" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 uppercase">
              Clinical Engine Fault
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              The clinical engine has encountered an unhandled exception or is unresponsive.
              All PHI data remains encrypted and secure.
            </p>
          </div>

          <div className="bg-slate-950/50 border border-red-900/30 rounded-xl p-3 font-mono text-[10px] text-red-400/80 text-left overflow-auto max-h-24">
            ERROR_DIGEST: {error.digest || "UNSPECIFIED_CRITICAL_FAILURE"}
            <br />
            {error.message}
          </div>

          <div className="pt-4">
            <Button
              onClick={() => reset()}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-6 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all flex items-center justify-center gap-2 group"
            >
              <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              Reset Clinical Engine
            </Button>
          </div>

          <p className="text-[10px] text-slate-600 font-mono tracking-tighter uppercase">
            Protocol: Aegis-Recovery-Alpha-01 // Secure UI Restoration
          </p>
        </div>
      </div>
    </div>
  );
}
