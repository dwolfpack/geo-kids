#!/usr/bin/env node
/* Playwright gauntlet for Island Shop.
 * Needs a static server at repo root:  python3 -m http.server 8080
 * Run:  NODE_PATH=$(npm root -g) node games/island-shop/tests/e2e.js */
"use strict";
const path = require("path");
const { chromium, devices } = require("playwright");

const BASE = process.env.BASE_URL || "http://localhost:8080/games/island-shop/";
const SHOTS = path.join(__dirname, "screens");
const JPG = { type: "jpeg", quality: 55 };
const failures = [];
function check(cond, msg) { if (!cond) { failures.push(msg); console.log("  ✗ " + msg); } else console.log("  ✓ " + msg); }
const shot = (page, name, full) => page.screenshot({ path: path.join(SHOTS, name + ".jpg"), ...JPG, fullPage: !!full });
const st = (page) => page.evaluate(() => window.__shop.state);

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
  await page.evaluate((code) => { const s = window.__shop.state; (new Function("s", code))(s); window.__shop.replace(s); }, src);
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
  check(s.money === 100 && s.day === 1 && Object.keys(s.ship.offer).length >= 3, "new game: 🪙100, day 1, a ship with 3+ goods");
  await shot(page, "mobile-2-morning", true);
  await noOverflow(page, "morning");
  await tapBoxesOK(page, "morning");
  await barFits(page, "morning");

  // Buy ×1 of the first offered good at exactly the shown wholesale price
  const first = Object.keys(s.ship.offer)[0];
  const price = s.ship.offer[first].price;
  await page.tap("[data-qty='1']");
  await page.tap(`[data-buy='${first}']`);
  let s2 = await st(page);
  check(s2.money === s.money - price && s2.stock[first].qty === 1, `buy ×1 ${first} costs the wholesale price (🪙${price})`);

  // Max-buy a second good
  const second = Object.keys(s.ship.offer)[1];
  await page.tap("#qty-max");
  await page.tap(`[data-buy='${second}']`);
  s = await st(page);
  check(s.stock[second].qty > 0, `buy Max stocks ${second} (${s.stock[second].qty})`);

  // Price tags
  await page.tap(`[data-good='${first}'][data-tag='pricey']`);
  s = await st(page);
  check(s.stock[first].tag === "pricey", "price tag switches to 🤑 pricey");
  await page.tap(`[data-good='${first}'][data-tag='fair']`);

  // Beach cleanup once per morning
  const mc = s.money;
  await page.tap("#btn-clean");
  s = await st(page);
  check(s.money > mc && s.cleaned, "beach cleanup pays once");
  check(await page.$eval("#btn-clean", (b) => b.disabled), "cleanup is disabled until tomorrow");

  // Open the shop: watch the day, then the evening summary
  const beforeDay = await st(page);
  await page.tap("#btn-open");
  await page.waitForSelector("#day:not([hidden])");
  await page.waitForTimeout(900);
  await shot(page, "mobile-3-day");
  await page.tap("#day-skip");
  await page.waitForSelector("#btn-next-day", { timeout: 5000 });
  await shot(page, "mobile-4-evening");
  s = await st(page);
  const soldTotal = beforeDay.stats.sold;
  check(s.day === beforeDay.day + 1 && s.stats.days === 1, "the day ends and the next morning begins");
  check(s.stats.visitors > 0, `customers visited (${s.stats.visitors})`);
  check(s.money === beforeDay.money + s.last.earned - s.last.rent, `money = before + takings (🪙${s.last.earned}) − rent (🪙${s.last.rent})`);
  check(s.ship.code !== beforeDay.ship.code, "a new ship from another country docked");
  await clearModals(page);
  await shot(page, "mobile-5-next-morning", true);

  // Shelves limit: with every shelf full, a new kind of good is refused with a message
  await craft(page, `s.money = 500; const ids = ["postcard","candy","coffee","rope","kite","souvenir","banana","mango","fish"]; let n = 0; for (const id of ids) { if (!s.ship.offer[id] && n < 3) { s.stock[id].qty = 2; n++; } }`);
  const offered = Object.keys((await st(page)).ship.offer).find((id) => true);
  const sb = await st(page);
  if (sb.stock[offered].qty === 0) {
    await page.tap(`[data-buy='${offered}']`);
    const toast = await page.textContent("#ge-toast");
    check((await st(page)).stock[offered].qty === 0 && toast.length > 0, "no free shelf: purchase refused with a friendly message");
  } else check(true, "shelf-limit case not applicable for this ship");

  // Upgrades
  await craft(page, `s.money = 2000;`);
  await clearModals(page);
  await page.tap("#btn-shop");
  await page.waitForSelector("[data-up='fridge']");
  await shot(page, "mobile-6-upgrades");
  await tapBoxesOK(page, "upgrades");
  await page.tap("[data-up='fridge']");
  await clearModals(page);
  await page.tap("#btn-shop");
  await page.waitForSelector("[data-up='shelves']");
  await page.tap("[data-up='shelves']");
  s = await st(page);
  check(s.up.fridge === 1 && s.up.shelves === 1, "bought a fridge and an extra shelf");
  await clearModals(page);

  // Persistence
  const saved = await st(page);
  await page.reload();
  await page.waitForTimeout(300);
  s = await st(page);
  check(s.money === saved.money && s.day === saved.day && s.up.fridge === 1, "reload restores the saved game");
  check(!(await page.$(".ge-modal")), "no tutorial for returning players");

  await page.tap("#btn-lang");
  check((await page.evaluate(() => document.documentElement.dir)) === "ltr", "language toggle switches to English (ltr)");
  await shot(page, "mobile-7-english", true);
  await noOverflow(page, "english");
  await barFits(page, "english");

  await page.waitForTimeout(800);
  const swReady = await page.evaluate(async () => { if (!navigator.serviceWorker) return false; const r = await navigator.serviceWorker.ready; return !!r.active; });
  check(swReady, "service worker is active");
  await ctx.setOffline(true);
  await page.reload();
  await page.waitForSelector("#ship-card .offer");
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
  await pb.tap("#btn-clean");
  check((await pb.evaluate(() => window.__shop.state)).cleaned, "game is playable when storage is blocked");
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
  await pd.screenshot({ path: path.join(SHOTS, "desktop-1-morning.jpg"), ...JPG, fullPage: true });
  await noOverflow(pd, "desktop");
  check(derr.length === 0, `no console errors on desktop ${derr.join(" ")}`);
  await ctxD.close();

  await browser.close();
  if (failures.length) { console.log(`\nFAIL (${failures.length})`); process.exit(1); }
  console.log("\nPASS: Playwright gauntlet");
})().catch((e) => { console.error(e); process.exit(1); });
