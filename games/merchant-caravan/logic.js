/* ============================================================================
 * Merchant Caravan — pure game rules (no DOM).
 * ----------------------------------------------------------------------------
 * Browser global `CaravanLogic`, Node require() for tests/sim.js. Every random
 * roll takes an injected rng; apply() mutates state and returns UI events.
 *
 * What makes it different from Pirate Trader:
 *   - Cities are linked by a ROAD GRAPH; you can only travel to neighbours,
 *     and some roads need a one-time permit.
 *   - CAMELS are both capacity (10 each) and upkeep (food per camel per day).
 *   - MARKET MEMORY is strong: each unit you sell pushes the price down 0.5%,
 *     and it recovers slowly (12%/day) — so you rotate goods and routes.
 *   - CONTRACTS: every city posts one delivery order that pays far more than
 *     the market if you bring the goods before the deadline.
 *   - GUARDS scare off bandits but cost wages each day on the road.
 *
 * Economy: sources = sales, contracts, bazaar odd jobs, nomad gifts;
 * sinks = food, wages, camels (x1.35 each), permits, bandits.
 * ==========================================================================*/
(function (root) {
  "use strict";

  var GOODS = [
    { id: "dates",     icon: "🌴", base: 14,  name: { he: "תמרים", en: "Dates" } },
    { id: "paper",     icon: "📜", base: 22,  name: { he: "נייר", en: "Paper" } },
    { id: "spices",    icon: "🌶️", base: 34,  name: { he: "תבלינים", en: "Spices" } },
    { id: "glass",     icon: "🔮", base: 40,  name: { he: "זכוכית", en: "Glass" } },
    { id: "carpets",   icon: "🧶", base: 52,  name: { he: "שטיחים", en: "Carpets" } },
    { id: "horses",    icon: "🐎", base: 66,  name: { he: "סוסים", en: "Horses" } },
    { id: "porcelain", icon: "🏺", base: 78,  name: { he: "חרסינה", en: "Porcelain" } },
    { id: "silk",      icon: "🧵", base: 90,  name: { he: "משי", en: "Silk" } }
  ];

  var CITIES = [
    { id: "xian",       code: "cn", lat: 34.3, lon: 108.9, makes: ["silk", "porcelain"], wants: ["horses", "glass"],
      name: { he: "שיאן", en: "Xi'an" } },
    { id: "kashgar",    code: "cn", lat: 39.5, lon: 76.0,  makes: ["horses"],            wants: ["spices", "carpets"],
      name: { he: "קשגר", en: "Kashgar" } },
    { id: "samarkand",  code: "uz", lat: 39.7, lon: 67.0,  makes: ["paper"],             wants: ["spices", "glass"],
      name: { he: "סמרקנד", en: "Samarkand" } },
    { id: "merv",       code: "tm", lat: 37.6, lon: 61.8,  makes: ["horses"],            wants: ["paper", "porcelain"],
      name: { he: "מרב", en: "Merv" } },
    { id: "delhi",      code: "in", lat: 28.6, lon: 77.2,  makes: ["spices"],            wants: ["horses", "carpets"],
      name: { he: "דלהי", en: "Delhi" } },
    { id: "isfahan",    code: "ir", lat: 32.7, lon: 51.7,  makes: ["carpets"],           wants: ["silk", "porcelain"],
      name: { he: "אספהאן", en: "Isfahan" } },
    { id: "baghdad",    code: "iq", lat: 33.3, lon: 44.4,  makes: ["dates"],             wants: ["spices", "paper"],
      name: { he: "בגדד", en: "Baghdad" } },
    { id: "damascus",   code: "sy", lat: 33.5, lon: 36.3,  makes: ["glass"],             wants: ["paper", "silk"],
      name: { he: "דמשק", en: "Damascus" } },
    { id: "istanbul",   code: "tr", lat: 41.0, lon: 29.0,  makes: [],                    wants: ["silk", "spices", "porcelain"],
      name: { he: "איסטנבול", en: "Istanbul" } },
    { id: "cairo",      code: "eg", lat: 30.0, lon: 31.2,  makes: ["dates"],             wants: ["spices", "porcelain"],
      name: { he: "קהיר", en: "Cairo" } },
    { id: "venice",     code: "it", lat: 45.4, lon: 12.3,  makes: ["glass"],             wants: ["silk", "spices", "carpets"],
      name: { he: "ונציה", en: "Venice" } }
  ];

  // Roads: [a, b, permitCost] — permit 0 means open from the start.
  var ROADS = [
    ["xian", "kashgar", 700],
    ["kashgar", "samarkand", 0],
    ["kashgar", "delhi", 400],
    ["samarkand", "merv", 0],
    ["samarkand", "delhi", 0],
    ["merv", "isfahan", 0],
    ["isfahan", "baghdad", 0],
    ["baghdad", "damascus", 0],
    ["baghdad", "istanbul", 0],
    ["damascus", "istanbul", 0],
    ["damascus", "cairo", 0],
    ["istanbul", "venice", 500],
    ["cairo", "venice", 500]
  ];

  var MILESTONES = [
    { at: 1000,  icon: "🐪", name: { he: "נהג גמלים", en: "Camel Driver" } },
    { at: 5000,  icon: "🏕️", name: { he: "מוביל שיירה", en: "Caravan Leader" } },
    { at: 8000,  icon: "🏰", name: { he: "סוחר גדול", en: "Grand Merchant" } },
    { at: 12000, icon: "👑", name: { he: "אדון דרך המשי", en: "Master of the Silk Road" } }
  ];

  var CFG = {
    startMoney: 150,
    startCity: "samarkand",
    startCamels: 2,
    perCamel: 10,
    maxCamels: 12,
    camelCost: 140,       // × 1.35^(camels bought so far)
    camelGrowth: 1.35,
    maxGuards: 3,
    guardHire: 60,        // one-time signing fee
    guardWage: 3,         // per guard per road-day
    food: 1,              // per camel per road-day
    sellRatio: 0.88,
    impact: 0.005,
    pressureMin: -0.5,
    pressureMax: 0.7,
    pressureRecover: 0.12, // market memory: 12%/day recovery
    makesFactor: 0.7,
    wantsFactor: 1.3,
    driftMin: 0.82,
    driftMax: 1.22,
    roadFactor: 1.25,
    kmPerDay: 600,
    jobMin: 8,
    jobMax: 14,
    jobPerCamel: 3,
    contractMult: 1.45,   // contract pays this × base per unit
    contractDays: [12, 22]
  };

  var TIME = { buy: 2, sell: 2, travel: 6, event: 4, job: 3, camel: 3, guard: 3, permit: 3, deliver: 3, bandits: 3, cityThink: 5 };

  var GOOD_BY_ID = {}; GOODS.forEach(function (g) { GOOD_BY_ID[g.id] = g; });
  var CITY_BY_ID = {}; CITIES.forEach(function (c) { CITY_BY_ID[c.id] = c; });

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function randInt(rng, a, b) { return a + Math.floor(rng() * (b - a + 1)); }
  function roadKey(a, b) { return a < b ? a + "|" + b : b + "|" + a; }
  function distanceKm(a, b) {
    var R = 6371, toR = Math.PI / 180;
    var dLat = (b.lat - a.lat) * toR, dLon = (b.lon - a.lon) * toR;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  var ROAD_BY_KEY = {};
  ROADS.forEach(function (r) {
    ROAD_BY_KEY[roadKey(r[0], r[1])] = { a: r[0], b: r[1], permit: r[2],
      days: Math.max(1, Math.round(distanceKm(CITY_BY_ID[r[0]], CITY_BY_ID[r[1]]) * CFG.roadFactor / CFG.kmPerDay)) };
  });
  function neighbours(cityId) {
    var out = [];
    ROADS.forEach(function (r) {
      if (r[0] === cityId) out.push(r[1]);
      else if (r[1] === cityId) out.push(r[0]);
    });
    return out;
  }
  function road(a, b) { return ROAD_BY_KEY[roadKey(a, b)] || null; }

  /* ---------------- state ---------------- */
  function newGame(rng) {
    var s = {
      v: 1, day: 1, money: CFG.startMoney, city: CFG.startCity,
      camels: CFG.startCamels, camelsBought: 0, guards: 0,
      cargo: {}, paid: {}, market: {}, permits: {}, contracts: {},
      pending: null, milestone: 0, won: false, visited: {}, invested: 0,
      stats: { trips: 0, trades: 0, jobs: 0, contracts: 0, earned: 0 }
    };
    GOODS.forEach(function (g) { s.cargo[g.id] = 0; s.paid[g.id] = 0; });
    CITIES.forEach(function (c) {
      s.market[c.id] = {};
      GOODS.forEach(function (g) { s.market[c.id][g.id] = { d: 0.92 + rng() * 0.16, p: 0 }; });
    });
    ROADS.forEach(function (r) { if (r[2] === 0) s.permits[roadKey(r[0], r[1])] = true; });
    CITIES.forEach(function (c) { newContract(s, c.id, rng); });
    s.visited[s.city] = true;
    return s;
  }

  // delay: days until the order is posted (after a delivery the merchant
  // needs a while before ordering again — stops contract farming).
  function newContract(s, cityId, rng, delay) {
    var c = CITY_BY_ID[cityId];
    var start = s.day + (delay || 0);
    // Ask for something this city wants, made somewhere else.
    var opts = c.wants.slice();
    var good = opts[Math.floor(rng() * opts.length)];
    var qty = 4 + Math.floor(rng() * 7); // 4..10
    var days = randInt(rng, CFG.contractDays[0], CFG.contractDays[1]);
    s.contracts[cityId] = { good: good, qty: qty, from: start, due: start + days,
      reward: Math.round(qty * GOOD_BY_ID[good].base * CFG.contractMult) };
  }

  function factor(city, goodId) {
    if (city.makes.indexOf(goodId) >= 0) return CFG.makesFactor;
    if (city.wants.indexOf(goodId) >= 0) return CFG.wantsFactor;
    return 1;
  }
  function tagFor(cityId, goodId) {
    var c = CITY_BY_ID[cityId];
    if (c.makes.indexOf(goodId) >= 0) return "cheap";
    if (c.wants.indexOf(goodId) >= 0) return "wanted";
    return "normal";
  }
  function buyPrice(s, cityId, goodId) {
    var m = s.market[cityId][goodId];
    return Math.max(2, Math.round(GOOD_BY_ID[goodId].base * factor(CITY_BY_ID[cityId], goodId) * m.d * (1 + m.p)));
  }
  function sellPrice(s, cityId, goodId) {
    var b = buyPrice(s, cityId, goodId);
    return Math.max(1, Math.min(b - 1, Math.floor(b * CFG.sellRatio)));
  }
  function capacity(s) { return s.camels * CFG.perCamel; }
  function cargoCount(s) { var n = 0; for (var k in s.cargo) n += s.cargo[k]; return n; }
  function dailyCost(s) { return s.camels * CFG.food + s.guards * CFG.guardWage; }
  function tripDays(from, to) { var r = road(from, to); return r ? r.days : 0; }
  function tripCost(s, to) { return tripDays(s.city, to) * dailyCost(s); }
  function hasPermit(s, a, b) { return !!s.permits[roadKey(a, b)]; }
  function permitCost(a, b) { var r = road(a, b); return r ? r.permit : 0; }
  // Bazaar job: carry other merchants' goods for a day. Pays more with more
  // camels so a big caravan can always climb back out of a bad streak.
  function jobPay(s, rng) { return randInt(rng, CFG.jobMin, CFG.jobMax) + CFG.jobPerCamel * s.camels; }
  function jobRange(s) { return [CFG.jobMin + CFG.jobPerCamel * s.camels, CFG.jobMax + CFG.jobPerCamel * s.camels]; }
  function camelCost(s) { return Math.round(CFG.camelCost * Math.pow(CFG.camelGrowth, s.camelsBought)); }
  function banditChance(s) { return clamp(0.3 - 0.09 * s.guards, 0.03, 1); }

  function cargoValue(s) {
    var v = 0; GOODS.forEach(function (g) { v += s.cargo[g.id] * Math.round(g.base * 0.8); }); return v;
  }
  // Camels, guards and permits count at the price paid so upgrading never
  // makes the progress bar drop.
  function netWorth(s) { return s.money + cargoValue(s) + s.invested; }

  function cargoSellValueHere(s) {
    var v = 0; GOODS.forEach(function (g) { v += s.cargo[g.id] * sellPrice(s, s.city, g.id); }); return v;
  }
  function canAffordTrip(s, to) { return s.money + cargoSellValueHere(s) >= tripCost(s, to); }

  function maxBuy(s, goodId) {
    var room = capacity(s) - cargoCount(s), money = s.money, n = 0;
    var m = s.market[s.city][goodId], save = m.p;
    while (n < room) {
      var price = buyPrice(s, s.city, goodId);
      if (price > money) break;
      money -= price; n++; m.p = Math.min(CFG.pressureMax, m.p + CFG.impact);
    }
    m.p = save;
    return n;
  }

  function tickDay(s, rng) {
    s.day++;
    CITIES.forEach(function (c) {
      GOODS.forEach(function (g) {
        var m = s.market[c.id][g.id];
        m.d = clamp(m.d + (1 - m.d) * 0.2 + (rng() - 0.5) * 0.14, CFG.driftMin, CFG.driftMax);
        m.p = m.p * (1 - CFG.pressureRecover);
        if (Math.abs(m.p) < 0.005) m.p = 0;
      });
      if (s.contracts[c.id].due < s.day) newContract(s, c.id, rng);
    });
  }

  /* ---------------- actions ---------------- */
  function contractOpen(s, cityId) {
    var k = s.contracts[cityId];
    return !!k && s.day >= k.from && s.day <= k.due;
  }
  function canDeliver(s) {
    var k = s.contracts[s.city];
    return !!k && s.day >= k.from && s.day <= k.due && s.cargo[k.good] >= k.qty;
  }

  function actions(s) {
    var list = [];
    if (s.pending) {
      ["guards", "gift", "run"].forEach(function (c) { list.push({ type: "bandits", choice: c }); });
      return list;
    }
    GOODS.forEach(function (g) {
      var mb = maxBuy(s, g.id);
      if (mb > 0) { list.push({ type: "buy", good: g.id, qty: 1 }); if (mb > 1) list.push({ type: "buy", good: g.id, qty: mb }); }
      if (s.cargo[g.id] > 0) { list.push({ type: "sell", good: g.id, qty: 1 }); if (s.cargo[g.id] > 1) list.push({ type: "sell", good: g.id, qty: s.cargo[g.id] }); }
    });
    neighbours(s.city).forEach(function (n) {
      if (!hasPermit(s, s.city, n)) { if (permitCost(s.city, n) <= s.money) list.push({ type: "permit", to: n }); }
      else if (canAffordTrip(s, n)) list.push({ type: "travel", to: n });
    });
    if (s.camels < CFG.maxCamels && camelCost(s) <= s.money) list.push({ type: "camel" });
    if (s.guards < CFG.maxGuards && CFG.guardHire <= s.money) list.push({ type: "guard" });
    if (canDeliver(s)) list.push({ type: "deliver" });
    list.push({ type: "job" }); // always available: no dead ends
    return list;
  }

  function payWithCargo(s, owed) {
    var took = {};
    var order = GOODS.slice().sort(function (a, b) { return sellPrice(s, s.city, a.id) - sellPrice(s, s.city, b.id); });
    for (var i = 0; i < order.length && owed > 0; i++) {
      var g = order[i], price = Math.max(1, sellPrice(s, s.city, g.id));
      while (owed > 0 && s.cargo[g.id] > 0) { s.cargo[g.id]--; owed -= price; took[g.id] = (took[g.id] || 0) + 1; }
      if (s.cargo[g.id] === 0) s.paid[g.id] = 0;
    }
    return Object.keys(took).length ? took : null;
  }

  function apply(s, a, rng) {
    var ev = [];
    if (s.pending && a.type !== "bandits") return { state: s, events: [{ kind: "blocked" }] };
    switch (a.type) {
      case "buy": {
        var n = 0, spent = 0, m = s.market[s.city][a.good];
        while (n < a.qty && cargoCount(s) < capacity(s)) {
          var price = buyPrice(s, s.city, a.good);
          if (price > s.money) break;
          s.money -= price; spent += price; n++; s.cargo[a.good]++;
          m.p = Math.min(CFG.pressureMax, m.p + CFG.impact);
        }
        if (n > 0) {
          var had = s.cargo[a.good] - n;
          s.paid[a.good] = Math.round((s.paid[a.good] * had + spent) / (had + n));
          s.stats.trades++;
          ev.push({ kind: "bought", good: a.good, qty: n, spent: spent });
        } else ev.push({ kind: "cantBuy", good: a.good, reason: cargoCount(s) >= capacity(s) ? "full" : "money" });
        break;
      }
      case "sell": {
        var k = 0, got = 0, mm = s.market[s.city][a.good];
        while (k < a.qty && s.cargo[a.good] > 0) {
          var sp = sellPrice(s, s.city, a.good);
          s.money += sp; got += sp; k++; s.cargo[a.good]--;
          mm.p = Math.max(CFG.pressureMin, mm.p - CFG.impact);
        }
        if (k > 0) {
          if (s.cargo[a.good] === 0) s.paid[a.good] = 0;
          s.stats.trades++; s.stats.earned += got;
          ev.push({ kind: "sold", good: a.good, qty: k, got: got });
        }
        break;
      }
      case "deliver": {
        if (!canDeliver(s)) { ev.push({ kind: "cantDeliver" }); break; }
        var ct = s.contracts[s.city];
        s.cargo[ct.good] -= ct.qty;
        if (s.cargo[ct.good] === 0) s.paid[ct.good] = 0;
        s.money += ct.reward;
        s.stats.contracts++; s.stats.earned += ct.reward;
        ev.push({ kind: "delivered", good: ct.good, qty: ct.qty, got: ct.reward });
        newContract(s, s.city, rng, randInt(rng, 5, 9));
        break;
      }
      case "job": {
        var pay = jobPay(s, rng);
        s.money += pay; s.stats.jobs++;
        tickDay(s, rng);
        ev.push({ kind: "job", got: pay });
        break;
      }
      case "camel": {
        var cc = camelCost(s);
        if (s.camels >= CFG.maxCamels || cc > s.money) { ev.push({ kind: "cantCamel" }); break; }
        s.money -= cc; s.invested += cc; s.camels++; s.camelsBought++;
        ev.push({ kind: "camel", cost: cc, camels: s.camels });
        break;
      }
      case "guard": {
        if (s.guards >= CFG.maxGuards || CFG.guardHire > s.money) { ev.push({ kind: "cantGuard" }); break; }
        s.money -= CFG.guardHire; s.invested += CFG.guardHire; s.guards++;
        ev.push({ kind: "guard", cost: CFG.guardHire, guards: s.guards });
        break;
      }
      case "permit": {
        var pc = permitCost(s.city, a.to);
        if (!road(s.city, a.to) || hasPermit(s, s.city, a.to) || pc > s.money) { ev.push({ kind: "cantPermit" }); break; }
        s.money -= pc; s.invested += pc; s.permits[roadKey(s.city, a.to)] = true;
        ev.push({ kind: "permit", to: a.to, cost: pc });
        break;
      }
      case "travel": {
        var r = road(s.city, a.to);
        if (!r || !hasPermit(s, s.city, a.to) || !canAffordTrip(s, a.to)) { ev.push({ kind: "cantTravel" }); break; }
        var cost = tripCost(s, a.to), coins = Math.min(s.money, cost);
        s.money -= coins;
        var crewTook = payWithCargo(s, cost - coins);
        for (var d = 0; d < r.days; d++) tickDay(s, rng);
        s.stats.trips++;
        ev.push({ kind: "travelled", from: s.city, to: a.to, days: r.days, cost: cost, crewTook: crewTook });
        rollEvent(s, a.to, r.days, rng, ev);
        if (!s.pending) arrive(s, a.to, ev);
        break;
      }
      case "bandits": {
        var p = s.pending;
        if (!p) break;
        s.pending = null;
        if (a.choice === "guards") {
          if (rng() < guardWinChance(s)) ev.push({ kind: "scared" });
          else loseGoods(s, p, ev);
        } else if (a.choice === "gift") {
          var fee = Math.min(s.money, p.fee);
          s.money -= fee; ev.push({ kind: "gift", lost: fee });
        } else {
          if (rng() < 0.5) ev.push({ kind: "escaped" });
          else loseGoods(s, p, ev);
        }
        arrive(s, p.to, ev);
        break;
      }
    }
    checkMilestones(s, ev);
    return { state: s, events: ev };
  }

  function guardWinChance(s) { return clamp(0.25 + 0.25 * s.guards, 0, 0.95); }
  function loseGoods(s, p, ev) {
    var best = null;
    GOODS.forEach(function (g) { if (s.cargo[g.id] > 0 && (!best || s.cargo[g.id] * g.base > s.cargo[best] * GOOD_BY_ID[best].base)) best = g.id; });
    if (!best) { ev.push({ kind: "robbed", good: null, lost: 0 }); return; }
    var lost = Math.min(8, Math.max(1, Math.floor(s.cargo[best] * 0.25)));
    s.cargo[best] -= lost;
    if (s.cargo[best] === 0) s.paid[best] = 0;
    ev.push({ kind: "robbed", good: best, lost: lost });
  }

  function rollEvent(s, to, days, rng, ev) {
    var r = rng();
    if (r < banditChance(s) * Math.min(1, 0.4 + days * 0.15)) {
      var fee = clamp(Math.round(s.money * 0.1), 5, 300);
      s.pending = { type: "bandits", to: to, fee: fee };
      ev.push({ kind: "bandits", fee: fee, guardChance: guardWinChance(s), guards: s.guards });
      return;
    }
    r = rng();
    if (r < 0.12) {
      // Sandstorm: one extra day of food & wages.
      var extra = dailyCost(s);
      var paid = Math.min(s.money, extra);
      s.money -= paid;
      tickDay(s, rng);
      ev.push({ kind: "sandstorm", lost: paid });
    } else if (r < 0.24) {
      var g = GOODS[Math.floor(rng() * 4)]; // cheap-ish goods only
      var room = capacity(s) - cargoCount(s);
      var qty = Math.min(2, room);
      if (qty > 0) {
        var held = s.cargo[g.id];
        s.paid[g.id] = Math.round(s.paid[g.id] * held / (held + qty)); // gifts are free
        s.cargo[g.id] += qty; ev.push({ kind: "nomads", good: g.id, qty: qty });
      } else ev.push({ kind: "story", city: to });
    } else if (r < 0.34) {
      var refund = dailyCost(s);
      s.money += refund;
      ev.push({ kind: "oasis", got: refund });
    } else if (r < 0.46) {
      ev.push({ kind: "story", city: to });
    }
  }

  function arrive(s, to, ev) {
    s.city = to;
    var first = !s.visited[to];
    s.visited[to] = true;
    ev.push({ kind: "arrived", city: to, first: first });
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
    GOODS: GOODS, CITIES: CITIES, ROADS: ROADS, MILESTONES: MILESTONES, CFG: CFG, TIME: TIME,
    GOOD_BY_ID: GOOD_BY_ID, CITY_BY_ID: CITY_BY_ID,
    newGame: newGame, actions: actions, apply: apply, netWorth: netWorth,
    buyPrice: buyPrice, sellPrice: sellPrice, tagFor: tagFor, maxBuy: maxBuy,
    capacity: capacity, cargoCount: cargoCount, dailyCost: dailyCost, tripDays: tripDays, tripCost: tripCost,
    canAffordTrip: canAffordTrip, hasPermit: hasPermit, permitCost: permitCost, camelCost: camelCost,
    banditChance: banditChance, guardWinChance: guardWinChance, neighbours: neighbours, road: road,
    canDeliver: canDeliver, jobRange: jobRange, cargoValue: cargoValue, contractOpen: contractOpen
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.CaravanLogic = api;
})(this);
