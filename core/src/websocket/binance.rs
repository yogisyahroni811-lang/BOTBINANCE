use futures_util::stream::StreamExt;
use tokio_tungstenite::connect_async;
use tokio_tungstenite::tungstenite::Message;
use tracing::{info, warn, error};
use serde::Deserialize;

#[derive(Deserialize, Debug)]
pub struct KlineEvent {
    pub e: String, // Event type
    pub s: String, // Symbol
    pub k: KlineData,
}

#[derive(Deserialize, Debug)]
#[allow(non_snake_case)]
pub struct KlineData {
    pub t: i64,    // Kline start time
    pub T: i64,    // Kline close time
    pub s: String, // Symbol
    pub i: String, // Interval
    pub o: String, // Open price
    pub h: String, // High price
    pub l: String, // Low price
    pub c: String, // Close price
    pub v: String, // Base asset volume
    pub x: bool,   // Is this kline closed?
}

pub async fn run_binance_ws(url: String, symbols: Vec<String>, intervals: Vec<String>) {
    let mut streams = Vec::new();
    for s in &symbols {
        let sym = s.to_lowercase();
        for i in &intervals {
            streams.push(format!("{}@kline_{}", sym, i));
        }
    }
    
    let stream_url = format!("{}?streams={}", url, streams.join("/"));
    info!("Connecting to Binance WS: {}", stream_url);

    loop {
        match connect_async(&stream_url).await {
            Ok((ws_stream, _)) => {
                info!("Connected to Binance WebSocket");
                let (_, mut read) = ws_stream.split();

                while let Some(msg) = read.next().await {
                    match msg {
                        Ok(Message::Text(text)) => {
                            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&text) {
                                if let Some(data) = json.get("data") {
                                    if let Ok(kline_ev) = serde_json::from_value::<KlineEvent>(data.clone()) {
                                        if kline_ev.k.x {
                                            info!(
                                                "Candle closed: {} {} - O:{} H:{} L:{} C:{}", 
                                                kline_ev.s, kline_ev.k.i, 
                                                kline_ev.k.o, kline_ev.k.h, kline_ev.k.l, kline_ev.k.c
                                            );
                                            // TODO: Convert to models::Candle and push to rolling buffer
                                        }
                                    }
                                }
                            }
                        }
                        Ok(Message::Close(_)) => {
                            warn!("WebSocket closed by server, reconnecting...");
                            break;
                        }
                        Err(e) => {
                            error!("WebSocket read error: {}", e);
                            break;
                        }
                        _ => {}
                    }
                }
            }
            Err(e) => {
                error!("WebSocket connection error: {}. Retrying in 5 seconds...", e);
            }
        }
        
        tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
    }
}
