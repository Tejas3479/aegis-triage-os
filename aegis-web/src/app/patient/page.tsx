'use client';
import React, { useState, useEffect, useRef } from 'react';
import { OfflineBanner } from '@/components/patient/OfflineBanner';
import { VoiceTriage } from '@/components/patient/VoiceTriage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { TriageResponse } from '@/lib/api';

interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'ai';
  content: string | React.ReactNode;
}

export default function PatientTriageApp() {
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize secure session UUID on mount
  useEffect(() => {
    setSessionId(crypto.randomUUID());
    setMessages([{
      id: 'init',
      role: 'system',
      content: "Aegis OS Initialized. I am your AI clinical assistant. Tap the microphone below and describe your symptoms."
    }]);
  }, []);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleAnalysisReceived = (data: TriageResponse) => {
    setMessages(prev => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: "🎤 Audio symptom report submitted." },
      { 
        id: crypto.randomUUID(), 
        role: 'ai', 
        content: (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed">{data.guidance_notes}</p>
            {data.extracted_symptoms.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {data.extracted_symptoms.map((sym, i) => (
                  <Badge key={i} variant="secondary" className="bg-indigo-950/50 text-indigo-200 border-indigo-900/50">
                    {sym}
                  </Badge>
                ))}
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-slate-800">
              <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Recommended Action</span>
              <Badge variant={data.care_level === 'EMERGENCY_ROOM' ? 'destructive' : 'default'} className="font-mono">
                {data.care_level.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        )
      }
    ]);
  };

  const handleError = (msg: string) => {
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: `⚠️ Error: ${msg}` }]);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-950 text-slate-100 overflow-hidden">
      <OfflineBanner />

      {/* Header */}
      <header className="px-6 py-4 border-b border-slate-900 bg-slate-950/80 backdrop-blur z-10">
        <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Aegis OS Triage
        </h1>
        <p className="text-xs text-slate-500 font-mono mt-1">Session ID: {sessionId.substring(0, 8)}</p>
      </header>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-2xl mx-auto space-y-6 pb-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-sm' 
                  : msg.role === 'system' 
                    ? 'bg-slate-900/50 border border-slate-800 text-slate-400 text-xs font-mono rounded-bl-sm'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Voice Input Area */}
      <VoiceTriage sessionId={sessionId} onAnalysisReceived={handleAnalysisReceived} onError={handleError} />
    </div>
  );
}
