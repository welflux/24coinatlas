import { escapeHtml as e, csvCell } from "./security.js";
export function inventoryCsv(coins) {
  return (
    "\uFEFF" +
    [
      [
        "Name",
        "Denomination",
        "Year",
        "Mint mark",
        "Condition (owner-reported)",
        "Quantity",
        "Unit acquisition cost (ZAR)",
        "Acquired",
        "Provenance",
        "Notes",
      ],
      ...coins.map((c) => [
        c.name,
        c.denomination,
        c.year,
        c.mint_mark,
        c.condition,
        c.quantity,
        c.purchase_minor === null ? "" : (c.purchase_minor / 100).toFixed(2),
        c.acquired_at,
        c.provenance,
        c.notes,
      ]),
    ]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n")
  );
}
export function coinReport(coin, valuation, photos = []) {
  const money = (value) =>
    new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(value / 100);
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>24CoinAtlas coin dossier</title>
  <style>body{font:15px/1.65 system-ui;max-width:850px;margin:40px auto;padding:24px;color:#182b29}h1{font:40px Georgia}small{color:#526560}dt{font-weight:bold}dd{margin:0 0 12px}table{width:100%;border-collapse:collapse}td,th{text-align:left;border-bottom:1px solid #ddd;padding:10px}img{max-width:240px;max-height:240px}a{color:#285c4a}@media print{body{margin:0}button{display:none}}</style>
  <p>24COINATLAS / PRIVATE COLLECTION DOSSIER</p><h1>${e(coin.name)}</h1><p>Prepared ${e(new Date().toISOString())}. Owner-supplied records; not certification or an insurance appraisal.</p>
  ${photos.map((p) => `<figure><img alt="${e(p.side)} photograph" src="data:image/jpeg;base64,${p.base64}"><figcaption>${e(p.side)} · owner photograph</figcaption></figure>`).join("")}
  <dl>${[
    ["Denomination", coin.denomination],
    ["Year", coin.year || "Not recorded"],
    ["Mint mark", coin.mint_mark || "Not recorded"],
    ["Condition (owner-reported)", coin.condition],
    ["Quantity", coin.quantity],
    [
      "Unit acquisition cost",
      coin.purchase_minor === null
        ? "Not recorded"
        : money(coin.purchase_minor),
    ],
    ["Acquisition date", coin.acquired_at || "Not recorded"],
    ["Provenance", coin.provenance || "Not recorded"],
    ["Notes", coin.notes || "None"],
  ]
    .map(([k, v]) => `<dt>${e(k)}</dt><dd>${e(v)}</dd>`)
    .join("")}</dl>
  <h2>Valuation evidence</h2><p>${valuation.status === "available" ? `${money(valuation.low_minor)} – ${money(valuation.high_minor)} per coin. Confidence: ${e(valuation.confidence)}.` : "No defensible estimate available."}</p><p>${e(valuation.reason)}</p><small>As of ${e(valuation.as_of)}. Calculated estimate, not a completed-sale price. Photo-based grading cannot establish authenticity.</small>
  ${valuation.evidence.length ? `<table><thead><tr><th>Completed sale</th><th>Amount</th><th>Source</th></tr></thead><tbody>${valuation.evidence.map((s) => `<tr><td>${e(s.observed_at)}</td><td>${money(s.amount_minor)} ${s.includes_fees ? "(includes fees)" : "(fees excluded or unknown)"}</td><td><a href="${e(s.source_url)}">${e(s.source_name)}</a></td></tr>`).join("")}</tbody></table>` : ""}
  <h2>Next steps for expert assessment</h2><p>Keep the coin uncleaned. Record weight, diameter and edge details. An independent professional should assess condition, authenticity and any suspected error in person. No expert referral or sale has been arranged by this report.</p></html>`;
}

export function collectionReport(coins, valuations) {
  const money = (v) =>
    new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(v / 100);
  const supported = valuations.filter((v) => v.status === "available");
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>24CoinAtlas collection report</title><style>body{font:14px/1.7 system-ui;max-width:1000px;margin:40px auto;padding:24px;color:#233b31}h1{font:38px Georgia}table{width:100%;border-collapse:collapse}td,th{padding:12px 7px;text-align:left;border-bottom:1px solid #ddd}small{color:#65745e}@media print{body{margin:0}}</style><p>24COINATLAS / PRIVATE COLLECTION REPORT</p><h1>Your collection, in context.</h1><p>Prepared ${e(new Date().toISOString())}. ${coins.length} records; ${supported.length} have qualifying comparable sale evidence. This report is a personal record for preliminary discussions, not a professional appraisal or insurance certification.</p>
 <table><thead><tr><th>Coin / year</th><th>Condition (owner-reported)</th><th>Quantity</th><th>Unit acquisition cost</th><th>Unit collector estimate</th></tr></thead><tbody>${coins.map((c, i) => `<tr><td>${e(c.name)}<br><small>${e(c.year || "Year unknown")}</small></td><td>${e(c.condition)}</td><td>${c.quantity}</td><td>${c.purchase_minor === null ? "Not recorded" : money(c.purchase_minor)}</td><td>${valuations[i].status === "available" ? `${money(valuations[i].low_minor)} – ${money(valuations[i].high_minor)}` : "Not established"}</td></tr>`).join("")}</tbody></table>
 <h2>Valuation basis and limitations</h2>${coins.map((c, i) => `<h3>${e(c.name)}</h3><p>${e(valuations[i].reason)}</p><small>As of ${e(valuations[i].as_of)}. Confidence: ${e(valuations[i].confidence)}.</small><ul>${valuations[i].evidence.map((s) => `<li>${e(s.observed_at)} · completed sale · ${money(s.amount_minor)} · <a href="${e(s.source_url)}">${e(s.source_name)}</a> · ${s.includes_fees ? "includes fees" : "fees excluded or unknown"}</li>`).join("")}</ul>`).join("")}<p>Unvalued coins are not assigned zero value. Acquisition costs are owner-entered and are not market estimates. Photograph-based assessments do not establish authenticity or certified grade.</p></html>`;
}
