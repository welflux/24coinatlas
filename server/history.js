import { randomUUID } from "node:crypto";
import { hash } from "./security.js";
import { getValuation } from "./valuation.js";
export const identityKey = (c) =>
  hash(JSON.stringify([c.catalogue_id, c.year, c.mint_mark, c.condition]));
export function captureValuations(db, now = Date.now()) {
  const coins = db.prepare("SELECT * FROM coins").all();
  let captured = 0;
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const coin of coins) {
      const v = getValuation(db, coin, now);
      if (v.status !== "available") continue;
      captured += db
        .prepare(
          "INSERT OR IGNORE INTO valuation_snapshots(id,coin_id,identity_key,observed_on,low_minor,high_minor,quantity,evidence_ids) VALUES(?,?,?,?,?,?,?,?)",
        )
        .run(
          randomUUID(),
          coin.id,
          identityKey(coin),
          new Date(now).toISOString().slice(0, 10),
          v.low_minor,
          v.high_minor,
          coin.quantity,
          JSON.stringify(v.evidence.map((e) => e.id)),
        ).changes;
    }
    db.exec("COMMIT");
    return captured;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
