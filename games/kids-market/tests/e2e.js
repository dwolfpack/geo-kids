#!/usr/bin/env node
/* Playwright gauntlet for Kids Market.
 * Needs a static server at repo root:  python3 -m http.server 8080
 * Run:  NODE_PATH=$(npm root -g) node games/kids-market/tests/e2e.js */
"use strict";
const path = require("path");
const { chromium, devices } = require("playwright");

const BASE = process.env.BASE_URL || "http://localhost:8080/games/kids-market/";
const SHOTS = path.join(__dirname, "screens");
const JPG = { type: "jpeg", quality: 55 };
const failures = [];
function check(cond, msg) { if (!cond) { failures.push(msg); console.log("  ✗ " + msg); } else console.log("  ✓ " + msg); }
const shot = (page, name, full) => page.screenshot({ path: path.join(SHOTS, name + ".jpg"), ...JPG, fullPage: !!full });
const st = (page) => page.evaluate(() => window.__market.state);
const near = (a, b) => Math.abs(a - b) < 0.011;

async function noOverflow(page, label) {
  const o = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(o <= 0, `${label}: no horizontal overflow (${o}px)`);
}
async function tapBoxesOK(page, label) {
  const small = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll("button, a.ge-icon-btn").forEach((b) => {
      const r = b.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (r.width < 44 || r.height < 44) out.push((b.id || b.className || b.textContent).toString().slice(0, 30) + ` ${Math.round(r.width)}x${Math.round(r.height)}`);
    });
    return out;
  });
  check(small.length === 0, `${label}: all tap targets ≥44px ${small.length ? "(" + small.join("; ") + ")" : ""}`);
}
async function barFits(page, label) {
  const bad = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll(".ge-bar:not([hidden]) .ge-btn").forEach((b) => {
      const r = b.getBoundingClientRect();
      if (r.left < -1 || r.right > window.innerWidth + 1 || b.scrollWidth > b.clientWidth + 2) out.push(b.id);
    });
    return out;
  });
  check(bad.length === 0, `${label}: bottom-bar buttons fit on screen ${bad.join(" ")}`);
}
async function clearModals(page, max = 8) {
  for (let i = 0; i < max; i++) {
    await page.waitForTimeout(150);
    if (!(await page.$(".ge-modal"))) return;
    await page.click(".ge-modal .ge-modal-actions .ge-btn >> nth=0");
  }
}
async function craft(page, src) {
  await page.evaluate((code) => { const s = window.__market.state; (new Function("s", code))(s); window.__market.replace(s); }, src);
  await page.waitForTimeout(100);
}

(async () => {
  const browser = await chromium.launch();

  console.log("Mobile (iPhone 13, touch):");
  const ctx = await browser.newContext({ ...devices["iPhone 13"], locale: "he-IL" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(BASE);
  await page.waitForSelector(".ge-modal");
  await shot(page, "mobile-1-tutorial");
  await page.click(".ge-modal .ge-btn");
  let s = await st(page);
  check(s.cash === 300 && s.day === 1, "new game: 🪙300 cash on day 1");
  await shot(page, "mobile-2-market", true);
  await noOverflow(page, "market");
  await tapBoxesOK(page, "market");
  await barFits(page, "market");

  // Buy 1 share: cash drops by price + fee (2%, at least 1)
  const p = s.co.banana.price;
  await page.tap("[data-buy='banana']");
  let s2 = await st(page);
  const fee1 = Math.max(1, Math.ceil(p * 0.02));
  check(s2.co.banana.shares === 1 && near(s2.cash, s.cash - p - fee1), `buying 1 🍌 costs price 🪙${p} + fee 🪙${fee1}`);

  // Selling right away loses the fees (no churn profit)
  const worthBefore = await page.evaluate(() => window.MarketLogic.netWorth(window.__market.state));
  await page.tap("[data-sell='banana']");
  const worthAfter = await page.evaluate(() => window.MarketLogic.netWorth(window.__market.state));
  check(worthAfter < worthBefore, "buying then selling the same day loses a little (fees)");

  // Max buy spreads into two companies
  await page.tap("#qty-5");
  await page.tap("[data-buy='pizza']");
  await page.tap("[data-buy='robot']");
  s = await st(page);
  check(s.co.pizza.shares === 5 && s.co.robot.shares === 5, "×5 buys five shares");

  // Next day moves prices and advances the calendar
  const prices = Object.fromEntries(Object.keys(s.co).map((k) => [k, s.co[k].price]));
  await page.tap("#btn-next");
  await page.waitForTimeout(200);
  await clearModals(page);
  s = await st(page);
  check(s.day === 2, "next day advances the calendar");
  check(Object.keys(prices).some((k) => s.co[k].price !== prices[k]), "prices move overnight");
  await shot(page, "mobile-3-next-day", true);

  // Allowance arrives every 5 days, even with no money
  await craft(page, `s.cash = 0; s.day = 4; for (const k in s.co) { s.co[k].shares = 0; s.co[k].paid = 0; s.co[k].since = null; }`);
  await page.tap("#btn-next");
  await clearModals(page);
  s = await st(page);
  check(s.day === 5 && s.cash >= 20, "allowance +🪙20 on day 5 (never stuck with nothing)");

  // Basket badge: own 4 companies
  await craft(page, `s.cash = 1000;`);
  await page.tap("#qty-1");
  for (const id of ["banana", "pizza", "ice", "robot"]) { await page.tap(`[data-buy='${id}']`); await clearModals(page); }
  s = await st(page);
  check(!!s.badges.basket, "egg-basket badge for owning 4 companies");

  // Tips & badges modals
  await page.tap("#btn-tips");
  await page.waitForSelector(".ge-modal .tips");
  await shot(page, "mobile-4-tips");
  await clearModals(page);
  await page.tap("#btn-badges");
  await page.waitForSelector(".ge-modal .badges");
  await shot(page, "mobile-5-badges");
  await tapBoxesOK(page, "badges");
  await clearModals(page);

  // Persistence
  const saved = await st(page);
  await page.reload();
  await page.waitForTimeout(300);
  s = await st(page);
  check(near(s.cash, saved.cash) && s.day === saved.day && s.co.ice.shares === saved.co.ice.shares, "reload restores the saved game");
  check(!(await page.$(".ge-modal")), "no tutorial for returning players");

  await page.tap("#btn-lang");
  check((await page.evaluate(() => document.documentElement.dir)) === "ltr", "language toggle switches to English (ltr)");
  await shot(page, "mobile-6-english", true);
  await noOverflow(page, "english");
  await barFits(page, "english");

  await page.waitForTimeout(800);
  const swReady = await page.evaluate(async () => { if (!navigator.serviceWorker) return false; const r = await navigator.serviceWorker.ready; return !!r.active; });
  check(swReady, "service worker is active");
  await ctx.setOffline(true);
  await page.reload();
  await page.waitForSelector("#companies .company");
  check(true, "game loads while offline");
  await ctx.setOffline(false);
  check(errors.length === 0, `no console errors on mobile ${errors.length ? JSON.stringify(errors) : ""}`);
  await ctx.close();

  console.log("Blocked storage:");
  const ctxB = await browser.newContext({ ...devices["iPhone 13"] });
  await ctxB.addInitScript(() => { Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } }); });
  const pb = await ctxB.newPage();
  const berr = [];
  pb.on("pageerror", (e) => berr.push(e.message));
  await pb.goto(BASE);
  await pb.waitForSelector(".ge-modal");
  await pb.click(".ge-modal .ge-btn");
  await pb.tap("[data-buy='banana']");
  await pb.tap("#btn-next");
  const bs = await pb.evaluate(() => window.__market.state);
  check(bs.co.banana.shares === 1 && bs.day === 2, "game is playable when storage is blocked");
  check(berr.length === 0, `no page errors with blocked storage ${berr.join(" ")}`);
  await ctxB.close();

  console.log("Desktop (1280x800):");
  const ctxD = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pd = await ctxD.newPage();
  const derr = [];
  pd.on("console", (m) => { if (m.type() === "error") derr.push(m.text()); });
  pd.on("pageerror", (e) => derr.push(e.message));
  await pd.goto(BASE);
  await pd.click(".ge-modal .ge-btn");
  for (let i = 0; i < 6; i++) await pd.click("#btn-next");
  await clearModals(pd);
  await pd.screenshot({ path: path.join(SHOTS, "desktop-1-market.jpg"), ...JPG, fullPage: true });
  await noOverflow(pd, "desktop");
  check(derr.length === 0, `no console errors on desktop ${derr.join(" ")}`);
  await ctxD.close();

  await browser.close();
  if (failures.length) { console.log(`\nFAIL (${failures.length})`); process.exit(1); }
  console.log("\nPASS: Playwright gauntlet");
})().catch((e) => { console.error(e); process.exit(1); });
