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
            # Fallback logic if no API key
            return SignalResponse(
                valid=False, 
                action="WAIT", 
                confidence=0, 
                reasoning="No LLM configured", 
                warnings=["LLM client unavailable"]
            )

        try:
            # Prepare prompt
            prompt = f"""
            Context: {rag_context}
            Market: {request.symbol} {request.timeframe}
            
            Task: Validate trading setup based on Elliott waves and SND.
            Please return only JSON adhering strictly to:
            {{"valid": bool, "action": "LONG"|"SHORT"|"WAIT", "confidence": int, "entry": float|null, "stop_loss": float|null, "tp1": float|null, "tp2": float|null, "reasoning": "string", "warnings": ["w1"]}}
            """

            response = await self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are a disciplined algorithmic trading AI."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                response_format={ "type": "json_object" }
            )
            
            content = response.choices[0].message.content
            parsed = json.loads(content)
            
            return SignalResponse(**parsed)
            
        except Exception as e:
            logger.error("LLM validation failed", error=str(e))
            return SignalResponse(
                valid=False, 
                action="WAIT", 
                confidence=0, 
                reasoning=f"LLM Error: {str(e)}", 
                warnings=["System Error"]
            )

llm_engine = LLMService()
