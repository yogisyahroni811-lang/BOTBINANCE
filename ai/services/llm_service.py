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
        # Format Indicators
        ind = request.indicators
        ind_str = f"RSI: {ind.rsi:.2f}, EMA(20/50/200): {ind.ema_20:.2f}/{ind.ema_50:.2f}/{ind.ema_200:.2f}, MACD: {ind.macd_value:.2f}" if ind else "None"
        
        # Format MTF Context
        mtf_lines = []
        for ctx in request.mtf_context:
            m_ind = ctx.indicators
            m_str = f"- {ctx.timeframe}: Trend {'UP' if (m_ind and m_ind.ema_20 > m_ind.ema_50) else 'DOWN'} (RSI: {m_ind.rsi:.2f if m_ind else '?'})"
            mtf_lines.append(m_str)
        mtf_summary = "\n".join(mtf_lines)

        # Risk settings
        max_pos = request.risk_settings.get("risk_max_open_positions", "3")
        
        return f"""
        You are a highly disciplined, data-driven AI Risk Manager (2026 Pro Edition).
        Your mission is to validate trade setups by cross-referencing short-term signals with long-term trends and historical mistakes.

        ### CORE MARKET CONTEXT
        - Symbol: {request.symbol}
        - Primary Timeframe: {request.timeframe} (Entry Focus)
        - Indicators (Primary): {ind_str}
        - Current Active Signals: 
            * Wave: {request.wave.dict() if request.wave else 'None'}
            * Zone: {request.zone.dict() if request.zone else 'None'}
        
        ### MULTI-TIMEFRAME (MTF) CONTEXT (Confirmation)
        {mtf_summary}

        ### RISK MANAGEMENT LIMITS
        - MAX OPEN POSITIONS: {max_pos}
        - RULE: Do not approve entry if market state across timeframes is highly contradictory.
        
        ### RAG MEMORY (Lessons from the Past)
        {rag_context}
        
        ### MANDATORY JSON OUTPUT FORMAT
        Return ONLY valid JSON. If "valid" is true, the setup MUST be high quality.
        {{
            "valid": bool,
            "action": "LONG" | "SHORT" | "WAIT",
            "confidence": int (0-100),
            "entry": float | null,
            "stop_loss": float | null,
            "tp1": float | null,
            "tp2": float | null,
            "reasoning": "Explain convergence between MTF, Indicators, and RAG context",
            "warnings": ["Potential pitfalls"]
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
