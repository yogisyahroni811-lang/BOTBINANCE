-- Migration 002: Trading and Learning Tables
-- Note: 'pgvector' must be enabled for this migration
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE trades (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    symbol_id BIGINT NOT NULL REFERENCES symbols(id) ON DELETE CASCADE,
    entry_timeframe VARCHAR(5) NOT NULL,
    entry_time TIMESTAMPTZ NOT NULL,
    entry_price DECIMAL(18, 8) NOT NULL,
    direction VARCHAR(5) NOT NULL, -- 'LONG' or 'SHORT'
    size_usd DECIMAL(18, 2) NOT NULL,
    leverage INT NOT NULL DEFAULT 1,
    setup_type VARCHAR(50) NOT NULL,
    grade_at_entry VARCHAR(5),
    exit_time TIMESTAMPTZ,
    exit_price DECIMAL(18, 8),
    exit_reason VARCHAR(50),
    pnl_usd DECIMAL(18, 2),
    pnl_pct DECIMAL(10, 4),
    outcome VARCHAR(10), -- 'WIN', 'LOSS', 'BREAKEVEN'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Partial index to quickly query open trades
CREATE INDEX idx_trades_open ON trades(symbol_id, direction) WHERE outcome IS NULL;
CREATE INDEX idx_trades_outcome ON trades(outcome);

CREATE TRIGGER update_trades_updated_at
BEFORE UPDATE ON trades
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE mistakes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trade_id BIGINT NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    mistake_type VARCHAR(100) NOT NULL,
    severity VARCHAR(10) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    market_context JSONB NOT NULL DEFAULT '{}',
    what_happened TEXT NOT NULL,
    what_should_happen TEXT NOT NULL,
    prevention_tip TEXT NOT NULL,
    embedding VECTOR(768),
    similar_loss_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Using HNSW index for fast approximate nearest neighbor search
CREATE INDEX idx_mistakes_embedding ON mistakes USING hnsw (embedding vector_cosine_ops);
