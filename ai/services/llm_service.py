import structlog
import json
import anthropic
import google.generativeai as genai
from openai import AsyncOpenAI
from config import settings
from .encryption import encryption_service
from models.requests import SetupRequest, AIConfigModel
from models.responses import SignalResponse

logger = structlog.get_logger()

class LLMService:
    def __init__(self):
        # Default client (OpenAI)
        self.default_client = None
        if settings.OPENAI_API_KEY:
            self.default_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def get_client(self, config: AIConfigModel):
        """
        Dynamically initializes the appropriate AI client based on the provided configuration.
        """
        # Decrypt API Key if it looks like it's encrypted (base64)
        api_key = encryption_service.decrypt(config.api_key)
        
        # UNIVERSAL ADAPTER: If custom endpoint is provided, use OpenAI-compatible client
        if config.base_url:
            logger.info("Using universal custom endpoint adapter", provider=config.provider, url=config.base_url)
            return AsyncOpenAI(api_key=api_key, base_url=config.base_url)

        provider = config.provider.lower()
        
        if provider == "openai" or provider in ["groq", "together", "deepseek", "openrouter", "nvidia"]:
            # These are mostly OpenAI-compatible
            return AsyncOpenAI(api_key=api_key)
            
        elif provider == "anthropic":
            return anthropic.AsyncAnthropic(api_key=api_key)
            
        elif provider == "google":
            genai.configure(api_key=api_key)
            return genai.GenerativeModel(config.model)
            
        return self.default_client

    async def validate_setup(self, request: SetupRequest, rag_context: str) -> SignalResponse:
        config = request.ai_config
        
        # Fallback to local settings if no config provided
        if not config:
            if not self.default_client:
                return self._error_response("AI configuration missing and no default client available.")
            client = self.default_client
            model = "gpt-4o"
            provider = "openai"
            temp = 0.1
        else:
            provider = config.provider.lower()
            model = config.model
            temp = config.temperature
            client = await self.get_client(config)

        if not client:
            return self._error_response(f"Could not initialize client for provider: {provider}")

        try:
            prompt = self._build_prompt(request, rag_context)
            
            # Use Native SDKs ONLY if NO custom endpoint is provided
            if provider == "google" and (not config or not config.base_url):
                # Gemini specialized call
                response = await client.generate_content_async(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=temp,
                        response_mime_type="application/json"
                    )
                )
                content = response.text
            elif provider == "anthropic" and (not config or not config.base_url):
                # Claude specialized call
                response = await client.messages.create(
                    model=model,
                    max_tokens=config.max_tokens if config else 4096,
                    temperature=temp,
                    system="You output only structured JSON. You do not explain yourself outside of the reasoning field.",
                    messages=[{"role": "user", "content": prompt}]
                )
                content = response.content[0].text
            else:
                # Universal OpenAI-compatible call (OpenAI, DeepSeek, Custom Endpoints)
                resp = await client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": "You output only structured JSON. You do not explain yourself outside of the reasoning field."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=temp,
                    response_format={ "type": "json_object" }
                )
                content = resp.choices[0].message.content

            if not content:
                raise ValueError("Empty response from LLM")
                
            parsed = json.loads(content)
            return SignalResponse.model_validate(parsed)
            
        except Exception as e:
            logger.error("LLM validation failed", provider=provider, model=model, error=str(e))
            return self._error_response(f"LLM Error during validation ({provider}): {str(e)}")

    def _build_prompt(self, request: SetupRequest, rag_context: str) -> str:
        return f"""
        You are a strict, disciplined algorithmic trading validation AI (2026 Edition).
        Your task is to validate a potential trading setup based on Elliott Waves and Supply/Demand zones.
        
        Market Data context:
        Symbol: {request.symbol}
        Timeframe: {request.timeframe}
        Wave: {request.wave.dict() if request.wave else 'None'}
        Zone: {request.zone.dict() if request.zone else 'None'}
        
        RAG Memory (Past mistakes to avoid):
        {rag_context}
        
        Output strictly valid JSON.
        {{
            "valid": bool,
            "action": "LONG" | "SHORT" | "WAIT",
            "confidence": int (0 to 100),
            "entry": float or null,
            "stop_loss": float or null,
            "tp1": float or null,
            "tp2": float or null,
            "reasoning": "Technical reasoning max 300 chars",
            "warnings": ["Warning strings"]
        }}
        """

    def _error_response(self, message: str) -> SignalResponse:
        return SignalResponse(
            valid=False, 
            action="WAIT", 
            confidence=0, 
            reasoning=message, 
            warnings=["System Execution Error"]
        )

llm_engine = LLMService()
