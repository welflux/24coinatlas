# Deployment and production-readiness checklist

## What is ready for local development

Registration, sign-in/out, password changes, session revocation, private persistent collection CRUD, acquisition-cost totals, private sanitised uploads, research lists, catalogue search, basic CSV exports, Pro-gated analytics and printable reports, structured integration adapters, signed webhook handling, configurable server limits, migrations and maintenance commands. Backend tests use disposable databases and explicit synthetic fixtures; browser tests exercise real frontend/API flows against isolated local storage.

## Required before a commercial launch

- [ ] Obtain authorised, independently reviewed South African catalogue and date/variety data. Source-check the starter entries; they remain unverified until then. Secure rights for any detailed reference photographs.
- [ ] Obtain permission/licences for completed-sale evidence. Import provenance and fee basis. Validate estimator matching against specialist review; sufficiently varied and representative sales matter, not merely a numeric record count.
- [ ] Configure an approved AI account, a compatible model and egress to `api.openai.com`. Run real obverse/reverse, poor-image, non-coin, scarce-date and adversarial cases. Establish acceptable provider privacy/retention terms and a budget/abuse ceiling.
- [ ] Configure a South African Paystack merchant account, validate eligibility for recurring ZAR payments, plan code, amount, taxes/invoicing and account permissions. Egress to `api.paystack.co` is required. Set `PAYSTACK_WEBHOOK_SECRET` to the actual merchant secret through a secure runtime secret store; a network-proxy credential placeholder cannot perform local HMAC verification. Register `https://YOUR_HOST/api/billing/webhook` and verify test-mode checkout, renewal, out-of-order and duplicate webhooks, declines, cancellation, expiry and refunds. Reconcile subscription/transaction response shapes against the live account. Refund/dispute operational handling is a launch prerequisite; the app does not claim to administer refunds.
- [ ] Connect the implemented verification and one-use password-recovery workflows to Resend (`RESEND_API_KEY`, a verified `MAIL_FROM`, and egress to `api.resend.com`), test actual delivery, and establish a real support channel. Production requires verified email by default; registration fails closed when required mail delivery is unconfigured. No live mail delivery is claimed.
- [ ] Review POPIA obligations, privacy/data-subject procedures, consent, provider cross-border processing, retention, deletion from backups, consumer subscription terms and South African tax requirements with appropriate advisers. No legal review or compliance certification is implied.
- [ ] Provision HTTPS, a durable local disk, restrictive volume permissions, encryption at rest (including provider subscription cancellation tokens in the database), deployment secrets and trusted proxy settings. Run only one app instance; avoid network-mounted SQLite and ephemeral/serverless disks.
- [ ] Set actual `APP_ORIGIN=https://YOUR_HOST`; leave `TRUST_PROXY=0` unless exactly one trusted proxy normalises forwarded headers. Prevent direct public bypass of that proxy. Secure cookies depend on HTTPS and `NODE_ENV=production`.
- [ ] Configure resource limits, log rotation, disk alerts, request/error monitoring, provider timeout alerts, backup scheduling, encrypted off-host backup retention and an independently tested restoration. Health checks do not prove every integration works.
- [ ] Load-test expected image/concurrent request volume, verify authentication and collection authorization independently, and run accessibility/manual assistive technology testing on target devices. Automated tests are useful evidence, not a penetration test or an accessibility certification.
- [ ] Verify that the advertised paid capabilities are operational for actual users, validate R99–R149 demand and choose a price; only then set `PAID_FEATURES_READY=true` and `BILLING_ENABLED=true`. These flags must remain false otherwise.

No deployment, live payment, live AI identification, production data licence or external partnership is claimed by the delivered local build.

## Production process

Use Node.js 24 and an HTTPS reverse proxy, then:

```sh
npm ci
npm test
npm run build
# Supply deployment environment securely; APP_ORIGIN must use HTTPS.
npm start
```

The production server serves `dist/` and `/api` from port 3001 by default. Forward both through the same origin. A filesystem-only HTML preview cannot operate this application: the API and database must be running. `/api/health` performs a database read. Do not expose `.data`, `.env`, backups or source maps through a web server. There are no frontend secrets, external font requests or image CDN dependencies.

The provided Dockerfile builds the frontend and runs the Node backend as `node`. Mount a durable volume at `/app/.data`; inject production settings via your deployment platform. The container image itself has not been built or published in this environment. Supply `APP_ORIGIN` before starting it or the production safety check will intentionally reject HTTP.

## Maintenance and retention

Run `npm run data:maintain` daily to remove expired sessions and unattached photographs older than 30 days (and associated old scan records through foreign-key cascades). Attached collection photographs remain until explicitly removed or the account is deleted. Run `npm run data:snapshot` daily after approved evidence updates; it only records supported estimates for that date and never backfills imaginary history. Both commands are idempotent.

Monitor orphan files after failures at the filesystem/database boundary. The application log records only a request ID, method and error category for unexpected failures; it deliberately omits passwords, tokens, photographs, personal notes and provider payloads. Connect a real monitoring sink and retention policy in deployment.

## Backup and restore

Stop application writes first so the database and images are a coordinated snapshot:

```sh
# Stop the managed application process before this command.
BACKUP_WRITES_STOPPED=true npm run db:backup -- /safe/destination/atlas-backup
```

The command makes a SQLite online backup and copies the private uploads directory. The destination must not already exist. Restrict and encrypt the backup, copy it off-host, and apply a documented expiry policy. Local snapshots contain personal data and payment cancellation tokens; never serve or commit them.

To restore: keep the app stopped, preserve the current data directory, copy `atlas.sqlite` and `uploads/` from the same backup into a new private data directory, set owner permissions (directory 0700, files 0600), point `DATA_DIR` to it, run `npm run db:migrate`, then start and verify login, a private image, a collection inventory and ownership isolation. Do not mix a database with another backup’s photographs or overwrite a running WAL database. Account deletion cannot retroactively erase an independently retained backup; apply the operator’s deletion/retention policy.
