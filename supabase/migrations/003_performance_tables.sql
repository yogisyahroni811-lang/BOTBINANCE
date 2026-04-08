-- Migration 003: Performance and Heartbeat monitoring

CREATE TABLE daily_performance (
    date DATE PRIMARY KEY,
    starting_equity DECIMAL(18, 2) NOT NULL,
    ending_equity DECIMAL(18, 2),
    pnl_pct DECIMAL(10, 4),
    trades_count INT NOT NULL DEFAULT 0,
    wins INT NOT NULL DEFAULT 0,
    losses INT NOT NULL DEFAULT 0,
    win_rate DECIMAL(5, 2),
    avg_rr DECIMAL(5, 2),
    target_reached BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_daily_performance_updated_at
BEFORE UPDATE ON daily_performance
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE heartbeat_log (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    service VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL, -- 'OK', 'DEGRADED', 'ERROR'
    latency_ms INT,
    message TEXT
);
-- Clean up old heartbeats efficiently by indexing timestamp
CREATE INDEX idx_heartbeat_timestamp ON heartbeat_log(timestamp DESC);
