pub mod snd;
pub mod elliott;
pub mod invalidation_monitor;

use crate::database::models::Candle;

use crate::database::repository::SystemRepo;
use crate::ai_client::{SetupRequest, AIConfig, SignalResponse};
use sqlx::PgPool;

pub async fn orchestrate_analysis_with_ai(pool: &PgPool, symbol: &str, tf: &str, candles: &[Candle]) -> anyhow::Result<Option<SignalResponse>> {
    let repo = SystemRepo::new(pool.clone());
    let settings = repo.get_all_settings().await?;

    // Load AI Configuration from DB
    let ai_config = AIConfig {
        provider: settings.get("ai_active_provider").cloned().unwrap_or_else(|| "google".to_string()),
        model: settings.get("ai_active_model").cloned().unwrap_or_else(|| "gemini-3.1-pro-high".to_string()),
        api_key: settings.get("ai_api_key").cloned().unwrap_or_default(),
        base_url: settings.get("ai_base_url").cloned().filter(|v| !v.is_empty()),
        temperature: settings.get("ai_temperature").and_then(|t| t.parse().ok()).unwrap_or(0.1),
        max_tokens: settings.get("ai_max_tokens").and_then(|t| t.parse().ok()).unwrap_or(8192),
    };

    // Detect zones (Placeholder - real logic in snd.rs)
    let _zones = snd::detect_zones(candles);
    
    // Detect waves (Placeholder - real logic in elliott.rs)
    let _pivots = elliott::detect_pivots(candles, 10, 0.05);
    let _wave = elliott::identify_waves(&_pivots, candles);

    // If a setup is strong enough, call Python AI
    // For now, let's assume we always validate
    let ai_url = std::env::var("PYTHON_AI_URL").unwrap_or_else(|_| "http://localhost:8000".to_string());
    
    let setup = SetupRequest {
        symbol: symbol.to_string(),
        timeframe: tf.to_string(),
        zone: None, // Will be filled with real zone
        wave: None, // Will be filled with real wave
        candles: candles.iter().map(|c| crate::ai_client::Candle {
            timestamp: c.timestamp.to_rfc3339(),
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
            volume: c.volume,
        }).collect(),
        ai_config: Some(ai_config),
    };

    let client = reqwest::Client::new();
    let resp = client.post(format!("{}/api/v1/analyze", ai_url))
        .json(&setup)
        .send()
        .await?;

    if resp.status().is_success() {
        let signal: SignalResponse = resp.json().await?;
        return Ok(Some(signal));
    }

    Ok(None)
}
