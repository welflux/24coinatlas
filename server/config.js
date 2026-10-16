import { resolve } from "node:path";

export function loadConfig(overrides = {}) {
  const config = {
    production: process.env.NODE_ENV === "production",
    port: Number(process.env.PORT || 3001),
    origin: process.env.APP_ORIGIN || "http://localhost:3000",
    dataDir: resolve(process.env.DATA_DIR || ".data"),
    freeScans: Number(process.env.FREE_MONTHLY_SCANS || 5),
    proScans: Number(process.env.PRO_MONTHLY_SCANS || 100),
    freeCollection: Number(process.env.FREE_COLLECTION_LIMIT || 25),
    proCollection: Number(process.env.PRO_COLLECTION_LIMIT || 1000),
    proPrice: Number(process.env.PRO_PRICE_MINOR || 12900),
    aiKey: process.env.COIN_AI_API_KEY || process.env.OPENAI_API_KEY || "",
    aiModel: process.env.COIN_AI_MODEL || "gpt-4.1-mini",
    paystackKey: process.env.PAYSTACK_SECRET_KEY || "",
    paystackWebhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET || "",
    paystackPlan: process.env.PAYSTACK_PLAN_CODE || "",
    billingEnabled: process.env.BILLING_ENABLED === "true",
    paidFeaturesReady: process.env.PAID_FEATURES_READY === "true",
    trustProxy: process.env.TRUST_PROXY === "1",
    mailKey: process.env.RESEND_API_KEY || "",
    mailFrom: process.env.MAIL_FROM || "",
    requireVerifiedEmail:
      process.env.REQUIRE_EMAIL_VERIFICATION === undefined
        ? process.env.NODE_ENV === "production"
        : process.env.REQUIRE_EMAIL_VERIFICATION === "true",
    ...overrides,
  };
  if (
    process.env.REQUIRE_EMAIL_VERIFICATION === undefined &&
    overrides.requireVerifiedEmail === undefined
  )
    config.requireVerifiedEmail = config.production;
  for (const key of [
    "freeScans",
    "proScans",
    "freeCollection",
    "proCollection",
    "proPrice",
  ]) {
    if (!Number.isSafeInteger(config[key]) || config[key] < 1)
      throw new Error(`Invalid setting: ${key}`);
  }
  const url = new URL(config.origin);
  if (config.production && url.protocol !== "https:")
    throw new Error("Production APP_ORIGIN must use HTTPS");
  config.origin = url.origin;
  return config;
}
