'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Mic, 
  Activity, 
  Waves, 
  FileCheck,
  BrainCircuit,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VoiceTriage } from '@/features/ambient-scribe/VoiceTriage';
import { TriageResponse, sendMessage } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

import { ConsentGate } from '@/features/ambient-scribe/ConsentGate';

export default function VoiceTriagePage() {
  const [sessionId] = useState<string>(() => crypto.randomUUID());
  const [consented, setConsented] = useState(false);
  const [analysis, setAnalysis] = useState<TriageResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [textFallback, setTextFallback] = useState('');

  const riskScore = analysis ? analysis.final_analysis.risk_score : 0;

  if (!consented) {
    return <ConsentGate sessionId={sessionId} onConsented={() => setConsented(true)} />;
  }

  const handleTextSubmit = async () => {
    if (!textFallback.trim()) return;
    setIsProcessing(true);
    setError(null);
    try {
      const response = await sendMessage(sessionId, textFallback);
      setAnalysis(response);
    } catch (err) {
      setError("Failed to analyze text. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans medical-grid selection:bg-primary/10">
      
      {/* Refined Header */}
      <header className="p-10 pb-20 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[100%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="max-w-5xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-8">
            <Link href="/patient">
              <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-all">
                <ArrowLeft size={24} className="text-muted-foreground" />
              </Button>
            </Link>
            <div className="h-10 w-px bg-border" />
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-4">
                <Mic className="text-primary" size={32} />
                Voice Ingestion
              </h1>
              <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest mt-1.5 flex items-center gap-2">
                <ShieldCheck size={14} className="text-stable" />
                Clinical Audio Pipeline // Encrypted
              </p>
            </div>
          </div>
          <Badge className="h-10 px-5 bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-widest shadow-sm">
            STT: Cloud (Gemini 2.5)
          </Badge>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-8 flex flex-col items-center justify-center -mt-32 relative z-20">
        <AnimatePresence mode="wait">
          {!analysis ? (
            <motion.div 
              key="recording"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-16 w-full"
            >
              <div className="relative flex justify-center">
                <motion.div 
                  animate={isProcessing ? { scale: [1, 1.1, 1], rotate: 360 } : {}}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full" 
                />
                <div className="relative h-64 w-64 rounded-[4rem] bg-card border border-border shadow-2xl shadow-primary/5 flex items-center justify-center overflow-hidden transition-all duration-500">
                  {isProcessing ? (
                    <Activity className="w-20 h-20 text-primary animate-pulse" />
                  ) : (
                    <Waves className="w-20 h-20 text-primary/30 animate-bounce" />
                  )}
                </div>
              </div>

              <div className="space-y-6 max-w-md mx-auto">
                <h2 className="text-4xl font-bold text-foreground tracking-tight">
                  {isProcessing ? "Transcribing narrative..." : "Speak naturally."}
                </h2>
                <p className="text-muted-foreground font-medium leading-relaxed">
                  Describe your symptoms and their duration. Your audio is processed via a zero-retention clinical pipeline.
                </p>
              </div>

              <div className="w-full max-w-md mx-auto space-y-6">
                <VoiceTriage 
                  sessionId={sessionId}
                  onProcessingStart={() => {
                    setIsProcessing(true);
                    setError(null);
                  }}
                  onAnalysisReceived={(data) => {
                    setAnalysis(data);
                    setIsProcessing(false);
                  }}
                  onError={(msg) => {
                    setError(msg);
                    setIsProcessing(false);
                  }}
                />

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-4 text-muted-foreground font-bold tracking-widest">Or type your symptoms</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Input 
                    value={textFallback}
                    onChange={(e) => setTextFallback(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                    placeholder="Describe your symptoms manually..."
                    className="flex-1 bg-card border-border rounded-xl h-12 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                  />
                  <Button 
                    onClick={handleTextSubmit}
                    disabled={isProcessing || !textFallback.trim()}
                    className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all"
                  >
                    Submit
                  </Button>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 text-rose-500 justify-center font-bold text-xs uppercase tracking-widest"
                >
                  <AlertTriangle size={16} />
                  {error}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full"
            >
              <Card className="bg-card rounded-[4rem] border-border shadow-[0_30px_70px_rgba(0,0,0,0.05)] overflow-hidden">
                <CardContent className="p-16 space-y-16">
                  <div className="flex items-start justify-between">
                    <div className="space-y-4">
                      <Badge className="bg-stable/10 text-stable border-stable/20 font-black px-4 py-1.5 uppercase tracking-widest">
                        Analysis Complete
                      </Badge>
                      <h3 className="text-4xl font-bold text-foreground tracking-tight">Council Synthesis</h3>
                    </div>
                    <div className="text-right p-8 bg-primary/10 rounded-[2.5rem] border border-primary/20 min-w-[160px]">
                      <span className="text-[10px] text-primary/70 font-black uppercase tracking-widest block mb-1">Risk Index</span>
                      <span className="text-5xl font-black text-primary tracking-tighter">{(riskScore * 10).toFixed(0)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 text-muted-foreground font-bold uppercase tracking-[0.15em] text-[10px]">
                        <FileCheck size={16} className="text-primary/70" />
                        Audio Transcript
                      </div>
                      <div className="p-8 rounded-[2.5rem] bg-secondary border border-border italic text-muted-foreground text-lg leading-relaxed font-semibold tracking-tight">
                        &quot;{analysis!.auditable_encounter?.clinical_narrative_summary || "Transcription not available."}&quot;
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-3 text-muted-foreground font-bold uppercase tracking-[0.15em] text-[10px]">
                        <BrainCircuit size={16} className="text-stable" />
                        Clinical Rationale
                      </div>
                      <p className="text-muted-foreground text-base leading-relaxed font-medium">
                        {analysis!.final_analysis.guidance_notes}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-12 border-t border-border">
                    <Button 
                      variant="ghost" 
                      className="text-muted-foreground hover:text-primary font-bold text-xs uppercase tracking-widest group" 
                      onClick={() => setAnalysis(null)}
                    >
                      New Session <ChevronRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <Link href="/patient">
                      <Button className="bg-primary hover:bg-primary/90 text-white px-12 h-14 rounded-full font-bold text-sm shadow-xl shadow-primary/20 transition-all active:scale-95">
                        Confirm & Continue
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Security Footer */}
      <footer className="p-12 text-center space-y-6">
         <div className="flex items-center justify-center gap-3">
            <div className="h-[1px] w-12 bg-border" />
            <Stethoscope size={20} className="text-muted-foreground/50" />
            <div className="h-[1px] w-12 bg-border" />
         </div>
         <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.4em]">
           DPDP 2023 · End-to-End Encryption · Aegis v2.5
         </p>
      </footer>
    </div>
  );
}
