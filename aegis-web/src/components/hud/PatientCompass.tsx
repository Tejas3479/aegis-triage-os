import React, { useEffect, useRef, useState } from 'react';
import { useAegisStore } from '@/store/useAegisStore';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Activity, AlertCircle, ArrowDown } from 'lucide-react';
import { useParams } from 'next/navigation';

export const PatientCompass: React.FC = () => {
  const params = useParams();
  const sessionId = params.id as string;
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!sessionId) return;
    
    const fetchProfile = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/v1/patient/profile/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (e) {
        console.error("Failed to fetch profile:", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [sessionId]);

  // Use specific atomic selectors to prevent unnecessary panel re-renders
  const transcript = useAegisStore((state) => state.transcript);
  const systemStatus = useAegisStore((state) => state.systemStatus);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // Monitor scroll positioning to prevent scroll-fighting
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // If user is more than 100px away from bottom, mark scroll as interrupted
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsUserScrolling(!isAtBottom);
  };

  useEffect(() => {
    if (!isUserScrolling && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [transcript, isUserScrolling]);

  return (
    <div className="flex flex-col h-full space-y-4 max-w-md w-full">
      
      {/* 1. Longitudinal Grounding Card (Feature C Core Alignment) */}
      <Card className="p-4 bg-card border-border/60 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-muted pb-2">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Longitudinal Grounding Base
            </h4>
          </div>
          <Badge variant="outline" className="text-[10px] bg-background font-mono">
            MCP: Connected
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-2 text-xs">
          {loading ? (
            <div className="text-muted-foreground text-[11px]">Loading patient profile...</div>
          ) : (
            <>
              <div>
                <span className="text-muted-foreground font-medium">Documented Allergies:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {profile?.allergies?.map((allergy: any, idx: number) => (
                    <Badge key={idx} variant="destructive" className="text-[11px] px-2 py-0.5 font-sans bg-red-500/10 text-red-600 hover:bg-red-500/10 border-none">
                      {allergy.name}
                    </Badge>
                  )) || (
                    <span className="text-muted-foreground text-[11px]">No known allergies.</span>
                  )}
                </div>
              </div>
              
              <div className="pt-1">
                <span className="text-muted-foreground font-medium">Active Medications:</span>
                {profile?.medications?.map((med: any, idx: number) => (
                  <p key={idx} className="font-mono mt-0.5 text-foreground bg-background px-2 py-1 rounded border text-[11px]">
                    {med.name}
                  </p>
                )) || (
                  <p className="text-muted-foreground text-[11px]">No active medications.</p>
                )}
              </div>

              <div className="pt-1">
                <span className="text-muted-foreground font-medium">Chronic Conditions:</span>
                {profile?.chronic_conditions?.map((condition: any, idx: number) => (
                  <p key={idx} className="text-foreground font-medium text-[11px] flex items-center gap-1 mt-0.5">
                    <Activity className="h-3 w-3 text-emerald-600" /> {condition.name}
                  </p>
                )) || (
                  <p className="text-muted-foreground text-[11px]">No documented chronic conditions.</p>
                )}
              </div>
            </>
          )}
        </div>
      </Card>

      {/* 2. Real-Time Transcript Viewer */}
      <Card className="flex-1 flex flex-col min-h-0 bg-card border-border/60 shadow-sm relative">
        <div className="p-4 border-b border-muted flex items-center justify-between bg-card/50">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${systemStatus === 'PROCESSING' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            Live Clinical Feed
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">Channel Count: 02</span>
        </div>

        {/* Live Scroll Output Panel */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scrollbar-thin scrollbar-thumb-muted"
        >
          {transcript.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
              <AlertCircle className="h-5 w-5 mb-2 stroke-1" />
              <p className="text-xs">Awaiting edge-diarized audio stream ingestion...</p>
            </div>
          ) : (
            transcript.map((item, idx) => (
              <div key={idx} className="border-l-2 border-muted pl-3 space-y-1 py-0.5">
                <span className={`text-[10px] font-mono uppercase tracking-wider ${
                  item.speaker === 'Doctor' ? 'text-blue-600' : 'text-emerald-700'
                }`}>
                  {item.speaker === 'Doctor' ? 'CH_00 (Provider)' : 'CH_01 (Patient)'}
                </span>
                <p className="text-xs leading-relaxed text-foreground select-text">
                  {item.text}
                </p>
              </div>
            ))
          )}
        </div>

        {/* New Line Indicator Overlay */}
        {isUserScrolling && transcript.length > 0 && (
          <button
            onClick={() => setIsUserScrolling(false)}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-background border rounded-full shadow-lg text-[10px] font-medium flex items-center gap-1 hover:bg-muted transition-all"
          >
            <ArrowDown className="h-3 w-3 animate-bounce" /> New Dialogue Available
          </button>
        )}
      </Card>
    </div>
  );
};
