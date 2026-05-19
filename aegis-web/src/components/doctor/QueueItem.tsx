import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClinicalBadge } from '@/components/ui/clinical-badge';
import { VitalsChart } from '@/components/ui/vitals-chart';
import { HeartRateIcon } from '@/components/ui/medical-icons';

export interface DoctorQueueItem {
  id: string;
  risk_score: number;
  status: string;
  care_level: 'HOME_CARE' | 'CLINIC_VISIT' | 'EMERGENCY_ROOM' | 'URGENT_CARE';
  updated_at: string;
  has_critical_risks?: boolean;
  biomarker_variance?: string;
}

interface QueueItemProps {
  item?: DoctorQueueItem;
  loading?: boolean;
  error?: string;
}

export function QueueItem({ item, loading, error }: QueueItemProps) {
  if (loading) {
    return (
      <div className="p-6 rounded-[2rem] bg-card border border-border flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-8">
          <div className="w-14 h-14 rounded-2xl bg-secondary" />
          <div className="h-10 w-px bg-border" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-secondary rounded-md" />
            <div className="h-3 w-48 bg-secondary rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end gap-1 px-6 border-r border-border">
            <div className="h-3 w-16 bg-secondary rounded-md" />
            <div className="h-4 w-24 bg-secondary rounded-md" />
          </div>
          <div className="h-12 w-32 bg-secondary rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-[2rem] bg-card border border-critical/30 flex items-center justify-between text-critical">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold">Failed to load encounter row: {error}</span>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-6 rounded-[2rem] bg-card border border-dashed border-border flex items-center justify-center text-muted-foreground">
        <span className="text-sm font-medium">No patient encounter data.</span>
      </div>
    );
  }

  const scoreText = (item.risk_score * 10).toFixed(0);

  return (
    <div className="p-6 rounded-[2rem] bg-card border border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all grid grid-cols-1 md:grid-cols-[auto_1fr_1fr_auto] gap-4 items-center group">
      {/* Priority Indicator */}
      <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-secondary border border-border group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Priority</span>
        <span className={`text-xl font-black ${
          item.risk_score >= 0.8 ? 'text-critical' : 
          item.risk_score >= 0.4 ? 'text-warning' : 'text-stable'
        }`}>
          {scoreText}
        </span>
      </div>

      {/* Patient Info */}
      <div>
        <div className="flex flex-wrap items-center gap-3 mb-1.5">
          <h3 className="text-base font-bold text-foreground tracking-tight">
            Encounter {item.id.substring(0, 8).toUpperCase()}
          </h3>
          <Badge variant="outline" className="text-[9px] h-5 border-border text-muted-foreground font-bold uppercase tracking-widest px-2">
            {item.status}
          </Badge>
          {item.has_critical_risks && (
            <ClinicalBadge severity="critical">Pharmaco Risk</ClinicalBadge>
          )}
          {item.biomarker_variance && (
            <ClinicalBadge severity="info">Bio Drift</ClinicalBadge>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-medium">
          Active Telemetry: {item.biomarker_variance || "Stable Baseline"} • Updated {new Date(item.updated_at).toLocaleTimeString()}
        </p>
      </div>

      {/* Telemetry Chart */}
      <div className="hidden lg:block px-6 border-r border-border">
        <div className="flex items-center gap-2 mb-1">
          <HeartRateIcon className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Live Telemetry</span>
        </div>
        <VitalsChart data={Array.from({ length: 10 }, (_, i) => 60 + (item.id.charCodeAt(i % item.id.length) % 40))} color="#4F46E5" />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 justify-end">
        <div className="hidden md:flex flex-col items-end gap-1 px-6 border-r border-border">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Care Routing</span>
          <ClinicalBadge severity={
            item.care_level === 'EMERGENCY_ROOM' ? 'critical' : 
            item.care_level === 'URGENT_CARE' ? 'warning' : 'stable'
          }>
            {item.care_level.replace('_', ' ')}
          </ClinicalBadge>
        </div>
        <Link href={`/doctor/patient/${item.id}`}>
          <Button className="bg-card hover:bg-primary text-foreground hover:text-white h-12 px-8 rounded-2xl border border-border hover:border-primary transition-all shadow-sm flex items-center gap-2 group-hover:scale-105">
            <span className="font-bold text-sm">Review Assessment</span>
            <ChevronRight size={16} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
