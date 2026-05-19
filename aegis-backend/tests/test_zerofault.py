from app.domains.triage.graph_engine import worker_pharmacology_node
from app.models.states import CouncilDeliberation, DrugProposal, MedicalEntity
from pydantic import ValidationError
import pytest
import asyncio

@pytest.mark.asyncio
async def test_allergy_cross_sensitivity():
    # Setup state
    state = {
        "patient_context": {"known_allergies": [{"name": "Penicillin", "code": "7980"}]},
        "council_deliberation": CouncilDeliberation(
            proposed_orders=[
                DrugProposal(
                    medication=MedicalEntity(name="Amoxicillin", code_system="RxNorm", code="723", confidence_score=0.9),
                    dosage="500mg",
                    frequency="TID",
                    evidence_citation="Patient reports pain."
                )
            ]
        ),
        "executed_steps": set(),
        "agent_logs": []
    }
    
    # Run node
    result = await worker_pharmacology_node(state)
    
    # Assertions
    deliberation = result["council_deliberation"]
    assert deliberation.emergency_override == True
    assert any("Allergy conflict detected" in flag for flag in deliberation.red_team_flags)

def test_unmapped_medical_entity():
    with pytest.raises(ValidationError):
        # Invalid code system literal
        MedicalEntity(name="Unknown", code_system="INVALID", code="123", confidence_score=0.9)

@pytest.mark.asyncio
async def test_missing_citation_enforcement():
    # Setup state with an order missing citation
    state = {
        "patient_context": {},
        "council_deliberation": CouncilDeliberation(
            proposed_orders=[
                DrugProposal(
                    medication=MedicalEntity(name="Amoxicillin", code_system="RxNorm", code="723", confidence_score=0.9),
                    dosage="500mg",
                    frequency="TID",
                    evidence_citation="" # Missing citation!
                )
            ]
        ),
        "executed_steps": set(),
        "agent_logs": []
    }
    
    # Run node
    result = await worker_pharmacology_node(state)
    
    # Assertions
    deliberation = result["council_deliberation"]
    # The proposal should be dropped!
    assert len(deliberation.proposed_orders) == 0

@pytest.mark.asyncio
async def test_physical_exam_attestation_gate():
    from app.models.states import PhysicalExamAttestation
    
    # Setup state with an unverified normal exam
    state = {
        "patient_context": {},
        "physical_exam": [
            PhysicalExamAttestation(system="Cardiovascular", finding="Normal", explicitly_verified=False, raw_audio_timestamp=None),
            PhysicalExamAttestation(system="Respiratory", finding="Wheezing", explicitly_verified=False, raw_audio_timestamp=None) # Abnormal!
        ],
        "council_deliberation": CouncilDeliberation(),
        "executed_steps": set(),
        "agent_logs": []
    }
    
    from app.domains.triage.graph_engine import worker_diagnostician_node
    result = await worker_diagnostician_node(state)
    
    # Assertions
    valid_exam = result["physical_exam"]
    # The normal one should be purged, the abnormal one should remain!
    assert len(valid_exam) == 1
    assert valid_exam[0].system == "Respiratory"

@pytest.mark.asyncio
async def test_temporal_node():
    from app.domains.triage.graph_engine import worker_temporal_node
    
    # Setup state
    state = {
        "raw_user_input": "I had a fever 3 days ago and a rash today.",
        "council_deliberation": CouncilDeliberation(
            diagnostic_proposals=[
                MedicalEntity(name="Fever", code_system="SNOMED-CT", code="386661006", confidence_score=0.9),
                MedicalEntity(name="Rash", code_system="SNOMED-CT", code="271757001", confidence_score=0.9)
            ]
        ),
        "executed_steps": set(),
        "agent_logs": []
    }
    
    # Run node
    result = await worker_temporal_node(state)
    
    # Assertions
    deliberation = result["council_deliberation"]
    assert isinstance(deliberation.temporal_matrix, list)

@pytest.mark.asyncio
async def test_billing_node():
    from app.domains.triage.graph_engine import worker_billing_node
    
    # Setup state
    state = {
        "raw_user_input": "I have a fracture in my arm.",
        "final_analysis": {"diagnosis": "Fracture of arm"},
        "council_deliberation": CouncilDeliberation(),
        "executed_steps": set(),
        "agent_logs": []
    }
    
    # Run node
    result = await worker_billing_node(state)
    
    # Assertions
    deliberation = result["council_deliberation"]
    assert "icd10_codes" in deliberation.billing_codes
    assert "cpt_codes" in deliberation.billing_codes
