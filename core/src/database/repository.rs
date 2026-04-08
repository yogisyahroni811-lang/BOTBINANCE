use sqlx::PgPool;
use crate::error::AppError;
use super::models::{Trade, SndZone, HeartbeatLog};
use bigdecimal::BigDecimal;
use chrono::Utc;

pub struct TradesRepo {
    pool: PgPool,
}

impl TradesRepo {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn get_open_positions(&self) -> Result<Vec<Trade>, AppError> {
        let trades = sqlx::query_as::<_, Trade>(
            r#"SELECT * FROM trades WHERE outcome IS NULL ORDER BY entry_time DESC"#
        )
        .fetch_all(&self.pool)
        .await?;
        Ok(trades)
    }

    pub async fn save_trade(&self, trade: &Trade) -> Result<i64, AppError> {
        let id: i64 = sqlx::query_scalar(
            r#"
            INSERT INTO trades (
                symbol_id, entry_timeframe, entry_time, entry_price, direction, 
                size_usd, leverage, setup_type, grade_at_entry, 
                stop_loss_order_id, tp1_order_id, tp2_order_id,
                initial_sl_price, current_sl_price, initial_risk_usd
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING id
            "#
        )
        .bind(trade.symbol_id)
        .bind(&trade.entry_timeframe)
        .bind(trade.entry_time)
        .bind(&trade.entry_price)
        .bind(&trade.direction)
        .bind(&trade.size_usd)
        .bind(trade.leverage)
        .bind(&trade.setup_type)
        .bind(&trade.grade_at_entry)
        .bind(&trade.stop_loss_order_id)
        .bind(&trade.tp1_order_id)
        .bind(&trade.tp2_order_id)
        .bind(&trade.initial_sl_price)
        .bind(&trade.current_sl_price)
        .bind(&trade.initial_risk_usd)
        .fetch_one(&self.pool)
        .await?;
        
        Ok(id)
    }

    /// Update an existing trade (e.g. at exit or status update)
    pub async fn update_trade(&self, trade: &Trade) -> Result<(), AppError> {
        sqlx::query(
            r#"
            UPDATE trades 
            SET exit_time = $1, exit_price = $2, exit_reason = $3, 
                pnl_usd = $4, pnl_pct = $5, outcome = $6,
                stop_loss_order_id = $7, tp1_order_id = $8, tp2_order_id = $9,
                be_triggered = $10, trailing_sl_active = $11, current_sl_price = $12,
                updated_at = NOW()
            WHERE id = $13
            "#
        )
        .bind(trade.exit_time)
        .bind(&trade.exit_price)
        .bind(&trade.exit_reason)
        .bind(&trade.pnl_usd)
        .bind(&trade.pnl_pct)
        .bind(&trade.outcome)
        .bind(&trade.stop_loss_order_id)
        .bind(&trade.tp1_order_id)
        .bind(&trade.tp2_order_id)
        .bind(trade.be_triggered)
        .bind(trade.trailing_sl_active)
        .bind(&trade.current_sl_price)
        .bind(trade.id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }
}

pub struct ZonesRepo {
    pool: PgPool,
}

impl ZonesRepo {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn get_active_zones(&self, symbol_id: i64, timeframe: &str) -> Result<Vec<SndZone>, AppError> {
        let zones = sqlx::query_as::<_, SndZone>(
            r#"
            SELECT * FROM snd_zones
            WHERE symbol_id = $1 AND timeframe = $2 AND is_active = true
            ORDER BY created_at DESC
            "#
        )
        .bind(symbol_id)
        .bind(timeframe)
        .fetch_all(&self.pool)
        .await?;
        Ok(zones)
    }

    pub async fn save_zone(&self, zone: &SndZone) -> Result<i64, AppError> {
        let id: i64 = sqlx::query_scalar(
            r#"
            INSERT INTO snd_zones (symbol_id, timeframe, zone_type, price_high, price_low, grade)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
            "#
        )
        .bind(zone.symbol_id)
        .bind(&zone.timeframe)
        .bind(&zone.zone_type)
        .bind(&zone.price_high)
        .bind(&zone.price_low)
        .bind(&zone.grade)
        .fetch_one(&self.pool)
        .await?;

        Ok(id)
    }
}

pub struct SystemRepo {
    pool: PgPool,
}

impl SystemRepo {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn log_heartbeat(&self, service: &str, status: &str, latency_ms: Option<i32>, message: Option<&str>) -> Result<(), AppError> {
        sqlx::query(
            r#"
            INSERT INTO heartbeat_log (service, timestamp, status, latency_ms, message)
            VALUES ($1, NOW(), $2, $3, $4)
            "#
        )
        .bind(service)
        .bind(status)
        .bind(latency_ms)
        .bind(message)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn get_setting(&self, key: &str) -> Result<Option<String>, AppError> {
        let value: Option<String> = sqlx::query_scalar("SELECT value FROM bot_settings WHERE key = $1")
            .bind(key)
            .fetch_optional(&self.pool)
            .await?;
        Ok(value)
    }

    pub async fn get_all_settings(&self) -> Result<std::collections::HashMap<String, String>, AppError> {
        let rows: Vec<(String, String)> = sqlx::query_as("SELECT key, value FROM bot_settings")
            .fetch_all(&self.pool)
            .await?;
        
        Ok(rows.into_iter().collect())
    }
}
