const { buscarImoveis: buscarOlx } = require("./scraper");


async function buscarTodasAsFontes() {
  console.log("🔎 Buscando de múltiplas fontes...");

  const olx = await buscarOlx().catch(e => {
    console.error("❌ Erro OLX:", e.message);
    return [];
  });
    console.log(`✅ OLX: ${olx.length} imóveis encontrados`);
  return olx; 
}

module.exports = { buscarTodasAsFontes };