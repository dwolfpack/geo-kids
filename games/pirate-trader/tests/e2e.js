#!/usr/bin/env node
/* Playwright gauntlet for Pirate Trader.
 * Needs a static server at repo root:  python3 -m http.server 8080
 * Run:  NODE_PATH=$(npm root -g) node games/pirate-trader/tests/e2e.js
 * Uses the preinstalled Chromium (PLAYWRIGHT_BROWSERS_PATH); never downloads. */
"use strict";
const path = require("path");
const { chromium, devices } = require("playwright");

const BASE = process.env.BASE_URL || "http://localhost:8080/games/pirate-trader/";
const SHOTS = path.join(__dirname, "screens");
const failures = [];
function check(cond, msg) { if (!cond) { failures.push(msg); console.log("  ✗ " + msg); } else console.log("  ✓ " + msg); }

async function noOverflow(page, label) {
  const o = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(o <= 0, `${label}: no horizontal overflow (${o}px)`);
}
const st = (page) => page.evaluate(() => window.__pirate.state);

// Click through any open modals. Pirates: pay the toll (deterministic outcome).
async function clearModals(page, max = 10) {
  for (let i = 0; i < max; i++) {
    await page.waitForTimeout(150);
    const modal = await page.$(".ge-modal");
    if (!modal) return;
    const pay = await page.$("#pirate-pay");
    if (pay) await pay.click();
    else await page.click(".ge-modal .ge-modal-actions .ge-btn >> nth=0");
  }
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
async function tapBoxesOK(page, label) {
  // Every visible button must be at least 44x44 CSS px (48 target, 44 hard floor).
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

(async () => {
  const browser = await chromium.launch();

  /* ---------------- mobile core loop ---------------- */
  console.log("Mobile (iPhone 13, touch):");
  const ctx = await browser.newContext({ ...devices["iPhone 13"], locale: "he-IL" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(BASE);
  await page.waitForSelector(".ge-modal");
  await page.screenshot({ path: path.join(SHOTS, "mobile-1-tutorial.jpg"), type: "jpeg", quality: 55 });
  await page.click(".ge-modal .ge-btn");
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(SHOTS, "mobile-2-port.jpg"), type: "jpeg", quality: 55, fullPage: true });
  await noOverflow(page, "port");
  await tapBoxesOK(page, "port");
  await barFits(page, "port");

  let s = await st(page);
  check(s.port === "lisbon" && s.money === 150, "new game starts in Lisbon with 🪙150");

  // Buy one sugar: money drops by exactly the displayed buy price
  const priceText = await page.textContent("[data-buy='sugar'] b");
  const price = parseInt(priceText.replace(/\D/g, ""), 10);
  await page.tap("[data-buy='sugar']");
  let s2 = await st(page);
  check(s2.money === s.money - price && s2.cargo.sugar === 1, `buy ×1 sugar costs the shown price (🪙${price})`);

  // Max buy
  await page.tap("#qty-max");
  await page.tap("[data-buy='sugar']");
  s = await st(page);
  check(s.cargo.sugar > 1 && s.money >= 0, `buy Max fills up on sugar (${s.cargo.sugar} units, 🪙${s.money} left)`);

  // Sail to Alexandria
  await page.tap("#btn-map");
  await page.waitForSelector("#view-map:not([hidden])");
  await page.tap("[data-dest='alexandria']");
  await page.screenshot({ path: path.join(SHOTS, "mobile-3-map.jpg"), type: "jpeg", quality: 55, fullPage: true });
  await noOverflow(page, "map");
  await tapBoxesOK(page, "map");
  await barFits(page, "map");
  await page.tap("#btn-sail");
  await page.waitForSelector("#voyage:not([hidden])");
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(SHOTS, "mobile-4-voyage.jpg"), type: "jpeg", quality: 55 });
  await page.waitForSelector("#voyage", { state: "hidden", timeout: 8000 });
  await page.waitForTimeout(200);
  if (await page.$(".ge-modal")) await page.screenshot({ path: path.join(SHOTS, "mobile-5-event.jpg"), type: "jpeg", quality: 55 });
  await clearModals(page);
  s = await st(page);
  check(s.port === "alexandria", "arrived in Alexandria");
  check(s.day > 1, `days passed during the voyage (day ${s.day})`);

  // Harbour master quiz: answer correctly
  const before = s.money;
  const q = await page.$("[data-quiz='eg']");
  check(!!q, "harbour master asks which country the port is in");
  if (q) {
    await q.tap();
    s = await st(page);
    check(s.money === before + 15, "correct quiz answer pays a 🪙15 tip");
  }

  // Sell all sugar: money rises by what the sale reported
  const sugarHeld = s.cargo.sugar;
  const m0 = s.money;
  await page.tap("[data-sell='sugar']");
  await clearModals(page);
  s = await st(page);
  check(s.cargo.sugar === 0 && s.money > m0, `sold ${sugarHeld} sugar (+🪙${s.money - m0})`);
  await page.screenshot({ path: path.join(SHOTS, "mobile-6-after-sale.jpg"), type: "jpeg", quality: 55, fullPage: true });

  // Ship upgrades modal
  await page.tap("#btn-ship");
  await page.waitForSelector(".ge-modal .ups");
  await page.screenshot({ path: path.join(SHOTS, "mobile-7-ship.jpg"), type: "jpeg", quality: 55 });
  await tapBoxesOK(page, "ship modal");
  const upBtn = await page.$("[data-up='hold']:not([disabled])");
  if (upBtn) {
    const m1 = (await st(page)).money;
    await upBtn.tap();
    s = await st(page);
    check(s.up.hold === 1 && s.money < m1, "hold upgrade bought");
  }
  await clearModals(page);

  // Fishing always works
  const mf = (await st(page)).money;
  await page.tap("#btn-fish");
  s = await st(page);
  check(s.money > mf, "fishing earns coins");

  // Reload: save persists
  const saved = await st(page);
  await page.reload();
  await page.waitForTimeout(300);
  s = await st(page);
  check(s.money === saved.money && s.port === saved.port && s.day === saved.day, "reload restores the saved game");
  check(!(await page.$(".ge-modal")), "no tutorial on returning players");

  // Language toggle flips direction
  await page.tap("#btn-lang");
  const dir = await page.evaluate(() => document.documentElement.dir);
  check(dir === "ltr", "language toggle switches to English (ltr)");
  await page.screenshot({ path: path.join(SHOTS, "mobile-8-english.jpg"), type: "jpeg", quality: 55, fullPage: true });
  await noOverflow(page, "english port");
  await barFits(page, "english port");

  // Offline: service worker serves the game with no network
  await page.waitForTimeout(800);
  const swReady = await page.evaluate(async () => { if (!navigator.serviceWorker) return false; const r = await navigator.serviceWorker.ready; return !!r.active; });
  check(swReady, "service worker is active");
  await ctx.setOffline(true);
  await page.reload();
  await page.waitForSelector("#goods .good");
  check(true, "game loads while offline");
  await ctx.setOffline(false);

  check(errors.length === 0, `no console errors on mobile ${errors.length ? JSON.stringify(errors) : ""}`);
  await ctx.close();

  /* ---------------- pirates flow via crafted save ---------------- */
  console.log("Pirate encounter:");
  const ctxP = await browser.newContext({ ...devices["iPhone 13"] });
  const pp = await ctxP.newPage();
  const perr = [];
  pp.on("pageerror", (e) => perr.push(e.message));
  await pp.goto(BASE);
  await pp.evaluate(() => {
    const s = window.__pirate.state;
    s.money = 400; s.pending = { type: "pirates", to: "london", toll: 48, loot: 60 };
    localStorage.setItem("pirate-trader-v1", JSON.stringify(s));
  });
  await pp.reload();
  await pp.waitForSelector("#pirate-pay");
  await pp.screenshot({ path: path.join(SHOTS, "mobile-9-pirates.jpg"), type: "jpeg", quality: 55 });
  await pp.tap("#pirate-pay");
  await clearModals(pp);
  const ps = await pp.evaluate(() => window.__pirate.state);
  check(ps.money === 352 && ps.port === "london" && !ps.pending, "paying the pirate toll costs exactly the toll and completes the voyage");
  check(perr.length === 0, "no errors in pirate flow");
  await ctxP.close();

  /* ---------------- blocked storage ---------------- */
  console.log("Blocked storage:");
  const ctxB = await browser.newContext({ ...devices["iPhone 13"] });
  await ctxB.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } });
  });
  const pb = await ctxB.newPage();
  const berr = [];
  pb.on("pageerror", (e) => berr.push(e.message));
  await pb.goto(BASE);
  await pb.waitForSelector(".ge-modal");
  await pb.click(".ge-modal .ge-btn");
  await pb.tap("[data-buy='sugar']");
  const bs = await pb.evaluate(() => window.__pirate.state);
  check(bs.cargo.sugar === 1, "game is playable when storage is blocked");
  check(berr.length === 0, `no page errors with blocked storage ${berr.join(" ")}`);
  await ctxB.close();

  /* ---------------- desktop ---------------- */
  console.log("Desktop (1280x800):");
  const ctxD = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pd = await ctxD.newPage();
  const derr = [];
  pd.on("console", (m) => { if (m.type() === "error") derr.push(m.text()); });
  pd.on("pageerror", (e) => derr.push(e.message));
  await pd.goto(BASE);
  await pd.click(".ge-modal .ge-btn");
  await pd.click("[data-buy='sugar']");
  await pd.screenshot({ path: path.join(SHOTS, "desktop-1-port.jpg"), type: "jpeg", quality: 55, fullPage: true });
  await noOverflow(pd, "desktop port");
  await pd.click("#btn-map");
  await pd.click("[data-dest='london']");
  await pd.screenshot({ path: path.join(SHOTS, "desktop-2-map.jpg"), type: "jpeg", quality: 55, fullPage: true });
  await pd.keyboard.press("Escape");
  check(derr.length === 0, `no console errors on desktop ${derr.join(" ")}`);
  await ctxD.close();

  await browser.close();
  if (failures.length) { console.log(`\nFAIL (${failures.length})`); process.exit(1); }
  console.log("\nPASS: Playwright gauntlet");
})().catch((e) => { console.error(e); process.exit(1); });
