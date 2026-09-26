#!/usr/bin/env node
/* Capture harness for the Gauntlet Loop critics (see ref/REFERENCE.md).
 * Produces real pixels from the running game:
 *   shots/still-16x9-s{n}.png     1280x720 gameplay frame per stage
 *   shots/still-phone-s1.png      390x844 portrait phone frame
 *   shots/strip-bank.png          6-frame filmstrip: hard left bank, release, recover
 *   shots/strip-hit.png           6-frame filmstrip: collision feedback
 *   shots/strip-bomb.png          6-frame filmstrip: water bomb on a fire
 * Needs:  python3 -m http.server 8080  (repo root)
 * Run:    NODE_PATH=$(npm root -g) node games/sky-rescue/tests/capture.js */
"use strict";
const path = require("path");
const fs = require("fs");
const { chromium, devices } = require("playwright");
const BASE = process.env.BASE_URL || "http://localhost:8080/games/sky-rescue/";
const OUT = path.join(__dirname, "shots");
fs.mkdirSync(OUT, { recursive: true });

async function open(browser, opts) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(BASE);
  await page.waitForFunction(() => window.__heli);
  return { ctx, page, errors };
}
const png = async (page) => (await page.screenshot({ type: "png" })).toString("base64");

// Stitch base64 frames into one strip using the browser's canvas (no image libs needed).
async function stitch(page, frames, labels, file) {
  const data = await page.evaluate(async ({ frames, labels }) => {
    const imgs = await Promise.all(frames.map((b) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = "data:image/png;base64," + b; })));
    const w = 480, h = Math.round(w * imgs[0].height / imgs[0].width), cols = 3, rows = Math.ceil(imgs.length / cols);
    const c = document.createElement("canvas"); c.width = w * cols; c.height = (h + 26) * rows;
    const g = c.getContext("2d"); g.fillStyle = "#111"; g.fillRect(0, 0, c.width, c.height);
    imgs.forEach((im, i) => {
      const x = (i % cols) * w, y = Math.floor(i / cols) * (h + 26);
      g.drawImage(im, x, y + 26, w, h);
      g.fillStyle = "#fff"; g.font = "bold 16px sans-serif"; g.fillText(labels[i], x + 8, y + 19);
    });
    return c.toDataURL("image/png").split(",")[1];
  }, { frames, labels });
  fs.writeFileSync(path.join(OUT, file), Buffer.from(data, "base64"));
}

(async () => {
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
  const { ctx, page, errors } = await open(browser, { viewport: { width: 1280, height: 720 } });
  await page.evaluate(() => { const h = window.__heli; h.manual(true); });

  // Stills: one per stage, mid-flight with a fire and a ring ahead (bot flying).
  for (let n = 0; n < 3; n++) {
    await page.evaluate((n) => { const h = window.__heli; h.start(n); h.bot(true); h.step(7.5); }, n);
    await page.waitForTimeout(80);
    fs.writeFileSync(path.join(OUT, `still-16x9-s${n + 1}.png`), await page.screenshot({ type: "png" }));
  }

  // Bank strip: steer hard left 0.8s, then release.
  await page.evaluate(() => { const h = window.__heli; h.start(0); h.bot(false); h.step(3); });
  const bank = [], bankL = [];
  const seq = [[-1, 0.0, "t=0 level"], [-1, 0.25, "left 0.25s"], [-1, 0.5, "left 0.5s"], [0, 0.3, "released 0.3s"], [0, 0.3, "released 0.6s"], [0, 0.4, "released 1.0s"]];
  for (const [x, dt, label] of seq) {
    const bk = await page.evaluate(([x, dt]) => { const h = window.__heli; h.setInput(x, 0, false); if (dt) h.step(dt); else h.step(1 / 60); return h.state.bank; }, [x, dt]);
    bank.push(await png(page)); bankL.push(`${label}  bank ${(bk * 57.3).toFixed(0)}°`);
  }
  await page.evaluate(() => window.__heli.setInput(0, 0, false));
  await stitch(page, bank, bankL, "strip-bank.png");

  // Hit strip
  // Fly straight at the first sea stack of stage 2 and film the real collision.
  const target = await page.evaluate(() => { const h = window.__heli; h.start(1); h.bot(false); return h.stackAhead(); });
  await page.evaluate((t) => { const h = window.__heli; h.place(t.x, 6, t.z + 70); }, target);
  const hit = [], hitL = [];
  for (const [dt, l] of [[0.9, "stack ahead (-1.4s)"], [0.7, "about to hit"]]) {
    await page.evaluate((dt) => window.__heli.step(dt), dt);
    hit.push(await png(page)); hitL.push(l);
  }
  let hearts = 3, g = 0;
  while (hearts === 3 && g++ < 60) hearts = await page.evaluate(() => { window.__heli.step(1 / 30); return window.__heli.state.hearts; });
  hit.push(await png(page)); hitL.push(`impact (hearts ${hearts})`);
  if (hearts === 3) console.log("WARNING: collision did not register");
  for (const [dt, l] of [[0.1, "+0.1s"], [0.25, "+0.35s"], [0.5, "+0.85s"]]) {
    await page.evaluate((dt) => window.__heli.step(dt), dt);
    hit.push(await png(page)); hitL.push(l);
  }
  await stitch(page, hit, hitL, "strip-hit.png");

  // Full playthroughs: the autopilot flies every stage start to finish.
  for (let n = 0; n < 3; n++) {
    await page.evaluate((n) => { const h = window.__heli; h.start(n); h.bot(true); }, n);
    let res, guard = 0;
    do { res = await page.evaluate(() => { const h = window.__heli; h.step(0.5); return h.state; }); } while (res.mode === "play" && guard++ < 400);
    await page.waitForTimeout(150);
    fs.writeFileSync(path.join(OUT, `end-s${n + 1}.png`), await page.screenshot({ type: "png" }));
    console.log(`stage ${n + 1}: mode=${res.mode} fires ${res.put}/${res.totals.f} rescues ${res.saved}/${res.totals.r} rings ${res.rings}/${res.totals.g} hearts ${res.hearts} score ${res.score}`);
  }
  await page.evaluate(() => { document.getElementById("scr-end").hidden = true; });

  // Bomb strip: bot flies stage 1 until the first drop, capture around it.
  await page.evaluate(() => { const h = window.__heli; h.start(0); h.bot(true); });
  let put = 0, tries = 0;
  const bomb = [], bombL = [];
  while (tries++ < 400 && put === 0) {
    const s = await page.evaluate(() => { const h = window.__heli; h.step(0.1); return h.state; });
    if (s.tank < 8 && bomb.length === 0) { bomb.push(await png(page)); bombL.push("bomb dropped"); }
    else if (bomb.length > 0 && bomb.length < 5 && tries % 2 === 0) { bomb.push(await png(page)); bombL.push(`+${(bomb.length * 0.2).toFixed(1)}s`); }
    put = s.put;
  }
  bomb.push(await png(page)); bombL.push(put ? "fire out" : "no fire out yet");
  await stitch(page, bomb.slice(0, 6), bombL.slice(0, 6), "strip-bomb.png");
  await ctx.close();

  // Phone portrait
  const phone = await open(browser, { ...devices["iPhone 13"] });
  await phone.page.evaluate(() => { const h = window.__heli; h.manual(true); h.start(0); h.bot(true); h.step(7.5); });
  await phone.page.waitForTimeout(80);
  fs.writeFileSync(path.join(OUT, "still-phone-s1.png"), await phone.page.screenshot({ type: "png" }));
  await phone.page.evaluate(() => { const h = window.__heli; h.manual(false); h.start(0); h.bot(false); window.__heli.state; });
  await phone.page.evaluate(() => { document.querySelector("#scr-title").hidden = true; });
  await phone.ctx.close();

  const all = errors.concat(phone.errors);
  console.log(all.length ? "ERRORS: " + JSON.stringify(all) : "no page errors");
  console.log("wrote", fs.readdirSync(OUT).join(", "));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
