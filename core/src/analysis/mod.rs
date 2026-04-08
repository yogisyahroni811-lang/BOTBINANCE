pub mod snd;
pub mod elliott;
pub mod invalidation_monitor;
pub mod indicators;

use crate::database::models::Candle;
use crate::database::repository::SystemRepo;
use crate::ai_client::{SetupRequest, AIConfig, SignalResponse, MTFContext};
use sqlx::PgPool;
use futures::future::join_all;

pub async fn orchestrate_analysis_with_ai(
    pool: &PgPool, 
    symbol: &str, 
    symbol_id: i64,
    tf: &str, 
    candles: &[Candle]
) -> anyhow::Result<Option<SignalResponse>> {
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

    // Calculate indicators for the primary timeframe
    let primary_indicators = indicators::calculate_indicators(candles);

    // 2. Fetch and calculate indicators for other timeframes (MTF)
    let other_tfs = vec!["1h", "4h", "1d"];
    let mtf_futures = other_tfs.into_iter().map(|mtf_str| {
        let pool = pool.clone();
        async move {
            let mtf_candles = sqlx::query_as::<_, Candle>(
                "SELECT * FROM candles WHERE symbol_id = $1 AND timeframe = $2 ORDER BY timestamp DESC LIMIT 250"
            )
            .bind(symbol_id)
            .bind(mtf_str)
            .fetch_all(&pool)
            .await
            .unwrap_or_default();

            let indicators = indicators::calculate_indicators(&mtf_candles);
            
            MTFContext {
                timeframe: mtf_str.to_string(),
                candles: mtf_candles.iter().map(|c| crate::ai_client::Candle {
                    timestamp: c.timestamp.to_rfc3339(),
                    open: c.o.to_string().parse().unwrap_or(0.0),
                    high: c.h.to_string().parse().unwrap_or(0.0),
                    low: c.l.to_string().parse().unwrap_or(0.0),
                    close: c.c.to_string().parse().unwrap_or(0.0),
                    volume: c.v.to_string().parse().unwrap_or(0.0),
                }).collect(),
                indicators: Some(indicators),
            }
        }
    });

    let mtf_context = join_all(mtf_futures).await;

    // Detect zones (Placeholder - real logic in snd.rs)
    let _zones = snd::detect_zones(candles);
    
    // Detect waves (Placeholder - real logic in elliott.rs)
    let _pivots = elliott::detect_pivots(candles, 10, 0.05);
    let _wave = elliott::identify_waves(&_pivots, candles);

    // If a setup is strong enough, call Python AI
    // For now, let's assume we always validate
    let ai_url = std::env::var("PYTHON_AI_URL").unwrap_or_else(|_| "http://localhost:8000".to_string());
    
    let setup = crate::ai_client::SetupRequest {
        symbol: symbol.to_string(),
        timeframe: tf.to_string(),
        zone: None, // Will be filled with real zone
        wave: None, // Will be filled with real wave
        candles: candles.iter().map(|c| crate::ai_client::Candle {
            timestamp: c.timestamp.to_rfc3339(),
            open: c.open.to_string().parse().unwrap_or(0.0),
            high: c.high.to_string().parse().unwrap_or(0.0),
            low: c.low.to_string().parse().unwrap_or(0.0),
            close: c.close.to_string().parse().unwrap_or(0.0),
            volume: c.volume.to_string().parse().unwrap_or(0.0),
        }).collect(),
        indicators: Some(primary_indicators),
        mtf_context, 
        ai_config: Some(ai_config),
        risk_settings: settings.clone(),
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
