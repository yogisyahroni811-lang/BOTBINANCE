use axum::{
    extract::{Path, State},
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use crate::api::error::ApiError;
use crate::api::state::AppState;
use crate::analysis::sync_engine::SyncEvent;

#[derive(Serialize, FromRow)]
pub struct Symbol {
    pub symbol: String,
    pub sync_status: String,
}

#[derive(Deserialize)]
pub struct AddSymbolRequest {
    pub symbol: String,
}

pub async fn get_symbols(State(state): State<AppState>) -> Result<Json<Vec<Symbol>>, ApiError> {
    let symbols = sqlx::query_as::<_, Symbol>("SELECT symbol FROM symbols WHERE is_active = true ORDER BY priority ASC")
        .fetch_all(&state.db_pool)
        .await
        .map_err(|e: sqlx::Error| ApiError::InternalServerError(e.to_string()))?;

    Ok(Json(symbols))
}

pub async fn add_symbol(
    State(state): State<AppState>,
    Json(payload): Json<AddSymbolRequest>,
) -> Result<Json<Vec<Symbol>>, ApiError> {
    sqlx::query("INSERT INTO symbols (symbol) VALUES ($1) ON CONFLICT (symbol) DO UPDATE SET is_active = true")
        .bind(&payload.symbol)
        .execute(&state.db_pool)
        .await
        .map_err(|e: sqlx::Error| ApiError::InternalServerError(e.to_string()))?;

    // Trigger Initial Sync via channel
    let _ = state.sync_tx.send(SyncEvent::InitialSync(payload.symbol.clone())).await;

    get_symbols(State(state)).await
}

pub async fn remove_symbol(
    State(state): State<AppState>,
    Path(symbol): Path<String>,
) -> Result<Json<Vec<Symbol>>, ApiError> {
    sqlx::query("UPDATE symbols SET is_active = false WHERE symbol = $1")
        .bind(&symbol)
        .execute(&state.db_pool)
        .await
        .map_err(|e| ApiError::InternalServerError(e.to_string()))?;

    get_symbols(State(state)).await
}

pub async fn get_binance_markets(State(state): State<AppState>) -> Result<Json<serde_json::Value>, ApiError> {
    let info = state.binance_client.get_exchange_info().await
        .map_err(|e| ApiError::InternalServerError(e.to_string()))?;
    
    // Filter only symbols that are TRADING and are USDT or BUSD pairs (user requested USDT-M)
    // Actually Binance Futures are mostly USDT perpetuals
    let symbols = info["symbols"]
        .as_array()
        .ok_or_else(|| ApiError::InternalServerError("Invalid response from Binance".to_string()))?
        .iter()
        .filter(|s| s["status"] == "TRADING" && s["quoteAsset"] == "USDT")
        .cloned()
        .collect::<Vec<_>>();

    Ok(Json(serde_json::to_value(symbols).unwrap()))
}

pub async fn get_klines(
    State(state): State<AppState>,
    Path((symbol, interval)): Path<(String, String)>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let klines = state.binance_client.get_klines(&symbol, &interval, 500).await
        .map_err(|e| ApiError::InternalServerError(e.to_string()))?;
    
    Ok(Json(klines))
}
