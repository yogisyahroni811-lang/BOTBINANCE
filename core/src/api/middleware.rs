use axum::http::Method;
use tower_http::cors::{Any, CorsLayer};
// use tower::limit::RateLimitLayer;
use std::time::Duration;

pub fn cors() -> CorsLayer {
    CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers(Any)
}

// NOTE: For true IP-based rate limiting in production, use `tower_governor`.
// For now, we apply a global rate limit per service connection via axum's tower integraton in mod.rs.
