use reqwest::{Client, Method};
use hmac::{Hmac, Mac};
use sha2::Sha256;
use hex;
use std::time::{SystemTime, UNIX_EPOCH};
use anyhow::{Result, Context};
use serde_json::Value;

type HmacSha256 = Hmac<Sha256>;

pub struct BinanceClient {
    pub key: String,
    pub secret: String,
    pub base_url: String,
    client: Client,
}

impl Default for BinanceClient {
    fn default() -> Self {
        let is_testnet = std::env::var("BINANCE_TESTNET").unwrap_or_else(|_| "true".to_string()) == "true";
        let (key, secret, base_url) = if is_testnet {
            (
                std::env::var("BINANCE_TESTNET_KEY").unwrap_or_default(),
                std::env::var("BINANCE_TESTNET_SECRET").unwrap_or_default(),
                "https://testnet.binancefuture.com".to_string()
            )
        } else {
            (
                std::env::var("BINANCE_API_KEY").unwrap_or_default(),
                std::env::var("BINANCE_API_SECRET").unwrap_or_default(),
                "https://fapi.binance.com".to_string()
            )
        };
        Self::new(key, secret, base_url)
    }
}

impl BinanceClient {
    pub fn new(key: String, secret: String, base_url: String) -> Self {
        Self {
            key,
            secret,
            base_url,
            client: Client::new()
        }
    }

    fn generate_signature(&self, query: &str) -> String {
        let mut mac = HmacSha256::new_from_slice(self.secret.as_bytes()).expect("HMAC can take key of any size");
        mac.update(query.as_bytes());
        hex::encode(mac.finalize().into_bytes())
    }

    async fn send_signed_request(&self, method: Method, endpoint: &str, mut params: Vec<(&str, String)>) -> Result<Value> {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)?
            .as_millis()
            .to_string();
        
        params.push(("timestamp", timestamp));
        params.push(("recvWindow", "5000".to_string()));

        let query_string = params.into_iter()
            .map(|(k, v)| format!("{}={}", k, v))
            .collect::<Vec<String>>()
            .join("&");

        let signature = self.generate_signature(&query_string);
        let final_query = format!("{}&signature={}", query_string, signature);
        let url = format!("{}{}?{}", self.base_url, endpoint, final_query);

        let res = self.client.request(method, &url)
            .header("X-MBX-APIKEY", &self.key)
            .send()
            .await?;

        let status = res.status();
        let text = res.text().await?;

        if !status.is_success() {
            anyhow::bail!("Binance Error ({}): {}", status, text);
        }

        let json = serde_json::from_str(&text).context("Failed to parse Binance JSON response")?;
        Ok(json)
    }

    pub async fn get_account_info(&self) -> Result<Value> {
        self.send_signed_request(Method::GET, "/fapi/v2/account", vec![]).await
    }

    pub async fn get_symbol_ticker(&self, symbol: &str) -> Result<Value> {
        // Public endpoint, but for consistency using signed or just plain request
        let url = format!("{}/fapi/v1/ticker/bookTicker?symbol={}", self.base_url, symbol);
        let res = self.client.get(&url).send().await?;
        let json = res.json::<Value>().await?;
        Ok(json)
    }

    pub async fn cancel_order(&self, symbol: &str, order_id: &str) -> Result<Value> {
        self.send_signed_request(Method::DELETE, "/fapi/v1/order", vec![
            ("symbol", symbol.to_string()),
            ("orderId", order_id.to_string()),
        ]).await
    }

    pub async fn place_order(&self, symbol: &str, side: &str, type_: &str, qty: f64, price: Option<f64>) -> Result<Value> {
        let mut params = vec![
            ("symbol", symbol.to_string()),
            ("side", side.to_string()),
            ("type", type_.to_string()),
            ("quantity", qty.to_string())
        ];

        if type_ != "MARKET" {
            if let Some(p) = price {
                params.push(("price", p.to_string()));
                params.push(("timeInForce", "GTC".to_string()));
            }
        }

        self.send_signed_request(Method::POST, "/fapi/v1/order", params).await
    }

    pub async fn close_position(&self, symbol: &str, side_to_close: &str) -> Result<Value> {
        self.send_signed_request(Method::POST, "/fapi/v1/order", vec![
            ("symbol", symbol.to_string()),
            ("side", side_to_close.to_string()),
            ("type", "MARKET".to_string()),
            ("reduceOnly", "true".to_string()),
        ]).await
    }

    pub async fn place_stop_order(&self, symbol: &str, side: &str, qty: f64, stop_price: f64) -> Result<Value> {
        self.send_signed_request(Method::POST, "/fapi/v1/order", vec![
            ("symbol", symbol.to_string()),
            ("side", side.to_string()),
            ("type", "STOP_MARKET".to_string()),
            ("stopPrice", stop_price.to_string()),
            ("quantity", qty.to_string()),
            ("reduceOnly", "true".to_string()),
        ]).await
    }
}
