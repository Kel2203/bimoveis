const puppeteer = require("puppeteer");

async function testOLXSimple() {
  console.log("🧪 Teste simples OLX\n");

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      protocolTimeout: 180000,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"]
    });

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(60000);

    console.log("Acessando OLX...");
    await page.goto(
      "https://www.olx.com.br/imoveis/venda/estado-sp/sao-paulo-e-regiao?pe=400000",
      { waitUntil: "networkidle2", timeout: 60000 }
    );

    console.log("Coletando links...");
    const links = await page.$$eval(
      'a[data-testid="adcard-link"]',
      els => els.map(el => el.href)
    ).catch(() => []);

    console.log(`Total de links: ${links.length}\n`);

    if (links.length < 1) {
      console.log("Nenhum link encontrado!");
      await browser.close();
      return;
    }

    console.log(`Testando primeiro link: ${links[0]}\n`);
    const testPage = await browser.newPage();
    await testPage.setDefaultNavigationTimeout(60000);
    
    await testPage.goto(links[0], {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    const dados = await testPage.evaluate(() => {
      const titulo = document.querySelector("h1")?.innerText || "VAZIO";
      const textoPagina = document.body.innerText;

      const precoMatch = textoPagina.match(/R\$\s*[\d.,]+/);
      const preco = precoMatch ? precoMatch[0] : "NÃO ENCONTRADO";

      const areaMatch = textoPagina.match(/(\d+(?:[.,]\d+)?)\s*m²/);
      const area = areaMatch ? areaMatch[1] : "NÃO ENCONTRADO";

      return {
        titulo,
        preco,
        area,
        precoCompleto: precoMatch ? precoMatch[0] : null,
        htmlTamanho: document.body.innerHTML.length
      };
    });

    console.log("Dados extraídos:");
    console.log(JSON.stringify(dados, null, 2));

    await testPage.close();
    await browser.close();

  } catch (error) {
    console.error("ERRO:", error.message);
    if (browser) await browser.close();
  }
}

testOLXSimple();
