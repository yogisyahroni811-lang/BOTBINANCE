import structlog
from fastapi import APIRouter
from models.requests import SetupRequest, TradeResultRequest
from models.responses import SignalResponse
from services.rag_service import rag_engine
from services.llm_service import llm_engine
from services.mistake_analyzer import mistake_analyzer

logger = structlog.get_logger()
router = APIRouter(prefix="/api/v1")

@router.post("/analyze", response_model=SignalResponse)
async def analyze_setup(request: SetupRequest):
    # Context retrieval
    context_text = f"Symbol: {request.symbol}, TF: {request.timeframe}"
    if request.zone:
        context_text += f", Zone: {request.zone.zone_type} {request.zone.grade}"
    if request.wave:
        context_text += f", Wave: {request.wave.current_wave}"
        
    query_embedding = rag_engine.embed_market_context(context_text)
    similar_mistakes = rag_engine.search_similar_mistakes(query_embedding, top_k=3)
    
    rag_context = ". ".join([m["document"] for m in similar_mistakes]) if similar_mistakes else "No similar mistakes found."
    
    # Analyze with LLM
    signal = await llm_engine.validate_setup(request, rag_context)
    return signal

@router.post("/report-trade")
async def report_trade(request: TradeResultRequest):
    await mistake_analyzer.log_mistake(str(request.trade_id), request.model_dump())
    return {"status": "reported", "trade_id": request.trade_id}

@router.get("/mistakes")
async def get_mistakes(limit: int = 10):
    return {"mistakes": rag_engine.mistakes_collection.count()}

@router.get("/patterns")
async def get_patterns(symbol: str = "BTCUSDT", tf: str = "1H"):
    return {"patterns": rag_engine.patterns_collection.count()}
