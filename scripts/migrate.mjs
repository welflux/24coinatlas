import { loadConfig } from "../server/config.js";
import { openDatabase } from "../server/db.js";
process.umask(0o077);
const db = openDatabase(loadConfig().dataDir);
console.log(
  `Database ready: ${db.prepare("SELECT COUNT(*) n FROM migrations").get().n} migrations applied.`,
);
db.close();
