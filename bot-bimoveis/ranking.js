function calculateScore(imovel) {
  let score = 0;

  const precoM2 = imovel.preco / imovel.area;

  if (precoM2 < 5000) score += 30;
  else if (precoM2 < 6000) score += 20;
  else score += 10;

  if (imovel.descricao.includes("novo")) score += 25;
  if (imovel.descricao.includes("seminovo")) score += 15;

  if (imovel.condominio && imovel.condominio < 400) score += 20;

  if (imovel.regiao.includes("Ipiranga")) score += 25;
  if (imovel.regiao.includes("Socorro")) score += 20;
  if (imovel.regiao.includes("Jaraguá")) score += 15;

  return score;
}

module.exports = { calculateScore };
