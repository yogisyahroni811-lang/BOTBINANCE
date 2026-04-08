use axum::{
    extract::State,
    Json,
};
use serde::Serialize;
use crate::api::error::ApiError;
use crate::api::state::AppState;
use crate::database::models::{SndZone, ElliottWave};

#[derive(Serialize)]
pub struct SignalResponse {
    pub snd_zones: Vec<SignalItem<SndZone>>,
    pub elliott_waves: Vec<SignalItem<ElliottWave>>,
}

#[derive(Serialize)]
pub struct SignalItem<T> {
    pub symbol: String,
    pub data: T,
}

pub async fn get_active_signals(State(state): State<AppState>) -> Result<Json<SignalResponse>, ApiError> {
    // Fetch active Supply and Demand zones
    let snd_zones = sqlx::query_as::<_, SndZone>(
        "SELECT * FROM snd_zones WHERE is_active = true ORDER BY created_at DESC LIMIT 50"
    )
    .fetch_all(&state.db_pool)
    .await
    .map_err(|e| ApiError::InternalServerError(e.to_string()))?;

    // Fetch active Elliott Wave structures
    let elliott_waves = sqlx::query_as::<_, ElliottWave>(
        "SELECT * FROM elliott_waves ORDER BY created_at DESC LIMIT 50"
    )
    .fetch_all(&state.db_pool)
    .await
    .map_err(|e| ApiError::InternalServerError(e.to_string()))?;

    // Enrich with symbol names
    // For simplicity, we'll fetch symbol names in a second pass or use a join.
    // Let's use a join in the initial query for better performance.
    
    let snd_enriched = sqlx::query!(
        r#"
        SELECT s.symbol, z.* 
        FROM snd_zones z 
        JOIN symbols s ON z.symbol_id = s.id 
        WHERE z.is_active = true 
        ORDER BY z.created_at DESC LIMIT 50
        "#
    )
    .fetch_all(&state.db_pool)
    .await
    .map_err(|e| ApiError::InternalServerError(e.to_string()))?;

    let elliott_enriched = sqlx::query!(
        r#"
        SELECT s.symbol, e.* 
        FROM elliott_waves e 
        JOIN symbols s ON e.symbol_id = s.id 
        ORDER BY e.created_at DESC LIMIT 50
        "#
    )
    .fetch_all(&state.db_pool)
    .await
    .map_err(|e| ApiError::InternalServerError(e.to_string()))?;

    // Map to custom response if needed, but for now we'll just return raw joined data
    // Actually, to keep it clean and match the SignalResponse struct, let's refine:
    
    let mut snd_list = Vec::new();
    for row in snd_enriched {
        snd_list.push(SignalItem {
            symbol: row.symbol,
            data: SndZone {
                id: row.id,
                symbol_id: row.symbol_id,
                timeframe: row.timeframe,
                zone_type: row.zone_type,
                price_high: row.price_high,
                price_low: row.price_low,
                grade: row.grade,
                test_count: row.test_count,
                is_active: row.is_active,
                created_at: row.created_at,
                updated_at: row.updated_at,
            }
        });
    }

    let mut elliott_list = Vec::new();
    for row in elliott_enriched {
        elliott_list.push(SignalItem {
            symbol: row.symbol,
            data: ElliottWave {
                id: row.id,
                symbol_id: row.symbol_id,
                timeframe: row.timeframe,
                current_wave: row.current_wave,
                wave_type: row.wave_type,
                invalidation_price: row.invalidation_price,
                confidence: row.confidence,
                created_at: row.created_at,
            }
        });
    }

    Ok(Json(SignalResponse {
        snd_zones: snd_list,
        elliott_waves: elliott_list,
    }))
}
