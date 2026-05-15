'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrainCircuit, CheckCircle2, Loader2 } from 'lucide-react';
import { submitMentalAssessment } from '@/lib/api';

interface MentalHealthCardProps {
  sessionId: string;
}

export const MentalHealthCard: React.FC<MentalHealthCardProps> = ({ sessionId }) => {
  const [score, setScore] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async () => {
    if (!sessionId) return;
    setIsSubmitting(true);
    setError('');
    try {
      await submitMentalAssessment(sessionId, score);
      setIsSuccess(true);
    } catch (err: any) {
      setError('Network error. Failed to log assessment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="bg-emerald-950/20 border border-emerald-900/50 shadow-lg">
        <CardContent className="flex flex-col items-center justify-center p-6 text-emerald-400">
          <CheckCircle2 className="w-8 h-8 mb-3 animate-pulse" />
          <p className="text-sm font-medium tracking-wide uppercase">Psychometric Baseline Logged Securely.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center text-slate-200 uppercase tracking-wider">
          <BrainCircuit className="w-4 h-4 mr-2 text-indigo-400" /> 
          PHQ-9 Mental Health Baseline
        </CardTitle>
        <CardDescription className="text-xs text-slate-400 font-mono">
          Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless? (0-27)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <span className="text-slate-500 font-mono text-xs">0 (None)</span>
          <input 
            type="range" 
            min="0" 
            max="27" 
            value={score} 
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
          />
          <span className="text-slate-500 font-mono text-xs">27 (Severe)</span>
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <div className="font-mono">
            <span className="text-xs text-slate-500 uppercase">Selected Score: </span>
            <span className={`text-lg font-bold ${score >= 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {score}
            </span>
          </div>
          
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !sessionId}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg transition-colors"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Submit Assessment
          </Button>
        </div>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </CardContent>
    </Card>
  );
};
