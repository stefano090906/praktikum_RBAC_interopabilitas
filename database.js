require("dotenv").config();
const sqlite3 = require("sqlite3").verbose();
const DBSOURCE = process.env.DB_SOURCE || "movies.db";

const db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    console.error(err.message);
    throw err;
  }

  console.log("Connected to SQLite database.");

  db.serialize(() => {
    db.run(
      `CREATE TABLE IF NOT EXISTS movies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        director TEXT NOT NULL,
        year INTEGER NOT NULL
      )`
    );

    db.run(
      `CREATE TABLE IF NOT EXISTS directors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        country TEXT NOT NULL
      )`
    );

    db.run(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user'
      )`,
      (err) => {
        if (err) console.error("Gagal membuat tabel users:", err.message);
      }
    );
  });
});

module.exports = db;
