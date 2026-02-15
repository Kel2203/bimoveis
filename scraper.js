const puppeteer = require("puppeteer");
const fs = require("fs");

async function launchBrowserWithFallback() {
  const baseOptions = { 
    headless: true, 
    protocolTimeout: 180000,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] 
  };
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

    for (const dir of cacheCandidates) {
      try {
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
        if (found) return found;
      } catch (e) {
        // ignore
      }
    }
    return null;
  };

  const foundBinary = findChromiumBinary();
  try {
    if (foundBinary) {
      return await puppeteer.launch({ ...baseOptions, executablePath: foundBinary });
    }
    return await puppeteer.launch(baseOptions);
  } catch (err) {
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
  let browser;
  try {
    browser = await launchBrowserWithFallback();

    const pageLista = await browser.newPage();
    await pageLista.setDefaultNavigationTimeout(120000);
    await pageLista.setDefaultTimeout(120000);

    console.log("🌐 Acessando OLX...");
    await pageLista.goto(
      "https://www.olx.com.br/imoveis/venda/estado-sp/sao-paulo-e-regiao?pe=700000",
      { waitUntil: "networkidle2", timeout: 120000 }
    );

    // Espera anúncios aparecerem com timeout generoso
    console.log("⏳ Aguardando anúncios aparecerem...");
    try {
      await pageLista.waitForSelector('a[data-testid="adcard-link"]', {
        timeout: 90000
      });
    } catch (e) {
      console.warn("⚠️ Timeout ao aguardar seletores, tentando mesmo assim...");
    }

    const links = await pageLista.$$eval(
      'a[data-testid="adcard-link"]',
      els => els.map(el => el.href)
    ).catch(() => []);

    console.log(`📦 ${links.length} links coletados`);

    const anuncios = [];

    // Expandido para 20 links
    const primeirosLinks = links.slice(0, 20);

    for (const link of primeirosLinks) {
      console.log(`\n  📄 Link ${primeirosLinks.indexOf(link) + 1}/${primeirosLinks.length}`);
      let page;
      try {
        page = await browser.newPage();
        await page.setDefaultNavigationTimeout(30000);
        await page.setDefaultTimeout(30000);

        console.log(`  ⏳ Navegando...`);
        await page.goto(link, {
          waitUntil: "networkidle2",
          timeout: 30000
        });
        console.log(`  ✅ Página carregada`);

        console.log(`  🔍 Extraindo dados...`);
        let dados = null;
        try {
          dados = await page.evaluate(() => {
            const titulo = document.querySelector("h1")?.innerText || "";
            const textoPagina = document.body.innerText;

            // PREÇO (ex: R$ 280.000 ou 280.000,00)
            const precoMatch = textoPagina.match(/R\$\s*[\d.,]+/);
            const precoStr = precoMatch ? precoMatch[0] : "";
            const preco = precoStr ? Number(precoStr.replace(/\D/g, "")) : 0;

            // ÁREA (ex: 42 m² ou 42m²)
            const areaMatch = textoPagina.match(/(\d+(?:[.,]\d+)?)\s*m²/);
            const area = areaMatch ? parseFloat(areaMatch[1].replace(",", ".")) : 0;

            // QUARTOS (ex: 2 quartos, 2 quarto, 2q, 3 suítes, 2 dormitórios)
            const quartosMatch = textoPagina.match(/(\d+)\s*(?:quarto|suíte|suite|dormitório|dorm|q)\s*(?:s)?/i);
            const quartos = quartosMatch ? Number(quartosMatch[1]) : 0;

            // ENDEREÇO - tenta múltiplos padrões
            let endereco = "";
            
            // Procura por padrão "Bairro, São Paulo"
            const enderecoMatch = textoPagina.match(/([A-Za-záéíóúàãõâêô\s]+),\s*São Paulo/i);
            if (enderecoMatch) {
              endereco = enderecoMatch[1].trim();
            } else {
              // Alternativa: procura qualquer menção a bairros conhecidos
              const bairrosComuns = [
                "Ipiranga", "Mooca", "Vila Prudente", "Saúde", "Santo Amaro", 
                "Tatuapé", "Vila Mariana", "Lapa", "Liberdade", "Cambuci",
                "Sacomã", "Indianópolis", "Vila Clementino", "Vila Mascote",
                "Interlagos", "Vila Carrão", "Vila Formosa", "Vila Matilde",
                "Vila Olímpia", "Vila Madalena", "Vila Leopoldina", "Vila Romana",
                "Tatuíba", "Bosque da Saúde", "Consolação", "Bela Vista", "Centro",
                "Belém", "Brás", "Água Branca", "Pompéia", "Brooklin Paulista",
                "Jardim Paulista", "Itaim Bibi", "Vila Clementino", "Cursino"
              ];
              for (const bairro of bairrosComuns) {
                if (textoPagina.toLowerCase().includes(bairro.toLowerCase())) {
                  endereco = bairro;
                  break;
                }
              }
            }

            return {
              titulo: titulo.trim(),
              preco,
              area,
              quartos,
              endereco,
              link: location.href
            };
          });
        } catch (evalErr) {
          console.error(`    ⛔ Erro ao extrair: ${evalErr.message}`);
          dados = {
            titulo: "",
            preco: 0,
            area: 0,
            quartos: 0,
            endereco: "",
            link: link
          };
        }

        anuncios.push(dados);
        console.log(`  ✅ ${dados.titulo?.substring(0, 40) || "?"}`);
        console.log(`     R$ ${dados.preco} | ${dados.area}m² | ${dados.quartos}q`);
        
      } catch (err) {
        console.error(`  ❌ Erro: ${err.message}`);
      } finally {
        if (page) {
          try {
            await page.close();
          } catch {}
        }
      }
    }

    console.log(`\n✅ Total extraído: ${anuncios.length}`);
    return anuncios;
  } catch (err) {
    console.error("❌ Erro crítico ao buscar imóveis OLX:", err.message);
    return [];
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error("⚠️ Erro ao fechar browser:", e.message);
      }
    }
  }
}

module.exports = { buscarImoveis };

module.exports = { buscarImoveis };
