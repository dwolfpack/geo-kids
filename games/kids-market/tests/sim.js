#!/usr/bin/env node
/* Economy gauntlet for Kids Market — see games/PLAN.md.
 * 1,000 seeded playthroughs (500 random, 500 "sensible kid") + 100 distracted
 * kids through the real logic.js API. Exits non-zero on any failure. */
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
  if (!Number.isFinite(s.cash) || s.cash < -1e-9) fail(`${tag}: bad cash ${s.cash}`);
  for (const c of L.COMPANIES) {
    const st = s.co[c.id];
    if (!(st.price >= 1) || !Number.isFinite(st.price)) fail(`${tag}: bad price ${c.id}=${st.price}`);
    if (st.shares < 0 || !Number.isInteger(st.shares)) fail(`${tag}: bad shares ${c.id}`);
  }
  if (!L.actions(s).some((a) => a.type === "next")) fail(`${tag}: can't advance the day`);
}

// Churn probe: buying then selling right away (same price) must always lose money.
function probeChurn(s, rng, tag) {
  for (const c of L.COMPANIES) {
    const x = clone(s);
    const before = L.netWorth(x);
    L.apply(x, { type: "buy", co: c.id, qty: 999 }, rng);
    L.apply(x, { type: "sell", co: c.id, qty: 999 }, rng);
    if (L.netWorth(x) > before + 1e-9) fail(`${tag}: churn profit on ${c.id}`);
  }
}

function randomPlayer(s, rng) {
  const acts = L.actions(s);
  // Random kids press "next day" about a third of the time.
  if (rng() < 0.35) return { type: "next" };
  return acts[Math.floor(rng() * acts.length)];
}

// Sensible kid: spreads money over several companies, reacts to headlines,
// takes big profits sometimes, otherwise holds and presses "next day".
function heuristicPlayer(s, rng, mem) {
  if (rng() < (mem.noise != null ? mem.noise : 0.05)) return randomPlayer(s, rng);
  const n = s.news;
  if (mem.day !== s.day) { mem.day = s.day; mem.acted = 0; }
  if (mem.acted < 3) {
    mem.acted++;
    if (n && n.co) {
      const st = s.co[n.co];
      if (n.dir > 0 && L.maxBuy(s, n.co) > 0) {
        const q = Math.max(1, Math.floor(L.maxBuy(s, n.co) * 0.5));
        return { type: "buy", co: n.co, qty: q };
      }
      if (n.dir < 0 && st.shares > 0 && rng() < 0.6) return { type: "sell", co: n.co, qty: st.shares };
    }
    // Take profit on a big winner
    for (const c of L.COMPANIES) {
      const st = s.co[c.id];
      if (st.shares > 0 && st.price > st.paid * 1.35 && rng() < 0.5) return { type: "sell", co: c.id, qty: Math.ceil(st.shares / 2) };
    }
    // Keep money invested, spread across companies
    if (s.cash > 40) {
      const pick = L.COMPANIES.slice().sort((a, b) => s.co[a.id].shares * s.co[a.id].price - s.co[b.id].shares * s.co[b.id].price)[0];
      const q = Math.floor(L.maxBuy(s, pick.id) * 0.6);
      if (q > 0) return { type: "buy", co: pick.id, qty: q };
    }
  }
  return { type: "next" };
}

function play(seed, kind) {
  const rng = rngFrom(seed);
  const s = L.newGame(rng);
  const mem = { noise: kind === "distracted" ? 0.3 : undefined };
  let t = 0, steps = 0, maxDayGain = 0;
  const reachedAt = [];
  while (t < MAX_SECONDS && steps < 30000) {
    const a = kind === "random" ? randomPlayer(s, rng) : heuristicPlayer(s, rng, mem);
    const before = L.netWorth(s);
    const { events } = L.apply(s, a, rng);
    steps++;
    t += L.TIME[a.type] + (a.type === "next" ? L.TIME.read : 0);
    if (a.type !== "next" && L.netWorth(s) > before + 1e-9) fail(`${kind}#${seed}: a trade increased net worth`);
    if (a.type === "next") maxDayGain = Math.max(maxDayGain, (L.netWorth(s) - before) / Math.max(1, before));
    for (const e of events) if (e.kind === "milestone") reachedAt[e.index] = t;
    if (steps % 9 === 0) checkState(s, `${kind}#${seed} step ${steps}`);
    if (steps % 101 === 0) probeChurn(s, rng, `${kind}#${seed} step ${steps}`);
  }
  checkState(s, `${kind}#${seed} end`);
  return { reachedAt, worth: L.netWorth(s), days: s.day, badges: Object.keys(s.badges).length, maxDayGain };
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
const winTimes = kid.map((r) => r.reachedAt[3]).filter((x) => x != null);
const medBig = median(bigTimes);
const distractedOk = distracted.filter((r) => r.reachedAt[0] != null).length;

console.log("Kids Market economy sim — " + (2 * N) + " playthroughs (+100 distracted)");
console.log(`  kid: first milestone (🪙500) median ${fmtMin(median(firstTimes))}  [reached ${firstTimes.length}/${N}]`);
console.log(`  kid: BIG milestone (🪙1,500) median ${fmtMin(medBig)}  p10 ${fmtMin(pct(bigTimes, 0.1))}  p90 ${fmtMin(pct(bigTimes, 0.9))}  [reached ${bigTimes.length}/${N}]`);
console.log(`  kid: win (🪙8,000) median ${fmtMin(median(winTimes))}  [reached ${winTimes.length}/${N} within 60 min]`);
console.log(`  kid: fortune after 60 min median 🪙${Math.round(median(kid.map((r) => r.worth)))}, p10 🪙${Math.round(pct(kid.map((r) => r.worth), 0.1))}, days median ${median(kid.map((r) => r.days))}, badges median ${median(kid.map((r) => r.badges))}`);
console.log(`  random: fortune after 60 min median 🪙${Math.round(median(rnd.map((r) => r.worth)))}`);
console.log(`  distracted kid (30% random): reached 🪙500 in 60 min: ${distractedOk}/100`);
console.log(`  biggest one-day jump in fortune: ${(100 * Math.max(...kid.map((r) => r.maxDayGain))).toFixed(0)}%`);

if (!(medBig >= 600 && medBig <= 1200)) fail(`pacing: median time to 🪙1,500 is ${fmtMin(medBig)}, want 10–20 min`);
if (bigTimes.length < N * 0.85) fail(`pacing: only ${bigTimes.length}/${N} sensible players reached 🪙1,500 in an hour`);
if (median(firstTimes) > 240) fail(`pacing: first milestone takes ${fmtMin(median(firstTimes))}, want < 4 min`);
if (distractedOk < 80) fail("forgiveness: fewer than 80% of distracted kids reach 🪙500 in an hour");
if (pct(kid.map((r) => r.worth), 0.1) < L.CFG.startCash) fail("too punishing: 10% of sensible kids end below their starting money");

if (failures.length) { console.log("\nFAIL"); failures.forEach((f) => console.log("  - " + f)); process.exit(1); }
console.log("\nPASS: no churn profit, no dead ends, pacing in range.");
