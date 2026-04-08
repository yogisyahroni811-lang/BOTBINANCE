use crate::execution::binance_client::BinanceClient;
use crate::telegram::notifier::TelegramNotifier;
use crate::database::repository::{TradesRepo, SystemRepo};
use crate::database::models::Trade;
use crate::ai_client::AiClient;
use anyhow::Result;
use bigdecimal::{BigDecimal, ToPrimitive};
use std::sync::Arc;
use tokio::time::{sleep, Duration};
use tracing::{info, warn, error};

pub struct InvalidationMonitor {
    client: Arc<BinanceClient>,
    trades_repo: Arc<TradesRepo>,
    system_repo: Arc<SystemRepo>,
    ai_client: Arc<AiClient>,
    notifier: Option<Arc<TelegramNotifier>>,
}

impl InvalidationMonitor {
    pub fn new(
        client: Arc<BinanceClient>, 
        trades_repo: Arc<TradesRepo>,
        system_repo: Arc<SystemRepo>,
        ai_client: Arc<AiClient>,
        notifier: Option<Arc<TelegramNotifier>>
    ) -> Self {
        Self { client, trades_repo, system_repo, ai_client, notifier }
    }

    pub async fn run_loop(&self) {
        info!("Starting Invalidation Monitor...");
        loop {
            if let Err(e) = self.check_positions().await {
                error!("Invalidation Monitor Error: {}", e);
            }
            sleep(Duration::from_secs(5)).await;
        }
    }

    async fn check_positions(&self) -> Result<()> {
        let open_trades = self.trades_repo.get_open_positions().await?;
        if open_trades.is_empty() {
            return Ok(());
        }

        let settings = self.system_repo.get_all_settings().await?;
        let be_buffer = settings.get("risk_be_buffer_pct").and_then(|v| v.parse::<f64>().ok()).unwrap_or(0.05);

        for mut trade in open_trades {
            let symbol = "BTCUSDT"; // TODO: Map symbol_id to String
            let ticker = self.client.get_symbol_ticker(symbol).await?;
            let current_price: f64 = ticker["lastPrice"].as_str().unwrap_or("0").parse().unwrap_or(0.0);
            
            if current_price == 0.0 { continue; }

            let entry_price = trade.entry_price.to_f64().unwrap_or(0.0);
            let sl_price = trade.current_sl_price.as_ref().and_then(|p| p.to_f64()).unwrap_or(0.0);
            
            // 1. Logic Break-Even (RR 1:1)
            if !trade.be_triggered {
                let risk = (entry_price - sl_price).abs();
                let target_be = if trade.direction == "LONG" { entry_price + risk } else { entry_price - risk };
                
                let is_reached = if trade.direction == "LONG" { current_price >= target_be } else { current_price <= target_be };
                
                if is_reached {
                    info!("RR 1:1 Reached for {}. Moving SL to Break-Even...", symbol);
                    let new_sl = if trade.direction == "LONG" { entry_price * (1.0 + be_buffer/100.0) } else { entry_price * (1.0 - be_buffer/100.0) };
                    
                    // Update Binance
                    if let Some(old_id) = &trade.stop_loss_order_id {
                        let _ = self.client.cancel_order(symbol, old_id).await;
                    }
                    
                    let sl_side = if trade.direction == "LONG" { "SELL" } else { "BUY" };
                    let sl_res = self.client.place_stop_order(symbol, sl_side, trade.size_usd.to_f64().unwrap_or(0.0)/entry_price, new_sl).await?;
                    
                    // Update DB
                    trade.be_triggered = true;
                    trade.stop_loss_order_id = sl_res["orderId"].as_i64().map(|id| id.to_string());
                    trade.current_sl_price = Some(BigDecimal::from_utf8(new_sl.to_string().as_bytes()).unwrap());
                    self.trades_repo.update_trade(&trade).await?;
                    
                    if let Some(n) = &self.notifier {
                        n.notify_system_alert("RiskManager", &format!("🛡️ SL moved to BE (+{:.2}%) for {}", be_buffer, symbol)).await;
                    }
                }
            }

            // 2. Logic Trailing Stop (Dynamic Price Follower)
            // Move SL if price is in profit and moving further up/down
            let is_in_profit = if trade.direction == "LONG" { current_price > entry_price } else { current_price < entry_price };
            
            if is_in_profit {
                let current_sl = trade.current_sl_price.as_ref().and_then(|p| p.to_f64()).unwrap_or(0.0);
                let tsl_buffer = 0.01; // 1% trailing buffer - should be configurable
                
                let should_move_tsl = if trade.direction == "LONG" {
                    current_price * (1.0 - tsl_buffer) > current_sl
                } else {
                    current_price * (1.0 + tsl_buffer) < current_sl
                };

                if should_move_tsl {
                    let new_tsl = if trade.direction == "LONG" { current_price * (1.0 - tsl_buffer) } else { current_price * (1.0 + tsl_buffer) };
                    info!("Trailing SL triggered for {}: Moving to {}", symbol, new_tsl);
                    
                    if let Some(old_id) = &trade.stop_loss_order_id {
                        let _ = self.client.cancel_order(symbol, old_id).await;
                    }
                    
                    let sl_side = if trade.direction == "LONG" { "SELL" } else { "BUY" };
                    let sl_res = self.client.place_stop_order(symbol, sl_side, trade.size_usd.to_f64().unwrap_or(0.0)/entry_price, new_tsl).await?;
                    
                    trade.stop_loss_order_id = sl_res["orderId"].as_i64().map(|id| id.to_string());
                    trade.current_sl_price = Some(BigDecimal::from_utf8(new_tsl.to_string().as_bytes()).unwrap());
                    trade.trailing_sl_active = true;
                    self.trades_repo.update_trade(&trade).await?;
                }
            }

            // 3. Logic Reversal Detection (AI Polling)
            // For now, let's check reversal if price is stalling or just periodically
            if Utc::now().timestamp() % 300 == 0 { // Every 5 minutes effectively
                if let Ok(signal) = self.ai_client.get_signal(symbol, "1H").await {
                    let is_reversal = (trade.direction == "LONG" && signal.action == "SHORT") || 
                                    (trade.direction == "SHORT" && signal.action == "LONG");
                    
                    if is_reversal && signal.valid {
                        info!("🔄 REVERSAL DETECTED for {}: Signal is {}", symbol, signal.action);
                        
                        // Close current position
                        let close_side = if trade.direction == "LONG" { "SELL" } else { "BUY" };
                        let _ = self.client.close_position(symbol, close_side).await;
                        
                        // Notify
                        if let Some(n) = &self.notifier {
                            n.notify_system_alert("ReversalEngine", &format!("🔄 Closing position for {} and reversing to {}", symbol, signal.action)).await;
                        }
                        
                        // Mark trade as COMPLETED
                        trade.outcome = Some("REVERSAL_EXIT".to_string());
                        trade.exit_price = Some(BigDecimal::from_utf8(current_price.to_string().as_bytes()).unwrap());
                        trade.exit_time = Some(Utc::now());
                        self.trades_repo.update_trade(&trade).await?;
                        
                        // Trigger re-entry (this is handled by main signals usually, but here we can force it)
                    }
                }
            }
        }
        
        Ok(())
    }
}
