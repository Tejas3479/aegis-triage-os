'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Users, 
  FileText, 
  Settings, 
  Activity, 
  ArrowRight,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const DOCTOR_FEATURES = [
  {
    title: "Triage Queue",
    description: "Manage live patient sessions sorted by clinical risk score.",
    href: "/doctor/queue",
    icon: Users,
    color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    status: "Live"
  },
  {
    title: "EHR Reports",
    description: "Access and download generated patient health reports.",
    href: "/doctor/reports",
    icon: FileText,
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    status: "Updated"
  },
  {
    title: "Epidemic Radar",
    description: "Geospatial visualization of local disease clusters.",
    href: "/doctor/public-health",
    icon: Activity,
    color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    status: "Live"
  },
  {
    title: "System Settings",
    description: "Configure clinical thresholds and model parameters.",
    href: "/admin/settings",
    icon: Settings,
    color: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    status: "Restricted"
  }
];

export default function DoctorDashboard() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Badge variant="outline" className="mb-4 border-indigo-500/30 text-indigo-400 bg-indigo-500/5 font-mono uppercase tracking-widest px-3">
            Clinician Portal v2.0
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-100 mb-2">
            Clinical Command Center
          </h1>
          <p className="text-slate-400 max-w-2xl leading-relaxed">
            Authorized access only. All actions are logged under the clinical audit protocol.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-white/5 text-right min-w-[120px]">
            <span className="block text-[10px] uppercase font-mono text-slate-500">Active Cases</span>
            <span className="text-2xl font-black text-slate-100">12</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-white/5 text-right min-w-[120px]">
            <span className="block text-[10px] uppercase font-mono text-slate-500">System Load</span>
            <span className="text-2xl font-black text-emerald-400">Nominal</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DOCTOR_FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link key={feature.href} href={feature.href} className="group">
              <Card className="h-full bg-slate-900/50 border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Icon size={80} />
                </div>
                <CardHeader className="p-8">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${feature.color} mb-6`}>
                    <Icon size={28} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl text-slate-100 group-hover:text-indigo-400 transition-colors">
                        {feature.title}
                      </CardTitle>
                      <Badge variant="outline" className="text-[9px] uppercase font-mono border-white/10 text-slate-500">
                        {feature.status}
                      </Badge>
                    </div>
                    <CardDescription className="text-slate-400 text-sm leading-relaxed max-w-[280px]">
                      {feature.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-8 pt-0">
                  <div className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-widest gap-2 group-hover:text-indigo-400 transition-all">
                    Enter Module <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Audit Log Banner */}
      <div className="mt-16 p-6 rounded-2xl bg-slate-900/30 border border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ShieldCheck className="text-slate-500" size={20} />
          <span className="text-[11px] text-slate-500 font-mono uppercase tracking-[0.2em]">
            Clinical Session Authenticated // Doctor ID: Smith_44 // Hospital: Aegis Central
          </span>
        </div>
        <div className="flex items-center gap-2 text-emerald-500/40 font-mono text-[10px]">
          <Stethoscope size={14} />
          NODE_LIVE_SECURE
        </div>
      </div>
    </div>
  );
}
