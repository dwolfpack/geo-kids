#!/usr/bin/env node
/* Playwright gauntlet for Merchant Caravan.
 * Needs a static server at repo root:  python3 -m http.server 8080
 * Run:  NODE_PATH=$(npm root -g) node games/merchant-caravan/tests/e2e.js */
"use strict";
const path = require("path");
const { chromium, devices } = require("playwright");

const BASE = process.env.BASE_URL || "http://localhost:8080/games/merchant-caravan/";
const SHOTS = path.join(__dirname, "screens");
const JPG = { type: "jpeg", quality: 55 };
const failures = [];
function check(cond, msg) { if (!cond) { failures.push(msg); console.log("  ✗ " + msg); } else console.log("  ✓ " + msg); }
const shot = (page, name, full) => page.screenshot({ path: path.join(SHOTS, name + ".jpg"), ...JPG, fullPage: !!full });
const st = (page) => page.evaluate(() => window.__caravan.state);

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
async function clearModals(page, max = 10) {
  for (let i = 0; i < max; i++) {
    await page.waitForTimeout(150);
    if (!(await page.$(".ge-modal"))) return;
    const gift = await page.$("#bandit-gift");
    if (gift) await gift.click();
    else await page.click(".ge-modal .ge-modal-actions .ge-btn >> nth=0");
  }
}
async function craft(page, fn, arg) {
  await page.evaluate(([src, a]) => {
    const s = window.__caravan.state;
    (new Function("s", "a", src))(s, a);
    localStorage.setItem("merchant-caravan-v1", JSON.stringify(s));
  }, [fn, arg]);
  await page.reload();
  await page.waitForTimeout(250);
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
  await page.waitForTimeout(200);
  await shot(page, "mobile-2-city", true);
  await noOverflow(page, "city");
  await tapBoxesOK(page, "city");

  let s = await st(page);
  check(s.city === "samarkand" && s.money === 150 && s.camels === 2, "new game starts in Samarkand with 🪙150 and 2 camels");

  const price = parseInt((await page.textContent("[data-buy='paper'] b")).replace(/\D/g, ""), 10);
  await page.tap("[data-buy='paper']");
  let s2 = await st(page);
  check(s2.money === s.money - price && s2.cargo.paper === 1, `buy ×1 paper costs the shown price (🪙${price})`);

  await page.tap("#qty-max");
  await page.tap("[data-buy='paper']");
  s = await st(page);
  check(s.cargo.paper > 1, `buy Max loads up on paper (${s.cargo.paper})`);

  await page.tap("#btn-map");
  await page.waitForSelector("#view-map:not([hidden])");
  await page.tap("[data-dest='merv']");
  await shot(page, "mobile-3-map", true);
  await noOverflow(page, "map");
  await tapBoxesOK(page, "map");
  await page.tap("#btn-go");
  await page.waitForSelector("#trek:not([hidden])");
  await page.waitForTimeout(600);
  await shot(page, "mobile-4-trek");
  await page.waitForSelector("#trek", { state: "hidden", timeout: 8000 });
  await page.waitForTimeout(200);
  if (await page.$(".ge-modal")) await shot(page, "mobile-5-event");
  await clearModals(page);
  s = await st(page);
  check(s.city === "merv" && s.day > 1, `arrived in Merv (day ${s.day})`);

  const held = s.cargo.paper, m0 = s.money;
  if (held > 0) {
    await page.tap("[data-sell='paper']");
    await clearModals(page);
    s = await st(page);
    check(s.cargo.paper === 0 && s.money > m0, `sold ${held} paper in Merv (+🪙${s.money - m0})`);
  } else check(true, "paper was taken by bandits/drivers — sale skipped");
  await shot(page, "mobile-6-after-sale", true);

  // Contract delivery (crafted: an open order for 3 horses, we carry 5)
  await craft(page, `s.cargo.horses = 5; s.contracts[s.city] = { good: "horses", qty: 3, from: s.day, due: s.day + 5, reward: 250 };`);
  const md = (await st(page)).money;
  await page.tap("#btn-deliver");
  s = await st(page);
  check(s.money === md + 250 && s.cargo.horses === 2, "delivering an order pays the reward and removes the goods");
  check(s.contracts[s.city].from > s.day, "next order at this city is posted later (no farming)");
  await clearModals(page);

  // Caravan: buy a camel
  await craft(page, `s.money = 1000;`);
  await page.tap("#btn-team");
  await page.waitForSelector(".ge-modal .ups");
  await shot(page, "mobile-7-caravan");
  await tapBoxesOK(page, "caravan modal");
  const cBefore = await st(page);
  await page.tap("[data-team='camel']");
  s = await st(page);
  check(s.camels === cBefore.camels + 1 && s.money < cBefore.money, "bought a camel (+10 capacity)");
  await clearModals(page); // a milestone popup may have replaced the caravan sheet
  await page.tap("#btn-team");
  await page.waitForSelector("[data-team='guard']");
  await page.tap("[data-team='guard']");
  s = await st(page);
  check(s.guards === 1, "hired a guard");
  await clearModals(page);

  // Permit flow: from Istanbul, Venice needs a permit
  await craft(page, `s.city = "istanbul"; s.money = 900; s.pending = null;`);
  await page.tap("#btn-map");
  await page.tap("[data-dest='venice']");
  await page.waitForSelector("#permit-yes");
  await shot(page, "mobile-8-permit");
  await page.tap("#permit-yes");
  s = await st(page);
  check(s.permits["istanbul|venice"] === true && s.money === 400, "buying the Venice permit opens the road for 🪙500");
  await page.waitForTimeout(200);
  await clearModals(page);
  check(!(await page.$("[data-dest='venice'][data-open='false']")), "Venice road shows as open after the permit");
  await page.tap("#btn-back");

  // Bazaar job always pays
  const mj = (await st(page)).money;
  await page.tap("#btn-job");
  s = await st(page);
  check(s.money > mj, "bazaar work earns coins");

  // Reload persistence
  const saved = await st(page);
  await page.reload();
  await page.waitForTimeout(300);
  s = await st(page);
  check(s.money === saved.money && s.city === saved.city && s.day === saved.day, "reload restores the saved game");
  check(!(await page.$(".ge-modal")), "no tutorial for returning players");

  await page.tap("#btn-lang");
  check((await page.evaluate(() => document.documentElement.dir)) === "ltr", "language toggle switches to English (ltr)");
  await shot(page, "mobile-9-english", true);
  await noOverflow(page, "english city");

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

  console.log("Bandit encounter:");
  const ctxP = await browser.newContext({ ...devices["iPhone 13"] });
  const pp = await ctxP.newPage();
  const perr = [];
  pp.on("pageerror", (e) => perr.push(e.message));
  await pp.goto(BASE);
  await pp.evaluate(() => {
    const s = window.__caravan.state;
    s.money = 300; s.pending = { type: "bandits", to: "merv", fee: 30 };
    localStorage.setItem("merchant-caravan-v1", JSON.stringify(s));
  });
  await pp.reload();
  await pp.waitForSelector("#bandit-gift");
  await pp.screenshot({ path: path.join(SHOTS, "mobile-10-bandits.jpg"), ...JPG });
  await pp.tap("#bandit-gift");
  await clearModals(pp);
  const ps = await pp.evaluate(() => window.__caravan.state);
  check(ps.money === 270 && ps.city === "merv" && !ps.pending, "giving the bandits a gift costs exactly the fee and completes the trip");
  check(perr.length === 0, "no errors in bandit flow");
  await ctxP.close();

  console.log("Blocked storage:");
  const ctxB = await browser.newContext({ ...devices["iPhone 13"] });
  await ctxB.addInitScript(() => { Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } }); });
  const pb = await ctxB.newPage();
  const berr = [];
  pb.on("pageerror", (e) => berr.push(e.message));
  await pb.goto(BASE);
  await pb.waitForSelector(".ge-modal");
  await pb.click(".ge-modal .ge-btn");
  await pb.tap("[data-buy='paper']");
  check((await pb.evaluate(() => window.__caravan.state)).cargo.paper === 1, "game is playable when storage is blocked");
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
  await pd.screenshot({ path: path.join(SHOTS, "desktop-1-city.jpg"), ...JPG, fullPage: true });
  await noOverflow(pd, "desktop city");
  await pd.click("#btn-map");
  await pd.click("[data-dest='delhi']");
  await pd.screenshot({ path: path.join(SHOTS, "desktop-2-map.jpg"), ...JPG, fullPage: true });
  check(derr.length === 0, `no console errors on desktop ${derr.join(" ")}`);
  await ctxD.close();

  await browser.close();
  if (failures.length) { console.log(`\nFAIL (${failures.length})`); process.exit(1); }
  console.log("\nPASS: Playwright gauntlet");
})().catch((e) => { console.error(e); process.exit(1); });
