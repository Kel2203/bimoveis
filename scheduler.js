const cron = require("node-cron");
const db = require("./database");
const { buscarTodasAsFontes } = require("./scraper-unificado");
const { calcularPontuacao } = require("./ranking");
const { enviarMensagem } = require("./bot");
const { isValid } = require("./filter");
const { deduplicar } = require("./deduplicador");
const { debugImovel } = require("./debug-imovel");

async function executarBusca() {
  console.log("🔎 Iniciando busca de múltiplas fontes...");

  try {
    let imoveis = await buscarTodasAsFontes();
    console.log("📦 Total encontrados:", imoveis.length);

    // Log de diagnóstico dos primeiros 3 imóveis
    if (imoveis.length > 0) {
      console.log("\n📊 Amostra dos imóveis brutos encontrados:");
      for (const im of imoveis.slice(0, 3)) {
        console.log(`   - ${im.titulo?.substring(0, 40) || "SEM_TÍTULO"} | Preço: R$ ${im.preco} | Área: ${im.area}m² | Quartos: ${im.quartos}`);
      }
      console.log("");
    }

    // Remover duplicatas
    imoveis = deduplicar(imoveis);
    console.log("✅ Após deduplicação:", imoveis.length);

    const melhoresImoveis = [];
    let descartados = 0;

    for (const imovel of imoveis) {
      if (!isValid(imovel)) {
        descartados++;
        // Debug: mostrar por que foi descartado
        const motivo = [];
        if (!imovel.preco) motivo.push("sem preço");
        if (!imovel.area) motivo.push("sem área");
        if (!imovel.endereco) motivo.push("sem endereço");
        if (imovel.preco > 700000) motivo.push(`preço alto (${imovel.preco})`);
        if (imovel.area < 30) motivo.push(`área pequena (${imovel.area}m²)`);
        console.debug(`  ⛔ Descartado: ${imovel.titulo?.substring(0, 30) || "?"} - ${motivo.join(", ")}`);
        continue;
      }

      const score = calcularPontuacao(imovel);
      console.log(`  ✅ Passou no filtro: ${imovel.titulo?.substring(0, 30)} (score: ${score})`);

      if (score >= 3) { // Ajuste do threshold para 3 (mais permissivo)
        melhoresImoveis.push({ ...imovel, score });

        db.run(
          `INSERT OR IGNORE INTO imoveis 
           (link, fonte, titulo, endereco, preco, preco_anterior, area, quartos, score)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            imovel.link, 
            imovel.fonte,
            imovel.titulo,
            imovel.endereco,
            imovel.preco, 
            imovel.preco_anterior || null,
            imovel.area,
            imovel.quartos,
            score
          ]
        );
      }
    }

    console.log(`\n📊 Resumo: ${imoveis.length} imóveis, ${descartados} descartados`);

    // Ordenar por score
    melhoresImoveis.sort((a, b) => b.score - a.score);

    // Enviar os top 3
    for (const imovel of melhoresImoveis.slice(0, 3)) {
      const mensagem = `
🏆 IMÓVEL ENCONTRADO (${imovel.fonte})

🏠 ${imovel.titulo}
📍 ${imovel.endereco || "Endereço não informado"}
💰 R$ ${imovel.preco.toLocaleString("pt-BR")}
📐 ${imovel.area} m² | 🛏 ${imovel.quartos} quarto(s)
📊 Score: ${imovel.score}

🔗 ${imovel.link}
      `;

      console.log("📤 Enviando para Telegram...");
      await enviarMensagem(mensagem);
      
      // Pequeña pausa entre mensagens
      await new Promise(r => setTimeout(r, 1000));
    }

    if (melhoresImoveis.length === 0) {
      console.log("⚠️ Nenhum imóvel passou no filtro.");
    }
  } catch (error) {
    console.error("❌ Erro na busca:", error.message);
    await enviarMensagem(`⚠️ Erro na busca: ${error.message}`);
  }
}

// Executar 4x por dia (cada ~6 horas)
cron.schedule("0 7,13,18,23 * * *", executarBusca);

executarBusca();

module.exports = { executarBusca };