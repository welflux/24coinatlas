# 24CoinAtlas

[Download the Hostinger Node.js source ZIP](downloads/24CoinAtlas-node-source.zip?raw=true) · [Hostinger upload instructions](docs/HOSTINGER.md)

A South African **collectible-coin** research and private collection application. It is not a cryptocurrency app. It covers registration, persistent coin records, secure photographs, acquisition costs, catalogue research, research lists, exports, gated analytics and integration boundaries for identification and subscriptions.

**Commercial launch is not ready:** no AI/payment credentials, licensed completed-sale data, verified variety dataset or expert partners are supplied. The app communicates these limitations and never substitutes fabricated prices, scans, testimonials or successful payments. Read [the launch checklist](docs/PRODUCTION.md) before enabling billing.

## Run locally

Requires **Node.js 24** and npm. Use the existing checkout; isolated cloud tasks do not need a Git worktree.

```sh
npm ci
# Optional: copy .env.example to .env and edit your own local configuration.
npm run db:migrate
npm run dev
```

The frontend uses port 3000; the API uses port 3001. Access development through `localhost` so the browser's origin matches the default `APP_ORIGIN=http://localhost:3000`. For a different host, set the actual origin explicitly. No credentials are required for local accounts, collections, uploads, catalogue browsing or CSV exports. You create your own account; no shared admin or demo credentials are seeded. The combined development runner restarts Vite changes automatically; restart it after backend changes, or use `npm run dev:api` separately for API watch mode.

Data is stored in ignored `.data/atlas.sqlite` and private `.data/uploads/`. Set `DATA_DIR` to a durable, writable path to change it. Never commit this directory. Migrations run on API startup and can also be applied explicitly with `npm run db:migrate`.

## Validate

```sh
npm test
npm run test:browser
npm audit
```

Backend tests use real disposable SQLite databases and synthetic fixtures (not claimed market data). They exercise auth, ownership, CSRF, upload validation, persistent CRUD, usage enforcement, valuation evidence, report escaping and payment verification. Browser tests run an isolated application with real frontend/API interaction and automated accessibility checks. They use `/usr/bin/chromium` when available; otherwise install a Playwright browser with `npx playwright install chromium`, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Browser binaries and any system libraries require the appropriate platform access. Synthetic test data never enters the normal development database.

## Production build

```sh
npm run build
# Configure APP_ORIGIN=https://YOUR_HOST and a persistent DATA_DIR first.
npm start
```

Production serves the React app and API together on port 3001 (or `PORT`). Deploy behind HTTPS with the correct trusted proxy setting. This is a server-backed application; opening `dist/index.html` as an isolated file cannot provide accounts or persistence. See [deployment, backup and readiness instructions](docs/PRODUCTION.md) and the [architecture](docs/ARCHITECTURE.md). A Dockerfile is provided; no container deployment is claimed to have been performed.

## What works, and what needs a provider

| Workflow           | Current behaviour                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accounts           | Registration, login, logout, profile/password changes, email verification/recovery adapters, session revocation and account deletion                          |
| Private collection | Persistent CRUD, quantities, source links, provenance, condition notes, per-unit acquisition costs, search and inventory CSV                                  |
| Photographs        | Obverse/reverse upload or device camera, validation, metadata removal, owner-only access and deletion                                                         |
| Catalogue          | Six clearly unverified editorial starter records, search/era filters, official reference links and data-import path                                           |
| AI identification  | Official provider adapter and structured prediction storage; explicitly unavailable without credentials; never automatically becomes a catalogue fact         |
| Valuation          | No seeded prices. Requires reviewed identity and at least three matching ZAR completed sales in the last two years                                            |
| Pro research       | Server-gated sales evidence, reviewed variety records, era/activity analytics, actual captured value history and printable coin/collection dossiers           |
| Subscription       | Configurable entitlements, Paystack checkout/signature/verification/cancellation adapters and idempotency; charging disabled pending operational verification |
| Selling/experts    | Owner-downloadable dossiers; partners, referrals and paid commissions unavailable                                                                             |

Verification and one-use password-recovery flows are implemented, but their mail provider and verified sender are not configured. Live provider acceptance tests, licensed market feeds, production monitoring and off-host backups are also outstanding. These are explicit launch prerequisites, not implied working integrations.

## Authorised catalogue and evidence import

```sh
npm run data:import -- /private/path/to/authorised-data.json
npm run data:snapshot
```

See [the data contract](docs/DATA.md). Import is an operator-only CLI, not a public browser endpoint. Never copy data without permission or mark an entry verified just to unlock estimates. No generated sale history or arbitrary condition-price multipliers are used.

## Environment settings

`.env.example` documents all configurable values, including ZAR pricing and Free/Pro limits. `COIN_AI_API_KEY` is used only by the server for `api.openai.com`; `PAYSTACK_SECRET_KEY` only for outbound `api.paystack.co` requests. The separate `PAYSTACK_WEBHOOK_SECRET` requires the actual key in a secure server-side runtime secret store to verify HMAC signatures; network-proxy placeholders cannot perform that local computation. Resend delivery requires `RESEND_API_KEY` and a verified `MAIL_FROM`. Never put either in a `VITE_` variable or a frontend bundle. Payment flags default false. Provider credentials must be entered securely through your deployment/environment settings, never chat or source control.
