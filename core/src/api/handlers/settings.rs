use axum::{
    extract::{Path, State},
    Json,
};
use serde::{Deserialize, Serialize};
use crate::api::error::ApiError;
use crate::api::state::AppState;
use sqlx::FromRow;

#[derive(Serialize, Deserialize, FromRow)]
pub struct Setting {
    pub key: String,
    pub value: String,
    pub category: String,
    pub description: Option<String>,
}

#[derive(Deserialize)]
pub struct UpdateSettingRequest {
    pub value: String,
}

pub async fn get_settings(State(state): State<AppState>) -> Result<Json<Vec<Setting>>, ApiError> {
    let mut settings = sqlx::query_as::<_, Setting>("SELECT key, value, category, description FROM bot_settings ORDER BY category, key")
        .fetch_all(&state.db_pool)
        .await
        .map_err(|e: sqlx::Error| ApiError::InternalServerError(e.to_string()))?;

    // Mask sensitive values
    for setting in settings.iter_mut() {
        if (setting.key == "binance_api_secret" || setting.key == "binance_api_key" || setting.key == "ai_api_key") && !setting.value.is_empty() {
             setting.value = "********".to_string();
        }
    }

    Ok(Json(settings))
}

use crate::database::encryption::EncryptionService;

pub async fn update_setting(
    State(state): State<AppState>,
    Path(key): Path<String>,
    Json(payload): Json<UpdateSettingRequest>,
) -> Result<Json<()>, ApiError> {
    let mut value = payload.value;

    // Encrypt sensitive keys
    if (key == "ai_api_key" || key == "binance_api_key" || key == "binance_api_secret") && !value.is_empty() && value != "********" {
        let encryption = EncryptionService::new();
        value = encryption.encrypt(&value);
    }

    sqlx::query("UPDATE bot_settings SET value = $1, updated_at = NOW() WHERE key = $2")
        .bind(value)
        .bind(key)
        .execute(&state.db_pool)
        .await
        .map_err(|e| ApiError::InternalServerError(e.to_string()))?;

    Ok(Json(()))
}
