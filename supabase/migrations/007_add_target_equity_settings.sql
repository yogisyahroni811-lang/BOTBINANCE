-- Migration 007: Add Daily Target Equity Settings
INSERT INTO bot_settings (key, value, category, description) VALUES
('daily_target_min_pct', '1.0', 'RISK', 'Minimum daily profit target in percentage of equity (0-100)'),
('daily_target_max_pct', '5.0', 'RISK', 'Maximum daily profit target in percentage of equity (0-100)')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    category = EXCLUDED.category,
    description = EXCLUDED.description;
