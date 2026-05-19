from app.api.v1.patient import CONSENT_PURPOSES


def test_consent_purposes_defined():
    assert "ai_clinical_triage" in CONSENT_PURPOSES
    assert "symptom_assessment" in CONSENT_PURPOSES
