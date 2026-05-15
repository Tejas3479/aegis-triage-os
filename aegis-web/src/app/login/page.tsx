'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Loader2, ShieldCheck } from 'lucide-react';
import { loginDoctor } from '@/lib/api';

export default function LoginGateway() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = await loginDoctor(pin);
      localStorage.setItem('aegis_token', token);
      router.push('/doctor');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 z-0"></div>
      
      <Card className="w-full max-w-md bg-slate-900/80 border-slate-800 backdrop-blur-md shadow-2xl z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center shadow-inner">
            <ShieldCheck className="w-8 h-8 text-indigo-500" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-100 uppercase">Aegis Secure Gateway</CardTitle>
            <CardDescription className="text-slate-400 font-mono mt-2">Authorized Clinical Personnel Only</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-500 uppercase tracking-widest">Clinical Access PIN</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono tracking-widest transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-500 font-mono text-right">HINT: aegis2026</p>
            </div>
            
            {error && (
              <div className="p-3 border border-red-900/50 bg-red-950/20 rounded-md">
                <p className="text-red-400 text-xs text-center font-mono">{error}</p>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all"
              disabled={loading || !pin}
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Authenticate Identity"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t border-slate-800/50 pt-4">
          <p className="text-[10px] text-slate-600 font-mono text-center">
            Zero-Trust Architecture Active. IP logged.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
