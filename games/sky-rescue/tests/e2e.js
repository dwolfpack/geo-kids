#!/usr/bin/env node
/* Playwright gauntlet for Sky Rescue (three.js).
 * Needs a static server at repo root:  python3 -m http.server 8080
 * Run:  NODE_PATH=$(npm root -g) node games/sky-rescue/tests/e2e.js */
"use strict";
const path = require("path");
const { chromium, devices } = require("playwright");

const BASE = process.env.BASE_URL || "http://localhost:8080/games/sky-rescue/";
const failures = [];
function check(cond, msg) { if (!cond) { failures.push(msg); console.log("  ✗ " + msg); } else console.log("  ✓ " + msg); }
const GL = ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"];
const st = (p) => p.evaluate(() => window.__heli.state);

async function tapBoxesOK(page, label) {
  const small = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll("button, a.ge-icon-btn").forEach((b) => {
      const r = b.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || getComputedStyle(b).visibility === "hidden") return;
      if (r.width < 44 || r.height < 44) out.push((b.id || b.className).toString().slice(0, 30) + ` ${Math.round(r.width)}x${Math.round(r.height)}`);
    });
    return out;
  });
  check(small.length === 0, `${label}: all tap targets ≥44px ${small.length ? "(" + small.join("; ") + ")" : ""}`);
}
async function noOverflow(page, label) {
  const o = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(o <= 0, `${label}: no horizontal overflow (${o}px)`);
}

(async () => {
  const browser = await chromium.launch({ args: GL });

  console.log("Mobile (iPhone 13, touch):");
  const ctx = await browser.newContext({ ...devices["iPhone 13"], locale: "he-IL" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(BASE);
  await page.waitForFunction(() => window.__heli);
  await page.waitForSelector("#scr-title:not([hidden]) .stage-btn");
  await tapBoxesOK(page, "title");
  await noOverflow(page, "title");
  check(await page.$eval("[data-stage='1']", (b) => b.disabled), "stage 2 is locked on a fresh start");

  await page.tap("[data-stage='0']");
  await page.waitForSelector("#hud:not([hidden])");
  let s = await st(page);
  check(s.mode === "play" && s.stage === 0 && s.hearts === 3, "tapping stage 1 starts the flight with 3 hearts");
  await tapBoxesOK(page, "HUD");
  await noOverflow(page, "HUD");

  // Joystick: drag right moves the helicopter right (real-time loop, touch events)
  await page.evaluate(() => window.__heli.manual(true));
  const x0 = (await st(page)).x;
  const box = await page.$eval("#stick", (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await page.evaluate(({ x, y }) => {
    const el = document.getElementById("stick");
    const ev = (type, cx) => el.dispatchEvent(new PointerEvent(type, { pointerId: 7, clientX: cx, clientY: y, bubbles: true, pointerType: "touch" }));
    ev("pointerdown", x); ev("pointermove", x + 60);
    window.__heli.step(0.6);
    ev("pointerup", x + 60);
  }, box);
  s = await st(page);
  check(s.x > x0 + 3, `joystick right steers right (x ${x0.toFixed(1)} → ${s.x.toFixed(1)})`);

  // Water bomb button uses a tank drop
  const tank0 = s.tank;
  await page.evaluate(() => {
    const b = document.getElementById("btn-drop");
    b.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 8, bubbles: true, pointerType: "touch" }));
    window.__heli.step(0.1);
    b.dispatchEvent(new PointerEvent("pointerup", { pointerId: 8, bubbles: true, pointerType: "touch" }));
  });
  s = await st(page);
  check(s.tank < tank0, `💧 button drops a water bomb (tank ${tank0.toFixed(1)} → ${s.tank.toFixed(1)})`);

  // Skimming the sea refills the tank
  await page.evaluate(() => { window.__heli.setInput(0, -1, false); window.__heli.step(2.5); window.__heli.setInput(0, 0, false); });
  s = await st(page);
  check(s.tank > tank0 - 1 + 0.5 || s.tank >= 7.9, `flying low over the sea refills the tank (${s.tank.toFixed(1)})`);

  // A hit costs a heart; three hits → friendly "try again", never a dead end
  await page.evaluate(() => { const h = window.__heli; h.hurt(); h.step(2); h.hurt(); h.step(2); h.hurt(); h.step(0.2); });
  s = await st(page);
  check(s.mode === "end" && s.hearts === 0, "three hits end the attempt");
  check(!!(await page.$("#scr-end:not([hidden]) #btn-again")), "a 'try again' button is offered (no game over)");
  await page.tap("#btn-again");
  s = await st(page);
  check(s.mode === "play" && s.hearts === 3, "try again restarts the stage with full hearts");

  // Autopilot completes the stage → unlocks stage 2 and saves it
  await page.evaluate(() => window.__heli.bot(true));
  let guard = 0;
  do { s = await page.evaluate(() => { window.__heli.step(0.5); return window.__heli.state; }); } while (s.mode === "play" && guard++ < 300);
  check(s.mode === "end" && s.hearts > 0 && s.unlocked >= 2, `stage 1 can be finished start to finish (fires ${s.put}/${s.totals.f}, rescues ${s.saved}/${s.totals.r}, rings ${s.rings}/${s.totals.g})`);
  await tapBoxesOK(page, "stage clear");

  await page.reload();
  await page.waitForFunction(() => window.__heli);
  await page.waitForSelector("#scr-title .stage-btn");
  check(!(await page.$eval("[data-stage='1']", (b) => b.disabled)), "reload keeps stage 2 unlocked");

  await page.tap("#btn-lang");
  check((await page.evaluate(() => document.documentElement.dir)) === "ltr" && (await page.textContent("#t-title")) === "Sky Rescue", "language toggle switches to English");

  await page.waitForTimeout(1000);
  const swReady = await page.evaluate(async () => { if (!navigator.serviceWorker) return false; const r = await navigator.serviceWorker.ready; return !!r.active; });
  check(swReady, "service worker is active");
  await ctx.setOffline(true);
  await page.reload();
  await page.waitForFunction(() => window.__heli);
  check(true, "game (incl. three.js) loads while offline");
  await ctx.setOffline(false);
  check(errors.length === 0, `no console errors on mobile ${errors.length ? JSON.stringify(errors.slice(0, 3)) : ""}`);
  await ctx.close();

  console.log("Blocked storage:");
  const ctxB = await browser.newContext({ ...devices["iPhone 13"] });
  await ctxB.addInitScript(() => { Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } }); });
  const pb = await ctxB.newPage();
  const berr = [];
  pb.on("pageerror", (e) => berr.push(e.message));
  await pb.goto(BASE);
  await pb.waitForFunction(() => window.__heli);
  await pb.tap("[data-stage='0']");
  check((await st(pb)).mode === "play", "game is playable when storage is blocked");
  check(berr.length === 0, `no page errors with blocked storage ${berr.join(" ")}`);
  await ctxB.close();

  console.log("Desktop (1280x720, keyboard, real-time loop):");
  const ctxD = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const pd = await ctxD.newPage();
  const derr = [];
  pd.on("pageerror", (e) => derr.push(e.message));
  await pd.goto(BASE);
  await pd.waitForFunction(() => window.__heli);
  await pd.click("[data-stage='0']");
  const dx0 = (await st(pd)).x;
  await pd.keyboard.down("ArrowLeft");
  await pd.waitForTimeout(700);
  await pd.keyboard.up("ArrowLeft");
  const ds = await st(pd);
  check(ds.x < dx0 - 1 && ds.dist > 5, `arrow keys steer in real time (x ${dx0.toFixed(1)} → ${ds.x.toFixed(1)}, flew ${ds.dist.toFixed(0)}m)`);
  await pd.keyboard.press("Escape");
  check(!!(await pd.$("#scr-pause:not([hidden])")), "Esc pauses");
  const fps = await pd.evaluate(() => window.__fps);
  console.log(`  (software-GL fps in this sandbox: ${fps.toFixed(1)} — real phones use the GPU)`);
  check(derr.length === 0, `no page errors on desktop ${derr.join(" ")}`);
  await ctxD.close();

  await browser.close();
  if (failures.length) { console.log(`\nFAIL (${failures.length})`); process.exit(1); }
  console.log("\nPASS: Playwright gauntlet");
})().catch((e) => { console.error(e); process.exit(1); });
