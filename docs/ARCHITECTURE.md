# Architecture and audit

The original checkout contained only `README.md`. The prior implementation was a static cryptocurrency landing page with Vite, no accounts, no API and no persistence. It has been replaced by a South African numismatic application; no legacy customer data existed to migrate.

## Application boundary

- **React + Vite:** public landing page; catalogue and source details; identification/camera workspace; collection inventory, costs, research list and Pro analytics; plan and account screens. No credentials or entitlements are trusted from the browser.
- **Express 5 / Node.js 24:** same-origin JSON API, cookie sessions, CSRF and origin checks, validation, per-route limits, private image serving, reports, AI and payment adapters. Production serves the built frontend through the same process. The development Vite proxy forwards `/api` to port 3001.
- **SQLite:** versioned SQL migrations, WAL and foreign keys, prepared statements, atomic usage reservation and collection-capacity enforcement. All personal objects are scoped to an authenticated owner. Sessions are opaque random tokens, hashed at rest; passwords use scrypt with per-password salts. Email verification and recovery use one-use, expiring hashed tokens and the Resend API; production requires verified email by default. Recovery revokes all existing sessions. Mail is not claimed delivered unless acknowledged by its provider.
- **Private files:** generated UUID filenames, directory mode 0700 / file mode 0600, no public upload mount. Sharp decodes a bounded image, rejects unsupported formats and animation, limits pixel count and re-encodes JPEG without original metadata. Every image request checks ownership. Images are not sent to AI on upload.

SQLite and in-process rate limiting are appropriate to a **single application instance on a durable local volume**. Horizontal replicas, a shared network filesystem, or serverless ephemeral storage are not supported by this deployment. Migrate storage to PostgreSQL, object storage with owner-scoped signed access, and shared rate limiting before scaling across instances. The file/database boundary is not transactionally atomic; failed file cleanup must be investigated. Account deletion removes files before owner metadata so deletion can be retried.

## Data boundaries

1. `catalogue` and `catalogue_reviews`: editorial introductions vs explicitly reviewed catalogue facts. Six original starter summaries are marked `reference_pending`. Source links are orientation, not verification of the date coverage, composition, mintages or varieties. No proprietary reference text or reference photography is bundled.
2. `market_evidence`: independently reviewed observations with sale/asking/bid/catalogue/melt type, currency, original source, date, rights note and fee basis. **There are no market records in the shipped database.** There is no scraping or auction-feed integration pretending to be live.
3. `assessments`: AI predictions stored separately with the provider model and input photographs. Strict structured output; no price field. Poor-quality images force low model confidence, which is explicitly not a calibrated probability or a certification.
4. `coins`: personal, owner-reported identity, condition, quantity, acquisition cost and provenance; not catalogue truth.
5. `valuation_snapshots`: genuine dated estimates generated only from qualifying sale evidence. No backfill, synthetic appreciation curve or zero for unknowns. Snapshots retain identity and original quantity. Deleting the coin deletes its snapshots. Aggregate histories cover only the recorded surviving coin records at each observation date, not a guaranteed complete historical portfolio.
6. `varieties`: reviewed, licensed research records with distinguishing features, evidence, source and reviewer. Empty until supplied. Possible AI varieties never enter this table automatically.

## Estimation method

An entry must first be independently source-verified. A range requires at least three verified ZAR **completed sales** matching catalogue identity, year, mint mark and owner-reported condition, no more than two years old and not in the future. The interval is the middle 50% of observed prices (inclusive indexed quartiles), labelled a limited-confidence calculated estimate. No automatic condition multipliers, currency conversions, gold prices, liquidity adjustments or forecasts are invented. Fees are identified on individual evidence records; differences and owner grading can still limit comparability. Sparse/missing evidence produces `unavailable`, never a price of zero. Acquisition cost stays separate.

## AI adapter

`server/integrations/ai.js` calls the official OpenAI HTTPS chat-completions endpoint with the configured vision-capable model and a strict JSON schema. Sanitised private JPEG images are sent as base64 only after explicit consent. Output remains tentative. Provider errors or schema failures release the reserved monthly scan; completed but insufficient-quality observations consume a scan because a provider request did execute. Rate and capacity checks also apply on the server. Local synthetic test responses validate the contract; a live model, accuracy, calibration and provider retention configuration have **not** been verified without credentials.

## Billing adapter

Paystack is the selected adapter, subject to merchant eligibility, South African recurring-payment availability, settlement and live-account approval. Checkout checks the configured plan’s ZAR amount and monthly interval at the provider before redirecting to an allowlisted HTTPS checkout host. Return URLs do not grant access. Webhooks require a raw local `PAYSTACK_WEBHOOK_SECRET` (not a network-proxy placeholder) for raw-body HMAC SHA-512 verification, transaction/subscription verification through the provider, exact amount/currency/plan/customer/reference checks, and idempotent receipt/event storage. An active paid-through timestamp controls access, not the UI. Renewal cancellation calls the provider and retains the paid period. Failed verification does not grant access and returns a retryable error where appropriate.

Checkout defaults off and additionally requires `PAID_FEATURES_READY`, AI configuration and reviewed completed-sale evidence. This operator gate is not an automated declaration of accuracy or business readiness. Provider lifecycle and real card/bank flows must be tested in the merchant’s environment before enabling it. Subscription confirmation must associate a provider subscription code before in-app cancellation is available; unavailable confirmation is an explicit error, never a fake cancellation. Failed charges do not extend access. Signed duplicate charges cannot extend access beyond their original paid period.

## Assessment and selling extension

Downloadable coin dossiers and collection reports are HTML documents that can be printed to PDF and deliberately shared by their owner. There are no public links to private inventory. No dealer, expert, commission, referral or marketplace order is represented as operational. A future partner integration should implement an assessment adapter with verified partner onboarding, consented dossier delivery, request status, deletion/retention controls and explicit commercial disclosures. Do not enable a referral merely by inserting a logo or a contact address.
