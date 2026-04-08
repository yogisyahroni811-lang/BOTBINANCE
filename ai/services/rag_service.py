import structlog
import chromadb
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any

logger = structlog.get_logger()

class RAGService:
    def __init__(self):
        # Initialize local persistent ChromaDB
        self.chroma_client = chromadb.PersistentClient(path="./data/chromadb")
        self.mistakes_collection = self.chroma_client.get_or_create_collection(name="mistakes")
        self.patterns_collection = self.chroma_client.get_or_create_collection(name="successful_patterns")
        
        # Initialize sentence transformer locally
        self.encoder = SentenceTransformer("all-MiniLM-L6-v2")

    def embed_market_context(self, context_text: str) -> List[float]:
        embedding = self.encoder.encode(context_text)
        return embedding.tolist()

    def search_similar_mistakes(self, query_embedding: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
        if self.mistakes_collection.count() == 0:
            return []
            
        results = self.mistakes_collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k
        )
        if not results or "documents" not in results or not results["documents"][0]:
            return []
            
        return [{"document": doc, "metadata": meta} for doc, meta in zip(results["documents"][0], results["metadatas"][0])]

    def store_mistake_embedding(self, trade_id: str, document: str, metadata: dict):
        embedding = self.embed_market_context(document)
        self.mistakes_collection.add(
            embeddings=[embedding],
            documents=[document],
            metadatas=[metadata],
            ids=[str(trade_id)]
        )

# singleton
rag_engine = RAGService()
