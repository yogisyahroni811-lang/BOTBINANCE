from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Any

class CandleModel(BaseModel):
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    volume: float

class SndZoneModel(BaseModel):
    zone_type: str
    price_high: float
    price_low: float
    grade: str
    test_count: int

class WaveModel(BaseModel):
    current_wave: str
    wave_type: str
    confidence: int

class SetupRequest(BaseModel):
    model_config = ConfigDict(strict=True)

    symbol: str
    timeframe: str
    zone: Optional[SndZoneModel] = None
    wave: Optional[WaveModel] = None
    candles: List[CandleModel]

class TradeResultRequest(BaseModel):
    trade_id: int
    symbol: str
    outcome: str
    pnl: float
    setup_context: Any
