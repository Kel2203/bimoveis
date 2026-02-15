const db = require("./database");

function normalizarEndereco(endereco) {
  return endereco
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim();
}

function ehDuplicado(imovel, existentes) {
  const enderecoNorm = normalizarEndereco(imovel.endereco);
  
  return existentes.some(existente => {
    const endExistenteNorm = normalizarEndereco(existente.endereco);
    
    // Mesma localização + preço similar (±5%)
    return (
      enderecoNorm === endExistenteNorm &&
      Math.abs(imovel.preco - existente.preco) < 
        imovel.preco * 0.05
    );
  });
}

function deduplicar(imoveis) {
  const unicos = [];
  const enderecosVisto = new Set();

  for (const imovel of imoveis) {
    const chave = normalizarEndereco(imovel.endereco);
    
    if (!enderecosVisto.has(chave)) {
      unicos.push(imovel);
      enderecosVisto.add(chave);
    }
  }

  return unicos;
}

module.exports = { deduplicar, ehDuplicado };