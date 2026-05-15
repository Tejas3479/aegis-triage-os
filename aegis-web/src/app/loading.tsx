"use client";

import React from "react";
import { Activity } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 font-sans">
      {/* Background Mesh Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="relative space-y-6 text-center">
        <div className="relative mx-auto w-20 h-20 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center shadow-2xl">
          <Activity className="w-10 h-10 text-indigo-400 animate-pulse" />
          <div className="absolute inset-0 rounded-3xl border border-indigo-500/20 animate-ping opacity-20" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tighter text-slate-100 uppercase">
            Aegis OS
          </h2>
          <p className="text-slate-500 text-sm font-mono tracking-widest uppercase animate-pulse">
            Establishing Secure Clinical Connection...
          </p>
        </div>
      </div>

      {/* Progress Line (Decorative) */}
      <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent w-full opacity-20 animate-mesh" />
    </div>
  );
}
