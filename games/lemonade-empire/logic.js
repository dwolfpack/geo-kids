/* ============================================================================
 * Lemonade Empire — pure game rules (no DOM). Idle / tycoon.
 * ----------------------------------------------------------------------------
 * Browser global `LemonLogic`, Node require() for tests/sim.js.
 * Time-based: tick(state, seconds, rng) advances the world. Customers arrive
 * as a fluid rate; helpers serve them automatically, the player can tap to
 * serve anyone still waiting in the queue at the stand they're looking at.
 *
 * The price lesson:
 *   customers/min = base × city × weather × sign × kiosk × demand(price)
 *   demand(price) = e^(−price / fair)       (fair price grows with recipe)
 *   profit per cup = price − cup cost
 * Revenue peaks near price = fair (+ cup cost), so kids can discover the
 * "sweet spot" with the slider and the live coins/min readout.
 *
 * Economy: sources = cups sold (tap or helpers), offline earnings (capped 2h);
 * sinks = cup ingredients, exponential purchases (helpers ×1.15, kiosk ×1.9,
 * recipe ×2.2, sign ×2, new cities ×~3).
 * ==========================================================================*/
(function (root) {
  "use strict";

  // climate: chance of [sunny, cloudy, rainy]
  var CITIES = [
    { id: "telaviv", code: "il", open: 0,      mult: 1,   climate: [0.7, 0.2, 0.1], name: { he: "תל אביב", en: "Tel Aviv" } },
    { id: "paris",   code: "fr", open: 600,    mult: 1.4, climate: [0.4, 0.4, 0.2], name: { he: "פריז", en: "Paris" } },
    { id: "cairo",   code: "eg", open: 2000,   mult: 1.8, climate: [0.85, 0.12, 0.03], name: { he: "קהיר", en: "Cairo" } },
    { id: "newyork", code: "us", open: 6000,   mult: 2.6, climate: [0.45, 0.35, 0.2], name: { he: "ניו יורק", en: "New York" } },
    { id: "rio",     code: "br", open: 18000,  mult: 3.6, climate: [0.6, 0.25, 0.15], name: { he: "ריו דה ז'נרו", en: "Rio de Janeiro" } },
    { id: "tokyo",   code: "jp", open: 55000,  mult: 5,   climate: [0.45, 0.35, 0.2], name: { he: "טוקיו", en: "Tokyo" } },
    { id: "mumbai",  code: "in", open: 160000, mult: 7,   climate: [0.55, 0.2, 0.25], name: { he: "מומבאי", en: "Mumbai" } },
    { id: "sydney",  code: "au", open: 450000, mult: 10,  climate: [0.65, 0.25, 0.1], name: { he: "סידני", en: "Sydney" } }
  ];
  var WEATHER = [
    { id: "sunny",  icon: "☀️", mult: 1.4, name: { he: "שמשי", en: "Sunny" } },
    { id: "cloudy", icon: "⛅", mult: 1.0, name: { he: "מעונן", en: "Cloudy" } },
    { id: "rainy",  icon: "🌧️", mult: 0.5, name: { he: "גשום", en: "Rainy" } }
  ];
  var UPGRADES = {
    recipe: { icon: "🍋", max: 8, cost: function (l) { return Math.round(40 * Math.pow(2.4, l)); } },
    sign:   { icon: "🪧", max: 8, cost: function (l) { return Math.round(60 * Math.pow(2.2, l)); } }
  };
  var MILESTONES = [
    { at: 500,     icon: "🍋", name: { he: "מוכר לימונדה", en: "Lemonade Seller" } },
    { at: 10000,   icon: "🏪", name: { he: "בעל רשת דוכנים", en: "Stand Chain Owner" } },
    { at: 100000,  icon: "🌍", name: { he: "יזם עולמי", en: "Global Boss" } },
    { at: 1000000, icon: "👑", name: { he: "טייקון הלימונדה", en: "Lemonade Tycoon" } }
  ];

  var CFG = {
    startMoney: 40,
    baseRate: 1.2,        // customers per second at demand 1, before multipliers
    cupCost: 1,           // + 0.5 per recipe level (better lemons cost more)
    cupCostPerRecipe: 0.5,
    fairBase: 3,
    fairPerRecipe: 1.5,
    signBoost: 0.3,       // +30% customers per sign level
    kioskBoost: 0.5,      // +50% customers per kiosk level
    helperRate: 0.35,     // cups per second per helper
    helperCost: 20,       // × city mult × 1.15^helpers
    helperGrowth: 1.15,
    kioskCost: 80,        // × city mult × 1.9^level
    kioskGrowth: 1.9,
    kioskMax: 10,
    queueMax: 6,
    dayLength: 40,        // seconds per in-game day (weather changes)
    offlineCap: 2 * 3600,
    offlineRate: 0.25     // helpers work at quarter speed while you are away
  };

  var CITY_BY_ID = {}; CITIES.forEach(function (c) { CITY_BY_ID[c.id] = c; });
  var WEATHER_BY_ID = {}; WEATHER.forEach(function (w) { WEATHER_BY_ID[w.id] = w; });

  function rollWeather(city, rng) {
    var r = rng(), c = city.climate;
    return r < c[0] ? "sunny" : r < c[0] + c[1] ? "cloudy" : "rainy";
  }

  function newGame(rng) {
    var s = {
      v: 1, money: CFG.startMoney, earned: 0, time: 0, dayClock: 0, day: 1,
      up: { recipe: 0, sign: 0 },
      stands: {}, view: "telaviv", milestone: 0, won: false, invested: 0,
      stats: { cups: 0, taps: 0 }
    };
    CITIES.forEach(function (c) {
      s.stands[c.id] = { open: c.open === 0, helpers: 0, kiosk: 0, price: 3, queue: 0, acc: 0, arrAcc: 0, weather: rollWeather(c, rng), sold: 0 };
    });
    return s;
  }

  /* ---------------- formulas ---------------- */
  function cupCost(s) { return CFG.cupCost + CFG.cupCostPerRecipe * s.up.recipe; }
  function fairPrice(s) { return CFG.fairBase + CFG.fairPerRecipe * s.up.recipe; }
  function minPrice(s) { return Math.ceil(cupCost(s)) + 1; }
  function maxPrice(s) { return Math.ceil(fairPrice(s) * 3 + cupCost(s)); }
  function demand(s, price) { return Math.exp(-price / fairPrice(s)); }
  function bestPrice(s) {
    // argmax (p − cost)·e^(−p/F) = F + cost
    return Math.max(minPrice(s), Math.min(maxPrice(s), Math.round(fairPrice(s) + cupCost(s))));
  }
  function arrivalRate(s, cityId) {
    var c = CITY_BY_ID[cityId], st = s.stands[cityId];
    return CFG.baseRate * c.mult * WEATHER_BY_ID[st.weather].mult * (1 + CFG.signBoost * s.up.sign) *
      (1 + CFG.kioskBoost * st.kiosk) * demand(s, st.price);
  }
  function serviceRate(s, cityId) { return s.stands[cityId].helpers * CFG.helperRate; }
  function autoRate(s, cityId) { return Math.min(arrivalRate(s, cityId), serviceRate(s, cityId)); }
  function profitPerCup(s, cityId) { return s.stands[cityId].price - cupCost(s); }
  // Coins per minute the helpers make right now at this stand.
  function autoIncomePerMin(s, cityId) {
    if (!s.stands[cityId].open) return 0;
    return autoRate(s, cityId) * profitPerCup(s, cityId) * 60;
  }
  function totalAutoPerMin(s) {
    var t = 0; CITIES.forEach(function (c) { t += autoIncomePerMin(s, c.id); }); return t;
  }
  function helperCost(s, cityId) {
    return Math.round(CFG.helperCost * CITY_BY_ID[cityId].mult * Math.pow(CFG.helperGrowth, s.stands[cityId].helpers));
  }
  function kioskCost(s, cityId) {
    return Math.round(CFG.kioskCost * CITY_BY_ID[cityId].mult * Math.pow(CFG.kioskGrowth, s.stands[cityId].kiosk));
  }
  function upgradeCost(s, id) { return UPGRADES[id].cost(s.up[id]); }
  function openCost(cityId) { return CITY_BY_ID[cityId].open; }
  function netWorth(s) { return s.money + s.invested; }

  /* ---------------- time ---------------- */
  function sellCups(s, cityId, n, ev, how) {
    if (n <= 0) return 0;
    var got = n * profitPerCup(s, cityId);
    s.money += got; s.earned += got; s.stats.cups += n; s.stands[cityId].sold += n;
    if (ev) ev.push({ kind: "sold", city: cityId, cups: n, got: got, how: how });
    return got;
  }

  function tick(s, dt, rng) {
    var ev = [];
    s.time += dt;
    s.dayClock += dt;
    while (s.dayClock >= CFG.dayLength) {
      s.dayClock -= CFG.dayLength;
      s.day++;
      CITIES.forEach(function (c) { s.stands[c.id].weather = rollWeather(c, rng); });
      ev.push({ kind: "newDay", day: s.day });
    }
    CITIES.forEach(function (c) {
      var st = s.stands[c.id];
      if (!st.open) return;
      var arr = arrivalRate(s, c.id) * dt;
      var served = Math.min(arr, serviceRate(s, c.id) * dt);
      st.acc += served;
      var cups = Math.floor(st.acc);
      st.acc -= cups;
      if (cups > 0) sellCups(s, c.id, cups, ev, "auto");
      // Customers the helpers couldn't serve wait in the queue for a tap.
      st.arrAcc += arr - served;
      var wait = Math.floor(st.arrAcc);
      st.arrAcc -= wait;
      st.queue = Math.min(CFG.queueMax, st.queue + wait);
      // helpers also pick up anyone waiting when they have spare capacity
      var spare = serviceRate(s, c.id) * dt - served;
      if (spare >= 1 && st.queue > 0) {
        var take = Math.min(st.queue, Math.floor(spare));
        st.queue -= take;
        sellCups(s, c.id, take, ev, "auto");
      }
    });
    checkMilestones(s, ev);
    return ev;
  }

  // Offline earnings: helpers work at quarter speed, capped at 2 hours, average weather.
  function offline(s, seconds) {
    var sec = Math.max(0, Math.min(CFG.offlineCap, seconds));
    if (sec < 30) return { seconds: 0, got: 0 };
    var got = 0;
    CITIES.forEach(function (c) {
      var st = s.stands[c.id];
      if (!st.open || st.helpers === 0) return;
      var save = st.weather; st.weather = "cloudy";
      got += autoRate(s, c.id) * profitPerCup(s, c.id) * sec * CFG.offlineRate;
      st.weather = save;
    });
    got = Math.floor(got);
    s.money += got; s.earned += got;
    var ev = []; checkMilestones(s, ev);
    return { seconds: sec, got: got, events: ev };
  }

  /* ---------------- actions ---------------- */
  function apply(s, a) {
    var ev = [];
    var st = a.city ? s.stands[a.city] : null;
    switch (a.type) {
      case "tap": {
        var v = s.stands[s.view];
        s.stats.taps++;
        if (v.queue > 0) { v.queue--; sellCups(s, s.view, 1, ev, "tap"); }
        else ev.push({ kind: "noCustomer" });
        break;
      }
      case "price": {
        if (!st || !st.open) break;
        st.price = Math.max(minPrice(s), Math.min(maxPrice(s), Math.round(a.price)));
        ev.push({ kind: "price", city: a.city, price: st.price });
        break;
      }
      case "view": {
        if (st && st.open) { s.view = a.city; ev.push({ kind: "view", city: a.city }); }
        break;
      }
      case "helper": {
        if (!st || !st.open) break;
        var hc = helperCost(s, a.city);
        if (hc > s.money) { ev.push({ kind: "cant" }); break; }
        s.money -= hc; s.invested += hc; st.helpers++;
        ev.push({ kind: "helper", city: a.city, cost: hc, helpers: st.helpers });
        break;
      }
      case "kiosk": {
        if (!st || !st.open || st.kiosk >= CFG.kioskMax) break;
        var kc = kioskCost(s, a.city);
        if (kc > s.money) { ev.push({ kind: "cant" }); break; }
        s.money -= kc; s.invested += kc; st.kiosk++;
        ev.push({ kind: "kiosk", city: a.city, cost: kc, level: st.kiosk });
        break;
      }
      case "open": {
        if (!st || st.open) break;
        var oc = openCost(a.city);
        if (oc > s.money) { ev.push({ kind: "cant" }); break; }
        s.money -= oc; s.invested += oc; st.open = true; st.helpers = 1; st.price = bestPrice(s) - 1;
        ev.push({ kind: "opened", city: a.city, cost: oc });
        break;
      }
      case "upgrade": {
        var U = UPGRADES[a.which];
        if (!U || s.up[a.which] >= U.max) break;
        var uc = upgradeCost(s, a.which);
        if (uc > s.money) { ev.push({ kind: "cant" }); break; }
        s.money -= uc; s.invested += uc; s.up[a.which]++;
        // Keep every stand's price legal under the new cup cost.
        CITIES.forEach(function (c) { var x = s.stands[c.id]; x.price = Math.max(minPrice(s), x.price); });
        ev.push({ kind: "upgraded", which: a.which, level: s.up[a.which], cost: uc });
        break;
      }
    }
    checkMilestones(s, ev);
    return ev;
  }

  function actions(s) {
    var list = [{ type: "tap" }];
    CITIES.forEach(function (c) {
      var st = s.stands[c.id];
      if (!st.open) { if (openCost(c.id) <= s.money) list.push({ type: "open", city: c.id }); return; }
      list.push({ type: "view", city: c.id });
      if (helperCost(s, c.id) <= s.money) list.push({ type: "helper", city: c.id });
      if (st.kiosk < CFG.kioskMax && kioskCost(s, c.id) <= s.money) list.push({ type: "kiosk", city: c.id });
    });
    Object.keys(UPGRADES).forEach(function (id) {
      if (s.up[id] < UPGRADES[id].max && upgradeCost(s, id) <= s.money) list.push({ type: "upgrade", which: id });
    });
    return list;
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
    CITIES: CITIES, WEATHER: WEATHER, UPGRADES: UPGRADES, MILESTONES: MILESTONES, CFG: CFG,
    CITY_BY_ID: CITY_BY_ID, WEATHER_BY_ID: WEATHER_BY_ID,
    newGame: newGame, tick: tick, offline: offline, apply: apply, actions: actions, netWorth: netWorth,
    cupCost: cupCost, fairPrice: fairPrice, minPrice: minPrice, maxPrice: maxPrice, demand: demand, bestPrice: bestPrice,
    arrivalRate: arrivalRate, serviceRate: serviceRate, autoRate: autoRate, profitPerCup: profitPerCup,
    autoIncomePerMin: autoIncomePerMin, totalAutoPerMin: totalAutoPerMin,
    helperCost: helperCost, kioskCost: kioskCost, upgradeCost: upgradeCost, openCost: openCost
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LemonLogic = api;
})(this);
