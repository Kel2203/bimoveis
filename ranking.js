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

  // penalidade menor para "casa" (nem todo 'casa' é irrelevante)
  if (titulo.includes("terreno")) pontos -= 5;
  if (titulo.includes("casa") && !titulo.includes("casa para renda")) pontos -= 2;

  return pontos;
}

module.exports = { calcularPontuacao };
