use crate::execution::binance_client::BinanceClient;
use crate::telegram::notifier::TelegramNotifier;
use crate::ai_client::SignalResponse;
use crate::database::repository::{TradesRepo, SystemRepo};
use crate::database::models::Trade;
use anyhow::Result;
use bigdecimal::BigDecimal;
use chrono::Utc;
use tracing::{info, warn, error};
use std::sync::Arc;

pub struct OrderManager {
    client: BinanceClient,
    repo: Arc<TradesRepo>,
    system_repo: Arc<SystemRepo>,
    notifier: Option<Arc<TelegramNotifier>>,
}

impl OrderManager {
    pub fn new(
        repo: Arc<TradesRepo>, 
        system_repo: Arc<SystemRepo>,
        notifier: Option<Arc<TelegramNotifier>>
    ) -> Self {
        Self {
            client: BinanceClient::default(),
            repo,
            system_repo,
            notifier,
        }
    }

    pub async fn execute_signal(&self, symbol: &str, signal: &SignalResponse) -> Result<()> {
        if !signal.valid || signal.action == "WAIT" {
            warn!("Skipping execution: Signal invalid or WAIT action");
            return Ok(());
        }

        // 1. Check Global Trading Settings
        let is_live = self.system_repo.get_setting("is_live_trading").await?
            .map(|v| v == "true")
            .unwrap_or(false);

        info!("Signal received for {}. Trading Mode: {}", symbol, if is_live { "LIVE" } else { "PAPER" });

        let side = if signal.action == "LONG" { "BUY" } else { "SELL" };
        let qty = self.calculate_position_size(symbol, signal.entry, signal.sl);

        let mut sl_order_id = None;
        let mut tp1_id = None;
        let mut tp2_id = None;

        if is_live {
            // --- LIVE EXECUTION VIA BINANCE ---
            let ticker = self.client.get_symbol_ticker(symbol).await?;
            let best_bid: f64 = ticker["bidPrice"].as_str().unwrap_or("0").parse().unwrap_or(0.0);
            let best_ask: f64 = ticker["askPrice"].as_str().unwrap_or("0").parse().unwrap_or(0.0);
            let spread_pct = (best_ask - best_bid) / best_bid * 100.0;
            
            let current_price = if side == "BUY" { best_ask } else { best_bid };
            let price_diff_pct = ((current_price - signal.entry) / signal.entry * 100.0).abs();
            
            let mut execution_mode = "LIMIT";
            let mut entry_price = Some(signal.entry);

            if signal.confidence > 85.0 && spread_pct < 0.05 && price_diff_pct < 0.2 {
                execution_mode = "MARKET";
                entry_price = None;
            }

            let entry_res = self.client.place_order(symbol, side, execution_mode, qty, entry_price).await?;
            info!("LIVE ENTRY ({}) placed for {}: {:?}", execution_mode, symbol, entry_res);

            let sl_side = if side == "BUY" { "SELL" } else { "BUY" };
            let sl_res = self.client.place_stop_order(symbol, sl_side, qty, signal.sl).await?;
            sl_order_id = sl_res["orderId"].as_i64().map(|id| id.to_string());

            let tp1_qty = (qty * 0.25).round();
            let exit_side = if side == "BUY" { "SELL" } else { "BUY" };
            let tp1_res = self.client.place_order(symbol, exit_side, "LIMIT", tp1_qty, Some(signal.tp1)).await.ok();
            tp1_id = tp1_res.and_then(|r| r["orderId"].as_i64()).map(|id| id.to_string());

            let tp2_qty = qty - tp1_qty;
            let tp2_res = self.client.place_order(symbol, exit_side, "LIMIT", tp2_qty, Some(signal.tp2)).await.ok();
            tp2_id = tp2_res.and_then(|r| r["orderId"].as_i64()).map(|id| id.to_string());
        } else {
            // --- PAPER TRADING SIMULATION ---
            sl_order_id = Some(format!("PAPER_SL_{}", Utc::now().timestamp()));
            tp1_id = Some(format!("PAPER_TP1_{}", Utc::now().timestamp()));
            tp2_id = Some(format!("PAPER_TP2_{}", Utc::now().timestamp()));
            info!("PAPER TRADE simulated for {}. No real orders sent.", symbol);
        }

        // Notify Telegram
        if let Some(n) = &self.notifier {
            n.notify_entry(symbol, side, signal.entry, signal.tp1, signal.tp2, signal.sl, signal.confidence as u32).await;
        }

        // PERSIST TO DATABASE
        let trade = Trade {
            id: 0,
            symbol_id: 1, // Placeholder
            entry_timeframe: "1H".to_string(), // Placeholder
            entry_time: Utc::now(),
            entry_price: BigDecimal::from_utf8(signal.entry.to_string().as_bytes()).unwrap(),
            direction: signal.action.clone(),
            size_usd: BigDecimal::from_utf8((qty * signal.entry).to_string().as_bytes()).unwrap(),
            leverage: 10,
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
            is_paper: !is_live,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        if let Err(e) = self.repo.save_trade(&trade).await {
            error!("Failed to save trade to database: {}", e);
        }

        Ok(())
    }

    fn calculate_position_size(&self, _symbol: &str, entry: f64, sl: f64) -> f64 {
        let risk_amount = 10.0;
        let diff = (entry - sl).abs();
        if diff == 0.0 { return 0.0 }
        let size = risk_amount / diff;
        (size * 1000.0).round() / 1000.0
    }
}
