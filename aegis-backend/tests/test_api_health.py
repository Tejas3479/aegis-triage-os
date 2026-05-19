from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient

@patch("app.domains.triage.graph_engine.init_graph_engine")
@patch("app.core.checkpointer.init_checkpointer", return_value=object())
@patch("app.security.clinical_auth.bootstrap_clinical_users")
@patch("app.core.database.db_client.connect", new_callable=AsyncMock)
@patch("app.core.database.db_client.disconnect", new_callable=AsyncMock)
@patch("app.core.checkpointer.shutdown_checkpointer")
def test_health_endpoint(
    _shutdown,
    _disconnect,
    _connect,
    _bootstrap,
    _checkpoint,
    _graph,
):
    from app.core.database import db_client
    import app.core.rate_limit as rate_limit
    from app.core.model_router import llm_router
    from app.core.llm_provider import GeminiProvider

    # Mock DB Client table query
    mock_execute = MagicMock()
    mock_execute.execute.return_value = MagicMock()
    mock_limit = MagicMock()
    mock_limit.limit.return_value = mock_execute
    mock_select = MagicMock()
    mock_select.select.return_value = mock_limit
    mock_table = MagicMock()
    mock_table.table.return_value = mock_select

    # Directly override db_client.client
    original_client = db_client.client
    db_client.client = mock_table

    # Mock Redis client
    mock_redis = MagicMock()
    mock_redis.ping.return_value = True
    original_get_redis = rate_limit._get_redis_client
    rate_limit._get_redis_client = lambda: mock_redis

    # Mock Gemini client models.get
    gemini_provider = next((p for p in llm_router.providers if isinstance(p, GeminiProvider)), None)
    original_gemini_client = None
    if gemini_provider:
        original_gemini_client = gemini_provider.client
        mock_gemini = MagicMock()
        mock_gemini.models.get.return_value = True
        gemini_provider.client = mock_gemini

    import main

    try:
        with TestClient(main.app) as client:
            response = client.get("/health")
        
        if response.status_code != 200:
            print("DEBUG HEALTH FAIL RESPONSE:", response.json())
            
        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "operational"
    finally:
        # Restore original states
        db_client.client = original_client
        rate_limit._get_redis_client = original_get_redis
        if gemini_provider and original_gemini_client:
            gemini_provider.client = original_gemini_client
