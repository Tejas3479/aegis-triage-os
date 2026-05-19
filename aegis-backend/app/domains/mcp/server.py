from typing import Dict, Any
import os
import logging
from app.domains.mcp.protocol import MCPRequest, MCPResponse, FHIRMedicationRequest

logger = logging.getLogger("aegis_core")
from app.domains.mcp.exceptions import UnauthorizedAgentWriteError, ConcurrencyMutationConflictError

class SimulatedEHREngine:
    def __init__(self):
        # Master validation key matching our internal infrastructure layout
        self._VALID_BEARER_TOKEN = os.getenv("MCP_AUTH_TOKEN")
        if not self._VALID_BEARER_TOKEN:
            logger.warning("MCP_AUTH_TOKEN not set! Using default for development.")
            self._VALID_BEARER_TOKEN = "aegis_secure_node_alpha_2026"
        
        # Stateful, mock database reflecting exact state tracking requirements
        self._mock_ehr_db = {
            "req_8829A": {
                "patient_id": "PID-9923",
                "name": "John Doe",
                "age": 45,
                "known_allergies": [{"name": "Penicillin", "code": "7980", "code_system": "RxNorm"}],
                "current_meds": [{"name": "Metformin 500mg", "code": "860952", "code_system": "RxNorm"}],
                "_version_id": "1"  # Initial internal ETag
            }
        }

    def handle_mcp_request(self, request: MCPRequest) -> MCPResponse:
        # Upgrade 1: Enforce Strict Bearer Authorization Check
        if not request.auth_token or request.auth_token != self._VALID_BEARER_TOKEN:
            error = UnauthorizedAgentWriteError(
                agent_id=request.params.get("node_id", "unknown_node"),
                requested_tool=request.params.get("name", "unknown_tool")
            )
            # Construct dict matching to_rpc_payload!
            payload = error.to_rpc_payload(request.id)
            return MCPResponse(
                jsonrpc=payload["jsonrpc"],
                error=payload["error"],
                id=payload["id"]
            )

        if request.method == "resources/read":
            return self._handle_resource_read(request)
        elif request.method == "tools/call":
            return self._handle_tool_call(request)
            
        return MCPResponse(error={"code": -32601, "message": "Method not found."}, id=request.id)

    def _handle_resource_read(self, request: MCPRequest) -> MCPResponse:
        uri = request.params.get("uri", "")
        # Routing signature matches: ehr://patient/{encounter_id}/profile
        if "profile" in uri:
            try:
                encounter_id = uri.split("/")[-2]
            except IndexError:
                return MCPResponse(error={"code": -32602, "message": "Invalid Resource URI formatting."}, id=request.id)
                
            record = self._mock_ehr_db.get(encounter_id)
            if not record:
                return MCPResponse(error={"code": -32602, "message": f"Encounter {encounter_id} not found."}, id=request.id)
            
            # Concurrency Version Control Integration (Read)
            client_etag = request.params.get("if_none_match")
            if client_etag and client_etag == record["_version_id"]:
                return MCPResponse(result={"status": 304, "message": "Resource Not Modified"}, id=request.id)
                
            return MCPResponse(
                result={
                    "status": 200,
                    "content": {k: v for k, v in record.items() if not k.startswith("_")},
                    "etag": record["_version_id"]
                },
                id=request.id
            )
        return MCPResponse(error={"code": -32602, "message": "Target resource namespace unknown."}, id=request.id)

    def _handle_tool_call(self, request: MCPRequest) -> MCPResponse:
        tool_name = request.params.get("name")
        arguments = request.params.get("arguments", {})
        
        if tool_name == "stage_clinical_order":
            # Concurrency Version Control Integration (Write)
            client_etag = request.params.get("etag") or arguments.get("etag")
            record = self._mock_ehr_db.get("req_8829A") # Hardcoded for simulation
            
            if client_etag and client_etag != record["_version_id"]:
                error = ConcurrencyMutationConflictError(
                    current_version=record["_version_id"],
                    provided_version=client_etag
                )
                payload = error.to_rpc_payload(request.id)
                return MCPResponse(
                    jsonrpc=payload["jsonrpc"],
                    error=payload["error"],
                    id=payload["id"]
                )
                
            # Hardened FHIR R4 Schema Validation Enforcement
            try:
                fhir_order = FHIRMedicationRequest(**arguments)
                return MCPResponse(
                    result={
                        "status": "STAGED_IN_TRANSACTION_QUEUE",
                        "resource_id": f"medreq_{request.id}",
                        "validated_payload": fhir_order.model_dump()
                    },
                    id=request.id
                )
            except Exception as e:
                return MCPResponse(
                    error={
                        "code": -32002, 
                        "message": "FHIR Schema Violation: Payload structure fails FHIR R4 MedicationRequest standard.",
                        "details": str(e)
                    },
                    id=request.id
                )
                
        return MCPResponse(error={"code": -32601, "message": f"Tool '{tool_name}' not supported by MCP Gateway."}, id=request.id)
