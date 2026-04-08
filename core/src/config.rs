use serde::Deserialize;

#[derive(Deserialize, Debug, Clone)]
pub struct AppConfig {
    pub database_url: String,
    pub telegram_bot_token: Option<String>,
    pub binance_ws_url: String,
}

impl AppConfig {
    pub fn from_env() -> Self {
        // Loads config from env safely
        Self {
            database_url: std::env::var("DATABASE_URL").expect("DATABASE_URL is missing"),
            telegram_bot_token: std::env::var("TELEGRAM_BOT_TOKEN").ok(),
            binance_ws_url: std::env::var("BINANCE_WS_URL").unwrap_or_else(|_| "wss://fstream.binance.com/ws/".to_string()),
        }
    }
}
