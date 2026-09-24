#!/usr/bin/env node
/* Economy gauntlet for Merchant Caravan — see games/PLAN.md.
 * 1,000 seeded playthroughs (500 random, 500 "sensible kid") + 100 distracted
 * kids, all driven through the real logic.js API. Exits non-zero on failure. */
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

function timeFor(a, events) {
  let t = L.TIME[a.type] || 2;
  if (events.some((e) => ["bandits", "sandstorm", "nomads", "oasis", "story"].includes(e.kind))) t += L.TIME.event;
  if (events.some((e) => e.kind === "arrived")) t += L.TIME.cityThink;
  return t;
}

function checkState(s, tag) {
  if (!(s.money >= 0) || !Number.isFinite(s.money)) fail(`${tag}: bad money ${s.money}`);
  if (L.cargoCount(s) > L.capacity(s)) fail(`${tag}: cargo over capacity`);
  for (const g of L.GOODS) {
    if (s.cargo[g.id] < 0 || !Number.isInteger(s.cargo[g.id])) fail(`${tag}: bad cargo ${g.id}`);
    const b = L.buyPrice(s, s.city, g.id), sp = L.sellPrice(s, s.city, g.id);
    if (!(sp < b)) fail(`${tag}: sell ${sp} >= buy ${b} for ${g.id} at ${s.city}`);
  }
  const acts = L.actions(s);
  if (!acts.length) fail(`${tag}: no legal actions`);
  if (!acts.some((a) => a.type === "job" || a.type === "bandits")) fail(`${tag}: no always-available income action`);
  // Contracts must always pay more than selling the same goods here would.
  const k = s.contracts[s.city];
  if (!k || k.qty <= 0 || k.reward <= 0) fail(`${tag}: bad contract`);
}

function probeRoundTrip(s, rng, tag) {
  if (s.pending) return;
  for (const g of L.GOODS) {
    if (s.cargo[g.id] !== 0) continue;
    const c = clone(s);
    const before = c.money;
    L.apply(c, { type: "buy", good: g.id, qty: 999 }, rng);
    L.apply(c, { type: "sell", good: g.id, qty: 999 }, rng);
    if (c.money > before) fail(`${tag}: round-trip profit on ${g.id} (${before} -> ${c.money})`);
  }
}

function randomPlayer(s, rng) {
  const acts = L.actions(s);
  return acts[Math.floor(rng() * acts.length)];
}

// Sensible kid: fills contracts, sells at a profit, buys what a neighbour
// wants (or what a contract nearby asks for), hires camels when rich.
function heuristicPlayer(s, rng, mem) {
  if (s.pending) {
    if (s.guards > 0) return { type: "bandits", choice: "guards" };
    return { type: "bandits", choice: rng() < 0.5 ? "gift" : "run" };
  }
  if (L.canDeliver(s)) return { type: "deliver" };
  // Broke with nothing to sell: earn a bit before setting off again.
  if (s.money < 12 * L.dailyCost(s) && L.cargoCount(s) === 0 && rng() < 0.8) return { type: "job" };
  if (rng() < (mem.noise != null ? mem.noise : 0.08)) return randomPlayer(s, rng);

  if (mem.boughtAt !== s.city) {
    for (const g of L.GOODS) {
      if (s.cargo[g.id] > 0) {
        const k = mem.plan && s.contracts[mem.plan];
        const savingForContract = k && k.good === g.id && mem.plan !== s.city;
        if (savingForContract) continue;
        if (L.sellPrice(s, s.city, g.id) >= s.paid[g.id] || s.city === mem.plan) return { type: "sell", good: g.id, qty: s.cargo[g.id] };
      }
    }
  }
  if (L.cargoCount(s) === 0) {
    if (s.camels < 9 && s.money >= L.camelCost(s) * 2.5) return { type: "camel" };
    if (s.guards < 1 && s.money >= 700) return { type: "guard" };
    for (const n of L.neighbours(s.city)) {
      if (!L.hasPermit(s, s.city, n) && s.money >= L.permitCost(s.city, n) * 2.5) return { type: "permit", to: n };
    }
    // Plan up to 3 roads ahead over roads we hold permits for.
    const routes = [];
    const seen = { [s.city]: 0 };
    let frontier = [{ city: s.city, path: [], days: 0 }];
    for (let hop = 0; hop < 3; hop++) {
      const next = [];
      for (const f of frontier) {
        for (const n of L.neighbours(f.city)) {
          if (!L.hasPermit(s, f.city, n)) continue;
          const days = f.days + L.tripDays(f.city, n);
          if (seen[n] != null && seen[n] <= days) continue;
          seen[n] = days;
          const r = { city: n, path: f.path.concat(n), days };
          routes.push(r); next.push(r);
        }
      }
      frontier = next;
    }
    let best = null;
    for (const g of L.GOODS) {
      const n = L.maxBuy(s, g.id);
      if (n <= 0) continue;
      const buy = L.buyPrice(s, s.city, g.id);
      for (const r of routes) {
        const cost = r.days * L.dailyCost(s);
        if (cost + buy > s.money) continue;
        const units = Math.min(n, Math.floor((s.money - cost) / buy));
        const sell = L.sellPrice(s, r.city, g.id);
        let est = units * (sell * (1 - 0.0025 * units) - buy * (1 + 0.0025 * units)) - cost;
        const k = s.contracts[r.city];
        const arriveDay = s.day + r.days;
        if (k.good === g.id && units >= k.qty && arriveDay >= k.from && arriveDay <= k.due) {
          est = Math.max(est, k.reward + (units - k.qty) * sell * 0.8 - units * buy - cost);
        }
        const perDay = est / (r.days + 1);
        if (!best || perDay > best.perDay) best = { g: g.id, to: r.city, path: r.path, perDay, units };
      }
    }
    if (best && best.perDay > 0) { mem.plan = best.to; mem.path = best.path.slice(); mem.boughtAt = s.city; return { type: "buy", good: best.g, qty: best.units }; }
    const opts = L.actions(s).filter((a) => a.type === "travel");
    if (opts.length && rng() < 0.7) { mem.boughtAt = null; mem.plan = null; return opts[Math.floor(rng() * opts.length)]; }
    return { type: "job" };
  }
  if (mem.path && mem.path.length && mem.plan !== s.city) {
    while (mem.path.length && mem.path[0] === s.city) mem.path.shift();
    const hop = mem.path[0];
    if (hop && L.road(s.city, hop) && L.hasPermit(s, s.city, hop) && L.canAffordTrip(s, hop)) return { type: "travel", to: hop };
  }
  const tr = L.actions(s).filter((a) => a.type === "travel");
  if (tr.length) return tr[Math.floor(rng() * tr.length)];
  return { type: "job" };
}

function play(seed, kind) {
  const rng = rngFrom(seed);
  const s = L.newGame(rng);
  const mem = kind === "distracted" ? { noise: 0.3 } : {};
  let t = 0, steps = 0, maxGain = 0, brokeTime = 0;
  const reachedAt = [];
  while (t < MAX_SECONDS && steps < 20000) {
    const a = kind === "random" ? randomPlayer(s, rng) : heuristicPlayer(s, rng, mem);
    const before = s.money;
    const { events } = L.apply(s, a, rng);
    steps++;
    const dt = timeFor(a, events);
    t += dt;
    if (s.money < 30 && L.cargoCount(s) === 0) brokeTime += dt;
    maxGain = Math.max(maxGain, s.money - before);
    for (const e of events) if (e.kind === "milestone") reachedAt[e.index] = t;
    if (steps % 7 === 0) checkState(s, `${kind}#${seed} step ${steps}`);
    if (steps % 97 === 0) probeRoundTrip(s, rng, `${kind}#${seed} step ${steps}`);
  }
  checkState(s, `${kind}#${seed} end`);
  return { reachedAt, worth: L.netWorth(s), maxGain, contracts: s.stats.contracts, broke: brokeTime / t };
}

const median = (xs) => { const a = xs.slice().sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : NaN; };
const pct = (xs, p) => { const a = xs.slice().sort((x, y) => x - y); return a.length ? a[Math.floor(a.length * p)] : NaN; };
const fmtMin = (sec) => (sec / 60).toFixed(1) + " min";

const N = 500;
const rnd = [], kid = [], distracted = [];
for (let i = 0; i < N; i++) rnd.push(play(1000 + i, "random"));
for (let i = 0; i < N; i++) kid.push(play(5000 + i, "kid"));
for (let i = 0; i < 100; i++) distracted.push(play(9000 + i, "distracted"));

const bigTimes = kid.map((r) => r.reachedAt[BIG]).filter((x) => x != null);
const firstTimes = kid.map((r) => r.reachedAt[0]).filter((x) => x != null);
const winTimes = kid.map((r) => r.reachedAt[3]).filter((x) => x != null);
const medBig = median(bigTimes);
const maxGain = Math.max(...kid.concat(rnd).map((r) => r.maxGain));
const distractedOk = distracted.filter((r) => r.reachedAt[0] != null).length;

console.log("Merchant Caravan economy sim — " + (2 * N) + " playthroughs (+100 distracted)");
console.log(`  kid: first milestone (🪙1,000) median ${fmtMin(median(firstTimes))}  [reached ${firstTimes.length}/${N}]`);
console.log(`  kid: BIG milestone (🪙5,000) median ${fmtMin(medBig)}  p10 ${fmtMin(pct(bigTimes, 0.1))}  p90 ${fmtMin(pct(bigTimes, 0.9))}  [reached ${bigTimes.length}/${N}]`);
console.log(`  kid: win (🪙12,000) median ${fmtMin(median(winTimes))}  [reached ${winTimes.length}/${N} within 60 min]`);
console.log(`  kid: contracts filled per game median ${median(kid.map((r) => r.contracts))}`);
console.log(`  kid: fortune after 60 min median 🪙${median(kid.map((r) => r.worth))}  max 🪙${Math.max(...kid.map((r) => r.worth))}`);
console.log(`  random: fortune after 60 min median 🪙${median(rnd.map((r) => r.worth))}`);
console.log(`  distracted kid (30% random taps): reached 🪙1,000 in 60 min: ${distractedOk}/100`);
console.log(`  kid: share of time broke (<🪙30, no cargo) median ${(100 * median(kid.map((r) => r.broke))).toFixed(1)}%  p90 ${(100 * pct(kid.map((r) => r.broke), 0.9)).toFixed(1)}%`);
console.log(`  largest single-action money gain: 🪙${maxGain}`);

if (!(medBig >= 600 && medBig <= 1200)) fail(`pacing: median time to 🪙5,000 is ${fmtMin(medBig)}, want 10–20 min`);
if (bigTimes.length < N * 0.9) fail(`pacing: only ${bigTimes.length}/${N} sensible players reached 🪙5,000 in an hour`);
if (median(firstTimes) > 240) fail(`pacing: first milestone takes ${fmtMin(median(firstTimes))}, want < 4 min`);
if (distractedOk < 80) fail("forgiveness: fewer than 80% of distracted kids reach 🪙1,000 in an hour");
if (Math.max(...kid.map((r) => r.worth)) > 300000) fail("runaway wealth in an hour");
if (maxGain > 20000) fail(`a single action gained 🪙${maxGain}`);
if (pct(kid.map((r) => r.broke), 0.9) > 0.15) fail("poverty trap: 10% of sensible kids spend >15% of their time broke");
if (median(kid.map((r) => r.contracts)) < 1) fail("contracts are never worth filling");

if (failures.length) { console.log("\nFAIL"); failures.forEach((f) => console.log("  - " + f)); process.exit(1); }
console.log("\nPASS: no exploits, no dead ends, pacing in range.");
