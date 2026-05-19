from typing import Literal, Dict, Any, Optional, List
from pydantic import BaseModel, Field

# --- FHIR R4 Miniature Validation Schemas ---
class Coding(BaseModel):
    system: str  # e.g., "http://www.nlm.nih.gov/research/umls/rxnorm"
    code: str    # RxCUI Identifier
    display: str

class CodeableConcept(BaseModel):
    coding: List[Coding]
    text: str

class Reference(BaseModel):
    reference: str  # e.g., "Patient/PID-9923"

class DosageInstruction(BaseModel):
    text: str
    timing: Dict[str, Any] = Field(default_factory=dict)
    route: Optional[Dict[str, Any]] = None

class FHIRMedicationRequest(BaseModel):
    resourceType: Literal["MedicationRequest"] = "MedicationRequest"
    status: Literal["active", "on-hold", "cancelled", "completed", "entered-in-error", "draft"]
    intent: Literal["proposal", "plan", "order", "original-order", "reflex-order", "filler-order"]
    medicationCodeableConcept: CodeableConcept
    subject: Reference
    dosageInstruction: List[DosageInstruction]

# --- Core MCP JSON-RPC 2.0 Schemas ---
class MCPRequest(BaseModel):
    jsonrpc: Literal["2.0"] = "2.0"
    method: Literal["tools/call", "resources/read"]
    params: Dict[str, Any] = Field(..., description="Must include 'uri' for resource reads or 'name' and 'arguments' for tool calls.")
    id: int
    auth_token: Optional[str] = Field(None, description="Simulated Bearer token for cross-service authentication.")

class MCPResponse(BaseModel):
    jsonrpc: Literal["2.0"] = "2.0"
    result: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None
    id: int
