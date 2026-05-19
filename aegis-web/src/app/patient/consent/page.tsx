'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, Eye, Trash2, FileText, ChevronRight, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { clearStoredConsent, getStoredConsentSession } from '@/features/ambient-scribe/ConsentGate';
import { motion } from 'framer-motion';

export default function PrivacyCenterPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    setSessionId(getStoredConsentSession());
  }, []);

  const handleRevoke = () => {
    clearStoredConsent();
    setSessionId(null);
    window.location.href = '/patient';
  };

  return (
    <div className="min-h-screen bg-background px-10 py-20 font-sans medical-grid selection:bg-primary/10">
      <div className="max-w-5xl mx-auto space-y-16">
        
        <header className="flex items-center gap-8 relative">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/5 blur-[60px] rounded-full" />
          <Link href="/patient">
            <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-background border border-border shadow-sm hover:shadow-md transition-all relative z-10">
              <ArrowLeft size={24} className="text-muted-foreground" />
            </Button>
          </Link>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold text-foreground tracking-tight flex items-center gap-4">
              <ShieldCheck className="text-primary" size={40} />
              Privacy Center
            </h1>
            <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-[0.25em] mt-1.5">
              DPDP ACT 2023 · GOVERNANCE DASHBOARD
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Panel: Active Status */}
          <div className="lg:col-span-5 space-y-8">
            <Card className="bg-card rounded-[3rem] border-border shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden">
              <CardHeader className="p-10 pb-6">
                <CardTitle className="text-xl font-bold text-foreground flex items-center gap-3 tracking-tight">
                  <Lock size={20} className="text-primary" />
                  Active Consent
                </CardTitle>
                <CardDescription className="text-muted-foreground font-medium">
                  Current status of your data processing authorization.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-10 pt-0 space-y-6">
                <div className="flex items-center justify-between p-6 rounded-3xl bg-secondary border border-border transition-all">
                  <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Status</span>
                  <Badge className={`h-8 px-4 font-black border-none text-[10px] tracking-widest ${sessionId ? "bg-stable/10 text-stable" : "bg-critical/10 text-critical"}`}>
                    {sessionId ? "AUTHORIZED" : "NO CONSENT"}
                  </Badge>
                </div>
                {sessionId && (
                  <div className="flex items-center justify-between p-6 rounded-3xl bg-secondary border border-border overflow-hidden">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Session ID</span>
                    <span className="text-[10px] font-mono text-muted-foreground font-bold tracking-tighter">{sessionId.substring(0, 20)}...</span>
                  </div>
                )}
                <Button 
                  onClick={handleRevoke}
                  disabled={!sessionId}
                  variant="destructive" 
                  className="w-full h-14 gap-3 bg-critical/10 hover:bg-critical/20 border border-critical/20 text-critical font-bold text-sm rounded-[1.5rem] transition-all active:scale-95 shadow-sm"
                >
                  <Trash2 size={18} />
                  Revoke Consent & Wipe Session
                </Button>
              </CardContent>
            </Card>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-10 rounded-[3rem] bg-primary text-primary-foreground shadow-xl shadow-primary/10"
            >
              <div className="flex items-center gap-3 font-black uppercase tracking-[0.2em] text-[10px] mb-4 opacity-80">
                <Eye size={16} />
                Transparency Report
              </div>
              <p className="text-sm leading-relaxed font-medium">
                Your data was last processed by: <span className="underline decoration-primary/30 underline-offset-4">Aegis Diagnostic Graph v2.5</span>. 
                STT was performed via <span className="underline decoration-primary/30 underline-offset-4">Cloud Gemini 2.5 Pipeline</span>. 
                PII scrubbing was handled by <span className="underline decoration-primary/30 underline-offset-4">Microsoft Presidio Engine</span>.
              </p>
            </motion.div>
          </div>

          {/* Right Panel: Policies */}
          <div className="lg:col-span-7 space-y-10">
            <div className="flex items-center justify-between px-4">
               <h3 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
                 <ShieldAlert size={24} className="text-primary" />
                 Data Protection Policies
               </h3>
               <Badge variant="outline" className="border-border text-muted-foreground font-bold text-[9px] px-3">2026 AUDIT COMPLIANT</Badge>
            </div>
            
            <div className="space-y-6">
              {[
                { title: "No PII Retention", desc: "Names, phone numbers, and addresses are never stored in the clinical audit log. All telemetry is anonymized at ingestion.", icon: ShieldCheck, color: "text-stable", bg: "bg-stable/10" },
                { title: "Local-First STT", desc: "Aegis prioritizes on-device transcription when hardware capabilities allow, minimizing cloud exposure.", icon: Lock, color: "text-primary", bg: "bg-primary/10" },
                { title: "Clinical Audit Only", desc: "Your data is only visible to clinicians explicitly assigned to your specific triage ID. No third-party access.", icon: FileText, color: "text-muted-foreground", bg: "bg-secondary" }
              ].map((policy) => (
                <div key={policy.title} className="p-8 rounded-[2.5rem] bg-card border border-border shadow-sm flex gap-8 group hover:border-primary transition-all">
                  <div className={`w-16 h-16 rounded-3xl ${policy.bg} flex items-center justify-center flex-shrink-0 ${policy.color} shadow-sm border border-border/50`}>
                    <policy.icon size={28} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">{policy.title}</h4>
                    <p className="text-base text-muted-foreground leading-relaxed mt-2 font-medium">{policy.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <Link href="/privacy" className="group flex items-center justify-between p-8 rounded-[2.5rem] bg-secondary border border-border hover:bg-card hover:border-primary transition-all">
               <div className="flex items-center gap-4">
                  <FileText className="text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Full DPDP Policy Document</span>
               </div>
               <ChevronRight className="text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>

      <footer className="mt-24 text-center">
         <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.4em]">
           SECURE GOVERNANCE HUB // NODE_INDIA_01
         </p>
      </footer>
    </div>
  );
}
