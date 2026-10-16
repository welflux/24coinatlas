import { backup } from "node:sqlite";
import { mkdir, cp, chmod, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { loadConfig } from "../server/config.js";
import { openDatabase } from "../server/db.js";
process.umask(0o077);
const config = loadConfig(),
  destination = resolve(
    process.argv[2] ||
      `backups/${new Date().toISOString().replaceAll(":", "-")}`,
  );
// Stop writes while taking a coordinated database + image snapshot.
if (process.env.BACKUP_WRITES_STOPPED !== "true")
  throw Error(
    "Stop the application first, then set BACKUP_WRITES_STOPPED=true to take a consistent backup.",
  );
await mkdir(destination, { recursive: false, mode: 0o700 });
const db = openDatabase(config.dataDir);
try {
  await backup(db, resolve(destination, "atlas.sqlite"));
  await chmod(resolve(destination, "atlas.sqlite"), 0o600);
  await cp(
    resolve(config.dataDir, "uploads"),
    resolve(destination, "uploads"),
    { recursive: true, force: false },
  ).catch((e) => {
    if (e.code !== "ENOENT") throw e;
  });
  console.log(
    "Backup created. Encrypt it, restrict access, and test restoration before relying on it.",
  );
} catch (e) {
  await rm(destination, { recursive: true, force: true });
  throw e;
} finally {
  db.close();
}
