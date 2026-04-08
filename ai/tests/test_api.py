import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "OK"

def test_analyze_setup_invalid_body():
    response = client.post("/api/v1/analyze", json={"foo": "bar"})
    assert response.status_code == 422 # Pydantic validation error

def test_report_trade():
    payload = {
        "trade_id": 12345,
        "symbol": "BTCUSDT",
        "outcome": "LOSS",
        "pnl": -100.5,
        "setup_context": {}
    }
    response = client.post("/api/v1/report-trade", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "reported"

def test_get_mistakes():
    response = client.get("/api/v1/mistakes")
    assert response.status_code == 200
    assert "mistakes" in response.json()
