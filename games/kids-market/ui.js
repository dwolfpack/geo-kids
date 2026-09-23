/* Kids Market — DOM rendering and input. All rules live in logic.js. */
(function () {
  "use strict";
  var L = window.MarketLogic;
  var SAVE_KEY = "kids-market-v1";
  var $ = function (id) { return document.getElementById(id); };

  GE.setDict({
    he: {
      title: "שוק הילדים 📈", home: "חזרה למשחקים", sound: "צליל",
      newsKicker: "📰 החדשות של היום · יום {d}", newsHint: "חדשות מרמזות מה עשוי לקרות מחר — לא תמיד זה קורה!",
      total: "💼 כל ההון שלכם", cash: "🐷 מזומן: {v}", invested: "📊 במניות: {v}", day: "📅 יום {n}",
      today: "{sign}{v} היום",
      rank0: "מתחילים", nextGoal: "היעד הבא: {goal}", allDone: "הגעתם לכל היעדים! 👑", fortune: "הון: {v}",
      market: "🏢 החברות", feeNote: "כל קנייה ומכירה עולה עמלה של 2% (לפחות 🪙1).",
      own: "יש לכם <b>{n}</b> מניות", worth: "שוות <b>{v}</b>", paid: "שילמתם ממוצע 🪙{p}", none: "אין לכם מניות עדיין",
      buy: "קנייה 🪙{p}", sell: "מכירה 🪙{p}",
      tips: "💡 טיפים", next: "☀️ יום הבא", badges: "🏅 תגים",
      bought: "קניתם {n} {icon} (עמלה 🪙{f})", sold: "מכרתם {n} {icon} (עמלה 🪙{f})",
      cantBuy: "אין מספיק כסף לקנות את זה 🐷", cantSell: "אין לכם מניות של החברה הזו",
      newsYes: "📰 זה קרה! {icon} {name} {dir}", newsNo: "📰 הפעם זה לא קרה: {icon} {name} — ככה זה עם תחזיות!",
      went_up: "עלתה", went_down: "ירדה",
      dividend: "🎁 דיבידנד! החברות היציבות שילמו לכם {v}", allowance: "🐷 דמי כיס: +{v}",
      summer: "☀️ קיץ", winter: "❄️ חורף",
      tipsTitle: "💡 איך משקיעים?",
      tipsBody: "<p>🧺 <b>אל תשימו את כל הביצים בסל אחד.</b> כשיש לכם כמה חברות, אם אחת יורדת — האחרות עוזרות.</p><p>📰 <b>קראו את החדשות.</b> הן רומזות מה עשוי לקרות מחר, אבל לא תמיד צודקות.</p><p>🐢 <b>סבלנות.</b> מחירים קופצים למעלה ולמטה כל יום. לאורך זמן, חברות טובות גדלות.</p><p>💸 <b>עמלות.</b> כל קנייה ומכירה עולה קצת — אל תקנו ותמכרו כל רגע.</p><p>🎁 <b>דיבידנדים.</b> 🍌 ו-🍕 משלמות לכם כסף כל שבוע רק על זה שאתם מחזיקים בהן.</p><p style='font-size:.85rem;color:var(--ink-soft)'>זה משחק: החברות מומצאות. בעולם האמיתי מניות יכולות לרדת להרבה זמן, ולכן מבוגרים משקיעים רק כסף שלא צריכים בקרוב.</p>",
      badgesTitle: "🏅 התגים שלכם",
      b_firstProfit: "רווח ראשון", b_firstProfit_d: "מכרתם מניות ביותר ממה ששילמתם",
      b_basket: "סל ביצים", b_basket_d: "החזקתם 4 חברות או יותר בבת אחת",
      b_patient: "משקיע סבלני", b_patient_d: "החזקתם מניה 20 ימים ברציפות",
      b_newsReader: "קורא חדשות", b_newsReader_d: "החזקתם חברה כשחדשות טובות עליה התגשמו",
      b_dividend: "דיבידנד ראשון", b_dividend_d: "קיבלתם כסף רק על זה שהחזקתם מניות",
      badgeNew: "תג חדש! {icon} {name}",
      close: "סגירה", reset: "להתחיל משחק חדש", resetQ: "להתחיל מההתחלה? כל ההתקדמות תימחק.", resetYes: "כן, משחק חדש", resetNo: "לא, להמשיך",
      milestone: "דרגה חדשה!", milestoneBody: "אתם עכשיו {name}! {icon}",
      win: "קוסם השוק! 👑", winBody: "הגעתם להון של {v}! אפשר להמשיך להשקיע.", keepPlaying: "ממשיכים להשקיע", ok: "יופי!",
      tutTitle: "ברוכים הבאים לשוק! 📈",
      tutBody: "<p>🏢 קנו <b>מניות</b> — חתיכות קטנות של חברות מצחיקות.</p><p>📰 קראו את החדשות ולחצו <b>☀️ יום הבא</b> כדי לראות איך המחירים זזים.</p><p>🧺 גוונו, היו סבלניים, ונסו להגיע ל-8,000 מטבעות!</p>",
      tutGo: "בואו נשקיע!",
      noSave: "שימו לב: ההתקדמות לא תישמר במכשיר הזה."
    },
    en: {
      title: "Kids Market 📈", home: "Back to games", sound: "Sound",
      newsKicker: "📰 Today's news · day {d}", newsHint: "News hints at what may happen tomorrow — it doesn't always come true!",
      total: "💼 Your whole fortune", cash: "🐷 Cash: {v}", invested: "📊 In shares: {v}", day: "📅 Day {n}",
      today: "{sign}{v} today",
      rank0: "Beginner", nextGoal: "Next: {goal}", allDone: "Every goal reached! 👑", fortune: "Fortune: {v}",
      market: "🏢 Companies", feeNote: "Every buy and sell costs a 2% fee (at least 🪙1).",
      own: "You own <b>{n}</b> shares", worth: "worth <b>{v}</b>", paid: "avg paid 🪙{p}", none: "You don't own any yet",
      buy: "Buy 🪙{p}", sell: "Sell 🪙{p}",
      tips: "💡 Tips", next: "☀️ Next day", badges: "🏅 Badges",
      bought: "You bought {n} {icon} (fee 🪙{f})", sold: "You sold {n} {icon} (fee 🪙{f})",
      cantBuy: "Not enough money to buy that 🐷", cantSell: "You don't own shares of this company",
      newsYes: "📰 It happened! {icon} {name} {dir}", newsNo: "📰 It didn't happen to {icon} {name} this time — that's forecasts for you!",
      went_up: "went up", went_down: "went down",
      dividend: "🎁 Dividend! The steady companies paid you {v}", allowance: "🐷 Allowance: +{v}",
      summer: "☀️ Summer", winter: "❄️ Winter",
      tipsTitle: "💡 How to invest",
      tipsBody: "<p>🧺 <b>Don't put all your eggs in one basket.</b> With several companies, if one drops the others help.</p><p>📰 <b>Read the news.</b> It hints at what may happen tomorrow, but it isn't always right.</p><p>🐢 <b>Be patient.</b> Prices wiggle up and down every day. Over time, good companies grow.</p><p>💸 <b>Fees.</b> Every buy and sell costs a little — don't trade every second.</p><p>🎁 <b>Dividends.</b> 🍌 and 🍕 pay you every week just for holding them.</p><p style='font-size:.85rem;color:var(--ink-soft)'>This is a game: the companies are made up. In the real world shares can fall for a long time, so grown-ups only invest money they won't need soon.</p>",
      badgesTitle: "🏅 Your badges",
      b_firstProfit: "First profit", b_firstProfit_d: "Sold shares for more than you paid",
      b_basket: "Egg basket", b_basket_d: "Owned 4 or more companies at once",
      b_patient: "Patient investor", b_patient_d: "Held a share for 20 days in a row",
      b_newsReader: "News reader", b_newsReader_d: "Owned a company when good news about it came true",
      b_dividend: "First dividend", b_dividend_d: "Got paid just for holding shares",
      badgeNew: "New badge! {icon} {name}",
      close: "Close", reset: "Start a new game", resetQ: "Start over? All progress will be erased.", resetYes: "Yes, new game", resetNo: "No, keep playing",
      milestone: "New rank!", milestoneBody: "You are now a {name}! {icon}",
      win: "Market Wizard! 👑", winBody: "You reached a fortune of {v}! Keep investing.", keepPlaying: "Keep investing", ok: "Great!",
      tutTitle: "Welcome to the market! 📈",
      tutBody: "<p>🏢 Buy <b>shares</b> — tiny pieces of silly companies.</p><p>📰 Read the news and tap <b>☀️ Next day</b> to see how prices move.</p><p>🧺 Mix it up, be patient, and try to reach 8,000 coins!</p>",
      tutGo: "Let's invest!",
      noSave: "Heads up: progress can't be saved on this device."
    }
  });
  var t = GE.t, L10 = GE.L;
  var BADGE_ICON = { firstProfit: "💰", basket: "🧺", patient: "🐢", newsReader: "📰", dividend: "🎁" };

  var rng = GE.rng((Date.now() ^ (Math.random() * 1e9)) >>> 0);
  var state = GE.load(SAVE_KEY, null);
  var fresh = !state || state.v !== 1;
  if (fresh) state = L.newGame(rng);
  var qtyMode = GE.load("kids-market-qty", 1);
  var yesterdayWorth = GE.load("kids-market-yw", L.netWorth(state));
  function save() { GE.save(SAVE_KEY, state); GE.save("kids-market-yw", yesterdayWorth); }

  function coName(id) { return L10(L.CO_BY_ID[id].name); }
  function coIcon(id) { return L.CO_BY_ID[id].icon; }
  function money2(v) { return GE.money(Math.round(v)); }

  /* ---------------- render ---------------- */
  function renderHud() {
    $("wallet").textContent = money2(state.cash);
    $("btn-sound").textContent = GE.isMuted() ? "🔇" : "🔊";
    $("btn-sound").setAttribute("aria-label", t("sound"));
    $("btn-lang").textContent = GE.lang === "he" ? "EN" : "עב";
    $("btn-lang").setAttribute("aria-label", GE.lang === "he" ? "English" : "עברית");
    $("btn-home").setAttribute("aria-label", t("home"));
    $("btn-tips").textContent = t("tips");
    $("btn-next").textContent = t("next");
    $("btn-badges").textContent = t("badges") + " " + Object.keys(state.badges).length + "/" + L.BADGES.length;
    document.title = t("title");
  }
  function renderNews() {
    var n = state.news, html = "<div class='kicker'>" + t("newsKicker", { d: state.day }) + " · " + (L.season(state) >= 0 ? t("summer") : t("winter")) + "</div>";
    if (n && n.co) {
      var item = L.NEWS[n.co].filter(function (x) { return x.dir === n.dir; })[n.idx] || L.NEWS[n.co][0];
      html += "<div class='headline'><span class='ico' aria-hidden='true'>" + coIcon(n.co) + "</span><span>" + GE.esc(L10(item)) + "</span></div>" +
        "<p class='hint'>" + t("newsHint") + "</p>";
    } else {
      html += "<div class='headline'><span class='ico' aria-hidden='true'>☕</span><span>" + GE.esc(L10(L.CALM[n ? n.calm : 0])) + "</span></div>";
    }
    $("news").innerHTML = html;
  }
  function renderPortfolio() {
    var w = L.netWorth(state), diff = w - yesterdayWorth;
    $("lbl-total").textContent = t("total");
    $("total").textContent = money2(w);
    var td = $("today");
    td.textContent = t("today", { sign: diff >= 0 ? "▲ +" : "▼ ", v: GE.num(diff) });
    td.className = "today " + (diff >= 0 ? "up" : "down");
    $("chip-cash").textContent = t("cash", { v: money2(state.cash) });
    $("chip-invested").textContent = t("invested", { v: money2(L.holdingsValue(state)) });
    $("chip-day").textContent = t("day", { n: state.day });
    var M = L.MILESTONES;
    var rank = state.milestone > 0 ? M[state.milestone - 1] : null;
    $("rank-label").textContent = (rank ? rank.icon + " " + L10(rank.name) : "🧒 " + t("rank0"));
    if (state.milestone < M.length) {
      var next = M[state.milestone], prev = state.milestone > 0 ? M[state.milestone - 1].at : 0;
      $("goal-label").textContent = t("nextGoal", { goal: next.icon + " " + GE.money(next.at) });
      $("goal-fill").style.transform = "scaleX(" + Math.max(0, Math.min(1, (w - prev) / (next.at - prev))).toFixed(3) + ")";
    } else {
      $("goal-label").textContent = t("allDone");
      $("goal-fill").style.transform = "scaleX(1)";
    }
  }
  function spark(hist) {
    var W = 300, H = 44, n = hist.length;
    if (n < 2) return "";
    var lo = Math.min.apply(null, hist), hi = Math.max.apply(null, hist), span = hi - lo || 1;
    var pts = hist.map(function (v, i) { return [(i / (n - 1)) * W, H - 4 - ((v - lo) / span) * (H - 8)]; });
    var d = pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ");
    var cls = hist[n - 1] >= hist[0] ? "up" : "down";
    var baseY = (H - 4 - ((hist[0] - lo) / span) * (H - 8)).toFixed(1);
    return "<svg class='spark' viewBox='0 0 " + W + " " + H + "' preserveAspectRatio='none' aria-hidden='true'>" +
      "<line class='base' x1='0' y1='" + baseY + "' x2='" + W + "' y2='" + baseY + "'/>" +
      "<path class='area " + cls + "' d='" + d + " L" + W + "," + H + " L0," + H + " Z'/><path class='line " + cls + "' d='" + d + "'/></svg>";
  }
  function renderCompanies() {
    $("market-title").textContent = t("market");
    $("fee-note").textContent = t("feeNote");
    var html = "";
    L.COMPANIES.forEach(function (c) {
      var st = state.co[c.id], ch = st.prev ? (st.price - st.prev) / st.prev : 0;
      var cls = ch >= 0 ? "up" : "down";
      html += "<div class='company' data-co='" + c.id + "'><div class='co-top'><span class='ico' aria-hidden='true'>" + c.icon + "</span>" +
        "<div><div class='nm'>" + GE.esc(coName(c.id)) + "</div><div class='kind'>" + GE.esc(L10(c.kind)) + "</div></div>" +
        "<div class='co-price'><span class='p' id='p-" + c.id + "'>🪙" + st.price.toFixed(2) + "</span><span class='ch " + cls + "'>" + (ch >= 0 ? "▲ +" : "▼ ") + (ch * 100).toFixed(1) + "%</span></div></div>" +
        spark(st.hist) +
        "<div class='co-own'>" + (st.shares > 0
          ? "<span>" + t("own", { n: st.shares }) + "</span><span>" + t("worth", { v: money2(st.shares * st.price) }) + "</span><span>" + t("paid", { p: st.paid.toFixed(2) }) + "</span>"
          : "<span>" + t("none") + "</span>") + "</div>" +
        "<div class='co-btns'><button type='button' class='ge-btn sell" + (st.shares > 0 && st.price > st.paid ? " profit" : "") + "' data-sell='" + c.id + "'" + (st.shares > 0 ? "" : " disabled") + ">" +
        t("sell", { p: st.price.toFixed(2) }) + "</button>" +
        "<button type='button' class='ge-btn ge-btn-primary' data-buy='" + c.id + "'" + (L.maxBuy(state, c.id) > 0 ? "" : " disabled") + ">" + t("buy", { p: st.price.toFixed(2) }) + "</button></div></div>";
    });
    $("companies").innerHTML = html;
    document.querySelectorAll("#qty-group button").forEach(function (b) { b.setAttribute("aria-pressed", String(String(qtyMode) === b.getAttribute("data-qty"))); });
  }
  function render() { renderHud(); renderNews(); renderPortfolio(); renderCompanies(); }

  /* ---------------- actions ---------------- */
  function act(a) { var r = L.apply(state, a, rng); save(); return r.events; }
  function qty(kind, id) {
    if (qtyMode === "max") return kind === "buy" ? Math.max(1, L.maxBuy(state, id)) : state.co[id].shares;
    return qtyMode;
  }
  function onBuy(id, btn) {
    var ev = act({ type: "buy", co: id, qty: qty("buy", id) });
    var e = ev[0];
    if (e.kind === "bought") {
      GE.sfx("buy");
      GE.float(btn, "+" + e.qty + " " + coIcon(id), "info");
      GE.toast(t("bought", { n: e.qty, icon: coIcon(id), f: e.fee }), 1600);
    } else { GE.sfx("whoops"); GE.toast(t("cantBuy")); }
    render(); afterEvents(ev);
  }
  function onSell(id, btn) {
    var ev = act({ type: "sell", co: id, qty: Math.max(1, qty("sell", id)) });
    var e = ev[0];
    if (e.kind === "sold") {
      GE.sfx(e.profit > 0 ? "sell" : "tap", { streak: 2 });
      GE.coinBurst(btn, $("wallet"), 5);
      GE.float(btn, (e.profit >= 0 ? "+" : "−") + GE.num(Math.abs(e.profit)), e.profit >= 0 ? "gain" : "loss");
      GE.toast(t("sold", { n: e.qty, icon: coIcon(id), f: e.fee }), 1600);
    } else { GE.sfx("whoops"); GE.toast(t("cantSell")); }
    render(); afterEvents(ev);
  }
  function onNext() {
    var before = {};
    L.COMPANIES.forEach(function (c) { before[c.id] = state.co[c.id].price; });
    yesterdayWorth = L.netWorth(state);
    var ev = act({ type: "next" });
    GE.sfx("event");
    render();
    L.COMPANIES.forEach(function (c) {
      var el = $("p-" + c.id);
      if (el && state.co[c.id].price !== before[c.id]) GE.flash(el, state.co[c.id].price > before[c.id] ? "up" : "down");
    });
    var msgs = [];
    ev.forEach(function (e) {
      if (e.kind === "newsResult") {
        msgs.push(e.happened ? t("newsYes", { icon: coIcon(e.co), name: coName(e.co), dir: t(e.dir > 0 ? "went_up" : "went_down") }) : t("newsNo", { icon: coIcon(e.co), name: coName(e.co) }));
      } else if (e.kind === "dividend") { msgs.push(t("dividend", { v: money2(e.got) })); GE.coinBurst($("companies"), $("wallet"), 6); GE.sfx("coin", { streak: 4 }); }
      else if (e.kind === "allowance") { msgs.push(t("allowance", { v: money2(e.got) })); GE.coinBurst($("btn-next"), $("wallet"), 3); }
    });
    if (msgs.length) GE.toast(msgs.join(" · "), 2800);
    afterEvents(ev);
  }
  function afterEvents(ev) {
    var queue = ev.filter(function (e) { return e.kind === "badge" || e.kind === "milestone"; });
    playQueue(queue);
  }
  function playQueue(queue) {
    var e = queue.shift();
    if (!e) return;
    if (e.kind === "badge") {
      GE.sfx("upgrade");
      GE.modal({ icon: BADGE_ICON[e.id], title: t("badgeNew", { icon: "", name: t("b_" + e.id) }), body: "<p class='event-big'>" + GE.esc(t("b_" + e.id + "_d")) + "</p>",
        actions: [{ label: t("ok") }], onClose: function () { playQueue(queue); } });
      return;
    }
    var m = L.MILESTONES[e.index];
    GE.sfx("win"); GE.confetti();
    var title = e.final ? t("win") : t("milestone");
    var body = e.final ? t("winBody", { v: money2(L.netWorth(state)) }) : t("milestoneBody", { name: L10(m.name), icon: m.icon });
    GE.modal({ icon: e.final ? "👑" : m.icon, title: title, body: "<p class='event-big'>" + GE.esc(body) + "</p>",
      actions: [{ label: e.final ? t("keepPlaying") : t("ok") }], onClose: function () { playQueue(queue); } });
  }

  function openTips() { GE.modal({ icon: "💡", title: t("tipsTitle"), body: "<div class='tips'>" + t("tipsBody") + "</div>", actions: [{ label: t("close"), kind: "ghost" }] }); }
  function openBadges() {
    var html = "<div class='badges'>";
    L.BADGES.forEach(function (id) {
      html += "<div class='badge" + (state.badges[id] ? "" : " locked") + "'><span class='ico'>" + BADGE_ICON[id] + "</span><div><div class='bn'>" + t("b_" + id) + "</div><div class='bd'>" + t("b_" + id + "_d") + "</div></div></div>";
    });
    var body = document.createElement("div");
    body.innerHTML = html + "</div><button type='button' class='reset-link' data-reset='1'>" + t("reset") + "</button>";
    body.addEventListener("click", function (e) { if (e.target.closest("[data-reset]")) confirmReset(); });
    GE.modal({ icon: "🏅", title: t("badgesTitle"), body: body, actions: [{ label: t("close"), kind: "ghost" }] });
  }
  function confirmReset() {
    GE.modal({
      icon: "🔄", title: t("reset"), body: "<p>" + t("resetQ") + "</p>",
      actions: [
        { label: t("resetNo"), kind: "primary" },
        { label: t("resetYes"), kind: "ghost", onClick: function () { state = L.newGame(rng); yesterdayWorth = L.netWorth(state); save(); render(); showTutorial(); } }
      ]
    });
  }
  function showTutorial() { GE.modal({ icon: "📈", title: t("tutTitle"), body: t("tutBody"), actions: [{ label: t("tutGo") }] }); }

  /* ---------------- wiring ---------------- */
  $("companies").addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b || b.disabled) return;
    if (b.hasAttribute("data-buy")) onBuy(b.getAttribute("data-buy"), b);
    else if (b.hasAttribute("data-sell")) onSell(b.getAttribute("data-sell"), b);
  });
  $("qty-group").addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    var v = b.getAttribute("data-qty");
    qtyMode = v === "max" ? "max" : parseInt(v, 10);
    GE.save("kids-market-qty", qtyMode);
    GE.sfx("tap"); renderCompanies();
  });
  $("btn-next").addEventListener("click", onNext);
  $("btn-tips").addEventListener("click", function () { GE.sfx("tap"); openTips(); });
  $("btn-badges").addEventListener("click", function () { GE.sfx("tap"); openBadges(); });
  $("btn-sound").addEventListener("click", function () { GE.toggleMute(); renderHud(); GE.sfx("tap"); });
  $("btn-lang").addEventListener("click", function () { GE.setLang(GE.lang === "he" ? "en" : "he"); });
  GE.onLang(function () { render(); });

  render();
  if (fresh) showTutorial();
  if (!GE.storageOK) setTimeout(function () { GE.toast(t("noSave"), 3500); }, 600);
  save();
  GE.registerSW("sw.js");
  window.__market = {
    get state() { return JSON.parse(JSON.stringify(state)); },
    replace: function (s) { state = s; save(); render(); }
  };
})();
