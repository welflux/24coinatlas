# Authorised data contract

`npm run data:import -- /absolute/path/to/data.json` validates and imports an operator-supplied JSON file transactionally. It accepts three arrays: `catalogue`, `evidence` and `varieties`; omitted arrays default to empty. No network ingestion or permission to scrape is implied. Importing the same catalogue ID updates its facts and adds a review log; evidence and varieties are insert-once by ID. Correcting an existing observation requires a deliberate database maintenance/review operation rather than silently rewriting a sale. Always back up first.

The following empty file is valid and does not invent records:

```json
{ "catalogue": [], "evidence": [], "varieties": [] }
```

Inspect the Zod schemas in `scripts/import-data.mjs` for exact validation and allowed limits. Required fields:

| Record    | Fields                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalogue | `id` (lowercase slug), `name`, `denomination`, `era`, `country_code` (optional ISO-style two-letter code, default `ZA`), `start_year`, `end_year` (integer or null), `description` (original/licensed summary), `metal` (string or null), `mintage` (integer or null), `source_url` (HTTPS), `source_name`, `variety_notes`, `rights_note` (at least 20 characters), `reviewer`, `reviewed_at` (ISO date, not future) |
| Evidence  | `id`, `catalogue_id`, `year`, `mint_mark` (blank if none), `condition`, `type`, `amount_minor` (positive ZAR cents), `currency` (`ZAR`), `observed_at` (ISO date), `source_url` (HTTPS), `source_name`, `rights_note` (at least 20 characters), `verified_at` (ISO date), `includes_fees` (boolean)                                                                                                                   |
| Variety   | `id`, `catalogue_id`, `name`, `year` (integer or null), `mint_mark` (string or null), `distinguishing_features` (at least 20 characters), `evidence_summary` (at least 20 characters), `source_url` (HTTPS), `source_name`, `rights_note` (at least 20 characters), `reviewer`, `reviewed_at` (ISO date)                                                                                                              |

Evidence types are `completed_sale`, `asking_price`, `dealer_bid`, `catalogue_estimate` and `melt_value`. Only completed sales support the current collector-price estimator. Supported conditions are Poor, Fair, Good, Very Good, Fine, Very Fine, Extremely Fine, About Uncirculated, Uncirculated and Proof. A professionally certified numerical grade is not inferred from these broad owner-reported categories. `Not assessed` is allowed in personal records but cannot match valuation evidence.

Keep distinct issues and varieties under distinct catalogue IDs where needed. A broad series-level starter is not enough to establish that two coins are comparable. Research whether fees, taxes, lots containing multiple coins, currencies, proof/bullion distinctions, altered coins and grading assumptions invalidate a proposed match. The current uniqueness constraint prevents a duplicate source URL for the same issue/year/condition/type; maintain immutable original lot URLs and review duplicate relistings separately. Price evidence must not be an AI guess.

The importer records a human review; it does not perform that review, establish data rights or validate the source's truth. A homepage link alone is not sufficient evidence to mark an issue or variety verified. Retain the original permitted reference and relevant page/lot identifiers in the source URL and rights/review notes. No automatic import is performed on application startup.

`npm run data:snapshot` captures only presently supportable coin valuations once per coin/identity/day. It is repeatable and records nothing when prices are unavailable. Schedule it after genuine market updates. Historical series begin when observations actually start; existing coins are not assigned invented past values.
