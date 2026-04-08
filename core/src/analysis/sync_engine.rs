use std::sync::Arc;
use tokio::sync::mpsc;
use tracing::{info, error, warn};
use sqlx::PgPool;
use crate::execution::binance_client::BinanceClient;
use crate::error::AppError;
use bigdecimal::BigDecimal;
use std::str::FromStr;
use chrono::{DateTime, Utc, TimeZone};

pub enum SyncEvent {
    InitialSync(String), // Symbol
}

pub struct SyncEngine {
    client: Arc<BinanceClient>,
    db: PgPool,
    receiver: mpsc::Receiver<SyncEvent>,
    timeframes: Vec<&'static str>,
}

impl SyncEngine {
    pub fn new(client: Arc<BinanceClient>, db: PgPool, receiver: mpsc::Receiver<SyncEvent>) -> Self {
        Self {
            client,
            db,
            receiver,
            timeframes: vec!["5m", "15m", "1h", "4h", "1d"],
        }
    }

    pub async fn run(mut self) {
        info!("SyncEngine worker started.");
        while let Some(event) = self.receiver.recv().await {
            match event {
                SyncEvent::InitialSync(symbol) => {
                    if let Err(e) = self.perform_initial_sync(&symbol).await {
                        error!("Failed initial sync for {}: {}", symbol, e);
                    }
                }
            }
        }
    }

    async fn perform_initial_sync(&self, symbol: &str) -> Result<(), AppError> {
        info!("Starting initial sync for {} (200 candles per TF)", symbol);

        // Get symbol_id
        let symbol_id: i64 = sqlx::query_scalar("SELECT id FROM symbols WHERE symbol = $1")
            .bind(symbol)
            .fetch_one(&self.db)
            .await
            .map_err(|e| AppError::Database(e))?;

        for tf in &self.timeframes {
            info!("Fetching {} history for {}", tf, symbol);
            
            match self.client.get_klines(symbol, tf, 200).await {
                Ok(klines) => {
                    if let Some(arr) = klines.as_array() {
                        for k in arr {
                            if let Err(e) = self.save_candle(symbol_id, tf, k).await {
                                error!("Failed to save candle for {} {}: {}", symbol, tf, e);
                            }
                        }
                    }
                    info!("Sync complete for {} - {}", symbol, tf);
                }
                Err(e) => {
                    error!("Error fetching {} klines for {}: {}", tf, symbol, e);
                    continue; // Skip one TF if failed, don't stop entire sync
                }
            }
            
            // Wait slightly between TFs to respect rate limit (weight based)
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        }

        // Mark as LIVE in DB
        sqlx::query("UPDATE symbols SET sync_status = 'LIVE' WHERE id = $1")
            .bind(symbol_id)
            .execute(&self.db)
            .await
            .map_err(|e| AppError::Database(e))?;

        info!("Initial sync finished for {}. Data is now LIVE.", symbol);
        
        Ok(())
    }

    async fn save_candle(&self, symbol_id: i64, timeframe: &str, data: &serde_json::Value) -> Result<(), AppError> {
        // Binance kline format: [OpenTime, O, H, L, C, V, CloseTime, ...]
        let open_time_ms = data[0].as_i64().unwrap_or(0);
        let timestamp = Utc.timestamp_millis_opt(open_time_ms).single();
        
        if timestamp.is_none() {
            return Err(AppError::Internal("Invalid timestamp in kline data".to_string()));
        }

        let timestamp = timestamp.unwrap();
        let o = BigDecimal::from_str(data[1].as_str().unwrap_or("0")).unwrap_or_default();
        let h = BigDecimal::from_str(data[2].as_str().unwrap_or("0")).unwrap_or_default();
        let l = BigDecimal::from_str(data[3].as_str().unwrap_or("0")).unwrap_or_default();
        let c = BigDecimal::from_str(data[4].as_str().unwrap_or("0")).unwrap_or_default();
        let v = BigDecimal::from_str(data[5].as_str().unwrap_or("0")).unwrap_or_default();

        sqlx::query(
            r#"
            INSERT INTO candles (symbol_id, timeframe, timestamp, o, h, l, c, v)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (symbol_id, timeframe, timestamp) DO UPDATE
            SET o = EXCLUDED.o, h = EXCLUDED.h, l = EXCLUDED.l, c = EXCLUDED.c, v = EXCLUDED.v
            "#
        )
        .bind(symbol_id)
        .bind(timeframe)
        .bind(timestamp)
        .bind(o)
        .bind(h)
        .bind(l)
        .bind(c)
        .bind(v)
        .execute(&self.db)
        .await
        .map_err(|e| AppError::Database(e))?;

        Ok(())
    }
}
