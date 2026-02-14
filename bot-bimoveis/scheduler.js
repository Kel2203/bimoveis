const cron = require("node-cron");
const db = require("./database");
const { buscarImoveis } = require("./scraper");
const { isValid } = require("./filter");
const { calculateScore } = require("./ranking");
const { enviarMensagem } = require("./bot");

async function executarBusca() {
  console.log("🔎 Iniciando busca...");

  const imoveis = await buscarImoveis();

  console.log("📦 Total encontrados na API:", imoveis.length);

  for (const imovel of imoveis) {
    console.log("➡️ Testando:", imovel.titulo);

    if (!isValid(imovel)) {
      console.log("❌ Não passou no filtro");
      continue;
    }

    console.log("✅ Passou no filtro");

    const score = calculateScore(imovel);
    db.run(
      `INSERT OR IGNORE INTO imoveis (link, preco, area, score)
       VALUES (?, ?, ?, ?)`,
      [imovel.link, imovel.preco, imovel.area, score],
      function (err) {
        if (!err && this.changes > 0) {
          enviarMensagem(`
🏠 Novo Imóvel Encontrado!

📍 ${imovel.regiao}
💰 R$ ${imovel.preco}
📐 ${imovel.area}m²
📊 Score: ${score}

🔗 ${imovel.link}
          `);
        }
      }
    );
  }
}

cron.schedule("0 */6 * * *", executarBusca);
executarBusca();
module.exports = { executarBusca };



