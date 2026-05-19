
'use client';

import React, { useState, useEffect } from 'react';
import {
  Heart,
  Activity,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Check,
  Stethoscope
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClinicalBadge } from '@/components/ui/clinical-badge';
import { ConsentGate } from '@/features/ambient-scribe/ConsentGate';
import { toast } from 'sonner';

const CRITICAL_RISKS = ["chest_pain", "breathing_difficulty", "severe_bleeding", "unconsciousness"];

const RISK_FACTORS = [
  { value: "chest_pain", label: "Chest pain or tightness" },
  { value: "breathing_difficulty", label: "Difficulty breathing" },
  { value: "severe_bleeding", label: "Severe bleeding" },
  { value: "unconsciousness", label: "Loss of consciousness" },
  { value: "fever", label: "High fever" },
  { value: "cough", label: "Persistent cough" },
];

export default function TriageWizardPage() {
  const [step, setStep] = useState(1);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [painScore, setPainScore] = useState(0);
  const [duration, setDuration] = useState('');
  const [selectedRisks, setSelectedRisks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sessionId] = useState(`sess-${Math.random().toString(36).substring(7)}`);
  const [consented, setConsented] = useState(false);

  // Restore from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('triage_wizard_state');
    if (saved) {
      const state = JSON.parse(saved);
      setStep(state.step || 1);
      setChiefComplaint(state.chiefComplaint || '');
      setPainScore(state.painScore || 0);
      setDuration(state.duration || '');
      setSelectedRisks(state.selectedRisks || []);
    }
    const hasStoredConsent = sessionStorage.getItem('aegis_dpdp_consent');
    if (hasStoredConsent) {
      setConsented(true);
    }
  }, []);

  // Save to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('triage_wizard_state', JSON.stringify({
      step, chiefComplaint, painScore, duration, selectedRisks
    }));
  }, [step, chiefComplaint, painScore, duration, selectedRisks]);

  const hasCriticalRisk = selectedRisks.some(risk => CRITICAL_RISKS.includes(risk));

  const getRiskLevel = () => {
    if (hasCriticalRisk || painScore >= 8) return 'critical';
    if (painScore >= 4 || duration.includes('week') || duration.includes('month')) return 'warning';
    return 'stable';
  };

  const riskLevel = getRiskLevel();

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/triage/wizard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          chief_complaint: chiefComplaint,
          pain_score: Math.round(painScore),
          duration: duration,
          risk_factors: selectedRisks
        })
      });

      if (!response.ok) throw new Error("Submission failed");

      setSubmitted(true);
      sessionStorage.removeItem('triage_wizard_state');
      toast.success("Triage submitted successfully!");
    } catch (err) {
      toast.error("Failed to submit triage. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const faces = ['😊', '😐', '🙁', '😟', '😭'];

  if (!consented) {
    return <ConsentGate sessionId={sessionId} onConsented={() => setConsented(true)} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col p-8">
      <div className="max-w-2xl w-full mx-auto space-y-8 flex-1 flex flex-col justify-center">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mx-auto mb-4">
            <Stethoscope className="text-white w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Clinical Triage Wizard</h1>
          <p className="text-muted-foreground">Please answer a few questions to help us prioritize your care.</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={4}>
          <div className="bg-primary h-full transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }} />
        </div>

        {/* Emergency Banner */}
        {hasCriticalRisk && (
          <div className="bg-critical/10 text-critical p-4 rounded-xl border border-critical/20 flex items-center gap-3 animate-pulse-once">
            <AlertCircle size={20} />
            <div>
              <p className="font-bold">Immediate Care Recommended</p>
              <p className="text-sm">Please call 108 or proceed to the nearest emergency room immediately.</p>
            </div>
          </div>
        )}

        {/* Risk Indicator */}
        <div className="flex justify-center">
          <div className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
            <ClinicalBadge severity={riskLevel}>
              Risk Level: {riskLevel.toUpperCase()}
            </ClinicalBadge>
          </div>
        </div>


        {/* Steps */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-card border border-border p-8 rounded-[2rem] shadow-sm space-y-6"
          >
            {step === 1 && (
              <div className="space-y-4">
                <label className="text-lg font-bold">What is your chief complaint?</label>
                <Input
                  placeholder="Describe your main symptom..."
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="h-12 text-base rounded-xl bg-secondary border-border focus:ring-primary/20"
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <label className="text-lg font-bold">Rate your pain level (0-10)</label>
                <div className="flex justify-between items-center gap-4">
                  {faces.map((face, index) => {
                    const score = index * 2.5;
                    return (
                      <button
                        key={index}
                        onClick={() => setPainScore(score)}
                        className={`text-4xl p-2 rounded-full transition-all ${Math.abs(painScore - score) < 1.5 ? 'bg-primary/20 scale-125' : 'opacity-50 hover:opacity-100'}`}
                      >
                        {face}
                      </button>
                    );
                  })}
                </div>
                <p className="text-center font-bold text-lg">{painScore.toFixed(0)} / 10</p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <label className="text-lg font-bold">How long have you had this symptom?</label>
                <Input
                  placeholder="e.g., 2 hours, 3 days..."
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="h-12 text-base rounded-xl bg-secondary border-border focus:ring-primary/20"
                />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <label className="text-lg font-bold">Do you have any of these risk factors?</label>
                <div className="grid grid-cols-1 gap-3">
                  {RISK_FACTORS.map((risk) => (
                    <label key={risk.value} className="flex items-center gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-secondary transition-all">
                      <input
                        type="checkbox"
                        checked={selectedRisks.includes(risk.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRisks([...selectedRisks, risk.value]);
                          } else {
                            setSelectedRisks(selectedRisks.filter(r => r !== risk.value));
                          }
                        }}
                        className="w-5 h-5 accent-primary"
                      />
                      <span className="font-medium">{risk.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={handleBack} disabled={step === 1 || submitted} className="h-12 px-6 rounded-xl gap-2 border-border bg-card hover:bg-secondary">
            <ChevronLeft size={16} />
            <span>Back</span>
          </Button>

          {step < 4 ? (
            <Button onClick={handleNext} disabled={submitted || (step === 1 && !chiefComplaint.trim())} className="h-12 px-6 rounded-xl gap-2 active:scale-[0.98]">
              <span>Next</span>
              <ChevronRight size={16} />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading || submitted} className={`h-12 px-6 rounded-xl gap-2 active:scale-[0.98] ${hasCriticalRisk ? 'bg-critical hover:bg-critical/90' : 'bg-primary hover:bg-primary/90'}`}>
              {loading ? 'Submitting...' : submitted ? 'Submitted' : 'Submit Triage'}
              {!loading && !submitted && <Check size={16} />}
            </Button>
          )}
        </div>

        {/* Success Message */}
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-stable font-bold p-4 bg-stable/10 rounded-xl border border-stable/20"
          >
            Triage submitted successfully. A clinician will review your case shortly.
          </motion.div>
        )}

        {/* Reset / Revoke Buttons */}
        <div className="flex justify-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => {
            sessionStorage.removeItem('triage_wizard_state');
            setStep(1);
            setChiefComplaint('');
            setPainScore(0);
            setDuration('');
            setSelectedRisks([]);
            setSubmitted(false);
          }} className="text-muted-foreground hover:text-foreground text-xs">
            Reset Wizard
          </Button>
          <div className="w-px h-4 bg-border my-auto" />
          <Button variant="ghost" size="sm" onClick={() => {
            sessionStorage.removeItem('aegis_dpdp_consent');
            setConsented(false);
            toast.info("Clinical consent successfully withdrawn.");
          }} className="text-destructive hover:text-destructive/80 text-xs">
            Revoke Consent
          </Button>
        </div>
      </div>
    </div>
  );
}
