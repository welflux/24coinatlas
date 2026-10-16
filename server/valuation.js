export function getValuation(db, coin, now = Date.now()) {
  const unavailable = (reason) => ({
    status: "unavailable",
    currency: "ZAR",
    low_minor: null,
    high_minor: null,
    as_of: new Date(now).toISOString(),
    confidence: "Unavailable",
    reason,
    evidence: [],
    type: "calculated_estimate",
  });
  if (!coin.catalogue_id || !coin.year || coin.condition === "Not assessed")
    return unavailable(
      "Select an exact catalogue entry, year and condition before researching comparable sales.",
    );
  const catalogue = db
    .prepare("SELECT verification FROM catalogue WHERE id=?")
    .get(coin.catalogue_id);
  if (catalogue?.verification !== "verified")
    return unavailable(
      "The catalogue identity is awaiting source verification. No valuation is calculated from an unverified entry.",
    );
  const cutoff = new Date(now - 730 * 86400000).toISOString().slice(0, 10);
  const evidence = db
    .prepare(
      `SELECT * FROM market_evidence WHERE catalogue_id=? AND year=? AND mint_mark=? AND condition=?
    AND type='completed_sale' AND observed_at>=? AND observed_at<=? ORDER BY observed_at DESC LIMIT 30`,
    )
    .all(
      coin.catalogue_id,
      coin.year,
      coin.mint_mark || "",
      coin.condition,
      cutoff,
      new Date(now).toISOString().slice(0, 10),
    );
  if (evidence.length < 3)
    return unavailable(
      "At least three verified ZAR completed sales matching this issue, year, mint mark and condition within the last two years are required.",
    );
  const prices = evidence.map((e) => e.amount_minor).sort((a, b) => a - b);
  return {
    status: "available",
    currency: "ZAR",
    low_minor: prices[Math.floor((prices.length - 1) * 0.25)],
    high_minor: prices[Math.ceil((prices.length - 1) * 0.75)],
    as_of: new Date(now).toISOString(),
    confidence: "Limited",
    type: "calculated_estimate",
    reason:
      "Middle 50% of matched documented sale prices. Not a professional appraisal; fees and unverified grading can affect comparability.",
    evidence,
  };
}
