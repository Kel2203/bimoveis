const cron = require("node-cron");
const db = require("./database");
const { buscarImoveis } = require("./scraper");
const {calcularPontuacao } = require("./ranking");
const { enviarMensagem } = require("../bot");
const { isValid } = require("./filter");


async function executarBusca() {
  console.log("🔎 Iniciando busca...");

  const imoveis = await buscarImoveis();
  console.log("📦 Total encontrados:", imoveis.length);

  let melhorImovel = null;
  let melhorScore = 0;

  for (const imovel of imoveis) {

    console.log({
  titulo: imovel.titulo,
  preco: imovel.preco,
  area: imovel.area,
  endereco: imovel.endereco
});


    if (!isValid(imovel)) continue;

    const score = calcularPontuacao(imovel);

    if (score > melhorScore) {
      melhorScore = score;
      melhorImovel = { ...imovel, score };
    }

    db.run(
      `INSERT OR IGNORE INTO imoveis (link, preco, area, score)
       VALUES (?, ?, ?, ?)`,
      [imovel.link, imovel.preco, imovel.area, score]
    );
  }

  if (melhorImovel) {
    const mensagem = `
🏆 MELHOR IMÓVEL ENCONTRADO

🏠 ${melhorImovel.titulo}
📍 ${melhorImovel.endereco || "Endereço não informado"}
💰 R$ ${melhorImovel.preco.toLocaleString("pt-BR")}
📐 ${melhorImovel.area} m²
📊 Score: ${melhorImovel.score}

🔗 ${melhorImovel.link}
    `;

    console.log("📤 Enviando para Telegram...");
    await enviarMensagem(mensagem);
  } else {
    console.log("⚠️ Nenhum imóvel passou no filtro.");
  }
}



cron.schedule("0 9,21 * * *", executarBusca);

// Executa ao iniciar
executarBusca();

module.exports = { executarBusca };
