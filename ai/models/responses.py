from pydantic import BaseModel, Field
from typing import Optional, List, Literal

class SignalResponse(BaseModel):
    valid: bool
    action: Literal["LONG", "SHORT", "WAIT"]
    confidence: int = Field(ge=0, le=100)
    entry: Optional[float] = None
    stop_loss: Optional[float] = None
    tp1: Optional[float] = None
    tp2: Optional[float] = None
    reasoning: str
    warnings: List[str]

class HealthResponse(BaseModel):
    status: str
    service: str
