/**
 * Script de teste isolado para debugar scraping
 */

const { buscarImoveis } = require("./scraper");

async function testarScraper() {
  console.log("🧪 Iniciando teste isolado do scraper OLX...\n");
  
  try {
    const imoveis = await buscarImoveis();
    
    console.log(`\n✅ Total de imóveis extraídos: ${imoveis.length}\n`);
    
    if (imoveis.length === 0) {
      console.log("❌ Nenhum imóvel foi extraído!");
      return;
    }

    console.log("📋 Primeiros 5 imóveis encontrados:\n");
    for (let i = 0; i < Math.min(5, imoveis.length); i++) {
      const im = imoveis[i];
      console.log(`${i + 1}. Título: ${im.titulo?.substring(0, 50) || "SEM TÍTULO"}`);
      console.log(`   Preço: R$ ${im.preco?.toLocaleString('pt-BR') || "N/A"}`);
      console.log(`   Área: ${im.area}m²`);
      console.log(`   Quartos: ${im.quartos}`);
      console.log(`   Endereço: ${im.endereco || "N/A"}`);
      console.log(`   Link: ${im.link?.substring(0, 80)}...`);
      console.log("");
    }

    console.log("\n📊 Resumo dos dados:\n");
    const precos = imoveis.map(i => i.preco).filter(p => p > 0);
    const areas = imoveis.map(i => i.area).filter(a => a > 0);
    const quartoses = imoveis.map(i => i.quartos).filter(q => q > 0);
    const comEndereco = imoveis.filter(i => i.endereco && i.endereco.length > 0);

    console.log(`   Preços encontrados: ${precos.length}/${imoveis.length}`);
    if (precos.length > 0) {
      console.log(`   - Mínimo: R$ ${Math.min(...precos).toLocaleString('pt-BR')}`);
      console.log(`   - Máximo: R$ ${Math.max(...precos).toLocaleString('pt-BR')}`);
      console.log(`   - Média: R$ ${(precos.reduce((a, b) => a + b) / precos.length).toFixed(0).toLocaleString('pt-BR')}`);
    }

    console.log(`\n   Áreas encontradas: ${areas.length}/${imoveis.length}`);
    if (areas.length > 0) {
      console.log(`   - Mínima: ${Math.min(...areas).toFixed(1)}m²`);
      console.log(`   - Máxima: ${Math.max(...areas).toFixed(1)}m²`);
    }

    console.log(`\n   Quartos encontrados: ${quartoses.length}/${imoveis.length}`);
    console.log(`   Endereços encontrados: ${comEndereco.length}/${imoveis.length}`);

  } catch (error) {
    console.error("❌ Erro ao testar scraper:", error);
  }

  process.exit(0);
}

testarScraper();
