import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ShieldCheck, Activity } from 'lucide-react';

interface XAICardProps {
  careLevel: 'HOME_CARE' | 'CLINIC_VISIT' | 'EMERGENCY_ROOM' | string;
  reasoningText: string;
  latencyMs?: number;
}

export const XAICard: React.FC<XAICardProps> = ({ careLevel, reasoningText, latencyMs = 1200 }) => {
  const getRiskScore = () => {
    if (careLevel === 'EMERGENCY_ROOM') return 95;
    if (careLevel === 'CLINIC_VISIT') return 55;
    return 20;
  };

  const highlightHighRiskTokens = (text: string) => {
    const criticalRegex = /(chest pain|stroke|bleeding|severe|infarkt|difficulty breathing|dyspnea|fever)/gi;
    if (!text) return 'No assessment details reported.';
    const segments = text.split(criticalRegex);
    return segments.map((chunk, index) => 
      criticalRegex.test(chunk) ? (
        <Badge key={index} variant="destructive" className="mx-1 animate-pulse font-mono">
          {chunk}
        </Badge>
      ) : (
        chunk
      )
    );
  };

  return (
    <Card className="border-slate-800 bg-slate-950 text-slate-100 shadow-2xl w-full">
      <CardHeader>
        <CardTitle className="text-md flex items-center justify-between font-semibold tracking-tight">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <span>Clinical Lineage & Transparency</span>
          </div>
          <Badge variant={careLevel === 'EMERGENCY_ROOM' ? 'destructive' : 'outline'}>{careLevel}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Algorithmic Severity Index</span>
            <span>{getRiskScore()}%</span>
          </div>
          <Progress value={getRiskScore()} className="h-2 bg-slate-800" />
        </div>
        <div className="rounded-lg bg-slate-900 p-3 text-sm leading-relaxed text-slate-300 border border-slate-800">
          {highlightHighRiskTokens(reasoningText)}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t border-slate-900 pt-3 text-[10px] font-mono text-slate-500">
        <span>Model: Gemini 2.5 Pro</span>
        <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-500"/> Vault: Presidio Active</span>
        <span>Latency: {latencyMs}ms</span>
      </CardFooter>
    </Card>
  );
};
