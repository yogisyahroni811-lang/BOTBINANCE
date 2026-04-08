-- Add advanced tracking columns to trades table
ALTER TABLE trades ADD COLUMN IF NOT EXISTS stop_loss_order_id VARCHAR(100);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS tp1_order_id VARCHAR(100);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS tp2_order_id VARCHAR(100);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS be_triggered BOOLEAN DEFAULT FALSE;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS trailing_sl_active BOOLEAN DEFAULT FALSE;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS initial_sl_price DECIMAL(20, 8);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS current_sl_price DECIMAL(20, 8);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS initial_risk_usd DECIMAL(20, 8);

-- Seed new settings for BE & Spread
INSERT INTO bot_settings (key, value, description) VALUES 
('risk_be_buffer_pct', '0.05', 'Buffer percentage added to entry for Break-Even (to cover fees)'),
('risk_reversal_enabled', 'true', 'Enable automatic position reversal when AI detects trend change'),
('risk_tsl_trigger_rr', '1.0', 'Risk/Reward ratio to trigger Break-Even move')
ON CONFLICT (key) DO NOTHING;
