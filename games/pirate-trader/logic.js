/* ============================================================================
 * Pirate Trader — pure game rules (no DOM).
 * ----------------------------------------------------------------------------
 * Used by ui.js in the browser (global `PirateLogic`) and by tests/sim.js in
 * Node (require). Every random roll takes an injected rng so sims are
 * deterministic. apply() mutates the state in place and returns events the
 * UI turns into animations/sounds.
 *
 * Economy (see games/RESEARCH.md §3):
 *   sources  selling cargo, treasure, pirate loot, fishing, quiz tips
 *   sinks    supplies per sea-day, upgrades (exponential), storms, pirate tolls
 *   no arbitrage: sell = 88% of buy at the same port, and every unit bought
 *   (sold) pushes that port's price up (down) — see pressure below.
 * ==========================================================================*/
(function (root) {
  "use strict";

  var GOODS = [
    { id: "sugar",  icon: "🍬", base: 16,  name: { he: "סוכר", en: "Sugar" } },
    { id: "coffee", icon: "☕", base: 22,  name: { he: "קפה", en: "Coffee" } },
    { id: "cocoa",  icon: "🍫", base: 28,  name: { he: "קקאו", en: "Cocoa" } },
    { id: "tea",    icon: "🍵", base: 34,  name: { he: "תה", en: "Tea" } },
    { id: "spices", icon: "🌶️", base: 44,  name: { he: "תבלינים", en: "Spices" } },
    { id: "silk",   icon: "🧵", base: 62,  name: { he: "משי", en: "Silk" } },
    { id: "gems",   icon: "💎", base: 110, name: { he: "אבני חן", en: "Gems" } }
  ];

  // region "west" is open from the start; "east" needs Navigator Charts.
  var PORTS = [
    { id: "london",    code: "gb", lat: 51.5,  lon: -0.1,  region: "west", makes: [],                  wants: ["tea", "spices"],
      name: { he: "לונדון", en: "London" } },
    { id: "amsterdam", code: "nl", lat: 52.4,  lon: 4.9,   region: "west", makes: ["gems"],            wants: ["spices", "coffee"],
      name: { he: "אמסטרדם", en: "Amsterdam" } },
    { id: "lisbon",    code: "pt", lat: 38.7,  lon: -9.1,  region: "west", makes: ["sugar"],           wants: ["cocoa", "silk"],
      name: { he: "ליסבון", en: "Lisbon" } },
    { id: "alexandria",code: "eg", lat: 31.2,  lon: 29.9,  region: "west", makes: ["spices"],          wants: ["sugar", "silk"],
      name: { he: "אלכסנדריה", en: "Alexandria" } },
    { id: "kingston",  code: "jm", lat: 18.0,  lon: -76.8, region: "west", makes: ["sugar", "coffee"], wants: ["tea", "spices"],
      name: { he: "קינגסטון", en: "Kingston" } },
    { id: "rio",       code: "br", lat: -22.9, lon: -43.2, region: "west", makes: ["coffee", "cocoa"], wants: ["silk", "tea"],
      name: { he: "ריו דה ז'נרו", en: "Rio de Janeiro" } },
    { id: "capetown",  code: "za", lat: -33.9, lon: 18.4,  region: "west", makes: ["gems"],            wants: ["coffee", "tea"],
      name: { he: "קייפטאון", en: "Cape Town" } },
    { id: "mumbai",    code: "in", lat: 19.1,  lon: 72.9,  region: "east", makes: ["tea", "spices"],   wants: ["gems", "cocoa"],
      name: { he: "מומבאי", en: "Mumbai" } },
    { id: "jakarta",   code: "id", lat: -6.2,  lon: 106.8, region: "east", makes: ["spices", "coffee"],wants: ["silk", "sugar"],
      name: { he: "ג'קרטה", en: "Jakarta" } },
    { id: "guangzhou", code: "cn", lat: 23.1,  lon: 113.3, region: "east", makes: ["tea", "silk"],     wants: ["gems", "sugar"],
      name: { he: "גואנגג'ואו", en: "Guangzhou" } },
    { id: "nagasaki",  code: "jp", lat: 32.7,  lon: 129.9, region: "east", makes: ["silk"],            wants: ["sugar", "coffee"],
      name: { he: "נגסאקי", en: "Nagasaki" } },
    { id: "sydney",    code: "au", lat: -33.9, lon: 151.2, region: "east", makes: ["gems"],            wants: ["tea", "cocoa"],
      name: { he: "סידני", en: "Sydney" } }
  ];

  var UPGRADES = {
    hold:    { icon: "📦", max: 8, cost: function (l) { return Math.round(160 * Math.pow(1.55, l)); } },
    sails:   { icon: "⛵", max: 5, cost: function (l) { return Math.round(220 * Math.pow(1.7, l)); } },
    cannons: { icon: "💥", max: 5, cost: function (l) { return Math.round(140 * Math.pow(1.6, l)); } },
    hull:    { icon: "🛡️", max: 4, cost: function (l) { return Math.round(160 * Math.pow(1.6, l)); } },
    charts:  { icon: "🗺️", max: 1, cost: function () { return 1200; } }
  };
  var UPGRADE_IDS = ["hold", "sails", "cannons", "hull", "charts"];

  var MILESTONES = [
    { at: 500,   icon: "⚓", name: { he: "קברניט", en: "Captain" } },
    { at: 2000,  icon: "🧭", name: { he: "קברניט סוחר", en: "Merchant Captain" } },
    { at: 5000,  icon: "🎖️", name: { he: "אדמירל", en: "Admiral" } },
    { at: 10000, icon: "👑", name: { he: "קברניט אגדי", en: "Legendary Captain" } }
  ];

  var CFG = {
    startMoney: 150,
    startPort: "lisbon",
    sellRatio: 0.88,      // sell price = 88% of buy price, same port & moment
    impact: 0.02,         // each unit traded moves that port's price by 2%
    pressureMin: -0.5,
    pressureMax: 0.8,
    pressureDecay: 0.35,  // pressure fades 35% per day
    makesFactor: 0.66,
    wantsFactor: 1.42,
    driftMin: 0.8,
    driftMax: 1.25,
    seaFactor: 1.3,       // ships can't sail in straight lines
    baseSpeed: 1800,      // km per day
    speedPerLevel: 550,
    supplyBase: 4,        // coins per sea-day
    supplyPerHold: 1,
    fishMin: 6,
    fishMax: 12,
    quizReward: 15
  };

  // Estimated real seconds a child spends per action (for pacing sims).
  var TIME = { buy: 2, sell: 2, sail: 6, event: 4, fish: 3, upgrade: 4, quiz: 4, pirates: 3, portThink: 5 };

  var GOOD_BY_ID = {}; GOODS.forEach(function (g) { GOOD_BY_ID[g.id] = g; });
  var PORT_BY_ID = {}; PORTS.forEach(function (p) { PORT_BY_ID[p.id] = p; });

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function randInt(rng, a, b) { return a + Math.floor(rng() * (b - a + 1)); }

  function distanceKm(a, b) {
    var R = 6371, toR = Math.PI / 180;
    var dLat = (b.lat - a.lat) * toR, dLon = (b.lon - a.lon) * toR;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  /* ---------------- state ---------------- */
  function newGame(rng) {
    var s = {
      v: 1,
      day: 1,
      money: CFG.startMoney,
      port: CFG.startPort,
      cargo: {},
      paid: {},          // average price paid per good (for "profit" hints)
      up: { hold: 0, sails: 0, cannons: 0, hull: 0, charts: 0 },
      shipValue: 0,
      market: {},
      pending: null,     // { type: "pirates", to, toll, loot }
      quiz: null,        // { port, options: [code], done: false }
      milestone: 0,
      won: false,
      visited: {},
      stats: { voyages: 0, trades: 0, fish: 0, earned: 0 }
    };
    PORTS.forEach(function (p) {
      s.market[p.id] = {};
      GOODS.forEach(function (g) {
        s.market[p.id][g.id] = { d: 0.9 + rng() * 0.2, p: 0 };
      });
    });
    s.visited[s.port] = true;
    GOODS.forEach(function (g) { s.cargo[g.id] = 0; s.paid[g.id] = 0; });
    return s;
  }

  function factor(port, goodId) {
    if (port.makes.indexOf(goodId) >= 0) return CFG.makesFactor;
    if (port.wants.indexOf(goodId) >= 0) return CFG.wantsFactor;
    return 1;
  }
  function tagFor(portId, goodId) {
    var port = PORT_BY_ID[portId];
    if (port.makes.indexOf(goodId) >= 0) return "cheap";
    if (port.wants.indexOf(goodId) >= 0) return "wanted";
    return "normal";
  }

  function buyPrice(s, portId, goodId) {
    var port = PORT_BY_ID[portId], g = GOOD_BY_ID[goodId], m = s.market[portId][goodId];
    return Math.max(1, Math.round(g.base * factor(port, goodId) * m.d * (1 + m.p)));
  }
  function sellPrice(s, portId, goodId) {
    // Floor + strict inequality keeps sell < buy even for 1-coin goods.
    var b = buyPrice(s, portId, goodId);
    return Math.max(0, Math.min(b - 1, Math.floor(b * CFG.sellRatio)));
  }

  function capacity(s) { return 20 + 10 * s.up.hold; }
  function cargoCount(s) {
    var n = 0; for (var k in s.cargo) n += s.cargo[k]; return n;
  }
  function speed(s) { return CFG.baseSpeed + CFG.speedPerLevel * s.up.sails; }
  function voyageDays(s, from, to) {
    var km = distanceKm(PORT_BY_ID[from], PORT_BY_ID[to]) * CFG.seaFactor;
    return Math.max(1, Math.ceil(km / speed(s)));
  }
  function dailySupplies(s) { return CFG.supplyBase + CFG.supplyPerHold * s.up.hold; }
  function voyageCost(s, to) { return voyageDays(s, s.port, to) * dailySupplies(s); }
  // If coins don't cover supplies, the crew accepts cargo as pay (valued at
  // this port's sell price). Keeps "spent everything on cargo" from being a
  // dead end without letting anyone sail for free.
  function cargoSellValueHere(s) {
    var v = 0;
    GOODS.forEach(function (g) { v += s.cargo[g.id] * sellPrice(s, s.port, g.id); });
    return v;
  }
  function canAffordVoyage(s, to) {
    return s.money + cargoSellValueHere(s) >= voyageCost(s, to);
  }
  function payWithCargo(s, owed) {
    var took = {};
    // cheapest goods first, so the crew leaves the valuable stuff
    var order = GOODS.slice().sort(function (a, b) { return sellPrice(s, s.port, a.id) - sellPrice(s, s.port, b.id); });
    for (var i = 0; i < order.length && owed > 0; i++) {
      var g = order[i];
      var price = Math.max(1, sellPrice(s, s.port, g.id));
      while (owed > 0 && s.cargo[g.id] > 0) {
        s.cargo[g.id]--; owed -= price;
        took[g.id] = (took[g.id] || 0) + 1;
      }
      if (s.cargo[g.id] === 0) s.paid[g.id] = 0;
    }
    // Any change the crew owes back is kept by them (at most one unit's worth).
    return Object.keys(took).length ? took : null;
  }
  function portOpen(s, portId) { return PORT_BY_ID[portId].region === "west" || s.up.charts > 0; }
  function upgradeCost(s, id) { return UPGRADES[id].cost(s.up[id]); }
  function upgradeMaxed(s, id) { return s.up[id] >= UPGRADES[id].max; }

  function cargoValue(s) {
    var v = 0;
    GOODS.forEach(function (g) { v += s.cargo[g.id] * Math.round(g.base * 0.8); });
    return v;
  }
  // "Fortune" — what milestones are measured on. Upgrades count at the price
  // paid so buying one never makes the progress bar drop.
  function netWorth(s) { return s.money + cargoValue(s) + s.shipValue; }

  function stormLossFraction(s) { return 0.3 * (1 - 0.22 * s.up.hull); }
  function fleeChance(s) { return clamp(0.35 + 0.1 * s.up.sails, 0, 0.9); }
  function fightChance(s) { return clamp(0.3 + 0.12 * s.up.cannons, 0, 0.9); }

  /* ---------------- world tick ---------------- */
  function tickDay(s, rng) {
    s.day++;
    PORTS.forEach(function (p) {
      GOODS.forEach(function (g) {
        var m = s.market[p.id][g.id];
        m.d = clamp(m.d + (1 - m.d) * 0.25 + (rng() - 0.5) * 0.16, CFG.driftMin, CFG.driftMax);
        m.p = m.p * (1 - CFG.pressureDecay);
        if (Math.abs(m.p) < 0.005) m.p = 0;
      });
    });
  }

  /* ---------------- legal actions ---------------- */
  function maxBuy(s, goodId) {
    // Price rises as you buy, so walk it unit by unit.
    var room = capacity(s) - cargoCount(s);
    var money = s.money, n = 0;
    var m = s.market[s.port][goodId], saveP = m.p;
    while (n < room) {
      var price = buyPrice(s, s.port, goodId);
      if (price > money) break;
      money -= price; n++;
      m.p = Math.min(CFG.pressureMax, m.p + CFG.impact);
    }
    m.p = saveP;
    return n;
  }

  function actions(s) {
    var list = [];
    if (s.pending && s.pending.type === "pirates") {
      ["flee", "fight", "pay"].forEach(function (c) { list.push({ type: "pirates", choice: c }); });
      return list;
    }
    GOODS.forEach(function (g) {
      var mb = maxBuy(s, g.id);
      if (mb > 0) { list.push({ type: "buy", good: g.id, qty: 1 }); if (mb > 1) list.push({ type: "buy", good: g.id, qty: mb }); }
      var have = s.cargo[g.id];
      if (have > 0) { list.push({ type: "sell", good: g.id, qty: 1 }); if (have > 1) list.push({ type: "sell", good: g.id, qty: have }); }
    });
    PORTS.forEach(function (p) {
      if (p.id !== s.port && portOpen(s, p.id) && canAffordVoyage(s, p.id)) list.push({ type: "sail", to: p.id });
    });
    UPGRADE_IDS.forEach(function (id) {
      if (!upgradeMaxed(s, id) && upgradeCost(s, id) <= s.money) list.push({ type: "upgrade", which: id });
    });
    if (s.quiz && !s.quiz.done) s.quiz.options.forEach(function (c) { list.push({ type: "quiz", answer: c }); });
    list.push({ type: "fish" }); // always available: no dead ends
    return list;
  }

  /* ---------------- apply ---------------- */
  function apply(s, a, rng) {
    var ev = [];
    if (s.pending && a.type !== "pirates") return { state: s, events: [{ kind: "blocked" }] };
    switch (a.type) {
      case "buy": {
        var n = 0, spent = 0, m = s.market[s.port][a.good];
        while (n < a.qty && cargoCount(s) < capacity(s)) {
          var price = buyPrice(s, s.port, a.good);
          if (price > s.money) break;
          s.money -= price; spent += price; n++;
          s.cargo[a.good]++;
          m.p = Math.min(CFG.pressureMax, m.p + CFG.impact);
        }
        if (n > 0) {
          var had = s.cargo[a.good] - n;
          s.paid[a.good] = Math.round((s.paid[a.good] * had + spent) / (had + n));
          s.stats.trades++;
          ev.push({ kind: "bought", good: a.good, qty: n, spent: spent });
        } else {
          ev.push({ kind: "cantBuy", good: a.good, reason: cargoCount(s) >= capacity(s) ? "full" : "money" });
        }
        break;
      }
      case "sell": {
        var k = 0, got = 0, mm = s.market[s.port][a.good];
        while (k < a.qty && s.cargo[a.good] > 0) {
          var sp = sellPrice(s, s.port, a.good);
          s.money += sp; got += sp; k++;
          s.cargo[a.good]--;
          mm.p = Math.max(CFG.pressureMin, mm.p - CFG.impact);
        }
        if (k > 0) {
          var profit = got - s.paid[a.good] * k;
          if (s.cargo[a.good] === 0) s.paid[a.good] = 0;
          s.stats.trades++; s.stats.earned += got;
          ev.push({ kind: "sold", good: a.good, qty: k, got: got, profit: profit });
        }
        break;
      }
      case "fish": {
        var catchCoins = randInt(rng, CFG.fishMin, CFG.fishMax);
        s.money += catchCoins;
        s.stats.fish++;
        tickDay(s, rng);
        ev.push({ kind: "fished", got: catchCoins });
        break;
      }
      case "upgrade": {
        var c = upgradeCost(s, a.which);
        if (upgradeMaxed(s, a.which) || c > s.money) { ev.push({ kind: "cantUpgrade" }); break; }
        s.money -= c; s.shipValue += c; s.up[a.which]++;
        ev.push({ kind: "upgraded", which: a.which, level: s.up[a.which], cost: c });
        break;
      }
      case "quiz": {
        if (!s.quiz || s.quiz.done) break;
        s.quiz.done = true;
        var right = a.answer === PORT_BY_ID[s.quiz.port].code;
        if (right) s.money += CFG.quizReward;
        ev.push({ kind: "quiz", right: right, reward: right ? CFG.quizReward : 0, answer: PORT_BY_ID[s.quiz.port].code });
        break;
      }
      case "sail": {
        if (a.to === s.port || !portOpen(s, a.to)) { ev.push({ kind: "cantSail" }); break; }
        var days = voyageDays(s, s.port, a.to), cost = days * dailySupplies(s);
        if (!canAffordVoyage(s, a.to)) { ev.push({ kind: "cantSail", reason: "money" }); break; }
        var paidCoins = Math.min(s.money, cost);
        s.money -= paidCoins;
        var crewTook = payWithCargo(s, cost - paidCoins);
        for (var d = 0; d < days; d++) tickDay(s, rng);
        s.stats.voyages++;
        ev.push({ kind: "sailed", from: s.port, to: a.to, days: days, cost: cost, crewTook: crewTook });
        rollVoyageEvent(s, a.to, days, rng, ev);
        if (!s.pending) arrive(s, a.to, rng, ev);
        break;
      }
      case "pirates": {
        var pend = s.pending;
        if (!pend) break;
        s.pending = null;
        if (a.choice === "flee") {
          if (rng() < fleeChance(s)) ev.push({ kind: "fled" });
          else { var t1 = Math.min(s.money, pend.toll); s.money -= t1; ev.push({ kind: "caught", lost: t1 }); }
        } else if (a.choice === "fight") {
          if (rng() < fightChance(s)) { s.money += pend.loot; ev.push({ kind: "fightWon", got: pend.loot }); }
          else { var t2 = Math.min(s.money, Math.round(pend.toll * 1.5)); s.money -= t2; ev.push({ kind: "fightLost", lost: t2 }); }
        } else {
          var t3 = Math.min(s.money, pend.toll); s.money -= t3; ev.push({ kind: "paid", lost: t3 });
        }
        arrive(s, pend.to, rng, ev);
        break;
      }
    }
    checkMilestones(s, ev);
    return { state: s, events: ev };
  }

  function rollVoyageEvent(s, to, days, rng, ev) {
    var chance = Math.min(0.55, 0.18 + 0.04 * days);
    if (rng() >= chance) return;
    var r = rng() * 100;
    if (r < 30) {
      // Storm: lose part of the biggest cargo stack. Never the ship.
      var best = null;
      GOODS.forEach(function (g) { if (s.cargo[g.id] > 0 && (!best || s.cargo[g.id] > s.cargo[best])) best = g.id; });
      if (!best) { ev.push({ kind: "storm", good: null, lost: 0 }); return; }
      var lost = Math.max(1, Math.floor(s.cargo[best] * stormLossFraction(s)));
      if (s.up.hull >= 4) lost = 0;
      s.cargo[best] -= lost;
      if (s.cargo[best] === 0) s.paid[best] = 0;
      ev.push({ kind: "storm", good: best, lost: lost });
    } else if (r < 58) {
      var worth = netWorth(s);
      var toll = clamp(Math.round(s.money * 0.12), 5, 400);
      var loot = clamp(Math.round(40 + worth * 0.05), 40, 500);
      s.pending = { type: "pirates", to: to, toll: toll, loot: loot };
      ev.push({ kind: "pirates", toll: toll, loot: loot, flee: fleeChance(s), fight: fightChance(s) });
    } else if (r < 76) {
      var gold = randInt(rng, 20, 50) + 8 * days;
      s.money += gold;
      ev.push({ kind: "treasure", got: gold });
    } else if (r < 90) {
      ev.push({ kind: "dolphins", port: to });
    } else {
      var refund = dailySupplies(s);
      s.money += refund;
      ev.push({ kind: "tailwind", got: refund });
    }
  }

  function arrive(s, to, rng, ev) {
    s.port = to;
    var first = !s.visited[to];
    s.visited[to] = true;
    // Harbour master quiz: which country is this port in?
    var code = PORT_BY_ID[to].code;
    var others = PORTS.filter(function (p) { return p.code !== code; }).map(function (p) { return p.code; });
    var opts = [code];
    while (opts.length < 3) {
      var c = others[Math.floor(rng() * others.length)];
      if (opts.indexOf(c) < 0) opts.push(c);
    }
    // shuffle
    for (var i = opts.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = opts[i]; opts[i] = opts[j]; opts[j] = t; }
    s.quiz = { port: to, options: opts, done: false };
    ev.push({ kind: "arrived", port: to, first: first });
  }

  function checkMilestones(s, ev) {
    var w = netWorth(s);
    while (s.milestone < MILESTONES.length && w >= MILESTONES[s.milestone].at) {
      var m = MILESTONES[s.milestone];
      s.milestone++;
      if (s.milestone === MILESTONES.length) s.won = true;
      ev.push({ kind: "milestone", index: s.milestone - 1, at: m.at, final: s.milestone === MILESTONES.length });
    }
  }

  var api = {
    GOODS: GOODS, PORTS: PORTS, UPGRADES: UPGRADES, UPGRADE_IDS: UPGRADE_IDS, MILESTONES: MILESTONES,
    CFG: CFG, TIME: TIME, GOOD_BY_ID: GOOD_BY_ID, PORT_BY_ID: PORT_BY_ID,
    newGame: newGame, actions: actions, apply: apply, netWorth: netWorth,
    buyPrice: buyPrice, sellPrice: sellPrice, tagFor: tagFor, maxBuy: maxBuy,
    capacity: capacity, cargoCount: cargoCount, voyageDays: voyageDays, voyageCost: voyageCost,
    dailySupplies: dailySupplies, portOpen: portOpen, upgradeCost: upgradeCost, upgradeMaxed: upgradeMaxed, canAffordVoyage: canAffordVoyage,
    fleeChance: fleeChance, fightChance: fightChance, stormLossFraction: stormLossFraction,
    distanceKm: distanceKm, cargoValue: cargoValue
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PirateLogic = api;
})(this);
