import structlog
from database.supabase_client import supabase

logger = structlog.get_logger()

class MistakeAnalyzer:
    def __init__(self):
        pass

    async def categorize_mistake(self, trade_data: dict) -> str:
        pnl = trade_data.get("pnl", 0)
        from pydantic import ValidationError
        if pnl < 0:
            return "NEGATIVE_PNL"
        return "SUCCESS"

    async def generate_lesson(self, category: str) -> str:
        lessons = {
            "NEGATIVE_PNL": "Check validity of support/resistance before entering.",
        }
        return lessons.get(category, "Always manage your risk.")

    async def log_mistake(self, trade_id: str, trade_data: dict):
        category = await self.categorize_mistake(trade_data)
        if category == "SUCCESS":
            return
            
        lesson = await self.generate_lesson(category)
        
        # Trigger RAG update
        from services.rag_service import rag_engine
        context_doc = f"Trade {trade_id} failed due to {category}. {lesson}"
        rag_engine.store_mistake_embedding(str(trade_id), context_doc, {"category": category})
        
        # Save to supabase
        if supabase:
            try:
                supabase.table("mistakes").insert({
                    "trade_id": trade_id,
                    "category": category,
                    "lesson": lesson,
                }).execute()
            except Exception as e:
                logger.error("Failed to save mistake to db", error=str(e))

mistake_analyzer = MistakeAnalyzer()
