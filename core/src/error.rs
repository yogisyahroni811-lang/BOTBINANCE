use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("Network error: {0}")]
    Network(#[from] reqwest::Error),
    #[error("Configuration error: {0}")]
    Config(String),
    #[error("Internal logic error: {0}")]
    Internal(String),
}

pub fn setup_panic_hook() {
    std::panic::set_hook(Box::new(|info| {
        let msg = match info.payload().downcast_ref::<&'static str>() {
            Some(s) => *s,
            None => match info.payload().downcast_ref::<String>() {
                Some(s) => &s[..],
                None => "Box<dyn Any>",
            },
        };

        let location = info.location().unwrap_or_else(|| std::panic::Location::caller());
        let panic_msg = format!("Panic occurred in file '{}' at line {}: {}", location.file(), location.line(), msg);
        
        tracing::error!("CRITICAL FAILURE: {}", panic_msg);
    }));
}
