// Teste local para chamar buscarImoveis() com OLX_MAX_LINKS=3
process.env.OLX_MAX_LINKS = process.env.OLX_MAX_LINKS || '3';

const { buscarImoveis } = require('./scraper');

(async () => {
  console.log('🧪 Teste local scraper.js (OLX_MAX_LINKS=' + process.env.OLX_MAX_LINKS + ')\n');
  try {
    const imoveis = await buscarImoveis();
    console.log('\n✅ Total extraído:', imoveis.length);
    if (imoveis.length > 0) {
      console.log('\n📊 Amostra:');
      for (let i = 0; i < Math.min(3, imoveis.length); i++) {
        const im = imoveis[i];
        console.log(`${i+1}. ${im.titulo?.substring(0,80) || '?'} | R$ ${im.preco} | ${im.area}m² | ${im.quartos}q`);
      }
    }
    process.exit(0);
  } catch (e) {
    console.error('❌ Erro no teste:', e.message);
    process.exit(1);
  }
})();
