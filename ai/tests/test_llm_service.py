import pytest
from unittest.mock import AsyncMock, patch
from services.llm_service import LLMService

@pytest.mark.asyncio
async def test_llm_fallback_no_client():
    from config import settings
    # Ensure client is None
    engine = LLMService()
    engine.client = None
    
    from models.requests import SetupRequest
    req = SetupRequest(
        symbol="BTCUSDT",
        timeframe="15m",
        candles=[]
    )
    result = await engine.validate_setup(req, "No context")
    
    assert result.valid is False
    assert result.action == "WAIT"

@pytest.mark.asyncio
@patch("services.llm_service.AsyncOpenAI")
async def test_llm_valid_json_response(mock_openai):
    engine = LLMService()
    
    mock_client = AsyncMock()
    mock_response = AsyncMock()
    mock_response.choices = [
        AsyncMock(message=AsyncMock(content='{"valid": true, "action": "LONG", "confidence": 85, "entry": 50000.0, "reasoning": "Looks good", "warnings": []}'))
    ]
    mock_client.chat.completions.create.return_value = mock_response
    engine.client = mock_client
    
    from models.requests import SetupRequest
    req = SetupRequest(
        symbol="BTCUSDT",
        timeframe="15m",
        candles=[]
    )
    
    result = await engine.validate_setup(req, "RAG Context: Watch out for fakeouts")
    assert result.valid is True
    assert result.action == "LONG"
    assert result.confidence == 85
    assert result.entry == 50000.0
