from unittest.mock import MagicMock, patch

import pytest

from app.services.clinical_auth import authenticate_clinical_user, clinical_email


def test_clinical_email_format():
    assert clinical_email("Doctor_Smith") == "doctor_smith@clinical.aegis.local"


def test_authenticate_from_table_success(mock_supabase_client):
    mock_supabase_client.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(
        data=[
            {
                "username": "doctor_smith",
                "role": "DOCTOR",
                "password_hash": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # "secret"
                "auth_user_id": None,
                "is_active": True,
            }
        ]
    )

    with patch("app.services.clinical_auth._authenticate_supabase", return_value=None), patch(
        "app.services.clinical_auth.pwd_context.verify", return_value=True
    ):
        user = authenticate_clinical_user("doctor_smith", "secret")
    assert user is not None
    assert user["role"] == "DOCTOR"


def test_authenticate_unknown_user(mock_supabase_client):
    mock_supabase_client.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(
        data=[]
    )
    with patch("app.services.clinical_auth._authenticate_supabase", return_value=None):
        assert authenticate_clinical_user("nobody", "pass") is None
