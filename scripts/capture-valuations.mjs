import { loadConfig } from "../server/config.js";
import { openDatabase } from "../server/db.js";
import { captureValuations } from "../server/history.js";
const db = openDatabase(loadConfig().dataDir);
try {
  console.log(
    `${captureValuations(db)} evidence-supported observations recorded. No unavailable estimates were substituted.`,
  );
} finally {
  db.close();
}
