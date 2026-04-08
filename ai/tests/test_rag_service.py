import pytest
from unittest.mock import patch, MagicMock
from services.rag_service import RAGService

@pytest.fixture
def rag_service():
    return RAGService()

def test_embed_market_context(rag_service):
    embedding = rag_service.embed_market_context("Test market context")
    assert isinstance(embedding, list)
    assert len(embedding) == 384  # size of all-MiniLM-L6-v2

@patch("services.rag_service.supabase")
def test_search_similar_mistakes(mock_supabase, rag_service):
    # Mock supabase rpc execution
    mock_rpc = MagicMock()
    mock_execute = MagicMock()
    mock_execute.data = [
        {"id": 1, "prevention_tip": "Do not trade against trend"}
    ]
    mock_rpc.execute.return_value = mock_execute
    mock_supabase.rpc.return_value = mock_rpc
    
    results = rag_service.search_similar_mistakes([0.1] * 384, top_k=1)
    assert len(results) == 1
    assert results[0]["prevention_tip"] == "Do not trade against trend"
    mock_supabase.rpc.assert_called_once()
