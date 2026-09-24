/* Pirate Trader — DOM rendering and input. All rules live in logic.js. */
(function () {
  "use strict";
  var L = window.PirateLogic;
  var SAVE_KEY = "pirate-trader-v1";
  var $ = function (id) { return document.getElementById(id); };

  /* ---------------- text ---------------- */
  GE.setDict({
    he: {
      title: "סוחר הים 🏴‍☠️", home: "חזרה למשחקים", sound: "צליל", day: "יום {n}", hold: "📦 {n}/{max}",
      market: "🛒 השוק בנמל", legend: "🟢 זול כאן · 🔴 מבוקש כאן — קונים בזול ומוכרים ביוקר!",
      cheap: "🟢 זול", wanted: "🔴 מבוקש", have: "יש לך {n}", paid: "שילמת {p}",
      sell: "מכירה", buy: "קנייה", fish: "🎣 דיג", ship: "🛠️ הספינה", map: "🧭 הפלגה",
      back: "↩️ חזרה", sailTo: "⛵ הפליגו!", pickDest: "בחרו נמל", mapTitle: "🗺️ לאן מפליגים?",
      days: "{n} ימים", day1: "יום אחד", supplies: "🪙{n} אספקה", makes: "מייצר", wants: "רוצה",
      locked: "🔒 צריך מפות ניווט", here: "אתם כאן",
      sailing: "מפליגים ל{port}…", sailingDay: "יום {d} מתוך {n}",
      rank0: "מלח צעיר", nextGoal: "היעד הבא: {goal}", allDone: "הגעתם לכל היעדים! 👑", fortune: "הון: {v}",
      harborTitle: "🧑‍✈️ מנהל הנמל", harborQ: "אהוי! באיזו מדינה נמצא הנמל {port}?",
      quizRight: "נכון! 🎉 קיבלתם {r} טיפ.", quizWrong: "כמעט! הנמל נמצא ב{country}.",
      firstVisit: "נמל חדש! 🗺️",
      cantFull: "הספינה מלאה! 📦 מכרו משהו או שדרגו את המחסן.", cantMoney: "אין מספיק מטבעות — נסו לדוג 🎣",
      fished: "דגתם דגים ומכרתם אותם: {n} 🐟", nothing: "אין מה למכור",
      upTitle: "🛠️ שדרוג הספינה", level: "רמה {n}", maxed: "מקסימום", buyUp: "{c}",
      up_hold: "מחסן גדול יותר", up_hold_d: "+10 מקום למטען",
      up_sails: "מפרשים מהירים", up_sails_d: "הפלגות קצרות יותר, וקל יותר לברוח",
      up_cannons: "תותחים", up_cannons_d: "ניצחון בתחרות הכדורים מול שודדים",
      up_hull: "גוף ספינה חזק", up_hull_d: "מאבדים פחות מטען בסערות",
      up_charts: "מפות ניווט", up_charts_d: "פותח נמלים באסיה ובאוקיאניה",
      close: "סגירה", reset: "להתחיל משחק חדש", resetQ: "להתחיל מההתחלה? כל ההתקדמות תימחק.",
      resetYes: "כן, משחק חדש", resetNo: "לא, להמשיך",
      pirates: "🏴‍☠️ שודדי ים!", piratesBody: "קפטן זקן-מצחיק חוסם את הדרך ומבקש מס של {toll}",
      flee: "⛵ לברוח ({p}%)", fight: "💥 תחרות כדורים ({p}%) · פרס {loot}", pay: "🤝 לשלם {toll}",
      fled: "זזזום! ברחתם מהשודדים 💨", caught: "הם השיגו אתכם… שילמתם {n}",
      fightWon: "ספלאש! ניצחתם בתחרות! +{n}", fightLost: "אופס, הם ניצחו הפעם. שילמתם {n}",
      paidToll: "השודדים מנופפים לשלום 👋 (שילמתם {n})",
      storm: "⛈️ סערה!", stormLost: "{n} {good} נפלו לים.", stormSafe: "הספינה החזקה שמרה על כל המטען! 💪", stormEmpty: "הספינה התנדנדה, אבל לא היה מטען לאבד.",
      treasure: "🏝️ אי מטמון!", treasureBody: "מצאתם תיבה עם {n}!",
      dolphins: "🐬 דולפינים!", dolphinsBody: "דולפינים שוחים ליד הספינה. עובדה על {country}:",
      tailwind: "🌬️ רוח גבית!", tailwindBody: "הגעתם מהר יותר וחסכתם {n} אספקה.",
      crewTook: "לא היו מספיק מטבעות לאספקה, אז הצוות לקח מטען כתשלום: {list}",
      ok: "יופי!", onward: "ממשיכים ⛵",
      milestone: "דרגה חדשה!", milestoneBody: "אתם עכשיו {name}! {icon}",
      win: "קברניט אגדי! 👑", winBody: "הגעתם להון של {v}! אפשר להמשיך לשחק ולהגדיל את האוצר.",
      keepPlaying: "ממשיכים להפליג",
      tutTitle: "ברוכים הבאים, קברניט! ⚓",
      tutBody: "<p>🟢 קנו סחורה <b>זולה</b> בנמל.</p><p>🧭 הפליגו לנמל שבו היא <b>מבוקשת</b> 🔴.</p><p>🪙 מכרו ביוקר, שדרגו את הספינה והגיעו להון של 10,000 מטבעות!</p>",
      tutGo: "יאללה, מפליגים!",
      noSave: "שימו לב: ההתקדמות לא תישמר במכשיר הזה."
    },
    en: {
      title: "Pirate Trader 🏴‍☠️", home: "Back to games", sound: "Sound", day: "Day {n}", hold: "📦 {n}/{max}",
      market: "🛒 Harbour market", legend: "🟢 cheap here · 🔴 wanted here — buy low, sell high!",
      cheap: "🟢 cheap", wanted: "🔴 wanted", have: "you have {n}", paid: "paid {p}",
      sell: "Sell", buy: "Buy", fish: "🎣 Fish", ship: "🛠️ Ship", map: "🧭 Set sail",
      back: "↩️ Back", sailTo: "⛵ Sail!", pickDest: "Pick a port", mapTitle: "🗺️ Where to, captain?",
      days: "{n} days", day1: "1 day", supplies: "🪙{n} supplies", makes: "makes", wants: "wants",
      locked: "🔒 Needs navigator charts", here: "You are here",
      sailing: "Sailing to {port}…", sailingDay: "Day {d} of {n}",
      rank0: "Deckhand", nextGoal: "Next: {goal}", allDone: "Every goal reached! 👑", fortune: "Fortune: {v}",
      harborTitle: "🧑‍✈️ Harbour master", harborQ: "Ahoy! Which country is {port} in?",
      quizRight: "Right! 🎉 Here's a {r} tip.", quizWrong: "Nearly! This port is in {country}.",
      firstVisit: "New port! 🗺️",
      cantFull: "The hold is full! 📦 Sell something or upgrade the hold.", cantMoney: "Not enough coins — try fishing 🎣",
      fished: "You caught fish and sold them for {n}! 🐟", nothing: "Nothing to sell",
      upTitle: "🛠️ Upgrade your ship", level: "Level {n}", maxed: "Max", buyUp: "{c}",
      up_hold: "Bigger hold", up_hold_d: "+10 cargo space",
      up_sails: "Faster sails", up_sails_d: "Shorter voyages, easier escapes",
      up_cannons: "Cannons", up_cannons_d: "Win cannonball contests with pirates",
      up_hull: "Strong hull", up_hull_d: "Lose less cargo in storms",
      up_charts: "Navigator charts", up_charts_d: "Unlocks ports in Asia & Oceania",
      close: "Close", reset: "Start a new game", resetQ: "Start over? All progress will be erased.",
      resetYes: "Yes, new game", resetNo: "No, keep playing",
      pirates: "🏴‍☠️ Pirates!", piratesBody: "Captain Silly-Beard blocks the way and asks for a {toll} toll.",
      flee: "⛵ Outrun them ({p}%)", fight: "💥 Cannonball contest ({p}%) · prize {loot}", pay: "🤝 Pay {toll}",
      fled: "Zoom! You got away 💨", caught: "They caught up… you paid {n}.",
      fightWon: "Splash! You won the contest! +{n}", fightLost: "Oops, they won this time. You paid {n}.",
      paidToll: "The pirates wave goodbye 👋 (you paid {n})",
      storm: "⛈️ A storm!", stormLost: "{n} {good} washed overboard.", stormSafe: "Your strong hull kept every crate safe! 💪", stormEmpty: "The ship rocked, but there was no cargo to lose.",
      treasure: "🏝️ Treasure island!", treasureBody: "You found a chest with {n}!",
      dolphins: "🐬 Dolphins!", dolphinsBody: "Dolphins race the ship. A fact about {country}:",
      tailwind: "🌬️ Tailwind!", tailwindBody: "You arrived early and saved {n} of supplies.",
      crewTook: "Coins didn't cover supplies, so the crew took cargo as pay: {list}",
      ok: "Great!", onward: "Onward ⛵",
      milestone: "New rank!", milestoneBody: "You are now a {name}! {icon}",
      win: "Legendary Captain! 👑", winBody: "You reached a fortune of {v}! Keep sailing to grow your treasure.",
      keepPlaying: "Keep sailing",
      tutTitle: "Welcome aboard, captain! ⚓",
      tutBody: "<p>🟢 Buy goods that are <b>cheap</b> at this port.</p><p>🧭 Sail to a port where they're <b>wanted</b> 🔴.</p><p>🪙 Sell high, upgrade your ship and reach 🪙10,000!</p>",
      tutGo: "Let's sail!",
      noSave: "Heads up: progress can't be saved on this device."
    }
  });
  var t = GE.t, L10 = GE.L;

  /* ---------------- state ---------------- */
  var rng = GE.rng((Date.now() ^ (Math.random() * 1e9)) >>> 0);
  var state = GE.load(SAVE_KEY, null);
  var fresh = !state || state.v !== 1;
  if (fresh) state = L.newGame(rng);
  var qtyMode = GE.load("pirate-trader-qty", 1);
  var selectedDest = null;
  var sellStreak = 0;
  var busy = false; // true while the voyage animation runs

  function save() { GE.save(SAVE_KEY, state); }

  var COUNTRY = {};
  if (typeof COUNTRIES !== "undefined") COUNTRIES.forEach(function (c) { COUNTRY[c.code] = c; });
  function countryName(code) { return COUNTRY[code] ? L10(COUNTRY[code].name) : code.toUpperCase(); }
  function countryFact(code) { return COUNTRY[code] ? L10(COUNTRY[code].fact) : ""; }
  function goodName(id) { return L10(L.GOOD_BY_ID[id].name); }
  function goodIcon(id) { return L.GOOD_BY_ID[id].icon; }
  function portName(id) { return L10(L.PORT_BY_ID[id].name); }

  /* ---------------- HUD ---------------- */
  var shownMoney = state.money;
  function renderHud() {
    var w = $("wallet");
    if (shownMoney !== state.money) GE.countUp(w, shownMoney, state.money);
    else w.textContent = GE.money(state.money);
    shownMoney = state.money;
    $("btn-sound").textContent = GE.isMuted() ? "🔇" : "🔊";
    $("btn-sound").setAttribute("aria-label", t("sound"));
    $("btn-lang").textContent = GE.lang === "he" ? "EN" : "עב";
    $("btn-lang").setAttribute("aria-label", GE.lang === "he" ? "English" : "עברית");
    $("btn-home").setAttribute("aria-label", t("home"));
    document.title = t("title");
  }

  /* ---------------- port view ---------------- */
  function renderPort() {
    var p = L.PORT_BY_ID[state.port];
    $("port-flag").textContent = GE.flag(p.code);
    $("port-name").textContent = portName(p.id);
    $("port-sub").textContent = countryName(p.code);
    $("day-chip").textContent = "📅 " + t("day", { n: state.day });
    var hc = $("hold-chip");
    hc.textContent = t("hold", { n: L.cargoCount(state), max: L.capacity(state) });
    hc.classList.toggle("full", L.cargoCount(state) >= L.capacity(state));

    // Progress toward the next milestone
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

    renderHarbor();
    renderMarket();
    $("market-title").textContent = t("market");
    $("legend").textContent = t("legend");
    $("btn-fish").textContent = t("fish");
    $("btn-ship").textContent = t("ship");
    $("btn-map").textContent = t("map");
  }

  function renderHarbor() {
    var box = $("harbor");
    var q = state.quiz;
    if (!q || q.port !== state.port || (q.done && !q.result)) { box.hidden = true; return; }
    box.hidden = false;
    var p = L.PORT_BY_ID[q.port];
    var html = "<h2>" + t("harborTitle") + "</h2>";
    if (!q.done) {
      html += "<p>" + GE.esc(t("harborQ", { port: portName(p.id) })) + "</p><div class='quiz-opts'>";
      q.options.forEach(function (code) {
        html += "<button type='button' class='ge-btn ge-btn-ghost' data-quiz='" + code + "'><span class='flag'>" +
          GE.flag(code) + "</span> " + GE.esc(countryName(code)) + "</button>";
      });
      html += "</div>";
    } else {
      html += "<p>" + GE.esc(q.result === "right" ? t("quizRight", { r: GE.money(L.CFG.quizReward) }) : t("quizWrong", { country: countryName(p.code) })) + "</p>";
      var fact = countryFact(p.code);
      if (fact) html += "<p class='fact'>💡 " + GE.esc(fact) + "</p>";
    }
    box.innerHTML = html;
  }

  var lastPrices = {};
  function renderMarket() {
    var list = $("goods");
    var rows = [];
    L.GOODS.forEach(function (g) {
      var bp = L.buyPrice(state, state.port, g.id), sp = L.sellPrice(state, state.port, g.id);
      var tag = L.tagFor(state.port, g.id);
      var have = state.cargo[g.id], paid = state.paid[g.id];
      var sellCls = have > 0 ? (sp >= paid ? " profit" : " loss") : "";
      rows.push(
        "<div class='good' data-good='" + g.id + "'>" +
          "<div class='good-icon' aria-hidden='true'>" + g.icon + "</div>" +
          "<div><div class='good-name'>" + GE.esc(goodName(g.id)) + "</div><div class='good-meta'>" +
            (tag === "cheap" ? "<span class='tag tag-cheap'>" + t("cheap") + "</span>" : "") +
            (tag === "wanted" ? "<span class='tag tag-wanted'>" + t("wanted") + "</span>" : "") +
            (have > 0 ? "<span class='have'>" + t("have", { n: have }) + "</span><span>" + t("paid", { p: "🪙" + paid }) + "</span>" : "") +
          "</div></div>" +
          "<button type='button' class='ge-btn trade sell" + sellCls + "' data-sell='" + g.id + "'" + (have > 0 ? "" : " disabled") +
            " aria-label='" + GE.esc(t("sell") + " " + goodName(g.id) + " 🪙" + sp) + "'>" + t("sell") + "<b>🪙" + sp + "</b></button>" +
          "<button type='button' class='ge-btn trade buy' data-buy='" + g.id + "'" +
            " aria-label='" + GE.esc(t("buy") + " " + goodName(g.id) + " 🪙" + bp) + "'>" + t("buy") + "<b>🪙" + bp + "</b></button>" +
        "</div>");
    });
    list.innerHTML = rows.join("");
    // Flash prices that moved since the last render at this port
    L.GOODS.forEach(function (g) {
      var key = state.port + ":" + g.id;
      var bp = L.buyPrice(state, state.port, g.id);
      if (lastPrices[key] != null && lastPrices[key] !== bp) {
        GE.flash(list.querySelector("[data-buy='" + g.id + "']"), bp > lastPrices[key] ? "up" : "down");
      }
      lastPrices[key] = bp;
    });
    document.querySelectorAll("#qty-group button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(String(qtyMode) === b.getAttribute("data-qty")));
    });
  }

  function qtyFor(kind, goodId) {
    if (qtyMode === "max") return kind === "buy" ? Math.max(1, L.maxBuy(state, goodId)) : state.cargo[goodId];
    return qtyMode;
  }

  /* ---------------- actions ---------------- */
  function act(action) {
    var before = state.money;
    var res = L.apply(state, action, rng);
    save();
    return { events: res.events, delta: state.money - before };
  }

  function onBuy(goodId, btn) {
    var r = act({ type: "buy", good: goodId, qty: qtyFor("buy", goodId) });
    var e = r.events[0];
    if (e.kind === "bought") {
      GE.sfx("buy");
      GE.float(btn, "+" + e.qty + " " + goodIcon(goodId), "info");
      GE.float($("wallet"), "−" + GE.num(e.spent), "loss");
      sellStreak = 0;
    } else {
      GE.sfx("whoops");
      GE.toast(e.reason === "full" ? t("cantFull") : t("cantMoney"));
    }
    render();
    handleMilestones(r.events);
  }

  function onSell(goodId, btn) {
    var r = act({ type: "sell", good: goodId, qty: Math.max(1, qtyFor("sell", goodId)) });
    var e = r.events[0];
    if (e && e.kind === "sold") {
      sellStreak++;
      GE.sfx("sell", { streak: sellStreak });
      GE.coinBurst(btn, $("wallet"), Math.min(10, 3 + e.qty));
      GE.float(btn, "+" + GE.num(e.got), "gain");
    }
    render();
    handleMilestones(r.events);
  }

  function onQuiz(code) {
    var r = act({ type: "quiz", answer: code });
    var e = r.events.filter(function (x) { return x.kind === "quiz"; })[0];
    if (!e) return;
    state.quiz.result = e.right ? "right" : "wrong";
    save();
    if (e.right) { GE.sfx("coin"); GE.coinBurst($("harbor"), $("wallet"), 5); }
    else GE.sfx("whoops");
    render();
    handleMilestones(r.events);
  }

  function onFish() {
    var r = act({ type: "fish" });
    GE.sfx("coin");
    GE.coinBurst($("btn-fish"), $("wallet"), 4);
    GE.toast(t("fished", { n: GE.money(r.events[0].got) }));
    render();
    handleMilestones(r.events);
  }

  /* ---------------- ship / upgrades ---------------- */
  function openShip() {
    var body = document.createElement("div");
    function fill() {
      var html = "<div class='ups'>";
      L.UPGRADE_IDS.forEach(function (id) {
        var U = L.UPGRADES[id], lvl = state.up[id], maxed = L.upgradeMaxed(state, id);
        var cost = L.upgradeCost(state, id);
        html += "<div class='up'><div class='ico'>" + U.icon + "</div><div><div class='uname'>" + t("up_" + id) + "</div>" +
          "<div class='udesc'>" + t("up_" + id + "_d") + "</div>" +
          "<div class='lvl'>" + (U.max > 1 ? t("level", { n: lvl }) + " / " + U.max : "") + "</div></div>" +
          "<button type='button' class='ge-btn ge-btn-good ge-btn-sm' data-up='" + id + "'" +
          (maxed || cost > state.money ? " disabled" : "") + ">" + (maxed ? t("maxed") : GE.money(cost)) + "</button></div>";
      });
      html += "</div><button type='button' class='reset-link' data-reset='1'>" + t("reset") + "</button>";
      body.innerHTML = html;
    }
    fill();
    body.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.hasAttribute("data-up")) {
        var r = act({ type: "upgrade", which: b.getAttribute("data-up") });
        if (r.events[0].kind === "upgraded") {
          GE.sfx("upgrade");
          GE.float(b, "⭐", "gain");
          GE.float($("wallet"), "−" + GE.num(r.events[0].cost), "loss");
        }
        fill(); render();
        handleMilestones(r.events);
      } else if (b.hasAttribute("data-reset")) {
        confirmReset();
      }
    });
    GE.modal({ icon: "⛵", title: t("upTitle"), body: body, actions: [{ label: t("close"), kind: "ghost" }] });
  }

  function confirmReset() {
    GE.modal({
      icon: "🔄", title: t("reset"), body: "<p>" + t("resetQ") + "</p>",
      actions: [
        { label: t("resetNo"), kind: "primary" },
        { label: t("resetYes"), kind: "ghost", onClick: function () {
          state = L.newGame(rng); lastPrices = {}; shownMoney = state.money; save(); showView("port"); render(); showTutorial();
        } }
      ]
    });
  }

  /* ---------------- map ---------------- */
  // Stylised continents (lon, lat) — hand-simplified, no map assets needed.
  var LAND = [
    [[-168,65],[-140,70],[-95,72],[-80,63],[-62,56],[-55,48],[-70,43],[-76,35],[-81,25],[-97,26],[-97,18],[-88,15],[-83,9],[-78,8],[-90,14],[-105,20],[-112,30],[-118,34],[-124,40],[-124,48],[-135,58],[-150,60],[-165,60]],
    [[-78,8],[-72,12],[-62,10],[-50,0],[-35,-5],[-35,-9],[-40,-22],[-48,-28],[-58,-38],[-65,-45],[-68,-55],[-74,-50],[-72,-30],[-71,-18],[-76,-14],[-81,-5],[-80,0]],
    [[-10,36],[-9,43],[-2,44],[-5,48],[0,50],[5,53],[8,57],[5,62],[15,69],[28,71],[45,68],[70,73],[100,77],[140,72],[180,68],[180,65],[160,60],[142,53],[140,46],[130,42],[127,35],[122,30],[120,23],[110,20],[106,10],[100,13],[103,1],[98,8],[98,16],[92,22],[88,22],[80,15],[77,8],[72,20],[67,25],[57,25],[56,27],[50,30],[48,30],[55,22],[52,17],[43,13],[40,20],[35,28],[34,31],[36,36],[27,37],[26,40],[22,37],[20,40],[15,38],[12,44],[8,44],[3,43],[-2,37]],
    [[-17,15],[-17,21],[-13,28],[-6,35],[10,37],[20,32],[32,31],[34,28],[43,12],[51,12],[40,-2],[40,-15],[35,-25],[27,-34],[18,-35],[12,-17],[13,-5],[9,4],[-5,5],[-13,8]],
    [[114,-22],[122,-18],[130,-12],[137,-12],[142,-11],[146,-19],[153,-26],[150,-37],[140,-38],[132,-32],[116,-35]],
    [[-5,50],[1,51],[2,53],[-2,57],[-5,58],[-6,55],[-3,54],[-5,52]],
    [[130,31],[135,34],[140,36],[142,40],[140,42],[137,37],[132,34]],
    [[95,5],[106,-6],[104,-5],[98,2]], [[105,-6],[114,-8],[106,-7]], [[109,1],[116,7],[119,1],[116,-4],[110,-3]],
    [[44,-25],[50,-15],[49,-12],[43,-17]],
    [[-45,60],[-20,70],[-20,80],[-60,82],[-70,76],[-55,65]]
  ];
  var MAP = { lon0: -100, lon1: 165, lat0: 68, lat1: -46, k: 2 };
  function proj(lat, lon) { return { x: (lon - MAP.lon0) * MAP.k, y: (MAP.lat0 - lat) * MAP.k }; }

  function renderMap() {
    var W = (MAP.lon1 - MAP.lon0) * MAP.k, H = (MAP.lat0 - MAP.lat1) * MAP.k;
    var svg = "<svg viewBox='0 0 " + W + " " + H + "' role='img' aria-label='" + GE.esc(t("mapTitle")) + "'>" +
      "<rect class='map-sea' width='" + W + "' height='" + H + "' rx='14'/>";
    for (var gx = -90; gx <= 150; gx += 30) { var px = proj(0, gx).x; svg += "<line class='map-grid' x1='" + px + "' y1='0' x2='" + px + "' y2='" + H + "'/>"; }
    for (var gy = -30; gy <= 60; gy += 30) { var py = proj(gy, 0).y; svg += "<line class='map-grid' x1='0' y1='" + py + "' x2='" + W + "' y2='" + py + "'/>"; }
    LAND.forEach(function (poly) {
      svg += "<polygon class='map-land' points='" + poly.map(function (pt) { var q = proj(pt[1], pt[0]); return q.x.toFixed(1) + "," + q.y.toFixed(1); }).join(" ") + "'/>";
    });
    var here = L.PORT_BY_ID[state.port];
    if (selectedDest) {
      var a = proj(here.lat, here.lon), b = proj(L.PORT_BY_ID[selectedDest].lat, L.PORT_BY_ID[selectedDest].lon);
      var mx = (a.x + b.x) / 2, my = Math.min(a.y, b.y) - 30;
      svg += "<path class='map-route' d='M" + a.x + "," + a.y + " Q" + mx + "," + my + " " + b.x + "," + b.y + "'/>";
    }
    L.PORTS.forEach(function (p) {
      var q = proj(p.lat, p.lon);
      var cls = "map-pin" + (!L.portOpen(state, p.id) ? " locked" : "") + (p.id === state.port ? " here" : "") + (p.id === selectedDest ? " sel" : "");
      svg += "<circle class='" + cls + "' cx='" + q.x + "' cy='" + q.y + "' r='" + (p.id === state.port || p.id === selectedDest ? 7 : 5) + "'/>";
      if (p.id === state.port || p.id === selectedDest) {
        svg += "<text class='map-label' x='" + (q.x + 9) + "' y='" + (q.y + 4) + "'>" + GE.esc(portName(p.id)) + "</text>";
      }
    });
    svg += "</svg>";
    $("map").innerHTML = svg;
    $("map-title").textContent = t("mapTitle");
  }

  function renderDests() {
    var here = state.port;
    var ports = L.PORTS.filter(function (p) { return p.id !== here; }).map(function (p) {
      return { p: p, days: L.voyageDays(state, here, p.id), open: L.portOpen(state, p.id) };
    }).sort(function (a, b) { return (b.open - a.open) || (a.days - b.days); });
    var html = "";
    ports.forEach(function (d) {
      var p = d.p, cost = L.voyageCost(state, p.id);
      var afford = L.canAffordVoyage(state, p.id);
      var meta = d.open
        ? t("wants") + " " + p.wants.map(goodIcon).join(" ") + (p.makes.length ? " · " + t("makes") + " " + p.makes.map(goodIcon).join(" ") : "")
        : t("locked");
      html += "<button type='button' class='dest' data-dest='" + p.id + "' aria-pressed='" + (selectedDest === p.id) + "'" +
        (d.open && afford ? "" : " disabled") + ">" +
        "<span class='flag' aria-hidden='true'>" + GE.flag(p.code) + "</span>" +
        "<span><span class='dname'>" + GE.esc(portName(p.id)) + "</span><br><span class='dmeta'>" + GE.esc(countryName(p.code)) + " · " + meta + "</span></span>" +
        "<span class='dcost'>" + (d.days === 1 ? t("day1") : t("days", { n: d.days })) + "<small>" + t("supplies", { n: cost }) + "</small></span></button>";
    });
    $("dests").innerHTML = html;
    var sail = $("btn-sail");
    sail.disabled = !selectedDest;
    sail.textContent = selectedDest ? t("sailTo") + " " + portName(selectedDest) : t("pickDest");
    $("btn-back").textContent = t("back");
  }

  function showView(v) {
    $("view-port").hidden = v !== "port";
    $("view-map").hidden = v !== "map";
    $("bar-port").hidden = v !== "port";
    $("bar-map").hidden = v !== "map";
    window.scrollTo(0, 0);
    if (v === "map") { renderMap(); renderDests(); }
  }

  /* ---------------- voyage ---------------- */
  function sail() {
    if (!selectedDest || busy) return;
    var to = selectedDest;
    var r = act({ type: "sail", to: to });
    var sailed = r.events.filter(function (e) { return e.kind === "sailed"; })[0];
    if (!sailed) { GE.sfx("whoops"); GE.toast(t("cantMoney")); return; }
    selectedDest = null;
    busy = true;
    GE.sfx("sail");
    var ov = $("voyage"), ship = $("voyage-ship");
    ov.hidden = false;
    var dur = GE.reducedMotion ? 300 : Math.min(3000, 1400 + sailed.days * 220);
    var dist = window.innerWidth - 80;
    var dir = GE.lang === "he" ? -1 : 1;
    ship.style.transition = "none";
    ship.style.transform = "translateX(0)";
    var start = performance.now();
    function frame(now) {
      var k = Math.min(1, (now - start) / dur);
      var d = Math.max(1, Math.ceil(k * sailed.days));
      $("voyage-label").textContent = t("sailing", { port: portName(to) }) + "\n" + t("sailingDay", { d: d, n: sailed.days });
      ship.style.transform = "translateX(" + (dir * dist * k) + "px) translateY(" + (Math.sin(now / 180) * 4) + "px)";
      if (k < 1) requestAnimationFrame(frame);
      else finishVoyage(r.events);
    }
    requestAnimationFrame(frame);
  }

  function finishVoyage(events) {
    $("voyage").hidden = true;
    busy = false;
    showView("port");
    render();
    playEvents(events.slice());
  }

  // Show voyage/arrival events one after another as friendly modals.
  function playEvents(queue) {
    var e = queue.shift();
    if (!e) return;
    var next = function () { playEvents(queue); };
    switch (e.kind) {
      case "sailed":
        if (e.crewTook) {
          var list = Object.keys(e.crewTook).map(function (g) { return e.crewTook[g] + " " + goodIcon(g); }).join(", ");
          GE.modal({ icon: "🧑‍🍳", title: t("ship"), body: "<p>" + GE.esc(t("crewTook", { list: list })) + "</p>", actions: [{ label: t("ok") }], onClose: next });
        } else next();
        return;
      case "storm":
        GE.sfx("whoops");
        var body = e.good == null ? t("stormEmpty") : e.lost === 0 ? t("stormSafe") : t("stormLost", { n: e.lost, good: goodIcon(e.good) + " " + goodName(e.good) });
        GE.modal({ icon: "⛈️", title: t("storm"), body: "<p class='event-big'>" + GE.esc(body) + "</p>", actions: [{ label: t("onward") }], onClose: next });
        return;
      case "treasure":
        GE.sfx("coin", { streak: 4 });
        GE.modal({ icon: "🏝️", title: t("treasure"), body: "<p class='event-big'>" + GE.esc(t("treasureBody", { n: GE.money(e.got) })) + "</p>",
          actions: [{ label: t("ok") }], onClose: function () { GE.coinBurst($("scene"), $("wallet"), 8); next(); } });
        return;
      case "dolphins":
        GE.sfx("event");
        var code = L.PORT_BY_ID[e.port].code;
        GE.modal({ icon: "🐬", title: t("dolphins"),
          body: "<p>" + GE.esc(t("dolphinsBody", { country: countryName(code) })) + "</p><p class='event-big'>💡 " + GE.esc(countryFact(code)) + "</p>",
          actions: [{ label: t("ok") }], onClose: next });
        return;
      case "tailwind":
        GE.sfx("event");
        GE.modal({ icon: "🌬️", title: t("tailwind"), body: "<p class='event-big'>" + GE.esc(t("tailwindBody", { n: GE.money(e.got) })) + "</p>", actions: [{ label: t("ok") }], onClose: next });
        return;
      case "pirates":
        GE.sfx("splash");
        GE.modal({
          icon: "🏴‍☠️", title: t("pirates"), dismissable: false,
          body: "<p class='event-big'>" + GE.esc(t("piratesBody", { toll: GE.money(e.toll) })) + "</p>",
          actions: [
            { label: GE.esc(t("flee", { p: Math.round(e.flee * 100) })), kind: "primary", id: "pirate-flee", onClick: function () { resolvePirates("flee", queue); } },
            { label: GE.esc(t("fight", { p: Math.round(e.fight * 100), loot: GE.money(e.loot) })), kind: "warm", id: "pirate-fight", onClick: function () { resolvePirates("fight", queue); } },
            { label: GE.esc(t("pay", { toll: GE.money(e.toll) })), kind: "ghost", id: "pirate-pay", onClick: function () { resolvePirates("pay", queue); } }
          ]
        });
        return;
      case "arrived":
        GE.sfx("event");
        if (e.first) GE.float($("port-name"), t("firstVisit"), "info");
        next();
        return;
      case "milestone":
        showMilestone(e, next);
        return;
      default:
        next();
    }
  }

  function resolvePirates(choice, queue) {
    var r = act({ type: "pirates", choice: choice });
    var e = r.events[0], msg, icon;
    if (e.kind === "fled") { msg = t("fled"); icon = "💨"; GE.sfx("sail"); }
    else if (e.kind === "caught") { msg = t("caught", { n: GE.money(e.lost) }); icon = "🏴‍☠️"; GE.sfx("whoops"); }
    else if (e.kind === "fightWon") { msg = t("fightWon", { n: GE.money(e.got) }); icon = "🎉"; GE.sfx("win"); }
    else if (e.kind === "fightLost") { msg = t("fightLost", { n: GE.money(e.lost) }); icon = "💦"; GE.sfx("whoops"); }
    else { msg = t("paidToll", { n: GE.money(e.lost) }); icon = "👋"; GE.sfx("tap"); }
    render();
    // Show the outcome after this modal closes.
    setTimeout(function () {
      GE.modal({ icon: icon, title: t("pirates"), body: "<p class='event-big'>" + GE.esc(msg) + "</p>", actions: [{ label: t("onward") }],
        onClose: function () { playEvents(r.events.slice(1).concat(queue)); } });
    }, 0);
  }

  function showMilestone(e, next) {
    var m = L.MILESTONES[e.index];
    GE.sfx("win");
    GE.confetti();
    if (e.final) {
      GE.modal({ icon: "👑", title: t("win"), body: "<p class='event-big'>" + GE.esc(t("winBody", { v: GE.money(L.netWorth(state)) })) + "</p>",
        actions: [{ label: t("keepPlaying") }], onClose: next });
    } else {
      GE.modal({ icon: m.icon, title: t("milestone"), body: "<p class='event-big'>" + GE.esc(t("milestoneBody", { name: L10(m.name), icon: m.icon })) + "</p>",
        actions: [{ label: t("ok") }], onClose: next });
    }
  }
  function handleMilestones(events) {
    playEvents(events.filter(function (e) { return e.kind === "milestone"; }));
  }

  function showTutorial() {
    GE.modal({ icon: "🏴‍☠️", title: t("tutTitle"), body: t("tutBody"), actions: [{ label: t("tutGo") }] });
  }

  /* ---------------- wiring ---------------- */
  function render() {
    renderHud();
    renderPort();
    if (!$("view-map").hidden) { renderMap(); renderDests(); }
  }

  $("goods").addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b || b.disabled) return;
    if (b.hasAttribute("data-buy")) onBuy(b.getAttribute("data-buy"), b);
    else if (b.hasAttribute("data-sell")) onSell(b.getAttribute("data-sell"), b);
  });
  $("harbor").addEventListener("click", function (e) {
    var b = e.target.closest("[data-quiz]");
    if (b) onQuiz(b.getAttribute("data-quiz"));
  });
  $("qty-group").addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    var v = b.getAttribute("data-qty");
    qtyMode = v === "max" ? "max" : parseInt(v, 10);
    GE.save("pirate-trader-qty", qtyMode);
    GE.sfx("tap");
    renderMarket();
  });
  $("btn-fish").addEventListener("click", onFish);
  $("btn-ship").addEventListener("click", function () { GE.sfx("tap"); openShip(); });
  $("btn-map").addEventListener("click", function () { GE.sfx("tap"); selectedDest = null; showView("map"); });
  $("btn-back").addEventListener("click", function () { GE.sfx("tap"); showView("port"); });
  $("btn-sail").addEventListener("click", sail);
  $("dests").addEventListener("click", function (e) {
    var b = e.target.closest("[data-dest]");
    if (!b || b.disabled) return;
    GE.sfx("tap");
    selectedDest = b.getAttribute("data-dest");
    renderMap(); renderDests();
  });
  $("btn-sound").addEventListener("click", function () { GE.toggleMute(); renderHud(); GE.sfx("tap"); });
  $("btn-lang").addEventListener("click", function () { GE.setLang(GE.lang === "he" ? "en" : "he"); });
  GE.onLang(function () { render(); });

  render();
  // Resume a pirate encounter interrupted by a reload.
  if (state.pending && state.pending.type === "pirates") {
    playEvents([{ kind: "pirates", toll: state.pending.toll, loot: state.pending.loot, flee: L.fleeChance(state), fight: L.fightChance(state) }]);
  } else if (fresh) {
    showTutorial();
  }
  if (!GE.storageOK) setTimeout(function () { GE.toast(t("noSave"), 3500); }, 600);
  save();
  GE.registerSW("sw.js");

  // Tiny test hook (read-only snapshot) used by tests/e2e.js.
  window.__pirate = { get state() { return JSON.parse(JSON.stringify(state)); } };
})();
