#!/usr/bin/env node
/* Economy gauntlet for Pirate Trader — see games/PLAN.md.
 * 1,000 seeded playthroughs (500 random, 500 "sensible kid" heuristic)
 * driven through the real logic.js API. Exits non-zero on any failure. */
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

const MAX_SECONDS = 60 * 60; // simulate up to an hour of play
const BIG = 1; // index of the "first big milestone" (🪙2,000)

function timeFor(a, events) {
  let t = L.TIME[a.type] || 2;
  if (events.some((e) => ["storm", "pirates", "treasure", "dolphins", "tailwind"].includes(e.kind))) t += L.TIME.event;
  if (events.some((e) => e.kind === "arrived")) t += L.TIME.portThink;
  return t;
}

/* ---------- invariants checked on every visited state ---------- */
function checkState(s, tag) {
  if (!(s.money >= 0) || !Number.isFinite(s.money)) fail(`${tag}: bad money ${s.money}`);
  if (L.cargoCount(s) > L.capacity(s)) fail(`${tag}: cargo over capacity`);
  for (const g of L.GOODS) {
    if (s.cargo[g.id] < 0 || !Number.isInteger(s.cargo[g.id])) fail(`${tag}: bad cargo ${g.id}`);
    // No same-place arbitrage.
    const b = L.buyPrice(s, s.port, g.id), sp = L.sellPrice(s, s.port, g.id);
    if (!(sp < b)) fail(`${tag}: sell ${sp} >= buy ${b} for ${g.id} at ${s.port}`);
  }
  // No dead ends: there is always an action that eventually earns money.
  const acts = L.actions(s);
  if (!acts.length) fail(`${tag}: no legal actions`);
  if (!acts.some((a) => a.type === "fish" || a.type === "pirates")) fail(`${tag}: no always-available income action`);
}

// Round-trip probe: buy max then immediately sell everything back at the
// same port must never make money (prices move against you).
function probeRoundTrip(s, rng, tag) {
  if (s.pending) return;
  for (const g of L.GOODS) {
    const c = clone(s);
    const before = c.money;
    L.apply(c, { type: "buy", good: g.id, qty: 999 }, rng);
    L.apply(c, { type: "sell", good: g.id, qty: 999 }, rng);
    // Selling pre-existing cargo too would add money unrelated to the probe,
    // so compare against the value of what was already held.
    const held = s.cargo[g.id];
    if (held === 0 && c.money > before) fail(`${tag}: round-trip profit on ${g.id} (${before} -> ${c.money})`);
  }
}

/* ---------- players ---------- */
function randomPlayer(s, rng) {
  const acts = L.actions(s);
  return acts[Math.floor(rng() * acts.length)];
}

// A sensible kid: sells what's worth selling, buys the best cheap good for the
// best reachable destination, upgrades the hold when rich, sometimes goofs off.
function heuristicPlayer(s, rng, mem) {
  if (s.pending) {
    const p = s.pending;
    const fight = L.fightChance(s), flee = L.fleeChance(s);
    if (fight > 0.6) return { type: "pirates", choice: "fight" };
    if (flee > 0.5) return { type: "pirates", choice: "flee" };
    return { type: "pirates", choice: rng() < 0.5 ? "pay" : "fight" };
  }
  if (s.quiz && !s.quiz.done) {
    const right = L.PORT_BY_ID[s.quiz.port].code;
    const ans = rng() < 0.75 ? right : s.quiz.options[Math.floor(rng() * 3)];
    return { type: "quiz", answer: ans };
  }
  if (rng() < (mem.noise != null ? mem.noise : 0.08)) { // sometimes do something random, like a real kid
    return randomPlayer(s, rng);
  }
  // 1. after a voyage, sell cargo at a profit (or anything, if it's the plan port)
  if (mem.boughtAt !== s.port) {
    for (const g of L.GOODS) {
      if (s.cargo[g.id] > 0) {
        const sp = L.sellPrice(s, s.port, g.id);
        if (sp >= s.paid[g.id] || s.port === mem.plan) return { type: "sell", good: g.id, qty: s.cargo[g.id] };
      }
    }
  }
  // 2. upgrades when comfortably rich
  const want = [];
  if (s.up.hold < 8) want.push("hold");
  if (s.up.charts < 1 && s.up.hold >= 2) want.push("charts");
  if (s.up.sails < 3 && s.up.hold >= 2) want.push("sails");
  if (s.up.cannons < 3 && s.up.hold >= 3) want.push("cannons");
  if (s.up.hull < 2 && s.up.hold >= 3) want.push("hull");
  for (const id of want) {
    const c = L.upgradeCost(s, id);
    if (!L.upgradeMaxed(s, id) && s.money >= c * 2.2 && L.cargoCount(s) === 0) return { type: "upgrade", which: id };
  }
  // 3. plan: best (good, destination) using prices currently visible
  if (L.cargoCount(s) === 0) {
    let best = null;
    for (const g of L.GOODS) {
      const n = L.maxBuy(s, g.id);
      if (n <= 0) continue;
      const buy = L.buyPrice(s, s.port, g.id);
      for (const p of L.PORTS) {
        if (p.id === s.port || !L.portOpen(s, p.id)) continue;
        const cost = L.voyageCost(s, p.id);
        if (cost + buy > s.money) continue;
        const sell = L.sellPrice(s, p.id, g.id);
        const units = Math.min(n, Math.floor((s.money - cost) / buy));
        // Assume ~half the price impact on both ends.
        const est = units * (sell * (1 - 0.01 * units) - buy * (1 + 0.01 * units)) - cost;
        const perDay = est / (L.voyageDays(s, s.port, p.id) + 1);
        if (!best || perDay > best.perDay) best = { g: g.id, to: p.id, perDay, units };
      }
    }
    if (best && best.perDay > 0) { mem.plan = best.to; mem.boughtAt = s.port; return { type: "buy", good: best.g, qty: best.units }; }
    // Nothing profitable from here: sail somewhere cheap-ish or fish.
    const opts = L.actions(s).filter((a) => a.type === "sail");
    if (opts.length && rng() < 0.7) return opts[Math.floor(rng() * opts.length)];
    return { type: "fish" };
  }
  // 4. have cargo: sail to the plan (or wherever this cargo is wanted)
  if (mem.plan && mem.plan !== s.port && L.canAffordVoyage(s, mem.plan)) return { type: "sail", to: mem.plan };
  const sails = L.actions(s).filter((a) => a.type === "sail");
  if (sails.length) return sails[Math.floor(rng() * sails.length)];
  return { type: "fish" };
}

/* ---------- run ---------- */
function play(seed, kind) {
  const rng = rngFrom(seed);
  const s = L.newGame(rng);
  const mem = kind === "distracted" ? { noise: 0.3 } : {};
  let t = 0, steps = 0;
  const reachedAt = [];
  let maxGainPerAction = 0;
  while (t < MAX_SECONDS && steps < 20000) {
    const a = kind === "random" ? randomPlayer(s, rng) : heuristicPlayer(s, rng, mem);
    const before = s.money;
    const { events } = L.apply(s, a, rng);
    steps++;
    t += timeFor(a, events);
    maxGainPerAction = Math.max(maxGainPerAction, s.money - before);
    for (const e of events) if (e.kind === "milestone") reachedAt[e.index] = t;
    if (steps % 7 === 0) checkState(s, `${kind}#${seed} step ${steps}`);
    if (steps % 97 === 0) probeRoundTrip(s, rng, `${kind}#${seed} step ${steps}`);
  }
  checkState(s, `${kind}#${seed} end`);
  return { reachedAt, worth: L.netWorth(s), money: s.money, maxGainPerAction, won: s.won, steps };
}

function median(xs) { const a = xs.slice().sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : NaN; }
function pct(xs, p) { const a = xs.slice().sort((x, y) => x - y); return a.length ? a[Math.floor(a.length * p)] : NaN; }
const fmtMin = (sec) => (sec / 60).toFixed(1) + " min";

const N = 500;
const results = { random: [], kid: [] };
for (let i = 0; i < N; i++) results.random.push(play(1000 + i, "random"));
for (let i = 0; i < N; i++) results.kid.push(play(5000 + i, "kid"));
// Extra (not part of the 1,000): distracted kids (30% random taps) who tap randomly half the time.
const distracted = [];
for (let i = 0; i < 100; i++) distracted.push(play(9000 + i, "distracted"));

const kid = results.kid, rnd = results.random;
const bigTimes = kid.map((r) => r.reachedAt[BIG]).filter((x) => x != null);
const firstTimes = kid.map((r) => r.reachedAt[0]).filter((x) => x != null);
const winTimes = kid.map((r) => r.reachedAt[3]).filter((x) => x != null);
const medBig = median(bigTimes);
const maxGain = Math.max(...kid.concat(rnd).map((r) => r.maxGainPerAction));

console.log("Pirate Trader economy sim — " + (2 * N) + " playthroughs");
console.log(`  kid: first milestone (🪙500) median ${fmtMin(median(firstTimes))}  [reached ${firstTimes.length}/${N}]`);
console.log(`  kid: BIG milestone (🪙2,000) median ${fmtMin(medBig)}  p10 ${fmtMin(pct(bigTimes, 0.1))}  p90 ${fmtMin(pct(bigTimes, 0.9))}  [reached ${bigTimes.length}/${N}]`);
console.log(`  kid: win (🪙10,000) median ${fmtMin(median(winTimes))}  [reached ${winTimes.length}/${N} within 60 min]`);
console.log(`  kid: fortune after 60 min median 🪙${median(kid.map((r) => r.worth))}  max 🪙${Math.max(...kid.map((r) => r.worth))}`);
console.log(`  random: fortune after 60 min median 🪙${median(rnd.map((r) => r.worth))}  reached 🪙500: ${rnd.filter((r) => r.reachedAt[0] != null).length}/${N}`);
console.log(`  distracted kid (30% random taps): reached 🪙500 in 60 min: ${distracted.filter((r) => r.reachedAt[0] != null).length}/100`);
console.log(`  largest single-action money gain: 🪙${maxGain}`);

// Pacing & sanity gates
if (!(medBig >= 600 && medBig <= 1200)) fail(`pacing: median time to 🪙2,000 is ${fmtMin(medBig)}, want 10–20 min`);
if (bigTimes.length < N * 0.9) fail(`pacing: only ${bigTimes.length}/${N} sensible players reached 🪙2,000 in an hour`);
if (median(firstTimes) > 240) fail(`pacing: first milestone takes ${fmtMin(median(firstTimes))}, want a quick win (< 4 min)`);
if (distracted.filter((r) => r.reachedAt[0] != null).length < 80) fail("forgiveness: fewer than 80% of distracted kids (30% random taps) reach 🪙500 in an hour");
if (rnd.some((r) => !(r.worth >= 0))) fail("a random player ended with invalid fortune");
if (Math.max(...kid.map((r) => r.worth)) > 200000) fail("runaway wealth: someone passed 🪙200,000 in an hour");
if (maxGain > 20000) fail(`a single action gained 🪙${maxGain}`);

if (failures.length) {
  console.log("\nFAIL");
  failures.forEach((f) => console.log("  - " + f));
  process.exit(1);
}
console.log("\nPASS: no exploits, no dead ends, pacing in range.");
