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
pub struct TradeQuery {
    pub is_paper: Option<bool>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

#[derive(Deserialize)]
pub struct PerfQuery {
    pub date: Option<String>,
    pub is_paper: Option<bool>,
}

#[derive(Serialize, FromRow)]
pub struct Performance {
    pub date: String,
    pub total_pnl: f64,
    pub open_positions: i64,
    pub win_rate: f64,
}

pub async fn get_positions(
    State(state): State<AppState>,
    Query(params): Query<TradeQuery>,
) -> Result<Json<Vec<Position>>, ApiError> {
    let is_paper = params.is_paper.unwrap_or(false);
    
    let positions = sqlx::query_as::<_, Position>(
        "SELECT t.id::text, s.symbol, t.direction as side, t.entry_price::float8, t.size_usd::float8 as size, 'OPEN' as status 
         FROM trades t 
         JOIN symbols s ON t.symbol_id = s.id 
         WHERE t.outcome IS NULL AND t.is_paper = $1"
    )
    .bind(is_paper)
    .fetch_all(&state.db_pool)
    .await
    .map_err(|e: sqlx::Error| ApiError::InternalServerError(e.to_string()))?;

    Ok(Json(positions))
}

pub async fn get_trades(
    State(state): State<AppState>,
    Query(params): Query<TradeQuery>,
) -> Result<Json<Vec<Trade>>, ApiError> {
    let limit = params.limit.unwrap_or(50) as i64;
    let offset = params.offset.unwrap_or(0) as i64;
    let is_paper = params.is_paper.unwrap_or(false);

    let trades = sqlx::query_as::<_, Trade>(
        "SELECT t.id::text, s.symbol, t.direction as side, t.entry_price::float8, t.exit_price::float8, t.pnl_usd::float8 as pnl,
                m.mistake_type, m.prevention_tip as ai_feedback
         FROM trades t 
         JOIN symbols s ON t.symbol_id = s.id 
         LEFT JOIN mistakes m ON m.trade_id = t.id
         WHERE t.outcome IS NOT NULL AND t.is_paper = $3
         ORDER BY t.exit_time DESC LIMIT $1 OFFSET $2"
    )
    .bind(limit)
    .bind(offset)
    .bind(is_paper)
    .fetch_all(&state.db_pool)
    .await
    .map_err(|e: sqlx::Error| ApiError::InternalServerError(e.to_string()))?;

    Ok(Json(trades))
}

pub async fn get_performance(
    State(state): State<AppState>,
    Query(params): Query<PerfQuery>,
) -> Result<Json<Performance>, ApiError> {
    let date_str = params.date.clone().unwrap_or_else(|| "today".to_string());
    let is_paper = params.is_paper.unwrap_or(false);
    
    let total_pnl: Option<f64> = sqlx::query_scalar("SELECT SUM(pnl_usd)::float8 FROM trades WHERE outcome IS NOT NULL AND is_paper = $1")
        .bind(is_paper)
        .fetch_one(&state.db_pool)
        .await
        .map_err(|e: sqlx::Error| ApiError::InternalServerError(e.to_string()))?;

    let win_rate_val: Option<f64> = sqlx::query_scalar(
        "SELECT (COUNT(CASE WHEN outcome = 'WIN' THEN 1 END) * 100.0) / NULLIF(COUNT(*), 0) FROM trades WHERE outcome IS NOT NULL AND is_paper = $1"
    )
    .bind(is_paper)
    .fetch_one(&state.db_pool)
    .await
    .unwrap_or(None);

    let open_positions: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM trades WHERE outcome IS NULL AND is_paper = $1")
        .bind(is_paper)
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
#[derive(Serialize)]
pub struct BalanceResponse {
    pub total_wallet_balance: f64,
    pub total_unrealized_pnl: f64,
    pub total_margin_balance: f64,
    pub available_balance: f64,
}

pub async fn get_account_balance(
    State(state): State<AppState>,
) -> Result<Json<BalanceResponse>, ApiError> {
    // Dynamically load client from DB to ensure real keys are used
    let client = crate::execution::binance_client::BinanceClient::from_db(&state.db_pool)
        .await
        .map_err(|e| ApiError::InternalServerError(format!("Failed to load Binance config: {}", e)))?;

    if client.key.is_empty() {
        return Err(ApiError::InternalServerError("Binance API keys not configured. Please visit Settings.".to_string()));
    }

    let account = client.get_account_info().await
        .map_err(|e| ApiError::InternalServerError(e.to_string()))?;

    let total_wallet_balance = account["totalWalletBalance"]
        .as_str()
        .and_then(|s| s.parse::<f64>().ok())
        .unwrap_or(0.0);

    let total_unrealized_pnl = account["totalUnrealizedProfit"]
        .as_str()
        .and_then(|s| s.parse::<f64>().ok())
        .unwrap_or(0.0);

    let total_margin_balance = account["totalMarginBalance"]
        .as_str()
        .and_then(|s| s.parse::<f64>().ok())
        .unwrap_or(0.0);

    let available_balance = account["availableBalance"]
        .as_str()
        .and_then(|s| s.parse::<f64>().ok())
        .unwrap_or(0.0);

    Ok(Json(BalanceResponse {
        total_wallet_balance,
        total_unrealized_pnl,
        total_margin_balance,
        available_balance,
    }))
}
