from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient


@patch("app.services.graph_engine.init_graph_engine")
@patch("app.services.checkpointer.init_checkpointer", return_value=object())
@patch("app.services.clinical_auth.bootstrap_clinical_users")
@patch("app.services.database.db_client.connect", new_callable=AsyncMock)
@patch("app.services.database.db_client.disconnect", new_callable=AsyncMock)
@patch("app.services.checkpointer.shutdown_checkpointer")
def test_health_endpoint(
    _shutdown,
    _disconnect,
    _connect,
    _bootstrap,
    _checkpoint,
    _graph,
):
    import main

    with TestClient(main.app) as client:
        response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "operational"
