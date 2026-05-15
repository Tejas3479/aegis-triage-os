"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, User, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { loginDoctor } from "@/lib/api";
import Cookies from "js-cookie";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await loginDoctor(username, pin);
      Cookies.set('aegis_token', token, { secure: true, sameSite: 'strict', expires: 1 });
      toast.success("Authentication successful. Welcome back, Doctor.");
      router.push("/doctor");
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Authentication failed. Please verify credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 z-0 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl p-8 space-y-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center shadow-inner group">
              <ShieldCheck className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-100 uppercase">
                Aegis Gateway
              </h1>
              <p className="text-slate-400 text-sm font-mono mt-1">
                Clinical Personnel Authentication
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest pl-1">
                Clinical ID
              </label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono transition-all"
                  placeholder="doctor_name"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest pl-1">
                Secure PIN
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Authenticate Identity
                  <ShieldCheck className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 text-center">
            <Link
              href="/signup"
              className="text-xs font-mono text-slate-500 hover:text-indigo-400 transition-colors"
            >
              Need clinical access? Request provisioning.
            </Link>
          </div>
        </div>

        <p className="mt-8 text-[10px] text-slate-600 font-mono text-center tracking-tighter uppercase">
          Zero-Trust Infrastructure Active // Secure Authentication Protocol
        </p>
      </div>
    </div>
  );
}
