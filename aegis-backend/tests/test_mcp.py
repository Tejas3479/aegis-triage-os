import pytest
from app.domains.mcp.protocol import MCPRequest
from app.domains.mcp.server import SimulatedEHREngine

@pytest.fixture
def ehr_engine():
    return SimulatedEHREngine()

def test_mcp_unauthorized_token(ehr_engine):
    req = MCPRequest(method="resources/read", params={"uri": "ehr://patient/req_8829A/profile"}, id=1, auth_token="wrong_key")
    res = ehr_engine.handle_mcp_request(req)
    assert res.error is not None
    assert res.error["code"] == -32001

def test_mcp_valid_fhir_order(ehr_engine):
    valid_payload = {
        "status": "draft",
        "intent": "proposal",
        "medicationCodeableConcept": {
            "coding": [{"system": "RxNorm", "code": "860952", "display": "Metformin 500mg"}],
            "text": "Metformin therapy"
        },
        "subject": {"reference": "Patient/PID-9923"},
        "dosageInstruction": [{"text": "Take once daily with meals"}]
    }
    req = MCPRequest(
        method="tools/call", 
        params={"name": "stage_clinical_order", "arguments": valid_payload}, 
        id=2, 
        auth_token="aegis_secure_node_alpha_2026"
    )
    res = ehr_engine.handle_mcp_request(req)
    assert res.error is None
    assert res.result["status"] == "STAGED_IN_TRANSACTION_QUEUE"

def test_mcp_invalid_fhir_order(ehr_engine):
    invalid_payload = {"status": "broken_status_flag", "intent": "malformed_order_intent"}
    req = MCPRequest(
        method="tools/call", 
        params={"name": "stage_clinical_order", "arguments": invalid_payload}, 
        id=3, 
        auth_token="aegis_secure_node_alpha_2026"
    )
    res = ehr_engine.handle_mcp_request(req)
    assert res.error is not None
    assert res.error["code"] == -32002
