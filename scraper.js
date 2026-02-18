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

    const MAX_LINKS = Number(process.env.OLX_MAX_LINKS || 5);

    const pageLista = await browser.newPage();
    await pageLista.setDefaultNavigationTimeout(60000);
    await pageLista.setDefaultTimeout(60000);

    // Otimizações: bloquear recursos pesados e setar user agent para acelerar carregamento
    await pageLista.setUserAgent(process.env.USER_AGENT || "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    await pageLista.setRequestInterception(true);
    pageLista.on('request', req => {
      const r = req.resourceType();
      if (["image", "stylesheet", "font", "media", "manifest"].includes(r)) return req.abort();
      req.continue();
    });

    console.log("🌐 Acessando OLX (lista) com otimizações...");

    const listUrl = "https://www.olx.com.br/imoveis/venda/estado-sp/sao-paulo-e-regiao?pe=400000&sf=1&coe=1000&ipe=500&ss=30";
    let listLoaded = false;
    for (let attempt = 1; attempt <= 2 && !listLoaded; attempt++) {
      try {
        await pageLista.goto(listUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
        listLoaded = true;
      } catch (e) {
        console.warn(`⚠️ Tentativa ${attempt} - falha ao carregar lista: ${e.message}`);
        if (attempt === 2) throw e;
        await new Promise(r => setTimeout(r, 3000 * attempt));
      }
    }

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

    // Limitar processados para evitar carga alta
    const primeirosLinks = links.slice(0, MAX_LINKS);

    for (const link of primeirosLinks) {
      console.log(`\n  📄 Link ${primeirosLinks.indexOf(link) + 1}/${primeirosLinks.length}`);
      let page;
      try {
        page = await browser.newPage();
        await page.setUserAgent(process.env.USER_AGENT || "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        await page.setDefaultNavigationTimeout(45000);
        await page.setDefaultTimeout(45000);
        await page.setRequestInterception(true);
        page.on('request', req => {
          const r = req.resourceType();
          if (["image", "stylesheet", "font", "media", "manifest"].includes(r)) return req.abort();
          req.continue();
        });

        console.log(`  ⏳ Navegando...`);

        let success = false;
        for (let attempt = 1; attempt <= 2 && !success; attempt++) {
          try {
            await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 45000 });
            const dados = await page.evaluate(() => {
                const tituloEl = document.querySelector("h1");
                let titulo = tituloEl?.innerText || "";
                if (!titulo) {
                  const og = document.querySelector('meta[property="og:title"]') || document.querySelector('meta[name="title"]');
                  titulo = og?.getAttribute('content') || document.title || "";
                }
              const textoPagina = document.body.innerText || '';
                // Tentar extrair preço atual e preço anterior (quando houver queda)
                let preco = 0;
                let preco_anterior = 0;

                // 1) Elementos semânticos (classe comum OLX)
                try {
                  const currentEl = document.querySelector('h3.olx-adcard__price, h3[class*=price], .olx-price, .price');
                  const oldEl = document.querySelector('p.olx-adcard__old-price, .old-price, .price-old');
                  if (currentEl) {
                    const curText = currentEl.innerText || currentEl.textContent || '';
                    const m = curText.match(/R\$\s*[\d.,]+/);
                    if (m) preco = Number(m[0].replace(/\D/g, ''));
                  }
                  if (oldEl) {
                    const oldText = oldEl.innerText || oldEl.textContent || '';
                    const mo = oldText.match(/R\$\s*[\d.,]+/);
                    if (mo) preco_anterior = Number(mo[0].replace(/\D/g, ''));
                  }
                } catch (e) {
                  // ignore DOM errors
                }

                // 2) Meta tags / JSON fallbacks
                if (!preco) {
                  const ogPrice = document.querySelector('meta[property="product:price:amount"]')?.content;
                  if (ogPrice) preco = Number(String(ogPrice).replace(/\D/g, '')) || preco;
                }

                // 3) Fallback para regex no texto da página
                if (!preco) {
                  const precoMatch = textoPagina.match(/R\$\s*[\d.,]+/);
                  const precoStr = precoMatch ? precoMatch[0] : '';
                  preco = precoStr ? Number(precoStr.replace(/\D/g, '')) : 0;
                }
              const areaMatch = textoPagina.match(/(\d+(?:[.,]\d+)?)\s*m²/);
              const area = areaMatch ? parseFloat(areaMatch[1].replace(',', '.')) : 0;
              const quartosMatch = textoPagina.match(/(\d+)\s*(?:quarto|dormitório|dorm|suíte|q)\s*(?:s)?/i);
              const quartos = quartosMatch ? Number(quartosMatch[1]) : 0;
              let endereco = '';

              // 1) Preferir elemento de localização se existir
              try {
                const locEl = document.querySelector('p.olx-adcard__location, .olx-adcard__location, .location');
                if (locEl) {
                  const locText = (locEl.innerText || locEl.textContent || '').trim();
                  // Formatos possíveis: "Bairro, Cidade" ou "Cidade, Bairro" ou "Cidade - Bairro"
                  let m = locText.match(/([A-Za-záéíóúàãõâêô\s]+),\s*São Paulo/i);
                  if (m) endereco = m[1].trim();
                  else {
                    m = locText.match(/São Paulo[,\-]\s*([A-Za-záéíóúàãõâêô\s]+)/i);
                    if (m) endereco = m[1].trim();
                    else {
                      // se vier 'Bairro - Cidade' ou 'Cidade - Bairro'
                      m = locText.match(/^([A-Za-záéíóúàãõâêô\s]+)\s*[\-–]\s*([A-Za-záéíóúàãõâêô\s]+)$/i);
                      if (m) {
                        // escolher a parte que não for 'São Paulo'
                        if (/sao paulo/i.test(m[1])) endereco = m[2].trim();
                        else endereco = m[1].trim();
                      }
                    }
                  }
                }
              } catch (e) {
                // ignore
              }

              // 2) Fallback a partir do texto da página (manter compatibilidade anterior)
              if (!endereco) {
                const enderecoMatch = textoPagina.match(/([A-Za-záéíóúàãõâêô\s]+),\s*São Paulo/i);
                if (enderecoMatch) endereco = enderecoMatch[1].trim();
                else {
                  const enderecoMatch2 = textoPagina.match(/São Paulo[,\-]\s*([A-Za-záéíóúàãõâêô\s]+)/i);
                  if (enderecoMatch2) endereco = enderecoMatch2[1].trim();
                }
              }
              return { titulo: titulo.trim(), preco, preco_anterior: (typeof preco_anterior !== 'undefined' ? preco_anterior : 0), area, quartos, endereco, link: location.href };
            });

            anuncios.push(dados);
            console.log(`  ✅ ${dados.titulo?.substring(0,60) || '?'} `);
            console.log(`     R$ ${dados.preco} | ${dados.area}m² | ${dados.quartos}q | Endereço: ${dados.endereco || 'N/A'}`);
            success = true;
          } catch (err) {
            console.warn(`  ⚠️ Tentativa ${attempt} falhou: ${err.message}`);
            if (attempt === 2) console.error(`  ❌ Erro final: ${err.message}`);
            else await new Promise(r => setTimeout(r, 2000 * attempt));
          }
        }
      } catch (err) {
        console.error(`  ❌ Erro: ${err.message}`);
      } finally {
        if (page) {
          try { await page.close(); } catch {}
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
