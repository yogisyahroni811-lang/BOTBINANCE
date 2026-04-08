use axum::{
    extract::{Path, State},
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use crate::api::error::ApiError;
use crate::api::state::AppState;

#[derive(Serialize, FromRow)]
pub struct Symbol {
    pub symbol: String,
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
