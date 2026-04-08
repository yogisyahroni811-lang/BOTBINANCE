use reqwest::Client;
use tracing::{error, info};
use serde_json::json;

pub struct TelegramNotifier {
    bot_token: String,
    chat_id: String,
    client: Client,
}

impl TelegramNotifier {
    pub fn new() -> Option<Self> {
        let bot_token = std::env::var("TELEGRAM_BOT_TOKEN").ok()?;
        let chat_id = std::env::var("TELEGRAM_CHAT_ID").ok()?;
        
        Some(Self {
            bot_token,
            chat_id,
            client: Client::new(),
        })
    }

    async fn send_message(&self, text: &str) {
        let url = format!("https://api.telegram.org/bot{}/sendMessage", self.bot_token);
        let payload = json!({
            "chat_id": self.chat_id,
            "text": text,
            "parse_mode": "MarkdownV2"
        });

        match self.client.post(&url).json(&payload).send().await {
            Ok(resp) if resp.status().is_success() => {
                info!("Telegram notification sent successfully.");
            }
            Ok(resp) => {
                error!("Failed to send Telegram message: HTTP {}", resp.status());
            }
            Err(e) => {
                error!("Error sending Telegram message: {}", e);
            }
        }
    }

    /// Escape characters for MarkdownV2 formatting.
    fn escape(text: &str) -> String {
        text.replace("-", "\\-")
            .replace(".", "\\.")
            .replace("!", "\\!")
            .replace("(", "\\(")
            .replace(")", "\\)")
            .replace("=", "\\=")
            .replace("+", "\\+")
    }

    pub async fn notify_entry(&self, symbol: &str, side: &str, entry: f64, tp1: f64, tp2: f64, sl: f64, confidence: u32) {
        let msg = format!(
            "🎯 *ENTRY {} {}*\nEntry: ${}\nTP1: ${} \\| TP2: ${}\nSL: ${}\nConfidence: {}%\nSetup: Validated by AI",
            Self::escape(symbol),
            side,
            Self::escape(&entry.to_string()),
            Self::escape(&tp1.to_string()),
            Self::escape(&tp2.to_string()),
            Self::escape(&sl.to_string()),
            confidence
        );
        self.send_message(&msg).await;
    }

    pub async fn notify_system_alert(&self, service: &str, error_msg: &str) {
        let msg = format!(
            "🚨 *SYSTEM ALERT*\nService: {}\nError: {}",
            Self::escape(service),
            Self::escape(error_msg)
        );
        self.send_message(&msg).await;
    }
}
