'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Settings, 
  Cpu, 
  ShieldAlert, 
  Save, 
  Database,
  Sliders,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

export default function AdminSettingsPage() {
  const [riskThreshold, setRiskThreshold] = useState([70]);
  const [autoFallback, setAutoFallback] = useState(true);
  const [piiRedaction, setPiiRedaction] = useState(true);
  const [sessionTtl, setSessionTtl] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = Cookies.get('aegis_token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/v1/admin/settings`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setRiskThreshold([data.risk_threshold]);
          setAutoFallback(data.auto_fallback);
          setPiiRedaction(data.pii_redaction);
          setSessionTtl(data.session_ttl);
        }
      } catch (e) {
        console.error("Failed to fetch settings:", e);
      }
    };
    
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = Cookies.get('aegis_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/v1/admin/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          risk_threshold: riskThreshold[0],
          auto_fallback: autoFallback,
          pii_redaction: piiRedaction,
          session_ttl: sessionTtl
        })
      });
      if (res.ok) {
        toast.success("Settings saved successfully.");
      } else {
        toast.error("Failed to save settings.");
      }
    } catch (e) {
      console.error("Failed to save settings:", e);
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/doctor">
              <Button variant="outline" className="h-12 w-12 rounded-2xl border-white/5 bg-slate-900/50 text-slate-400 hover:text-white">
                <ArrowLeft size={24} />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-100 flex items-center gap-3">
                <Settings className="text-slate-400" size={32} />
                Governance
              </h1>
              <p className="text-slate-500 font-mono text-sm mt-1 uppercase tracking-widest">
                System Parameters // Admin Only
              </p>
            </div>
          </div>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-500 rounded-xl h-12 px-6 gap-2"
          >
            <Save size={18} />
            {saving ? "Deploying..." : "Commit Changes"}
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-8">
            <Card className="bg-slate-900/50 border-white/5 shadow-xl">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <Cpu size={18} className="text-indigo-400" />
                  AI Inference Matrix
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Manage clinical reasoning engines.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-sm font-bold text-slate-200">Gemini 2.5 Flash</span>
                      <p className="text-xs text-slate-500">Primary triage & STT model.</p>
                    </div>
                    <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/5">ACTIVE</Badge>
                  </div>
                  <div className="flex items-center justify-between opacity-40">
                    <div className="space-y-0.5">
                      <span className="text-sm font-bold text-slate-200">GPT-4o Baseline</span>
                      <p className="text-xs text-slate-500">Secondary verification layer.</p>
                    </div>
                    <Badge variant="outline" className="border-white/10 text-slate-500 bg-slate-800">DISABLED</Badge>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Auto-Fallback</span>
                    <Switch checked={autoFallback} onCheckedChange={setAutoFallback} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-white/5 shadow-xl">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <Sliders size={18} className="text-amber-400" />
                  Clinical Scoring
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Calibrate algorithmic risk thresholds.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Escalation Threshold</span>
                    <span className="text-xs font-mono text-indigo-400">{riskThreshold}%</span>
                  </div>
                  <Slider 
                    value={riskThreshold} 
                    onValueChange={(val) => {
                      setRiskThreshold(Array.isArray(val) ? [...val] : [val]);
                    }} 
                    max={100} 
                    step={1} 
                    className="accent-indigo-500"
                  />
                  <p className="text-[11px] text-slate-500 leading-relaxed italic">
                    Sessions scoring above this value are automatically flagged as CRITICAL and moved to the head of the clinician queue.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="bg-slate-900/50 border-white/5 shadow-xl">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <ShieldAlert size={18} className="text-rose-400" />
                  Security Governance
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Session & data lifecycle management.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold text-slate-200">PII Redaction</span>
                    <p className="text-xs text-slate-500">Enforce Presidio scrubbing.</p>
                  </div>
                  <Switch checked={piiRedaction} onCheckedChange={setPiiRedaction} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold text-slate-200">Session TTL</span>
                    <p className="text-xs text-slate-500">Expire sessions after 4 hours.</p>
                  </div>
                  <Switch checked={sessionTtl} onCheckedChange={setSessionTtl} />
                </div>
              </CardContent>
            </Card>

            <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-3">
              <div className="flex items-center gap-2 text-amber-500 font-bold uppercase tracking-widest text-[10px]">
                <AlertTriangle size={14} />
                Critical Warning
              </div>
              <p className="text-[11px] text-amber-500/80 leading-relaxed">
                Modifying governance parameters affects live clinical decision support. Ensure all changes are validated against the hospital clinical protocol.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/30 border border-white/5 space-y-4">
              <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                <Database size={14} />
                Database Matrix
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Main Cluster</span>
                  <span className="text-emerald-500 font-mono">STABLE</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Audit Logs</span>
                  <span className="text-emerald-500 font-mono">SYNCED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
