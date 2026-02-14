const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./imoveis.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS imoveis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      link TEXT UNIQUE,
      preco INTEGER,
      area REAL,
      score INTEGER,
      enviado INTEGER DEFAULT 0
    )
  `);
});

module.exports = db;
