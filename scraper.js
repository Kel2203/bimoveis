const puppeteer = require("puppeteer");
const fs = require("fs");

async function launchBrowserWithFallback() {
  const baseOptions = { headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] };

  // Sanitize env vars: sometimes CI/build pipelines set these to install commands
  // (e.g. "npx puppeteer browsers install chrome") which Puppeteer will try
  // to use as an executable path. Remove obviously-invalid values.
  const sanitize = (name) => {
    const v = process.env[name];
    if (!v) return;
    const lower = String(v).toLowerCase();
    if (lower.includes("npx") || lower.includes("install") || /\s/.test(v)) {
      delete process.env[name];
    }
  };
  sanitize("PUPPETEER_EXECUTABLE_PATH");
  sanitize("CHROME_PATH");
  try {
    return await puppeteer.launch(baseOptions);
  } catch (err) {
    const candidates = [
      process.env.CHROME_PATH,
      process.env.PUPPETEER_EXECUTABLE_PATH,
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
      "/usr/bin/google-chrome-stable",
      "/snap/bin/chromium"
    ].filter(Boolean);

    for (const p of candidates) {
      try {
        if (!fs.existsSync(p)) continue;

        const stat = fs.statSync(p);
        let execPath = p;

        // If candidate is a directory (cache dir), try to find the binary inside
        if (stat.isDirectory()) {
          const findExecutableInDir = (dir, depth = 0) => {
            if (depth > 4) return null;
            const entries = fs.readdirSync(dir);
            for (const name of entries) {
              const full = require("path").join(dir, name);
              try {
                const s = fs.statSync(full);
                if (s.isFile()) {
                  const base = name.toLowerCase();
                  if (base === "chrome" || base === "chromium" || base.includes("google-chrome")) return full;
                }
                if (s.isDirectory()) {
                  const found = findExecutableInDir(full, depth + 1);
                  if (found) return found;
                }
              } catch (e) {
                // ignore
              }
            }
            return null;
          };

          const found = findExecutableInDir(p);
          if (found) execPath = found;
          else continue; // no executable inside this dir, try next candidate
        }

        return await puppeteer.launch({ ...baseOptions, executablePath: execPath });
      } catch (e) {
        // ignore and try next
      }
    }

    throw err;
  }
}

async function buscarImoveis() {
  const browser = await launchBrowserWithFallback();

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
