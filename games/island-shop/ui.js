/* Island Shop — DOM rendering and input. All rules live in logic.js. */
(function () {
  "use strict";
  var L = window.ShopLogic;
  var SAVE_KEY = "island-shop-v1";
  var $ = function (id) { return document.getElementById(id); };

  GE.setDict({
    he: {
      title: "החנות באי 🏝️", home: "חזרה למשחקים", sound: "צליל", shopTitle: "🏝️ החנות שלכם · יום {n}",
      rep: "⭐ מוניטין: {stars}", shelf: "🗄️ מדפים: {n}/{max}", visit: "👥 כ-{n} לקוחות ביום",
      rank0: "מתחילים", nextGoal: "היעד הבא: {goal}", allDone: "הגעתם לכל היעדים! 👑", fortune: "הון: {v}",
      shipFrom: "🚢 ספינה מ{country} עגנה!", wholesale: "סיטונאי 🪙{p}", left: "נשארו {n}", sellsFor: "מחיר הוגן אצלכם: {p}",
      buy: "קנייה", fresh: "🥬 טרי",
      shelvesTitle: "🗄️ המדפים שלכם", shelvesHint: "בחרו מחיר לכל מוצר: 🙂 זול · 😐 הוגן · 🤑 יקר", empty: "המדפים ריקים — קנו סחורה מהספינה 🚢",
      have: "במלאי: {n}", paid: "שילמתם 🪙{p}", spoilIn: "🕒 יתקלקל בעוד {n} ימים", spoilTomorrow: "🕒 יתקלקל הלילה!", cold: "🧊 במקרר",
      tag_cheap: "🙂 🪙{p}", tag_fair: "😐 🪙{p}", tag_pricey: "🤑 🪙{p}",
      yTitle: "📊 איך היה אתמול?", yHappy: "קנו בשמחה", yPricey: "\"יקר מדי\"", ySoldOut: "\"אזל מהמלאי\"",
      tipPricey: "💡 הרבה לקוחות אמרו \"יקר מדי\" — נסו להוריד מחיר.", tipSoldOut: "💡 לקוחות רצו מוצרים שלא היו — קנו מגוון רחב יותר.",
      tipGreat: "💡 כולם שמחים! אולי אפשר להעלות קצת מחיר 🤑",
      clean: "🧹 ניקוי חוף", cleaned: "✅ ניקיתם היום", shop: "🛠️ החנות", open: "🏪 פותחים!",
      cleanDone: "ניקיתם את החוף וקיבלתם {n} 🧹",
      cantShelves: "אין מדף פנוי! 🗄️ מכרו מוצר או הוסיפו מדפים.", cantFull: "המדף מלא! 📦 הגדילו את המחסן.", cantMoney: "אין מספיק מטבעות — נסו לנקות את החוף 🧹", cantNone: "הספינה כבר מכרה את כל זה",
      dayTitle: "🏪 החנות פתוחה! · יום {n}", skip: "⏩ דלגו לערב",
      wants: "{icon} רוצה {good}", bought: "✅ קנה ב-🪙{p}!", bought2: "✅ קנתה 2 ב-🪙{p}!", pricey: "😕 יקר מדי… (מוכנים לשלם 🪙{max})", soldOut: "🙈 אזל מהמלאי",
      tallyHappy: "😊 {n}", tallyPricey: "😕 {n}", tallySold: "🙈 {n}", tallyCoins: "🪙 {n}",
      eveTitle: "🌙 ערב ביום {n}", eveVisitors: "👥 לקוחות", eveSold: "🛍️ מוצרים שנמכרו", eveEarned: "🪙 הכנסות", eveRent: "🏠 שכירות", eveSpoiled: "🗑️ התקלקל", eveRep: "⭐ מוניטין",
      nextShip: "למחרת בבוקר 🚢",
      upTitle: "🛠️ שדרוג החנות", level: "רמה {n}", maxed: "מקסימום",
      up_shelves: "מדף נוסף", up_shelves_d: "עוד סוג מוצר בחנות",
      up_storage: "מחסן גדול", up_storage_d: "+5 יחידות מכל מוצר",
      up_fridge: "מקרר", up_fridge_d: "פירות ודגים לא מתקלקלים",
      up_sign: "שלט צבעוני", up_sign_d: "+2 לקוחות ביום",
      up_size: "חנות גדולה יותר", up_size_d: "+3 לקוחות ביום (שכירות +🪙6)",
      close: "סגירה", reset: "להתחיל משחק חדש", resetQ: "להתחיל מההתחלה? כל ההתקדמות תימחק.", resetYes: "כן, משחק חדש", resetNo: "לא, להמשיך",
      milestone: "דרגה חדשה!", milestoneBody: "אתם עכשיו {name}! {icon}",
      win: "טייקון האי! 👑", winBody: "הגעתם להון של {v}! אפשר להמשיך ולהגדיל את החנות.", keepPlaying: "ממשיכים למכור",
      ok: "יופי!",
      tutTitle: "ברוכים הבאים לאי! 🏝️",
      tutBody: "<p>🚢 כל בוקר מגיעה ספינה מארץ אחרת — קנו ממנה סחורה.</p><p>🏷️ בחרו מחיר: זול מדי = רווח קטן, יקר מדי = לקוחות הולכים.</p><p>🏪 פתחו את החנות וראו מי קונה! פירות ודגים מתקלקלים אחרי יומיים.</p>",
      tutGo: "פותחים את החנות!",
      cust_tourist: "תיירת", cust_sailor: "מלח", cust_kid: "ילד", cust_chef: "שפית",
      noSave: "שימו לב: ההתקדמות לא תישמר במכשיר הזה."
    },
    en: {
      title: "Island Shop 🏝️", home: "Back to games", sound: "Sound", shopTitle: "🏝️ Your shop · Day {n}",
      rep: "⭐ Reputation: {stars}", shelf: "🗄️ Shelves: {n}/{max}", visit: "👥 ~{n} customers a day",
      rank0: "Beginner", nextGoal: "Next: {goal}", allDone: "Every goal reached! 👑", fortune: "Fortune: {v}",
      shipFrom: "🚢 A ship from {country} docked!", wholesale: "wholesale 🪙{p}", left: "{n} left", sellsFor: "sells for 🪙{p} in your shop",
      buy: "Buy", fresh: "🥬 fresh",
      shelvesTitle: "🗄️ Your shelves", shelvesHint: "Pick a price for each item: 🙂 cheap · 😐 fair · 🤑 pricey", empty: "Your shelves are empty — buy goods from the ship 🚢",
      have: "In stock: {n}", paid: "paid 🪙{p}", spoilIn: "🕒 spoils in {n} days", spoilTomorrow: "🕒 spoils tonight!", cold: "🧊 in the fridge",
      tag_cheap: "🙂 🪙{p}", tag_fair: "😐 🪙{p}", tag_pricey: "🤑 🪙{p}",
      yTitle: "📊 How did yesterday go?", yHappy: "happy buyers", yPricey: "\"too pricey\"", ySoldOut: "\"sold out\"",
      tipPricey: "💡 Lots of customers said \"too pricey\" — try a lower price.", tipSoldOut: "💡 Customers wanted things you didn't have — stock more kinds of goods.",
      tipGreat: "💡 Everyone was happy! Maybe raise a price a little 🤑",
      clean: "🧹 Beach cleanup", cleaned: "✅ Cleaned today", shop: "🛠️ Shop", open: "🏪 Open!",
      cleanDone: "You cleaned the beach and earned {n} 🧹",
      cantShelves: "No free shelf! 🗄️ Sell out an item or add shelves.", cantFull: "That shelf is full! 📦 Get a bigger storeroom.", cantMoney: "Not enough coins — try a beach cleanup 🧹", cantNone: "The ship sold all of that already",
      dayTitle: "🏪 The shop is open! · Day {n}", skip: "⏩ Skip to evening",
      wants: "{icon} wants {good}", bought: "✅ Bought it for 🪙{p}!", bought2: "✅ Bought 2 for 🪙{p}!", pricey: "😕 Too pricey… (would pay 🪙{max})", soldOut: "🙈 Sold out",
      tallyHappy: "😊 {n}", tallyPricey: "😕 {n}", tallySold: "🙈 {n}", tallyCoins: "🪙 {n}",
      eveTitle: "🌙 Evening of day {n}", eveVisitors: "👥 Customers", eveSold: "🛍️ Items sold", eveEarned: "🪙 Takings", eveRent: "🏠 Rent", eveSpoiled: "🗑️ Spoiled", eveRep: "⭐ Reputation",
      nextShip: "Next morning 🚢",
      upTitle: "🛠️ Upgrade your shop", level: "Level {n}", maxed: "Max",
      up_shelves: "Extra shelf", up_shelves_d: "One more kind of item in the shop",
      up_storage: "Bigger storeroom", up_storage_d: "+5 units of every item",
      up_fridge: "Fridge", up_fridge_d: "Fruit and fish never spoil",
      up_sign: "Colourful sign", up_sign_d: "+2 customers a day",
      up_size: "Bigger shop", up_size_d: "+3 customers a day (rent +🪙6)",
      close: "Close", reset: "Start a new game", resetQ: "Start over? All progress will be erased.", resetYes: "Yes, new game", resetNo: "No, keep playing",
      milestone: "New rank!", milestoneBody: "You are now a {name}! {icon}",
      win: "Island Tycoon! 👑", winBody: "You reached a fortune of {v}! Keep growing your shop.", keepPlaying: "Keep selling",
      ok: "Great!",
      tutTitle: "Welcome to the island! 🏝️",
      tutBody: "<p>🚢 Every morning a ship from a different country docks — buy goods from it.</p><p>🏷️ Pick prices: too cheap = small profit, too pricey = customers walk away.</p><p>🏪 Open the shop and see who buys! Fruit and fish spoil after 2 days.</p>",
      tutGo: "Open the shop!",
      cust_tourist: "Tourist", cust_sailor: "Sailor", cust_kid: "Kid", cust_chef: "Chef",
      noSave: "Heads up: progress can't be saved on this device."
    }
  });
  var t = GE.t, L10 = GE.L;

  var rng = GE.rng((Date.now() ^ (Math.random() * 1e9)) >>> 0);
  var state = GE.load(SAVE_KEY, null);
  var fresh = !state || state.v !== 1;
  if (fresh) state = L.newGame(rng);
  var qtyMode = GE.load("island-shop-qty", 5);
  var dayRunning = false;
  function save() { GE.save(SAVE_KEY, state); }

  var COUNTRY = {};
  if (typeof COUNTRIES !== "undefined") COUNTRIES.forEach(function (c) { COUNTRY[c.code] = c; });
  function countryName(code) { return COUNTRY[code] ? L10(COUNTRY[code].name) : code.toUpperCase(); }
  function countryFact(code) { return COUNTRY[code] ? L10(COUNTRY[code].fact) : ""; }
  function goodName(id) { return L10(L.GOOD_BY_ID[id].name); }
  function goodIcon(id) { return L.GOOD_BY_ID[id].icon; }
  function stars(rep) { var n = Math.max(1, Math.min(5, Math.round((rep - 0.5) * 5))); return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n); }

  /* ---------------- render ---------------- */
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
  function renderHead() {
    $("shop-title").textContent = t("shopTitle", { n: state.day });
    $("rep-chip").textContent = t("rep", { stars: stars(state.rep) });
    $("shelf-chip").textContent = t("shelf", { n: L.typesOnShelf(state), max: L.shelves(state) });
    $("visit-chip").textContent = t("visit", { n: L.customersPerDay(state) });
    $("ship-flag").textContent = GE.flag(state.ship.code);
    var M = L.MILESTONES, w = L.netWorth(state);
    var rank = state.milestone > 0 ? M[state.milestone - 1] : null;
    $("rank-label").textContent = (rank ? rank.icon + " " + L10(rank.name) : "🧒 " + t("rank0")) + " · " + t("fortune", { v: GE.money(w) });
    if (state.milestone < M.length) {
      var next = M[state.milestone], prev = state.milestone > 0 ? M[state.milestone - 1].at : 0;
      $("goal-label").textContent = t("nextGoal", { goal: next.icon + " " + GE.money(next.at) });
      $("goal-fill").style.transform = "scaleX(" + Math.max(0, Math.min(1, (w - prev) / (next.at - prev))).toFixed(3) + ")";
    } else {
      $("goal-label").textContent = t("allDone");
      $("goal-fill").style.transform = "scaleX(1)";
    }
  }
  function renderShip() {
    var sh = state.ship;
    var html = "<div class='ship-head'><span class='flag' aria-hidden='true'>" + GE.flag(sh.code) + "</span><h2>" + GE.esc(t("shipFrom", { country: countryName(sh.code) })) + "</h2></div>";
    var fact = countryFact(sh.code);
    if (fact) html += "<p class='ship-fact'>💡 " + GE.esc(fact) + "</p>";
    html += "<div class='qty' role='group' id='qty-group'>" +
      [1, 5, "max"].map(function (q) { return "<button type='button' data-qty='" + q + "' aria-pressed='" + (String(qtyMode) === String(q)) + "'" + (q === "max" ? " id='qty-max'" : "") + ">" + (q === "max" ? "Max" : "×" + q) + "</button>"; }).join("") + "</div>";
    Object.keys(sh.offer).forEach(function (id) {
      var o = sh.offer[id], g = L.GOOD_BY_ID[id];
      html += "<div class='offer'><div class='ico' aria-hidden='true'>" + g.icon + "</div><div><div class='nm'>" + GE.esc(goodName(id)) +
        (g.fresh ? " <span class='tag-fresh'>" + t("fresh") + "</span>" : "") + "</div>" +
        "<div class='meta'>" + t("left", { n: o.qty }) + " · " + t("sellsFor", { p: L.tagPrice(id, "fair") }) + "</div></div>" +
        "<button type='button' class='ge-btn ge-btn-primary' data-buy='" + id + "'" + (o.qty > 0 ? "" : " disabled") +
        " aria-label='" + GE.esc(t("buy") + " " + goodName(id) + " 🪙" + o.price) + "'>" + t("buy") + "<b>🪙" + o.price + "</b></button></div>";
    });
    $("ship-card").innerHTML = html;
  }
  function renderShelves() {
    var html = "<h2 class='card-h'>" + t("shelvesTitle") + "</h2><p class='muted'>" + t("shelvesHint") + "</p>";
    var any = false;
    L.GOODS.forEach(function (g) {
      var st = state.stock[g.id];
      if (st.qty <= 0) return;
      any = true;
      var spoil = "";
      if (g.fresh) {
        if (state.up.fridge) spoil = "<span>" + t("cold") + "</span>";
        else {
          var left = L.CFG.freshDays - st.age;
          spoil = "<span class='spoil'>" + (left <= 0 ? t("spoilTomorrow") : t("spoilIn", { n: left + 1 })) + "</span>";
        }
      }
      html += "<div class='shelf'><div class='shelf-top'><span class='ico' aria-hidden='true'>" + g.icon + "</span><div><div class='nm'>" + GE.esc(goodName(g.id)) + "</div>" +
        "<div class='meta'><span>" + t("have", { n: st.qty }) + "</span>" + (st.paid ? "<span>" + t("paid", { p: st.paid }) + "</span>" : "") + spoil + "</div></div></div>" +
        "<div class='tags' role='group'>" + ["cheap", "fair", "pricey"].map(function (tag) {
          return "<button type='button' data-good='" + g.id + "' data-tag='" + tag + "' aria-pressed='" + (st.tag === tag) + "'>" + t("tag_" + tag, { p: L.tagPrice(g.id, tag) }) + "</button>";
        }).join("") + "</div></div>";
    });
    if (!any) html += "<p class='empty-shelf'>" + t("empty") + "</p>";
    $("shelves").innerHTML = html;
  }
  function renderYesterday() {
    var y = state.last, box = $("yesterday");
    if (!y) { box.hidden = true; return; }
    box.hidden = false;
    var tip = y.pricey > y.happy / 2 ? t("tipPricey") : y.soldOut > y.visitors / 3 ? t("tipSoldOut") : y.pricey === 0 && y.happy > 0 ? t("tipGreat") : "";
    box.innerHTML = "<h2 class='card-h'>" + t("yTitle") + "</h2><div class='stats'>" +
      "<div>😊 " + y.happy + "<small>" + t("yHappy") + "</small></div><div>😕 " + y.pricey + "<small>" + t("yPricey") + "</small></div>" +
      "<div>🙈 " + y.soldOut + "<small>" + t("ySoldOut") + "</small></div></div>" + (tip ? "<p class='tip'>" + tip + "</p>" : "");
  }
  function renderBar() {
    var c = $("btn-clean");
    c.textContent = state.cleaned ? t("cleaned") : t("clean");
    c.disabled = state.cleaned;
    $("btn-shop").textContent = t("shop");
    $("btn-open").textContent = t("open");
  }
  function render() { renderHud(); renderHead(); renderShip(); renderShelves(); renderYesterday(); renderBar(); }

  /* ---------------- actions ---------------- */
  function act(a) { var r = L.apply(state, a, rng); save(); return r.events; }
  function milestonesOf(ev) { return ev.filter(function (e) { return e.kind === "milestone"; }); }

  function onBuy(id, btn) {
    var q = qtyMode === "max" ? Math.max(1, L.maxBuy(state, id)) : qtyMode;
    var ev = act({ type: "buy", good: id, qty: q });
    var e = ev[0];
    if (e.kind === "bought") {
      GE.sfx("buy");
      GE.float(btn, "+" + e.qty + " " + goodIcon(id), "info");
      GE.float($("wallet"), "−" + GE.num(e.spent), "loss");
    } else {
      GE.sfx("whoops");
      GE.toast(t({ shelves: "cantShelves", full: "cantFull", money: "cantMoney", none: "cantNone" }[e.reason] || "cantMoney"));
    }
    render(); playQueue(milestonesOf(ev));
  }
  function onTag(id, tag) {
    act({ type: "tag", good: id, tag: tag });
    GE.sfx("tap");
    renderShelves();
  }
  function onClean() {
    var ev = act({ type: "cleanup" });
    if (ev[0].kind !== "cleanup") return;
    GE.sfx("coin");
    GE.coinBurst($("btn-clean"), $("wallet"), 4);
    GE.toast(t("cleanDone", { n: GE.money(ev[0].got) }));
    render(); playQueue(milestonesOf(ev));
  }

  function openShop() {
    var body = document.createElement("div");
    function fill() {
      var html = "<div class='ups'>";
      L.UPGRADE_IDS.forEach(function (id) {
        var U = L.UPGRADES[id], lvl = state.up[id], maxed = L.upgradeMaxed(state, id), cost = L.upgradeCost(state, id);
        html += "<div class='up'><div class='ico'>" + U.icon + "</div><div><div class='uname'>" + t("up_" + id) + "</div><div class='udesc'>" + t("up_" + id + "_d") + "</div>" +
          (U.max > 1 ? "<div class='lvl'>" + t("level", { n: lvl }) + " / " + U.max + "</div>" : "") + "</div>" +
          "<button type='button' class='ge-btn ge-btn-good ge-btn-sm' data-up='" + id + "'" + (maxed || cost > state.money ? " disabled" : "") + ">" +
          (maxed ? t("maxed") : GE.money(cost)) + "</button></div>";
      });
      body.innerHTML = html + "</div><button type='button' class='reset-link' data-reset='1'>" + t("reset") + "</button>";
    }
    fill();
    body.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b || b.disabled) return;
      if (b.hasAttribute("data-up")) {
        var ev = act({ type: "upgrade", which: b.getAttribute("data-up") });
        if (ev[0].kind === "upgraded") { GE.sfx("upgrade"); GE.float(b, "⭐", "gain"); GE.float($("wallet"), "−" + GE.num(ev[0].cost), "loss"); }
        fill(); render(); playQueue(milestonesOf(ev));
      } else if (b.hasAttribute("data-reset")) confirmReset();
    });
    GE.modal({ icon: "🛖", title: t("upTitle"), body: body, actions: [{ label: t("close"), kind: "ghost" }] });
  }
  function confirmReset() {
    GE.modal({
      icon: "🔄", title: t("reset"), body: "<p>" + t("resetQ") + "</p>",
      actions: [
        { label: t("resetNo"), kind: "primary" },
        { label: t("resetYes"), kind: "ghost", onClick: function () { state = L.newGame(rng); shownMoney = state.money; save(); render(); showTutorial(); } }
      ]
    });
  }

  /* ---------------- the shop day ---------------- */
  var skipDay = false;
  function openDay() {
    if (dayRunning) return;
    var dayNum = state.day;
    var ev = act({ type: "open" });
    var customers = ev.filter(function (e) { return e.kind === "customer"; });
    var evening = ev.filter(function (e) { return e.kind === "evening"; })[0];
    dayRunning = true; skipDay = false;
    var ov = $("day");
    ov.hidden = false;
    $("day-title").textContent = t("dayTitle", { n: dayNum });
    $("day-skip").textContent = t("skip");
    var tally = { happy: 0, pricey: 0, sold: 0, coins: 0 };
    var i = 0;
    var step = GE.reducedMotion ? 250 : 700;
    function showTally() {
      $("day-tally").innerHTML = "<span>" + t("tallyHappy", { n: tally.happy }) + "</span><span>" + t("tallyPricey", { n: tally.pricey }) + "</span><span>" +
        t("tallySold", { n: tally.sold }) + "</span><span>" + t("tallyCoins", { n: GE.num(tally.coins) }) + "</span>";
      $("day-fill").style.transform = "scaleX(" + (customers.length ? i / customers.length : 1) + ")";
    }
    showTally();
    function next() {
      if (skipDay || i >= customers.length) { finish(); return; }
      var c = customers[i++];
      var who = L.CUSTOMER_BY_ID[c.who];
      var cu = $("day-customer");
      cu.textContent = who.icon;
      cu.classList.remove("enter"); void cu.offsetWidth; cu.classList.add("enter");
      var bubble = $("day-bubble");
      bubble.textContent = t("wants", { icon: L10(who.name), good: goodIcon(c.want) + " " + goodName(c.want) });
      setTimeout(function () {
        if (c.result === "bought") {
          tally.happy++; tally.coins += c.price * c.qty;
          bubble.textContent = c.qty > 1 ? t("bought2", { p: c.price * c.qty }) : t("bought", { p: c.price });
          GE.sfx("sell", { streak: tally.happy });
          GE.float(bubble, "+" + c.price * c.qty, "gain");
        } else if (c.result === "pricey") {
          tally.pricey++;
          bubble.textContent = t("pricey", { max: c.max });
          GE.sfx("whoops");
        } else {
          tally.sold++;
          bubble.textContent = t("soldOut");
          GE.sfx("tap");
        }
        showTally();
        setTimeout(next, step * 0.55);
      }, step * 0.45);
    }
    function finish() {
      i = customers.length;
      tally = { happy: 0, pricey: 0, sold: 0, coins: 0 };
      customers.forEach(function (c) {
        if (c.result === "bought") { tally.happy++; tally.coins += c.price * c.qty; } else if (c.result === "pricey") tally.pricey++; else tally.sold++;
      });
      showTally();
      ov.hidden = true;
      dayRunning = false;
      render();
      if (tally.coins > 0) GE.coinBurst($("btn-open"), $("wallet"), 8);
      showEvening(evening, dayNum, milestonesOf(ev));
    }
    next();
  }
  function showEvening(e, dayNum, after) {
    var spoiled = Object.keys(e.spoiled).map(function (g) { return e.spoiled[g] + " " + goodIcon(g); }).join(" ");
    var body = "<div class='eve'>" +
      "<p><span>" + t("eveVisitors") + "</span><span>" + e.visitors + "</span></p>" +
      "<p><span>" + t("eveSold") + "</span><span>" + e.sold + "</span></p>" +
      "<p><span>" + t("eveEarned") + "</span><span>+🪙" + GE.num(e.earned) + "</span></p>" +
      "<p><span>" + t("eveRent") + "</span><span>−🪙" + GE.num(e.rent) + "</span></p>" +
      (spoiled ? "<p><span>" + t("eveSpoiled") + "</span><span>" + spoiled + "</span></p>" : "") +
      "<p><span>" + t("eveRep") + "</span><span>" + stars(e.rep) + "</span></p></div>";
    GE.sfx(e.earned > e.rent ? "coin" : "event", { streak: 3 });
    GE.modal({ icon: "🌙", title: t("eveTitle", { n: dayNum }), body: body, actions: [{ label: t("nextShip"), id: "btn-next-day" }],
      onClose: function () { GE.sfx("sail"); playQueue(after); } });
  }

  function playQueue(queue) {
    var e = queue.shift();
    if (!e) return;
    var m = L.MILESTONES[e.index];
    GE.sfx("win"); GE.confetti();
    var title = e.final ? t("win") : t("milestone");
    var body = e.final ? t("winBody", { v: GE.money(L.netWorth(state)) }) : t("milestoneBody", { name: L10(m.name), icon: m.icon });
    GE.modal({ icon: e.final ? "👑" : m.icon, title: title, body: "<p class='event-big'>" + GE.esc(body) + "</p>",
      actions: [{ label: e.final ? t("keepPlaying") : t("ok") }], onClose: function () { playQueue(queue); } });
  }
  function showTutorial() { GE.modal({ icon: "🏝️", title: t("tutTitle"), body: t("tutBody"), actions: [{ label: t("tutGo") }] }); }

  /* ---------------- wiring ---------------- */
  $("ship-card").addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b || b.disabled) return;
    if (b.hasAttribute("data-buy")) onBuy(b.getAttribute("data-buy"), b);
    else if (b.hasAttribute("data-qty")) {
      var v = b.getAttribute("data-qty");
      qtyMode = v === "max" ? "max" : parseInt(v, 10);
      GE.save("island-shop-qty", qtyMode);
      GE.sfx("tap"); renderShip();
    }
  });
  $("shelves").addEventListener("click", function (e) {
    var b = e.target.closest("[data-tag]");
    if (b) onTag(b.getAttribute("data-good"), b.getAttribute("data-tag"));
  });
  $("btn-clean").addEventListener("click", onClean);
  $("btn-shop").addEventListener("click", function () { GE.sfx("tap"); openShop(); });
  $("btn-open").addEventListener("click", openDay);
  $("day-skip").addEventListener("click", function () { skipDay = true; });
  $("btn-sound").addEventListener("click", function () { GE.toggleMute(); renderHud(); GE.sfx("tap"); });
  $("btn-lang").addEventListener("click", function () { GE.setLang(GE.lang === "he" ? "en" : "he"); });
  GE.onLang(function () { render(); });

  render();
  if (fresh) showTutorial();
  if (!GE.storageOK) setTimeout(function () { GE.toast(t("noSave"), 3500); }, 600);
  save();
  GE.registerSW("sw.js");
  window.__shop = {
    get state() { return JSON.parse(JSON.stringify(state)); },
    replace: function (s) { state = s; shownMoney = s.money; save(); render(); }
  };
})();
