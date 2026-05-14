'use client';
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2 } from 'lucide-react';
import { postAudioTriage, TriageResponse } from '@/lib/api';

interface VoiceTriageProps {
  sessionId: string;
  onAnalysisReceived: (data: TriageResponse) => void;
  onError: (message: string) => void;
}

export const VoiceTriage: React.FC<VoiceTriageProps> = ({ sessionId, onAnalysisReceived, onError }) => {
  const [recording, setRecording] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true, 
          noiseSuppression: true, 
          autoGainControl: true 
        } 
      });
      const options = MediaRecorder.isTypeSupported('audio/webm') ? { mimeType: 'audio/webm' } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        setProcessing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: options?.mimeType || 'audio/wav' });
        try {
          const outputResult = await postAudioTriage(audioBlob, sessionId);
          onAnalysisReceived(outputResult);
        } catch (error) {
          console.error("Transmission error:", error);
          onError("Failed to analyze audio. Please check your connection and try again.");
        } finally {
          setProcessing(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      onError("Microphone access denied. Please enable hardware permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-950 border-t border-slate-900 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      {processing ? (
        <Button disabled className="h-16 w-16 rounded-full bg-indigo-600 text-white">
          <Loader2 className="h-6 w-6 animate-spin" />
        </Button>
      ) : recording ? (
        <Button onClick={stopRecording} className="h-16 w-16 rounded-full bg-red-600 animate-pulse hover:bg-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.6)]">
          <Square className="h-6 w-6" />
        </Button>
      ) : (
        <Button onClick={startRecording} className="h-16 w-16 rounded-full bg-slate-900 border border-slate-800 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 shadow-xl transition-all duration-300">
          <Mic className="h-6 w-6" />
        </Button>
      )}
      <span className="text-[11px] font-mono mt-3 text-slate-500 tracking-wider uppercase">
        {processing ? "Gemini Transcribing Dialect..." : recording ? "SYSTEM RECORDING RAW Vitals..." : "Hold / Click to Register Voice Symptoms"}
      </span>
    </div>
  );
};
