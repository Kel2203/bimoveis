// const axios = require("axios");
// const cheerio = require("cheerio");

// async function buscarImoveis() {
//   try {
//     console.log("🔎 Buscando imóveis...");

//     const url = "https://www.olx.com.br/imoveis/lancamentos/estado-sp/sao-paulo-e-regiao?rrt=1&rrt=2";

//     const { data } = await axios.get(url, {
//       headers: {
//         "User-Agent": "Mozilla/5.0",
//       },
//     });

//     const $ = cheerio.load(data);
//     const imoveis = [];

//     $(".property-card").each((i, el) => {
//       const titulo = $(el).find(".property-card__title").text().trim();
//       const precoTexto = $(el).find(".property-card__price").text().trim();
//       const areaTexto = $(el).find(".property-card__detail-area").text().trim();
//       const quartosTexto = $(el).find(".property-card__detail-room").text().trim();
//       const link = $(el).find("a").attr("href");

//       const preco = Number(precoTexto.replace(/\D/g, ""));
//       const area = Number(areaTexto.replace(/\D/g, ""));
//       const quartos = Number(quartosTexto.replace(/\D/g, ""));

//       if (preco && area) {
//         imoveis.push({
//           titulo,
//           preco,
//           area,
//           quartos,
//           link: link?.startsWith("http")
//             ? link
//             : `https://www.vivareal.com.br${link}`,
//         });
//       }
//     });

//     console.log(`✅ ${imoveis.length} imóveis encontrados`);
//     return imoveis;
//   } catch (error) {
//     console.error("❌ Erro ao buscar imóveis:", error.message);
//     return [];
//   }
// }

// module.exports = { buscarImoveis };
const puppeteer = require("puppeteer");

async function buscarImoveis() {
  console.log("🔎 Buscando imóveis na OLX...");

  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();

  await page.goto(
    "https://www.olx.com.br/imoveis/lancamentos/estado-sp/sao-paulo-e-regiao?rrt=1&rrt=2",
    { waitUntil: "networkidle2" }
  );

  await page.waitForSelector('[data-testid="listing-card"]');

  const imoveis = await page.evaluate(() => {
    const cards = document.querySelectorAll('[data-testid="listing-card"]');

    return Array.from(cards).map((card) => {
      const titulo = card.querySelector("h2")?.innerText || "";
      const preco = card.querySelector('[data-testid="price"]')?.innerText || "";
      const link = card.querySelector("a")?.href || "";

      return { titulo, preco, link };
    });
  });

  await browser.close();

  console.log(`✅ ${imoveis.length} imóveis encontrados`);

  return imoveis;
}

module.exports = { buscarImoveis };
