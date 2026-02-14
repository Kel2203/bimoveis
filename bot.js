const TelegramBot = require("node-telegram-bot-api");
const { TELEGRAM_TOKEN, CHAT_ID } = require("./bot-bimoveis/config");

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

function enviarMensagem(texto) {
  return bot.sendMessage(CHAT_ID, texto);
}

module.exports = { enviarMensagem };
