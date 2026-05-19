import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface MedicalEntity {
  name: string;
  code_system: 'SNOMED-CT' | 'RxNorm' | 'ICD-10';
  code: string;
}

interface StagedOrder {
  order_id: string;
  status: 'STAGED' | 'EXECUTING' | 'FAILED';
  payload: any;
}

interface AegisHUDState {
  transcript: { speaker: 'Doctor' | 'Patient'; text: string }[];
  stagedOrders: StagedOrder[];
  systemStatus: 'PROCESSING' | 'AWAITING_APPROVAL' | 'ACTION_REQUIRED_CONFLICT';
  activeErrorCode: number | null;
  errorMessage: string | null;
  patientHistory: any | null;
  nodeStatus: Record<string, 'running' | 'completed' | 'idle'>;
  
  // Core State Actions
  appendTranscriptToken: (speaker: 'Doctor' | 'Patient', text: string) => void;
  handleRPCResponse: (payload: any) => void;
  resetConflictState: () => void;
}

export const useAegisStore = create<AegisHUDState>()(
  persist(
    (set) => ({
      transcript: [],
      stagedOrders: [],
      systemStatus: 'AWAITING_APPROVAL',
      activeErrorCode: null,
      errorMessage: null,
      patientHistory: null,
      nodeStatus: {},

      appendTranscriptToken: (speaker, text) => set((state) => {
        const newTranscript = [...state.transcript, { speaker, text }];
        return {
          transcript: newTranscript.slice(-100)
        };
      }),

      handleRPCResponse: (payload) => set((state) => {
        if (payload.type === "node_status") {
          const { node, status } = payload.data;
          return {
            nodeStatus: {
              ...state.nodeStatus,
              [node]: status
            }
          };
        }

        // Protocol-Level Mapping for JSON-RPC 2.0 Error Envelopes
        if (payload.error) {
          const code = payload.error.code;
          const message = payload.error.message;
          
          switch (code) {
            case -32001: // UNAUTHORIZED_AGENT_WRITE
            case -32003: // CONCURRENCY_MUTATION_CONFLICT
            case -32004: // DETERMINISTIC_FAILSAFE_BLOCK
              return {
                systemStatus: 'ACTION_REQUIRED_CONFLICT',
                activeErrorCode: code,
                errorMessage: message
              };
            case -32002: // FHIR_SCHEMA_VIOLATION
              console.error("FHIR Structural Rejection:", message);
              return { systemStatus: 'AWAITING_APPROVAL' };
            default:
              return { systemStatus: 'ACTION_REQUIRED_CONFLICT', errorMessage: 'Unknown System Mutation Error.' };
          }
        }

        // Process successful tool-execution payloads
        if (payload.result && payload.result.status === "STAGED_IN_TRANSACTION_QUEUE") {
          const newOrder: StagedOrder = {
            order_id: payload.result.resource_id,
            status: 'STAGED',
            payload: payload.result.validated_payload
          };
          return {
            stagedOrders: [...state.stagedOrders, newOrder],
            systemStatus: 'AWAITING_APPROVAL'
          };
        }

        return state;
      }),

      resetConflictState: () => set({
        systemStatus: 'AWAITING_APPROVAL',
        activeErrorCode: null,
        errorMessage: null
      })
    }),
    {
      name: 'aegis-hud-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ transcript: state.transcript }),
    }
  )
);
