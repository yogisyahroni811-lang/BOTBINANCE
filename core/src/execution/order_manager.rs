use crate::execution::binance_client::BinanceClient;
use crate::telegram::notifier::TelegramNotifier;
use crate::ai_client::SignalResponse;
use crate::database::repository::TradesRepo;
use crate::database::models::Trade;
use anyhow::Result;
use bigdecimal::BigDecimal;
use chrono::Utc;
use tracing::{info, warn, error};
use std::sync::Arc;

pub struct OrderManager {
    client: BinanceClient,
    repo: Arc<TradesRepo>,
    notifier: Option<Arc<TelegramNotifier>>,
}

impl OrderManager {
    pub fn new(repo: Arc<TradesRepo>, notifier: Option<Arc<TelegramNotifier>>) -> Self {
        Self {
            client: BinanceClient::default(),
            repo,
            notifier,
        }
    }

    pub async fn execute_signal(&self, symbol: &str, signal: &SignalResponse) -> Result<()> {
        if !signal.valid || signal.action == "WAIT" {
            warn!("Skipping execution: Signal invalid or WAIT action");
            return Ok(());
        }

        // Advanced Spread Check
        let ticker = self.client.get_symbol_ticker(symbol).await?;
        let best_bid: f64 = ticker["bidPrice"].as_str().unwrap_or("0").parse().unwrap_or(0.0);
        let best_ask: f64 = ticker["askPrice"].as_str().unwrap_or("0").parse().unwrap_or(0.0);
        let spread_pct = (best_ask - best_bid) / best_bid * 100.0;
        
        info!("Market for {}: Bid={}, Ask={}, Spread={:.4}%", symbol, best_bid, best_ask, spread_pct);

        let side = if signal.action == "LONG" { "BUY" } else { "SELL" };
        let qty = self.calculate_position_size(symbol, signal.entry, signal.sl);
        
        // --- HYBRID DYNAMIC ENTRY LOGIC ---
        let current_price = if side == "BUY" { best_ask } else { best_bid };
        let signal_entry = signal.entry;
        let price_diff_pct = ((current_price - signal_entry) / signal_entry * 100.0).abs();
        
        let mut execution_mode = "LIMIT";
        let mut entry_price = Some(signal_entry);

        // Aggrersive Entry Conditions: High confidence + thin spread + close to entry price
        if signal.confidence > 85.0 && spread_pct < 0.05 && price_diff_pct < 0.2 {
            info!("HYBRID: High confidence ({:.1}%) detected. Switching to MARKET entry to prevent missed breakout.", signal.confidence);
            execution_mode = "MARKET";
            entry_price = None; // Market orders don't use price
        } else if price_diff_pct > 0.5 {
            warn!("HYBRID: Price already far from AI target ({:.2}% diff). Forcing LIMIT to avoid bad entry.", price_diff_pct);
        }

        // Place Entry Order
        let entry_res = self.client.place_order(symbol, side, execution_mode, qty, entry_price).await?;
        info!("ENTRY ({}) order placed for {}: {:?}", execution_mode, symbol, entry_res);

        // Place SL (Stop Market)
        let sl_side = if side == "BUY" { "SELL" } else { "BUY" };
        let sl_res = self.client.place_stop_order(symbol, sl_side, qty, signal.sl).await?;
        let sl_order_id = sl_res["orderId"].as_i64().map(|id| id.to_string());
        info!("STOP LOSS order placed for {}: {:?}", symbol, sl_res);

        // Notify Telegram
        if let Some(n) = &self.notifier {
            n.notify_entry(symbol, side, signal.entry, signal.tp1, signal.tp2, signal.sl, signal.confidence as u32).await;
        }

        // Place TP1 (25% Qty)
        let tp1_qty = (qty * 0.25).round();
        let exit_side = if side == "BUY" { "SELL" } else { "BUY" };
        let tp1_res = self.client.place_order(symbol, exit_side, "LIMIT", tp1_qty, Some(signal.tp1)).await.ok();
        let tp1_id = tp1_res.and_then(|r| r["orderId"].as_i64()).map(|id| id.to_string());

        // Place TP2 (75% Qty)
        let tp2_qty = qty - tp1_qty;
        let tp2_res = self.client.place_order(symbol, exit_side, "LIMIT", tp2_qty, Some(signal.tp2)).await.ok();
        let tp2_id = tp2_res.and_then(|r| r["orderId"].as_i64()).map(|id| id.to_string());

        // PERSIST TO DATABASE
        let trade = Trade {
            id: 0,
            symbol_id: 1, // Placeholder: Need real symbol ID mapping
            entry_timeframe: "1H".to_string(), // Placeholder
            entry_time: Utc::now(),
            entry_price: BigDecimal::from_utf8(signal.entry.to_string().as_bytes()).unwrap(),
            direction: signal.action.clone(),
            size_usd: BigDecimal::from_utf8((qty * signal.entry).to_string().as_bytes()).unwrap(),
            leverage: 10, // Placeholder
            setup_type: "AI_SIGNAL".to_string(),
            grade_at_entry: Some("A".to_string()),
            stop_loss_order_id: sl_order_id,
            tp1_order_id: tp1_id,
            tp2_order_id: tp2_id,
            be_triggered: false,
            trailing_sl_active: false,
            initial_sl_price: Some(BigDecimal::from_utf8(signal.sl.to_string().as_bytes()).unwrap()),
            current_sl_price: Some(BigDecimal::from_utf8(signal.sl.to_string().as_bytes()).unwrap()),
            initial_risk_usd: Some(BigDecimal::from_utf8(((signal.entry - signal.sl).abs() * qty).to_string().as_bytes()).unwrap()),
            exit_time: None,
            exit_price: None,
            exit_reason: None,
            pnl_usd: None,
            pnl_pct: None,
            outcome: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        if let Err(e) = self.repo.save_trade(&trade).await {
            error!("Failed to save trade to database: {}", e);
        }

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
