/* Lemonade Empire — DOM rendering, real-time loop and input. Rules live in logic.js. */
(function () {
  "use strict";
  var L = window.LemonLogic;
  var SAVE_KEY = "lemonade-empire-v1";
  var TICK = 0.25; // seconds per simulation step
  var $ = function (id) { return document.getElementById(id); };

  GE.setDict({
    he: {
      title: "אימפריית הלימונדה 🍋", home: "חזרה למשחקים", sound: "צליל", perMin: "{n}/דקה",
      tap: "🍋 מוכרים!", noOne: "אין לקוח שמחכה — עוד רגע יגיע מישהו 🙂",
      cities: "🌍 ערים", ups: "⭐ שדרוגים", stand: "🍋 הדוכן", day: "יום {n}",
      weather: "{icon} {name}", waiting: "🧍 מחכים: {n}", helpers: "🧑‍🍳 עוזרים: {n}",
      rank0: "מתחילים", nextGoal: "היעד הבא: {goal}", allDone: "הגעתם לכל היעדים! 👑", fortune: "הון: {v}",
      priceTitle: "💲 מחיר לכוס", priceLabel: "מחיר לכוס לימונדה",
      custL: "לקוחות לדקה", profitL: "רווח לכוס", coinsL: "מטבעות לדקה",
      sweetHint: "🎯 הזיזו את המחיר ומצאו איפה מקבלים הכי הרבה מטבעות לדקה!",
      sweetHit: "🎯 מצאתם את המחיר המושלם!", tooLow: "זול מדי — הרבה לקוחות, אבל רווח קטן", tooHigh: "יקר מדי — מעט לקוחות מגיעים",
      standUps: "🏪 הדוכן ב{city}",
      helper: "לשכור עוזר", helperD: "מוכר לבד {n} כוסות לדקה, גם כשאתם לא כאן",
      kiosk: "דוכן גדול יותר", kioskD: "+50% לקוחות בעיר הזו", level: "רמה {n}", maxed: "מקסימום",
      factTitle: "💡 הידעתם?",
      citiesTitle: "🌍 הדוכנים שלכם בעולם", citiesHint: "פתחו דוכנים בערים חדשות. לכל עיר מזג אוויר משלה!",
      open: "פתיחה", closed: "🔒 עוד לא פתוח", here: "אתם כאן", earning: "{n}/דקה",
      upsTitle: "⭐ שדרוגים לכל הדוכנים",
      recipe: "מתכון משובח", recipeD: "הלקוחות מוכנים לשלם יותר (לימונים טובים עולים קצת יותר)",
      sign: "שלט צבעוני", signD: "+30% לקוחות בכל הדוכנים",
      close: "סגירה", reset: "להתחיל משחק חדש", resetQ: "להתחיל מההתחלה? כל ההתקדמות תימחק.", resetYes: "כן, משחק חדש", resetNo: "לא, להמשיך",
      opened: "דוכן חדש ב{city}! 🎉", openedBody: "העוזר הראשון כבר מוכר. עובדה על {country}:",
      awayTitle: "ברוכים השבים! 👋", awayBody: "בזמן שלא הייתם ({time}), העוזרים מכרו לימונדה והרוויחו:",
      awayNote: "(העוזרים עובדים לאט יותר כשאתם לא כאן, עד שעתיים)",
      minutes: "{n} דקות", hours: "{h} שעות ו-{m} דקות",
      newDay: "יום חדש! {icon} מזג האוויר השתנה",
      milestone: "דרגה חדשה!", milestoneBody: "אתם עכשיו {name}! {icon}",
      win: "טייקון הלימונדה! 👑", winBody: "הגעתם להון של {v}! אפשר להמשיך ולבנות את האימפריה.", keepPlaying: "ממשיכים למכור",
      ok: "יופי!",
      tutTitle: "הדוכן הראשון שלכם! 🍋",
      tutBody: "<p>🍋 כשלקוח מחכה — לחצו <b>מוכרים!</b></p><p>💲 הזיזו את המחיר: זול מדי = רווח קטן, יקר מדי = אין לקוחות.</p><p>🧑‍🍳 שכרו עוזרים שימכרו בשבילכם, ופתחו דוכנים בכל העולם!</p>",
      tutGo: "בואו נמכור!",
      noSave: "שימו לב: ההתקדמות לא תישמר במכשיר הזה."
    },
    en: {
      title: "Lemonade Empire 🍋", home: "Back to games", sound: "Sound", perMin: "{n}/min",
      tap: "🍋 Sell!", noOne: "Nobody's waiting — someone will come soon 🙂",
      cities: "🌍 Cities", ups: "⭐ Boosts", stand: "🍋 Stand", day: "Day {n}",
      weather: "{icon} {name}", waiting: "🧍 Waiting: {n}", helpers: "🧑‍🍳 Helpers: {n}",
      rank0: "Beginner", nextGoal: "Next: {goal}", allDone: "Every goal reached! 👑", fortune: "Fortune: {v}",
      priceTitle: "💲 Price per cup", priceLabel: "Price per cup of lemonade",
      custL: "customers/min", profitL: "profit per cup", coinsL: "coins/min",
      sweetHint: "🎯 Slide the price to find where you earn the most coins per minute!",
      sweetHit: "🎯 You found the sweet spot!", tooLow: "Too cheap — lots of customers, tiny profit", tooHigh: "Too pricey — few customers come",
      standUps: "🏪 Your stand in {city}",
      helper: "Hire a helper", helperD: "Sells {n} cups a minute, even when you're away",
      kiosk: "Bigger stand", kioskD: "+50% customers in this city", level: "Level {n}", maxed: "Max",
      factTitle: "💡 Did you know?",
      citiesTitle: "🌍 Your stands around the world", citiesHint: "Open stands in new cities. Every city has its own weather!",
      open: "Open", closed: "🔒 Not open yet", here: "You are here", earning: "{n}/min",
      upsTitle: "⭐ Upgrades for every stand",
      recipe: "Better recipe", recipeD: "Customers happily pay more (good lemons cost a bit more)",
      sign: "Colourful sign", signD: "+30% customers at every stand",
      close: "Close", reset: "Start a new game", resetQ: "Start over? All progress will be erased.", resetYes: "Yes, new game", resetNo: "No, keep playing",
      opened: "New stand in {city}! 🎉", openedBody: "Your first helper is already selling. A fact about {country}:",
      awayTitle: "Welcome back! 👋", awayBody: "While you were away ({time}), your helpers sold lemonade and earned:",
      awayNote: "(helpers work slower while you're away, up to 2 hours)",
      minutes: "{n} minutes", hours: "{h} h {m} min",
      newDay: "A new day! {icon} The weather changed",
      milestone: "New rank!", milestoneBody: "You are now a {name}! {icon}",
      win: "Lemonade Tycoon! 👑", winBody: "You reached a fortune of {v}! Keep building your empire.", keepPlaying: "Keep selling",
      ok: "Great!",
      tutTitle: "Your very first stand! 🍋",
      tutBody: "<p>🍋 When a customer is waiting, tap <b>Sell!</b></p><p>💲 Slide the price: too cheap = tiny profit, too pricey = no customers.</p><p>🧑‍🍳 Hire helpers to sell for you, and open stands around the world!</p>",
      tutGo: "Let's sell!",
      noSave: "Heads up: progress can't be saved on this device."
    }
  });
  var t = GE.t, L10 = GE.L;

  var rng = GE.rng((Date.now() ^ (Math.random() * 1e9)) >>> 0);
  var state = GE.load(SAVE_KEY, null);
  var fresh = !state || state.v !== 1;
  if (fresh) state = L.newGame(rng);
  var view = "stand";
  var lastSaved = 0;

  function save() { state.lastSeen = Date.now(); GE.save(SAVE_KEY, state); }

  var COUNTRY = {};
  if (typeof COUNTRIES !== "undefined") COUNTRIES.forEach(function (c) { COUNTRY[c.code] = c; });
  function countryName(code) { return COUNTRY[code] ? L10(COUNTRY[code].name) : code.toUpperCase(); }
  function countryFact(code) { return COUNTRY[code] ? L10(COUNTRY[code].fact) : ""; }
  // The trailing emoji of the country's landmark (e.g. "Eiffel Tower 🗼").
  function landmarkEmoji(code) {
    var lm = COUNTRY[code] && COUNTRY[code].landmark && COUNTRY[code].landmark.en;
    var m = lm && lm.match(/(\p{Extended_Pictographic}[\uFE0F\u200D\p{Extended_Pictographic}]*)\s*$/u);
    return m ? m[1] : "🏙️";
  }
  function cityName(id) { return L10(L.CITY_BY_ID[id].name); }
  function fmt1(n) { return n >= 100 ? GE.num(n) : (Math.round(n * 10) / 10).toLocaleString(GE.lang === "he" ? "he-IL" : "en-US"); }

  var PEOPLE = ["🧒", "👩", "🧑", "👴", "👧", "🧔", "👵", "👦"];

  /* ---------------- live (every tick) ---------------- */
  var shownMoney = null;
  function renderLive() {
    var w = $("wallet");
    var m = Math.floor(state.money);
    if (shownMoney !== m) { w.textContent = GE.money(m); shownMoney = m; }
    $("rate").textContent = "⚡ " + t("perMin", { n: GE.num(L.totalAutoPerMin(state)) });
    var st = state.stands[state.view];
    // Queue of customers
    var q = $("queue");
    if (q.childElementCount !== st.queue) {
      var html = "";
      for (var i = 0; i < st.queue; i++) html += "<span>" + PEOPLE[(state.stats.cups + i) % PEOPLE.length] + "</span>";
      q.innerHTML = html;
    }
    $("waiting-chip").textContent = t("waiting", { n: st.queue });
    var tap = $("btn-tap");
    tap.innerHTML = t("tap") + " <span class='badge'>" + st.queue + "</span>";
    tap.classList.toggle("empty", st.queue === 0);
    renderGoal();
  }

  function renderGoal() {
    var M = L.MILESTONES, w = L.netWorth(state);
    var rank = state.milestone > 0 ? M[state.milestone - 1] : null;
    $("rank-label").textContent = (rank ? rank.icon + " " + L10(rank.name) : "🧒 " + t("rank0")) + " · " + t("fortune", { v: GE.money(w) });
    if (state.milestone < M.length) {
      var next = M[state.milestone], prev = state.milestone > 0 ? M[state.milestone - 1].at : 0;
      $("goal-label").textContent = t("nextGoal", { goal: next.icon + " " + GE.money(next.at) });
      var k = Math.max(0, Math.min(1, (w - prev) / (next.at - prev)));
      $("goal-fill").style.transform = "scaleX(" + k.toFixed(3) + ")";
    } else {
      $("goal-label").textContent = t("allDone");
      $("goal-fill").style.transform = "scaleX(1)";
    }
  }

  /* ---------------- static (on change) ---------------- */
  function renderStand() {
    var id = state.view, c = L.CITY_BY_ID[id], st = state.stands[id], W = L.WEATHER_BY_ID[st.weather];
    $("scene").className = "stand-scene " + st.weather;
    $("skyline").textContent = landmarkEmoji(c.code);
    $("city-flag").textContent = GE.flag(c.code);
    $("city-name").textContent = cityName(id);
    $("city-sub").textContent = countryName(c.code) + " · " + t("day", { n: state.day });
    $("weather-chip").textContent = t("weather", { icon: W.icon, name: L10(W.name) });
    $("helpers-chip").textContent = t("helpers", { n: st.helpers });
    var hr = ""; for (var i = 0; i < Math.min(st.helpers, 4); i++) hr += "🧑‍🍳";
    $("helpers-row").textContent = hr;

    // Price slider + teaching readouts
    var p = $("price");
    p.min = L.minPrice(state); p.max = L.maxPrice(state); p.value = st.price;
    p.setAttribute("aria-valuetext", "🪙" + st.price);
    $("price-label").textContent = t("priceLabel");
    $("price-title").textContent = t("priceTitle");
    renderReadouts();

    // Stand upgrades
    var hc = L.helperCost(state, id), kc = L.kioskCost(state, id), kMax = st.kiosk >= L.CFG.kioskMax;
    $("stand-ups").innerHTML = "<h2 class='card-h'>" + GE.esc(t("standUps", { city: cityName(id) })) + "</h2><div class='ups'>" +
      row("🧑‍🍳", t("helper"), t("helperD", { n: fmt1(L.CFG.helperRate * 60) }), t("helpers", { n: st.helpers }), "helper", hc, false) +
      row("🏪", t("kiosk"), t("kioskD"), t("level", { n: st.kiosk }) + " / " + L.CFG.kioskMax, "kiosk", kc, kMax) + "</div>";
    var fact = countryFact(c.code);
    $("fact").innerHTML = "<h2 class='card-h'>" + t("factTitle") + "</h2><p>" + GE.esc(fact) + "</p>";
    $("fact").hidden = !fact;
  }
  function row(icon, name, desc, lvl, act, cost, maxed) {
    return "<div class='up'><div class='ico'>" + icon + "</div><div><div class='uname'>" + GE.esc(name) + "</div><div class='udesc'>" + GE.esc(desc) +
      "</div><div class='lvl'>" + GE.esc(lvl) + "</div></div><button type='button' class='ge-btn ge-btn-good ge-btn-sm' data-act='" + act + "'" +
      (maxed || cost > state.money ? " disabled" : "") + ">" + (maxed ? t("maxed") : GE.money(cost)) + "</button></div>";
  }
  function renderReadouts() {
    var id = state.view, st = state.stands[id];
    var cust = L.arrivalRate(state, id) * 60;
    var profit = L.profitPerCup(state, id);
    $("price-out").textContent = "🪙" + st.price;
    $("ro-cust").textContent = fmt1(cust);
    $("ro-profit").textContent = "🪙" + fmt1(profit);
    $("ro-coins").textContent = "🪙" + fmt1(cust * profit);
    $("ro-cust-l").textContent = t("custL");
    $("ro-profit-l").textContent = t("profitL");
    $("ro-coins-l").textContent = t("coinsL");
    var best = L.bestPrice(state), sw = $("sweet");
    sw.classList.toggle("hit", st.price === best);
    sw.textContent = st.price === best ? t("sweetHit") : st.price < best - 1 ? t("tooLow") : st.price > best + 1 ? t("tooHigh") : t("sweetHint");
  }
  function refreshButtons() {
    // Cheap per-tick check so buttons light up the moment you can afford them.
    document.querySelectorAll("[data-act], [data-open], [data-up]").forEach(function (b) {
      var cost = +b.getAttribute("data-cost") || null;
      var act = b.getAttribute("data-act");
      if (act === "helper") cost = L.helperCost(state, state.view);
      else if (act === "kiosk") { if (state.stands[state.view].kiosk >= L.CFG.kioskMax) return; cost = L.kioskCost(state, state.view); }
      else if (b.hasAttribute("data-open")) cost = L.openCost(b.getAttribute("data-open"));
      else if (b.hasAttribute("data-up")) { var u = b.getAttribute("data-up"); if (state.up[u] >= L.UPGRADES[u].max) return; cost = L.upgradeCost(state, u); }
      if (cost != null) b.disabled = cost > state.money;
    });
  }

  function renderCities() {
    $("cities-title").textContent = t("citiesTitle");
    $("cities-hint").textContent = t("citiesHint");
    var html = "";
    L.CITIES.forEach(function (c) {
      var st = state.stands[c.id], W = L.WEATHER_BY_ID[st.weather];
      if (st.open) {
        html += "<button type='button' class='city' data-view='" + c.id + "' aria-current='" + (state.view === c.id) + "'>" +
          "<span class='flag' aria-hidden='true'>" + GE.flag(c.code) + "</span><span><span class='cname'>" + GE.esc(cityName(c.id)) + "</span><br>" +
          "<span class='cmeta'>" + GE.esc(countryName(c.code)) + " · " + W.icon + " · 🧑‍🍳" + st.helpers + (state.view === c.id ? " · " + t("here") : "") + "</span></span>" +
          "<span class='cside'>⚡ " + GE.money(L.autoIncomePerMin(state, c.id)) + "</span></button>";
      } else {
        html += "<button type='button' class='city locked' data-open='" + c.id + "'" + (L.openCost(c.id) > state.money ? " disabled" : "") + ">" +
          "<span class='flag' aria-hidden='true'>" + GE.flag(c.code) + "</span><span><span class='cname'>" + GE.esc(cityName(c.id)) + "</span><br>" +
          "<span class='cmeta'>" + GE.esc(countryName(c.code)) + " · " + t("closed") + "</span></span>" +
          "<span class='cside'>" + t("open") + " " + GE.money(L.openCost(c.id)) + "</span></button>";
      }
    });
    $("cities").innerHTML = html;
  }

  function renderHud() {
    $("btn-sound").textContent = GE.isMuted() ? "🔇" : "🔊";
    $("btn-sound").setAttribute("aria-label", t("sound"));
    $("btn-lang").textContent = GE.lang === "he" ? "EN" : "עב";
    $("btn-lang").setAttribute("aria-label", GE.lang === "he" ? "English" : "עברית");
    $("btn-home").setAttribute("aria-label", t("home"));
    $("btn-cities").textContent = view === "cities" ? t("stand") : t("cities");
    $("btn-ups").textContent = t("ups");
    document.title = t("title");
  }

  function render() {
    renderHud();
    if (view === "stand") renderStand(); else renderCities();
    renderLive();
  }
  function showView(v) {
    view = v;
    $("view-stand").hidden = v !== "stand";
    $("view-cities").hidden = v !== "cities";
    window.scrollTo(0, 0);
    render();
  }

  /* ---------------- events ---------------- */
  var autoGain = 0, autoFloatAt = 0;
  function handle(events) {
    var queue = [];
    events.forEach(function (e) {
      if (e.kind === "sold" && e.how === "auto" && e.city === state.view) autoGain += e.got;
      else if (e.kind === "newDay") { if (view === "stand") renderStand(); }
      else if (e.kind === "milestone") queue.push(e);
    });
    var now = performance.now();
    if (autoGain > 0 && now - autoFloatAt > 1200 && view === "stand") {
      GE.float($("helpers-row"), "+" + GE.num(autoGain), "gain");
      autoGain = 0; autoFloatAt = now;
    }
    playMilestones(queue);
  }
  function playMilestones(queue) {
    var e = queue.shift();
    if (!e) return;
    var m = L.MILESTONES[e.index];
    GE.sfx("win"); GE.confetti();
    var title = e.final ? t("win") : t("milestone");
    var body = e.final ? t("winBody", { v: GE.money(L.netWorth(state)) }) : t("milestoneBody", { name: L10(m.name), icon: m.icon });
    GE.modal({ icon: e.final ? "👑" : m.icon, title: title, body: "<p class='event-big'>" + GE.esc(body) + "</p>",
      actions: [{ label: e.final ? t("keepPlaying") : t("ok") }], onClose: function () { playMilestones(queue); } });
  }

  var tapStreak = 0, lastTap = 0;
  function onTap() {
    var ev = L.apply(state, { type: "tap" });
    var sold = ev.filter(function (e) { return e.kind === "sold"; })[0];
    var now = performance.now();
    tapStreak = now - lastTap < 900 ? tapStreak + 1 : 0;
    lastTap = now;
    if (sold) {
      GE.sfx("sell", { streak: tapStreak });
      GE.coinBurst($("btn-tap"), $("wallet"), 3);
      GE.float($("btn-tap"), "+" + fmt1(sold.got), "gain");
    } else {
      GE.sfx("whoops");
      GE.toast(t("noOne"), 1500);
    }
    renderLive();
    refreshButtons();
    handle(ev);
  }

  function buy(action, btn) {
    var ev = L.apply(state, action);
    var e = ev[0];
    if (!e || e.kind === "cant") { GE.sfx("whoops"); return; }
    GE.sfx("upgrade");
    if (btn) GE.float(btn, "⭐", "gain");
    GE.float($("wallet"), "−" + GE.num(e.cost), "loss");
    save();
    render();
    if (e.kind === "opened") {
      var c = L.CITY_BY_ID[e.city];
      GE.confetti();
      GE.modal({ icon: GE.flag(c.code), title: t("opened", { city: cityName(e.city) }),
        body: "<p>" + GE.esc(t("openedBody", { country: countryName(c.code) })) + "</p><p class='event-big'>💡 " + GE.esc(countryFact(c.code)) + "</p>",
        actions: [{ label: t("ok") }], onClose: function () { handle(ev); } });
    } else handle(ev);
  }

  function openUpgrades() {
    var body = document.createElement("div");
    function fill() {
      var html = "<div class='ups'>";
      ["recipe", "sign"].forEach(function (id) {
        var U = L.UPGRADES[id], lvl = state.up[id], maxed = lvl >= U.max, cost = L.upgradeCost(state, id);
        html += "<div class='up'><div class='ico'>" + U.icon + "</div><div><div class='uname'>" + t(id) + "</div><div class='udesc'>" + t(id + "D") + "</div>" +
          "<div class='lvl'>" + t("level", { n: lvl }) + " / " + U.max + "</div></div>" +
          "<button type='button' class='ge-btn ge-btn-good ge-btn-sm' data-up='" + id + "'" + (maxed || cost > state.money ? " disabled" : "") + ">" +
          (maxed ? t("maxed") : GE.money(cost)) + "</button></div>";
      });
      body.innerHTML = html + "</div><button type='button' class='reset-link' data-reset='1'>" + t("reset") + "</button>";
    }
    fill();
    body.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b || b.disabled) return;
      if (b.hasAttribute("data-up")) { buy({ type: "upgrade", which: b.getAttribute("data-up") }, b); fill(); }
      else if (b.hasAttribute("data-reset")) confirmReset();
    });
    GE.modal({ icon: "⭐", title: t("upsTitle"), body: body, actions: [{ label: t("close"), kind: "ghost" }] });
  }
  function confirmReset() {
    GE.modal({
      icon: "🔄", title: t("reset"), body: "<p>" + t("resetQ") + "</p>",
      actions: [
        { label: t("resetNo"), kind: "primary" },
        { label: t("resetYes"), kind: "ghost", onClick: function () { state = L.newGame(rng); save(); showView("stand"); showTutorial(); } }
      ]
    });
  }
  function showTutorial() { GE.modal({ icon: "🍋", title: t("tutTitle"), body: t("tutBody"), actions: [{ label: t("tutGo") }] }); }

  function awayTime(sec) {
    var mins = Math.round(sec / 60);
    return mins < 60 ? t("minutes", { n: mins }) : t("hours", { h: Math.floor(mins / 60), m: mins % 60 });
  }
  function applyOffline() {
    if (!state.lastSeen) return;
    var away = (Date.now() - state.lastSeen) / 1000;
    var r = L.offline(state, away);
    state.lastSeen = Date.now();
    if (r.got > 0) {
      save();
      render();
      GE.sfx("coin", { streak: 5 });
      GE.modal({ icon: "🌙", title: t("awayTitle"),
        body: "<p>" + GE.esc(t("awayBody", { time: awayTime(r.seconds) })) + "</p><p class='offline-big'>+" + GE.money(r.got) + "</p><p style='font-size:.85rem'>" + t("awayNote") + "</p>",
        actions: [{ label: t("ok") }], onClose: function () { handle(r.events || []); } });
      return true;
    }
    return false;
  }

  /* ---------------- loop ---------------- */
  var acc = 0, last = performance.now();
  function loop() {
    var now = performance.now();
    acc += Math.min(2, (now - last) / 1000); // a background tab never fast-forwards more than 2s here
    last = now;
    var ev = [];
    while (acc >= TICK) { acc -= TICK; ev = ev.concat(L.tick(state, TICK, rng)); }
    if (ev.length) handle(ev);
    renderLive();
    refreshButtons();
    if (view === "stand" && ev.some(function (e) { return e.kind === "newDay"; })) {
      var W = L.WEATHER_BY_ID[state.stands[state.view].weather];
      GE.toast(t("newDay", { icon: W.icon }), 1800);
      renderReadouts();
    }
    if (now - lastSaved > 5000) { save(); lastSaved = now; }
  }
  setInterval(loop, 250);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) save();
    else { last = performance.now(); applyOffline(); }
  });
  window.addEventListener("pagehide", save);

  /* ---------------- wiring ---------------- */
  $("btn-tap").addEventListener("click", onTap);
  $("price").addEventListener("input", function (e) {
    L.apply(state, { type: "price", city: state.view, price: +e.target.value });
    renderReadouts();
    $("rate").textContent = "⚡ " + t("perMin", { n: GE.num(L.totalAutoPerMin(state)) });
  });
  $("price").addEventListener("change", function () { GE.sfx("tap"); save(); });
  $("stand-ups").addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (!b || b.disabled) return;
    buy({ type: b.getAttribute("data-act"), city: state.view }, b);
  });
  $("cities").addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b || b.disabled) return;
    if (b.hasAttribute("data-view")) { GE.sfx("tap"); L.apply(state, { type: "view", city: b.getAttribute("data-view") }); save(); showView("stand"); }
    else if (b.hasAttribute("data-open")) {
      var id = b.getAttribute("data-open");
      buy({ type: "open", city: id }, b);
      L.apply(state, { type: "view", city: id });
      save(); showView("stand");
    }
  });
  $("btn-cities").addEventListener("click", function () { GE.sfx("tap"); showView(view === "cities" ? "stand" : "cities"); });
  $("btn-ups").addEventListener("click", function () { GE.sfx("tap"); openUpgrades(); });
  $("btn-sound").addEventListener("click", function () { GE.toggleMute(); renderHud(); GE.sfx("tap"); });
  $("btn-lang").addEventListener("click", function () { GE.setLang(GE.lang === "he" ? "en" : "he"); });
  GE.onLang(function () { render(); });

  showView("stand");
  if (fresh) showTutorial();
  else applyOffline();
  if (!GE.storageOK) setTimeout(function () { GE.toast(t("noSave"), 3500); }, 600);
  save();
  GE.registerSW("sw.js");
  window.__lemon = {
    get state() { return JSON.parse(JSON.stringify(state)); },
    // test hooks: swap in a crafted state; fast-forward the simulation deterministically
    replace: function (s) { state = s; shownMoney = null; save(); render(); },
    away: function (sec) { state.lastSeen = Date.now() - sec * 1000; applyOffline(); },
    advance: function (sec) { var ev = []; for (var i = 0; i < sec / TICK; i++) ev = ev.concat(L.tick(state, TICK, rng)); handle(ev); render(); }
  };
})();
