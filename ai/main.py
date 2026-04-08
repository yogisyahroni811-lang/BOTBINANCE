import structlog
from fastapi import FastAPI
from config import settings
from routers import trading

logger = structlog.get_logger()

app = FastAPI(title="BotBinance AI Service")

app.include_router(trading.router)

@app.get("/health")
async def health_check():
    return {"status": "OK", "service": "AI Engine"}

@app.on_event("startup")
async def startup_event():
    logger.info("AI Service started", port=settings.PORT)
