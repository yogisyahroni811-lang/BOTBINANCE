use anyhow::{Result, bail};
use serde::Serialize;
use tracing::warn;

#[derive(Serialize)]
pub struct RiskState {
    pub daily_loss_pct: f64,
    pub open_positions: usize,
    pub max_equity_risk: f64,
}

pub struct RiskManager {
    max_positions: usize,
    max_daily_loss_pct: f64,
    risk_per_trade_pct: f64,
}

impl Default for RiskManager {
    fn default() -> Self {
        Self {
            max_positions: 3,
            max_daily_loss_pct: 3.0,
            risk_per_trade_pct: 1.0,
        }
    }
}

impl RiskManager {
    pub fn new(max_pos: usize, max_daily_loss: f64, risk_pct: f64) -> Self {
        Self {
            max_positions: max_pos,
            max_daily_loss_pct: max_daily_loss,
            risk_per_trade_pct: risk_pct,
        }
    }

    /// Evaluates if a trade can be taken against strict hard limits
    pub fn check_hard_limits(&self, state: &RiskState) -> Result<()> {
        if state.open_positions >= self.max_positions {
            warn!("Risk check failed: Max open positions reached ({}).", self.max_positions);
            bail!("MAX_POSITIONS_REACHED");
        }
        
        if state.daily_loss_pct >= self.max_daily_loss_pct {
            warn!("Risk check failed: Daily loss circuit breaker triggered ({}%).", state.daily_loss_pct);
            bail!("DAILY_CIRCUIT_BREAKER");
        }

        Ok(())
    }

    /// Safely calculate position size in base currency
    pub fn calculate_position_size(&self, equity: f64, entry_price: f64, stop_loss: f64) -> f64 {
        if entry_price <= 0.0 || stop_loss <= 0.0 || equity <= 0.0 {
            return 0.0;
        }

        let risk_amount = equity * (self.risk_per_trade_pct / 100.0);
        let distance_per_coin = (entry_price - stop_loss).abs();

        if distance_per_coin == 0.0 {
            return 0.0;
        }

        let size = risk_amount / distance_per_coin;
        // Truncate to 3 decimal places
        (size * 1000.0).trunc() / 1000.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_position_sizing() {
        let risk = RiskManager::default(); // 1% risk
        let size = risk.calculate_position_size(10000.0, 50000.0, 48000.0);
        // Risk = 10000 * 0.01 = $100
        // Price diff = $2000
        // Size = 100 / 2000 = 0.05 BTC
        assert_eq!(size, 0.05);

        let size2 = risk.calculate_position_size(1000.0, 100.0, 90.0);
        // Risk = 1000 * 0.01 = $10
        // Diff = $10
        // Size = 1.0
        assert_eq!(size2, 1.0);
    }

    #[test]
    fn test_hard_limits() {
        let risk = RiskManager::default();
        let state1 = RiskState { daily_loss_pct: 1.5, open_positions: 2, max_equity_risk: 1.0 };
        assert!(risk.check_hard_limits(&state1).is_ok());

        let state2 = RiskState { daily_loss_pct: 3.5, open_positions: 1, max_equity_risk: 1.0 };
        assert!(risk.check_hard_limits(&state2).is_err()); // circuit breaker
    }
}
