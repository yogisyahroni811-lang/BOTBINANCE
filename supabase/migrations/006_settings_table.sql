-- Migration 006: Bot Settings and Risk Configuration

CREATE TABLE bot_settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    category VARCHAR(20) NOT NULL DEFAULT 'GENERAL', -- 'GENERAL', 'RISK', 'API', 'NOTIFICATION'
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER update_bot_settings_updated_at
BEFORE UPDATE ON bot_settings
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Seed default settings
INSERT INTO bot_settings (key, value, category, description) VALUES
('risk_per_trade_pct', '2.5', 'RISK', 'Percentage of equity to risk per trade (0-100)'),
('max_leverage', '10', 'RISK', 'Maximum leverage for futures positions'),
('emergency_stop_pct', '15.0', 'RISK', 'Daily drawdown percentage to trigger emergency stop'),
('binance_api_key', '', 'API', 'Binance API Key for execution'),
('binance_api_secret', '', 'API', 'Binance API Secret (Encrypted or server-side only in production)'),
('telegram_chat_id', '', 'NOTIFICATION', 'The chat ID for Telegram notifications'),
('is_trading_enabled', 'true', 'GENERAL', 'Master switch to enable/disable automated trading');
