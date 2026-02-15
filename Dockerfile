FROM node:24-bullseye

WORKDIR /usr/src/app

# Instala dependências do sistema e Chromium
RUN apt-get update && apt-get install -y \
  chromium \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk1.0-0 \
  libcups2 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libxkbcommon0 \
  libpango-1.0-0 \
  libgtk-3-0 \
  --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Defina caminhos do Chrome para o Node/Puppeteer
ENV CHROME_PATH=/usr/bin/chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Instala dependências do Node (vai rodar postinstall se presente)
COPY package*.json ./
RUN npm ci --only=production

# Copia o código e expõe o comando de inicialização
COPY . .
CMD ["node", "index.js"]
