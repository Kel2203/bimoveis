const puppeteer = require("puppeteer");

async function buscarImoveis() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const pageLista = await browser.newPage();

  await pageLista.goto(
    "https://www.olx.com.br/imoveis/venda/estado-sp/sao-paulo-e-regiao?pe=300000",
    { waitUntil: "networkidle2", timeout: 0 }
  );

  // Espera anúncios aparecerem
  await pageLista.waitForSelector('a[data-testid="adcard-link"]', {
    timeout: 60000
  });

  const links = await pageLista.$$eval(
    'a[data-testid="adcard-link"]',
    els => els.map(el => el.href)
  );

  console.log(`📦 ${links.length} links coletados`);

  const anuncios = [];

  // Limitar para não ficar pesado
  const primeirosLinks = links.slice(0, 20);

  for (const link of primeirosLinks) {
    try {
      const page = await browser.newPage();

      await page.goto(link, {
        waitUntil: "networkidle2",
        timeout: 0
      });

     const dados = await page.evaluate(() => {
  const titulo = document.querySelector("h1")?.innerText || "";

  const textoPagina = document.body.innerText;

  // PREÇO (ex: R$ 280.000)
  const precoMatch = textoPagina.match(/R\$\s?[\d\.]+/);
  const preco = precoMatch
    ? Number(precoMatch[0].replace(/\D/g, ""))
    : 0;

  // ÁREA (ex: 42 m²)
  const areaMatch = textoPagina.match(/(\d+)\s?m²/);
  const area = areaMatch ? Number(areaMatch[1]) : 0;

  // QUARTOS (ex: 2 quartos)
  const quartosMatch = textoPagina.match(/(\d+)\s?quartos?/i);
  const quartos = quartosMatch ? Number(quartosMatch[1]) : 0;

  // ENDEREÇO (tenta capturar bairro)
  const enderecoMatch = textoPagina.match(/São Paulo|Ipiranga|Jaraguá|Socorro/i);
  const endereco = enderecoMatch ? enderecoMatch[0] : "";

  return {
    titulo,
    preco,
    area,
    quartos,
    endereco,
    link: location.href
  };
});


      anuncios.push(dados);
      await page.close();
    } catch (err) {
      console.log("⚠️ Erro em anúncio, pulando...");
    }
  }

  await browser.close();

  console.log(`✅ ${anuncios.length} imóveis encontrados`);
  return anuncios;
}

module.exports = { buscarImoveis };
