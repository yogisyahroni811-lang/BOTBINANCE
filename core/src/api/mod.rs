pub mod handlers;
pub mod middleware;
pub mod error;
pub mod state;

use axum::{
    routing::{get, post, delete},
    Router, Json,
};
use serde::Serialize;
use tower_http::trace::TraceLayer;
use std::net::SocketAddr;
use tracing::info;
use sqlx::postgres::PgPoolOptions;

use state::AppState;

#[derive(Serialize)]
pub struct HealthResponse {
    status: String,
    version: String,
    binance: String,
    ai_service: String,
}

async fn health_check(
    State(state): State<AppState>,
) -> Json<HealthResponse> {
    // Check Binance with dynamic config
    let binance_status = match crate::execution::binance_client::BinanceClient::from_db(&state.db_pool).await {
        Ok(client) => {
            if client.key.is_empty() {
                "CONFIG_REQUIRED"
            } else {
                match client.get_exchange_info().await {
                    Ok(_) => "CONNECTED",
                    Err(_) => "CONNECTION_ERROR",
                }
            }
        },
        Err(_) => "DB_ERROR",
    };

    // Check AI Service
    let ai_url = std::env::var("PYTHON_AI_URL").unwrap_or_else(|_| "http://localhost:8000".to_string());
    let ai_status = match reqwest::get(format!("{}/health", ai_url)).await {
        Ok(res) if res.status().is_success() => "RUNNING",
        _ => "OFFLINE",
    };

    Json(HealthResponse {
        status: "OK".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        binance: binance_status.to_string(),
        ai_service: ai_status.to_string(),
    })
}


pub fn create_router(state: AppState) -> Router {
    let api_routes = Router::new()
        .route("/symbols", get(handlers::symbols::get_symbols).post(handlers::symbols::add_symbol))
        .route("/binance-markets", get(handlers::symbols::get_binance_markets))
        .route("/symbols/:symbol", delete(handlers::symbols::remove_symbol))
        .route("/positions", get(handlers::trades::get_positions))
        .route("/trades", get(handlers::trades::get_trades))
        .route("/performance", get(handlers::trades::get_performance))
        .route("/performance/history", get(handlers::trades::get_performance_history))
        .route("/settings", get(handlers::settings::get_settings))
        .route("/settings/:key", post(handlers::settings::update_setting)) // Using POST as patch for simplicity in some web clients
        .route("/emergency", post(handlers::emergency::trigger_emergency))
        .route("/signals", get(handlers::signals::get_active_signals))
        .route("/klines/:symbol/:interval", get(handlers::symbols::get_klines))
        .route("/account/balance", get(handlers::trades::get_account_balance))
        .route("/sse", get(handlers::sse::sse_handler));

    Router::new()
        .route("/health", get(health_check))
        .nest("/api/v1", api_routes)
        .with_state(state) // Pass state to routes
        .layer(middleware::cors())
        .layer(TraceLayer::new_for_http())
}

pub async fn start_server(
    port: u16, 
    pool: sqlx::PgPool, 
    sync_tx: tokio::sync::mpsc::Sender<crate::analysis::sync_engine::SyncEvent>,
    binance_client: std::sync::Arc<crate::execution::binance_client::BinanceClient>
) {
    let state = AppState::new(pool, sync_tx, binance_client);
    let app = create_router(state);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    
    info!("REST API active on {}", addr);
    
    if let Ok(listener) = tokio::net::TcpListener::bind(&addr).await {
        if let Err(e) = axum::serve(listener, app).await {
            tracing::error!("Server error: {}", e);
        }
    } else {
        tracing::error!("Failed to bind to port {}", port);
    }
}
