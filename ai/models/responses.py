from pydantic import BaseModel
from typing import Optional, List

class SignalResponse(BaseModel):
    valid: bool
    action: str 
    confidence: int 
    entry: Optional[float] = None
    stop_loss: Optional[float] = None
    tp1: Optional[float] = None
    tp2: Optional[float] = None
    reasoning: str
    warnings: List[str]

class HealthResponse(BaseModel):
    status: str
    service: str
