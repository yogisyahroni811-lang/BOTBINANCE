import structlog
from database.supabase_client import supabase
from services.llm_service import llm_engine
import json

logger = structlog.get_logger()

class MistakeAnalyzer:
    def __init__(self):
        pass

    async def compile_analysis(self, trade_data: dict) -> dict:
        """Use LLM to categorize the mistake and generate a lesson."""
        if not llm_engine.client:
            logger.warning("LLM Client unavailable for mistake analysis.")
            return {
                "category": "SYSTEM_ERROR",
                "lesson": "No LLM analysis available",
                "prevention": "Configure OPENAI_API_KEY"
            }
            
        prompt = f"""
        Analyze this losing trade data:
        Trade ID: {trade_data.get('trade_id')}
        Symbol: {trade_data.get('symbol')}
        PNL: {trade_data.get('pnl')}
        Context: {trade_data.get('setup_context')}
        
        Determine the mistake category from these options:
        LATE_ENTRY, MISSED_INVALIDATION, POOR_RISK_REWARD, IMPATIENCE, COUNTER_TREND, FAKE_BREAKOUT, OVERLEVERAGING
        
        Output strict JSON matching:
        {{
            "category": "string from options",
            "what_happened": "Short explanation",
            "what_should_happen": "What the algorithm should have waited for",
            "prevention_tip": "A short, strict rule to add to our RAG memory"
        }}
        """
        
        try:
            response = await llm_engine.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a professional quantitative trading coach correcting a trading algorithm's mistakes."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                response_format={ "type": "json_object" }
            )
            
            content = response.choices[0].message.content
            if not content:
                raise ValueError("Empty response")
            return json.loads(content)
        except Exception as e:
            logger.error("Mistake LLM analysis failed", error=str(e))
            return {
                "category": "UNKNOWN_ERROR",
                "what_happened": str(e),
                "what_should_happen": "Fix system stability",
                "prevention_tip": "Review application logs."
            }

    async def log_mistake(self, trade_id: str, trade_data: dict):
        pnl = trade_data.get("pnl", 0)
        
        # Only log mistakes for losing trades
        if float(pnl) >= 0:
            return
            
        analysis = await self.compile_analysis(trade_data)
        category = analysis.get("category", "UNKNOWN")
        lesson = analysis.get("prevention_tip", "")
        
        # Save to supabase
        if supabase:
            try:
                # We let Supabase sequence provide the id.
                result = supabase.table("mistakes").insert({
                    "trade_id": int(trade_id),
                    "mistake_type": category,
                    "severity": "HIGH" if float(pnl) < -100 else "MEDIUM",
                    "market_context": trade_data.get("setup_context", {}),
                    "what_happened": analysis.get("what_happened", ""),
                    "what_should_happen": analysis.get("what_should_happen", ""),
                    "prevention_tip": lesson,
                }).execute()
                
                if result.data and len(result.data) > 0:
                    inserted_id = result.data[0]["id"]
                    
                    # Compute RAG vector and save it via RAG service
                    from services.rag_service import rag_engine
                    rag_engine.store_mistake_embedding(
                        mistake_id=inserted_id, 
                        document=f"Avoid {category}: {lesson}"
                    )
            except Exception as e:
                logger.error("Failed to save mistake to db", error=str(e))

mistake_analyzer = MistakeAnalyzer()
