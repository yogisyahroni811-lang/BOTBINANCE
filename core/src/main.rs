mod api;
mod ai_client;
mod analysis;
mod buffer;
mod config;
mod database;
mod error;
mod execution;
mod risk;
mod telegram;
mod websocket;

use tracing::{info, error};
use std::sync::Arc;
use sqlx::postgres::PgPoolOptions;

#[tokio::main]
async fn main() -> Result<(), error::AppError> {
    // Initialize standard logging
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    // Load .env
    dotenvy::dotenv().ok();
    
    info!("Starting BOTBINANCE Core Engine...");

    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let telegram_token = std::env::var("TELEGRAM_BOT_TOKEN").ok();
    
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await
        .map_err(|e| error::AppError::Database(e))?;
        
    info!("Database connected successfully.");

    // 1. Core Clients & Repos
    let binance_client = Arc::new(execution::binance_client::BinanceClient::default());
    let trades_repo = Arc::new(database::repository::TradesRepo::new(pool.clone()));
    let system_repo = Arc::new(database::repository::SystemRepo::new(pool.clone()));
    let ai_client = Arc::new(ai_client::AiClient::new(std::env::var("PYTHON_AI_URL").unwrap_or_else(|_| "http://localhost:8000".to_string())));

    // 2. Notification System
    let notifier = if let Some(ref token) = telegram_token {
        info!("Telegram bot token found, initializing bot routine...");
        telegram::notifier::TelegramNotifier::new().map(Arc::new)
    } else {
        None
    };

    // 3. Sync Engine Initialization
    let (sync_tx, sync_rx) = tokio::sync::mpsc::channel(100);
    let sync_engine = analysis::sync_engine::SyncEngine::new(binance_client.clone(), pool.clone(), sync_rx);
    tokio::spawn(async move {
        sync_engine.run().await;
    });

    // 4. API Server
    let api_pool = pool.clone();
    let api_client = binance_client.clone();
    let api_sync_tx = sync_tx.clone();
    tokio::spawn(async move {
        let port = std::env::var("PORT").unwrap_or_else(|_| "3000".to_string()).parse().unwrap_or(3000);
        api::start_server(port, api_pool, api_sync_tx, api_client).await;
    });

    // 5. Execution & Analysis Engines
    let order_manager = Arc::new(execution::order_manager::OrderManager::new(
        trades_repo.clone(),
        system_repo.clone(),
        notifier.clone()
    ));

    if let Some(token) = telegram_token {
        telegram::bot::spawn_bot(token, pool.clone()).await;
    }
    
    // 6. Monitoring & Orchestration
    let invalidation_monitor = analysis::invalidation_monitor::InvalidationMonitor::new(
        binance_client.clone(),
        trades_repo.clone(),
        system_repo.clone(),
        ai_client.clone(),
        notifier.clone()
    );

    tokio::spawn(async move {
        invalidation_monitor.run_loop().await;
    });

    // Signal Orchestrator Loop
    let orchestrator_pool = pool.clone();
    let om_spawn = order_manager.clone();
    tokio::spawn(async move {
        info!("Starting Signal Orchestrator Loop...");
        loop {
            let symbol = "BTCUSDT"; // Default for now
            let symbol_id = 1;
            
            let candles = sqlx::query_as::<_, database::models::Candle>(
                "SELECT * FROM candles WHERE symbol_id = $1 ORDER BY timestamp DESC LIMIT 500"
            )
            .bind(symbol_id)
            .fetch_all(&orchestrator_pool)
            .await
            .unwrap_or_default();

            if !candles.is_empty() {
                if let Ok(Some(signal)) = analysis::orchestrate_analysis_with_ai(&orchestrator_pool, symbol, symbol_id, "1h", &candles).await {
                    if let Err(e) = om_spawn.execute_signal(symbol, &signal).await {
                        error!("Execution error for {}: {}", symbol, e);
                    }
                }
            }
            tokio::time::sleep(tokio::time::Duration::from_secs(300)).await;
        }
    });

    info!("Entering Heartbeat coordinator loop...");
    loop {
        tokio::time::sleep(tokio::time::Duration::from_secs(60)).await;
        match reqwest::get(format!("{}/health", std::env::var("PYTHON_AI_URL").unwrap_or_else(|_| "http://localhost:8000".to_string()))).await {
            Ok(_) => tracing::debug!("AI Service Heartbeat: OK"),
            Err(e) => tracing::warn!("AI Service Heartbeat: FAILED - {}", e),
        }
    }
}
