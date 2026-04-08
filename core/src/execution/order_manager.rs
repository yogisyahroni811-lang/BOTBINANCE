use crate::execution::binance_client::BinanceClient;
use crate::telegram::notifier::TelegramNotifier;
use crate::ai_client::SignalResponse;
use anyhow::Result;
use tracing::{info, warn, error};
use std::sync::Arc;

pub struct OrderManager {
    client: BinanceClient,
    notifier: Option<Arc<TelegramNotifier>>,
}

impl OrderManager {
    pub fn new(notifier: Option<Arc<TelegramNotifier>>) -> Self {
        Self {
            client: BinanceClient::default(),
            notifier,
        }
    }

    pub async fn execute_signal(&self, symbol: &str, signal: &SignalResponse) -> Result<()> {
        if !signal.valid || signal.action == "WAIT" {
            warn!("Skipping execution: Signal invalid or WAIT action");
            return Ok(());
        }

        info!("Executing signal for {}: Action={}, Entry={}", symbol, signal.action, signal.entry);
        
        let side = if signal.action == "LONG" { "BUY" } else { "SELL" };
        let qty = self.calculate_position_size(symbol, signal.entry, signal.sl);

        // Place Entry Order
        if let Err(e) = self.client.place_order(symbol, side, "LIMIT", qty, Some(signal.entry)).await {
            error!("Failed to place ENTRY order: {}", e);
            if let Some(n) = &self.notifier {
                n.notify_system_alert("Binance API", &format!("ENTRY failure: {}", e)).await;
            }
            return Err(e);
        }

        // Notify Telegram
        if let Some(n) = &self.notifier {
            n.notify_entry(symbol, side, signal.entry, signal.tp1, signal.tp2, signal.sl, signal.confidence as u32).await;
        }

        // Place TP1 (25% Qty)
        let tp1_qty = (qty * 0.25).round(); // Requires proper tick-size rounding ideally
        let exit_side = if side == "BUY" { "SELL" } else { "BUY" };
        if let Err(e) = self.client.place_order(symbol, exit_side, "LIMIT", tp1_qty, Some(signal.tp1)).await {
            warn!("Failed to place TP1 order: {}", e);
        }

        // Place TP2 (75% Qty)
        let tp2_qty = qty - tp1_qty;
        if let Err(e) = self.client.place_order(symbol, exit_side, "LIMIT", tp2_qty, Some(signal.tp2)).await {
            warn!("Failed to place TP2 order: {}", e);
        }

        // Place SL (Stop Market)
        // Note: Real Binance API uses STOP_MARKET and stopPrice parameter. For simplicity assuming basic params
        // Further refining on `binance_client` is needed for Stop Orders logic but we place the marker here.

        Ok(())
    }

    fn calculate_position_size(&self, _symbol: &str, entry: f64, sl: f64) -> f64 {
        // Standardized to 1% Risk of a hypotyhetical $1000 balance for now.
        // Needs complete implementation against `risk/manager.rs` DB.
        let risk_amount = 10.0;
        let diff = (entry - sl).abs();
        if diff == 0.0 { return 0.0 }
        let size = risk_amount / diff;
        (size * 1000.0).round() / 1000.0
    }
}
