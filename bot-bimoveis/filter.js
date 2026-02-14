function isValid(imovel) {
  const descricao = imovel.descricao.toLowerCase();

  return (
    imovel.preco >= 100000 &&
    imovel.preco <= 300000 &&
    imovel.quartos >= 2 &&
    imovel.area > 40 &&
    descricao.includes("varanda") &&
    descricao.includes("portaria 24")
  );
}

module.exports = { isValid };
