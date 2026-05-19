import React from 'react';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { HeartRateIcon, SpO2Icon, ThermometerIcon } from '@/components/ui/medical-icons';

export interface VitalsData {
  heartRate: {
    value: number;
    trend: 'up' | 'down' | 'stable';
    status: 'normal' | 'elevated' | 'critical';
  };
  spo2: {
    value: number;
    trend: 'up' | 'down' | 'stable';
    status: 'normal' | 'warning' | 'critical';
  };
  temperature: {
    value: number;
    trend: 'up' | 'down' | 'stable';
    status: 'normal' | 'elevated' | 'critical';
  };
}

interface VitalSignsProps {
  vitals?: VitalsData;
  loading?: boolean;
}

export function VitalSigns({ vitals, loading }: VitalSignsProps) {
  if (loading || !vitals) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card border border-border p-6 rounded-[2rem] h-36 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div className="w-8 h-8 rounded-full bg-secondary" />
              <div className="h-4 w-12 bg-secondary rounded" />
            </div>
            <div className="h-8 w-24 bg-secondary rounded mt-4" />
          </div>
        ))}
      </div>
    );
  }

  const renderTrend = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp size={16} className="text-critical" />;
    if (trend === 'down') return <TrendingDown size={16} className="text-primary" />;
    return <Minus size={16} className="text-stable" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'critical') return 'text-critical border-critical/20 bg-critical/5';
    if (status === 'warning' || status === 'elevated') return 'text-warning border-warning/20 bg-warning/5';
    return 'text-stable border-stable/20 bg-stable/5';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
      {/* Heart Rate Card */}
      <div className={`bg-card border border-border p-6 rounded-[2rem] hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 transition-all flex flex-col justify-between group`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center border border-border group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
              <HeartRateIcon className="w-5 h-5 text-primary group-hover:animate-pulse" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pulse / HR</span>
          </div>
          <div className="flex items-center gap-1">
            {renderTrend(vitals.heartRate.trend)}
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-4xl font-black tracking-tight">{vitals.heartRate.value}</span>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">bpm</span>
        </div>
      </div>

      {/* SpO2 Card */}
      <div className={`bg-card border border-border p-6 rounded-[2rem] hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 transition-all flex flex-col justify-between group`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center border border-border group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
              <SpO2Icon className="w-5 h-5 text-primary" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Oxygen Sat / SpO₂</span>
          </div>
          <div className="flex items-center gap-1">
            {renderTrend(vitals.spo2.trend)}
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-4xl font-black tracking-tight">{vitals.spo2.value}</span>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">%</span>
        </div>
      </div>

      {/* Temperature Card */}
      <div className={`bg-card border border-border p-6 rounded-[2rem] hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 transition-all flex flex-col justify-between group`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center border border-border group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
              <ThermometerIcon className="w-5 h-5 text-primary" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Temperature</span>
          </div>
          <div className="flex items-center gap-1">
            {renderTrend(vitals.temperature.trend)}
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-4xl font-black tracking-tight">{vitals.temperature.value.toFixed(1)}</span>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">°C</span>
        </div>
      </div>
    </div>
  );
}
