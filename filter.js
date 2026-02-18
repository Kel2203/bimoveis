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
   "Aclimação",
    "Alto da Boa Vista",
    "Alto da Lapa",
    "Alto da Mooca",
    "Alto de Pinheiros",
    "Alto de Santana",
    "Anália Franco",
    "Bela Vista",
    "Belém",
    "Belenzinho",
    "Brooklin Novo",
    "Brooklin Paulista",
    "Brooklin Velho",
    "Butantã",
    "Cambuci",
    "Campo Belo",
    "Chácara Klabin",
    "Chácara Santo Antônio",
    "City Lapa",
    "Granja Julieta",
    "Higienópolis",
    "Itaim Bibi",
    "Jaguaré",
    "Jardim América",
    "Jardim Anália Franco",
    "Jardim Avelino",
    "Jardim Bonfiglioli",
    "Jardim das Bandeiras",
    "Jardim Europa",
    "Jardim Gilbert",
    "Jardim Guedala",
    "Jardim Marajoara",
    "Jardim Paulista",
    "Jardim Paulistano",
    "Jardim Prudência",
    "Jardim São Paulo",
    "Jardim Três Marias",
    "Jardins",
    "Mirandópolis",
    "Moema",
    "Mooca",
    "Morumbi",
    "Pacaembu",
    "Panamby",
    "Parada Inglesa",
    "Parque da Móoca",
    "Parque Peruche",
    "Perdizes",
    "Pinheiros",
    "Pompéia",
    "Ponte Rasa",
    "Saúde",
    "Serra da Cantareira",
    "Sumaré",
    "Tatuapé",
    "Tucuruvi",
    "Vila Bertioga",
    "Vila Carrão",
    "Vila Clementino",
    "Vila Formosa",
    "Vila Jacuí",
    "Vila Leopoldina",
    "Vila Madalena",
    "Vila Mariana",
    "Vila Nova Cachoeirinha",
    "Vila Nova Conceição",
    "Vila Olímpia",
    "Vila Pompéia",
    "Vila Romana",
    "Vila Sônia",
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

  if (
    titulo.includes("lançamento") ||
    descricao.includes("lançamento") ||
    descricao.includes("em construção")
  )
    return false;

  if (imovel.preco > 400000) return false;

  if (imovel.area < 30) return false;

  if (imovel.quartos < 1) return false;

  return true;
}

module.exports = { isValid };
