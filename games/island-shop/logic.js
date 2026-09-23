/* ============================================================================
 * Island Shop — pure game rules (no DOM).
 * ----------------------------------------------------------------------------
 * Browser global `ShopLogic`, Node require() for tests/sim.js.
 *
 * A day has three beats:
 *   MORNING  a ship from a real country docks with 3–4 goods at wholesale
 *            prices; you stock your shelves and set a price tag per item
 *            (🙂 cheap ×1.3 · 😐 fair ×1.7 · 🤑 pricey ×2.2 of the base price).
 *   DAY      customers arrive (tourists, sailors, kids, chefs); each wants a
 *            specific item and has a max price in mind. Happy customers raise
 *            your ⭐ reputation (more customers), unhappy ones lower it.
 *   EVENING  rent is paid (never below 🪙0), fresh food older than 2 days
 *            spoils unless you own a fridge.
 * apply({type:"open"}) plays the whole day and returns every customer as an
 * event, so the UI can animate them one by one.
 *
 * Economy: sources = sales, beach cleanup (once a morning);
 * sinks = wholesale stock, rent, spoilage, upgrades (exponential).
 * No arbitrage: nothing can be sold back to ships, and even the cheap tag
 * (⌈1.3×base⌉) is above the highest wholesale price (⌊1.1×base⌋).
 * ==========================================================================*/
(function (root) {
  "use strict";

  var GOODS = [
    { id: "postcard", icon: "💌", base: 3,  fresh: false, name: { he: "גלויות", en: "Postcards" } },
    { id: "banana",   icon: "🍌", base: 4,  fresh: true,  name: { he: "בננות", en: "Bananas" } },
    { id: "candy",    icon: "🍭", base: 5,  fresh: false, name: { he: "סוכריות", en: "Candy" } },
    { id: "mango",    icon: "🥭", base: 6,  fresh: true,  name: { he: "מנגו", en: "Mangoes" } },
    { id: "coffee",   icon: "☕", base: 7,  fresh: false, name: { he: "קפה", en: "Coffee" } },
    { id: "fish",     icon: "🐟", base: 8,  fresh: true,  name: { he: "דגים", en: "Fish" } },
    { id: "rope",     icon: "🪢", base: 9,  fresh: false, name: { he: "חבלים", en: "Rope" } },
    { id: "kite",     icon: "🪁", base: 11, fresh: false, name: { he: "עפיפונים", en: "Kites" } },
    { id: "souvenir", icon: "🗿", base: 14, fresh: false, name: { he: "מזכרות", en: "Souvenirs" } }
  ];

  var SHIPS = [
    { code: "br", goods: ["coffee", "banana", "mango"] },
    { code: "no", goods: ["fish", "rope", "postcard"] },
    { code: "jp", goods: ["candy", "kite", "postcard"] },
    { code: "mx", goods: ["mango", "candy", "souvenir"] },
    { code: "gr", goods: ["souvenir", "postcard", "fish"] },
    { code: "ke", goods: ["coffee", "banana", "souvenir"] },
    { code: "it", goods: ["coffee", "candy", "postcard"] },
    { code: "ph", goods: ["banana", "mango", "rope"] },
    { code: "cn", goods: ["kite", "candy", "souvenir"] },
    { code: "in", goods: ["mango", "coffee", "kite"] },
    { code: "fj", goods: ["fish", "rope", "banana"] }
  ];

  var CUSTOMERS = [
    { id: "tourist", icon: "📸", wants: ["souvenir", "postcard", "mango", "kite", "coffee"], will: [1.6, 2.5], name: { he: "תיירת", en: "Tourist" } },
    { id: "sailor",  icon: "⚓", wants: ["rope", "fish", "coffee", "banana"],              will: [1.4, 2.1], name: { he: "מלח", en: "Sailor" } },
    { id: "kid",     icon: "🧒", wants: ["candy", "kite", "banana", "postcard"],           will: [1.25, 1.9], name: { he: "ילד", en: "Kid" } },
    { id: "chef",    icon: "👩‍🍳", wants: ["fish", "mango", "banana", "coffee"],          will: [1.4, 2.2], name: { he: "שפית", en: "Chef" } }
  ];

  var TAGS = { cheap: 1.3, fair: 1.7, pricey: 2.2 };

  var UPGRADES = {
    shelves: { icon: "🗄️", max: 4, cost: function (l) { return Math.round(110 * Math.pow(1.9, l)); } },
    storage: { icon: "📦", max: 6, cost: function (l) { return Math.round(90 * Math.pow(1.7, l)); } },
    fridge:  { icon: "🧊", max: 1, cost: function () { return 350; } },
    sign:    { icon: "🪧", max: 5, cost: function (l) { return Math.round(80 * Math.pow(1.9, l)); } },
    size:    { icon: "🏠", max: 4, cost: function (l) { return Math.round(260 * Math.pow(2.1, l)); } }
  };
  var UPGRADE_IDS = ["shelves", "storage", "fridge", "sign", "size"];

  var MILESTONES = [
    { at: 400,   icon: "🛍️", name: { he: "מוכר צעיר", en: "Shop Helper" } },
    { at: 2000,  icon: "🏝️", name: { he: "בעל חנות", en: "Shopkeeper" } },
    { at: 5000,  icon: "⭐", name: { he: "חנות מפורסמת", en: "Famous Shop" } },
    { at: 10000, icon: "👑", name: { he: "טייקון האי", en: "Island Tycoon" } }
  ];

  var CFG = {
    startMoney: 100,
    baseShelves: 3, baseStorage: 10, storagePer: 5,
    baseCustomers: 11, signCustomers: 2, sizeCustomers: 3,
    rentBase: 4, rentPerSize: 6,
    freshDays: 2,
    cleanupMin: 10, cleanupMax: 16,
    repMin: 0.6, repMax: 1.5,
    repHappy: 0.015, repPricey: -0.02, repSoldOut: -0.008
  };

  var TIME = { buy: 2, tag: 2, cleanup: 3, upgrade: 4, open: 14, evening: 4 };

  var GOOD_BY_ID = {}; GOODS.forEach(function (g) { GOOD_BY_ID[g.id] = g; });
  var CUSTOMER_BY_ID = {}; CUSTOMERS.forEach(function (c) { CUSTOMER_BY_ID[c.id] = c; });

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function randInt(rng, a, b) { return a + Math.floor(rng() * (b - a + 1)); }

  function newShip(s, rng) {
    var tpl = SHIPS[Math.floor(rng() * SHIPS.length)];
    if (s.ship && tpl.code === s.ship.code) tpl = SHIPS[(SHIPS.indexOf(tpl) + 1) % SHIPS.length];
    var goods = tpl.goods.slice();
    // sometimes one extra random good
    if (rng() < 0.5) {
      var extra = GOODS[Math.floor(rng() * GOODS.length)].id;
      if (goods.indexOf(extra) < 0) goods.push(extra);
    }
    var offer = {};
    goods.forEach(function (id) {
      offer[id] = { price: Math.max(1, Math.floor(GOOD_BY_ID[id].base * (0.8 + rng() * 0.3))), qty: randInt(rng, 8, 20) };
    });
    s.ship = { code: tpl.code, offer: offer };
  }

  function newGame(rng) {
    var s = {
      v: 1, day: 1, money: CFG.startMoney, rep: 1, stock: {}, invested: 0,
      up: { shelves: 0, storage: 0, fridge: 0, sign: 0, size: 0 },
      cleaned: false, ship: null, milestone: 0, won: false, last: null,
      stats: { sold: 0, days: 0, happy: 0, visitors: 0, earned: 0 }
    };
    GOODS.forEach(function (g) { s.stock[g.id] = { qty: 0, age: 0, tag: "fair", paid: 0 }; });
    newShip(s, rng);
    return s;
  }

  /* ---------------- formulas ---------------- */
  function shelves(s) { return CFG.baseShelves + s.up.shelves; }
  function storage(s) { return CFG.baseStorage + CFG.storagePer * s.up.storage; }
  function typesOnShelf(s) { var n = 0; GOODS.forEach(function (g) { if (s.stock[g.id].qty > 0) n++; }); return n; }
  // Tags round up and wholesale rounds down, so every sale makes a profit.
  function tagPrice(goodId, tag) { return Math.ceil(GOOD_BY_ID[goodId].base * TAGS[tag]); }
  function maxWholesale(goodId) { return Math.floor(GOOD_BY_ID[goodId].base * 1.1); }
  function priceOf(s, goodId) { return tagPrice(goodId, s.stock[goodId].tag); }
  function customersPerDay(s) {
    return Math.round((CFG.baseCustomers + CFG.signCustomers * s.up.sign + CFG.sizeCustomers * s.up.size) * s.rep);
  }
  function rent(s) { return CFG.rentBase + CFG.rentPerSize * s.up.size; }
  function upgradeCost(s, id) { return UPGRADES[id].cost(s.up[id]); }
  function upgradeMaxed(s, id) { return s.up[id] >= UPGRADES[id].max; }
  function stockValue(s) { var v = 0; GOODS.forEach(function (g) { v += s.stock[g.id].qty * g.base; }); return v; }
  function netWorth(s) { return s.money + stockValue(s) + s.invested; }

  function roomFor(s, goodId) {
    var st = s.stock[goodId];
    if (st.qty === 0 && typesOnShelf(s) >= shelves(s)) return 0;
    return Math.max(0, storage(s) - st.qty);
  }
  function maxBuy(s, goodId) {
    var o = s.ship.offer[goodId];
    if (!o) return 0;
    return Math.max(0, Math.min(o.qty, roomFor(s, goodId), Math.floor(s.money / o.price)));
  }

  /* ---------------- actions ---------------- */
  function actions(s) {
    var list = [];
    Object.keys(s.ship.offer).forEach(function (id) {
      var n = maxBuy(s, id);
      if (n > 0) { list.push({ type: "buy", good: id, qty: 1 }); if (n > 1) list.push({ type: "buy", good: id, qty: n }); }
    });
    GOODS.forEach(function (g) {
      if (s.stock[g.id].qty > 0) Object.keys(TAGS).forEach(function (tag) { if (tag !== s.stock[g.id].tag) list.push({ type: "tag", good: g.id, tag: tag }); });
    });
    UPGRADE_IDS.forEach(function (id) { if (!upgradeMaxed(s, id) && upgradeCost(s, id) <= s.money) list.push({ type: "upgrade", which: id }); });
    if (!s.cleaned) list.push({ type: "cleanup" }); // always a free way to earn each morning
    list.push({ type: "open" });
    return list;
  }

  function apply(s, a, rng) {
    var ev = [];
    switch (a.type) {
      case "buy": {
        var o = s.ship.offer[a.good];
        if (!o) { ev.push({ kind: "cantBuy", reason: "none" }); break; }
        var n = Math.min(a.qty, maxBuy(s, a.good));
        if (n <= 0) {
          var why = o.qty === 0 ? "none" : roomFor(s, a.good) === 0 ? (s.stock[a.good].qty === 0 ? "shelves" : "full") : "money";
          ev.push({ kind: "cantBuy", good: a.good, reason: why });
          break;
        }
        var st = s.stock[a.good];
        st.paid = Math.round((st.paid * st.qty + o.price * n) / (st.qty + n));
        if (st.qty === 0) st.age = 0;
        st.qty += n; o.qty -= n;
        s.money -= n * o.price;
        ev.push({ kind: "bought", good: a.good, qty: n, spent: n * o.price });
        break;
      }
      case "tag": {
        if (!TAGS[a.tag]) break;
        s.stock[a.good].tag = a.tag;
        ev.push({ kind: "tagged", good: a.good, tag: a.tag, price: priceOf(s, a.good) });
        break;
      }
      case "cleanup": {
        if (s.cleaned) { ev.push({ kind: "cantCleanup" }); break; }
        var pay = randInt(rng, CFG.cleanupMin, CFG.cleanupMax);
        s.money += pay; s.cleaned = true;
        ev.push({ kind: "cleanup", got: pay });
        break;
      }
      case "upgrade": {
        var c = upgradeCost(s, a.which);
        if (upgradeMaxed(s, a.which) || c > s.money) { ev.push({ kind: "cantUpgrade" }); break; }
        s.money -= c; s.invested += c; s.up[a.which]++;
        ev.push({ kind: "upgraded", which: a.which, level: s.up[a.which], cost: c });
        break;
      }
      case "open": runDay(s, rng, ev); break;
    }
    checkMilestones(s, ev);
    return { state: s, events: ev };
  }

  function runDay(s, rng, ev) {
    var n = customersPerDay(s);
    var earned = 0, happy = 0, pricey = 0, soldOut = 0, sold = 0;
    for (var i = 0; i < n; i++) {
      var type = CUSTOMERS[Math.floor(rng() * CUSTOMERS.length)];
      // Customers glance at the shelves: 70% pick something they like that's in stock.
      var inStock = type.wants.filter(function (id) { return s.stock[id].qty > 0; });
      var want = inStock.length && rng() < 0.7 ? inStock[Math.floor(rng() * inStock.length)] : type.wants[Math.floor(rng() * type.wants.length)];
      var maxPay = Math.round(GOOD_BY_ID[want].base * (type.will[0] + rng() * (type.will[1] - type.will[0])));
      var st = s.stock[want], price = priceOf(s, want);
      var result;
      if (st.qty <= 0) { result = "soldOut"; soldOut++; s.rep += CFG.repSoldOut; }
      else if (price > maxPay) { result = "pricey"; pricey++; s.rep += CFG.repPricey; }
      else {
        var qty = type.id === "tourist" && st.qty > 1 && rng() < 0.3 ? 2 : 1;
        st.qty -= qty; s.money += price * qty; earned += price * qty; sold += qty; happy++;
        s.rep += CFG.repHappy;
        if (st.qty === 0) st.paid = 0;
        result = "bought";
        ev.push({ kind: "customer", who: type.id, want: want, max: maxPay, price: price, qty: qty, result: result });
        continue;
      }
      ev.push({ kind: "customer", who: type.id, want: want, max: maxPay, price: price, qty: 0, result: result });
    }
    s.rep = clamp(s.rep, CFG.repMin, CFG.repMax);
    // Evening
    var r = Math.min(s.money, rent(s));
    s.money -= r;
    var spoiled = {};
    GOODS.forEach(function (g) {
      var st = s.stock[g.id];
      if (st.qty > 0) {
        st.age++;
        if (g.fresh && !s.up.fridge && st.age > CFG.freshDays) { spoiled[g.id] = st.qty; st.qty = 0; st.paid = 0; }
      }
    });
    s.stats.days++; s.stats.sold += sold; s.stats.happy += happy; s.stats.visitors += n; s.stats.earned += earned;
    var summary = { kind: "evening", day: s.day, visitors: n, sold: sold, happy: happy, pricey: pricey, soldOut: soldOut,
      earned: earned, rent: r, spoiled: spoiled, rep: s.rep };
    ev.push(summary);
    s.last = { earned: earned, rent: r, sold: sold, happy: happy, pricey: pricey, soldOut: soldOut, visitors: n };
    s.day++;
    s.cleaned = false;
    newShip(s, rng);
    ev.push({ kind: "ship", code: s.ship.code });
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
    GOODS: GOODS, SHIPS: SHIPS, CUSTOMERS: CUSTOMERS, TAGS: TAGS, UPGRADES: UPGRADES, UPGRADE_IDS: UPGRADE_IDS,
    MILESTONES: MILESTONES, CFG: CFG, TIME: TIME, GOOD_BY_ID: GOOD_BY_ID, CUSTOMER_BY_ID: CUSTOMER_BY_ID,
    newGame: newGame, actions: actions, apply: apply, netWorth: netWorth,
    shelves: shelves, storage: storage, typesOnShelf: typesOnShelf, tagPrice: tagPrice, priceOf: priceOf,
    customersPerDay: customersPerDay, rent: rent, upgradeCost: upgradeCost, upgradeMaxed: upgradeMaxed,
    maxBuy: maxBuy, roomFor: roomFor, maxWholesale: maxWholesale, stockValue: stockValue
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ShopLogic = api;
})(this);
