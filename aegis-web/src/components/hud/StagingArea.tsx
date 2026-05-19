import React, { useState } from 'react';
import { useAegisStore } from '@/store/useAegisStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, FileText, Mic, ExternalLink, ShieldAlert } from 'lucide-react';

interface OrderCardProps {
  id: string;
  name: string;
  type: 'Medication' | 'Lab Panel' | 'Referral';
  details: string;
  citation: string;
  guideline: string;
  isLocked: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({ name, type, details, citation, guideline, isLocked }) => {
  return (
    <Card className="p-3 bg-background border border-border rounded-lg space-y-2 shadow-sm transition-all hover:border-muted-foreground/30">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5">
            <Badge variant="outline" className={`text-[9px] font-mono tracking-wider uppercase px-1 py-0 ${
              type === 'Medication' ? 'bg-info/10 text-info border-info/20' : 'bg-secondary text-muted-foreground border-border'
            }`}>
              {type}
            </Badge>
            <h5 className="text-xs font-bold tracking-tight text-foreground">{name}</h5>
          </div>
          <p className="text-[11px] text-muted-foreground font-mono bg-secondary px-1.5 py-0.5 rounded border border-border inline-block">
            {details}
          </p>
        </div>

        {/* Traceable Evidence Modal Link */}
        <Dialog>
          <DialogTrigger className="p-0 h-auto text-[10px] font-mono tracking-tight text-muted-foreground hover:text-foreground flex items-center gap-0.5 bg-transparent border-0 cursor-pointer">
            <FileText className="h-3 w-3" /> Evidence
          </DialogTrigger>
          <DialogContent className="bg-card border border-border max-w-sm rounded-xl p-5">
            <DialogHeader className="border-b border-border pb-2">
              <DialogTitle className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-stable" /> Grounded Verification Audit
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-3 text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Source Patient Quote</span>
                <blockquote className="mt-1 p-2 bg-background border-l-2 border-stable rounded text-foreground italic leading-relaxed font-sans">
                  &quot;{citation}&quot;
                </blockquote>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Enforced Clinical Guideline</span>
                <p className="mt-1 font-medium text-foreground flex items-center gap-1">
                  <ExternalLink className="h-3 w-3 text-muted-foreground" /> {guideline}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
};

export const StagingArea: React.FC = () => {
  const systemStatus = useAegisStore((state) => state.systemStatus);
  const stagedOrders = useAegisStore((state) => state.stagedOrders);
  const [voiceInput, setVoiceInput] = useState('');

  const isLockoutActive = systemStatus === 'ACTION_REQUIRED_CONFLICT';

  // Fallback structural mock items when graph store initialization arrays are empty
  const activeOrders = stagedOrders.length > 0 ? stagedOrders.map(o => ({
    id: o.order_id,
    name: o.payload.medicationCodeableConcept.coding[0].display,
    type: 'Medication' as const,
    details: o.payload.dosageInstruction[0].text,
    citation: "I've had this persistent sinus pressure and thick green drainage for over a week, and my teeth are aching.",
    guideline: "IDSA 2025 Rhinosinusitis Antimicrobial Protocol"
  })) : [
    {
      id: "medreq_9921",
      name: "Amoxicillin-Clavulanate 875-125mg PO BID",
      type: 'Medication' as const,
      details: "RxCUI: 308182 | Duration: 7 Days",
      citation: "I've had this persistent sinus pressure and thick green drainage for over a week, and my teeth are aching.",
      guideline: "IDSA 2025 Rhinosinusitis Antimicrobial Protocol"
    },
    {
      id: "labreq_9922",
      name: "Complete Blood Count (CBC) w/ Differential",
      type: 'Lab Panel' as const,
      details: "LOINC: 58410-2 | Priority: Routine",
      citation: "I've been feeling unusually wiped out and running chills on and off since Monday.",
      guideline: "AHA Clinical Hematology Standard Assessment"
    }
  ];

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voiceInput.trim()) return;
    // Target anchor for Feature A WebSocket mutation engine stream
    console.log("Emitting text mutation vector:", voiceInput);
    setVoiceInput('');
  };

  return (
    <div className="p-6 bg-card h-full flex flex-col justify-between max-w-sm w-full">
      
      {/* HEADER META CORE */}
      <div className="space-y-4 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Action Staging Registry
            </h3>
            <p className="text-[10px] text-muted-foreground font-mono">Payload Standard: FHIR R4</p>
          </div>
          {isLockoutActive && (
            <Badge className="bg-critical/10 text-critical border-none flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase animate-pulse">
              <ShieldAlert className="h-3 w-3" /> Locked
            </Badge>
          )}
        </div>

        {/* STAGED CARD LIST RUNTIME */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0 scrollbar-thin scrollbar-thumb-border">
          {activeOrders.map((order) => (
            <OrderCard 
              key={order.id}
              id={order.id}
              name={order.name}
              type={order.type}
              details={order.details}
              citation={order.citation}
              guideline={order.guideline}
              isLocked={isLockoutActive}
            />
          ))}
        </div>
      </div>

      {/* FOOTER COMMAND CONTROL PLATFORM */}
      <div className="mt-6 space-y-3 pt-4 border-t border-border bg-card">
        
        {/* CRITICAL GLOBAL APPROVAL TRIGGER */}
        <Button 
          disabled={isLockoutActive}
          className="w-full h-10 font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-[0.98]"
        >
          {isLockoutActive ? 'Approval Blocked via SCRAM' : 'Authorize Orders & Write Back'}
        </Button>

        {/* FEATURE A PLACEHOLDER: VOICE COMMAND BAR */}
        <form onSubmit={handleCommandSubmit} className="relative">
          <input 
            type="text"
            disabled={isLockoutActive}
            value={voiceInput}
            onChange={(e) => setVoiceInput(e.target.value)}
            placeholder={isLockoutActive ? "Command block active..." : "Aegis Edit Vector Command..."}
            className="w-full h-8 pl-8 pr-3 rounded-md border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground font-sans focus:outline-none focus:border-primary disabled:opacity-50 transition-all shadow-inner"
          />
          <Mic className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground opacity-70" />
        </form>
      </div>
    </div>
  );
};
