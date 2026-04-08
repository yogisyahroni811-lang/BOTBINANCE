use sqlx::PgPool;
use std::sync::Arc;
use std::collections::HashSet;
use tokio::sync::Mutex;

#[derive(Clone)]
pub struct AppState {
    pub db_pool: PgPool,
    pub watchlist: Arc<Mutex<HashSet<String>>>,
}

impl AppState {
    pub fn new(db_pool: PgPool) -> Self {
        Self {
            db_pool,
            watchlist: Arc::new(Mutex::new(HashSet::new())),
        }
    }
}
