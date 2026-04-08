use std::collections::{VecDeque, HashMap};
use std::sync::RwLock;
use crate::database::models::Candle;

pub struct RollingBuffer {
    data: VecDeque<Candle>,
    max_size: usize,
}

impl RollingBuffer {
    pub fn new(max_size: usize) -> Self {
        Self {
            data: VecDeque::with_capacity(max_size + 1),
            max_size,
        }
    }

    pub fn push(&mut self, candle: Candle) {
        if self.data.len() >= self.max_size {
            self.data.pop_front();
        }
        self.data.push_back(candle);
    }

    pub fn get_latest(&self, n: usize) -> Vec<Candle> {
        let count = self.data.len().min(n);
        let start = self.data.len() - count;
        self.data.range(start..).cloned().collect()
    }

    pub fn get_all(&self) -> Vec<Candle> {
        self.data.iter().cloned().collect()
    }
}

pub struct MarketState {
    buffers: RwLock<HashMap<(i64, String), RollingBuffer>>, // (symbol_id, timeframe)
    buffer_capacity: usize,
}

impl MarketState {
    pub fn new(capacity: usize) -> Self {
        Self {
            buffers: RwLock::new(HashMap::new()),
            buffer_capacity: capacity,
        }
    }

    pub fn add_candle(&self, symbol_id: i64, timeframe: String, candle: Candle) {
        let mut map = self.buffers.write().unwrap();
        let key = (symbol_id, timeframe);
        let buffer = map.entry(key).or_insert_with(|| RollingBuffer::new(self.buffer_capacity));
        buffer.push(candle);
    }

    pub fn get_candles(&self, symbol_id: i64, timeframe: &str) -> Vec<Candle> {
        let map = self.buffers.read().unwrap();
        if let Some(buf) = map.get(&(symbol_id, timeframe.to_string())) {
            buf.get_all()
        } else {
            vec![]
        }
    }
}
