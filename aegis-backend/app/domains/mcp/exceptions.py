from typing import Any, Dict, Optional

class MCPGatewayError(Exception):
    """Base exception for all Model Context Protocol boundary violations."""
    def __init__(self, code: int, message: str, data: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.data = data or {}

    def to_rpc_payload(self, request_id: int) -> dict:
        return {
            "jsonrpc": "2.0",
            "error": {
                "code": self.code,
                "message": self.message,
                "data": self.data
            },
            "id": request_id
        }

class UnauthorizedAgentWriteError(MCPGatewayError):
    def __init__(self, agent_id: str, requested_tool: str):
        super().__init__(
            code=-32001,
            message="Security Exception: Agent lacks execution privileges for write mutations.",
            data={
                "exception_type": "UNAUTHORIZED_AGENT_WRITE",
                "violating_node": agent_id,
                "attempted_action": requested_tool,
                "enforced_policy": "Principle of Least Agency (Read-Only Swarm Threads)"
            }
        )

class FHIRValidationError(MCPGatewayError):
    def __init__(self, validation_errors: list):
        super().__init__(
            code=-32002,
            message="FHIR Schema Violation: Payload does not conform to FHIR R4 standards.",
            data={
                "exception_type": "FHIR_SCHEMA_VIOLATION",
                "validation_errors": validation_errors,
                "remediation": "Correct payload structure and retry."
            }
        )

class ConcurrencyMutationConflictError(MCPGatewayError):
    def __init__(self, current_version: str, provided_version: str):
        super().__init__(
            code=-32003,
            message="EHR State Collision: Mutation rejected due to stale resource tracking tags.",
            data={
                "exception_type": "CONCURRENCY_MUTATION_CONFLICT",
                "active_server_etag": current_version,
                "stale_client_etag": provided_version,
                "remediation": "Fetch active clinical resource stream and re-evaluate diagnostic state."
            }
        )

class FailsafeBlockError(MCPGatewayError):
    def __init__(self, action: str, reason: str):
        super().__init__(
            code=-32004,
            message="Deterministic Failsafe Block: Action blocked by safety guardrails.",
            data={
                "exception_type": "DETERMINISTIC_FAILSAFE_BLOCK",
                "blocked_action": action,
                "reason": reason,
                "remediation": "Consult provider for manual override."
            }
        )
