'use client';
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2 } from 'lucide-react';
import { postAudioTriage, TriageResponse } from '@/lib/api';

import { set, get, del } from 'idb-keyval';

interface VoiceTriageProps {
  sessionId: string;
  disabled?: boolean;
  onProcessingStart?: () => void;
  onAnalysisReceived: (data: TriageResponse) => void;
  onError: (message: string) => void;
}

export const VoiceTriage: React.FC<VoiceTriageProps> = ({ sessionId, disabled, onProcessingStart, onAnalysisReceived, onError }) => {
  const [recording, setRecording] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Task 1: Offline Sync Logic
  React.useEffect(() => {
    const syncOfflineQueue = async () => {
      if (!navigator.onLine) return;
      const queuedBlob = await get<Blob>(`offline_audio_${sessionId}`);
      if (queuedBlob) {
        setProcessing(true);
        if (onProcessingStart) onProcessingStart();
        try {
          const result = await postAudioTriage(queuedBlob, sessionId);
          await del(`offline_audio_${sessionId}`);
          onAnalysisReceived(result);
        } catch (err) {
          console.warn("Retry failed, keeping in queue.");
        } finally {
          setProcessing(false);
        }
      }
    };

    window.addEventListener('online', syncOfflineQueue);
    syncOfflineQueue(); // Check on mount
    return () => window.removeEventListener('online', syncOfflineQueue);
  }, [sessionId, onAnalysisReceived, onProcessingStart]);

  const startRecording = async () => {
    if (disabled) return;
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
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
 
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: options?.mimeType || 'audio/webm' });
        
        if (onProcessingStart) onProcessingStart();
        setProcessing(true);
        
        if (navigator.onLine) {
          try {
            const result = await postAudioTriage(audioBlob, sessionId);
            onAnalysisReceived(result);
          } catch (err) {
            await set(`offline_audio_${sessionId}`, audioBlob);
            onError("Network lost. Audio saved for retry.");
          }
        } else {
          await set(`offline_audio_${sessionId}`, audioBlob);
          onError("Offline – audio will be sent when connectivity returns.");
        }
        setProcessing(false);
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
    <div className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] backdrop-blur-xl">
      {processing ? (
        <Button disabled className="h-20 w-20 rounded-full bg-primary/10 text-primary border border-primary/20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </Button>
      ) : recording ? (
        <Button onClick={stopRecording} className="h-20 w-20 rounded-full bg-critical/10 border border-critical/20 text-critical animate-pulse hover:bg-critical/20 shadow-[0_0_20px_rgba(244,63,94,0.15)]">
          <Square className="h-6 w-6" />
        </Button>
      ) : (
        <Button onClick={startRecording} disabled={disabled} className="h-20 w-20 rounded-full bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all duration-300 disabled:opacity-40">
          <Mic className="h-8 w-8" />
        </Button>
      )}
      <span className="text-[11px] font-bold mt-4 text-muted-foreground tracking-wider uppercase">
        {processing ? "Transcribing narrative..." : recording ? "Recording symptoms..." : "Tap to record"}
      </span>
    </div>
  );
};
