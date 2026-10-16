import { readFile } from "node:fs/promises";
import { z } from "zod";
import { loadConfig } from "../server/config.js";
import { openDatabase } from "../server/db.js";
const httpsUrl = z
  .string()
  .url()
  .refine((v) => new URL(v).protocol === "https:", "Use an HTTPS source URL");
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v &&
      v <= new Date().toISOString().slice(0, 10),
  );
const catalogue = z
  .object({
    id: z.string().regex(/^[a-z0-9-]{1,80}$/),
    name: z.string().min(1).max(180),
    denomination: z.string().max(60),
    era: z.string().max(60),
    country_code: z
      .string()
      .regex(/^[A-Z]{2}$/)
      .default("ZA"),
    start_year: z.number().int().min(1500).max(2200),
    end_year: z.number().int().nullable(),
    description: z.string().max(5000),
    metal: z.string().nullable(),
    mintage: z.number().int().nonnegative().nullable(),
    source_url: httpsUrl,
    source_name: z.string().min(1),
    variety_notes: z.string().max(5000),
    rights_note: z.string().min(20),
    reviewer: z.string().min(3),
    reviewed_at: isoDate,
  })
  .strict();
const evidence = z
  .object({
    id: z.string().regex(/^[a-zA-Z0-9-]{1,100}$/),
    catalogue_id: z.string(),
    year: z.number().int().min(1500).max(2200),
    mint_mark: z.string().max(30),
    condition: z.enum([
      "Poor",
      "Fair",
      "Good",
      "Very Good",
      "Fine",
      "Very Fine",
      "Extremely Fine",
      "About Uncirculated",
      "Uncirculated",
      "Proof",
    ]),
    type: z.enum([
      "completed_sale",
      "asking_price",
      "dealer_bid",
      "catalogue_estimate",
      "melt_value",
    ]),
    amount_minor: z.number().int().positive().max(100000000000),
    currency: z.literal("ZAR"),
    observed_at: isoDate,
    source_url: httpsUrl,
    source_name: z.string().min(1),
    rights_note: z.string().min(20),
    verified_at: isoDate,
    includes_fees: z.boolean(),
  })
  .strict();
const variety = z
  .object({
    id: z.string().regex(/^[a-zA-Z0-9-]{1,100}$/),
    catalogue_id: z.string(),
    name: z.string().min(1).max(180),
    year: z.number().int().nullable(),
    mint_mark: z.string().nullable(),
    distinguishing_features: z.string().min(20).max(5000),
    evidence_summary: z.string().min(20).max(5000),
    source_url: httpsUrl,
    source_name: z.string().min(1),
    rights_note: z.string().min(20),
    reviewer: z.string().min(3),
    reviewed_at: isoDate,
  })
  .strict();
export function importRecords(db, input) {
  const data = z
    .object({
      catalogue: z.array(catalogue).max(10000).default([]),
      evidence: z.array(evidence).max(10000).default([]),
      varieties: z.array(variety).max(10000).default([]),
    })
    .strict()
    .parse(input);
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const c of data.catalogue) {
      db.prepare(
        `INSERT INTO catalogue(id,name,denomination,era,start_year,end_year,description,metal,mintage,verification,source_url,source_name,variety_notes,country_code)
 VALUES(?,?,?,?,?,?,?,?,?,'verified',?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,denomination=excluded.denomination,era=excluded.era,start_year=excluded.start_year,end_year=excluded.end_year,description=excluded.description,metal=excluded.metal,mintage=excluded.mintage,verification='verified',source_url=excluded.source_url,source_name=excluded.source_name,variety_notes=excluded.variety_notes,country_code=excluded.country_code`,
      ).run(
        c.id,
        c.name,
        c.denomination,
        c.era,
        c.start_year,
        c.end_year,
        c.description,
        c.metal,
        c.mintage,
        c.source_url,
        c.source_name,
        c.variety_notes,
        c.country_code,
      );
      db.prepare(
        "INSERT INTO catalogue_reviews(catalogue_id,reviewer,reviewed_at,rights_note) VALUES(?,?,?,?)",
      ).run(c.id, c.reviewer, c.reviewed_at, c.rights_note);
    }
    for (const e of data.evidence)
      db.prepare(
        "INSERT INTO market_evidence(id,catalogue_id,year,mint_mark,condition,type,amount_minor,currency,observed_at,source_url,source_name,rights_note,verified_at,includes_fees) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING",
      ).run(
        e.id,
        e.catalogue_id,
        e.year,
        e.mint_mark,
        e.condition,
        e.type,
        e.amount_minor,
        e.currency,
        e.observed_at,
        e.source_url,
        e.source_name,
        e.rights_note,
        e.verified_at,
        e.includes_fees ? 1 : 0,
      );
    for (const v of data.varieties)
      db.prepare(
        "INSERT INTO varieties(id,catalogue_id,name,year,mint_mark,distinguishing_features,evidence_summary,source_url,source_name,rights_note,reviewer,reviewed_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING",
      ).run(
        v.id,
        v.catalogue_id,
        v.name,
        v.year,
        v.mint_mark,
        v.distinguishing_features,
        v.evidence_summary,
        v.source_url,
        v.source_name,
        v.rights_note,
        v.reviewer,
        v.reviewed_at,
      );
    db.exec("COMMIT");
    return {
      catalogue: data.catalogue.length,
      evidence: data.evidence.length,
      varieties: data.varieties.length,
    };
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
if (process.argv[1]?.endsWith("import-data.mjs")) {
  if (!process.argv[2])
    throw Error("Usage: npm run data:import -- /path/to/authorised-data.json");
  const db = openDatabase(loadConfig().dataDir);
  try {
    console.log(
      importRecords(db, JSON.parse(await readFile(process.argv[2], "utf8"))),
    );
  } finally {
    db.close();
  }
}
