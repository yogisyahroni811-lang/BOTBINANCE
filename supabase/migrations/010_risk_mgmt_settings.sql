-- Migration 010: Risk Management Settings
-- Adds default risk management parameters to bot_settings

INSERT INTO bot_settings (key, value, description)
VALUES 
    ('risk_max_open_positions', '3', 'Maximum number of concurrent open trades allowed'),
    ('risk_per_trade_pct', '1.0', 'Percentage of available balance to risk per trade')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, 
    description = EXCLUDED.description;
