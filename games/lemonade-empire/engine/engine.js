/* ============================================================================
 * Trading-games engine (copied into each game's engine/ folder)
 * ----------------------------------------------------------------------------
 * Shared runtime for the geo-kids trading games. No dependencies, no network.
 *   i18n    GE.lang, GE.t(key, vars), GE.setDict(dict), GE.setLang(l), GE.onLang(cb)
 *   store   GE.load(key, fallback), GE.save(key, value), GE.storageOK
 *   sound   GE.sfx(name, opts), GE.isMuted(), GE.toggleMute()
 *   fx      GE.coinBurst(fromEl, toEl, n), GE.float(el, text, kind), GE.flash(el, kind),
 *           GE.toast(msg), GE.countUp(el, from, to), GE.confetti(), GE.bump(el)
 *   ui      GE.modal({title, body, actions, dismissable}), GE.esc(s), GE.flag(code)
 *   misc    GE.rng(seed), GE.money(n), GE.num(n), GE.registerSW(), GE.reducedMotion
 * Language and mute keys are shared with geo-kids so a child sets them once.
 * ==========================================================================*/
(function () {
  "use strict";
  var GE = {};
  var LANG_KEY = "geo-lang";
  var MUTE_KEY = "geo-sound-muted";

  /* ---------------- safe storage ---------------- */
  // Every access is guarded: private mode, blocked site data or a full quota
  // must never break the game — it just stops persisting.
  GE.storageOK = (function () {
    try {
      var k = "__ge_probe__";
      localStorage.setItem(k, "1");
      localStorage.removeItem(k);
      return true;
    } catch (e) { return false; }
  })();
  function rawGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function rawSet(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
  }
  GE.load = function (key, fallback) {
    var raw = rawGet(key);
    if (raw == null) return fallback;
    try { return JSON.parse(raw); } catch (e) { return fallback; }
  };
  GE.save = function (key, value) {
    try { return rawSet(key, JSON.stringify(value)); } catch (e) { return false; }
  };
  GE.remove = function (key) {
    try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
  };

  /* ---------------- i18n ---------------- */
  GE.lang = rawGet(LANG_KEY) === "en" ? "en" : "he";
  var dict = { he: {}, en: {} };
  var langListeners = [];
  GE.setDict = function (d) { dict = d; };
  GE.t = function (key, vars) {
    var s = (dict[GE.lang] && dict[GE.lang][key]);
    if (s == null) s = (dict.en && dict.en[key]);
    if (s == null) return key;
    if (vars) {
      s = s.replace(/\{(\w+)\}/g, function (m, name) {
        return vars[name] != null ? vars[name] : m;
      });
    }
    return s;
  };
  // Pick the current language's text from a {he, en} pair.
  GE.L = function (pair) {
    if (!pair) return "";
    return pair[GE.lang] != null ? pair[GE.lang] : pair.en;
  };
  GE.applyDir = function () {
    document.documentElement.lang = GE.lang;
    document.documentElement.dir = GE.lang === "he" ? "rtl" : "ltr";
  };
  GE.setLang = function (l) {
    GE.lang = l === "en" ? "en" : "he";
    rawSet(LANG_KEY, GE.lang);
    GE.applyDir();
    langListeners.forEach(function (cb) { cb(GE.lang); });
  };
  GE.onLang = function (cb) { langListeners.push(cb); };

  /* ---------------- formatting ---------------- */
  GE.num = function (n) {
    n = Math.round(n);
    try { return new Intl.NumberFormat(GE.lang === "he" ? "he-IL" : "en-US").format(n); }
    catch (e) { return String(n); }
  };
  GE.money = function (n) { return "🪙 " + GE.num(n); };
  GE.esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  // ISO alpha-2 code -> flag emoji (regional indicator symbols). Offline, no images.
  GE.flag = function (code) {
    if (!code || code.length !== 2) return "🏳️";
    var A = 0x1F1E6;
    var up = code.toUpperCase();
    return String.fromCodePoint(A + up.charCodeAt(0) - 65, A + up.charCodeAt(1) - 65);
  };

  /* ---------------- seeded rng (mulberry32) ---------------- */
  GE.rng = function (seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  /* ---------------- motion preference ---------------- */
  GE.reducedMotion = false;
  try {
    var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    GE.reducedMotion = mq.matches;
    if (mq.addEventListener) mq.addEventListener("change", function (e) { GE.reducedMotion = e.matches; });
  } catch (e) { /* ignore */ }

  /* ---------------- sound (WebAudio synth, no assets) ---------------- */
  var actx = null;
  function ctx() {
    if (!actx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      try { actx = new C(); } catch (e) { return null; }
    }
    if (actx.state === "suspended") { try { actx.resume(); } catch (e) { /* ignore */ } }
    return actx;
  }
  // iOS only unlocks audio inside a gesture's completion event.
  function unlock() {
    if (GE.isMuted()) return;
    ctx();
  }
  ["click", "touchend", "keydown"].forEach(function (ev) {
    document.addEventListener(ev, unlock, { capture: true, passive: true });
  });
  GE.isMuted = function () { return rawGet(MUTE_KEY) === "1"; };
  GE.toggleMute = function () {
    rawSet(MUTE_KEY, GE.isMuted() ? "0" : "1");
    return GE.isMuted();
  };
  function tone(c, freq, start, dur, type, vol, slideTo) {
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, start);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(vol || 0.12, start + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(c.destination);
    o.start(start); o.stop(start + dur + 0.02);
  }
  function noise(c, start, dur, vol) {
    var len = Math.floor(c.sampleRate * dur);
    var buf = c.createBuffer(1, len, c.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = c.createBufferSource();
    var g = c.createGain();
    var f = c.createBiquadFilter();
    f.type = "lowpass"; f.frequency.value = 900;
    src.buffer = buf;
    g.gain.value = vol || 0.08;
    src.connect(f); f.connect(g); g.connect(c.destination);
    src.start(start);
  }
  var SFX = {
    tap: function (c, t) { tone(c, 660, t, 0.06, "triangle", 0.06); },
    coin: function (c, t, o) {
      var p = 1 + Math.min(o.streak || 0, 8) * 0.06;
      tone(c, 988 * p, t, 0.08, "square", 0.05);
      tone(c, 1319 * p, t + 0.07, 0.16, "square", 0.05);
    },
    buy: function (c, t) { tone(c, 523, t, 0.09, "triangle", 0.09); tone(c, 392, t + 0.07, 0.12, "triangle", 0.07); },
    sell: function (c, t, o) {
      var p = 1 + Math.min(o.streak || 0, 8) * 0.06;
      tone(c, 659 * p, t, 0.08, "triangle", 0.1); tone(c, 880 * p, t + 0.07, 0.14, "triangle", 0.1);
    },
    whoops: function (c, t) { tone(c, 440, t, 0.25, "sine", 0.08, 300); },
    event: function (c, t) { tone(c, 392, t, 0.12, "sine", 0.1); tone(c, 587, t + 0.12, 0.2, "sine", 0.1); },
    sail: function (c, t) { noise(c, t, 0.9, 0.05); },
    splash: function (c, t) { noise(c, t, 0.4, 0.1); tone(c, 200, t, 0.3, "sine", 0.08, 90); },
    upgrade: function (c, t) {
      [523, 659, 784].forEach(function (f, i) { tone(c, f, t + i * 0.08, 0.14, "triangle", 0.09); });
    },
    win: function (c, t) {
      [523, 659, 784, 1047, 784, 1047].forEach(function (f, i) { tone(c, f, t + i * 0.11, 0.2, "triangle", 0.1); });
    }
  };
  GE.sfx = function (name, opts) {
    if (GE.isMuted() || !SFX[name]) return;
    var c = ctx();
    if (!c) return;
    try { SFX[name](c, c.currentTime + 0.01, opts || {}); } catch (e) { /* ignore */ }
  };

  /* ---------------- fx layer ---------------- */
  var layer = null;
  function fxLayer() {
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "ge-fx-layer";
      layer.setAttribute("aria-hidden", "true");
      document.body.appendChild(layer);
    }
    return layer;
  }
  function center(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  var coinPool = [];
  var coinsLive = 0;
  GE.coinBurst = function (fromEl, toEl, n) {
    if (!fromEl || !toEl || GE.reducedMotion) { if (toEl) GE.bump(toEl); return; }
    // Read all layout first, then write (avoids layout thrash).
    var a = center(fromEl), b = center(toEl);
    n = Math.min(n || 6, 12 - coinsLive);
    for (var i = 0; i < n; i++) {
      (function (i) {
        var c = coinPool.pop() || document.createElement("span");
        c.className = "ge-coin";
        c.textContent = "🪙";
        var jx = (Math.random() - 0.5) * 60, jy = (Math.random() - 0.5) * 40;
        c.style.transform = "translate(" + (a.x + jx) + "px," + (a.y + jy) + "px) scale(.6)";
        c.style.opacity = "1";
        fxLayer().appendChild(c);
        coinsLive++;
        var delay = i * 45;
        setTimeout(function () {
          requestAnimationFrame(function () {
            c.style.transform = "translate(" + b.x + "px," + b.y + "px) scale(1)";
            c.style.opacity = "0.2";
          });
        }, 30 + delay);
        setTimeout(function () {
          c.remove(); coinsLive--; coinPool.push(c);
          if (i === 0) GE.bump(toEl);
        }, 650 + delay);
      })(i);
    }
  };
  GE.float = function (el, text, kind) {
    if (!el) return;
    var p = center(el);
    var f = document.createElement("span");
    f.className = "ge-float ge-float-" + (kind || "gain");
    f.textContent = text;
    f.style.left = p.x + "px";
    f.style.top = p.y + "px";
    fxLayer().appendChild(f);
    setTimeout(function () { f.remove(); }, 1100);
  };
  GE.flash = function (el, kind) {
    if (!el) return;
    var cls = "ge-flash-" + (kind || "up");
    el.classList.remove(cls);
    void el.offsetWidth; // restart animation
    el.classList.add(cls);
    setTimeout(function () { el.classList.remove(cls); }, 700);
  };
  GE.bump = function (el) {
    if (!el) return;
    el.classList.remove("ge-bump");
    void el.offsetWidth;
    el.classList.add("ge-bump");
    setTimeout(function () { el.classList.remove("ge-bump"); }, 350);
  };
  var toastTimer = null;
  GE.toast = function (msg, ms) {
    var tEl = document.getElementById("ge-toast");
    if (!tEl) {
      tEl = document.createElement("div");
      tEl.id = "ge-toast";
      tEl.className = "ge-toast";
      tEl.setAttribute("role", "status");
      tEl.setAttribute("aria-live", "polite");
      document.body.appendChild(tEl);
    }
    tEl.textContent = msg;
    tEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { tEl.classList.remove("show"); }, ms || 2200);
  };
  GE.countUp = function (el, from, to, fmt) {
    if (!el) return;
    fmt = fmt || GE.money;
    if (GE.reducedMotion || from === to) { el.textContent = fmt(to); return; }
    var start = performance.now(), dur = 450;
    function step(now) {
      var k = Math.min(1, (now - start) / dur);
      var e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  };
  GE.confetti = function () {
    if (GE.reducedMotion) return;
    var L = fxLayer();
    var bits = ["🎉", "⭐", "🪙", "✨", "🎊"];
    var w = window.innerWidth;
    for (var i = 0; i < 18; i++) {
      var s = document.createElement("span");
      s.className = "ge-confetti";
      s.textContent = bits[i % bits.length];
      s.style.left = (Math.random() * w) + "px";
      s.style.animationDelay = (Math.random() * 0.4) + "s";
      s.style.animationDuration = (1.4 + Math.random() * 0.8) + "s";
      L.appendChild(s);
      (function (s) { setTimeout(function () { s.remove(); }, 2800); })(s);
    }
  };

  /* ---------------- modal ---------------- */
  var openModal = null;
  GE.modal = function (opts) {
    if (openModal) openModal.close(true);
    var prevFocus = document.activeElement;
    var back = document.createElement("div");
    back.className = "ge-modal-back";
    var box = document.createElement("div");
    box.className = "ge-modal";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    var titleId = "ge-modal-title-" + Date.now();
    box.setAttribute("aria-labelledby", titleId);
    box.innerHTML =
      (opts.icon ? '<div class="ge-modal-icon" aria-hidden="true">' + opts.icon + "</div>" : "") +
      '<h2 id="' + titleId + '"></h2><div class="ge-modal-body"></div><div class="ge-modal-actions"></div>';
    box.querySelector("h2").textContent = opts.title || "";
    var body = box.querySelector(".ge-modal-body");
    if (typeof opts.body === "string") body.innerHTML = opts.body;
    else if (opts.body) body.appendChild(opts.body);
    var actionsEl = box.querySelector(".ge-modal-actions");
    var handle = {
      el: box,
      close: function (silent) {
        if (!back.parentNode) return;
        back.remove();
        openModal = null;
        document.removeEventListener("keydown", onKey);
        if (silent) return; // replaced by another modal: don't chain
        if (prevFocus && prevFocus.focus) { try { prevFocus.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
        if (opts.onClose) opts.onClose();
      }
    };
    (opts.actions || [{ label: "OK" }]).forEach(function (a) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ge-btn " + (a.kind ? "ge-btn-" + a.kind : "ge-btn-primary");
      b.innerHTML = a.label;
      if (a.id) b.id = a.id;
      if (a.disabled) b.disabled = true;
      b.addEventListener("click", function () {
        GE.sfx("tap");
        var keep = a.onClick ? a.onClick(handle) : false;
        if (keep !== true) handle.close();
      });
      actionsEl.appendChild(b);
    });
    function onKey(e) {
      if (e.key === "Escape" && opts.dismissable !== false) handle.close();
      if (e.key === "Tab") {
        var f = box.querySelectorAll("button:not([disabled])");
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", onKey);
    if (opts.dismissable !== false) {
      back.addEventListener("click", function (e) { if (e.target === back) handle.close(); });
    }
    back.appendChild(box);
    document.body.appendChild(back);
    openModal = handle;
    var firstBtn = actionsEl.querySelector("button:not([disabled])");
    if (firstBtn) firstBtn.focus({ preventScroll: true });
    return handle;
  };
  GE.modalOpen = function () { return !!openModal; };

  /* ---------------- PWA ---------------- */
  GE.registerSW = function (path) {
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol !== "https:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") return;
    window.addEventListener("load", function () {
      navigator.serviceWorker.register(path || "sw.js").catch(function () { /* offline support is optional */ });
    });
  };

  GE.applyDir();
  window.GE = GE;
})();
