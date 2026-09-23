/* Merchant Caravan — DOM rendering and input. All rules live in logic.js. */
(function () {
  "use strict";
  var L = window.CaravanLogic;
  var SAVE_KEY = "merchant-caravan-v1";
  var $ = function (id) { return document.getElementById(id); };

  GE.setDict({
    he: {
      title: "שיירת הסוחרים 🐫", home: "חזרה למשחקים", sound: "צליל", day: "יום {n}",
      load: "🐪×{c} · 📦 {n}/{max}", team: "🛡️ שומרים: {g}", stamps: "🗺️ {n}/{max}",
      market: "🛒 הבזאר", legend: "🟢 זול כאן · 🔴 מבוקש כאן · 📜 יש הזמנה",
      cheap: "🟢 זול", wanted: "🔴 מבוקש", orderTag: "📜 הזמנה", have: "יש לך {n}", paid: "שילמת {p}",
      sell: "מכירה", buy: "קנייה", job: "🧺 עבודה", teamBtn: "🐪 השיירה", map: "🗺️ לדרך",
      back: "↩️ חזרה", go: "🐫 יוצאים!", pickDest: "בחרו עיר", permitBtn: "🔓 היתר",
      mapTitle: "🗺️ דרך המשי", mapHint: "אפשר לנסוע רק בדרכים שמחוברות לעיר שלכם. דרך מקווקוות צריכה היתר.",
      days: "{n} ימים", day1: "יום אחד", wantsW: "רוצה", makesW: "מייצר", food: "🪙{n} אוכל ושכר", locked: "🔒 צריך היתר: {c}", orderAt: "📜 מזמינים {qty} {icon}",
      trekking: "בדרך ל{city}…", trekDay: "יום {d} מתוך {n}",
      rank0: "סוחר מתחיל", nextGoal: "היעד הבא: {goal}", allDone: "הגעתם לכל היעדים! 👑", fortune: "הון: {v}",
      orderTitle: "📜 הזמנה מסוחר העיר", orderWant: "{qty} {good}", orderMeta: "פרס: {r} · עד יום {d}",
      orderSoon: "הסוחר יפרסם הזמנה חדשה ביום {d}.", orderLate: "נגמר הזמן להזמנה הזו — הזמנה חדשה תגיע בקרוב.",
      deliver: "📦 למסור ולקבל {r}", needMore: "יש לך {have} מתוך {qty}",
      orderElsewhere: "הזמנות בערים אחרות מופיעות במפה 📜",
      journal: "📖 יומן המסע", journalFact: "💡 {fact}", stampsLabel: "חותמות של ערים שביקרתם:",
      cantFull: "הגמלים עמוסים! 📦 מכרו משהו או קנו עוד גמל.", cantMoney: "אין מספיק מטבעות — נסו עבודה בבזאר 🧺",
      jobDone: "סחבתם סחורה לסוחרים אחרים וקיבלתם {n} 🧺",
      teamTitle: "🐪 השיירה שלכם", teamSum: "{c} גמלים · {g} שומרים · הוצאה ליום בדרך: 🪙{d}",
      camel: "גמל נוסף", camelD: "+10 מקום למטען, אוכל 🪙1 ליום", guard: "שומר", guardD: "מבריח שודדים, שכר 🪙3 ליום בדרך",
      count: "{n} / {max}", maxed: "מקסימום",
      close: "סגירה", reset: "להתחיל משחק חדש", resetQ: "להתחיל מההתחלה? כל ההתקדמות תימחק.", resetYes: "כן, משחק חדש", resetNo: "לא, להמשיך",
      bandits: "🏜️ שודדי מדבר!", banditsBody: "שודדים עוצרים את השיירה ורוצים חלק מהסחורה.",
      optGuards: "🛡️ השומרים יבריחו אותם ({p}%)", optGuardsNone: "🛡️ אין שומרים (25%)", optGift: "🎁 לתת מתנה {fee}", optRun: "🐪 לברוח מהר (50%)",
      scared: "השומרים הבריחו את השודדים! 💪", gift: "השודדים לקחו את המתנה ונעלמו 👋 (שילמתם {n})", escaped: "הגמלים רצו מהר וברחתם! 💨",
      robbed: "השודדים לקחו {n} {good}.", robbedNone: "השודדים לא מצאו כלום לקחת 🤷",
      sandstorm: "🌪️ סופת חול!", sandstormBody: "חיכיתם יום נוסף עד שהסופה עברה ({n} אוכל ושכר).",
      nomads: "🏕️ נוודים ידידותיים", nomadsBody: "הנוודים נתנו לכם מתנה: {qty} {good}!",
      oasis: "🌴 נווה מדבר!", oasisBody: "מצאתם מים ופירות בחינם וחסכתם {n}.",
      story: "🔥 סיפור ליד המדורה", storyBody: "מספר סיפורים בחאן סיפר לכם על {country}:",
      crewTook: "לא היו מספיק מטבעות לאוכל, אז הנהגים לקחו סחורה: {list}",
      permitTitle: "🔓 היתר מעבר", permitBody: "לקנות היתר לדרך {a} ↔ {b} ב-{c}? אחרי זה אפשר לנסוע בה תמיד.", permitYes: "לקנות היתר", permitNo: "לא עכשיו",
      permitDone: "הדרך פתוחה! 🎉",
      delivered: "ההזמנה נמסרה! קיבלתם {n} 🎉",
      ok: "יופי!", onward: "ממשיכים 🐫",
      milestone: "דרגה חדשה!", milestoneBody: "אתם עכשיו {name}! {icon}",
      win: "אדון דרך המשי! 👑", winBody: "הגעתם להון של {v}! אפשר להמשיך לסחור ולהגדיל את האוצר.", keepPlaying: "ממשיכים לסחור",
      tutTitle: "ברוכים הבאים לדרך המשי! 🐫",
      tutBody: "<p>🟢 קנו סחורה <b>זולה</b> בבזאר.</p><p>🗺️ צאו לעיר שכנה שבה היא <b>מבוקשת</b> 🔴 — או שיש בה <b>הזמנה</b> 📜.</p><p>🐪 קנו גמלים, שכרו שומרים ופתחו דרכים חדשות עד לונציה ולשיאן!</p>",
      tutGo: "יוצאים לדרך!",
      noSave: "שימו לב: ההתקדמות לא תישמר במכשיר הזה."
    },
    en: {
      title: "Merchant Caravan 🐫", home: "Back to games", sound: "Sound", day: "Day {n}",
      load: "🐪×{c} · 📦 {n}/{max}", team: "🛡️ Guards: {g}", stamps: "🗺️ {n}/{max}",
      market: "🛒 Bazaar", legend: "🟢 cheap here · 🔴 wanted here · 📜 on order",
      cheap: "🟢 cheap", wanted: "🔴 wanted", orderTag: "📜 order", have: "you have {n}", paid: "paid {p}",
      sell: "Sell", buy: "Buy", job: "🧺 Work", teamBtn: "🐪 Caravan", map: "🗺️ Travel",
      back: "↩️ Back", go: "🐫 Let's go!", pickDest: "Pick a city", permitBtn: "🔓 Permit",
      mapTitle: "🗺️ The Silk Road", mapHint: "You can only travel along roads from your city. Dotted roads need a permit.",
      days: "{n} days", day1: "1 day", wantsW: "wants", makesW: "makes", food: "🪙{n} food & wages", locked: "🔒 Permit needed: {c}", orderAt: "📜 wants {qty} {icon}",
      trekking: "On the road to {city}…", trekDay: "Day {d} of {n}",
      rank0: "New Trader", nextGoal: "Next: {goal}", allDone: "Every goal reached! 👑", fortune: "Fortune: {v}",
      orderTitle: "📜 Order from a local merchant", orderWant: "{qty} {good}", orderMeta: "Reward: {r} · by day {d}",
      orderSoon: "The merchant will post a new order on day {d}.", orderLate: "This order ran out of time — a new one is coming soon.",
      deliver: "📦 Deliver for {r}", needMore: "You have {have} of {qty}",
      orderElsewhere: "Orders in other cities show up on the map 📜",
      journal: "📖 Travel journal", journalFact: "💡 {fact}", stampsLabel: "Stamps from cities you've visited:",
      cantFull: "The camels are full! 📦 Sell something or buy another camel.", cantMoney: "Not enough coins — try working at the bazaar 🧺",
      jobDone: "You carried goods for other merchants and earned {n} 🧺",
      teamTitle: "🐪 Your caravan", teamSum: "{c} camels · {g} guards · cost per road-day: 🪙{d}",
      camel: "Another camel", camelD: "+10 cargo space, eats 🪙1 a day", guard: "Guard", guardD: "Scares off bandits, paid 🪙3 a road-day",
      count: "{n} / {max}", maxed: "Max",
      close: "Close", reset: "Start a new game", resetQ: "Start over? All progress will be erased.", resetYes: "Yes, new game", resetNo: "No, keep playing",
      bandits: "🏜️ Desert bandits!", banditsBody: "Bandits stop the caravan and want some of your goods.",
      optGuards: "🛡️ Guards chase them off ({p}%)", optGuardsNone: "🛡️ No guards (25%)", optGift: "🎁 Give a gift {fee}", optRun: "🐪 Make a run for it (50%)",
      scared: "Your guards chased the bandits away! 💪", gift: "The bandits took the gift and left 👋 (you paid {n})", escaped: "The camels ran fast and you got away! 💨",
      robbed: "The bandits took {n} {good}.", robbedNone: "The bandits found nothing to take 🤷",
      sandstorm: "🌪️ Sandstorm!", sandstormBody: "You waited an extra day for the storm to pass ({n} food & wages).",
      nomads: "🏕️ Friendly nomads", nomadsBody: "The nomads gave you a gift: {qty} {good}!",
      oasis: "🌴 Oasis!", oasisBody: "Free water and fruit — you saved {n}.",
      story: "🔥 Campfire story", storyBody: "A storyteller at the inn told you about {country}:",
      crewTook: "Coins didn't cover food, so the drivers took some goods: {list}",
      permitTitle: "🔓 Road permit", permitBody: "Buy a permit for the {a} ↔ {b} road for {c}? You can use it forever after.", permitYes: "Buy permit", permitNo: "Not now",
      permitDone: "The road is open! 🎉",
      delivered: "Order delivered! You earned {n} 🎉",
      ok: "Great!", onward: "Onward 🐫",
      milestone: "New rank!", milestoneBody: "You are now a {name}! {icon}",
      win: "Master of the Silk Road! 👑", winBody: "You reached a fortune of {v}! Keep trading to grow your treasure.", keepPlaying: "Keep trading",
      tutTitle: "Welcome to the Silk Road! 🐫",
      tutBody: "<p>🟢 Buy goods that are <b>cheap</b> at the bazaar.</p><p>🗺️ Travel to a neighbouring city where they're <b>wanted</b> 🔴 — or where there's an <b>order</b> 📜.</p><p>🐪 Buy camels, hire guards and open roads all the way to Venice and Xi'an!</p>",
      tutGo: "Hit the road!",
      noSave: "Heads up: progress can't be saved on this device."
    }
  });
  var t = GE.t, L10 = GE.L;

  var rng = GE.rng((Date.now() ^ (Math.random() * 1e9)) >>> 0);
  var state = GE.load(SAVE_KEY, null);
  var fresh = !state || state.v !== 1;
  if (fresh) state = L.newGame(rng);
  var qtyMode = GE.load("merchant-caravan-qty", 1);
  var selectedDest = null;
  var sellStreak = 0;
  var busy = false;
  function save() { GE.save(SAVE_KEY, state); }

  var COUNTRY = {};
  if (typeof COUNTRIES !== "undefined") COUNTRIES.forEach(function (c) { COUNTRY[c.code] = c; });
  function countryName(code) { return COUNTRY[code] ? L10(COUNTRY[code].name) : code.toUpperCase(); }
  function countryFact(code) { return COUNTRY[code] ? L10(COUNTRY[code].fact) : ""; }
  function goodName(id) { return L10(L.GOOD_BY_ID[id].name); }
  function goodIcon(id) { return L.GOOD_BY_ID[id].icon; }
  function cityName(id) { return L10(L.CITY_BY_ID[id].name); }

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

  /* ---------------- city view ---------------- */
  function renderCity() {
    var c = L.CITY_BY_ID[state.city];
    $("city-flag").textContent = GE.flag(c.code);
    $("city-name").textContent = cityName(c.id);
    $("city-sub").textContent = countryName(c.code);
    $("day-chip").textContent = "📅 " + t("day", { n: state.day });
    var lc = $("load-chip");
    lc.textContent = t("load", { c: state.camels, n: L.cargoCount(state), max: L.capacity(state) });
    lc.classList.toggle("full", L.cargoCount(state) >= L.capacity(state));
    $("team-chip").textContent = t("team", { g: state.guards });
    $("stamp-chip").textContent = t("stamps", { n: Object.keys(state.visited).length, max: L.CITIES.length });
    var camels = ""; for (var i = 0; i < Math.min(state.camels, 5); i++) camels += "<span>🐫</span>";
    $("scene-camels").innerHTML = camels;

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
    renderOrder();
    renderMarket();
    renderJournal();
    $("market-title").textContent = t("market");
    $("legend").textContent = t("legend");
    $("btn-job").textContent = t("job");
    $("btn-team").textContent = t("teamBtn");
    $("btn-map").textContent = t("map");
  }

  function renderOrder() {
    var box = $("order");
    var k = state.contracts[state.city];
    var html = "<h2>" + t("orderTitle") + "</h2>";
    box.classList.remove("waiting");
    if (state.day < k.from) {
      box.classList.add("waiting");
      html += "<p class='meta'>" + GE.esc(t("orderSoon", { d: k.from })) + "</p>";
    } else if (state.day > k.due) {
      box.classList.add("waiting");
      html += "<p class='meta'>" + GE.esc(t("orderLate")) + "</p>";
    } else {
      var have = state.cargo[k.good];
      html += "<div class='want'><span class='big' aria-hidden='true'>" + goodIcon(k.good) + "</span><span>" +
        GE.esc(t("orderWant", { qty: k.qty, good: goodName(k.good) })) + "</span></div>" +
        "<p class='meta'>" + GE.esc(t("orderMeta", { r: GE.money(k.reward), d: k.due })) + " · " + GE.esc(t("needMore", { have: have, qty: k.qty })) + "</p>" +
        "<button type='button' class='ge-btn ge-btn-good' id='btn-deliver'" + (L.canDeliver(state) ? "" : " disabled") + ">" +
        GE.esc(t("deliver", { r: GE.money(k.reward) })) + "</button>";
    }
    html += "<p class='meta' style='margin:8px 0 0'>" + t("orderElsewhere") + "</p>";
    box.innerHTML = html;
  }

  var lastPrices = {};
  function renderMarket() {
    var k = state.contracts[state.city];
    var orderGood = L.contractOpen(state, state.city) ? k.good : null;
    var rows = [];
    L.GOODS.forEach(function (g) {
      var bp = L.buyPrice(state, state.city, g.id), sp = L.sellPrice(state, state.city, g.id);
      var tag = L.tagFor(state.city, g.id), have = state.cargo[g.id], paid = state.paid[g.id];
      var sellCls = have > 0 ? (sp >= paid ? " profit" : " loss") : "";
      rows.push(
        "<div class='good' data-good='" + g.id + "'>" +
        "<div class='good-icon' aria-hidden='true'>" + g.icon + "</div>" +
        "<div><div class='good-name'>" + GE.esc(goodName(g.id)) + "</div><div class='good-meta'>" +
        (tag === "cheap" ? "<span class='tag tag-cheap'>" + t("cheap") + "</span>" : "") +
        (tag === "wanted" ? "<span class='tag tag-wanted'>" + t("wanted") + "</span>" : "") +
        (orderGood === g.id ? "<span class='tag tag-order'>" + t("orderTag") + "</span>" : "") +
        (have > 0 ? "<span class='have'>" + t("have", { n: have }) + "</span>" + (paid > 0 ? "<span>" + t("paid", { p: "🪙" + paid }) + "</span>" : "") : "") +
        "</div></div>" +
        "<button type='button' class='ge-btn trade sell" + sellCls + "' data-sell='" + g.id + "'" + (have > 0 ? "" : " disabled") +
        " aria-label='" + GE.esc(t("sell") + " " + goodName(g.id) + " 🪙" + sp) + "'>" + t("sell") + "<b>🪙" + sp + "</b></button>" +
        "<button type='button' class='ge-btn trade buy' data-buy='" + g.id + "' aria-label='" + GE.esc(t("buy") + " " + goodName(g.id) + " 🪙" + bp) + "'>" +
        t("buy") + "<b>🪙" + bp + "</b></button></div>");
    });
    var list = $("goods");
    list.innerHTML = rows.join("");
    L.GOODS.forEach(function (g) {
      var key = state.city + ":" + g.id, bp = L.buyPrice(state, state.city, g.id);
      if (lastPrices[key] != null && lastPrices[key] !== bp) GE.flash(list.querySelector("[data-buy='" + g.id + "']"), bp > lastPrices[key] ? "up" : "down");
      lastPrices[key] = bp;
    });
    document.querySelectorAll("#qty-group button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(String(qtyMode) === b.getAttribute("data-qty")));
    });
  }

  function renderJournal() {
    var c = L.CITY_BY_ID[state.city];
    var fact = countryFact(c.code);
    var html = "<h2>" + t("journal") + "</h2>" + (fact ? "<p class='fact'>" + GE.esc(t("journalFact", { fact: fact })) + "</p>" : "") +
      "<p class='meta' style='margin-top:8px;color:var(--ink-soft);font-size:.85rem'>" + t("stampsLabel") + "</p><div class='stamps'>";
    L.CITIES.forEach(function (x) {
      var got = !!state.visited[x.id];
      html += "<span class='stamp" + (got ? " got" : "") + "' title='" + GE.esc(cityName(x.id)) + "' aria-label='" + GE.esc(cityName(x.id)) + "'>" + GE.flag(x.code) + "</span>";
    });
    $("journal").innerHTML = html + "</div>";
  }

  function qtyFor(kind, goodId) {
    if (qtyMode === "max") return kind === "buy" ? Math.max(1, L.maxBuy(state, goodId)) : state.cargo[goodId];
    return qtyMode;
  }

  /* ---------------- actions ---------------- */
  function act(action) {
    var res = L.apply(state, action, rng);
    save();
    return res.events;
  }
  function onBuy(goodId, btn) {
    var ev = act({ type: "buy", good: goodId, qty: qtyFor("buy", goodId) });
    var e = ev[0];
    if (e.kind === "bought") {
      GE.sfx("buy"); sellStreak = 0;
      GE.float(btn, "+" + e.qty + " " + goodIcon(goodId), "info");
      GE.float($("wallet"), "−" + GE.num(e.spent), "loss");
    } else { GE.sfx("whoops"); GE.toast(e.reason === "full" ? t("cantFull") : t("cantMoney")); }
    render(); playEvents(milestonesOf(ev));
  }
  function onSell(goodId, btn) {
    var ev = act({ type: "sell", good: goodId, qty: Math.max(1, qtyFor("sell", goodId)) });
    var e = ev[0];
    if (e && e.kind === "sold") {
      sellStreak++;
      GE.sfx("sell", { streak: sellStreak });
      GE.coinBurst(btn, $("wallet"), Math.min(10, 3 + e.qty));
      GE.float(btn, "+" + GE.num(e.got), "gain");
    }
    render(); playEvents(milestonesOf(ev));
  }
  function onDeliver() {
    var btn = $("btn-deliver");
    var ev = act({ type: "deliver" });
    var e = ev[0];
    if (e.kind !== "delivered") return;
    GE.sfx("win");
    GE.coinBurst(btn, $("wallet"), 10);
    GE.confetti();
    GE.toast(t("delivered", { n: GE.money(e.got) }));
    render(); playEvents(milestonesOf(ev));
  }
  function onJob() {
    var ev = act({ type: "job" });
    GE.sfx("coin");
    GE.coinBurst($("btn-job"), $("wallet"), 4);
    GE.toast(t("jobDone", { n: GE.money(ev[0].got) }));
    render(); playEvents(milestonesOf(ev));
  }
  function milestonesOf(ev) { return ev.filter(function (e) { return e.kind === "milestone"; }); }

  /* ---------------- caravan (camels & guards) ---------------- */
  function openTeam() {
    var body = document.createElement("div");
    function fill() {
      var cc = L.camelCost(state), maxC = state.camels >= L.CFG.maxCamels, maxG = state.guards >= L.CFG.maxGuards;
      body.innerHTML =
        "<p class='team-sum'>" + GE.esc(t("teamSum", { c: state.camels, g: state.guards, d: L.dailyCost(state) })) + "</p><div class='ups'>" +
        "<div class='up'><div class='ico'>🐫</div><div><div class='uname'>" + t("camel") + "</div><div class='udesc'>" + t("camelD") + "</div>" +
        "<div class='lvl'>" + t("count", { n: state.camels, max: L.CFG.maxCamels }) + "</div></div>" +
        "<button type='button' class='ge-btn ge-btn-good ge-btn-sm' data-team='camel'" + (maxC || cc > state.money ? " disabled" : "") + ">" + (maxC ? t("maxed") : GE.money(cc)) + "</button></div>" +
        "<div class='up'><div class='ico'>🛡️</div><div><div class='uname'>" + t("guard") + "</div><div class='udesc'>" + t("guardD") + "</div>" +
        "<div class='lvl'>" + t("count", { n: state.guards, max: L.CFG.maxGuards }) + "</div></div>" +
        "<button type='button' class='ge-btn ge-btn-good ge-btn-sm' data-team='guard'" + (maxG || L.CFG.guardHire > state.money ? " disabled" : "") + ">" + (maxG ? t("maxed") : GE.money(L.CFG.guardHire)) + "</button></div>" +
        "</div><button type='button' class='reset-link' data-reset='1'>" + t("reset") + "</button>";
    }
    fill();
    body.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b || b.disabled) return;
      if (b.hasAttribute("data-team")) {
        var ev = act({ type: b.getAttribute("data-team") });
        var r = ev[0];
        if (r.kind === "camel" || r.kind === "guard") {
          GE.sfx("upgrade");
          GE.float(b, r.kind === "camel" ? "🐫" : "🛡️", "gain");
          GE.float($("wallet"), "−" + GE.num(r.cost), "loss");
        }
        fill(); render(); playEvents(milestonesOf(ev));
      } else if (b.hasAttribute("data-reset")) confirmReset();
    });
    GE.modal({ icon: "🐪", title: t("teamTitle"), body: body, actions: [{ label: t("close"), kind: "ghost" }] });
  }
  function confirmReset() {
    GE.modal({
      icon: "🔄", title: t("reset"), body: "<p>" + t("resetQ") + "</p>",
      actions: [
        { label: t("resetNo"), kind: "primary" },
        { label: t("resetYes"), kind: "ghost", onClick: function () {
          state = L.newGame(rng); lastPrices = {}; shownMoney = state.money; save(); showView("city"); render(); showTutorial();
        } }
      ]
    });
  }

  /* ---------------- route map ---------------- */
  var MAP = { lon0: 6, lon1: 114, lat0: 49, lat1: 24, kx: 5, ky: 7 };
  function proj(c) { return { x: (c.lon - MAP.lon0) * MAP.kx, y: (MAP.lat0 - c.lat) * MAP.ky }; }
  function renderMap() {
    var W = (MAP.lon1 - MAP.lon0) * MAP.kx, H = (MAP.lat0 - MAP.lat1) * MAP.ky;
    var here = state.city, nb = L.neighbours(here);
    var svg = "<svg viewBox='0 0 " + W + " " + H + "' role='img' aria-label='" + GE.esc(t("mapTitle")) + "'>" +
      "<rect class='m-bg' width='" + W + "' height='" + H + "' rx='14'/>" +
      // Mediterranean & Caspian hints so the map reads as geography
      "<ellipse class='m-sea' cx='" + proj({ lon: 20, lat: 36 }).x + "' cy='" + proj({ lon: 20, lat: 36 }).y + "' rx='70' ry='24'/>" +
      "<ellipse class='m-sea' cx='" + proj({ lon: 50.5, lat: 42 }).x + "' cy='" + proj({ lon: 50.5, lat: 42 }).y + "' rx='12' ry='30'/>";
    L.ROADS.forEach(function (r) {
      var a = proj(L.CITY_BY_ID[r[0]]), b = proj(L.CITY_BY_ID[r[1]]);
      var open = L.hasPermit(state, r[0], r[1]);
      var touches = r[0] === here || r[1] === here;
      var isSel = selectedDest && touches && (r[0] === selectedDest || r[1] === selectedDest);
      var cls = "m-road" + (open ? "" : " locked") + (touches && open ? " next" : "") + (isSel ? " sel" : "");
      svg += "<line class='" + cls + "' x1='" + a.x + "' y1='" + a.y + "' x2='" + b.x + "' y2='" + b.y + "'/>";
      if (!open) svg += "<text class='m-order' x='" + ((a.x + b.x) / 2 - 7) + "' y='" + ((a.y + b.y) / 2 + 5) + "'>🔒</text>";
    });
    L.CITIES.forEach(function (c) {
      var p = proj(c);
      var cls = "m-city" + (c.id === here ? " here" : "") + (c.id === selectedDest ? " sel" : "");
      svg += "<circle class='" + cls + "' cx='" + p.x + "' cy='" + p.y + "' r='" + (c.id === here || nb.indexOf(c.id) >= 0 ? 9 : 6) + "'/>";
      var below = c.id === "delhi" || c.id === "cairo" || c.id === "baghdad" || c.id === "merv";
      svg += "<text class='m-label' text-anchor='middle' x='" + p.x + "' y='" + (below ? p.y + 24 : p.y - 14) + "'>" + GE.esc(cityName(c.id)) + "</text>";
      if (L.contractOpen(state, c.id)) svg += "<text class='m-order' x='" + (p.x + 8) + "' y='" + (p.y + 4) + "'>📜</text>";
    });
    $("map").innerHTML = svg + "</svg>";
    $("map-title").textContent = t("mapTitle");
    $("map-hint").textContent = t("mapHint");
  }

  function renderDests() {
    var here = state.city;
    var html = "";
    L.neighbours(here).forEach(function (id) {
      var c = L.CITY_BY_ID[id], days = L.tripDays(here, id), cost = L.tripCost(state, id);
      var open = L.hasPermit(state, here, id);
      var k = state.contracts[id];
      var orderInfo = L.contractOpen(state, id) ? t("orderAt", { qty: k.qty, icon: goodIcon(k.good) }) : "";
      var meta = open
        ? t("wantsW") + " " + c.wants.map(goodIcon).join(" ") + (c.makes.length ? " · " + t("makesW") + " " + c.makes.map(goodIcon).join(" ") : "") + (orderInfo ? " · " + orderInfo : "")
        : t("locked", { c: GE.money(L.permitCost(here, id)) });
      var afford = open ? L.canAffordTrip(state, id) : L.permitCost(here, id) <= state.money;
      html += "<button type='button' class='dest" + (open ? "" : " locked") + "' data-dest='" + id + "' data-open='" + open + "' aria-pressed='" + (selectedDest === id) + "'" + (afford ? "" : " disabled") + ">" +
        "<span class='flag' aria-hidden='true'>" + GE.flag(c.code) + "</span>" +
        "<span><span class='dname'>" + GE.esc(cityName(id)) + "</span><br><span class='dmeta'>" + GE.esc(countryName(c.code)) + " · " + meta + "</span></span>" +
        "<span class='dcost'>" + (open ? (days === 1 ? t("day1") : t("days", { n: days })) + "<small>" + t("food", { n: cost }) + "</small>" : t("permitBtn")) + "</span></button>";
    });
    $("dests").innerHTML = html;
    var go = $("btn-go");
    go.disabled = !selectedDest;
    go.textContent = selectedDest ? t("go") + " " + cityName(selectedDest) : t("pickDest");
    $("btn-back").textContent = t("back");
  }

  function showView(v) {
    $("view-city").hidden = v !== "city";
    $("view-map").hidden = v !== "map";
    $("bar-city").hidden = v !== "city";
    $("bar-map").hidden = v !== "map";
    window.scrollTo(0, 0);
    if (v === "map") { renderMap(); renderDests(); }
  }

  function askPermit(to) {
    var here = state.city, cost = L.permitCost(here, to);
    GE.modal({
      icon: "🔓", title: t("permitTitle"),
      body: "<p class='event-big'>" + GE.esc(t("permitBody", { a: cityName(here), b: cityName(to), c: GE.money(cost) })) + "</p>",
      actions: [
        { label: t("permitYes"), kind: "good", id: "permit-yes", disabled: cost > state.money, onClick: function () {
          var ev = act({ type: "permit", to: to });
          if (ev[0].kind === "permit") {
            GE.sfx("upgrade"); GE.toast(t("permitDone"));
            GE.float($("wallet"), "−" + GE.num(ev[0].cost), "loss");
            selectedDest = to;
          }
          render(); playEvents(milestonesOf(ev));
        } },
        { label: t("permitNo"), kind: "ghost" }
      ]
    });
  }

  /* ---------------- travel ---------------- */
  function travel() {
    if (!selectedDest || busy) return;
    var to = selectedDest;
    var ev = act({ type: "travel", to: to });
    var trip = ev.filter(function (e) { return e.kind === "travelled"; })[0];
    if (!trip) { GE.sfx("whoops"); GE.toast(t("cantMoney")); return; }
    selectedDest = null; busy = true;
    GE.sfx("sail");
    var ov = $("trek"), camels = $("trek-camels");
    var line = ""; for (var i = 0; i < Math.min(state.camels, 6); i++) line += "🐫";
    camels.textContent = line;
    ov.hidden = false;
    var dur = GE.reducedMotion ? 300 : Math.min(3000, 1400 + trip.days * 260);
    var dist = window.innerWidth + camels.offsetWidth;
    var dir = GE.lang === "he" ? -1 : 1;
    var flip = GE.lang === "he" ? "" : " scaleX(-1)";
    var start = performance.now();
    function frame(now) {
      var k = Math.min(1, (now - start) / dur);
      var d = Math.max(1, Math.ceil(k * trip.days));
      $("trek-label").textContent = t("trekking", { city: cityName(to) }) + "\n" + t("trekDay", { d: d, n: trip.days });
      camels.style.transform = "translateX(" + (dir * (dist * k - camels.offsetWidth)) + "px) translateY(" + (Math.abs(Math.sin(now / 160)) * -4) + "px)" + flip;
      if (k < 1) requestAnimationFrame(frame);
      else { ov.hidden = true; busy = false; showView("city"); render(); playEvents(ev.slice()); }
    }
    requestAnimationFrame(frame);
  }

  function playEvents(queue) {
    var e = queue.shift();
    if (!e) return;
    var next = function () { playEvents(queue); };
    function info(icon, title, body, label, after) {
      GE.modal({ icon: icon, title: title, body: "<p class='event-big'>" + GE.esc(body) + "</p>", actions: [{ label: label || t("ok") }], onClose: after || next });
    }
    switch (e.kind) {
      case "travelled":
        if (e.crewTook) {
          var list = Object.keys(e.crewTook).map(function (g) { return e.crewTook[g] + " " + goodIcon(g); }).join(", ");
          info("🧑‍🌾", t("teamBtn"), t("crewTook", { list: list }));
        } else next();
        return;
      case "sandstorm": GE.sfx("whoops"); info("🌪️", t("sandstorm"), t("sandstormBody", { n: GE.money(e.lost) }), t("onward")); return;
      case "nomads": GE.sfx("coin", { streak: 3 }); info("🏕️", t("nomads"), t("nomadsBody", { qty: e.qty, good: goodIcon(e.good) + " " + goodName(e.good) })); return;
      case "oasis": GE.sfx("event"); info("🌴", t("oasis"), t("oasisBody", { n: GE.money(e.got) })); return;
      case "story":
        GE.sfx("event");
        var code = L.CITY_BY_ID[e.city].code;
        GE.modal({ icon: "🔥", title: t("story"), body: "<p>" + GE.esc(t("storyBody", { country: countryName(code) })) + "</p><p class='event-big'>💡 " + GE.esc(countryFact(code)) + "</p>",
          actions: [{ label: t("ok") }], onClose: next });
        return;
      case "bandits":
        GE.sfx("splash");
        GE.modal({
          icon: "🏜️", title: t("bandits"), dismissable: false,
          body: "<p class='event-big'>" + GE.esc(t("banditsBody")) + "</p>",
          actions: [
            { label: GE.esc(e.guards > 0 ? t("optGuards", { p: Math.round(e.guardChance * 100) }) : t("optGuardsNone")), kind: "primary", id: "bandit-guards", onClick: function () { resolveBandits("guards", queue); } },
            { label: GE.esc(t("optGift", { fee: GE.money(e.fee) })), kind: "warm", id: "bandit-gift", onClick: function () { resolveBandits("gift", queue); } },
            { label: GE.esc(t("optRun")), kind: "ghost", id: "bandit-run", onClick: function () { resolveBandits("run", queue); } }
          ]
        });
        return;
      case "arrived":
        GE.sfx("event");
        if (e.first) GE.float($("city-name"), "🗺️ +1", "info");
        next();
        return;
      case "milestone":
        var m = L.MILESTONES[e.index];
        GE.sfx("win"); GE.confetti();
        if (e.final) info("👑", t("win"), t("winBody", { v: GE.money(L.netWorth(state)) }), t("keepPlaying"));
        else info(m.icon, t("milestone"), t("milestoneBody", { name: L10(m.name), icon: m.icon }));
        return;
      default: next();
    }
  }

  function resolveBandits(choice, queue) {
    var ev = act({ type: "bandits", choice: choice });
    var e = ev[0], msg, icon;
    if (e.kind === "scared") { msg = t("scared"); icon = "🛡️"; GE.sfx("win"); }
    else if (e.kind === "gift") { msg = t("gift", { n: GE.money(e.lost) }); icon = "🎁"; GE.sfx("tap"); }
    else if (e.kind === "escaped") { msg = t("escaped"); icon = "💨"; GE.sfx("sail"); }
    else { msg = e.good ? t("robbed", { n: e.lost, good: goodIcon(e.good) + " " + goodName(e.good) }) : t("robbedNone"); icon = "🏜️"; GE.sfx("whoops"); }
    render();
    setTimeout(function () {
      GE.modal({ icon: icon, title: t("bandits"), body: "<p class='event-big'>" + GE.esc(msg) + "</p>", actions: [{ label: t("onward") }],
        onClose: function () { playEvents(ev.slice(1).concat(queue)); } });
    }, 0);
  }

  function showTutorial() { GE.modal({ icon: "🐫", title: t("tutTitle"), body: t("tutBody"), actions: [{ label: t("tutGo") }] }); }

  /* ---------------- wiring ---------------- */
  function render() {
    renderHud();
    renderCity();
    if (!$("view-map").hidden) { renderMap(); renderDests(); }
  }
  $("goods").addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b || b.disabled) return;
    if (b.hasAttribute("data-buy")) onBuy(b.getAttribute("data-buy"), b);
    else if (b.hasAttribute("data-sell")) onSell(b.getAttribute("data-sell"), b);
  });
  $("order").addEventListener("click", function (e) { if (e.target.closest("#btn-deliver")) onDeliver(); });
  $("qty-group").addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    var v = b.getAttribute("data-qty");
    qtyMode = v === "max" ? "max" : parseInt(v, 10);
    GE.save("merchant-caravan-qty", qtyMode);
    GE.sfx("tap"); renderMarket();
  });
  $("btn-job").addEventListener("click", onJob);
  $("btn-team").addEventListener("click", function () { GE.sfx("tap"); openTeam(); });
  $("btn-map").addEventListener("click", function () { GE.sfx("tap"); selectedDest = null; showView("map"); });
  $("btn-back").addEventListener("click", function () { GE.sfx("tap"); showView("city"); });
  $("btn-go").addEventListener("click", travel);
  $("dests").addEventListener("click", function (e) {
    var b = e.target.closest("[data-dest]");
    if (!b || b.disabled) return;
    GE.sfx("tap");
    var id = b.getAttribute("data-dest");
    if (b.getAttribute("data-open") !== "true") { askPermit(id); return; }
    selectedDest = id;
    renderMap(); renderDests();
  });
  $("btn-sound").addEventListener("click", function () { GE.toggleMute(); renderHud(); GE.sfx("tap"); });
  $("btn-lang").addEventListener("click", function () { GE.setLang(GE.lang === "he" ? "en" : "he"); });
  GE.onLang(function () { render(); });

  render();
  if (state.pending && state.pending.type === "bandits") {
    playEvents([{ kind: "bandits", fee: state.pending.fee, guards: state.guards, guardChance: L.guardWinChance(state) }]);
  } else if (fresh) showTutorial();
  if (!GE.storageOK) setTimeout(function () { GE.toast(t("noSave"), 3500); }, 600);
  save();
  GE.registerSW("sw.js");
  window.__caravan = { get state() { return JSON.parse(JSON.stringify(state)); } };
})();
