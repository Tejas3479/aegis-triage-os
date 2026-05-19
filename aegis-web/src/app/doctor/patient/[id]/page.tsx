"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft,
  Stethoscope,
  Heart,
  Activity,
  User,
  Brain,
  FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TriageResponse } from '@/types';
import { fetchTriageOutcome } from '@/lib/api';
import { useAegisStore } from '@/store/useAegisStore';
import { CouncilMatrix } from '@/components/hud/CouncilMatrix';
import { PatientCompass } from '@/components/hud/PatientCompass';
import { StagingArea } from '@/components/hud/StagingArea';

export default function PatientWorkstation({ params }: { params: { id: string } }) {
  const [data, setData] = useState<TriageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const systemStatus = useAegisStore((state) => state.systemStatus);



  useEffect(() => {
    const load = async () => {
      try {
        const result = await fetchTriageOutcome(params.id);
        setData(result);
      } catch (err) {
        console.error("Failed to load patient data:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-card rounded-3xl border border-border shadow-sm flex items-center justify-center mx-auto animate-pulse">
            <Stethoscope className="text-primary w-8 h-8" />
          </div>
          <p className="font-bold text-foreground text-lg tracking-tight">Synapsing Patient History</p>
          <p className="text-sm text-muted-foreground font-medium">Securing clinical data streams...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="w-full h-screen bg-background flex items-center justify-between overflow-hidden antialiased select-none p-4 font-sans tracking-tight">
      <div className="w-full h-full max-w-[1400px] mx-auto flex items-stretch justify-between space-x-4 min-h-0">
        
        {/* Column 1: Patient Compass */}
        <PatientCompass />
        
        {/* Column 2: Swarm Core Execution Matrix */}
        <CouncilMatrix />
        
        {/* Column 3: Transaction Staging Engine */}
        <StagingArea />
        
      </div>
    </main>
  );
}
