'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Brain, 
  Activity, 
  ShieldCheck, 
  User, 
  Bot, 
  ChevronRight, 
  AlertCircle,
  Stethoscope,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { sendMessage, TriageResponse } from '@/lib/api';
import { toast } from 'sonner';

export default function PatientChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(`sess-${Math.random().toString(36).substring(7)}`);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial Greeting
    setMessages([{
      role: 'assistant',
      content: "Hello. I am the Aegis Clinical Assistant. I am here to help prioritize your care. Could you please describe what symptoms you are experiencing today?",
      sender: 'Aegis Sentinel'
    }]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, sender: 'You' }]);
    setLoading(true);

    try {
      const response = await sendMessage(sessionId, userMessage);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.final_analysis?.guidance_notes || "I've analyzed your symptoms. Please review the synthesis above.",
        sender: 'Clinical Intelligence',
        analysis: response.final_analysis,
        ice: response.auditable_encounter
      }]);
    } catch (err) {
      toast.error("Clinical engine sync failed. Retrying...");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans medical-grid">
      
      {/* Refined Patient Header */}
      <header className="px-8 py-5 bg-card border-b border-border flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Stethoscope className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">Clinical Triage</h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
              Secure Assessment Session // {sessionId.toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-stable/10 text-stable border-stable/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
            AI Guardian Active
          </Badge>
          <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground bg-card">
            <User size={18} />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-8 flex flex-col overflow-hidden">
        <div aria-live="polite" className="sr-only">
          {messages.length > 0 && `New message from ${messages[messages.length - 1].sender}: ${messages[messages.length - 1].content}`}
        </div>
        {/* Chat Stream */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-10 pr-4 custom-scrollbar scroll-smooth"
        >
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{msg.sender}</span>
                    {msg.role === 'assistant' && <Brain size={12} className="text-primary/70" />}
                  </div>
                  
                  <div className={`p-6 rounded-[2rem] text-sm leading-relaxed font-medium shadow-sm border ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white border-primary rounded-tr-none' 
                      : 'bg-card text-foreground border-border rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>

                  {msg.ice && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-4 p-5 rounded-3xl bg-primary/10 border border-primary/20 w-full"
                    >
                      <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Activity size={14} /> Sentinel Summary
                      </h4>
                      <p className="text-xs text-foreground font-medium leading-relaxed italic">
                        &quot;{msg.ice.clinical_narrative_summary}&quot;
                      </p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-card border border-border p-6 rounded-[2rem] rounded-tl-none flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Deliberating...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Dock */}
        <div className="mt-8 relative">
          <div className="bg-card rounded-[2.5rem] p-2 shadow-xl shadow-primary/5 border border-border flex items-center gap-3">
            <div className="pl-6 text-muted-foreground">
              <Activity size={20} />
            </div>
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Describe your symptoms (e.g. chest pain, headache)..."
              className="flex-1 bg-transparent border-none focus-visible:ring-0 text-foreground font-medium placeholder:text-muted-foreground h-14"
            />
            <Button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="h-12 w-12 rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all active:scale-90 shrink-0"
            >
              <Send size={20} />
            </Button>
          </div>
          <p className="text-center text-[9px] text-muted-foreground font-bold uppercase tracking-[0.2em] mt-4">
            Encrypted Clinical Transmission // AES-256 Verified
          </p>
        </div>
      </main>

      {/* Footer Disclaimer */}
      <footer className="px-8 py-4 bg-card border-t border-border flex items-center justify-center gap-4">
        <AlertCircle size={14} className="text-warning" />
        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
          Aegis is an AI assistant. In an emergency, please call local emergency services immediately.
        </span>
      </footer>
    </div>
  );
}
