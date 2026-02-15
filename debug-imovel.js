/**
 * Utilitário para diagnosticar e debugar scraping
 */

function debugImovel(imovel, source = "scraper") {
  const missing = [];
  
  if (!imovel.titulo || imovel.titulo.trim() === "") missing.push("titulo");
  if (!imovel.preco || imovel.preco === 0) missing.push("preco");
  if (!imovel.area || imovel.area === 0) missing.push("area");
  if (!imovel.endereco || imovel.endereco.trim() === "") missing.push("endereco");
  if (imovel.quartos === undefined || imovel.quartos === 0) missing.push("quartos");

  if (missing.length > 0) {
    console.warn(
      `⚠️  [${source}] Dado incompleto: ${imovel.titulo?.substring(0, 30) || "SEM TÍTULO"}`,
      `| Faltando: ${missing.join(", ")}`
    );
  }

  return missing.length === 0;
}

function logImovelCompleto(imovel) {
  console.log(`
📋 Imóvel encontrado:
   Título: ${imovel.titulo}
   Preço: R$ ${imovel.preco?.toLocaleString("pt-BR") || "N/A"}
   Área: ${imovel.area} m²
   Quartos: ${imovel.quartos}
   Endereço: ${imovel.endereco}
   Link: ${imovel.link}
  `);
}

module.exports = { debugImovel, logImovelCompleto };
