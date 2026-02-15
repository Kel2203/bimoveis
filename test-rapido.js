/**
 * Teste rápido para validar scraper OLX
 */

const { buscarImoveis } = require("./scraper");

async function testar() {
  console.log("🧪 Teste rápido OLX (max 2 min)\n");
  
  const timeout = setTimeout(() => {
    console.log("⏱️  Timeout - encerrando teste");
    process.exit(1);
  }, 120000);
  
  try {
    const imoveis = await buscarImoveis();
    clearTimeout(timeout);
    
    console.log(`\n✅ Total extraído: ${imoveis.length}`);
    
    if (imoveis.length > 0) {
      console.log("\n📊 Amostra (primeiros 3):");
      for (let i = 0; i < Math.min(3, imoveis.length); i++) {
        const im = imoveis[i];
        console.log(`${i+1}. ${im.titulo?.substring(0, 40) || "?"}`);
        console.log(`   R$ ${im.preco} | ${im.area}m² | ${im.quartos}q | ${im.endereco || "?"}`);
      }
    }
    
    process.exit(0);
  } catch (e) {
    console.error("❌ Erro:", e.message);
    process.exit(1);
  }
}

testar();
