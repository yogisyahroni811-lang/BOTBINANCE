use crate::database::models::{Candle, SndZone};
use bigdecimal::BigDecimal;
use chrono::Utc;

pub fn detect_zones(_candles: &[Candle]) -> Vec<SndZone> {
    // 1. Calculate Average True Range (ATR)
    // 2. Look for consolidation (base) followed by strong momentum (impulse)
    // Return detected zones.
    vec![]
}

pub fn detect_base(_candles: &[Candle], _atr: &BigDecimal) -> Option<usize> {
    // Placeholder: Look for 3+ candles with small bodies compared to ATR
    None
}

pub fn detect_impulse(_candles: &[Candle], _atr: &BigDecimal) -> Option<usize> {
     // Placeholder: Look for strong break > 1.5x ATR
     None
}

pub fn create_zone(symbol_id: i64, timeframe: String, base_high: BigDecimal, base_low: BigDecimal, is_demand: bool) -> SndZone {
     SndZone {
        id: 0,
        symbol_id,
        timeframe,
        zone_type: if is_demand { "DEMAND".to_string() } else { "SUPPLY".to_string() },
        price_high: base_high,
        price_low: base_low,
        grade: "B".to_string(),
        test_count: 0,
        is_active: true,
        created_at: Utc::now(),
        updated_at: Utc::now(),
     }
}

pub fn grade_zone(zone: &mut SndZone, test_count: i32) {
    if test_count == 0 {
        zone.grade = "A".to_string();
    } else if test_count == 1 {
        zone.grade = "B".to_string();
    } else if test_count >= 2 {
        zone.grade = "C".to_string();
    }
}

pub fn invalidate_zone(zone: &SndZone, current_price: &BigDecimal) -> bool {
    // If demand, invalidated if price closes below zone.price_low
    // If supply, invalidated if price closes above zone.price_high
    if zone.zone_type == "DEMAND" {
        current_price < &zone.price_low
    } else {
        current_price > &zone.price_high
    }
}
