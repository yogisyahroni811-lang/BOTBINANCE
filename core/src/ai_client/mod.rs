// AI Client module (HTTP to Python Service)
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AIConfig {
    pub provider: String,
    pub model: String,
    pub api_key: String,
    pub base_url: Option<String>,
    pub temperature: f32,
    pub max_tokens: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Candle {
    pub timestamp: String,
    pub open: f64,
    pub high: f64,
    pub low: f64,
    pub close: f64,
    pub volume: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SndZoneRequest {
    pub zone_type: String,
    pub price_high: f64,
    pub price_low: f64,
    pub grade: String,
    pub test_count: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WaveRequest {
    pub current_wave: String,
    pub wave_type: String,
    pub confidence: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SetupRequest {
    pub symbol: String,
    pub timeframe: String,
    pub zone: Option<SndZoneRequest>,
    pub wave: Option<WaveRequest>,
    pub candles: Vec<Candle>,
    pub ai_config: Option<AIConfig>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SignalResponse {
    pub valid: bool,
    pub action: String, // LONG, SELL, WAIT
    pub confidence: f64,
    pub entry: Option<f64>,
    pub stop_loss: Option<f64>,
    pub tp1: Option<f64>,
    pub tp2: Option<f64>,
    pub reasoning: String,
    pub warnings: Vec<String>,
}
