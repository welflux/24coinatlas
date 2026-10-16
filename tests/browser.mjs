import assert from "node:assert/strict";
import { readFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { existsSync } from "node:fs";
import express from "express";
import { chromium } from "playwright";
import sharp from "sharp";
import { createApplication } from "../server/app.js";

const temporary = await mkdtemp(join(tmpdir(), "atlas-browser-"));
const { app, db, config } = createApplication({
  dataDir: temporary,
  production: false,
  aiKey: "",
  paystackKey: "",
  billingEnabled: false,
});
app.get("/test/axe.js", (_req, res) =>
  res.sendFile(resolve("node_modules/axe-core/axe.min.js")),
);
app.use(express.static(resolve("dist")));
app.get("/{*path}", (_req, res) => res.sendFile(resolve("dist/index.html")));
const server = app.listen(0, "127.0.0.1");
await new Promise((r) => server.once("listening", r));
const origin = `http://localhost:${server.address().port}`;
config.origin = origin;
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);
let browser;
try {
  browser = await chromium.launch({ executablePath, args: ["--no-sandbox"] });
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    }),
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const violations = [];
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/",
      "/app",
      "/app/catalogue",
      "/app/catalogue/sa-mandela-2008",
      "/app/research",
      "/app/billing",
      "/register",
    ]) {
      await page.goto(origin + route, { waitUntil: "networkidle" });
      await page.locator("h1").waitFor();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `Overflow: ${width} ${route}`,
      );
      if (width === 1440) {
        await page.addScriptTag({ url: origin + "/test/axe.js" });
        const results = await page.evaluate(() =>
          axe.run(document, {
            runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
          }),
        );
        violations.push(
          ...results.violations.map((v) => ({
            route,
            id: v.id,
            impact: v.impact,
            nodes: v.nodes
              .map((n) => ({ target: n.target, summary: n.failureSummary }))
              .slice(0, 12),
          })),
        );
      }
      if (width === 390 && route === "/app") {
        await page.getByRole("button", { name: "Open navigation" }).click();
        await page
          .getByRole("navigation", { name: "Workspace" })
          .getByRole("link", { name: "SA catalogue" })
          .click();
        await page.locator("h1").filter({ hasText: "History" }).waitFor();
      }
    }
    await writeFile(
      "/tmp/24coinatlas-accessibility.json",
      JSON.stringify(violations, null, 2),
    );
    console.log(
      `PASS ${width}px: landing, workspace, catalogue, research, plans and registration layouts`,
    );
  }
  // The public landing must remain useful while production email is unavailable.
  config.requireVerifiedEmail = true;
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(origin + "/", { waitUntil: "networkidle" });
  assert.equal(await page.locator('a[href="/register"]').count(), 0);
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page.keyboard.press("Escape");
  assert.equal(
    await page
      .getByRole("button", { name: "Open menu", exact: true })
      .getAttribute("aria-expanded"),
    "false",
  );
  await page.locator("summary").first().focus();
  await page.keyboard.press("Enter");
  assert.equal(
    await page
      .locator("details")
      .first()
      .evaluate((el) => el.open),
    true,
  );
  await page.locator(".atlas-era").first().click();
  assert.equal(
    await page.getByLabel("Filter by era").inputValue(),
    "ZAR & historical",
  );
  await page
    .getByRole("link", { name: /ZAR gold pond/i })
    .first()
    .waitFor();
  config.requireVerifiedEmail = false;
  console.log(
    "PASS public catalogue funnel without registration, era filters, keyboard FAQ and menu Escape",
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(origin + "/register");
  await page.getByLabel("Your name", { exact: true }).fill("Browser Collector");
  await page.getByLabel("Email address").fill("browser-collector@example.com");
  await page
    .getByLabel("Password", { exact: true })
    .fill("a private browser test password");
  await page
    .getByRole("button", { name: "Create free account", exact: true })
    .click();
  await page.getByRole("heading", { name: "Welcome back, Browser." }).waitFor();
  await page.goto(origin + "/app/collection");
  await page
    .getByRole("button", { name: "Add a coin", exact: true })
    .first()
    .click();
  await page
    .getByLabel("Coin name *", { exact: true })
    .fill("Inherited shilling · browser test");
  await page.getByLabel("Denomination", { exact: true }).fill("1 shilling");
  await page.getByLabel("Year", { exact: true }).fill("1952");
  await page.getByLabel("Quantity *", { exact: true }).fill("2");
  await page.getByLabel("Unit acquisition cost (ZAR)").fill("125");
  await page
    .getByLabel("Provenance", { exact: true })
    .fill("Synthetic test record, not a catalogue fact.");
  await page.getByRole("button", { name: "Save coin record" }).click();
  await page
    .getByRole("link", { name: "Inherited shilling · browser test 1 shilling" })
    .waitFor();
  await page.reload();
  await page
    .getByRole("link", { name: "Inherited shilling · browser test 1 shilling" })
    .click();
  await page
    .getByRole("heading", { name: "Inherited shilling · browser test" })
    .waitFor();
  await page.getByRole("button", { name: "Edit record" }).click();
  await page.getByLabel("Your notes").fill("An edited personal record.");
  await page.getByRole("button", { name: "Save coin record" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export inventory" }).click();
  const downloaded = await downloadPromise;
  const csv = await readFile(await downloaded.path(), "utf8");
  assert.match(csv, /Inherited shilling/);
  assert.match(csv, /125.00/);
  console.log(
    "PASS registration, persistent collection creation, edit and CSV download",
  );
  await page.goto(origin + "/app/catalogue");
  await page.getByLabel("Search catalogue").fill("Krugerrand");
  await page.locator(".catalogue-card").waitFor();
  assert.equal(await page.locator(".catalogue-card").count(), 1);
  await page.locator(".catalogue-card").click();
  await page.getByRole("button", { name: "Save to research list" }).click();
  await page.goto(origin + "/app/collection");
  await page.getByRole("button", { name: /Research list/ }).click();
  await page
    .locator(".wishlist-list")
    .getByRole("link", { name: /Gold Krugerrand/ })
    .waitFor();
  console.log(
    "PASS catalogue search, coin detail and persistent research list",
  );
  await page.goto(origin + "/app/identify");
  const image = await sharp({
    create: { width: 450, height: 450, channels: 3, background: "#b29a70" },
  })
    .jpeg()
    .toBuffer();
  await page
    .getByLabel("Upload Obverse / front", { exact: true })
    .setInputFiles({
      name: "test-coin.jpg",
      mimeType: "image/jpeg",
      buffer: image,
    });
  await page
    .getByAltText("Obverse / front photograph", { exact: true })
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Identify this coin", exact: true })
      .isDisabled(),
    true,
  );
  await page.getByRole("button", { name: "Record manually" }).click();
  await page
    .getByLabel("Coin name *", { exact: true })
    .fill("Photographed browser test coin");
  await page.getByRole("button", { name: "Save coin record" }).click();
  await page
    .getByRole("link", { name: /Photographed browser test coin Denomination/ })
    .click();
  await page
    .getByAltText("obverse of Photographed browser test coin")
    .waitFor();
  await page.getByRole("button", { name: "Download dossier" }).click();
  await page
    .getByRole("status")
    .filter({ hasText: /requires an active Pro/ })
    .waitFor();
  console.log(
    "PASS private photo upload, manual photo record, honest AI-unavailable state and Pro gating",
  );
  await page.goto(origin + "/app/billing");
  assert.equal(
    await page.getByRole("button", { name: "Not charging yet" }).isDisabled(),
    true,
  );
  await page.goto(origin + "/app/collection");
  await page.setViewportSize({ width: 390, height: 900 });
  await page
    .getByRole("button", { name: "Add a coin", exact: true })
    .first()
    .click();
  await page.getByRole("dialog").waitFor();
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  if (
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  )
    console.log(
      await page.evaluate(() =>
        [...document.querySelectorAll("body *")]
          .filter((e) => e.getBoundingClientRect().right > innerWidth)
          .map((e) => ({
            tag: e.tagName,
            class: e.className,
            right: e.getBoundingClientRect().right,
          }))
          .slice(0, 30),
      ),
    );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  console.log("PASS disabled checkout, mobile collection and dialog Escape");
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const route of ["/app/identify", "/app/collection", "/app/settings"]) {
    await page.goto(origin + route, { waitUntil: "networkidle" });
    await page.locator("h1").waitFor();
    await page.addScriptTag({ url: origin + "/test/axe.js" });
    const findings = await page.evaluate(() =>
      axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
      }),
    );
    violations.push(
      ...findings.violations.map((v) => ({
        route,
        id: v.id,
        impact: v.impact,
        nodes: v.nodes
          .map((n) => ({ target: n.target, summary: n.failureSummary }))
          .slice(0, 12),
      })),
    );
  }
  await writeFile(
    "/tmp/24coinatlas-accessibility.json",
    JSON.stringify(violations, null, 2),
  );
  assert.deepEqual(errors, [], "Browser runtime errors");
  if (violations.length) {
    console.log(
      `Accessibility findings saved to /tmp/24coinatlas-accessibility.json (${violations.length} groups)`,
    );
    process.exitCode = 1;
  } else
    console.log(
      "PASS WCAG A/AA automated checks on ten public and authenticated screens",
    );
  await page.goto(origin + "/app");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "/tmp/24coinatlas-app-desktop.png",
    fullPage: true,
  });
  await page.goto(origin + "/");
  await page.setViewportSize({ width: 390, height: 900 });
  await page.screenshot({
    path: "/tmp/24coinatlas-landing-mobile.png",
    fullPage: true,
  });
} finally {
  await browser?.close();
  await new Promise((r) => server.close(r));
  db.close();
  await rm(temporary, { recursive: true, force: true });
}
