const puppeteer = require("puppeteer");
const fs = require("fs");

async function launchBrowserWithFallback() {
  const baseOptions = { headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] };
  console.log("[puppeteer-debug] baseOptions:", baseOptions);
  // Sanitize and resolve env vars that may point to install commands or cache dirs.
  const findExecutableInDir = (dir, depth = 0) => {
    if (depth > 5) return null;
    try {
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
    } catch (e) {
      return null;
    }
    return null;
  };

  const resolveEnvExecutable = (name) => {
    const v = process.env[name];
    if (!v) return;
    const lower = String(v).toLowerCase();
    // remove obvious install commands or multi-word values
    if (lower.includes("npx") || lower.includes("install") || /\s/.test(v)) {
      delete process.env[name];
      return;
    }

    try {
      if (!fs.existsSync(v)) {
        delete process.env[name];
        return;
      }
      const s = fs.statSync(v);
      if (s.isDirectory()) {
        const found = findExecutableInDir(v);
        if (found) process.env[name] = found;
        else delete process.env[name];
      }
      // if it's a file, leave it as-is
    } catch (e) {
      delete process.env[name];
    }
  };

  resolveEnvExecutable("PUPPETEER_EXECUTABLE_PATH");
  resolveEnvExecutable("CHROME_PATH");
  console.log("[puppeteer-debug] env PUPPETEER_EXECUTABLE_PATH=", process.env.PUPPETEER_EXECUTABLE_PATH);
  console.log("[puppeteer-debug] env CHROME_PATH=", process.env.CHROME_PATH);
  // Try to proactively find the downloaded chrome/chromium binary in common
  // puppeteer cache locations and use it as `executablePath` so Puppeteer
  // doesn't try to resolve a directory path as an executable.
  const findChromiumBinary = () => {
    const cacheCandidates = [
      process.env.PUPPETEER_CACHE_DIR,
      "/opt/render/.cache/puppeteer",
      "/tmp/.cache/puppeteer",
      "/root/.cache/puppeteer",
      "/home/node/.cache/puppeteer"
    ].filter(Boolean);

    console.log("[puppeteer-debug] cacheCandidates:", cacheCandidates);
    for (const dir of cacheCandidates) {
      try {
        console.log("[puppeteer-debug] testing cache candidate:", dir);
        if (!fs.existsSync(dir)) continue;
        const walk = (d, depth = 0) => {
          if (depth > 6) return null;
          const entries = fs.readdirSync(d);
          for (const name of entries) {
            const full = require("path").join(d, name);
            try {
              const s = fs.statSync(full);
              if (s.isFile()) {
                const low = name.toLowerCase();
                if (low === "chrome" || low === "chromium" || low.includes("chrome-linux64") || low.includes("chrome-win64") || low.includes("google-chrome")) return full;
              }
              if (s.isDirectory()) {
                const found = walk(full, depth + 1);
                if (found) return found;
              }
            } catch (e) {
              // ignore
            }
          }
          return null;
        };
        const found = walk(dir);
        console.log("[puppeteer-debug] found in dir:", dir, found);
        if (found) return found;
      } catch (e) {
        console.log("[puppeteer-debug] error testing dir:", dir, e && e.message);
        // ignore
      }
    }
    return null;
  };

  const foundBinary = findChromiumBinary();
  try {
    console.log("[puppeteer-debug] foundBinary=", foundBinary);
    if (foundBinary) {
      console.log("[puppeteer-debug] launching with executablePath:", foundBinary);
      return await puppeteer.launch({ ...baseOptions, executablePath: foundBinary });
    }
    console.log("[puppeteer-debug] launching default puppeteer");
    return await puppeteer.launch(baseOptions);
  } catch (err) {
    console.error("[puppeteer-debug] puppeteer.launch failed:", err && err.stack || err);
    const candidates = [
      process.env.CHROME_PATH,
      process.env.PUPPETEER_EXECUTABLE_PATH,
      process.env.PUPPETEER_CACHE_DIR,
      "/tmp/.cache/puppeteer",
      "/opt/render/.cache/puppeteer",
      "/root/.cache/puppeteer",
      "/home/node/.cache/puppeteer",
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
