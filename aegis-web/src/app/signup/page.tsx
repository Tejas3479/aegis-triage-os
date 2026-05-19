"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldPlus, User, Lock, Building, Loader2, ChevronRight, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { registerDoctor } from "@/lib/api";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [hospitalCode, setHospitalCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await registerDoctor(username, pin, hospitalCode);
      toast.success("Clinical account provisioned successfully!");
      // After registration, redirect to login (or auto-login)
      router.push("/login");
    } catch (err: any) {
      toast.error(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 relative overflow-hidden font-sans medical-grid">
      
      {/* Background Accents */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-stable/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[520px] relative z-10"
      >
        <div className="bg-card rounded-[3rem] p-12 space-y-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-border relative overflow-hidden">
          
          {/* Header */}
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                <ShieldPlus className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Clinical Provisioning
              </h1>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-2">
                Establish New Practitioner Node
              </p>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                Personnel Identifier
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-2xl py-4 pl-12 pr-6 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all font-medium text-sm"
                  placeholder="e.g. dr_smith"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                Security PIN
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-2xl py-4 pl-12 pr-6 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all font-medium text-sm tracking-widest"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                Organization Provisioning Code
              </label>
              <div className="relative group">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  value={hospitalCode}
                  onChange={(e) => setHospitalCode(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-2xl py-4 pl-12 pr-6 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all font-medium text-sm"
                  placeholder="AEGIS-2026-HQ"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-[1.5rem] shadow-xl shadow-primary/20 transition-all duration-300 font-bold text-sm tracking-tight active:scale-95 flex items-center justify-center gap-3"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Initialize Provisioning
                  <ShieldPlus className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="pt-6 border-t border-border text-center">
            <Link
              href="/login"
              className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest flex items-center justify-center gap-2"
            >
              Already Registered? Authenticate <ChevronRight size={12} />
            </Link>
          </div>
        </div>

        <div className="mt-10 text-center space-y-4">
           <div className="flex items-center justify-center gap-3">
              <div className="h-[1px] w-8 bg-border" />
              <Stethoscope size={16} className="text-muted-foreground" />
              <div className="h-[1px] w-8 bg-border" />
           </div>
           <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-[0.4em]">
             Secure Triage Infrastructure // Aegis v2.5
           </p>
        </div>
      </motion.div>
    </div>
  );
}
