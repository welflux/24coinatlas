import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readdirSync, readFileSync, chmodSync } from "node:fs";
import { resolve } from "node:path";
import { starterCatalogue } from "./catalogue-seed.js";

export function openDatabase(dataDir) {
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const path = resolve(dataDir, "atlas.sqlite");
  const db = new DatabaseSync(path);
  chmodSync(path, 0o600);
  db.exec(
    "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;",
  );
  db.exec(
    "CREATE TABLE IF NOT EXISTS migrations (name TEXT PRIMARY KEY, applied_at TEXT DEFAULT CURRENT_TIMESTAMP)",
  );
  for (const name of readdirSync(
    new URL("./migrations/", import.meta.url),
  ).sort()) {
    if (db.prepare("SELECT name FROM migrations WHERE name=?").get(name))
      continue;
    db.exec("BEGIN IMMEDIATE");
    try {
      db.exec(
        readFileSync(new URL(`./migrations/${name}`, import.meta.url), "utf8"),
      );
      db.prepare("INSERT INTO migrations(name) VALUES(?)").run(name);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
  const insert = db.prepare(`INSERT OR IGNORE INTO catalogue
    (id,name,denomination,era,start_year,end_year,description,verification,source_url,source_name,variety_notes,image)
    VALUES (?,?,?,?,?,?,?,'reference_pending',?,?,?,?)`);
  for (const c of starterCatalogue)
    insert.run(
      c.id,
      c.name,
      c.denomination,
      c.era,
      c.start_year,
      c.end_year,
      c.description,
      c.source_url,
      c.source_name,
      c.variety_notes,
      c.image,
    );
  return db;
}
