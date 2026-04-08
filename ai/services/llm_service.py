import structlog
from openai import AsyncOpenAI
from config import settings
from models.requests import SetupRequest
from models.responses import SignalResponse
import json

logger = structlog.get_logger()

class LLMService:
    def __init__(self):
        if settings.OPENAI_API_KEY:
            self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        else:
            self.client = None
            logger.warning("OpenAI API key not configured")

    async def validate_setup(self, request: SetupRequest, rag_context: str) -> SignalResponse:
        if not self.client:
            return SignalResponse(
                valid=False, 
                action="WAIT", 
                confidence=0, 
                reasoning="No LLM configured. Skipping validation.", 
                warnings=["LLM client unavailable"]
            )

        try:
            # Construct strict prompt
            prompt = f"""
            You are a strict, disciplined algorithmic trading validation AI.
            Your task is to validate a potential trading setup based on Elliott Waves and Supply/Demand zones.
            
            Market Data context:
            Symbol: {request.symbol}
            Timeframe: {request.timeframe}
            Candles (latest): {len(request.candles)} bars provided.
            Zone: {request.zone.dict() if request.zone else 'None'}
            Wave: {request.wave.dict() if request.wave else 'None'}
            
            RAG Memory (Past mistakes to avoid):
            {rag_context}
            
            Output strictly valid JSON with NO markdown format wrapping.
            The JSON must perfectly match this schema:
            {{
                "valid": bool,
                "action": "LONG" | "SHORT" | "WAIT",
                "confidence": int (0 to 100),
                "entry": float or null,
                "stop_loss": float or null,
                "tp1": float or null,
                "tp2": float or null,
                "reasoning": "Detailed technical reasoning string max 300 chars",
                "warnings": ["Array of warning strings if any"]
            }}
            """

            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You output only structured JSON. You do not explain yourself outside of the reasoning field."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                response_format={ "type": "json_object" }
            )
            
            content = response.choices[0].message.content
            if not content:
                raise ValueError("Empty response from LLM")
                
            parsed = json.loads(content)
            
            # Use Pydantic to validate the dict strictly
            signal = SignalResponse.model_validate(parsed)
            return signal
            
        except Exception as e:
            logger.error("LLM validation failed", error=str(e))
            return SignalResponse(
                valid=False, 
                action="WAIT", 
                confidence=0, 
                reasoning=f"LLM Error during validation: {str(e)}", 
                warnings=["System Execution Error"]
            )

llm_engine = LLMService()
