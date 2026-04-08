-- Migration 008: Advanced AI Configuration
INSERT INTO bot_settings (key, value, category, description) VALUES
('ai_active_provider', 'google', 'AI', 'Selected AI Provider (google, openai, anthropic, groq, etc.)'),
('ai_active_model', 'gemini-3.1-pro-high', 'AI', 'Active LLM Model ID'),
('ai_api_key', '', 'AI', 'Encrypted API Key for the selected provider'),
('ai_base_url', '', 'AI', 'Optional custom base URL for OpenAI-compatible providers'),
('ai_temperature', '0.1', 'AI', 'Sampling temperature for the AI response (0.0 - 2.0)'),
('ai_max_tokens', '8192', 'AI', 'Maximum tokens for the AI response'),
('ai_custom_models', '[]', 'AI', 'JSON list of user-defined custom model IDs')
ON CONFLICT (key) DO UPDATE SET 
    category = EXCLUDED.category,
    description = EXCLUDED.description;
