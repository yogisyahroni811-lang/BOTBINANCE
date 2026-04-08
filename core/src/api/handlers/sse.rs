use axum::{
    extract::State,
    response::sse::{Event, Sse},
};
use futures::stream::{self, Stream};
use std::convert::Infallible;
use tokio_stream::StreamExt;
use crate::api::state::AppState;

pub async fn sse_handler(
    State(state): State<AppState>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let mut rx = state.tx_sse.subscribe();

    let stream = stream::unfold(rx, |mut rx| async move {
        match rx.recv().await {
            Ok(msg) => {
                let event = Event::default().data(msg);
                Some((Ok(event), rx))
            }
            Err(_) => None, // Channel closed or lag
        }
    });

    Sse::new(stream).keep_alive(axum::response::sse::KeepAlive::default())
}
