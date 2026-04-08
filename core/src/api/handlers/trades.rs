use axum::{
    extract::{Query, State},
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use crate::api::error::ApiError;
use crate::api::state::AppState;

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
    pub exit_price: Option<f64>,
    pub pnl: Option<f64>,
    pub mistake_type: Option<String>,
    pub ai_feedback: Option<String>,
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

#[derive(Serialize, FromRow)]
pub struct Performance {
    pub date: String,
    pub total_pnl: f64,
    pub open_positions: i64,
    pub win_rate: f64,
}

pub async fn get_positions(State(state): State<AppState>) -> Result<Json<Vec<Position>>, ApiError> {
    let positions = sqlx::query_as::<_, Position>(
        "SELECT t.id::text, s.symbol, t.direction as side, t.entry_price::float8, t.size_usd::float8 as size, 'OPEN' as status 
         FROM trades t 
         JOIN symbols s ON t.symbol_id = s.id 
         WHERE t.outcome IS NULL"
    )
    .fetch_all(&state.db_pool)
    .await
    .map_err(|e: sqlx::Error| ApiError::InternalServerError(e.to_string()))?;

    Ok(Json(positions))
}

pub async fn get_trades(
    State(state): State<AppState>,
    Query(params): Query<Pagination>,
) -> Result<Json<Vec<Trade>>, ApiError> {
    let limit = params.limit.unwrap_or(50) as i64;
    let offset = params.offset.unwrap_or(0) as i64;

    let trades = sqlx::query_as::<_, Trade>(
        "SELECT t.id::text, s.symbol, t.direction as side, t.entry_price::float8, t.exit_price::float8, t.pnl_usd::float8 as pnl,
                m.mistake_type, m.prevention_tip as ai_feedback
         FROM trades t 
         JOIN symbols s ON t.symbol_id = s.id 
         LEFT JOIN mistakes m ON m.trade_id = t.id
         WHERE t.outcome IS NOT NULL 
         ORDER BY t.exit_time DESC LIMIT $1 OFFSET $2"
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.db_pool)
    .await
    .map_err(|e: sqlx::Error| ApiError::InternalServerError(e.to_string()))?;

    Ok(Json(trades))
}

pub async fn get_performance(
    State(state): State<AppState>,
    Query(params): Query<PerfQuery>,
) -> Result<Json<Performance>, ApiError> {
    let date_str = params.date.unwrap_or_else(|| "today".to_string());
    
    let total_pnl: Option<f64> = sqlx::query_scalar("SELECT SUM(pnl_usd)::float8 FROM trades WHERE outcome IS NOT NULL")
        .fetch_one(&state.db_pool)
        .await
        .map_err(|e: sqlx::Error| ApiError::InternalServerError(e.to_string()))?;

    let win_rate_val: Option<f64> = sqlx::query_scalar(
        "SELECT (COUNT(CASE WHEN outcome = 'WIN' THEN 1 END) * 100.0) / NULLIF(COUNT(*), 0) FROM trades WHERE outcome IS NOT NULL"
    )
    .fetch_one(&state.db_pool)
    .await
    .unwrap_or(None);

    let open_positions: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM trades WHERE outcome IS NULL")
        .fetch_one(&state.db_pool)
        .await
        .unwrap_or(0);

    Ok(Json(Performance {
        date: date_str,
        total_pnl: total_pnl.unwrap_or(0.0),
        win_rate: win_rate_val.unwrap_or(0.0),
        open_positions,
    }))
}

pub async fn get_performance_history(
    State(state): State<AppState>,
) -> Result<Json<Vec<Performance>>, ApiError> {
    let history = sqlx::query_as::<_, Performance>(
        "SELECT date::text as date, 
                (COALESCE(ending_equity, starting_equity) - starting_equity)::float8 as total_pnl, 
                0 as open_positions, 
                COALESCE(win_rate, 0)::float8 as win_rate 
         FROM daily_performance 
         ORDER BY date ASC LIMIT 30"
    )
    .fetch_all(&state.db_pool)
    .await
    .map_err(|e: sqlx::Error| ApiError::InternalServerError(e.to_string()))?;

    Ok(Json(history))
}
