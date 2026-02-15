const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./imoveis.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS imoveis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      link TEXT UNIQUE,
      fonte TEXT,
      titulo TEXT,
      endereco TEXT,
      preco INTEGER,
      preco_anterior INTEGER,
      area REAL,
      quartos INTEGER,
      score INTEGER,
      enviado INTEGER DEFAULT 0,
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_link ON imoveis(link)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_fonte ON imoveis(fonte)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_data ON imoveis(data_criacao)`);
});

module.exports = db;
