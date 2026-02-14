function isValid(imovel) {
  if (!imovel) return false;

  const titulo = (imovel.titulo || "").toLowerCase();
  const descricao = (imovel.descricao || "").toLowerCase();
  const endereco = (imovel.endereco || "").toLowerCase();

  // ❌ Não pode ser fora da capital
  const foraCapital = [
    "suzano",
    "cotia",
    "mogi",
    "salto",
    "praia grande",
    "diadema",
    "jundiaí",
    "guarulhos",
    "osasco",
    "santo andré",
    "são bernardo",
    "taboão da serra",
    "mauá",
    "carapicuíba",
    "franco da rocha",
  ];
  const bairrosBons = [
    "ipiranga",
    "mooca",
    "vila prudente",
    "saúde",
    "santo amaro",
    "tatuapé",
    "vila mariana",
    "cambuci",
    "sacomã",
    "vila gumercindo",
    "jabaquara",
    "saúde",
    "indianópolis",
    "vila clementino",
    "vila mascote",
    "vila andrade",
    "vila do sul",
    "vila guarani",
    "vila santa catarina",
    "vila das mercês",
    "vila mariana",
    "vila nova conceição",
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
  if (foraCapital.some(cidade => endereco.includes(cidade) || titulo.includes(cidade)))
    return false;


  if (!bairrosBons.some(bairro => endereco.includes(bairro) || titulo.includes(bairro)))
    return false;
  if (!imovel.endereco.toLowerCase().includes("são paulo")) return false;



  // ❌ Não pode ser lançamento ou construção
  if (
    titulo.includes("lançamento") ||
    descricao.includes("lançamento") ||
    descricao.includes("em construção")
  )
    return false;

  // 💰 Até 300k
  if (imovel.preco > 300000) return false;

  // 📐 Pelo menos 40m²
  if (imovel.area < 30) return false;

  // 🛏 Pelo menos 2 quartos
  if (imovel.quartos < 1) return false;

  // 🌇 Precisa ter varanda
  // if (!descricao.includes("varanda"))
  //   return false;

  // 🛡 Precisa ter portaria 24h
  // if (
  //   !descricao.includes("portaria 24") &&
  //   !descricao.includes("portaria 24h")
  // )
  //   return false;

  return true;
}

module.exports = { isValid };
