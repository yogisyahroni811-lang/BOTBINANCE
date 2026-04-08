-- Initial seed data for BOTBINANCE

INSERT INTO symbols (symbol, is_active, priority) VALUES 
('BTCUSDT', true, 1),
('ETHUSDT', true, 2),
('SOLUSDT', true, 3),
('BNBUSDT', true, 4),
('XRPUSDT', true, 5),
('ADAUSDT', true, 6),
('AVAXUSDT', true, 7),
('DOGEUSDT', true, 8),
('DOTUSDT', true, 9),
('LINKUSDT', true, 10)
ON CONFLICT (symbol) DO NOTHING;
