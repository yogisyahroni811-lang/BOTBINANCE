use teloxide::{prelude::*, utils::command::BotCommands};
use sqlx::PgPool;
use tracing::{info, error};

#[derive(BotCommands, Clone)]
#[command(rename_rule = "lowercase", description = "These commands are supported:")]
pub enum Command {
    #[command(description = "Start the bot")]
    Start,
    #[command(description = "Check system status and equity")]
    Status,
    #[command(description = "List open positions")]
    Positions,
    #[command(description = "Emergency close all positions!")]
    Emergency,
    #[command(description = "Show help menu")]
    Help,
}

pub async fn spawn_bot(token: String, pool: PgPool) {
    let bot = Bot::new(token);
    
    // Start dispatcher
    info!("Starting Telegram Dispatcher...");
    let handler = Update::filter_message()
        .filter_command::<Command>()
        .endpoint(answer);

    tokio::spawn(async move {
        Dispatcher::builder(bot, handler)
            .dependencies(dptree::deps![pool])
            .default_handler(|upd| async move {
                tracing::warn!("Unhandled update: {:?}", upd);
            })
            .error_handler(LoggingErrorHandler::with_custom_text("An error has occurred in the dispatcher"))
            .enable_ctrlc_handler()
            .build()
            .dispatch()
            .await;
    });
}

async fn answer(bot: Bot, msg: Message, cmd: Command, pool: PgPool) -> ResponseResult<()> {
    // Only allow authorized users based on TELEGRAM_CHAT_ID but for now just respond.
    // In production we should verify msg.chat.id equals the env variable
    let chat_id = std::env::var("TELEGRAM_CHAT_ID").unwrap_or_default();
    if msg.chat.id.to_string() != chat_id && !chat_id.is_empty() {
        error!("Unauthorized access attempt from chat ID: {}", msg.chat.id);
        return Ok(());
    }

    match cmd {
        Command::Start => {
            bot.send_message(msg.chat.id, "🤖 Welcome to BotBinance Quant Engine!").await?;
        }
        Command::Help => {
            bot.send_message(msg.chat.id, Command::descriptions().to_string()).await?;
        }
        Command::Status => {
            // Later: Ping the execution module for equity
            bot.send_message(msg.chat.id, "📊 Status: All Systems Operational (Simulation)").await?;
        }
        Command::Positions => {
            // Later: Query open positions from Postgres
            bot.send_message(msg.chat.id, "📈 Active Positions: None").await?;
        }
        Command::Emergency => {
            bot.send_message(msg.chat.id, "⚠️ EMERGENCY SIGNAL RECEIVED. Attempting to close all positions...").await?;
            // Later: Call execution::close_all_positions()
        }
    };
    Ok(())
}
