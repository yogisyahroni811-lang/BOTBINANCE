use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

#[derive(Debug)]
pub enum ApiError {
    InternalServerError(String),
    BadRequest(String),
    NotFound(String),
    RateLimited,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, title, detail) = match self {
            ApiError::InternalServerError(msg) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Internal Server Error",
                msg,
            ),
            ApiError::BadRequest(msg) => (StatusCode::BAD_REQUEST, "Bad Request", msg),
            ApiError::NotFound(msg) => (StatusCode::NOT_FOUND, "Not Found", msg),
            ApiError::RateLimited => (
                StatusCode::TOO_MANY_REQUESTS,
                "Too Many Requests",
                "Rate limit exceeded. Please try again later.".to_string(),
            ),
        };

        let body = Json(json!({
            "type": "about:blank",
            "title": title,
            "status": status.as_u16(),
            "detail": detail
        }));

        (status, body).into_response()
    }
}
