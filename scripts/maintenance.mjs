import { unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { loadConfig } from "../server/config.js";
import { openDatabase } from "../server/db.js";
const config = loadConfig(),
  db = openDatabase(config.dataDir);
try {
  db.prepare("DELETE FROM sessions WHERE expires_at<?").run(Date.now());
  db.prepare("DELETE FROM account_tokens WHERE expires_at<?").run(Date.now());
  const cutoff = new Date(Date.now() - 30 * 86400000)
    .toISOString()
    .replace("T", " ")
    .slice(0, 19);
  // Unattached photographs are retained for 30 days, including old scan inputs.
  const photos = db
    .prepare("SELECT * FROM photos WHERE coin_id IS NULL AND created_at<?")
    .all(cutoff);
  for (const photo of photos) {
    await unlink(resolve(config.dataDir, "uploads", photo.file_name)).catch(
      (e) => {
        if (e.code !== "ENOENT") throw e;
      },
    );
    db.prepare("DELETE FROM photos WHERE id=?").run(photo.id);
  }
  console.log(
    `Removed expired sessions and ${photos.length} expired unattached photographs.`,
  );
} finally {
  db.close();
}
