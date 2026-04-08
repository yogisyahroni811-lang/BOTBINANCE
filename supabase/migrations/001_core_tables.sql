-- Migration 001: Core Tables

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to automatically update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TABLE symbols (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    priority INT NOT NULL DEFAULT 1,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_symbols_is_active ON symbols(is_active);

CREATE TABLE candles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    symbol_id BIGINT NOT NULL REFERENCES symbols(id) ON DELETE CASCADE,
    timeframe VARCHAR(5) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    o DECIMAL(18, 8) NOT NULL,
    h DECIMAL(18, 8) NOT NULL,
    l DECIMAL(18, 8) NOT NULL,
    c DECIMAL(18, 8) NOT NULL,
    v DECIMAL(18, 8) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (symbol_id, timeframe, timestamp)
);
CREATE INDEX idx_candles_symbol_timeframe ON candles(symbol_id, timeframe, timestamp DESC);

CREATE TABLE snd_zones (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    symbol_id BIGINT NOT NULL REFERENCES symbols(id) ON DELETE CASCADE,
    timeframe VARCHAR(5) NOT NULL,
    zone_type VARCHAR(10) NOT NULL, -- 'DEMAND' or 'SUPPLY'
    price_high DECIMAL(18, 8) NOT NULL,
    price_low DECIMAL(18, 8) NOT NULL,
    grade VARCHAR(5) NOT NULL DEFAULT 'C', -- 'A+', 'A', 'B', 'C'
    test_count INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_snd_active_zones ON snd_zones(symbol_id, timeframe, is_active, zone_type);

CREATE TRIGGER update_snd_zones_updated_at
BEFORE UPDATE ON snd_zones
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE elliott_waves (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    symbol_id BIGINT NOT NULL REFERENCES symbols(id) ON DELETE CASCADE,
    timeframe VARCHAR(5) NOT NULL,
    current_wave VARCHAR(5) NOT NULL, -- 'I', 'II', 'A', 'B'
    wave_type VARCHAR(10) NOT NULL, -- 'MOTIVE', 'CORRECT'
    invalidation_price DECIMAL(18, 8),
    confidence DECIMAL(5, 2) NOT NULL DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_elliott_waves_lookup ON elliott_waves(symbol_id, timeframe, created_at DESC);
