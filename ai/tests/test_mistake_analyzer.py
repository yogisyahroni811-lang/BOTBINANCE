import pytest
from unittest.mock import AsyncMock, patch
from services.mistake_analyzer import MistakeAnalyzer

@pytest.mark.asyncio
@patch("services.mistake_analyzer.llm_engine")
async def test_compile_analysis(mock_llm_engine):
    analyzer = MistakeAnalyzer()
    
    mock_client = AsyncMock()
    mock_response = AsyncMock()
    mock_response.choices = [
        AsyncMock(message=AsyncMock(content='{"category": "IMPATIENCE", "what_happened": "Entered too early", "what_should_happen": "Wait for confirmation", "prevention_tip": "Check RSI divergence"}'))
    ]
    mock_client.chat.completions.create.return_value = mock_response
    mock_llm_engine.client = mock_client
    
    trade_data = {
        "trade_id": "123",
        "symbol": "BTCUSDT",
        "pnl": -50.0,
        "setup_context": {}
    }
    
    analysis = await analyzer.compile_analysis(trade_data)
    assert analysis["category"] == "IMPATIENCE"
    assert analysis["prevention_tip"] == "Check RSI divergence"

@pytest.mark.asyncio
async def test_log_mistake_positive_pnl():
    analyzer = MistakeAnalyzer()
    trade_data = {
        "trade_id": "123",
        "pnl": 50.0 # Positive PNL should not trigger mistake logs
    }
    # It shouldn't crash or do anything
    await analyzer.log_mistake("123", trade_data)
