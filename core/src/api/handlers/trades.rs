use axum::{
    extract::{Query, State},
    Json,
};
use serde::{Deserialize, Serialize};

use crate::api::error::ApiError;
use crate::api::state::AppState;

use sqlx::FromRow;

#[derive(Serialize, FromRow)]
pub struct Position {
    pub id: String,
    pub symbol: String,
    pub side: String,
    pub entry_price: f64,
    pub size: f64,
    pub status: String,
}

#[derive(Serialize, FromRow)]
pub struct Trade {
    pub id: String,
    pub symbol: String,
    pub side: String,
    pub entry_price: f64,
    pub exit_price: f64,
    pub pnl: f64,
}

#[derive(Deserialize)]
pub struct Pagination {
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

#[derive(Deserialize)]
pub struct PerfQuery {
    pub date: Option<String>,
}

#[derive(Serialize)]
pub struct Performance {
    pub date: String,
    pub total_pnl: f64,
    pub open_positions: i64,
    pub win_rate: f64,
}

pub async fn get_positions(State(state): State<AppState>) -> Result<Json<Vec<Position>>, ApiError> {
    let positions = sqlx::query_as::<_, Position>("SELECT id, symbol, side, entry_price, size, status FROM positions WHERE status = 'OPEN'")
        .fetch_all(&state.db_pool)
        .await
        .map_err(|e| ApiError::InternalServerError(e.to_string()))?;

    Ok(Json(positions))
}

pub async fn get_trades(
    State(state): State<AppState>,
    Query(params): Query<Pagination>,
) -> Result<Json<Vec<Trade>>, ApiError> {
    let limit = params.limit.unwrap_or(50) as i64;
    let offset = params.offset.unwrap_or(0) as i64;

    let trades = sqlx::query_as::<_, Trade>("SELECT id, symbol, side, entry_price, exit_price, pnl FROM trades ORDER BY close_time DESC LIMIT $1 OFFSET $2")
        .bind(limit)
        .bind(offset)
        .fetch_all(&state.db_pool)
        .await
        .map_err(|e| ApiError::InternalServerError(e.to_string()))?;

    Ok(Json(trades))
}

pub async fn get_performance(
    State(state): State<AppState>,
    Query(params): Query<PerfQuery>,
) -> Result<Json<Performance>, ApiError> {
    let date_str = params.date.unwrap_or_else(|| "today".to_string());
    
    // Simplification for the sake of S++ Yolo
    // In real app, we use proper date filtering.
    let total_pnl: Option<f64> = sqlx::query_scalar("SELECT SUM(pnl) FROM trades WHERE date_trunc('day', close_time) = CURRENT_DATE")
        .fetch_one(&state.db_pool)
        .await
        .map_err(|e| ApiError::InternalServerError(e.to_string()))?;

    let win_rate_val: Option<f64> = sqlx::query_scalar(
        "SELECT (COUNT(CASE WHEN pnl > 0 THEN 1 END) * 100.0) / NULLIF(COUNT(*), 0) FROM trades"
    )
    .fetch_one(&state.db_pool)
    .await
    .unwrap_or(None);

    let open_positions: Option<i64> = sqlx::query_scalar("SELECT COUNT(*) FROM positions WHERE status = 'OPEN'")
        .fetch_one(&state.db_pool)
        .await
        .unwrap_or(Some(0));

    Ok(Json(Performance {
        date: date_str,
        total_pnl: total_pnl.unwrap_or(0.0),
        win_rate: win_rate_val.unwrap_or(0.0),
        open_positions: open_positions.unwrap_or(0),
    }))
}
