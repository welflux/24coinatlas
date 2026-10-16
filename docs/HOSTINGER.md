# Hostinger deployment guide

This package is suitable for a **test deployment only**, conditional on the hosting capabilities below. The Hostinger account, plan, Node versions, persistent storage behaviour and dashboard settings have not been inspected or verified. The application has not been deployed to Hostinger.

## Hosting requirements

- A Node.js application service or a VPS with **Node.js 24**. A static-only or PHP-only upload will not run the API, authentication or database.
- A continuously running Node process behind HTTPS, serving the frontend and API on the same origin.
- A private, writable **persistent local data directory** retained across restarts and deployments. SQLite and uploaded photographs must not live on an ephemeral release filesystem. Confirm this with Hostinger before accepting collection data. Use only one application instance, not multiple replicas or network-mounted SQLite.
- npm install/build access and the ability to set server-side environment variables and secrets.

If your managed Node.js plan does not meet these requirements, use a suitable VPS or adapt storage and the runtime before deploying. Do not assume that successfully uploading a ZIP establishes compatibility.

## Upload and application settings

The ZIP has `package.json` at its root and includes source, lockfile, migrations, tests, deployment documentation and a freshly built `dist/`. It excludes `node_modules`, Git metadata, credentials, local databases, user photographs, backups and browser test artifacts. Dependencies must be installed on the host; native packages must not be copied from another operating system.

1. Select a Node.js application deployment in hPanel **if available on your plan**, and upload/extract the ZIP with its package files at the application root. On a VPS, extract to your chosen release directory instead.
2. Choose Node.js 24. Install with `npm ci` and build with `npm run build`. Build dependencies must be available during this step; do not omit development dependencies before building.
3. Use `npm start` as the start command. If the platform requires an entry file, use `server/index.js` and ensure `NODE_ENV=production` is supplied. The platform's `PORT` is respected; do not replace an assigned port with the development port.
4. Configure your real HTTPS domain and the variables below. Route all paths, including `/api`, to the Node application. Do not deploy only `dist/` to `public_html` and expect the application to work.
5. Migrations run at API startup. Optionally run `npm run db:migrate` explicitly. Never replace an existing data directory with this ZIP.

### Required runtime configuration

| Variable              | Setting                                                                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`            | `production`                                                                                                                             |
| `APP_ORIGIN`          | Your exact HTTPS origin, e.g. `https://coins.your-domain.co.za`, without a path                                                          |
| `DATA_DIR`            | Actual absolute path to the private persistent directory provisioned on your host                                                        |
| `TRUST_PROXY`         | Keep `0` unless Hostinger confirms exactly one trusted proxy normalises forwarded headers; then use `1` and prevent direct public bypass |
| `BILLING_ENABLED`     | `false` until the commercial readiness checklist is complete                                                                             |
| `PAID_FEATURES_READY` | `false` until genuine paid services are verified                                                                                         |

Do not copy the development `.env.example` values unchanged into production. Configure secrets in server-side hosting settings, never `VITE_` variables or public files.

Production requires verified email by default. To enable registration and account recovery, configure `RESEND_API_KEY`, a verified sender in `MAIL_FROM`, and delivery access to `api.resend.com`. Until then, registration returns a clear unavailable response; mail delivery is not simulated.

Optional identification needs `COIN_AI_API_KEY`, a compatible `COIN_AI_MODEL` and access to `api.openai.com`. Payments need a South African merchant account, recurring-ZAR eligibility, `PAYSTACK_SECRET_KEY`, `PAYSTACK_PLAN_CODE`, and the actual merchant key in `PAYSTACK_WEBHOOK_SECRET` for local HMAC verification. A proxy placeholder cannot verify a signature. Register the real HTTPS webhook endpoint only after provider setup. Leave charging off until real provider tests, evidence data, pricing, cancellation and support workflows have passed review.

## Verify the deployment

Confirm `/api/health` returns `{"status":"ok","database":"connected"}` and that a direct visit to `/app/catalogue` loads the application. After configuring mail, verify registration, actual email delivery, sign-in, private image upload, collection creation, inventory download, logout and cross-account isolation. Restart the application and confirm the same records and images remain. Verify persistence again after a deployment before using it for real collections.

Configure encrypted off-host backups and perform a restore rehearsal. See [PRODUCTION.md](PRODUCTION.md) for the complete launch checklist, backup/restore procedure and remaining data/provider dependencies. Six starter catalogue entries are explicitly unverified; no market prices or rare-variety data are supplied. Successful hosting alone does not make the product ready to charge customers.
