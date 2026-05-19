"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ShieldCheck, 
  User, 
  Lock, 
  Loader2, 
  Zap, 
  Fingerprint,
  Cpu,
  Globe,
  Stethoscope
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { loginDoctor } from "@/lib/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setBooting(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await loginDoctor(username, pin);
      toast.success("Authentication successful. Welcome, Doctor.");
      router.push("/doctor/queue");
    } catch (err: any) {
      toast.error(err.message || "Access Denied: Protocol Violation");
    } finally {
      setLoading(false);
    }
  };

  if (booting) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 medical-grid">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-8"
        >
          <div className="relative">
            <div className="w-24 h-24 border-[3px] border-primary/20 rounded-[2.5rem] animate-pulse" />
            <ShieldCheck className="absolute inset-0 m-auto w-10 h-10 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] animate-pulse">
              Securing Clinical Gateway...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 relative overflow-hidden font-sans medical-grid">
      
      {/* Soft Background Accents */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-stable/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] relative z-10"
      >
        <div className="bg-card rounded-[3rem] p-12 space-y-12 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-border relative overflow-hidden">
          
          {/* Subtle Branding */}
          <div className="text-center space-y-8">
            <div className="flex justify-center">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="w-20 h-20 bg-secondary border border-border rounded-[2rem] flex items-center justify-center relative z-10 shadow-sm group-hover:border-primary transition-all duration-500">
                  <Stethoscope className="w-10 h-10 text-primary" />
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Aegis Gateway
              </h1>
              <div className="flex items-center justify-center gap-3">
                <div className="h-[1px] w-6 bg-border" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Secure Clinical Access</span>
                <div className="h-[1px] w-6 bg-border" />
              </div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-10">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1 flex items-center gap-2">
                <User size={14} className="text-primary" />
                Personnel Identifier
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-secondary border border-border rounded-2xl py-4 px-6 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all font-medium text-sm"
                placeholder="Enter ID_SECURE"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1 flex items-center gap-2">
                <Lock size={14} className="text-primary" />
                Security PIN
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-secondary border border-border rounded-2xl py-4 px-6 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all font-medium text-sm tracking-[0.4em]"
                placeholder="••••"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-[1.5rem] shadow-xl shadow-primary/20 transition-all duration-300 font-bold text-sm tracking-tight relative overflow-hidden active:scale-95"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Initialize Session
                    <Zap className="w-4 h-4" />
                  </>
                )}
              </span>
            </Button>
          </form>

          {/* Clinical Context Badges */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="flex flex-col items-center gap-2 opacity-50">
              <Cpu size={16} className="text-muted-foreground" />
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Biometric Auth</span>
            </div>
            <div className="flex flex-col items-center gap-2 opacity-50">
              <Globe size={16} className="text-muted-foreground" />
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Global Node Hub</span>
            </div>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 space-y-6 text-center"
        >
          <div className="flex items-center justify-center gap-8">
            <Link href="/signup" className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
              Request Provisioning
            </Link>
            <div className="w-[1px] h-3 bg-border" />
            <Link href="/privacy" className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
              Data Ethics
            </Link>
          </div>
          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-[0.3em]">
            Aegis Clinical Gateway // Protocol v2.4.9
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
