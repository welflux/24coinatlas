import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHmac, randomUUID } from "node:crypto";
import request from "supertest";
import sharp from "sharp";
import { createApplication } from "../server/app.js";
import { openDatabase } from "../server/db.js";
import { getValuation } from "../server/valuation.js";
import {
  createAiService,
  predictionSchema,
} from "../server/integrations/ai.js";
import { createPaystack } from "../server/integrations/paystack.js";
import { importRecords } from "../scripts/import-data.mjs";
import { loadConfig } from "../server/config.js";
import { captureValuations, identityKey } from "../server/history.js";

const resources = [];
const origin = "http://localhost:3000",
  password = "a private collector passphrase";
const prediction = {
  likely_name: "Test fixture coin",
  country: null,
  denomination: null,
  year: null,
  design: null,
  series: null,
  mint_mark: null,
  metal: null,
  confidence: "low",
  image_quality: "insufficient",
  observations: [],
  uncertainties: ["Test fixture, not an actual identification."],
  possible_variety: null,
  condition_guidance: "Test only.",
  expert_review_recommended: true,
};
async function setup(config = {}, services = {}) {
  const dir = await mkdtemp(join(tmpdir(), "atlas-test-"));
  const result = createApplication(
    {
      dataDir: dir,
      paystackWebhookSecret: config.paystackKey || "",
      ...config,
    },
    services,
  );
  resources.push({ ...result, dir });
  return { ...result, dir };
}
afterEach(async () => {
  for (const r of resources.splice(0)) {
    r.db.close();
    await rm(r.dir, { recursive: true, force: true });
  }
});
async function account(app, email = "collector@example.com") {
  const agent = request.agent(app);
  const response = await agent
    .post("/api/auth/register")
    .set("Origin", origin)
    .send({ email, name: "Collector", password });
  assert.equal(response.status, 201, response.text);
  const csrf = response.body.csrf;
  const mutate = (method, path, body) =>
    agent[method](path)
      .set("Origin", origin)
      .set("X-CSRF-Token", csrf)
      .send(body);
  return { agent, csrf, id: response.body.user.id, mutate };
}
const coin = (extra = {}) => ({
  name: "Family shilling",
  quantity: 2,
  purchase_minor: 12500,
  year: 1952,
  condition: "Fine",
  ...extra,
});
async function photo(user, side = "obverse", buffer) {
  return user.agent
    .post("/api/photos")
    .set("Origin", origin)
    .set("X-CSRF-Token", user.csrf)
    .field("side", side)
    .attach(
      "photo",
      buffer ||
        (await sharp({
          create: {
            width: 300,
            height: 300,
            channels: 3,
            background: "#9b8a65",
          },
        })
          .jpeg()
          .toBuffer()),
      { filename: "coin.jpg", contentType: "image/jpeg" },
    );
}
function signature(payload, key = "test_paystack_secret") {
  return createHmac("sha512", key).update(payload).digest("hex");
}
const webhook = (app, event, key) => {
  const raw = JSON.stringify(event);
  return request(app)
    .post("/api/billing/webhook")
    .set("Content-Type", "application/json")
    .set("X-Paystack-Signature", signature(raw, key))
    .send(raw);
};

test("registration hashes passwords, sets private cookies and persists sessions", async () => {
  const { app, db } = await setup();
  const u = await account(app);
  const row = db.prepare("SELECT * FROM users WHERE id=?").get(u.id);
  assert.ok(row.password_hash.startsWith("scrypt:"));
  assert.ok(!row.password_hash.includes(password));
  const me = await u.agent.get("/api/auth/me");
  assert.equal(me.body.user.email, "collector@example.com");
  assert.equal(me.body.csrf, u.csrf);
  assert.equal((await request(app).get("/api/auth/me")).body.user, null);
  assert.equal(
    (
      await request(app)
        .post("/api/auth/login")
        .set("Origin", origin)
        .send({ email: row.email, password: "wrong" })
    ).status,
    401,
  );
});
test("CSRF, origin and unauthenticated access are enforced", async () => {
  const { app } = await setup(),
    u = await account(app);
  assert.equal((await request(app).get("/api/collection")).status, 401);
  assert.equal(
    (await u.agent.post("/api/collection").set("Origin", origin).send(coin()))
      .status,
    403,
  );
  assert.equal(
    (
      await u.agent
        .post("/api/collection")
        .set("Origin", "https://evil.example")
        .set("X-CSRF-Token", u.csrf)
        .send(coin())
    ).status,
    403,
  );
});
test("collection CRUD tracks real acquisition costs and survives database reopen", async () => {
  const { app, db, dir } = await setup(),
    u = await account(app);
  const created = await u.mutate("post", "/api/collection", coin());
  assert.equal(created.status, 201, created.text);
  const id = created.body.coin.id;
  let list = await u.agent.get("/api/collection");
  assert.equal(list.body.summary.acquisition_minor, 25000);
  assert.equal(list.body.summary.coins, 2);
  const updated = await u.mutate(
    "patch",
    `/api/collection/${id}`,
    coin({ quantity: 3, notes: "Family provenance" }),
  );
  assert.equal(updated.status, 200);
  const second = openDatabase(dir);
  assert.equal(
    second.prepare("SELECT notes FROM coins WHERE id=?").get(id).notes,
    "Family provenance",
  );
  second.close();
  assert.equal(
    db.prepare("SELECT COUNT(*) n FROM collection_events").get().n,
    2,
  );
  assert.equal(
    (await u.mutate("delete", `/api/collection/${id}`, {})).status,
    200,
  );
  assert.equal((await u.agent.get("/api/collection")).body.summary.records, 0);
});
test("other accounts cannot read, change, delete or export a private coin", async () => {
  const { app } = await setup(),
    owner = await account(app),
    other = await account(app, "other@example.com"),
    made = await owner.mutate("post", "/api/collection", coin()),
    id = made.body.coin.id;
  assert.equal((await other.agent.get(`/api/collection/${id}`)).status, 404);
  assert.equal(
    (await other.mutate("patch", `/api/collection/${id}`, coin())).status,
    404,
  );
  assert.equal(
    (await other.mutate("delete", `/api/collection/${id}`, {})).status,
    404,
  );
  assert.equal(
    (await other.agent.get("/api/collection/export.csv")).text.includes(
      "Family shilling",
    ),
    false,
  );
});
test("collection capacity and field validation are enforced on the server", async () => {
  const { app } = await setup({ freeCollection: 1 }),
    u = await account(app);
  assert.equal(
    (await u.mutate("post", "/api/collection", coin({ purchase_minor: -1 })))
      .status,
    422,
  );
  assert.equal(
    (
      await u.mutate(
        "post",
        "/api/collection",
        coin({ acquired_at: "2025-02-30" }),
      )
    ).status,
    422,
  );
  assert.equal(
    (await u.mutate("post", "/api/collection", coin({ plan: "pro" }))).status,
    422,
  );
  assert.equal((await u.mutate("post", "/api/collection", coin())).status, 201);
  assert.equal(
    (await u.mutate("post", "/api/collection", coin())).body.code,
    "COLLECTION_LIMIT",
  );
});
test("photographs are decoded, re-encoded without metadata, private and deletable", async () => {
  const { app, db, dir } = await setup(),
    u = await account(app),
    other = await account(app, "other@example.com");
  const original = await sharp({
    create: { width: 400, height: 300, channels: 3, background: "white" },
  })
    .withMetadata({ exif: { IFD0: { Artist: "Private fixture" } } })
    .jpeg()
    .toBuffer();
  const uploaded = await photo(u, "obverse", original);
  assert.equal(uploaded.status, 201, uploaded.text);
  const id = uploaded.body.photo.id;
  assert.equal((await request(app).get(`/api/photos/${id}`)).status, 401);
  assert.equal((await other.agent.get(`/api/photos/${id}`)).status, 404);
  const own = await u.agent.get(`/api/photos/${id}`);
  assert.equal(own.status, 200);
  assert.equal((await sharp(own.body).metadata()).exif, undefined);
  assert.equal(
    (await other.mutate("post", "/api/collection", coin({ photo_ids: [id] })))
      .status,
    404,
  );
  assert.equal((await u.mutate("delete", `/api/photos/${id}`, {})).status, 200);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM photos").get().n, 0);
  assert.deepEqual(await readdir(join(dir, "uploads")), []);
});
test("fake images and undersized images are rejected without storing files", async () => {
  const { app, db } = await setup(),
    u = await account(app);
  assert.equal(
    (await photo(u, "obverse", Buffer.from("<script>alert(1)</script>")))
      .status,
    422,
  );
  assert.equal(
    (
      await photo(
        u,
        "obverse",
        await sharp({
          create: { width: 50, height: 50, channels: 3, background: "white" },
        })
          .png()
          .toBuffer(),
      )
    ).status,
    422,
  );
  assert.equal(db.prepare("SELECT COUNT(*) n FROM photos").get().n, 0);
});
test("AI without configuration is unavailable and never manufactures a result", async () => {
  const { app, db } = await setup({ aiKey: "" }),
    u = await account(app);
  const r = await u.mutate("post", "/api/assessments", {
    obverse_id: randomUUID(),
    consent: true,
  });
  assert.equal(r.status, 503);
  assert.equal(r.body.code, "AI_UNAVAILABLE");
  assert.equal(db.prepare("SELECT COUNT(*) n FROM assessments").get().n, 0);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM monthly_usage").get().n, 0);
});
test("AI consent, photo ownership and atomic monthly limits are enforced", async () => {
  let release;
  const pending = new Promise((resolve) => (release = resolve));
  const { app } = await setup(
      { aiKey: "test_key", freeScans: 1 },
      {
        ai: async () => {
          await pending;
          return prediction;
        },
      },
    ),
    u = await account(app),
    other = await account(app, "other@example.com");
  const p = (await photo(u)).body.photo;
  assert.equal(
    (
      await u.mutate("post", "/api/assessments", {
        obverse_id: p.id,
        consent: false,
      })
    ).status,
    422,
  );
  assert.equal(
    (
      await other.mutate("post", "/api/assessments", {
        obverse_id: p.id,
        consent: true,
      })
    ).status,
    404,
  );
  const first = u
    .mutate("post", "/api/assessments", { obverse_id: p.id, consent: true })
    .then((r) => r);
  await new Promise((r) => setTimeout(r, 50));
  const second = await u.mutate("post", "/api/assessments", {
    obverse_id: p.id,
    consent: true,
  });
  assert.equal(second.body.code, "SCAN_LIMIT");
  release();
  const result = await first;
  assert.equal(result.status, 201);
  assert.equal(result.body.assessment.kind, "ai_prediction");
  assert.equal(result.body.entitlements.scans_used, 1);
});
test("failed AI requests refund the scan reservation", async () => {
  const { app, db } = await setup(
      { aiKey: "test_key" },
      {
        ai: async () => {
          throw Error("provider error");
        },
      },
    ),
    u = await account(app),
    p = (await photo(u)).body.photo;
  const r = await u.mutate("post", "/api/assessments", {
    obverse_id: p.id,
    consent: true,
  });
  assert.equal(r.status, 502);
  assert.equal(
    (await u.agent.get("/api/auth/me")).body.user.entitlements.scans_used,
    0,
  );
  assert.equal(db.prepare("SELECT COUNT(*) n FROM assessments").get().n, 0);
});
test("AI adapter uses structured output and rejects malformed predictions", async () => {
  const dir = await mkdtemp(join(tmpdir(), "atlas-ai-"));
  try {
    const { writeFile } = await import("node:fs/promises");
    const path = join(dir, "coin.jpg");
    await writeFile(path, Buffer.from("test"));
    let body;
    const service = createAiService(
      { aiKey: "test", aiModel: "test-model" },
      async (url, options) => {
        assert.equal(url, "https://api.openai.com/v1/chat/completions");
        body = JSON.parse(options.body);
        return {
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    ...prediction,
                    confidence: "high",
                  }),
                },
              },
            ],
          }),
        };
      },
    );
    const result = await service([path]);
    assert.equal(result.confidence, "low");
    assert.equal(body.response_format.json_schema.strict, true);
    assert.throws(() =>
      predictionSchema.parse({ likely_name: "unstructured" }),
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test("starter catalogue never implies verified values; asking prices do not support estimates", async () => {
  const { db } = await setup();
  assert.equal(
    db
      .prepare("SELECT COUNT(*) n FROM catalogue WHERE verification='verified'")
      .get().n,
    0,
  );
  assert.equal(db.prepare("SELECT COUNT(*) n FROM market_evidence").get().n, 0);
  const c = {
    catalogue_id: "sa-mandela-2008",
    year: 2008,
    condition: "Fine",
    mint_mark: "",
  };
  assert.equal(getValuation(db, c).status, "unavailable");
  db.prepare("UPDATE catalogue SET verification='verified' WHERE id=?").run(
    c.catalogue_id,
  );
  for (let i = 0; i < 3; i++)
    db.prepare(
      "INSERT INTO market_evidence(id,catalogue_id,year,mint_mark,condition,type,amount_minor,currency,observed_at,source_url,source_name,rights_note,verified_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
    ).run(
      `test-${i}`,
      c.catalogue_id,
      2008,
      "",
      "Fine",
      "asking_price",
      10000 + i * 1000,
      "ZAR",
      new Date().toISOString().slice(0, 10),
      `https://example.com/test-${i}`,
      "Test fixture",
      "Test-only licensed fixture",
      new Date().toISOString().slice(0, 10),
    );
  assert.equal(getValuation(db, c).status, "unavailable");
  db.exec("UPDATE market_evidence SET type='completed_sale'");
  const v = getValuation(db, c);
  assert.equal(v.status, "available");
  assert.equal(v.evidence.length, 3);
  assert.equal(v.low_minor, 10000);
  assert.equal(v.high_minor, 12000);
  assert.equal(
    getValuation(db, { ...c, condition: "Proof" }).status,
    "unavailable",
  );
  assert.equal(
    getValuation(db, { ...c, mint_mark: "X" }).status,
    "unavailable",
  );
});
test("Pro access is server enforced and expires independently of frontend state", async () => {
  const { app, db } = await setup(),
    u = await account(app);
  assert.equal((await u.agent.get("/api/collection/analytics")).status, 403);
  db.prepare(
    "INSERT INTO subscriptions(user_id,status,current_period_end) VALUES(?,'active',?)",
  ).run(u.id, Date.now() + 86400000);
  assert.equal((await u.agent.get("/api/collection/analytics")).status, 200);
  db.prepare(
    "UPDATE subscriptions SET current_period_end=? WHERE user_id=?",
  ).run(Date.now() - 1, u.id);
  assert.equal((await u.agent.get("/api/collection/analytics")).status, 403);
  assert.equal(
    (await u.mutate("post", "/api/billing/checkout", {})).status,
    503,
  );
});
test("CSV formula injection and report HTML injection are escaped", async () => {
  const { app, db } = await setup(),
    u = await account(app);
  const made = await u.mutate(
    "post",
    "/api/collection",
    coin({ name: '=HYPERLINK("bad")', notes: "<script>alert(1)</script>" }),
  );
  const csv = await u.agent.get("/api/collection/export.csv");
  assert.match(csv.text, /'=HYPERLINK/);
  assert.equal(
    (await u.agent.get(`/api/collection/${made.body.coin.id}/report`)).status,
    403,
  );
  db.prepare(
    "INSERT INTO subscriptions(user_id,status,current_period_end) VALUES(?,'active',?)",
  ).run(u.id, Date.now() + 86400000);
  const report = await u.agent.get(
    `/api/collection/${made.body.coin.id}/report`,
  );
  assert.equal(report.status, 200);
  assert.ok(report.text.includes("&lt;script&gt;"));
  assert.ok(!report.text.includes("<script>"));
  assert.ok(report.text.includes("No defensible estimate"));
});
test("forged webhooks cannot grant a subscription; verified charges are idempotent", async () => {
  const reference = "atlas_test_reference",
    customer = "CUS_test";
  const verified = {
    reference,
    status: "success",
    currency: "ZAR",
    amount: 12900,
    plan_object: { plan_code: "PLN_test" },
    paid_at: new Date().toISOString(),
    customer: { customer_code: customer, email: "collector@example.com" },
  };
  const { app, db } = await setup(
      { paystackKey: "test_paystack_secret", paystackPlan: "PLN_test" },
      { payments: { verify: async () => verified } },
    ),
    u = await account(app);
  db.prepare("INSERT INTO checkouts(reference,user_id) VALUES(?,?)").run(
    reference,
    u.id,
  );
  const event = { event: "charge.success", data: { reference } };
  assert.equal((await webhook(app, event, "wrong")).status, 401);
  assert.equal(
    (await u.agent.get("/api/auth/me")).body.user.entitlements.plan,
    "free",
  );
  assert.equal((await webhook(app, event)).status, 200);
  assert.equal(
    (await u.agent.get("/api/auth/me")).body.user.entitlements.plan,
    "pro",
  );
  assert.equal((await webhook(app, event)).body.duplicate, true);
  assert.equal(
    (await webhook(app, { ...event, extra: "different event envelope" }))
      .status,
    200,
  );
  assert.equal(
    db.prepare("SELECT COUNT(*) n FROM payment_receipts").get().n,
    1,
  );
});
test("wrong-amount verified payments are rejected and cannot activate Pro", async () => {
  const reference = "bad_payment";
  const { app, db } = await setup(
      { paystackKey: "test_paystack_secret", paystackPlan: "PLN_test" },
      {
        payments: {
          verify: async () => ({
            reference,
            status: "success",
            currency: "ZAR",
            amount: 1,
            plan: "PLN_test",
            paid_at: new Date().toISOString(),
            customer: {
              customer_code: "CUS_test",
              email: "collector@example.com",
            },
          }),
        },
      },
    ),
    u = await account(app);
  db.prepare("INSERT INTO checkouts(reference,user_id) VALUES(?,?)").run(
    reference,
    u.id,
  );
  assert.equal(
    (await webhook(app, { event: "charge.success", data: { reference } }))
      .status,
    422,
  );
  assert.equal(
    (await u.agent.get("/api/auth/me")).body.user.entitlements.plan,
    "free",
  );
});
test("cancellation calls provider and preserves only the paid period", async () => {
  let cancelled = false;
  const { app, db } = await setup(
      { paystackKey: "test_paystack_secret" },
      {
        payments: {
          cancel: async (code, secret) => {
            assert.equal(code, "SUB_test");
            assert.equal(secret, "test_token");
            cancelled = true;
          },
        },
      },
    ),
    u = await account(app);
  db.prepare(
    "INSERT INTO subscriptions(user_id,status,provider_code,email_token,current_period_end) VALUES(?,'active','SUB_test','test_token',?)",
  ).run(u.id, Date.now() + 86400000);
  const r = await u.mutate("post", "/api/billing/cancel", {});
  assert.equal(r.status, 200);
  assert.equal(cancelled, true);
  assert.equal(r.body.entitlements.plan, "pro");
  assert.equal(r.body.entitlements.subscription.status, "non_renewing");
});
test("Paystack adapter refuses mismatched plans and untrusted checkout destinations", async () => {
  const config = {
    paystackKey: "test",
    paystackPlan: "PLN_test",
    proPrice: 12900,
    origin,
  };
  let calls = 0;
  const provider = createPaystack(config, async () => ({
    ok: true,
    json: async () => ({
      status: true,
      data:
        ++calls === 1
          ? { currency: "ZAR", amount: 12900, interval: "monthly" }
          : { authorization_url: "https://evil.example" },
    }),
  }));
  await assert.rejects(
    () => provider.checkout({ id: "test", email: "test@example.com" }, "ref"),
    /Unexpected checkout/,
  );
  const wrong = createPaystack(config, async () => ({
    ok: true,
    json: async () => ({
      status: true,
      data: { currency: "USD", amount: 12900, interval: "monthly" },
    }),
  }));
  await assert.rejects(() => wrong.checkout({}, "ref"), /does not match/);
});
test("password changes revoke other sessions and account deletion removes private files", async () => {
  const { app, db, dir } = await setup(),
    u = await account(app);
  const other = request.agent(app);
  assert.equal(
    (
      await other
        .post("/api/auth/login")
        .set("Origin", origin)
        .send({ email: "collector@example.com", password })
    ).status,
    200,
  );
  await photo(u);
  assert.equal(
    (
      await u.mutate("patch", "/api/account", {
        new_password: "an entirely new password",
        current_password: password,
      })
    ).status,
    200,
  );
  assert.equal((await other.get("/api/auth/me")).body.user, null);
  assert.equal(
    (await u.mutate("delete", "/api/account", { password: "wrong" })).status,
    403,
  );
  assert.equal(
    (
      await u.mutate("delete", "/api/account", {
        password: "an entirely new password",
      })
    ).status,
    200,
  );
  assert.equal(db.prepare("SELECT COUNT(*) n FROM users").get().n, 0);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM sessions").get().n, 0);
  assert.deepEqual(await readdir(join(dir, "uploads")), []);
});
test("data ingestion rejects unsupported types and does not partially import", async () => {
  const { db } = await setup();
  assert.throws(() =>
    importRecords(db, { evidence: [{ id: "bad", currency: "USD" }] }),
  );
  assert.equal(db.prepare("SELECT COUNT(*) n FROM market_evidence").get().n, 0);
  assert.throws(() =>
    importRecords(db, {
      catalogue: [{ id: "bad", source_url: "javascript:alert(1)" }],
    }),
  );
});

test("email verification and password recovery use expiring one-use tokens and revoke sessions", async () => {
  const messages = [];
  const { app, db } = await setup(
    {
      requireVerifiedEmail: true,
      mailKey: "test_mail_key",
      mailFrom: "Test <test@example.com>",
    },
    { mailer: { send: async (m) => messages.push(m) } },
  );
  const registered = await request(app)
    .post("/api/auth/register")
    .set("Origin", origin)
    .send({ email: "verified@example.com", name: "Verifier", password });
  assert.equal(registered.status, 201);
  assert.equal(registered.body.verification_required, true);
  assert.equal(registered.body.user, null);
  assert.equal(
    (
      await request(app)
        .post("/api/auth/login")
        .set("Origin", origin)
        .send({ email: "verified@example.com", password })
    ).body.code,
    "EMAIL_NOT_VERIFIED",
  );
  const raw = messages[0].html.match(/token=([a-f0-9]{64})/)[1];
  assert.ok(
    !db
      .prepare("SELECT token_hash FROM account_tokens")
      .get()
      .token_hash.includes(raw),
  );
  const agent = request.agent(app),
    verified = await agent
      .post("/api/auth/verify-email")
      .set("Origin", origin)
      .send({ token: raw });
  assert.equal(verified.status, 200);
  assert.equal(verified.body.user.email_verified, true);
  assert.equal(
    (
      await request(app)
        .post("/api/auth/verify-email")
        .set("Origin", origin)
        .send({ token: raw })
    ).status,
    400,
  );
  const reset = await request(app)
    .post("/api/auth/request-reset")
    .set("Origin", origin)
    .send({ email: "verified@example.com" });
  assert.equal(reset.status, 200);
  const resetToken = messages[1].html.match(/token=([a-f0-9]{64})/)[1];
  const changed = await request(app)
    .post("/api/auth/reset-password")
    .set("Origin", origin)
    .send({ token: resetToken, password: "a new email recovery passphrase" });
  assert.equal(changed.status, 200);
  assert.equal((await agent.get("/api/auth/me")).body.user, null);
  assert.equal(
    (
      await request(app)
        .post("/api/auth/reset-password")
        .set("Origin", origin)
        .send({ token: resetToken, password: "another recovery passphrase" })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(app).post("/api/auth/login").set("Origin", origin).send({
        email: "verified@example.com",
        password: "a new email recovery passphrase",
      })
    ).status,
    200,
  );
});
test("required email delivery fails closed and never claims mail was sent", async () => {
  const { app } = await setup({
    requireVerifiedEmail: true,
    mailKey: "",
    mailFrom: "",
  });
  assert.equal(
    (
      await request(app)
        .post("/api/auth/register")
        .set("Origin", origin)
        .send({ email: "mail@example.com", name: "Test", password })
    ).body.code,
    "MAIL_UNAVAILABLE",
  );
  assert.equal(
    (
      await request(app)
        .post("/api/auth/request-reset")
        .set("Origin", origin)
        .send({ email: "mail@example.com" })
    ).body.code,
    "MAIL_UNAVAILABLE",
  );
});
test("value snapshots record actual supported observations once per identity/day", async () => {
  const { app, db } = await setup(),
    u = await account(app),
    made = await u.mutate(
      "post",
      "/api/collection",
      coin({ catalogue_id: "sa-mandela-2008", year: 2008, mint_mark: "" }),
    );
  assert.equal(captureValuations(db), 0);
  db.exec(
    "UPDATE catalogue SET verification='verified' WHERE id='sa-mandela-2008'",
  );
  for (let i = 0; i < 3; i++)
    db.prepare(
      "INSERT INTO market_evidence(id,catalogue_id,year,mint_mark,condition,type,amount_minor,currency,observed_at,source_url,source_name,rights_note,verified_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
    ).run(
      `snap-${i}`,
      "sa-mandela-2008",
      2008,
      "",
      "Fine",
      "completed_sale",
      10000 + i * 1000,
      "ZAR",
      new Date().toISOString().slice(0, 10),
      `https://example.com/snapshot-${i}`,
      "Synthetic snapshot fixture",
      "Only a synthetic test fixture",
      new Date().toISOString().slice(0, 10),
    );
  assert.equal(captureValuations(db), 1);
  assert.equal(captureValuations(db), 0);
  const snapshot = db.prepare("SELECT * FROM valuation_snapshots").get();
  assert.equal(snapshot.coin_id, made.body.coin.id);
  assert.equal(snapshot.quantity, 2);
  assert.equal(snapshot.identity_key, identityKey(made.body.coin));
  db.prepare("UPDATE coins SET condition='Proof' WHERE id=?").run(
    made.body.coin.id,
  );
  assert.equal(captureValuations(db), 0);
});

test("out-of-order subscription notifications retry, verify provider state and retain paid access on non-renewal", async () => {
  const reference = "lifecycle_ref",
    customer = "CUS_lifecycle",
    code = "SUB_lifecycle";
  let providerStatus = "active";
  const services = {
    payments: {
      verify: async () => ({
        reference,
        status: "success",
        currency: "ZAR",
        amount: 12900,
        plan_object: { plan_code: "PLN_test" },
        paid_at: new Date().toISOString(),
        customer: { customer_code: customer, email: "collector@example.com" },
      }),
      subscription: async () => ({
        subscription_code: code,
        status: providerStatus,
        email_token: "test_cancel_token",
        plan: { plan_code: "PLN_test" },
        customer: { customer_code: customer },
      }),
    },
  };
  const { app, db } = await setup(
      { paystackKey: "test_paystack_secret", paystackPlan: "PLN_test" },
      services,
    ),
    u = await account(app);
  const created = {
    event: "subscription.create",
    data: { subscription_code: code, status: "forged-client-state" },
  };
  assert.equal((await webhook(app, created)).status, 503);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM payment_events").get().n, 0);
  db.prepare("INSERT INTO checkouts(reference,user_id) VALUES(?,?)").run(
    reference,
    u.id,
  );
  assert.equal(
    (await webhook(app, { event: "charge.success", data: { reference } }))
      .status,
    200,
  );
  assert.equal((await webhook(app, created)).status, 200);
  assert.equal(
    db
      .prepare("SELECT provider_code FROM subscriptions WHERE user_id=?")
      .get(u.id).provider_code,
    code,
  );
  providerStatus = "non-renewing";
  assert.equal(
    (
      await webhook(app, {
        event: "subscription.not_renew",
        data: { subscription_code: code },
      })
    ).status,
    200,
  );
  const me = await u.agent.get("/api/auth/me");
  assert.equal(me.body.user.entitlements.subscription.status, "non_renewing");
  assert.equal(me.body.user.entitlements.plan, "pro");
});

test("authorised research import retains review provenance and Pro-only variety evidence", async () => {
  const { app, db } = await setup(),
    u = await account(app),
    today = new Date().toISOString().slice(0, 10);
  const record = {
    id: "test-research-entry",
    name: "Synthetic test record",
    denomination: "test",
    era: "Test fixture",
    country_code: "ZA",
    start_year: 2000,
    end_year: 2000,
    description: "Synthetic reference for automated testing only.",
    metal: null,
    mintage: null,
    source_url: "https://example.com/test-record",
    source_name: "Synthetic source",
    variety_notes: "Synthetic variety notes.",
    rights_note: "Synthetic test data, not real market material.",
    reviewer: "Test reviewer",
    reviewed_at: today,
  };
  importRecords(db, {
    catalogue: [record],
    varieties: [
      {
        id: "test-variety",
        catalogue_id: record.id,
        name: "Synthetic test variety",
        year: 2000,
        mint_mark: null,
        distinguishing_features:
          "Synthetic distinguishing features for tests only.",
        evidence_summary: "Synthetic supporting reference for tests only.",
        source_url: "https://example.com/test-variety",
        source_name: "Test fixture",
        rights_note: "Only a synthetic test record.",
        reviewer: "Test reviewer",
        reviewed_at: today,
      },
    ],
  });
  assert.equal(
    db
      .prepare("SELECT reviewer FROM catalogue_reviews WHERE catalogue_id=?")
      .get(record.id).reviewer,
    "Test reviewer",
  );
  const free = await u.agent.get(`/api/catalogue/${record.id}`);
  assert.equal(free.body.variety_count, 1);
  assert.deepEqual(free.body.varieties, []);
  db.prepare(
    "INSERT INTO subscriptions(user_id,status,current_period_end) VALUES(?,'active',?)",
  ).run(u.id, Date.now() + 86400000);
  assert.equal(
    (await u.agent.get(`/api/catalogue/${record.id}`)).body.varieties[0].id,
    "test-variety",
  );
});

test("production configuration requires HTTPS and verified email by default", () => {
  assert.throws(
    () => loadConfig({ production: true, origin: "http://example.com" }),
    /HTTPS/,
  );
  const c = loadConfig({ production: true, origin: "https://example.com" });
  assert.equal(c.requireVerifiedEmail, true);
});
