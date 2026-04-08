use sqlx::PgPool;
use std::sync::Arc;
use std::collections::HashSet;
use tokio::sync::Mutex;

#[derive(Clone)]
pub struct AppState {
    pub db_pool: PgPool,
    pub watchlist: Arc<Mutex<HashSet<String>>>,
    pub tx_sse: tokio::sync::broadcast::Sender<String>,
}

impl AppState {
    pub fn new(db_pool: PgPool) -> Self {
        let (tx, _rx) = tokio::sync::broadcast::channel(100);
        Self {
            db_pool,
            watchlist: Arc::new(Mutex::new(HashSet::new())),
            tx_sse: tx,
        }
    }
}
