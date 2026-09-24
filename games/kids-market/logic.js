/* ============================================================================
 * Kids Market — pure game rules (no DOM). A pretend stock market.
 * ----------------------------------------------------------------------------
 * Browser global `MarketLogic`, Node require() for tests/sim.js.
 *
 * Each day:
 *   1. You read today's 📰 headline — it hints at what may happen TOMORROW
 *      (a hint comes true 75% of the time, so it's a skill, not a cheat).
 *   2. You buy or sell shares (2% fee, at least 🪙1 — no churn exploit).
 *   3. "Next day": prices move = company drift + random wiggle + news
 *      (+ seasons for the ice-cream company). Prices never drop below 🪙1.
 * Sources: price growth, weekly dividends (Banana Boat, Pizza Planet),
 * allowance 🪙20 every 5 days (always-available fallback). Sinks: fees.
 * Lessons: diversification ("basket" badge), patience, reading the news.
 * ==========================================================================*/
(function (root) {
  "use strict";

  var COMPANIES = [
    { id: "banana", icon: "🍌", start: 10, drift: 0.0035, vol: 0.02,  dividend: 0.012, name: { he: "סירת הבננות", en: "Banana Boat Co." }, kind: { he: "יציבה ומחלקת דיבידנד", en: "steady, pays dividends" } },
    { id: "pizza",  icon: "🍕", start: 20, drift: 0.004,  vol: 0.025, dividend: 0.01,  name: { he: "פיצה פלנט", en: "Pizza Planet" }, kind: { he: "יציבה ומחלקת דיבידנד", en: "steady, pays dividends" } },
    { id: "ice",    icon: "🍦", start: 15, drift: 0.004,  vol: 0.03,  dividend: 0,     season: 0.02, name: { he: "גלידת פרוסטי", en: "Frosty Ice Cream" }, kind: { he: "עולה בקיץ, יורדת בחורף", en: "up in summer, down in winter" } },
    { id: "robot",  icon: "🤖", start: 25, drift: 0.0065, vol: 0.05,  dividend: 0,     name: { he: "רובו-צעצועים", en: "Robo Toys" }, kind: { he: "צומחת מהר, קופצת הרבה", en: "grows fast, jumpy" } },
    { id: "rocket", icon: "🚀", start: 40, drift: 0.008,  vol: 0.085, dividend: 0,     name: { he: "טילי כוכב", en: "Star Rockets" }, kind: { he: "הרפתקנית — יכולה לטוס או ליפול", en: "wild — can soar or drop" } }
  ];

  // Headlines: {co, dir} → text. {co} is filled by the UI with the company name.
  var NEWS = {
    banana: [
      { dir: 1,  he: "סופה נגמרה — מטעי הבננות פורחים!", en: "Storm is over — banana farms are blooming!" },
      { dir: -1, he: "חיפושית בננות רעבה נראתה בחוות…", en: "A hungry banana beetle was spotted on the farms…" }
    ],
    pizza: [
      { dir: 1,  he: "פיצה פלנט פותחת 100 סניפים חדשים!", en: "Pizza Planet is opening 100 new shops!" },
      { dir: -1, he: "מחיר הגבינה עולה — פיצה יקרה יותר להכין.", en: "Cheese prices are rising — pizza costs more to make." }
    ],
    ice: [
      { dir: 1,  he: "גל חום מגיע! כולם ירצו גלידה 🥵", en: "Heatwave coming! Everyone will want ice cream 🥵" },
      { dir: -1, he: "תחזית: שבוע גשום וקר ☔", en: "Forecast: a cold, rainy week ☔" }
    ],
    robot: [
      { dir: 1,  he: "הרובוט הרוקד של רובו-צעצועים הפך ללהיט!", en: "Robo Toys' dancing robot is a big hit!" },
      { dir: -1, he: "בעיה בסוללות — רובוטים חוזרים לחנות.", en: "Battery trouble — robots are being returned." }
    ],
    rocket: [
      { dir: 1,  he: "טילי כוכב מתכננים שיגור לירח! 🌙", en: "Star Rockets plan a launch to the Moon! 🌙" },
      { dir: -1, he: "השיגור נדחה בגלל מזג אוויר.", en: "The launch was delayed by bad weather." }
    ]
  };
  var CALM = [
    { he: "יום רגוע בשוק. לפעמים לחכות זה הכי חכם.", en: "A calm day at the market. Sometimes waiting is smartest." },
    { he: "טיפ: אל תשימו את כל הביצים בסל אחד — גוונו!", en: "Tip: don't put all your eggs in one basket — mix it up!" },
    { he: "טיפ: כל קנייה ומכירה עולה עמלה קטנה.", en: "Tip: every buy and sell costs a small fee." }
  ];

  var MILESTONES = [
    { at: 500,  icon: "🐷", name: { he: "חוסך צעיר", en: "Young Saver" } },
    { at: 1500, icon: "📈", name: { he: "משקיע", en: "Investor" } },
    { at: 4000, icon: "💼", name: { he: "מנהל תיק", en: "Portfolio Pro" } },
    { at: 8000, icon: "👑", name: { he: "קוסם השוק", en: "Market Wizard" } }
  ];
  var BADGES = ["firstProfit", "basket", "patient", "newsReader", "dividend"];

  var CFG = {
    startCash: 300, fee: 0.02, feeMin: 1,
    allowance: 20, allowanceEvery: 5, dividendEvery: 7,
    newsChance: 0.6, newsTrue: 0.75, newsMin: 0.06, newsMax: 0.14,
    year: 60, history: 30, patientDays: 20
  };
  var TIME = { next: 3, buy: 2, sell: 2, read: 2 };

  var CO_BY_ID = {}; COMPANIES.forEach(function (c) { CO_BY_ID[c.id] = c; });

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function gauss(rng) { var u = 1 - rng(), v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function round2(x) { return Math.round(x * 100) / 100; }

  function newGame(rng) {
    var s = { v: 1, day: 1, cash: CFG.startCash, co: {}, news: null, milestone: 0, won: false, badges: {},
      stats: { trades: 0, fees: 0, dividends: 0, allowance: 0 } };
    COMPANIES.forEach(function (c) {
      s.co[c.id] = { price: c.start, prev: c.start, hist: [c.start], shares: 0, paid: 0, since: null };
    });
    rollNews(s, rng);
    return s;
  }

  /* ---------------- formulas ---------------- */
  function price(s, id) { return s.co[id].price; }
  function fee(value) { return Math.max(CFG.feeMin, Math.ceil(value * CFG.fee)); }
  function holdingsValue(s) { var v = 0; COMPANIES.forEach(function (c) { v += s.co[c.id].shares * s.co[c.id].price; }); return v; }
  function netWorth(s) { return s.cash + holdingsValue(s); }
  function maxBuy(s, id) {
    var p = price(s, id), n = Math.floor(s.cash / p);
    while (n > 0 && n * p + fee(n * p) > s.cash) n--;
    return n;
  }
  function owned(s) { return COMPANIES.filter(function (c) { return s.co[c.id].shares > 0; }).length; }
  function season(s) { return Math.sin(2 * Math.PI * (s.day % CFG.year) / CFG.year); } // + summer, − winter

  function rollNews(s, rng) {
    if (rng() < CFG.newsChance) {
      var c = COMPANIES[Math.floor(rng() * COMPANIES.length)];
      var dir = rng() < 0.5 ? 1 : -1;
      var list = NEWS[c.id].filter(function (n) { return n.dir === dir; });
      var idx = Math.floor(rng() * list.length);
      s.news = { co: c.id, dir: dir, idx: idx, size: CFG.newsMin + rng() * (CFG.newsMax - CFG.newsMin) };
    } else {
      s.news = { co: null, calm: Math.floor(rng() * CALM.length) };
    }
  }

  /* ---------------- actions ---------------- */
  function actions(s) {
    var list = [{ type: "next" }];
    COMPANIES.forEach(function (c) {
      var mb = maxBuy(s, c.id);
      if (mb > 0) { list.push({ type: "buy", co: c.id, qty: 1 }); if (mb > 1) list.push({ type: "buy", co: c.id, qty: mb }); }
      var sh = s.co[c.id].shares;
      if (sh > 0) { list.push({ type: "sell", co: c.id, qty: 1 }); if (sh > 1) list.push({ type: "sell", co: c.id, qty: sh }); }
    });
    return list;
  }

  function apply(s, a, rng) {
    var ev = [];
    switch (a.type) {
      case "buy": {
        var n = Math.min(a.qty, maxBuy(s, a.co));
        if (n <= 0) { ev.push({ kind: "cantBuy", co: a.co }); break; }
        var st = s.co[a.co], cost = round2(n * st.price), f = fee(cost);
        s.cash = round2(s.cash - cost - f);
        st.paid = round2((st.paid * st.shares + cost + f) / (st.shares + n));
        if (st.shares === 0) st.since = s.day;
        st.shares += n;
        s.stats.trades++; s.stats.fees += f;
        ev.push({ kind: "bought", co: a.co, qty: n, cost: cost, fee: f });
        if (owned(s) >= 4) badge(s, "basket", ev);
        break;
      }
      case "sell": {
        var sb = s.co[a.co], k = Math.min(a.qty, sb.shares);
        if (k <= 0) { ev.push({ kind: "cantSell", co: a.co }); break; }
        var got = round2(k * sb.price), f2 = Math.min(fee(got), got);
        s.cash = round2(s.cash + got - f2);
        var profit = round2(got - f2 - sb.paid * k);
        sb.shares -= k;
        if (sb.shares === 0) { sb.paid = 0; sb.since = null; }
        s.stats.trades++; s.stats.fees += f2;
        ev.push({ kind: "sold", co: a.co, qty: k, got: got, fee: f2, profit: profit });
        if (profit > 0) badge(s, "firstProfit", ev);
        break;
      }
      case "next": nextDay(s, rng, ev); break;
    }
    checkMilestones(s, ev);
    return { state: s, events: ev };
  }

  function nextDay(s, rng, ev) {
    var news = s.news;
    var happened = news && news.co && rng() < CFG.newsTrue;
    s.day++;
    COMPANIES.forEach(function (c) {
      var st = s.co[c.id];
      var r = c.drift + c.vol * gauss(rng);
      if (c.season) r += c.season * season(s);
      if (happened && news.co === c.id) r += news.dir * news.size;
      // Companies that fell far below where they started slowly recover.
      if (st.price < c.start * 0.35) r += 0.02;
      st.prev = st.price;
      st.price = Math.max(1, round2(st.price * Math.exp(clamp(r, -0.35, 0.35))));
      st.hist.push(st.price);
      if (st.hist.length > CFG.history) st.hist.shift();
      if (st.shares > 0 && st.since != null && s.day - st.since >= CFG.patientDays) badge(s, "patient", ev);
    });
    if (news && news.co) {
      ev.push({ kind: "newsResult", co: news.co, dir: news.dir, happened: happened });
      if (happened && news.dir > 0 && s.co[news.co].shares > 0) badge(s, "newsReader", ev);
    }
    if (s.day % CFG.dividendEvery === 0) {
      var paid = 0;
      COMPANIES.forEach(function (c) {
        if (c.dividend && s.co[c.id].shares > 0) paid += round2(s.co[c.id].shares * s.co[c.id].price * c.dividend);
      });
      if (paid > 0) { s.cash = round2(s.cash + paid); s.stats.dividends += paid; ev.push({ kind: "dividend", got: paid }); badge(s, "dividend", ev); }
    }
    if (s.day % CFG.allowanceEvery === 0) {
      s.cash = round2(s.cash + CFG.allowance); s.stats.allowance += CFG.allowance;
      ev.push({ kind: "allowance", got: CFG.allowance });
    }
    rollNews(s, rng);
    ev.push({ kind: "day", day: s.day });
  }

  function badge(s, id, ev) {
    if (s.badges[id]) return;
    s.badges[id] = s.day;
    ev.push({ kind: "badge", id: id });
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
    COMPANIES: COMPANIES, NEWS: NEWS, CALM: CALM, MILESTONES: MILESTONES, BADGES: BADGES, CFG: CFG, TIME: TIME, CO_BY_ID: CO_BY_ID,
    newGame: newGame, actions: actions, apply: apply, netWorth: netWorth, holdingsValue: holdingsValue,
    price: price, fee: fee, maxBuy: maxBuy, owned: owned, season: season
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MarketLogic = api;
})(this);
