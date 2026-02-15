function calcularPontuacao(imovel) {
  let pontos = 0;

  const titulo = (imovel.titulo || "").toLowerCase();
  const descricao = (imovel.descricao || "").toLowerCase();
  const endereco = (imovel.endereco || "").toLowerCase();

  // 💰 Preço
  if (imovel.preco <= 300000) pontos += 3;
  if (imovel.preco <= 270000) pontos += 1; 

  // 🛏 Quartos
  if (imovel.quartos >= 2) pontos += 2;
  if (imovel.quartos >= 3) pontos += 1;

  // 📐 Área
  if (imovel.area >= 40) pontos += 2;
  if (imovel.area >= 45) pontos += 1;
  if (imovel.area >= 50) pontos += 2;

  // Varanda
  if (descricao.includes("varanda")) pontos += 2;

  // 🛡 Portaria 24h
  if (
    descricao.includes("portaria 24") ||
    descricao.includes("portaria 24h")
  ) pontos += 2;

  // 📍 Bairros estratégicos (custo-benefício SP)
  const bairrosBons = [
    "ipiranga",
    "brooklin",
    "mooca",
    "vila prudente",
    "saúde",
    "santo amaro",
    "tatuapé",
    "vila mariana",
    "lapa",
    "liberdade",
    "cambuci",
    "sacomã",
    "vila gumercindo",
    "indianópolis",
    "vila clementino",
    "vila mascote",
    "vila andrade",
    "vila do sul",
    "vila guarani",
    "vila santa catarina",
    "vila das mercês",
    "vila mariana",
    "vila olímpia",
    "vila madalena",
    "vila leopoldina",
    "vila romana",
    "vila madalena",
    "interlagos",
    "vila carrão",
    "vila formosa",
    "vila matilde",
    "vila clementino"
  ];

  if (bairrosBons.some(b => endereco.includes(b) || titulo.includes(b)))
    pontos += 3;

  const foraCapital = [
    "suzano",
    "cotia",
    "mogi",
    "salto",
    "praia grande",
    "jundiaí",
    "guarulhos",
    "osasco",
    "santo andré",
    "são bernardo",
    "taboão da serra",
    "mauá",
    "carapicuíba",
    "franco da rocha",
    "diadema"
  ];

  if (foraCapital.some(c => endereco.includes(c)))
    pontos -= 5;

  if (titulo.includes("casa") || titulo.includes("terreno"))
    pontos -= 5;

  return pontos;
}

module.exports = { calcularPontuacao };
