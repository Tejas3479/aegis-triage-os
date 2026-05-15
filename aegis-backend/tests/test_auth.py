import pytest
from fastapi import HTTPException

from app.core.auth import User, assert_session_access, create_access_token
from app.core.rate_limit import check_rate_limit
from jose import jwt
from app.core.config import settings


def test_patient_session_access_denied_for_wrong_session():
    user = User(username="patient_x", role="PATIENT", session_id="aaa")
    with pytest.raises(HTTPException) as exc:
        assert_session_access(user, "bbb")
    assert exc.value.status_code == 403


def test_doctor_can_access_any_session():
    user = User(username="doc", role="DOCTOR", session_id=None)
    assert_session_access(user, "any-session-id")


def test_jwt_contains_session_id_for_patient():
    token = create_access_token(
        {"sub": "patient_1", "role": "PATIENT", "session_id": "sess-99"},
    )
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload["session_id"] == "sess-99"
    assert payload["role"] == "PATIENT"


def test_rate_limit_blocks_excess_requests():
    key = "test-rate-key"
    for _ in range(5):
        check_rate_limit(key, max_requests=5, window_seconds=60)
    with pytest.raises(HTTPException) as exc:
        check_rate_limit(key, max_requests=5, window_seconds=60)
    assert exc.value.status_code == 429
