#!/usr/bin/env node
/* Economy gauntlet for Island Shop — see games/PLAN.md.
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
const failures = [];
function fail(msg) { if (failures.length < 25) failures.push(msg); }
const MAX_SECONDS = 60 * 60;
const BIG = 1;

function timeFor(a) { return (L.TIME[a.type] || 2) + (a.type === "open" ? L.TIME.evening : 0); }

function checkState(s, tag) {
  if (!Number.isFinite(s.money) || s.money < 0) fail(`${tag}: bad money ${s.money}`);
  if (L.typesOnShelf(s) > L.shelves(s)) fail(`${tag}: more item types than shelves`);
  for (const g of L.GOODS) {
    const st = s.stock[g.id];
    if (st.qty < 0 || st.qty > L.storage(s) || !Number.isInteger(st.qty)) fail(`${tag}: bad stock ${g.id}=${st.qty}`);
    // Every tag price is above anything a ship ever charges (no loss-making sale is forced).
    if (L.tagPrice(g.id, "cheap") <= L.maxWholesale(g.id)) fail(`${tag}: cheap tag for ${g.id} not above max wholesale`);
  }
  for (const id of Object.keys(s.ship.offer)) {
    if (s.ship.offer[id].price > L.maxWholesale(id)) fail(`${tag}: ship price too high for ${id}`);
  }
  if (s.rep < L.CFG.repMin - 1e-9 || s.rep > L.CFG.repMax + 1e-9) fail(`${tag}: reputation out of range`);
  const acts = L.actions(s);
  if (!acts.some((a) => a.type === "open")) fail(`${tag}: can't open the shop`);
}

function randomPlayer(s, rng) {
  const acts = L.actions(s);
  return acts[Math.floor(rng() * acts.length)];
}

function heuristicPlayer(s, rng, mem) {
  if (rng() < (mem.noise != null ? mem.noise : 0.06)) return randomPlayer(s, rng);
  if (!s.cleaned && rng() < 0.8) return { type: "cleanup" };
  // Adjust tags from yesterday's reactions.
  for (const g of L.GOODS) {
    const st = s.stock[g.id];
    const r = mem.react[g.id];
    if (st.qty > 0 && r && (r.bought + r.pricey) >= 3 && !mem.tagged[g.id]) {
      mem.tagged[g.id] = true;
      const order = ["cheap", "fair", "pricey"];
      const i = order.indexOf(st.tag);
      if (r.pricey / (r.bought + r.pricey) > 0.45 && i > 0) { r.bought = r.pricey = 0; return { type: "tag", good: g.id, tag: order[i - 1] }; }
      if (r.pricey === 0 && r.bought >= 4 && i < 2) { r.bought = r.pricey = 0; return { type: "tag", good: g.id, tag: order[i + 1] }; }
    }
  }
  // Upgrades when comfortable
  const prio = ["shelves", "storage", "sign", "fridge", "size"];
  for (const id of prio) {
    if (!L.upgradeMaxed(s, id) && s.money >= L.upgradeCost(s, id) * 2.2 + 40) return { type: "upgrade", which: id };
  }
  // Stock up: best value goods first, keep a small reserve for rent.
  const offers = Object.keys(s.ship.offer)
    .map((id) => ({ id, o: s.ship.offer[id], g: L.GOOD_BY_ID[id] }))
    .filter((x) => x.o.price <= x.g.base * 1.05 && L.maxBuy(s, x.id) > 0)
    .sort((a, b) => b.g.base - a.g.base);
  for (const x of offers) {
    const reserve = L.rent(s) + 5;
    let n = Math.min(L.maxBuy(s, x.id), Math.floor((s.money - reserve) / x.o.price));
    if (x.g.fresh && !s.up.fridge) n = Math.min(n, Math.max(0, Math.ceil(L.customersPerDay(s) * 0.5) - s.stock[x.id].qty));
    if (n > 0 && !mem.bought[x.id]) { mem.bought[x.id] = true; return { type: "buy", good: x.id, qty: n }; }
  }
  return { type: "open" };
}

function play(seed, kind) {
  const rng = rngFrom(seed);
  const s = L.newGame(rng);
  const mem = { react: {}, tagged: {}, bought: {}, noise: kind === "distracted" ? 0.3 : undefined };
  let t = 0, steps = 0, maxDayGain = 0, brokeTime = 0;
  const reachedAt = [];
  while (t < MAX_SECONDS && steps < 20000) {
    const a = kind === "random" ? randomPlayer(s, rng) : heuristicPlayer(s, rng, mem);
    const before = s.money;
    const { events } = L.apply(s, a, rng);
    steps++;
    const dt = timeFor(a);
    t += dt;
    if (s.money < 10 && L.stockValue(s) === 0) brokeTime += dt;
    if (a.type === "open") {
      mem.tagged = {}; mem.bought = {};
      for (const e of events) if (e.kind === "customer" && e.result !== "soldOut") {
        const r = mem.react[e.want] || (mem.react[e.want] = { bought: 0, pricey: 0 });
        if (e.result === "bought") r.bought++; else r.pricey++;
      }
      // A day can never earn more than every visitor paying the priciest tag for two items.
      const ev = events.find((e) => e.kind === "evening");
      const cap = ev.visitors * 2 * Math.max(...L.GOODS.map((g) => L.tagPrice(g.id, "pricey")));
      if (ev.earned > cap) fail(`${kind}#${seed}: day earned ${ev.earned} > cap ${cap}`);
      maxDayGain = Math.max(maxDayGain, s.money - before);
    }
    for (const e of events) if (e.kind === "milestone") reachedAt[e.index] = t;
    if (steps % 5 === 0) checkState(s, `${kind}#${seed} step ${steps}`);
  }
  checkState(s, `${kind}#${seed} end`);
  return { reachedAt, worth: L.netWorth(s), days: s.day, broke: brokeTime / t, rep: s.rep };
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

console.log("Island Shop economy sim — " + (2 * N) + " playthroughs (+100 distracted)");
console.log(`  kid: first milestone (🪙400) median ${fmtMin(median(firstTimes))}  [reached ${firstTimes.length}/${N}]`);
console.log(`  kid: BIG milestone (🪙2,000) median ${fmtMin(medBig)}  p10 ${fmtMin(pct(bigTimes, 0.1))}  p90 ${fmtMin(pct(bigTimes, 0.9))}  [reached ${bigTimes.length}/${N}]`);
console.log(`  kid: win (🪙10,000) median ${fmtMin(median(winTimes))}  [reached ${winTimes.length}/${N} within 60 min]`);
console.log(`  kid: fortune after 60 min median 🪙${median(kid.map((r) => r.worth))}, days played median ${median(kid.map((r) => r.days))}, reputation median ${median(kid.map((r) => r.rep)).toFixed(2)}`);
console.log(`  random: fortune after 60 min median 🪙${median(rnd.map((r) => r.worth))}`);
console.log(`  distracted kid (30% random): reached 🪙400 in 60 min: ${distractedOk}/100`);
console.log(`  kid: share of time broke median ${(100 * median(kid.map((r) => r.broke))).toFixed(1)}%  p90 ${(100 * pct(kid.map((r) => r.broke), 0.9)).toFixed(1)}%`);

if (!(medBig >= 600 && medBig <= 1200)) fail(`pacing: median time to 🪙2,000 is ${fmtMin(medBig)}, want 10–20 min`);
if (bigTimes.length < N * 0.9) fail(`pacing: only ${bigTimes.length}/${N} sensible players reached 🪙2,000 in an hour`);
if (median(firstTimes) > 240) fail(`pacing: first milestone takes ${fmtMin(median(firstTimes))}, want < 4 min`);
if (distractedOk < 80) fail("forgiveness: fewer than 80% of distracted kids reach 🪙400 in an hour");
if (pct(kid.map((r) => r.broke), 0.9) > 0.15) fail("poverty trap: 10% of sensible kids spend >15% of their time broke");

if (failures.length) { console.log("\nFAIL"); failures.forEach((f) => console.log("  - " + f)); process.exit(1); }
console.log("\nPASS: no exploits, no dead ends, pacing in range.");
