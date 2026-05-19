import React from 'react';
import { useAegisStore } from '@/store/useAegisStore';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Cpu, Dna, FileCheck, ShieldX } from 'lucide-react';

interface AgentNodeProps {
  name: string;
  label: string;
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'BLOCKED';
  icon: React.ReactNode;
}

const AgentNode: React.FC<AgentNodeProps> = ({ name, label, status, icon }) => {
  const statusColors = {
    IDLE: 'border-muted bg-background text-muted-foreground',
    RUNNING: 'border-warning bg-warning/10 text-warning animate-pulse',
    COMPLETED: 'border-stable bg-stable/10 text-stable',
    BLOCKED: 'border-critical bg-critical/10 text-critical font-bold'
  };

  return (
    <div className={`p-3 rounded-lg border-2 transition-all duration-300 flex items-center space-x-3 ${statusColors[status]}`}>
      <div className="p-2 bg-card rounded border border-inherit shadow-sm">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-mono tracking-wider uppercase opacity-80">{name}</p>
        <p className="text-xs font-bold tracking-tight truncate text-foreground">{label}</p>
      </div>
    </div>
  );
};

export const CouncilMatrix: React.FC = () => {
  const systemStatus = useAegisStore((state) => state.systemStatus);
  const nodeStatus = useAegisStore((state) => state.nodeStatus || {});
  const resetConflictState = useAegisStore((state) => state.resetConflictState);

  // Use nodeStatus from store with uppercase mapping
  const getNodeStatus = (nodeName: string): 'IDLE' | 'RUNNING' | 'COMPLETED' | 'BLOCKED' => {
    const status = nodeStatus[nodeName] || 'idle';
    if (status === 'running') return 'RUNNING';
    if (status === 'completed') return 'COMPLETED';
    return 'IDLE';
  };

  return (
    <div className="relative p-6 border-x border-border bg-card h-full flex flex-col justify-between min-w-[400px] flex-1">
      
      {/* 1. THE UI REACTOR LOCKOUT BLUR OVERLAY */}
      {systemStatus === 'ACTION_REQUIRED_CONFLICT' && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-6 transition-all duration-300 animate-in fade-in">
          <Alert variant="destructive" className="border-2 max-w-md shadow-2xl bg-card border-critical">
            <ShieldAlert className="h-5 w-5 text-critical" />
            <AlertTitle className="font-bold tracking-tight text-sm">
              Reactor SCRAM: Failsafe Intercept
            </AlertTitle>
            <AlertDescription className="mt-2 text-xs leading-relaxed text-foreground opacity-90">
              A deterministic safety boundary was breached by the sub-agent swarm thread.
            </AlertDescription>
            <div className="mt-4 flex justify-end">
              <button 
                onClick={resetConflictState}
                className="px-3 py-2 bg-critical text-white font-mono rounded text-[10px] font-bold uppercase tracking-wider hover:bg-critical/90 transition-colors shadow-sm"
              >
                Clear State Lock & Overhaul Context
              </button>
            </div>
          </Alert>
        </div>
      )}

      {/* 2. HUD HEADER ENGINE BAR */}
      <div className="space-y-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Council Deliberation Core
            </h3>
            <p className="text-[10px] text-muted-foreground font-mono">Topology: Non-Linear Directed Graph</p>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono bg-background text-foreground border-border">
            Active Threads: 04
          </Badge>
        </div>

        {/* 3. SWARM EDGE MAP CONTAINER */}
        <div className="flex-1 flex flex-col justify-center space-y-3 max-w-sm mx-auto w-full">
          <AgentNode 
            name="orchestrator_node" 
            label="Clinical Router & Decomposer" 
            status={systemStatus === 'PROCESSING' ? 'RUNNING' : 'COMPLETED'}
            icon={<Cpu className="h-4 w-4" />}
          />
          
          <div className="h-3 w-0.5 bg-border mx-auto" />
          
          <AgentNode 
            name="diagnostician_node" 
            label="Structured Symptom Specialist" 
            status={getNodeStatus('diag')}
            icon={<Dna className="h-4 w-4" />}
          />
          
          <div className="h-3 w-0.5 bg-border mx-auto" />
          
          <AgentNode 
            name="pharmacology_node" 
            label="Deterministic RxNorm Cross-Ref" 
            status={getNodeStatus('pharma')}
            icon={<ShieldX className="h-4 w-4" />}
          />
          
          <div className="h-3 w-0.5 bg-border mx-auto" />
          
          <AgentNode 
            name="billing_coding_node" 
            label="ICD-10 / DRG Pre-Auth Predictor" 
            status={getNodeStatus('billing')}
            icon={<FileCheck className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* 4. REAL-TIME TELEMETRY STREAM FOOTER */}
      <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-[10px] font-mono text-muted-foreground">
        <span>Graph State: compiled_success</span>
        <span>Latency: 142ms</span>
      </div>
    </div>
  );
};
