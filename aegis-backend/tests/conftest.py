import os
import sys
from pathlib import Path
from unittest.mock import MagicMock

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-pytest-only")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:3000")
os.environ.setdefault("STT_PROVIDER", "local")
os.environ.setdefault("HOSPITAL_PROVISIONING_CODE", "TEST-HOSPITAL-CODE")
os.environ.setdefault("VOSK_MODEL_PATH", "")


@pytest.fixture(autouse=True)
def mock_supabase_client(monkeypatch):
    """Prevent tests from requiring a live Supabase instance."""
    mock_client = MagicMock()
    mock_client.table.return_value.select.return_value.limit.return_value.execute.return_value = MagicMock(
        data=[]
    )
    mock_client.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[{}])
    mock_client.table.return_value.upsert.return_value.execute.return_value = MagicMock(data=[{}])
    mock_client.auth.sign_in_with_password.side_effect = Exception("not configured in tests")

    from app.services import database

    database.db_client.client = mock_client
    yield mock_client
    database.db_client.client = None
