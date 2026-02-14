const TelegramBot = require("node-telegram-bot-api");
const { TELEGRAM_TOKEN, CHAT_ID } = require("./config");

const bot = new TelegramBot(TELEGRAM_TOKEN);

function enviarMensagem(texto) {
  bot.sendMessage(CHAT_ID, texto);
}

module.exports = { enviarMensagem };
