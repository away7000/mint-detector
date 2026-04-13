import TelegramBot from "node-telegram-bot-api";
import "dotenv/config";

const bot = new TelegramBot(process.env.BOT_TOKEN);

export async function sendAlert(msg) {
  try {
    await bot.sendMessage(process.env.CHAT_ID, msg, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
  } catch (e) {
    console.error("Telegram error:", e.message);
  }
}