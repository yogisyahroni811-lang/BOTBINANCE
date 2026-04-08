use sqlx::PgPool;
use std::sync::Arc;
use tokio::sync::mpsc;
use crate::analysis::sync_engine::SyncEvent;
use crate::execution::binance_client::BinanceClient;

#[derive(Clone)]
pub struct AppState {
    pub db_pool: PgPool,
    pub tx_sse: tokio::sync::broadcast::Sender<String>,
    pub sync_tx: mpsc::Sender<SyncEvent>,
    pub binance_client: Arc<BinanceClient>,
}

impl AppState {
    pub fn new(db_pool: PgPool, sync_tx: mpsc::Sender<SyncEvent>, binance_client: Arc<BinanceClient>) -> Self {
        let (tx, _rx) = tokio::sync::broadcast::channel(100);
        Self {
            db_pool,
            tx_sse: tx,
            sync_tx,
            binance_client,
        }
    }
}
