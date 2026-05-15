'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Mic, Activity, Brain, AlertCircle } from 'lucide-react';
import { OfflineBanner } from '@/components/patient/OfflineBanner';
import { VoiceTriage } from '@/components/patient/VoiceTriage';
import { MentalHealthCard } from '@/components/patient/MentalHealthCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TriageResponse, postChatTriage, checkConsentStatus } from '@/lib/api';
import { ConsentGate, getStoredConsentSession } from '@/components/patient/ConsentGate';

interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'ai';
  content: string | React.ReactNode;
}

const QUICK_ACTIONS = [
  { label: "🚨 Severe Pain", prompt: "I am experiencing acute, severe pain and need immediate clinical triage.", icon: <AlertCircle className="w-3 h-3" /> },
  { label: "🤒 Fever/Cough", prompt: "I have a high fever and persistent cough. I need to assess infection risk.", icon: <Activity className="w-3 h-3" /> },
  { label: "🧠 Mental Support", prompt: "I am feeling extremely anxious or depressed and need mental health support.", icon: <Brain className="w-3 h-3" /> }
];

export default function PatientTriageApp() {
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [hasConsented, setHasConsented] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = crypto.randomUUID();
    setSessionId(id);
    setMessages([{
      id: 'init',
      role: 'system',
      content: "Aegis OS Initialized. Review the privacy notice, then begin triage."
    }]);

    if (getStoredConsentSession() === id) {
      setHasConsented(true);
    } else {
      checkConsentStatus(id).then((res) => {
        if (res.has_consent) setHasConsented(true);
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking]);

  const handleAnalysisReceived = (data: TriageResponse, isVoice = true) => {
    setIsThinking(false);
    setMessages(prev => [
      ...prev,
      { 
        id: crypto.randomUUID(), 
        role: 'ai', 
        content: (
          <div className="space-y-3" aria-live="polite">
            <p className="text-sm leading-relaxed">{data.guidance_notes}</p>
            {data.extracted_symptoms.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {data.extracted_symptoms.map((sym: string, i: number) => (
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

  const submitText = async (text: string) => {
    if (!hasConsented) return;
    setIsThinking(true);
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: text }]);
    
    try {
      const data = await postChatTriage(text, sessionId);
      handleAnalysisReceived(data, false);
    } catch (err) {
      handleError("Failed to process text triage.");
    } finally {
      setIsThinking(false);
    }
  };

  const handleError = (msg: string) => {
    setIsThinking(false);
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: `⚠️ Error: ${msg}` }]);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {sessionId && !hasConsented && (
        <ConsentGate sessionId={sessionId} onConsented={() => setHasConsented(true)} />
      )}
      <OfflineBanner />

      {/* Header */}
      <header className="px-6 py-4 border-b border-white/5 bg-slate-950/40 backdrop-blur-xl z-10 shadow-lg sticky top-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tighter flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
            <span className="bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
              Aegis OS Triage
            </span>
          </h1>
          <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-widest">Session // {sessionId.substring(0, 8)}</p>
        </div>
        <div className="hidden sm:block">
            <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-500 bg-emerald-500/5 uppercase font-mono">
                Clinical CDSS Active
            </Badge>
        </div>
      </header>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-6" role="log">
        <div className="max-w-2xl mx-auto space-y-6 pb-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-sm shadow-lg' 
                  : msg.role === 'system' 
                    ? 'bg-slate-900/50 border border-slate-800 text-slate-400 text-[10px] font-mono rounded-bl-sm'
                    : 'bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 text-slate-200 rounded-bl-sm shadow-lg'
                }`}
                aria-label={`${msg.role} message`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          
          {isThinking && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl rounded-bl-sm p-4 flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                <span className="text-xs text-slate-400 font-medium italic">Aegis is analyzing symptoms...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input / Macro Area */}
      <div className="border-t border-slate-900 bg-slate-950 p-4 space-y-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
        
        {/* Task 2: Clinical Macros */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mask-fade-right">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.label}
              onClick={() => submitText(action.prompt)}
              disabled={isThinking || !hasConsented}
              variant="outline"
              size="sm"
              className="flex-shrink-0 bg-slate-900/40 border-white/5 hover:bg-slate-800 hover:border-indigo-500/30 text-slate-300 text-[11px] font-medium transition-all gap-2 px-4 h-9 rounded-full"
              aria-label={`Quick action: ${action.label}`}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>

        {/* Voice Input Area */}
        <div className="flex justify-center border-t border-slate-900/50 pt-4 pb-2">
          <VoiceTriage 
            sessionId={sessionId}
            disabled={!hasConsented}
            onProcessingStart={() => setIsThinking(true)}
            onAnalysisReceived={(data) => {
                setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: "🎤 Audio symptom report submitted." }]);
                handleAnalysisReceived(data);
            }} 
            onError={handleError} 
          />
        </div>

        {/* Mental Health Quick Access */}
        <div className="pt-2">
            <MentalHealthCard sessionId={sessionId} />
        </div>
      </div>
      
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .mask-fade-right {
            mask-image: linear-gradient(to right, black 85%, transparent 100%);
        }
      `}</style>
    </div>
  );
}
