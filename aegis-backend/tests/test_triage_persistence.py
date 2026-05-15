from app.models.schemas import CareLevel
from app.services.triage_persistence import (
    build_triage_response,
    normalize_care_level,
    normalize_risk_score,
    analysis_to_dict,
)


def test_normalize_care_level_invalid_defaults_to_clinic():
    assert normalize_care_level("UNKNOWN") == CareLevel.CLINIC_VISIT.value
    assert normalize_care_level(CareLevel.EMERGENCY_ROOM) == "EMERGENCY_ROOM"


def test_normalize_risk_score_caps_at_ten():
    assert normalize_risk_score(100) == 10
    assert normalize_risk_score(-5) == 0


def test_build_triage_response_shape():
    result = {
        "analysis": {
            "care_level": "HOME_CARE",
            "guidance_notes": "Rest and hydrate.",
            "extracted_symptoms": ["fever"],
            "risk_score": 3,
        },
        "telemedicine_url": None,
    }
    payload = build_triage_response("sess-1", result)
    assert payload["session_id"] == "sess-1"
    assert payload["care_level"] == "HOME_CARE"
    assert payload["guidance_notes"] == "Rest and hydrate."
    assert payload["extracted_symptoms"] == ["fever"]


def test_analysis_to_dict_from_object():
    class FakeAnalysis:
        def model_dump(self):
            return {"care_level": "CLINIC_VISIT"}

    assert analysis_to_dict(FakeAnalysis())["care_level"] == "CLINIC_VISIT"
