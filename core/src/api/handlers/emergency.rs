use axum::{
    extract::State,
    Json,
};
use serde_json::{json, Value};

use crate::api::error::ApiError;
use crate::api::state::AppState;

pub async fn trigger_emergency(State(state): State<AppState>) -> Result<Json<Value>, ApiError> {
    // Di sini logika real-world memanggil Execution Engine untuk Force Close
    // Sebagai kerangka, kita akan update status di DB.
    
    tracing::warn!("EMERGENCY CLOSE TRIGGERED!");

    sqlx::query("UPDATE positions SET status = 'CLOSED', pnl = 0.0 WHERE status = 'OPEN'")
        .execute(&state.db_pool)
        .await
        .map_err(|e: sqlx::Error| ApiError::InternalServerError(e.to_string()))?;

    Ok(Json(json!({
        "status": "success",
        "message": "Emergency close triggered for all open positions",
    })))
}
