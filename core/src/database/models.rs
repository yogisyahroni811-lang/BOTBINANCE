use sqlx::FromRow;
use chrono::{DateTime, Utc, NaiveDate};
use bigdecimal::BigDecimal;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Symbol {
    pub id: i64,
    pub symbol: String,
    pub is_active: bool,
    pub priority: i32,
    pub added_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Candle {
    pub id: i64,
    pub symbol_id: i64,
    pub timeframe: String,
    pub timestamp: DateTime<Utc>,
    pub o: BigDecimal,
    pub h: BigDecimal,
    pub l: BigDecimal,
    pub c: BigDecimal,
    pub v: BigDecimal,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct SndZone {
    pub id: i64,
    pub symbol_id: i64,
    pub timeframe: String,
    pub zone_type: String, // 'DEMAND' or 'SUPPLY'
    pub price_high: BigDecimal,
    pub price_low: BigDecimal,
    pub grade: String,     // 'A+', 'A', 'B', 'C'
    pub test_count: i32,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Trade {
    pub id: i64,
    pub symbol_id: i64,
    pub entry_timeframe: String,
    pub entry_time: DateTime<Utc>,
    pub entry_price: BigDecimal,
    pub direction: String, // 'LONG' or 'SHORT'
    pub size_usd: BigDecimal,
    pub leverage: i32,
    pub setup_type: String,
    pub grade_at_entry: Option<String>,
    pub exit_time: Option<DateTime<Utc>>,
    pub exit_price: Option<BigDecimal>,
    pub exit_reason: Option<String>,
    pub pnl_usd: Option<BigDecimal>,
    pub pnl_pct: Option<BigDecimal>,
    pub outcome: Option<String>, // 'WIN', 'LOSS', 'BREAKEVEN'
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Mistake {
    pub id: i64,
    pub trade_id: i64,
    pub mistake_type: String,
    pub severity: String,
    pub market_context: serde_json::Value,
    pub what_happened: String,
    pub what_should_happen: String,
    pub prevention_tip: String,
    pub embedding: Option<String>, // Can be stored/retrieved as string/vec depending on pgvector pg library support
    pub similar_loss_count: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct DailyPerformance {
    pub date: NaiveDate,
    pub starting_equity: BigDecimal,
    pub ending_equity: Option<BigDecimal>,
    pub pnl_pct: Option<BigDecimal>,
    pub trades_count: i32,
    pub wins: i32,
    pub losses: i32,
    pub win_rate: Option<BigDecimal>,
    pub avg_rr: Option<BigDecimal>,
    pub target_reached: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct HeartbeatLog {
    pub id: i64,
    pub service: String,
    pub timestamp: DateTime<Utc>,
    pub status: String,
    pub latency_ms: Option<i32>,
    pub message: Option<String>,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct ElliottWave {
    pub id: i64,
    pub symbol_id: i64,
    pub timeframe: String,
    pub current_wave: String,
    pub wave_type: String,
    pub invalidation_price: Option<BigDecimal>,
    pub confidence: BigDecimal,
    pub created_at: DateTime<Utc>,
}
