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
    "diadema",
    "santo andré",
    "são bernardo",
    "taboão da serra",
    "são caetano"
  ];
  const bairrosBons = [
    "brooklin",
    "ipiranga",
    "mooca",
    "vila prudente",
    "saúde",
    "liberdade",
    "lapa",
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

  // ⚠️ Preferência por bairros bons, mas não obrigatório
  // if (!bairrosBons.some(bairro => endereco.includes(bairro) || titulo.includes(bairro)))
  //   return false;

  // ❌ Deve estar em São Paulo (capital)
  // Relaxado: só checar se tiver endereco, não rejeitar se vazio
  if (imovel.endereco && !imovel.endereco.toLowerCase().includes("são paulo")) {
    // Mas se temos endereço e não menciona SP, rejeitar
    return false;
  }

  // ❌ Não pode ser lançamento ou construção
  if (
    titulo.includes("lançamento") ||
    descricao.includes("lançamento") ||
    descricao.includes("em construção")
  )
    return false;

  // 💰 Até 700k
  if (imovel.preco > 700000) return false;

  // 📐 Mínimo 30m²
  if (imovel.area < 30) return false;

  // 🛏 Pelo menos 1 quarto
  if (imovel.quartos < 1) return false;

  // ✅ Passou em todos os critérios
  return true;
}

module.exports = { isValid };
