'use client';

import React, { useState } from 'react';
import { Shield, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { recordDpdpConsent } from '@/lib/api';

const CONSENT_STORAGE_KEY = 'aegis_dpdp_consent';

export function getStoredConsentSession(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(CONSENT_STORAGE_KEY);
}

export function setStoredConsentSession(sessionId: string): void {
  sessionStorage.setItem(CONSENT_STORAGE_KEY, sessionId);
}

export function clearStoredConsent(): void {
  sessionStorage.removeItem(CONSENT_STORAGE_KEY);
}

interface ConsentGateProps {
  sessionId: string;
  onConsented: () => void;
}

export const ConsentGate: React.FC<ConsentGateProps> = ({ sessionId, onConsented }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAccept = async () => {
    setLoading(true);
    setError('');
    try {
      await recordDpdpConsent(sessionId);
      setStoredConsentSession(sessionId);
      onConsented();
    } catch {
      setError('Could not record consent. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
    >
      <div className="max-w-lg w-full rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-400" aria-hidden />
          </div>
          <div>
            <h2 id="consent-title" className="text-lg font-bold text-slate-100">
              Privacy & Clinical Consent
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              DPDP Act · Session {sessionId.substring(0, 8)}
            </p>
          </div>
        </div>

        <div className="text-sm text-slate-300 space-y-3 leading-relaxed">
          <p>Before triage begins, confirm you understand how Aegis processes your data:</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs">
            <li>Symptoms you share (voice or text) are used for AI-assisted triage guidance only.</li>
            <li>Voice is transcribed on our servers (local STT by default); raw audio is not sent to cloud AI.</li>
            <li>Personal identifiers are scrubbed before clinical AI analysis.</li>
            <li>Anonymized location may support public-health outbreak monitoring.</li>
            <li>This tool does not replace emergency services or a licensed clinician.</li>
          </ul>
          <p className="text-[11px] text-slate-500 border-t border-slate-800 pt-3">
            You may withdraw consent at any time. For emergencies, call your local emergency number.
          </p>
        </div>

        {error && (
          <p className="text-sm text-rose-400" role="alert">
            {error}
          </p>
        )}

        <Button
          onClick={handleAccept}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 h-11 gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          I understand — begin triage
        </Button>
      </div>
    </div>
  );
};
