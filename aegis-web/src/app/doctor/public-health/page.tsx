'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Map as MapIcon, 
  Activity, 
  AlertTriangle, 
  TrendingUp,
  RefreshCcw,
  ShieldAlert,
  Search,
  Brain,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchOutbreakClusters, OutbreakCluster } from '@/lib/api';

export default function PublicHealthDashboard() {
  const [clusters, setClusters] = useState<OutbreakCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<OutbreakCluster | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchOutbreakClusters();
      setClusters(data);
      if (data.length > 0) setSelectedCluster(data[0]);
    } catch (err) {
      console.error("Failed to load clusters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 flex flex-col font-sans">
      <div className="scanline" />
      
      {/* Header */}
      <header className="px-8 py-6 bg-slate-900/40 border-b border-white/5 flex items-center justify-between backdrop-blur-3xl z-20">
        <div className="flex items-center gap-6">
          <Link href="/doctor">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-white/10 bg-white/5 hover:bg-white/10">
              <ArrowLeft size={20} className="text-slate-400" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <MapIcon className="text-indigo-400 w-5 h-5" />
              <h1 className="text-xl font-black text-white tracking-tight uppercase">Epidemiological Intelligence</h1>
            </div>
            <p className="text-[10px] text-slate-500 font-mono tracking-[0.3em] uppercase">
              HDBSCAN Clustering Engine // Live Geospatial Feed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col items-end mr-4">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Region Focus</span>
            <span className="text-xs text-white font-mono">Yelahanka, Bengaluru (North)</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadData}
            className="gap-2 border-indigo-500/20 bg-indigo-500/5 text-indigo-400 hover:bg-indigo-500/10"
          >
            <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
            Recalculate Clusters
          </Button>
        </div>
      </header>

      <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden relative">
        {/* Left Column: Stats & List */}
        <div className="lg:col-span-4 space-y-8 flex flex-col overflow-hidden">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-[2rem] bg-slate-900/60 border border-white/5">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-4">Total Clusters</span>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-white">{clusters.length}</span>
                <TrendingUp size={20} className="text-emerald-500 mb-1" />
              </div>
            </div>
            <div className="p-6 rounded-[2rem] bg-slate-900/60 border border-white/5">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-4">Risk Level</span>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-rose-500">CRITICAL</span>
              </div>
            </div>
          </div>

          {/* Cluster List & AI Advisory */}
          <div className="flex-1 space-y-6 flex flex-col overflow-hidden">
            <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col h-[60%]">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Outbreaks</h3>
                <Search size={14} className="text-slate-600" />
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {loading && clusters.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 font-mono text-[10px]">
                    <Activity className="animate-spin mb-4" />
                    ANALYZING SPATIAL DENSITY...
                  </div>
                ) : clusters.map((cluster) => (
                  <motion.div
                    key={cluster.cluster_id}
                    layoutId={`cluster-${cluster.cluster_id}`}
                    onClick={() => setSelectedCluster(cluster)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                      selectedCluster?.cluster_id === cluster.cluster_id 
                        ? 'bg-indigo-600/20 border-indigo-500/50' 
                        : 'bg-white/5 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="outline" className="text-[9px] font-mono border-white/10 text-slate-500">
                        ID: #{cluster.cluster_id}
                      </Badge>
                      <Badge className={
                        cluster.risk_level === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                      }>
                        {cluster.risk_level}
                      </Badge>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">{cluster.disease_pattern}</h4>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                      {cluster.case_count} Cases Detected
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* AI Advisory Panel */}
            <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-[2.5rem] p-8 flex-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Brain size={80} className="text-indigo-400" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <Zap size={18} className="text-indigo-400" />
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Agentic Advisory</h3>
              </div>
              <div className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed font-light">
                  <span className="text-indigo-400 font-bold">SENTINEL_DETECT:</span> Clustering in Yelahanka suggests a localized Dengue spike. Recommend triggering immediate mosquito-control protocols in Bengaluru North.
                </p>
                <Button variant="outline" className="w-full h-10 border-indigo-500/30 bg-indigo-500/5 text-indigo-400 hover:bg-indigo-500/10 text-[9px] font-bold uppercase tracking-widest rounded-xl">
                  Deploy Regional Health Alert
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Visualization */}
        <div className="lg:col-span-8 bg-slate-900/20 border border-white/5 rounded-[3rem] relative overflow-hidden group">
          <div className="absolute inset-0 bg-mesh-gradient opacity-20" />
          
          {/* Mock Map Background (Cinematic) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
            <div className="w-[80%] h-[80%] border border-indigo-500/20 rounded-full animate-pulse" />
            <div className="absolute w-[60%] h-[60%] border border-indigo-500/10 rounded-full animate-pulse delay-75" />
            <div className="absolute w-[40%] h-[40%] border border-indigo-500/5 rounded-full animate-pulse delay-150" />
          </div>

          {/* Interactive Outbreak Points */}
          <div className="absolute inset-0 z-10 p-12">
            <div className="relative w-full h-full">
              {clusters.map((cluster, idx) => {
                // Random position logic for visualization if not using a real map
                const left = 30 + (idx * 15) % 40;
                const top = 20 + (idx * 20) % 60;
                return (
                  <motion.div
                    key={cluster.cluster_id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.2 }}
                    style={{ left: `${left}%`, top: `${top}%` }}
                    className="absolute cursor-pointer group/node"
                    onClick={() => setSelectedCluster(cluster)}
                  >
                    <div className={`relative w-8 h-8 flex items-center justify-center`}>
                      <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${
                        cluster.risk_level === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-500'
                      }`} />
                      <div className={`w-3 h-3 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] ${
                        cluster.risk_level === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-500'
                      }`} />
                    </div>
                    
                    {/* Hover Info */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover/node:opacity-100 transition-opacity whitespace-nowrap bg-slate-900/90 backdrop-blur-md border border-white/10 p-3 rounded-xl z-30 shadow-2xl">
                      <p className="text-[10px] font-black text-white mb-1 uppercase tracking-widest">{cluster.disease_pattern}</p>
                      <p className="text-[9px] text-slate-400 font-mono">{cluster.case_count} Patients // Lat: {cluster.center_latitude.toFixed(4)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Info Overlay */}
          <AnimatePresence mode="wait">
            {selectedCluster && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute bottom-10 right-10 w-80 bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 z-30 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center">
                    <ShieldAlert className="text-rose-400" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Outbreak Detected</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">ID: #{selectedCluster.cluster_id}</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-2">Primary Symptom Pattern</span>
                    <p className="text-sm text-slate-200 font-medium leading-relaxed">{selectedCluster.disease_pattern}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Density</span>
                      <span className="text-lg font-black text-white">{selectedCluster.case_count} Cases</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Threat Index</span>
                      <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 font-black">94/100</Badge>
                    </div>
                  </div>

                  <Button className="w-full bg-rose-600 hover:bg-rose-500 text-white rounded-xl h-10 mt-2 font-bold uppercase tracking-widest text-[10px]">
                    Initiate Quarantine Protocol
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Map Controls */}
          <div className="absolute top-10 left-10 flex flex-col gap-3 z-30">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-10 h-10 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer hover:bg-slate-800 transition-colors">
                <Activity size={16} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
