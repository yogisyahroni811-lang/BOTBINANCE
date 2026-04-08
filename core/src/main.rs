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

    // TODO: Initialize internal buffer and channels
    // TODO: Spawn Websocket listener (Binance)
    // TODO: Spawn AI Analysis routine
    // TODO: Spawn Execution engine
    // TODO: Spawn Axum Server for REST API endpoints
    let api_pool = pool.clone();
    tokio::spawn(async move {
        let port = std::env::var("PORT").unwrap_or_else(|_| "3000".to_string()).parse().unwrap_or(3000);
        api::start_server(port, api_pool).await;
    });
    
    if let Some(token) = telegram_token {
        info!("Telegram bot token found, initializing bot routine...");
        // telegram::spawn_bot(token).await;
    }

    loop {
        tokio::time::sleep(tokio::time::Duration::from_secs(60)).await;
        // Keep main alive or wait on task queues
    }
}
