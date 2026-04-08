use axum::{
    extract::{Path, State},
    Json,
};
use serde::{Deserialize, Serialize};

use crate::api::error::ApiError;
use crate::api::state::AppState;

#[derive(Serialize)]
pub struct SymbolList {
    pub symbols: Vec<String>,
}

#[derive(Deserialize)]
pub struct AddSymbolRequest {
    pub symbol: String,
}

pub async fn get_symbols(State(state): State<AppState>) -> Result<Json<SymbolList>, ApiError> {
    let list = state.watchlist.lock().await;
    let symbols: Vec<String> = list.iter().cloned().collect();
    Ok(Json(SymbolList { symbols }))
}

pub async fn add_symbol(
    State(state): State<AppState>,
    Json(payload): Json<AddSymbolRequest>,
) -> Result<Json<SymbolList>, ApiError> {
    let mut list = state.watchlist.lock().await;
    
    // Validasi Max 30
    if list.len() >= 30 && !list.contains(&payload.symbol) {
        return Err(ApiError::BadRequest("Watchlist cannot exceed 30 symbols".to_string()));
    }

    // Upsert to DB
    sqlx::query("INSERT INTO watchlist (symbol) VALUES ($1) ON CONFLICT DO NOTHING")
        .bind(&payload.symbol)
        .execute(&state.db_pool)
        .await
        .map_err(|e| ApiError::InternalServerError(e.to_string()))?;

    list.insert(payload.symbol);

    let symbols: Vec<String> = list.iter().cloned().collect();
    Ok(Json(SymbolList { symbols }))
}

pub async fn remove_symbol(
    State(state): State<AppState>,
    Path(symbol): Path<String>,
) -> Result<Json<SymbolList>, ApiError> {
    let mut list = state.watchlist.lock().await;

    sqlx::query("DELETE FROM watchlist WHERE symbol = $1")
        .bind(&symbol)
        .execute(&state.db_pool)
        .await
        .map_err(|e| ApiError::InternalServerError(e.to_string()))?;

    list.remove(&symbol);

    let symbols: Vec<String> = list.iter().cloned().collect();
    Ok(Json(SymbolList { symbols }))
}
