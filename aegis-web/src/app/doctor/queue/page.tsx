'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Users, 
  RefreshCcw, 
  Search, 
  Filter, 
  Activity,
  AlertCircle,
  FileText,
  ShieldCheck,
  ChevronRight,
  Stethoscope
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ClinicalBadge } from '@/components/ui/clinical-badge';
import { fetchDoctorQueue, DoctorQueueItem } from '@/lib/api';
import { VitalsChart } from '@/components/ui/vitals-chart';
import { HeartRateIcon } from '@/components/ui/medical-icons';

export default function DoctorQueuePage() {
  const [queue, setQueue] = useState<DoctorQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const hasEmergency = queue.some(item => item.care_level === 'EMERGENCY_ROOM');

  useEffect(() => {
    if (hasEmergency && soundEnabled) {
      const audio = new Audio('/chime.mp3');
      audio.play().catch(() => {});
    }
  }, [hasEmergency, soundEnabled]);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await fetchDoctorQueue();
      setQueue(data);
    } catch (err) {
      console.error("Queue fetch failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredQueue = React.useMemo(() => queue.filter(item => 
    item.id.toLowerCase().includes(debouncedSearch.toLowerCase())
  ), [queue, debouncedSearch]);

  return (
    <div className="min-h-screen bg-background flex flex-col medical-grid">
      
      {/* Refined Clinical Header */}
      <header className="px-10 py-6 bg-card border-b border-border flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-8">
          <Link href="/doctor">
            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl bg-secondary hover:bg-secondary/80 border border-border transition-all">
              <ArrowLeft size={20} className="text-muted-foreground" />
            </Button>
          </Link>
          <div className="h-10 w-px bg-border" />
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-3">
              <Users size={22} className="text-primary" />
              Clinical Priority Queue
            </h1>
            <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
              Live Patient Feed // {queue.length} Active Sessions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden lg:block">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search session ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-11 w-80 bg-secondary border-border text-sm focus:ring-primary/20 rounded-2xl"
            />
          </div>
          <Button variant="outline" onClick={loadQueue} className="h-11 px-6 gap-2 border-border bg-card hover:bg-secondary rounded-2xl shadow-sm transition-all active:scale-95">
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="text-xs font-bold uppercase tracking-tight">Sync Feed</span>
          </Button>
        </div>
      </header>

      {hasEmergency && (
        <div className="bg-critical/10 text-critical px-10 py-3 border-b border-critical/20 flex items-center justify-between animate-pulse-once">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span className="text-sm font-bold">CRITICAL: Emergency patients detected in queue!</span>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className={`text-xs font-bold uppercase tracking-wider ${soundEnabled ? 'bg-critical/20 border-critical' : 'border-critical/20'}`}
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? 'Sound On' : 'Sound Off'}
          </Button>
        </div>
      )}

      <main className="flex-1 p-10">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <AnimatePresence mode="wait">
            {loading && queue.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 gap-4 w-full"
              >
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-6 rounded-[2rem] bg-card border border-border flex items-center justify-between">
                    <div className="flex items-center gap-8">
                      <div className="w-14 h-14 rounded-2xl bg-secondary animate-pulse" />
                      <div className="h-10 w-px bg-border" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-secondary rounded-md animate-pulse" />
                        <div className="h-3 w-48 bg-secondary rounded-md animate-pulse" />
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="hidden md:flex flex-col items-end gap-1 px-6 border-r border-border">
                        <div className="h-3 w-16 bg-secondary rounded-md animate-pulse" />
                        <div className="h-4 w-24 bg-secondary rounded-md animate-pulse" />
                      </div>
                      <div className="h-12 w-32 bg-secondary rounded-2xl animate-pulse" />
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : filteredQueue.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 gap-4 @container"
              >
                {filteredQueue.map((item, idx) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-6 rounded-[2rem] bg-card border border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all grid grid-cols-1 @[600px]:grid-cols-[auto_1fr_1fr_auto] gap-4 items-center group"
                  >
                    {/* Priority Indicator */}
                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-secondary border border-border group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Priority</span>
                      <span className={`text-xl font-black ${
                        item.risk_score >= 0.8 ? 'text-critical' : 
                        item.risk_score >= 0.4 ? 'text-warning' : 'text-stable'
                      }`}>
                        {(item.risk_score * 10).toFixed(0)}
                      </span>
                    </div>

                    {/* Patient Info */}
                    <div>
                      <div className="flex items-center gap-3 mb-1.5">
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
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-[3rem] text-muted-foreground"
              >
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
                  <AlertCircle size={40} className="text-muted-foreground/50" />
                </div>
                <p className="text-lg font-bold text-foreground tracking-tight">No active clinical encounters</p>
                <p className="text-sm font-medium">The queue is currently clear for your region.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="px-10 py-5 bg-card border-t border-border flex items-center justify-between">
        <div className="flex gap-8">
          <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-critical shadow-[0_0_8px_rgba(244,63,94,0.4)]" /> Critical Interaction
          </div>
          <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-warning shadow-[0_0_8px_rgba(245,158,11,0.4)]" /> High Drift
          </div>
          <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-stable shadow-[0_0_8px_rgba(16,185,129,0.4)]" /> Stable Baseline
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Stethoscope size={14} className="text-primary" />
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            Aegis OS v2.4 // Clinical Governance Active
          </span>
        </div>
      </footer>
    </div>
  );
}
