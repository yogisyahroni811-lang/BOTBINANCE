-- Migration 005: RAG functions for pgvector similarity search
CREATE OR REPLACE FUNCTION match_mistakes (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id BIGINT,
  trade_id BIGINT,
  mistake_type VARCHAR(100),
  severity VARCHAR(10),
  market_context JSONB,
  what_happened TEXT,
  what_should_happen TEXT,
  prevention_tip TEXT,
  similar_loss_count INT,
  similarity float
)
LANGUAGE sql
AS $$
  SELECT
    id,
    trade_id,
    mistake_type,
    severity,
    market_context,
    what_happened,
    what_should_happen,
    prevention_tip,
    similar_loss_count,
    1 - (mistakes.embedding <=> query_embedding) as similarity
  FROM mistakes
  WHERE 1 - (mistakes.embedding <=> query_embedding) > match_threshold
  ORDER BY mistakes.embedding <=> query_embedding
  LIMIT match_count;
$$;
