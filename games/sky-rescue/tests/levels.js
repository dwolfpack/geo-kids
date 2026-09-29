#!/usr/bin/env node
/* Level validation for Sky Rescue: every fire can be put out and every person can be rescued,
 * on all 7 levels, by flying straight at it (fire: dropping water on approach; rescue: flying low over it).
 * Needs a static server at repo root:  python3 -m http.server 8080
 * Run:  NODE_PATH=$(npm root -g) node games/sky-rescue/tests/levels.js */
"use strict";
const { chromium } = require("playwright");
const BASE = process.env.BASE_URL || "http://localhost:8080/games/sky-rescue/";
(async () => {
  const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
  const p = await (await b.newContext({ viewport: { width: 480, height: 270 } })).newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(BASE); await p.waitForFunction(() => window.__heli);
  let failed = 0;
  for (let n = 0; n < 7; n++) {
    const r = await p.evaluate((n) => {
      const h = window.__heli; h.manual(true); h.start(n);
      const nf = h.firesList.length, nr = h.raftsList.length, fires = [], rafts = [];
      for (let i = 0; i < nf; i++) { h.start(n); h.bot(false); const f = h.firesList[i]; h.place(f.x, 9, f.z + 90); h.setInput(0, 0, true); h.step(3); h.setInput(0, 0, false); if (!h.firesList[i].out) fires.push(f); }
      for (let i = 0; i < nr; i++) { h.start(n); h.bot(false); const f = h.raftsList[i]; h.place(f.x, 3.2, f.z + 50); h.step(2.5); if (!h.raftsList[i].saved) rafts.push(f); }
      return { nf, nr, fires, rafts };
    }, n);
    const ok = !r.fires.length && !r.rafts.length;
    if (!ok) failed++;
    console.log(`  ${ok ? "✓" : "✗"} level ${n + 1}: ${r.nf - r.fires.length}/${r.nf} fires, ${r.nr - r.rafts.length}/${r.nr} rescues reachable ${ok ? "" : JSON.stringify(r)}`);
  }
  if (errors.length) { failed++; console.log("  ✗ page errors: " + errors.slice(0, 3).join(" | ")); }
  await b.close();
  if (failed) { console.log(`\nFAIL (${failed})`); process.exit(1); }
  console.log("\nPASS: every fire and rescue on all 7 levels is reachable");
})().catch((e) => { console.error(e); process.exit(1); });
