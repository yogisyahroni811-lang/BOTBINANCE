import structlog
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any
from database.supabase_client import supabase

logger = structlog.get_logger()

class RAGService:
    def __init__(self):
        # Initialize sentence transformer locally for embedding generation
        # Using a small, fast model suitable for semantic search
        self.encoder = SentenceTransformer("all-MiniLM-L6-v2")

    def embed_market_context(self, context_text: str) -> List[float]:
        """Embed text context into vector."""
        embedding = self.encoder.encode(context_text)
        return embedding.tolist()

    def search_similar_mistakes(self, query_embedding: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
        """Search Supabase using pgvector RPC match_mistakes."""
        if not supabase:
            logger.warning("Supabase not configured, skipping RAG retrieval.")
            return []
            
        try:
            response = supabase.rpc(
                "match_mistakes", 
                {
                    "query_embedding": query_embedding,
                    "match_threshold": 0.5, # 50% similarity threshold
                    "match_count": top_k
                }
            ).execute()
            
            return response.data if response.data else []
        except Exception as e:
            logger.error("Error retrieving similar mistakes from Supabase", error=str(e))
            return []

    def store_mistake_embedding(self, mistake_id: int, document: str):
        """Update an existing mistake record with its vector embedding."""
        if not supabase:
            return
            
        try:
            embedding = self.embed_market_context(document)
            supabase.table("mistakes").update({"embedding": embedding}).eq("id", mistake_id).execute()
            logger.info("Stored embedding for mistake", mistake_id=mistake_id)
        except Exception as e:
            logger.error("Error storing mistake embedding", error=str(e))

rag_engine = RAGService()
