use crate::ai_client::IndicatorData;
use crate::database::models::Candle;
use ta::indicators::{ExponentialMovingAverage as Ema, RelativeStrengthIndex as Rsi, MovingAverageConvergenceDivergence as Macd};
use ta::Next;

pub fn calculate_indicators(candles: &[Candle]) -> IndicatorData {
    if candles.is_empty() {
        return IndicatorData {
            rsi: None,
            ema_20: None,
            ema_50: None,
            ema_200: None,
            macd_value: None,
            macd_signal: None,
            macd_hist: None,
        };
    }

    let closes: Vec<f64> = candles.iter().map(|c| c.close.to_64().unwrap_or(0.0)).collect();

    // 1. RSI (14)
    let mut rsi_ind = Rsi::new(14).unwrap();
    let rsi_val = closes.iter().map(|&c| rsi_ind.next(c)).last();

    // 2. EMAs (20, 50, 200)
    let mut ema20_ind = Ema::new(20).unwrap();
    let mut ema50_ind = Ema::new(50).unwrap();
    let mut ema200_ind = Ema::new(200).unwrap();

    let ema20_val = closes.iter().map(|&c| ema20_ind.next(c)).last();
    let ema50_val = closes.iter().map(|&c| ema50_ind.next(c)).last();
    let ema200_val = closes.iter().map(|&c| ema200_ind.next(c)).last();

    // 3. MACD (12, 26, 9)
    let mut macd_ind = Macd::new(12, 26, 9).unwrap();
    let macd_res = closes.iter().map(|&c| macd_ind.next(c)).last();

    IndicatorData {
        rsi: rsi_val,
        ema_20: ema20_val,
        ema_50: ema50_val,
        ema_200: ema200_val,
        macd_value: macd_res.map(|r| r.macd),
        macd_signal: macd_res.map(|r| r.signal),
        macd_hist: macd_res.map(|r| r.histogram),
    }
}

// Extension trait to convert BigDecimal to f64 for ta crate
trait ToF64 {
    fn to_64(&self) -> Option<f64>;
}

impl ToF64 for bigdecimal::BigDecimal {
    fn to_64(&self) -> Option<f64> {
        self.to_string().parse::<f64>().ok()
    }
}
