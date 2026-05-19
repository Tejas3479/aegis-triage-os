import random
import os
from typing import Dict, Any, Tuple
from app.domains.mcp.protocol import MCPRequest, MCPResponse
from app.domains.mcp.server import SimulatedEHREngine

class AegisMCPClientRouter:
    def __init__(self, server_engine: SimulatedEHREngine):
        self.server_engine = server_engine
        # Master internal key used to authorize node transactions across the cluster
        self._CLUSTER_AUTH_TOKEN = os.getenv("MCP_AUTH_TOKEN")
        if not self._CLUSTER_AUTH_TOKEN:
            # Fallback for dev, but log warning
            self._CLUSTER_AUTH_TOKEN = "aegis_secure_node_alpha_2026"

    def execute_stage_order(self, raw_agent_order: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
        """
        Interceptors raw agent proposals, formats them into a strict FHIR MedicationRequest,
        and routes them through the JSON-RPC 2.0 transport layer.
        """
        # 1. Map the unstructured agent suggestion directly to the strict FHIR R4 parameters
        fhir_mapped_arguments = {
            "resourceType": "MedicationRequest",
            "status": "draft",  # Always stage as draft for clinical human-in-the-loop validation
            "intent": "proposal",
            "medicationCodeableConcept": {
                "coding": [{
                    "system": raw_agent_order.get("code_system", "RxNorm"),
                    "code": str(raw_agent_order.get("code")),
                    "display": raw_agent_order.get("name", "Unknown Medication")
                }],
                "text": raw_agent_order.get("clinical_justification", "Staged via Aegis Triage OS Council")
            },
            "subject": {
                "reference": f"Patient/{raw_agent_order.get('patient_id', 'UNKNOWN_ID')}"
            },
            "dosageInstruction": [{
                "text": f"{raw_agent_order.get('dosage', 'As directed')} - Frequency: {raw_agent_order.get('frequency', 'PRN')}"
            }]
        }

        # 2. Encapsulate into a valid JSON-RPC 2.0 Request Frame
        rpc_request = MCPRequest(
            method="tools/call",
            params={
                "name": "stage_clinical_order",
                "arguments": fhir_mapped_arguments
            },
            id=random.randint(1000, 9999),
            auth_token=self._CLUSTER_AUTH_TOKEN
        )

        # 3. Ship across the protocol layer to the EHR interface engine
        try:
            rpc_response: MCPResponse = self.server_engine.handle_mcp_request(rpc_request)
            
            # 4. Handle Protocol or Schema Execution Errors
            if rpc_response.error:
                return False, {
                    "error_code": rpc_response.error.get("code"),
                    "message": rpc_response.error.get("message"),
                    "details": rpc_response.error.get("details", "No metadata appended.")
                }
            
            # Return verification acknowledgment and the raw structural payload
            return True, rpc_response.result
            
        except Exception as e:
            return False, {"error_code": -32603, "message": f"Internal JSON-RPC transport mutation: {str(e)}"}
