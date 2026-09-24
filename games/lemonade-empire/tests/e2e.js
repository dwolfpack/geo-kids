#!/usr/bin/env node
/* Playwright gauntlet for Lemonade Empire.
 * Needs a static server at repo root:  python3 -m http.server 8080
 * Run:  NODE_PATH=$(npm root -g) node games/lemonade-empire/tests/e2e.js */
"use strict";
const path = require("path");
const { chromium, devices } = require("playwright");

const BASE = process.env.BASE_URL || "http://localhost:8080/games/lemonade-empire/";
const SHOTS = path.join(__dirname, "screens");
const JPG = { type: "jpeg", quality: 55 };
const failures = [];
function check(cond, msg) { if (!cond) { failures.push(msg); console.log("  ✗ " + msg); } else console.log("  ✓ " + msg); }
const shot = (page, name, full) => page.screenshot({ path: path.join(SHOTS, name + ".jpg"), ...JPG, fullPage: !!full });
const st = (page) => page.evaluate(() => window.__lemon.state);

async function noOverflow(page, label) {
  const o = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(o <= 0, `${label}: no horizontal overflow (${o}px)`);
}
async function tapBoxesOK(page, label) {
  const small = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll("button, a.ge-icon-btn, input[type=range]").forEach((b) => {
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
// Swap a modified state into the running game (reloading would race the
// game's own pagehide save).
async function craft(page, src) {
  await page.evaluate((code) => {
    const s = window.__lemon.state;
    (new Function("s", code))(s);
    window.__lemon.replace(s);
  }, src);
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
  check(s.money === 40 && s.stands.telaviv.open && s.view === "telaviv", "new game: one stand in Tel Aviv, 🪙40");

  // Let customers arrive, then tap to sell exactly one cup
  await page.evaluate(() => window.__lemon.advance(20));
  s = await st(page);
  check(s.stands.telaviv.queue > 0, `customers queue up (${s.stands.telaviv.queue} waiting)`);
  await shot(page, "mobile-2-stand", true);
  await noOverflow(page, "stand");
  await tapBoxesOK(page, "stand");
  await barFits(page, "stand");
  const before = s.money, profit = s.stands.telaviv.price - 1;
  await page.tap("#btn-tap");
  s = await st(page);
  check(Math.abs(s.money - before - profit) < 1e-9 && s.stands.telaviv.sold >= 1 && s.stats.taps === 1, `tapping sells a cup for the shown profit (🪙${profit})`);

  // Tapping with nobody waiting earns nothing (checked atomically in-page)
  const empty = await page.evaluate(() => {
    const s = window.__lemon.state;
    s.stands.telaviv.queue = 0; s.stands.telaviv.arrAcc = 0;
    window.__lemon.replace(s);
    const m = window.__lemon.state.money;
    document.getElementById("btn-tap").click();
    return { gained: window.__lemon.state.money - m, toast: (document.getElementById("ge-toast") || {}).textContent || "" };
  });
  check(empty.gained === 0 && empty.toast.length > 0, "tapping with no customer waiting earns nothing and explains why");

  // Price slider: moving it changes the price and the teaching readouts
  const ro0 = await page.textContent("#ro-coins");
  await page.evaluate(() => { const p = document.getElementById("price"); p.value = p.max; p.dispatchEvent(new Event("input", { bubbles: true })); });
  s = await st(page);
  const ro1 = await page.textContent("#ro-coins");
  check(s.stands.telaviv.price > 4 && ro0 !== ro1, `price slider sets the price (🪙${s.stands.telaviv.price}) and updates coins/min`);
  check((await page.textContent("#sweet")).length > 0, "sweet-spot hint shown");
  // Put it at the sweet spot
  await page.evaluate(() => { const p = document.getElementById("price"); p.value = 4; p.dispatchEvent(new Event("input", { bubbles: true })); });
  check((await page.$eval("#sweet", (e) => e.classList.contains("hit"))), "sweet spot is recognised at the best price");

  // Hire a helper
  await craft(page, `s.money = 500;`);
  await clearModals(page);
  const hBefore = await st(page);
  await page.tap("[data-act='helper']");
  s = await st(page);
  check(s.stands.telaviv.helpers === 1 && s.money < hBefore.money, "hired a helper");
  await page.evaluate(() => window.__lemon.advance(30));
  s = await st(page);
  check(s.stands.telaviv.sold > hBefore.stands.telaviv.sold, "the helper sells cups automatically");

  // Upgrades modal
  await clearModals(page);
  await page.tap("#btn-ups");
  await page.waitForSelector("[data-up='recipe']");
  await shot(page, "mobile-3-upgrades");
  await tapBoxesOK(page, "upgrades modal");
  await page.tap("[data-up='recipe']");
  s = await st(page);
  check(s.up.recipe === 1, "bought the better recipe");
  await clearModals(page);

  // Open a stand in Paris
  await craft(page, `s.money = 2000;`);
  await clearModals(page);
  await page.tap("#btn-cities");
  await page.waitForSelector("#view-cities:not([hidden])");
  await shot(page, "mobile-4-cities", true);
  await noOverflow(page, "cities");
  await tapBoxesOK(page, "cities");
  await barFits(page, "cities");
  await page.tap("[data-open='paris']");
  await page.waitForTimeout(200);
  if (await page.$(".ge-modal")) await shot(page, "mobile-5-opened");
  await clearModals(page);
  s = await st(page);
  check(s.stands.paris.open && s.stands.paris.helpers === 1 && s.view === "paris", "opened a stand in Paris (with its first helper)");

  // Offline earnings: 5 hours away pays only the 2-hour cap (saved to storage, then a fresh load)
  const cap = await page.evaluate(() => {
    const c = window.__lemon.state; c.money = 0;
    return window.LemonLogic.offline(c, 2 * 3600).got;
  });
  await page.evaluate(() => window.__lemon.away(5 * 3600));
  await page.waitForSelector(".ge-modal .offline-big");
  await shot(page, "mobile-6-away");
  const got = parseInt((await page.textContent(".offline-big")).replace(/[^\d]/g, ""), 10);
  check(got > 0 && Math.abs(got - cap) <= Math.max(2, cap * 0.02), `away for 5h pays the 2h cap (🪙${got} ≈ 🪙${cap})`);
  await clearModals(page);

  // Persistence
  const saved = await st(page);
  await page.reload();
  await page.waitForTimeout(300);
  await clearModals(page);
  s = await st(page);
  check(s.stands.paris.open && s.up.recipe === 1 && s.money >= saved.money - 1, "reload restores the saved game");

  await page.tap("#btn-lang");
  check((await page.evaluate(() => document.documentElement.dir)) === "ltr", "language toggle switches to English (ltr)");
  await shot(page, "mobile-7-english", true);
  await noOverflow(page, "english stand");
  await barFits(page, "english stand");

  await page.waitForTimeout(800);
  const swReady = await page.evaluate(async () => { if (!navigator.serviceWorker) return false; const r = await navigator.serviceWorker.ready; return !!r.active; });
  check(swReady, "service worker is active");
  await ctx.setOffline(true);
  await page.reload();
  await page.waitForSelector("#btn-tap");
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
  await pb.evaluate(() => window.__lemon.advance(20));
  await pb.tap("#btn-tap");
  check((await pb.evaluate(() => window.__lemon.state)).stats.cups >= 1, "game is playable when storage is blocked");
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
  await pd.evaluate(() => window.__lemon.advance(15));
  await pd.screenshot({ path: path.join(SHOTS, "desktop-1-stand.jpg"), ...JPG, fullPage: true });
  await noOverflow(pd, "desktop stand");
  check(derr.length === 0, `no console errors on desktop ${derr.join(" ")}`);
  await ctxD.close();

  await browser.close();
  if (failures.length) { console.log(`\nFAIL (${failures.length})`); process.exit(1); }
  console.log("\nPASS: Playwright gauntlet");
})().catch((e) => { console.error(e); process.exit(1); });
