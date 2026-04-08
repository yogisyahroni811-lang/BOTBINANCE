// AI Client module (HTTP to Python Service)
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SignalResponse {
    pub valid: bool,
    pub action: String, // LONG, SELL, WAIT
    pub entry: f64,
    pub sl: f64,
    pub tp1: f64,
    pub tp2: f64,
    pub confidence: f64,
}
