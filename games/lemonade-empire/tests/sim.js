#!/usr/bin/env node
/* Economy gauntlet for Lemonade Empire — see games/PLAN.md.
 * Time-stepped (1 simulated second per step) over 60 minutes of play.
 * 1,000 playthroughs (500 random, 500 "sensible kid") + 100 distracted kids.
 * Exits non-zero on any failure. */
"use strict";
const L = require("../logic.js");

function rngFrom(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clone = (s) => JSON.parse(JSON.stringify(s));
const failures = [];
function fail(msg) { if (failures.length < 25) failures.push(msg); }
const MAX_SECONDS = 60 * 60;
const BIG = 1;

function checkState(s, tag) {
  if (!Number.isFinite(s.money) || s.money < -1e-9) fail(`${tag}: bad money ${s.money}`);
  for (const c of L.CITIES) {
    const st = s.stands[c.id];
    if (st.queue < 0 || st.queue > L.CFG.queueMax) fail(`${tag}: bad queue ${st.queue}`);
    if (st.open && (st.price < L.minPrice(s) || st.price > L.maxPrice(s))) fail(`${tag}: price ${st.price} out of range at ${c.id}`);
    if (st.open && L.profitPerCup(s, c.id) < 1) fail(`${tag}: a cup can be sold at a loss at ${c.id}`);
  }
  // No dead end: customers always keep arriving at the stand you're viewing.
  if (!(L.arrivalRate(s, s.view) > 0)) fail(`${tag}: no customers can ever arrive`);
}

// Gain from a candidate purchase, in coins/sec of automatic income.
function gainOf(s, a) {
  const c = clone(s);
  const before = L.totalAutoPerMin(c);
  L.apply(c, a);
  return (L.totalAutoPerMin(c) - before) / 60;
}
function costOf(s, a) {
  if (a.type === "helper") return L.helperCost(s, a.city);
  if (a.type === "kiosk") return L.kioskCost(s, a.city);
  if (a.type === "open") return L.openCost(a.city);
  if (a.type === "upgrade") return L.upgradeCost(s, a.which);
  return 0;
}

function kidTurn(s, rng, mem) {
  // Set a sensible price at every open stand (kids get close, not perfect).
  for (const c of L.CITIES) {
    const st = s.stands[c.id];
    if (st.open && st.price !== mem.priceFor(s)) L.apply(s, { type: "price", city: c.id, price: mem.priceFor(s) });
  }
  // Every few seconds, consider the purchase with the fastest payback.
  if (s.time % 3 === 0) {
    const opts = L.actions(s).filter((a) => ["helper", "kiosk", "open", "upgrade"].includes(a.type));
    let best = null;
    for (const a of opts) {
      const cost = costOf(s, a);
      let g = gainOf(s, a);
      if (a.type === "upgrade" && a.which === "recipe") {
        // Recipe raises the fair price; re-price before valuing it.
        const c = clone(s); L.apply(c, a);
        for (const x of L.CITIES) if (c.stands[x.id].open) L.apply(c, { type: "price", city: x.id, price: L.bestPrice(c) });
        g = (L.totalAutoPerMin(c) - L.totalAutoPerMin(s)) / 60;
      }
      if (s.stands.telaviv.helpers === 0 && a.type === "helper") g = Math.max(g, 0.5);
      const payback = g > 0 ? cost / g : Infinity;
      if (!best || payback < best.payback) best = { a, payback };
    }
    if (best && best.payback < 600) return best.a;
    if (best && rng() < 0.15) return best.a;
  }
  return null;
}

function play(seed, kind) {
  const rng = rngFrom(seed);
  const s = L.newGame(rng);
  const noise = kind === "distracted" ? 0.3 : kind === "kid" ? 0.05 : 1;
  const offset = Math.floor(rng() * 3) - 1; // this kid's pricing habit
  const mem = { priceFor: (st) => Math.max(L.minPrice(st), L.bestPrice(st) + offset) };
  const reachedAt = [];
  let maxGainPerSec = 0, maxTheory = 0;
  const tapsPerSec = kind === "random" ? 1 : 2.5;
  let tapBudget = 0;
  for (let sec = 0; sec < MAX_SECONDS; sec++) {
    const before = s.money;
    // tapping (only while a customer is waiting)
    tapBudget += tapsPerSec;
    while (tapBudget >= 1) {
      tapBudget--;
      if (s.stands[s.view].queue > 0) L.apply(s, { type: "tap" });
    }
    // decisions
    let a = null;
    if (rng() < noise) {
      if (rng() < 0.2) {
        const acts = L.actions(s);
        a = acts[Math.floor(rng() * acts.length)];
        if (a.type === "tap") a = null;
      }
      if (rng() < 0.05) {
        const open = L.CITIES.filter((c) => s.stands[c.id].open);
        const c = open[Math.floor(rng() * open.length)];
        L.apply(s, { type: "price", city: c.id, price: L.minPrice(s) + Math.floor(rng() * (L.maxPrice(s) - L.minPrice(s) + 1)) });
      }
    } else a = kidTurn(s, rng, mem);
    let evs = a ? L.apply(s, a) : [];
    evs = evs.concat(L.tick(s, 1, rng));
    for (const e of evs) if (e.kind === "milestone") reachedAt[e.index] = sec + 1;
    const gain = s.money - before;
    // Theoretical max this second: every arriving customer served at full profit, plus taps.
    let theory = 0;
    for (const c of L.CITIES) if (s.stands[c.id].open) theory += L.arrivalRate(s, c.id) * L.profitPerCup(s, c.id);
    theory = theory + tapsPerSec * L.maxPrice(s) + L.CFG.queueMax * L.maxPrice(s) * L.CITIES.length;
    maxGainPerSec = Math.max(maxGainPerSec, gain);
    if (gain > theory + 1e-6) fail(`${kind}#${seed} t=${sec}: earned ${gain.toFixed(1)} > possible ${theory.toFixed(1)}`);
    if (sec % 11 === 0) checkState(s, `${kind}#${seed} t=${sec}`);
  }
  // Offline cap: a week away pays no more than 2 hours would.
  const c1 = clone(s), c2 = clone(s);
  const w = L.offline(c1, 7 * 24 * 3600).got, h = L.offline(c2, 2 * 3600).got;
  if (w !== h) fail(`${kind}#${seed}: offline earnings not capped (${w} vs ${h})`);
  checkState(s, `${kind}#${seed} end`);
  return { reachedAt, worth: L.netWorth(s), maxGainPerSec };
}

const median = (xs) => { const a = xs.slice().sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : NaN; };
const pct = (xs, p) => { const a = xs.slice().sort((x, y) => x - y); return a.length ? a[Math.floor(a.length * p)] : NaN; };
const fmtMin = (sec) => (sec / 60).toFixed(1) + " min";

const N = 500;
const rnd = [], kid = [], distracted = [];
for (let i = 0; i < N; i++) rnd.push(play(1000 + i, "random"));
for (let i = 0; i < N; i++) kid.push(play(5000 + i, "kid"));
for (let i = 0; i < 100; i++) distracted.push(play(9000 + i, "distracted"));

const firstTimes = kid.map((r) => r.reachedAt[0]).filter((x) => x != null);
const bigTimes = kid.map((r) => r.reachedAt[BIG]).filter((x) => x != null);
const thirdTimes = kid.map((r) => r.reachedAt[2]).filter((x) => x != null);
const winTimes = kid.map((r) => r.reachedAt[3]).filter((x) => x != null);
const medBig = median(bigTimes);
const distractedOk = distracted.filter((r) => r.reachedAt[0] != null).length;
const rndOk = rnd.filter((r) => r.reachedAt[0] != null).length;

console.log("Lemonade Empire economy sim — " + (2 * N) + " playthroughs (+100 distracted), 60 min each");
console.log(`  kid: first milestone (🪙500) median ${fmtMin(median(firstTimes))}  [reached ${firstTimes.length}/${N}]`);
console.log(`  kid: BIG milestone (🪙10,000) median ${fmtMin(medBig)}  p10 ${fmtMin(pct(bigTimes, 0.1))}  p90 ${fmtMin(pct(bigTimes, 0.9))}  [reached ${bigTimes.length}/${N}]`);
console.log(`  kid: 🪙100,000 median ${fmtMin(median(thirdTimes))} [${thirdTimes.length}/${N}]  win 🪙1,000,000 median ${fmtMin(median(winTimes))} [${winTimes.length}/${N}]`);
console.log(`  kid: fortune after 60 min median 🪙${Math.round(median(kid.map((r) => r.worth)))}  max 🪙${Math.round(Math.max(...kid.map((r) => r.worth)))}`);
console.log(`  random: reached 🪙500: ${rndOk}/${N}, fortune after 60 min median 🪙${Math.round(median(rnd.map((r) => r.worth)))}`);
console.log(`  distracted kid (30% random): reached 🪙500 in 60 min: ${distractedOk}/100`);

if (!(medBig >= 600 && medBig <= 1200)) fail(`pacing: median time to 🪙10,000 is ${fmtMin(medBig)}, want 10–20 min`);
if (bigTimes.length < N * 0.9) fail(`pacing: only ${bigTimes.length}/${N} sensible players reached 🪙10,000 in an hour`);
if (median(firstTimes) > 240) fail(`pacing: first milestone takes ${fmtMin(median(firstTimes))}, want < 4 min`);
if (distractedOk < 80) fail("forgiveness: fewer than 80% of distracted kids reach 🪙500 in an hour");
if (Math.max(...kid.map((r) => r.worth)) > 1e8) fail("runaway wealth in an hour");

if (failures.length) { console.log("\nFAIL"); failures.forEach((f) => console.log("  - " + f)); process.exit(1); }
console.log("\nPASS: no exploits, no dead ends, offline capped, pacing in range.");
