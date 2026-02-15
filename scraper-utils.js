/**
 * Utilitários para scrapers - retry, timeout, tratamento de erros
 */

async function retryAsync(fn, maxRetries = 3, delayMs = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      console.error(`❌ Tentativa ${i + 1}/${maxRetries} falhou:`, error.message);
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, delayMs * (i + 1)));
    }
  }
}

async function withTimeout(promise, timeoutMs, errorMsg) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(errorMsg || `Timeout após ${timeoutMs}ms`)),
        timeoutMs
      )
    )
  ]);
}

/**
 * Closure browser seguro - garante que browser feche mesmo com erro
 */
async function useBrowser(launcherFn, scraperFn) {
  let browser = null;
  try {
    browser = await retryAsync(launcherFn, 3, 3000);
    return await scraperFn(browser);
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

module.exports = { retryAsync, withTimeout, useBrowser };
