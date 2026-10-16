import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import multer from "multer";
import sharp from "sharp";
import { randomUUID, createHash } from "node:crypto";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { z, ZodError } from "zod";
import { loadConfig } from "./config.js";
import { openDatabase } from "./db.js";
import {
  hash,
  hashPassword,
  verifyPassword,
  token,
  parseCookies,
} from "./security.js";
import { createAiService } from "./integrations/ai.js";
import {
  createPaystack,
  validSignature,
  checkedCharge,
} from "./integrations/paystack.js";
import { getValuation } from "./valuation.js";
import { inventoryCsv, coinReport, collectionReport } from "./reports.js";
import { identityKey } from "./history.js";
import { createMailer } from "./integrations/mail.js";

class HttpError extends Error {
  constructor(status, message, code = "REQUEST_FAILED") {
    super(message);
    this.status = status;
    this.code = code;
  }
}
const fail = (status, message, code) => {
  throw new HttpError(status, message, code);
};
const conditions = [
  "Not assessed",
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
];
const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters")
  .max(128);
const emailSchema = z.string().trim().toLowerCase().email().max(254);
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v &&
      v <= new Date().toISOString().slice(0, 10),
    "Use a valid date that is not in the future",
  );
const coinSchema = z
  .object({
    catalogue_id: z.string().max(80).nullable().default(null),
    name: z.string().trim().min(1).max(180),
    denomination: z.string().trim().max(60).default(""),
    year: z
      .number()
      .int()
      .min(1500)
      .max(new Date().getFullYear())
      .nullable()
      .default(null),
    mint_mark: z.string().trim().max(30).default(""),
    condition: z.enum(conditions).default("Not assessed"),
    quantity: z.number().int().min(1).max(10000).default(1),
    purchase_minor: z
      .number()
      .int()
      .min(0)
      .max(100000000000)
      .nullable()
      .default(null),
    acquired_at: dateSchema.nullable().default(null),
    provenance: z.string().trim().max(2000).default(""),
    notes: z.string().trim().max(4000).default(""),
    photo_ids: z.array(z.string().uuid()).max(2).default([]),
  })
  .strict();

export function createApplication(overrides = {}, services = {}) {
  const config = loadConfig(overrides),
    db = services.db || openDatabase(config.dataDir);
  const ai = services.ai || createAiService(config),
    payments = services.payments || createPaystack(config);
  const mailer = services.mailer || createMailer(config);
  const mailReady = () => Boolean(config.mailKey && config.mailFrom);
  const app = express(),
    cookieName = config.production ? "__Host-atlas_session" : "atlas_session";
  if (config.trustProxy) app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "blob:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          formAction: ["'self'"],
          ...(config.production ? {} : { upgradeInsecureRequests: null }),
        },
      },
    }),
  );
  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.setHeader("X-Request-Id", req.requestId);
    if (req.path.startsWith("/api")) res.setHeader("Cache-Control", "no-store");
    next();
  });
  const limit = (max, windowMs = 60000) =>
    rateLimit({
      windowMs,
      limit: max,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      handler: (_req, res) =>
        res.status(429).json({
          error: "Too many requests. Please try again shortly.",
          code: "RATE_LIMIT",
        }),
    });
  app.use("/api", limit(180));

  function entitlement(userId) {
    const subscription = db
      .prepare(
        "SELECT status,current_period_end FROM subscriptions WHERE user_id=?",
      )
      .get(userId);
    const pro =
      ["active", "non_renewing", "past_due", "cancelled"].includes(
        subscription?.status,
      ) && subscription.current_period_end > Date.now();
    const month = new Date().toISOString().slice(0, 7);
    const used =
      db
        .prepare("SELECT scans FROM monthly_usage WHERE user_id=? AND month=?")
        .get(userId, month)?.scans || 0;
    return {
      plan: pro ? "pro" : "free",
      scan_limit: pro ? config.proScans : config.freeScans,
      scans_used: used,
      collection_limit: pro ? config.proCollection : config.freeCollection,
      month,
      subscription: subscription || {
        status: "inactive",
        current_period_end: null,
      },
    };
  }
  const billingReady = () =>
    Boolean(
      config.billingEnabled &&
      config.paidFeaturesReady &&
      config.aiKey &&
      config.paystackKey &&
      config.paystackWebhookSecret &&
      config.paystackPlan &&
      db
        .prepare(
          "SELECT COUNT(*) n FROM market_evidence e JOIN catalogue c ON c.id=e.catalogue_id WHERE e.type='completed_sale' AND c.verification='verified'",
        )
        .get().n >= 3,
    );
  const publicUser = (u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    email_verified: Boolean(u.email_verified_at),
    created_at: u.created_at,
    entitlements: entitlement(u.id),
  });

  app.post(
    "/api/billing/webhook",
    express.raw({ type: "application/json", limit: "256kb" }),
    async (req, res) => {
      if (
        !Buffer.isBuffer(req.body) ||
        !validSignature(
          req.body,
          req.get("x-paystack-signature"),
          config.paystackWebhookSecret,
        )
      )
        fail(401, "Invalid webhook signature");
      const digest = createHash("sha256").update(req.body).digest("hex");
      if (
        db
          .prepare("SELECT digest FROM payment_events WHERE digest=?")
          .get(digest)
      )
        return res.json({ received: true, duplicate: true });
      let event;
      try {
        event = JSON.parse(req.body.toString());
      } catch {
        fail(400, "Invalid webhook payload");
      }
      const data = event.data || {};
      if (event.event === "charge.success") {
        if (typeof data.reference !== "string")
          fail(400, "Missing payment reference");
        if (
          !db
            .prepare("SELECT reference FROM payment_receipts WHERE reference=?")
            .get(data.reference)
        ) {
          let verified;
          try {
            verified = await payments.verify(data.reference);
          } catch {
            fail(503, "Payment verification temporarily unavailable");
          }
          let checked;
          try {
            checked = checkedCharge(verified, config, data.reference);
          } catch {
            fail(422, "Payment does not match a verified subscription");
          }
          const checkout = db
            .prepare("SELECT user_id FROM checkouts WHERE reference=?")
            .get(data.reference);
          const existing = db
            .prepare("SELECT user_id FROM subscriptions WHERE customer_code=?")
            .get(checked.customer);
          const userId = checkout?.user_id || existing?.user_id;
          if (!userId)
            fail(503, "Subscription association is not available yet");
          const user = db
            .prepare("SELECT email FROM users WHERE id=?")
            .get(userId);
          if (verified.customer.email?.toLowerCase() !== user.email)
            fail(422, "Payment customer mismatch");
          db.exec("BEGIN IMMEDIATE");
          try {
            const receipt = db
              .prepare(
                "INSERT OR IGNORE INTO payment_receipts(reference,user_id,paid_at) VALUES(?,?,?)",
              )
              .run(data.reference, userId, verified.paid_at);
            if (receipt.changes)
              db.prepare(
                `INSERT INTO subscriptions(user_id,status,customer_code,current_period_end) VALUES(?,'active',?,?)
            ON CONFLICT(user_id) DO UPDATE SET status='active',customer_code=excluded.customer_code,
            current_period_end=MAX(COALESCE(subscriptions.current_period_end,0),excluded.current_period_end),updated_at=CURRENT_TIMESTAMP`,
              ).run(userId, checked.customer, checked.expires);
            db.prepare(
              "UPDATE checkouts SET status='paid' WHERE reference=?",
            ).run(data.reference);
            db.exec("COMMIT");
          } catch (error) {
            db.exec("ROLLBACK");
            throw error;
          }
        }
      } else if (
        [
          "subscription.create",
          "subscription.disable",
          "subscription.not_renew",
          "invoice.payment_failed",
        ].includes(event.event)
      ) {
        const code =
          data.subscription_code || data.subscription?.subscription_code;
        if (typeof code !== "string") fail(422, "Missing subscription code");
        let verified;
        try {
          verified = await payments.subscription(code);
        } catch {
          fail(503, "Subscription verification temporarily unavailable");
        }
        if (
          verified.plan?.plan_code !== config.paystackPlan ||
          verified.subscription_code !== code
        )
          fail(422, "Subscription plan mismatch");
        const existing = db
          .prepare("SELECT user_id FROM subscriptions WHERE customer_code=?")
          .get(verified.customer?.customer_code || "");
        if (!existing) fail(503, "Waiting for verified initial charge");
        const status =
          verified.status === "active"
            ? "active"
            : verified.status === "non-renewing"
              ? "non_renewing"
              : verified.status === "attention"
                ? "past_due"
                : "cancelled";
        db.prepare(
          "UPDATE subscriptions SET status=?,provider_code=?,email_token=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?",
        ).run(status, code, verified.email_token || null, existing.user_id);
      }
      db.prepare(
        "INSERT OR IGNORE INTO payment_events(digest,event_type) VALUES(?,?)",
      ).run(digest, String(event.event || "unknown").slice(0, 100));
      res.json({ received: true });
    },
  );

  app.use(express.json({ limit: "64kb" }));
  app.use("/api", (req, _res, next) => {
    const raw = parseCookies(req.headers.cookie)[cookieName];
    if (raw) {
      const session = db
        .prepare(
          "SELECT s.*,u.email,u.name,u.created_at,u.email_verified_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE token_hash=? AND expires_at>?",
        )
        .get(hash(raw), Date.now());
      if (session) {
        req.session = session;
        req.user = {
          id: session.user_id,
          email: session.email,
          name: session.name,
          created_at: session.created_at,
          email_verified_at: session.email_verified_at,
        };
      }
    }
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      if (req.get("origin") !== config.origin)
        fail(403, "Request origin is not allowed", "ORIGIN");
      if (req.session && req.get("x-csrf-token") !== req.session.csrf)
        fail(
          403,
          "Your session needs refreshing. Reload the page and try again.",
          "CSRF",
        );
    }
    next();
  });
  function auth(req, _res, next) {
    if (!req.user) fail(401, "Sign in to continue", "AUTH_REQUIRED");
    if (config.requireVerifiedEmail && !req.user.email_verified_at)
      fail(403, "Verify your email before continuing.", "EMAIL_NOT_VERIFIED");
    next();
  }
  function pro(req, _res, next) {
    if (entitlement(req.user.id).plan !== "pro")
      fail(
        403,
        "This research feature requires an active Pro subscription.",
        "PRO_REQUIRED",
      );
    next();
  }
  function startSession(user, res) {
    const raw = token(),
      csrf = token();
    db.prepare(
      "INSERT INTO sessions(token_hash,user_id,csrf,expires_at) VALUES(?,?,?,?)",
    ).run(hash(raw), user.id, csrf, Date.now() + 7 * 86400000);
    res.cookie(cookieName, raw, {
      httpOnly: true,
      secure: config.production,
      sameSite: "strict",
      maxAge: 7 * 86400000,
      path: "/",
    });
    return csrf;
  }
  function ownedCoin(req) {
    const coin = db
      .prepare("SELECT * FROM coins WHERE id=? AND user_id=?")
      .get(req.params.id, req.user.id);
    if (!coin) fail(404, "Coin not found");
    return coin;
  }
  function ownedPhoto(id, userId) {
    const photo = db
      .prepare("SELECT * FROM photos WHERE id=? AND user_id=?")
      .get(id, userId);
    if (!photo) fail(404, "Photograph not found");
    return photo;
  }
  const photoPath = (p) => resolve(config.dataDir, "uploads", p.file_name);
  function recordEvent(userId, action, name) {
    db.prepare(
      "INSERT INTO collection_events(id,user_id,action,coin_name) VALUES(?,?,?,?)",
    ).run(randomUUID(), userId, action, name);
  }

  app.get("/api/health", (_req, res) => {
    db.prepare("SELECT 1").get();
    res.json({ status: "ok", database: "connected" });
  });
  app.get("/api/capabilities", (_req, res) =>
    res.json({
      ai: {
        available: Boolean(config.aiKey),
        reason: config.aiKey
          ? null
          : "AI identification is not connected yet. You can still catalogue and record your coins manually.",
      },
      billing: {
        available: billingReady(),
        reason:
          "Checkout remains disabled until provider configuration and operational paid services have been verified.",
      },
      catalogue: {
        scope:
          "Introductory reference-linked records, awaiting independent source verification. Not a complete date or variety catalogue.",
        verified: db
          .prepare(
            "SELECT COUNT(*) n FROM catalogue WHERE verification='verified'",
          )
          .get().n,
      },
      auth: {
        email_available: mailReady(),
        verification_required: config.requireVerifiedEmail,
      },
      market_evidence_count: db
        .prepare("SELECT COUNT(*) n FROM market_evidence")
        .get().n,
      plans: {
        free: {
          monthly_scans: config.freeScans,
          collection_limit: config.freeCollection,
        },
        pro: {
          monthly_scans: config.proScans,
          collection_limit: config.proCollection,
          price_minor: config.proPrice,
          currency: "ZAR",
        },
      },
    }),
  );
  app.get("/api/auth/me", (req, res) =>
    res.json({
      user: req.user ? publicUser(req.user) : null,
      csrf: req.session?.csrf || null,
    }),
  );
  app.post("/api/auth/register", limit(8, 3600000), async (req, res) => {
    const data = z
      .object({
        name: z.string().trim().min(1).max(80),
        email: emailSchema,
        password: passwordSchema,
      })
      .strict()
      .parse(req.body);
    if (config.requireVerifiedEmail && !mailReady())
      fail(
        503,
        "Account registration is waiting for secure verification-email delivery.",
        "MAIL_UNAVAILABLE",
      );
    const password_hash = await hashPassword(data.password),
      id = randomUUID();
    try {
      db.prepare(
        "INSERT INTO users(id,email,name,password_hash) VALUES(?,?,?,?)",
      ).run(id, data.email, data.name, password_hash);
    } catch (error) {
      if (error.code?.startsWith("ERR_SQLITE"))
        fail(
          409,
          "Unable to create an account with that email. Try signing in.",
        );
      throw error;
    }
    const user = db.prepare("SELECT * FROM users WHERE id=?").get(id);
    if (config.requireVerifiedEmail) {
      await sendAccountMail(user, "verify_email");
      return res.status(201).json({
        user: null,
        csrf: null,
        verification_required: true,
        message: "Check your email to verify your account before signing in.",
      });
    }
    res
      .status(201)
      .json({ user: publicUser(user), csrf: startSession(user, res) });
  });
  const dummyHash = hashPassword(token());
  app.post("/api/auth/login", limit(12, 900000), async (req, res) => {
    const data = z
      .object({ email: emailSchema, password: z.string().min(1).max(128) })
      .strict()
      .parse(req.body);
    const user = db
      .prepare("SELECT * FROM users WHERE email=?")
      .get(data.email);
    const valid = await verifyPassword(
      data.password,
      user?.password_hash || (await dummyHash),
    );
    if (!user || !valid) fail(401, "Email or password is incorrect");
    if (config.requireVerifiedEmail && !user.email_verified_at)
      fail(
        403,
        "Verify your email before signing in. You can request a new verification message.",
        "EMAIL_NOT_VERIFIED",
      );
    if (req.session)
      db.prepare("DELETE FROM sessions WHERE token_hash=?").run(
        req.session.token_hash,
      );
    res.json({ user: publicUser(user), csrf: startSession(user, res) });
  });
  async function sendAccountMail(user, kind) {
    const raw = token(),
      expires = Date.now() + (kind === "verify_email" ? 24 * 3600000 : 3600000);
    db.prepare(
      "INSERT INTO account_tokens(token_hash,user_id,kind,expires_at) VALUES(?,?,?,?)",
    ).run(hash(raw), user.id, kind, expires);
    const link = `${config.origin}/${kind === "verify_email" ? "verify-email" : "reset-password"}?token=${raw}`;
    try {
      await mailer.send({
        to: user.email,
        subject:
          kind === "verify_email"
            ? "Verify your 24CoinAtlas email"
            : "Reset your 24CoinAtlas password",
        html: `<div style="background:#fffefb;padding:16px 20px;border-bottom:1px solid #dfe3e4;margin-bottom:24px"><img src="${config.origin}/brand/24coinatlas-logo.png" alt="24CoinAtlas" width="240" height="80" style="display:block;max-width:100%;height:auto"></div><p>${kind === "verify_email" ? "Confirm this email address to start your private collection." : "You requested a password reset. If this was not you, ignore this message."}</p><p><a href="${link}">${kind === "verify_email" ? "Verify email" : "Reset password"}</a></p><p>This one-use link expires in ${kind === "verify_email" ? "24 hours" : "one hour"}.</p>`,
      });
    } catch {
      db.prepare("DELETE FROM account_tokens WHERE token_hash=?").run(
        hash(raw),
      );
      fail(
        503,
        "Email delivery could not be confirmed. Retry from the account recovery page.",
        "MAIL_FAILED",
      );
    }
  }
  app.post(
    "/api/auth/request-verification",
    limit(5, 3600000),
    async (req, res) => {
      const { email } = z
        .object({ email: emailSchema })
        .strict()
        .parse(req.body);
      if (!mailReady())
        fail(
          503,
          "Verification email delivery is not configured.",
          "MAIL_UNAVAILABLE",
        );
      const user = db.prepare("SELECT * FROM users WHERE email=?").get(email);
      if (user && !user.email_verified_at)
        await sendAccountMail(user, "verify_email");
      res.json({
        message:
          "If an eligible account exists, a verification email has been requested.",
      });
    },
  );
  const accountToken = z.string().regex(/^[a-f0-9]{64}$/);
  app.post("/api/auth/verify-email", limit(10, 3600000), (req, res) => {
    const { token: raw } = z
      .object({ token: accountToken })
      .strict()
      .parse(req.body);
    const stored = db
      .prepare(
        "SELECT * FROM account_tokens WHERE token_hash=? AND kind='verify_email' AND expires_at>?",
      )
      .get(hash(raw), Date.now());
    if (!stored)
      fail(
        400,
        "This verification link is invalid or expired. Request a new email.",
      );
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare(
        "UPDATE users SET email_verified_at=CURRENT_TIMESTAMP WHERE id=?",
      ).run(stored.user_id);
      db.prepare(
        "DELETE FROM account_tokens WHERE user_id=? AND kind='verify_email'",
      ).run(stored.user_id);
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
    const user = db
      .prepare("SELECT * FROM users WHERE id=?")
      .get(stored.user_id);
    res.json({ user: publicUser(user), csrf: startSession(user, res) });
  });
  app.post("/api/auth/request-reset", limit(5, 3600000), async (req, res) => {
    const { email } = z.object({ email: emailSchema }).strict().parse(req.body);
    if (!mailReady())
      fail(
        503,
        "Password recovery email delivery is not configured.",
        "MAIL_UNAVAILABLE",
      );
    const user = db.prepare("SELECT * FROM users WHERE email=?").get(email);
    if (user) await sendAccountMail(user, "reset_password");
    res.json({
      message:
        "If an eligible account exists, password recovery has been requested.",
    });
  });
  app.post("/api/auth/reset-password", limit(10, 3600000), async (req, res) => {
    const data = z
      .object({ token: accountToken, password: passwordSchema })
      .strict()
      .parse(req.body);
    const password_hash = await hashPassword(data.password);
    db.exec("BEGIN IMMEDIATE");
    try {
      const stored = db
        .prepare(
          "SELECT * FROM account_tokens WHERE token_hash=? AND kind='reset_password' AND expires_at>?",
        )
        .get(hash(data.token), Date.now());
      if (!stored)
        fail(
          400,
          "This recovery link is invalid or expired. Request a new email.",
        );
      db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(
        password_hash,
        stored.user_id,
      );
      db.prepare("DELETE FROM sessions WHERE user_id=?").run(stored.user_id);
      db.prepare(
        "DELETE FROM account_tokens WHERE user_id=? AND kind='reset_password'",
      ).run(stored.user_id);
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
    res.clearCookie(cookieName, { path: "/" });
    res.json({
      message: "Password reset. Sign in again with your new password.",
    });
  });
  app.post("/api/auth/logout", auth, (req, res) => {
    db.prepare("DELETE FROM sessions WHERE token_hash=?").run(
      req.session.token_hash,
    );
    res.clearCookie(cookieName, {
      path: "/",
      secure: config.production,
      httpOnly: true,
      sameSite: "strict",
    });
    res.json({ ok: true });
  });
  app.patch("/api/account", auth, async (req, res) => {
    const data = z
      .object({
        name: z.string().trim().min(1).max(80).optional(),
        current_password: z.string().max(128).optional(),
        new_password: passwordSchema.optional(),
      })
      .strict()
      .parse(req.body);
    if (data.new_password) {
      const user = db
        .prepare("SELECT password_hash FROM users WHERE id=?")
        .get(req.user.id);
      if (
        !data.current_password ||
        !(await verifyPassword(data.current_password, user.password_hash))
      )
        fail(403, "Current password is incorrect");
      db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(
        await hashPassword(data.new_password),
        req.user.id,
      );
      db.prepare("DELETE FROM sessions WHERE user_id=? AND token_hash<>?").run(
        req.user.id,
        req.session.token_hash,
      );
    }
    if (data.name)
      db.prepare("UPDATE users SET name=? WHERE id=?").run(
        data.name,
        req.user.id,
      );
    res.json({
      user: publicUser(
        db.prepare("SELECT * FROM users WHERE id=?").get(req.user.id),
      ),
    });
  });
  app.delete("/api/account", auth, async (req, res) => {
    const { password } = z
      .object({ password: z.string().max(128) })
      .strict()
      .parse(req.body);
    const user = db
      .prepare("SELECT password_hash FROM users WHERE id=?")
      .get(req.user.id);
    if (!(await verifyPassword(password, user.password_hash)))
      fail(403, "Password is incorrect");
    const subscription = db
      .prepare("SELECT * FROM subscriptions WHERE user_id=?")
      .get(req.user.id);
    if (subscription && ["active", "past_due"].includes(subscription.status)) {
      if (
        !subscription.provider_code ||
        !subscription.email_token ||
        !config.paystackKey
      )
        fail(
          409,
          "Cancel billing before deleting your account. Contact the operator if subscription confirmation is pending.",
        );
      try {
        await payments.cancel(
          subscription.provider_code,
          subscription.email_token,
        );
      } catch {
        fail(503, "Could not cancel billing. Your account has been retained.");
      }
    }
    const photos = db
      .prepare("SELECT file_name FROM photos WHERE user_id=?")
      .all(req.user.id);
    // Remove private files before database ownership metadata, so deletion is retryable.
    for (const photo of photos)
      await unlink(resolve(config.dataDir, "uploads", photo.file_name)).catch(
        (error) => {
          if (error.code !== "ENOENT") throw error;
        },
      );
    db.prepare("DELETE FROM users WHERE id=?").run(req.user.id);
    res.clearCookie(cookieName, { path: "/" });
    res.json({ ok: true });
  });
  app.get("/api/catalogue", (req, res) => {
    const query = z
      .object({
        q: z.string().max(100).optional(),
        era: z.string().max(60).optional(),
      })
      .parse(req.query);
    const q = `%${(query.q || "").replace(/[\\%_]/g, "\\$&")}%`;
    res.json({
      items: db
        .prepare(
          `SELECT * FROM catalogue WHERE (name LIKE ? ESCAPE '\\' OR denomination LIKE ? ESCAPE '\\' OR era LIKE ? ESCAPE '\\') AND (?='' OR era=?) ORDER BY start_year DESC`,
        )
        .all(q, q, q, query.era || "", query.era || ""),
    });
  });
  app.get("/api/catalogue/:id", (req, res) => {
    const coin = db
      .prepare("SELECT * FROM catalogue WHERE id=?")
      .get(req.params.id);
    if (!coin) fail(404, "Catalogue entry not found");
    const varieties =
      req.user && entitlement(req.user.id).plan === "pro"
        ? db
            .prepare("SELECT * FROM varieties WHERE catalogue_id=?")
            .all(coin.id)
        : [];
    res.json({
      coin,
      varieties,
      variety_count: db
        .prepare("SELECT COUNT(*) n FROM varieties WHERE catalogue_id=?")
        .get(coin.id).n,
      evidence_count: db
        .prepare("SELECT COUNT(*) n FROM market_evidence WHERE catalogue_id=?")
        .get(coin.id).n,
    });
  });
  app.post("/api/catalogue/:id/valuation", auth, pro, (req, res) => {
    const data = z
      .object({
        year: z.number().int().min(1500).max(new Date().getFullYear()),
        mint_mark: z.string().max(30).default(""),
        condition: z.enum(conditions),
      })
      .strict()
      .parse(req.body);
    res.json({
      valuation: getValuation(db, { ...data, catalogue_id: req.params.id }),
    });
  });
  app.get("/api/collection", auth, (req, res) => {
    const q = z
      .string()
      .max(100)
      .parse(req.query.q || "")
      .toLowerCase();
    const all = db
      .prepare(
        "SELECT * FROM coins WHERE user_id=? ORDER BY created_at DESC,id",
      )
      .all(req.user.id);
    const items = all
      .filter((c) =>
        `${c.name} ${c.year || ""} ${c.denomination} ${c.notes}`
          .toLowerCase()
          .includes(q),
      )
      .map((c) => ({
        ...c,
        photos: db
          .prepare("SELECT id,side FROM photos WHERE coin_id=? AND user_id=?")
          .all(c.id, req.user.id),
      }));
    const known = all.filter((c) => c.purchase_minor !== null);
    res.json({
      items,
      summary: {
        records: all.length,
        coins: all.reduce((s, c) => s + c.quantity, 0),
        acquisition_minor: known.reduce(
          (s, c) => s + c.purchase_minor * c.quantity,
          0,
        ),
        costs_missing: all.length - known.length,
      },
      entitlements: entitlement(req.user.id),
    });
  });
  app.get("/api/collection/export.csv", auth, (req, res) => {
    res
      .type("text/csv")
      .attachment("24coinatlas-inventory.csv")
      .send(
        inventoryCsv(
          db
            .prepare("SELECT * FROM coins WHERE user_id=? ORDER BY name")
            .all(req.user.id),
        ),
      );
  });
  app.get("/api/collection/report", auth, pro, (req, res) => {
    const coins = db
      .prepare("SELECT * FROM coins WHERE user_id=? ORDER BY name")
      .all(req.user.id);
    res
      .type("html")
      .attachment("24coinatlas-collection-report.html")
      .send(
        collectionReport(
          coins,
          coins.map((c) => getValuation(db, c)),
        ),
      );
  });
  app.get("/api/collection/analytics", auth, pro, (req, res) => {
    const coins = db
      .prepare("SELECT * FROM coins WHERE user_id=?")
      .all(req.user.id);
    const valuations = coins.map((coin) => ({
      coin,
      valuation: getValuation(db, coin),
    }));
    const supported = valuations.filter(
      (v) => v.valuation.status === "available",
    );
    res.json({
      by_era: db
        .prepare(
          `SELECT COALESCE(c.era,'Unclassified') era,SUM(o.quantity) quantity FROM coins o LEFT JOIN catalogue c ON c.id=o.catalogue_id WHERE o.user_id=? GROUP BY era`,
        )
        .all(req.user.id),
      history: db
        .prepare(
          "SELECT action,coin_name,created_at FROM collection_events WHERE user_id=? ORDER BY created_at DESC LIMIT 50",
        )
        .all(req.user.id),
      estimated_low_minor: supported.length
        ? supported.reduce(
            (s, v) => s + v.valuation.low_minor * v.coin.quantity,
            0,
          )
        : null,
      estimated_high_minor: supported.length
        ? supported.reduce(
            (s, v) => s + v.valuation.high_minor * v.coin.quantity,
            0,
          )
        : null,
      valued_records: supported.length,
      unvalued_records: coins.length - supported.length,
      value_history: db
        .prepare(
          `SELECT s.observed_on,SUM(s.low_minor*s.quantity) low_minor,SUM(s.high_minor*s.quantity) high_minor,COUNT(*) covered_records FROM valuation_snapshots s JOIN coins c ON c.id=s.coin_id WHERE c.user_id=? GROUP BY s.observed_on ORDER BY s.observed_on DESC LIMIT 90`,
        )
        .all(req.user.id),
    });
  });
  function validatedCoin(req) {
    const data = coinSchema.parse(req.body);
    const existingCost = db
      .prepare(
        "SELECT COALESCE(SUM(purchase_minor*quantity),0) total FROM coins WHERE user_id=? AND id<>?",
      )
      .get(req.user.id, req.params.id || "").total;
    if (
      !Number.isSafeInteger(
        existingCost + (data.purchase_minor || 0) * data.quantity,
      )
    )
      fail(
        422,
        "Acquisition totals exceed the supported exact currency range.",
      );
    if (
      data.catalogue_id &&
      !db.prepare("SELECT id FROM catalogue WHERE id=?").get(data.catalogue_id)
    )
      fail(422, "Select a valid catalogue entry");
    const attached = req.params.id
      ? db
          .prepare("SELECT id,side FROM photos WHERE coin_id=? AND user_id=?")
          .all(req.params.id, req.user.id)
      : [];
    for (const id of new Set(data.photo_ids)) {
      const photo = ownedPhoto(id, req.user.id);
      if (photo.coin_id && photo.coin_id !== req.params.id)
        fail(409, "This photograph is already attached to another coin");
      if (attached.some((p) => p.side === photo.side && p.id !== photo.id))
        fail(
          409,
          `Remove the existing ${photo.side} photograph before attaching a replacement.`,
        );
      if (!attached.some((p) => p.id === photo.id)) attached.push(photo);
    }
    return data;
  }
  app.post("/api/collection", auth, (req, res) => {
    const data = validatedCoin(req),
      plan = entitlement(req.user.id),
      id = randomUUID();
    db.exec("BEGIN IMMEDIATE");
    try {
      if (
        db
          .prepare("SELECT COUNT(*) n FROM coins WHERE user_id=?")
          .get(req.user.id).n >= plan.collection_limit
      )
        fail(
          403,
          "Your collection record limit has been reached. Existing records remain accessible.",
          "COLLECTION_LIMIT",
        );
      db.prepare(
        `INSERT INTO coins(id,user_id,catalogue_id,name,denomination,year,mint_mark,condition,quantity,purchase_minor,acquired_at,provenance,notes) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ).run(
        id,
        req.user.id,
        data.catalogue_id,
        data.name,
        data.denomination,
        data.year,
        data.mint_mark,
        data.condition,
        data.quantity,
        data.purchase_minor,
        data.acquired_at,
        data.provenance,
        data.notes,
      );
      for (const photo of data.photo_ids)
        db.prepare("UPDATE photos SET coin_id=? WHERE id=? AND user_id=?").run(
          id,
          photo,
          req.user.id,
        );
      recordEvent(req.user.id, "Added", data.name);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    res
      .status(201)
      .json({ coin: db.prepare("SELECT * FROM coins WHERE id=?").get(id) });
  });
  app.get("/api/collection/:id", auth, (req, res) => {
    const coin = ownedCoin(req),
      valuation = getValuation(db, coin);
    if (entitlement(req.user.id).plan !== "pro") valuation.evidence = [];
    const history =
      entitlement(req.user.id).plan === "pro"
        ? db
            .prepare(
              "SELECT observed_on,low_minor,high_minor,quantity FROM valuation_snapshots WHERE coin_id=? AND identity_key=? ORDER BY observed_on DESC LIMIT 90",
            )
            .all(coin.id, identityKey(coin))
        : [];
    res.json({
      coin,
      photos: db
        .prepare("SELECT id,side FROM photos WHERE coin_id=? AND user_id=?")
        .all(coin.id, req.user.id),
      valuation,
      history,
    });
  });
  app.patch("/api/collection/:id", auth, (req, res) => {
    ownedCoin(req);
    const data = validatedCoin(req);
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare(
        "UPDATE coins SET catalogue_id=?,name=?,denomination=?,year=?,mint_mark=?,condition=?,quantity=?,purchase_minor=?,acquired_at=?,provenance=?,notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?",
      ).run(
        data.catalogue_id,
        data.name,
        data.denomination,
        data.year,
        data.mint_mark,
        data.condition,
        data.quantity,
        data.purchase_minor,
        data.acquired_at,
        data.provenance,
        data.notes,
        req.params.id,
        req.user.id,
      );
      for (const photo of data.photo_ids)
        db.prepare("UPDATE photos SET coin_id=? WHERE id=? AND user_id=?").run(
          req.params.id,
          photo,
          req.user.id,
        );
      recordEvent(req.user.id, "Updated", data.name);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    res.json({
      coin: db.prepare("SELECT * FROM coins WHERE id=?").get(req.params.id),
    });
  });
  app.delete("/api/collection/:id", auth, async (req, res) => {
    const coin = ownedCoin(req),
      photos = db
        .prepare("SELECT * FROM photos WHERE coin_id=? AND user_id=?")
        .all(coin.id, req.user.id);
    for (const photo of photos) {
      await unlink(photoPath(photo)).catch((error) => {
        if (error.code !== "ENOENT") throw error;
      });
      db.prepare("DELETE FROM photos WHERE id=?").run(photo.id);
    }
    db.prepare("DELETE FROM coins WHERE id=? AND user_id=?").run(
      coin.id,
      req.user.id,
    );
    recordEvent(req.user.id, "Removed", coin.name);
    res.json({ ok: true });
  });
  app.get("/api/collection/:id/report", auth, pro, async (req, res) => {
    const coin = ownedCoin(req),
      photos = db
        .prepare("SELECT * FROM photos WHERE coin_id=? AND user_id=?")
        .all(coin.id, req.user.id);
    const pictures = await Promise.all(
      photos.map(async (p) => ({
        ...p,
        base64: (await readFile(photoPath(p))).toString("base64"),
      })),
    );
    res
      .type("html")
      .attachment("24coinatlas-coin-dossier.html")
      .send(coinReport(coin, getValuation(db, coin), pictures));
  });
  app.get("/api/wishlist", auth, (req, res) =>
    res.json({
      items: db
        .prepare(
          "SELECT w.*,c.name,c.denomination FROM wishlist w JOIN catalogue c ON c.id=w.catalogue_id WHERE user_id=? ORDER BY w.created_at DESC",
        )
        .all(req.user.id),
    }),
  );
  app.post("/api/wishlist", auth, (req, res) => {
    const data = z
      .object({
        catalogue_id: z.string().max(80),
        target_year: z
          .number()
          .int()
          .min(1500)
          .max(new Date().getFullYear())
          .nullable()
          .default(null),
      })
      .strict()
      .parse(req.body);
    if (
      !db.prepare("SELECT id FROM catalogue WHERE id=?").get(data.catalogue_id)
    )
      fail(422, "Unknown catalogue entry");
    if (
      db
        .prepare("SELECT COUNT(*) n FROM wishlist WHERE user_id=?")
        .get(req.user.id).n >= 100
    )
      fail(403, "Your research list is limited to 100 entries");
    const id = randomUUID();
    db.prepare(
      "INSERT INTO wishlist(id,user_id,catalogue_id,target_year) VALUES(?,?,?,?)",
    ).run(id, req.user.id, data.catalogue_id, data.target_year);
    res.status(201).json({ id });
  });
  app.delete("/api/wishlist/:id", auth, (req, res) => {
    const result = db
      .prepare("DELETE FROM wishlist WHERE id=? AND user_id=?")
      .run(req.params.id, req.user.id);
    if (!result.changes) fail(404, "Research list entry not found");
    res.json({ ok: true });
  });

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 6 * 1024 * 1024, files: 1, fields: 1, fieldSize: 100 },
    fileFilter: (_req, file, cb) => {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype))
        return cb(new HttpError(415, "Upload a JPEG, PNG or WebP photograph."));
      cb(null, true);
    },
  });
  app.post(
    "/api/photos",
    auth,
    limit(15),
    upload.single("photo"),
    async (req, res) => {
      if (!req.file) fail(400, "Choose a coin photograph");
      const { side } = z
        .object({ side: z.enum(["obverse", "reverse"]) })
        .strict()
        .parse(req.body);
      const capacity = entitlement(req.user.id).collection_limit * 2 + 10;
      if (
        db
          .prepare("SELECT COUNT(*) n FROM photos WHERE user_id=?")
          .get(req.user.id).n >= capacity
      )
        fail(
          403,
          "Photograph storage limit reached. Remove unused photographs.",
        );
      let buffer;
      try {
        const source = sharp(req.file.buffer, {
            limitInputPixels: 24_000_000,
            failOn: "warning",
          }),
          metadata = await source.metadata();
        if (
          !["jpeg", "png", "webp"].includes(metadata.format) ||
          metadata.pages > 1 ||
          metadata.width < 200 ||
          metadata.height < 200
        )
          fail(422, "Use a still photograph at least 200 × 200 pixels.");
        buffer = await source
          .rotate()
          .resize({
            width: 1600,
            height: 1600,
            fit: "inside",
            withoutEnlargement: true,
          })
          .jpeg({ quality: 88 })
          .toBuffer();
      } catch (error) {
        if (error instanceof HttpError) throw error;
        fail(422, "This file could not be decoded as a safe photograph.");
      }
      const id = randomUUID(),
        file_name = `${id}.jpg`,
        directory = resolve(config.dataDir, "uploads");
      await mkdir(directory, { recursive: true, mode: 0o700 });
      await writeFile(resolve(directory, file_name), buffer, {
        mode: 0o600,
        flag: "wx",
      });
      try {
        if (
          db
            .prepare("SELECT COUNT(*) n FROM photos WHERE user_id=?")
            .get(req.user.id).n >= capacity
        )
          fail(403, "Photograph storage limit reached.");
        db.prepare(
          "INSERT INTO photos(id,user_id,side,file_name,size) VALUES(?,?,?,?,?)",
        ).run(id, req.user.id, side, file_name, buffer.length);
      } catch (error) {
        await unlink(resolve(directory, file_name));
        throw error;
      }
      res.status(201).json({
        photo: { id, side, url: `/api/photos/${id}`, size: buffer.length },
      });
    },
  );
  app.get("/api/photos/:id", auth, (req, res) => {
    const photo = ownedPhoto(req.params.id, req.user.id);
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Content-Disposition", "inline");
    res.sendFile(photoPath(photo));
  });
  app.delete("/api/photos/:id", auth, async (req, res) => {
    const photo = ownedPhoto(req.params.id, req.user.id);
    await unlink(photoPath(photo)).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
    db.prepare("DELETE FROM photos WHERE id=?").run(photo.id);
    res.json({ ok: true });
  });
  app.get("/api/assessments", auth, (req, res) =>
    res.json({
      items: db
        .prepare(
          "SELECT * FROM assessments WHERE user_id=? ORDER BY created_at DESC LIMIT 30",
        )
        .all(req.user.id)
        .map((a) => ({ ...a, prediction: JSON.parse(a.prediction) })),
    }),
  );
  app.post("/api/assessments", auth, limit(5), async (req, res) => {
    if (!config.aiKey)
      fail(
        503,
        "AI identification is not connected. Record the coin manually or try again after the operator configures the service.",
        "AI_UNAVAILABLE",
      );
    const data = z
      .object({
        obverse_id: z.string().uuid(),
        reverse_id: z.string().uuid().optional(),
        consent: z.literal(true),
      })
      .strict()
      .parse(req.body);
    const front = ownedPhoto(data.obverse_id, req.user.id),
      back = data.reverse_id ? ownedPhoto(data.reverse_id, req.user.id) : null;
    if (front.side !== "obverse" || (back && back.side !== "reverse"))
      fail(422, "Assign the correct side to each photograph");
    const plan = entitlement(req.user.id);
    db.prepare(
      "INSERT OR IGNORE INTO monthly_usage(user_id,month,scans) VALUES(?,?,0)",
    ).run(req.user.id, plan.month);
    const reserved = db
      .prepare(
        "UPDATE monthly_usage SET scans=scans+1 WHERE user_id=? AND month=? AND scans<?",
      )
      .run(req.user.id, plan.month, plan.scan_limit);
    if (!reserved.changes)
      fail(
        403,
        "Your monthly identification limit has been reached. It resets next calendar month (UTC).",
        "SCAN_LIMIT",
      );
    try {
      const prediction = await ai(
        [front, ...(back ? [back] : [])].map(photoPath),
      );
      const id = randomUUID();
      db.prepare(
        "INSERT INTO assessments(id,user_id,obverse_id,reverse_id,prediction,model) VALUES(?,?,?,?,?,?)",
      ).run(
        id,
        req.user.id,
        front.id,
        back?.id || null,
        JSON.stringify(prediction),
        config.aiModel,
      );
      res.status(201).json({
        assessment: {
          id,
          prediction,
          model: config.aiModel,
          created_at: new Date().toISOString(),
          kind: "ai_prediction",
        },
        entitlements: entitlement(req.user.id),
      });
    } catch {
      db.prepare(
        "UPDATE monthly_usage SET scans=MAX(0,scans-1) WHERE user_id=? AND month=?",
      ).run(req.user.id, plan.month);
      fail(
        502,
        "Identification could not be completed. Your scan allowance has been restored.",
        "AI_FAILED",
      );
    }
  });
  app.post("/api/billing/checkout", auth, limit(5), async (req, res) => {
    if (!billingReady())
      fail(
        503,
        "Paid checkout is not yet enabled. No payment has been taken.",
        "BILLING_UNAVAILABLE",
      );
    if (entitlement(req.user.id).plan === "pro")
      fail(409, "You already have an active Pro subscription");
    const reference = `atlas_${token().slice(0, 32)}`;
    db.prepare("INSERT INTO checkouts(reference,user_id) VALUES(?,?)").run(
      reference,
      req.user.id,
    );
    try {
      const checkout = await payments.checkout(req.user, reference);
      res.json({ url: checkout.authorization_url });
    } catch {
      db.prepare("UPDATE checkouts SET status='failed' WHERE reference=?").run(
        reference,
      );
      fail(
        502,
        "Checkout is temporarily unavailable. No subscription has been activated.",
      );
    }
  });
  app.get("/api/billing/status", auth, (req, res) =>
    res.json({
      entitlements: entitlement(req.user.id),
      checkout_available: billingReady(),
    }),
  );
  app.post("/api/billing/cancel", auth, async (req, res) => {
    const sub = db
      .prepare("SELECT * FROM subscriptions WHERE user_id=?")
      .get(req.user.id);
    if (!sub || sub.status === "inactive")
      fail(409, "There is no active subscription to cancel");
    if (sub.status === "non_renewing")
      return res.json({ ok: true, entitlements: entitlement(req.user.id) });
    if (!sub.provider_code || !sub.email_token || !config.paystackKey)
      fail(
        503,
        "Provider subscription confirmation is pending. Contact the operator to arrange cancellation.",
      );
    try {
      await payments.cancel(sub.provider_code, sub.email_token);
    } catch {
      fail(
        502,
        "Cancellation could not be confirmed. Please retry or contact the operator.",
      );
    }
    db.prepare(
      "UPDATE subscriptions SET status='non_renewing',updated_at=CURRENT_TIMESTAMP WHERE user_id=?",
    ).run(req.user.id);
    res.json({ ok: true, entitlements: entitlement(req.user.id) });
  });
  app.use("/api", (_req, _res) => fail(404, "API endpoint not found"));
  if (config.production) {
    app.use(express.static(resolve("dist"), { index: false }));
    app.get("/{*path}", (_req, res) =>
      res.sendFile(resolve("dist/index.html")),
    );
  }
  app.use((error, req, res, _next) => {
    if (error instanceof ZodError)
      return res.status(422).json({
        error: error.issues
          .map((i) => `${i.path.join(".") || "Input"}: ${i.message}`)
          .join("; "),
        code: "VALIDATION",
      });
    if (error instanceof multer.MulterError)
      return res.status(413).json({
        error: "Upload one photograph at a time, up to 6 MB.",
        code: "UPLOAD_LIMIT",
      });
    if (error instanceof HttpError)
      return res
        .status(error.status)
        .json({ error: error.message, code: error.code });
    if (error.type === "entity.parse.failed")
      return res
        .status(400)
        .json({ error: "Invalid JSON", code: "VALIDATION" });
    if (error.type === "entity.too.large")
      return res
        .status(413)
        .json({ error: "Request is too large", code: "REQUEST_LIMIT" });
    console.error(
      JSON.stringify({
        level: "error",
        request_id: req.requestId,
        method: req.method,
        category: error.code || error.name || "Error",
      }),
    );
    res.status(500).json({
      error: "Something went wrong. Please try again.",
      code: "INTERNAL",
      request_id: req.requestId,
    });
  });
  return { app, db, config };
}
