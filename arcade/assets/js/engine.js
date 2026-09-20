/* ============================================================
   NEON ARCADE 95 — shared cabinet engine (v2)
   A 16-bit-era evolution of the original NEON ARCADE cabinet:
   3 action buttons, custom HUD slots, stage banners, gradient
   and scaling helpers, a chiptune sequencer, and the same
   loop / input / overlay / high-score plumbing.
   Every game calls Arcade.game({...}) exactly once.
   ============================================================ */
(function () {
  'use strict';

  var A = {};
  window.Arcade = A;
  A.NS = 'neon95';

  /* ---------- palette ---------- */
  A.C = {
    bg: '#07040f', ink: '#f4f6ff',
    pink: '#ff2e88', cyan: '#22e0ff', yellow: '#ffd400', green: '#39ff88',
    purple: '#9d4dff', orange: '#ff7a1a', red: '#ff3355', blue: '#3b6bff',
    teal: '#00d0a4', gold: '#ffb020', bone: '#e8e2d0', dim: '#6a5a99',
    steel: '#8fa3c8', dark: '#140a24'
  };

  /* ---------- utils ---------- */
  A.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  A.lerp = function (a, b, t) { return a + (b - a) * t; };
  A.rand = function (a, b) { if (b === undefined) { b = a; a = 0; } return a + Math.random() * (b - a); };
  A.randInt = function (a, b) { return Math.floor(A.rand(a, b + 1)); };
  A.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  A.dist = function (x1, y1, x2, y2) { var dx = x2 - x1, dy = y2 - y1; return Math.sqrt(dx * dx + dy * dy); };
  A.hit = function (a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  };
  A.wrapAngle = function (a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  };
  A.pad = function (n, len) { return String(Math.max(0, Math.floor(n))).padStart(len || 6, '0'); };
  A.clock = function (sec) {
    if (sec < 0) sec = 0;
    var m = Math.floor(sec / 60), s = Math.floor(sec % 60), c = Math.floor((sec * 100) % 100);
    return (m > 0 ? m + ':' : '') + String(s).padStart(2, '0') + '.' + String(c).padStart(2, '0');
  };

  function el(tag, cls, parent, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    if (parent) parent.appendChild(n);
    return n;
  }

  /* ---------- pixel-art sprites ---------- */
  A.pixels = function (ctx, art, x, y, s, pal, flip) {
    var cols = art[0].length;
    for (var r = 0; r < art.length; r++) {
      var row = art[r];
      for (var c = 0; c < row.length; c++) {
        var ch = row[c];
        if (ch === '.' || ch === ' ') continue;
        ctx.fillStyle = pal[ch] || '#fff';
        var cc = flip ? (cols - 1 - c) : c;
        ctx.fillRect(Math.round(x + cc * s), Math.round(y + r * s), Math.ceil(s), Math.ceil(s));
      }
    }
  };
  A.artW = function (art, s) { return art[0].length * s; };
  A.artH = function (art, s) { return art.length * s; };

  /* ---------- audio: synth + chiptune sequencer ---------- */
  var AudioBox = {
    ctx: null, muted: false, master: null,
    boot: function () {
      if (!this.ctx) {
        var C = window.AudioContext || window.webkitAudioContext;
        if (C) {
          this.ctx = new C();
          this.master = this.ctx.createGain();
          this.master.gain.value = 0.9;
          this.master.connect(this.ctx.destination);
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    },
    out: function () { return this.master || (this.ctx && this.ctx.destination); },
    tone: function (o) {
      if (this.muted) return;
      var c = this.boot(); if (!c) return;
      var t = c.currentTime;
      var osc = c.createOscillator(), g = c.createGain();
      osc.type = o.type || 'square';
      osc.frequency.setValueAtTime(o.f0, t);
      if (o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f1), t + o.dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(o.vol || 0.14, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
      osc.connect(g); g.connect(this.out());
      osc.start(t); osc.stop(t + o.dur + 0.02);
    },
    noise: function (dur, vol, sweep, hp) {
      if (this.muted) return;
      var c = this.boot(); if (!c) return;
      var n = Math.max(1, Math.floor(c.sampleRate * dur));
      var buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      var src = c.createBufferSource(); src.buffer = buf;
      var f = c.createBiquadFilter();
      f.type = hp ? 'highpass' : 'lowpass';
      f.frequency.setValueAtTime(hp ? 900 : (sweep ? 3200 : 1200), c.currentTime);
      if (sweep && !hp) f.frequency.exponentialRampToValueAtTime(110, c.currentTime + dur);
      var g = c.createGain(); g.gain.setValueAtTime(vol || 0.16, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
      src.connect(f); f.connect(g); g.connect(this.out());
      src.start();
    }
  };
  A.audio = AudioBox;

  var SFX = {
    laser:   function () { AudioBox.tone({ type: 'square', f0: 880, f1: 180, dur: 0.12, vol: 0.10 }); },
    shoot:   function () { AudioBox.tone({ type: 'sawtooth', f0: 620, f1: 120, dur: 0.09, vol: 0.10 }); },
    pistol:  function () { AudioBox.noise(0.12, 0.20, true); AudioBox.tone({ type: 'square', f0: 300, f1: 60, dur: 0.08, vol: 0.10 }); },
    shotgun: function () { AudioBox.noise(0.30, 0.26, true); AudioBox.tone({ type: 'sawtooth', f0: 160, f1: 40, dur: 0.22, vol: 0.14 }); },
    chain:   function () { AudioBox.noise(0.07, 0.14, true); },
    reload:  function () { AudioBox.tone({ type: 'square', f0: 180, dur: 0.05, vol: 0.10 });
                           setTimeout(function () { AudioBox.tone({ type: 'square', f0: 300, dur: 0.06, vol: 0.10 }); }, 90); },
    hit:     function () { AudioBox.tone({ type: 'square', f0: 220, f1: 70, dur: 0.14, vol: 0.14 }); },
    punch:   function () { AudioBox.noise(0.10, 0.18, true); AudioBox.tone({ type: 'square', f0: 150, f1: 60, dur: 0.10, vol: 0.12 }); },
    slash:   function () { AudioBox.noise(0.16, 0.14, false, true); },
    blip:    function () { AudioBox.tone({ type: 'square', f0: 660, dur: 0.05, vol: 0.09 }); },
    beep:    function () { AudioBox.tone({ type: 'square', f0: 440, dur: 0.06, vol: 0.09 }); },
    coin:    function () { AudioBox.tone({ type: 'square', f0: 988, dur: 0.06, vol: 0.10 });
                           setTimeout(function () { AudioBox.tone({ type: 'square', f0: 1319, dur: 0.12, vol: 0.10 }); }, 60); },
    power:   function () { AudioBox.tone({ type: 'triangle', f0: 330, f1: 1200, dur: 0.25, vol: 0.12 }); },
    jump:    function () { AudioBox.tone({ type: 'square', f0: 300, f1: 720, dur: 0.10, vol: 0.10 }); },
    thrust:  function () { AudioBox.noise(0.09, 0.05, false); },
    carve:   function () { AudioBox.noise(0.14, 0.06, false, true); },
    splash:  function () { AudioBox.noise(0.35, 0.13, false, true); },
    explode: function () { AudioBox.noise(0.45, 0.20, true); },
    crash:   function () { AudioBox.noise(0.6, 0.24, true); },
    die:     function () { AudioBox.tone({ type: 'sawtooth', f0: 400, f1: 40, dur: 0.6, vol: 0.16 }); },
    gate:    function () { AudioBox.tone({ type: 'square', f0: 740, dur: 0.05, vol: 0.09 });
                           setTimeout(function () { AudioBox.tone({ type: 'square', f0: 1100, dur: 0.07, vol: 0.09 }); }, 45); },
    whistle: function () { AudioBox.tone({ type: 'triangle', f0: 1400, f1: 2100, dur: 0.18, vol: 0.10 }); },
    start:   function () { [523, 659, 784, 1047].forEach(function (f, i) {
                             setTimeout(function () { AudioBox.tone({ type: 'square', f0: f, dur: 0.10, vol: 0.11 }); }, i * 70); }); },
    over:    function () { [523, 415, 330, 196].forEach(function (f, i) {
                             setTimeout(function () { AudioBox.tone({ type: 'square', f0: f, dur: 0.22, vol: 0.12 }); }, i * 150); }); },
    win:     function () { [523, 659, 784, 1047, 1319].forEach(function (f, i) {
                             setTimeout(function () { AudioBox.tone({ type: 'square', f0: f, dur: 0.14, vol: 0.11 }); }, i * 90); }); },
    medal:   function () { [784, 988, 1175, 1568].forEach(function (f, i) {
                             setTimeout(function () { AudioBox.tone({ type: 'triangle', f0: f, dur: 0.18, vol: 0.12 }); }, i * 110); }); }
  };
  A.sfx = function (name) { var f = SFX[name]; if (f) f(); };

  /* ---------- chiptune loop ----------
     A track is { bpm, bass: [semitones|null], lead: [..], drums: 'xox.' } */
  var Music = {
    track: null, timer: null, step: 0, nextTime: 0, on: false,
    note: function (n) { return 440 * Math.pow(2, (n - 69) / 12); },
    play: function (track) {
      this.track = track;
      this.start();
    },
    start: function () {
      if (!this.track || this.on) return;
      var c = AudioBox.boot(); if (!c) return;
      this.on = true; this.step = 0; this.nextTime = c.currentTime + 0.06;
      var self = this;
      this.timer = setInterval(function () { self.tick(); }, 25);
    },
    stop: function () {
      this.on = false;
      if (this.timer) { clearInterval(this.timer); this.timer = null; }
    },
    tick: function () {
      var c = AudioBox.ctx; if (!c || !this.on || AudioBox.muted) return;
      var t = this.track, spb = 60 / (t.bpm || 132) / 2; // eighth notes
      while (this.nextTime < c.currentTime + 0.2) {
        this.voice(t, this.step, this.nextTime, spb);
        this.step = (this.step + 1) % Math.max(t.bass.length, t.lead ? t.lead.length : 1);
        this.nextTime += spb;
      }
    },
    voice: function (t, step, when, spb) {
      var c = AudioBox.ctx;
      var out = AudioBox.out();
      function blip(n, type, vol, len) {
        if (n === null || n === undefined) return;
        var osc = c.createOscillator(), g = c.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(Music.note(n), when);
        g.gain.setValueAtTime(0.0001, when);
        g.gain.linearRampToValueAtTime(vol, when + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, when + len);
        osc.connect(g); g.connect(out);
        osc.start(when); osc.stop(when + len + 0.02);
      }
      blip(t.bass[step % t.bass.length], 'square', 0.055, spb * 0.9);
      if (t.lead) blip(t.lead[step % t.lead.length], 'triangle', 0.045, spb * 0.8);
      if (t.drums) {
        var d = t.drums[step % t.drums.length];
        if (d === 'x' || d === 'o') {
          var n = Math.floor(c.sampleRate * (d === 'x' ? 0.09 : 0.05));
          var buf = c.createBuffer(1, n, c.sampleRate), ch = buf.getChannelData(0);
          for (var i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
          var src = c.createBufferSource(); src.buffer = buf;
          var f = c.createBiquadFilter();
          f.type = d === 'x' ? 'lowpass' : 'highpass';
          f.frequency.value = d === 'x' ? 260 : 4200;
          var g = c.createGain(); g.gain.setValueAtTime(d === 'x' ? 0.10 : 0.035, when);
          g.gain.exponentialRampToValueAtTime(0.0001, when + 0.12);
          src.connect(f); f.connect(g); g.connect(out);
          src.start(when);
        }
      }
    }
  };
  A.music = Music;

  /* ---------- high scores ---------- */
  function hsKey(id) { return A.NS + ':hs:' + id; }
  A.getBest = function (id) { try { return parseInt(localStorage.getItem(hsKey(id)) || '0', 10) || 0; } catch (e) { return 0; } };
  A.setBest = function (id, v) { try { localStorage.setItem(hsKey(id), String(v)); } catch (e) {} };

  /* ============================================================
     THE CABINET
     ============================================================ */
  A.game = function (def) {
    var cfg = {
      id: 'game', title: 'GAME', tagline: '', help: '',
      width: 480, height: 720,
      dpad: 'full',                       // 'full' | 'horizontal' | 'vertical' | false
      buttons: [{ id: 'a', label: 'FIRE' }],
      showScore: true, showLives: false,
      hud: [],                            // extra HUD slots: [{ id, label }]
      startText: 'PRESS  START',
      music: null,
      instructions: null,                 // array of lines shown on the title card
      setup: function () {}, update: function () {}, draw: function () {},
      drawOverlayExtra: null
    };
    for (var k in def) cfg[k] = def[k];

    document.title = 'NEON ARCADE 95 // ' + cfg.title;

    /* ---------- DOM ---------- */
    var root = el('div', 'cab', document.body);

    var bar = el('div', 'cab-bar', root);
    var back = el('a', 'cab-btn', bar, '&#9664; ARCADE');
    back.href = A.hubHref || '../index.html';
    el('div', 'cab-title', bar, cfg.title);
    var tools = el('div', 'cab-tools', bar);
    var soundBtn = el('button', 'cab-btn', tools, 'SND ON');
    var fsBtn = el('button', 'cab-btn', tools, 'FULL');

    var hud = el('div', 'cab-hud', root);
    var scoreEl = el('div', 'hud-item', hud, '<span>SCORE</span><b>0</b>');
    var livesEl = el('div', 'hud-item', hud, '<span>LIVES</span><b>3</b>');
    var slots = {};
    (cfg.hud || []).forEach(function (s) {
      var n = el('div', 'hud-item', hud, '<span>' + s.label + '</span><b>-</b>');
      slots[s.id] = n.querySelector('b');
    });
    var bestEl = el('div', 'hud-item', hud, '<span>BEST</span><b>0</b>');
    if (!cfg.showLives) livesEl.style.display = 'none';
    if (!cfg.showScore) scoreEl.style.display = 'none';

    var stage = el('div', 'cab-stage', root);
    var canvas = el('canvas', 'cab-canvas', stage);
    var ctx = canvas.getContext('2d');

    var pad = el('div', 'cab-pad', root);
    var padLeft = el('div', 'pad-dir', pad);
    var padRight = el('div', 'pad-act', pad);

    el('div', 'cab-help', root,
      (cfg.help ? cfg.help + '<br>' : '') +
      '<span class="kbd-only">KEYS: ARROWS / WASD &nbsp; SPACE=A &nbsp; X=B &nbsp; C=C &nbsp; P=PAUSE &nbsp; R=RESTART</span>');

    /* ---------- input ---------- */
    var held = {}, edge = {};
    function down(name) { if (!held[name]) edge[name] = true; held[name] = true; AudioBox.boot(); }
    function up(name) { held[name] = false; }

    var KEYS = {
      ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
      a: 'left', d: 'right', w: 'up', s: 'down',
      A: 'left', D: 'right', W: 'up', S: 'down',
      ' ': 'a', Enter: 'start',
      z: 'a', Z: 'a', j: 'a', J: 'a',
      x: 'b', X: 'b', k: 'b', K: 'b', Shift: 'b',
      c: 'c', C: 'c', l: 'c', L: 'c', Control: 'c',
      q: 'lq', Q: 'lq', e: 'rq', E: 'rq'
    };
    window.addEventListener('keydown', function (e) {
      if (e.key === 'p' || e.key === 'P') { togglePause(); e.preventDefault(); return; }
      if (e.key === 'r' || e.key === 'R') { start(); e.preventDefault(); return; }
      var n = KEYS[e.key];
      if (n) {
        down(n);
        if (n !== 'lq' && n !== 'rq') e.preventDefault();
      }
      if (state !== 'play' && (n === 'a' || n === 'start')) start();
    }, { passive: false });
    window.addEventListener('keyup', function (e) { var n = KEYS[e.key]; if (n) up(n); });
    window.addEventListener('blur', function () { held = {}; if (state === 'play') pause(true); });

    function mkBtn(parent, cls, label, name) {
      var b = el('button', 'tbtn ' + cls, parent, label);
      b.setAttribute('aria-label', name);
      var active = false;
      function on(e) { e.preventDefault(); if (!active) { active = true; b.classList.add('on'); down(name); if (state !== 'play') start(); } }
      function off(e) { if (e) e.preventDefault(); if (active) { active = false; b.classList.remove('on'); up(name); } }
      b.addEventListener('pointerdown', on);
      b.addEventListener('pointerup', off);
      b.addEventListener('pointerleave', off);
      b.addEventListener('pointercancel', off);
      b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      return b;
    }

    if (cfg.dpad === 'full' || cfg.dpad === 'vertical') mkBtn(padLeft, 'up', '&#9650;', 'up');
    if (cfg.dpad === 'full' || cfg.dpad === 'horizontal') {
      mkBtn(padLeft, 'left', '&#9664;', 'left');
      mkBtn(padLeft, 'right', '&#9654;', 'right');
    }
    if (cfg.dpad === 'full' || cfg.dpad === 'vertical') mkBtn(padLeft, 'down', '&#9660;', 'down');
    if (!cfg.dpad) padLeft.style.display = 'none';
    padLeft.classList.add('dpad-' + (cfg.dpad || 'none'));

    (cfg.buttons || []).forEach(function (b, i) {
      mkBtn(padRight, 'act act' + i, b.label, b.id || (i === 0 ? 'a' : i === 1 ? 'b' : 'c'));
    });
    if ((cfg.buttons || []).length > 2) padRight.classList.add('three');

    /* pointer on the playfield (logical coords) */
    var pointer = { x: cfg.width / 2, y: cfg.height / 2, dx: 0, dy: 0, down: false, justDown: false, justUp: false, inside: false };
    function toLogical(e) {
      var r = canvas.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width * cfg.width;
      var ny = (e.clientY - r.top) / r.height * cfg.height;
      pointer.dx += nx - pointer.x; pointer.dy += ny - pointer.y;
      pointer.x = nx; pointer.y = ny;
      pointer.inside = nx >= 0 && ny >= 0 && nx <= cfg.width && ny <= cfg.height;
    }
    canvas.addEventListener('pointerdown', function (e) {
      e.preventDefault(); toLogical(e); pointer.down = true; pointer.justDown = true;
      AudioBox.boot();
      if (state !== 'play') start();
    });
    canvas.addEventListener('pointermove', function (e) { toLogical(e); });
    window.addEventListener('pointerup', function () { if (pointer.down) pointer.justUp = true; pointer.down = false; });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    /* ---------- game context ---------- */
    var g = {
      w: cfg.width, h: cfg.height,
      ctx: ctx, canvas: canvas,
      C: A.C,
      score: 0, best: A.getBest(cfg.id), lives: 3, level: 1, time: 0,
      pointer: pointer,
      clamp: A.clamp, lerp: A.lerp, rand: A.rand, randInt: A.randInt, pick: A.pick,
      dist: A.dist, hit: A.hit, wrapAngle: A.wrapAngle, pad: A.pad, clock: A.clock,
      pixels: function (art, x, y, s, pal, flip) { A.pixels(ctx, art, x, y, s, pal, flip); },
      sfx: A.sfx,
      held: function (n) { return !!held[n]; },
      pressed: function (n) { return !!edge[n]; },
      release: function (n) { held[n] = false; },
      axisX: function () { return (held.right ? 1 : 0) - (held.left ? 1 : 0); },
      axisY: function () { return (held.down ? 1 : 0) - (held.up ? 1 : 0); },
      addScore: function (n) {
        /* fractional trickle (speed, time bonuses) accumulates instead of flooring to zero */
        scoreAcc += n;
        var whole = Math.floor(scoreAcc);
        if (whole !== 0) { scoreAcc -= whole; g.score += whole; syncHud(); }
      },
      setScore: function (n) { g.score = n; scoreAcc = 0; syncHud(); },
      setLives: function (n) { g.lives = n; syncHud(); },
      setHud: function (id, v) { if (slots[id]) slots[id].textContent = String(v); },
      shake: function (amt) { shakeAmt = Math.max(shakeAmt, amt); },
      /* freeze the action for a beat - the single biggest 'feel' win on impacts */
      hitstop: function (sec) { hitstopT = Math.max(hitstopT, sec || 0.06); },
      /* a number that pops off the thing you just hit */
      popup: function (text, x, y, opt) {
        opt = opt || {};
        popups.push({ text: String(text), x: x, y: y, t: 0,
                      life: opt.life || 0.8, size: opt.size || 12,
                      color: opt.color || A.C.yellow, vy: opt.vy === undefined ? -52 : opt.vy });
      },
      /* phone haptics, off with the sound */
      rumble: function (ms) {
        if (AudioBox.muted) return;
        try { if (navigator.vibrate) navigator.vibrate(ms || 30); } catch (e) {}
      },
      flash: function (col, dur) { flashCol = col || '#fff'; flashT = flashLeft = dur || 0.12; },
      banner: function (txt, dur, col) { bannerTxt = txt; bannerLeft = bannerT = dur || 1.6; bannerCol = col || A.C.yellow; },
      burst: function (x, y, color, n, spd, grav) {
        n = n || 14; spd = spd || 160;
        for (var i = 0; i < n; i++) {
          var a = Math.random() * Math.PI * 2, s = spd * (0.3 + Math.random() * 0.9);
          parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
                       life: 0.4 + Math.random() * 0.5, t: 0, gr: grav === undefined ? 140 : grav,
                       c: Array.isArray(color) ? A.pick(color) : color,
                       s: 2 + Math.random() * 3, hot: Math.random() < 0.45 });
        }
      },
      over: function (msg) { if (state === 'play') { state = 'over'; overMsg = msg || 'GAME OVER'; overT = 0; finish(); } },
      win: function (msg) { if (state === 'play') { state = 'over'; overMsg = msg || 'YOU WIN!'; overT = 0; won = true; finish(); } },

      /* drawing helpers */
      text: function (str, x, y, opt) {
        opt = opt || {};
        var size = opt.size || 16;
        ctx.save();
        ctx.font = size + 'px "Press Start 2P", "Courier New", monospace';
        ctx.textAlign = opt.align || 'center';
        ctx.textBaseline = opt.baseline || 'middle';
        if (opt.glow !== false) { ctx.shadowColor = opt.glow || opt.color || '#fff'; ctx.shadowBlur = opt.blur === undefined ? 12 : opt.blur; }
        ctx.fillStyle = opt.color || '#fff';
        ctx.fillText(str, x, y);
        ctx.restore();
      },
      rect: function (x, y, w, h, color, glow) {
        ctx.save();
        if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow === true ? 12 : glow; }
        ctx.fillStyle = color; ctx.fillRect(x, y, w, h);
        ctx.restore();
      },
      circle: function (x, y, r, color, glow) {
        ctx.save();
        if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow === true ? 12 : glow; }
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      },
      line: function (x1, y1, x2, y2, color, w, glow) {
        ctx.save();
        if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow === true ? 10 : glow; }
        ctx.strokeStyle = color; ctx.lineWidth = w || 2;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.restore();
      },
      poly: function (pts, color, glow) {
        ctx.save();
        if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow === true ? 10 : glow; }
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      },
      bar: function (x, y, w, h, pct, color, back) {
        ctx.save();
        ctx.fillStyle = back || 'rgba(0,0,0,0.55)';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = color;
        ctx.shadowColor = color; ctx.shadowBlur = 8;
        ctx.fillRect(x + 1, y + 1, Math.max(0, (w - 2) * A.clamp(pct, 0, 1)), h - 2);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        ctx.restore();
      },
      gradient: function (y0, y1, stops) {
        var grd = ctx.createLinearGradient(0, y0, 0, y1);
        for (var i = 0; i < stops.length; i++) grd.addColorStop(stops[i][0], stops[i][1]);
        return grd;
      },
      sky: function (y0, y1, stops) {
        ctx.fillStyle = g.gradient(y0, y1, stops);
        ctx.fillRect(0, y0, cfg.width, y1 - y0);
      },
      clear: function (color) { ctx.fillStyle = color || cfg.bg || A.C.bg; ctx.fillRect(0, 0, cfg.width, cfg.height); },
      grid: function (color, step, alpha) {
        ctx.save(); ctx.globalAlpha = alpha === undefined ? 0.18 : alpha;
        ctx.strokeStyle = color || A.C.purple; ctx.lineWidth = 1;
        step = step || 40;
        ctx.beginPath();
        for (var x = 0; x <= cfg.width; x += step) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, cfg.height); }
        for (var y = 0; y <= cfg.height; y += step) { ctx.moveTo(0, y + 0.5); ctx.lineTo(cfg.width, y + 0.5); }
        ctx.stroke(); ctx.restore();
      }
    };
    A.current = g;

    function syncHud() {
      scoreEl.querySelector('b').textContent = A.pad(g.score, 6);
      livesEl.querySelector('b').textContent = String(Math.max(0, g.lives));
      bestEl.querySelector('b').textContent = A.pad(g.best, 6);
    }

    /* ---------- state ---------- */
    var state = 'title', overMsg = 'GAME OVER', overT = 0, won = false;
    var paused = false, shakeAmt = 0, flashT = 0, flashLeft = 0, flashCol = '#fff';
    var bannerTxt = '', bannerLeft = 0, bannerT = 1, bannerCol = A.C.yellow;
    var parts = [], popups = [];
    var titleT = 0, scoreAcc = 0, hitstopT = 0;
    var wipeT = 0, wipeDur = 0.45, vignette = null;

    function reset() {
      g.score = 0; scoreAcc = 0; g.lives = 3; g.level = 1; g.time = 0;
      parts.length = 0; popups.length = 0; shakeAmt = 0; won = false; bannerLeft = 0; hitstopT = 0;
      cfg.setup(g);
      syncHud();
    }
    function start() {
      AudioBox.boot();
      reset();
      state = 'play'; paused = false; overT = 0;
      wipeT = wipeDur;                      /* neon wipe into the action */
      A.sfx('start');
      if (cfg.music) Music.play(cfg.music);
    }
    function finish() {
      if (g.score > g.best) { g.best = g.score; A.setBest(cfg.id, g.best); }
      syncHud();
      Music.stop();
      A.sfx(won ? 'win' : 'over');
    }
    function pause(v) {
      paused = v === undefined ? !paused : v;
      if (paused) Music.stop(); else if (cfg.music && state === 'play') Music.start();
    }
    function togglePause() { if (state === 'play') pause(); }

    soundBtn.addEventListener('click', function () {
      AudioBox.muted = !AudioBox.muted;
      soundBtn.textContent = AudioBox.muted ? 'SND OFF' : 'SND ON';
      soundBtn.classList.toggle('off', AudioBox.muted);
      if (AudioBox.muted) Music.stop();
      else if (cfg.music && state === 'play' && !paused) Music.start();
    });
    fsBtn.addEventListener('click', function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (root.requestFullscreen) root.requestFullscreen().catch(function () {});
    });

    /* ---------- sizing ---------- */
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      var box = stage.getBoundingClientRect();
      var aw = box.width, ah = box.height;
      if (aw <= 0 || ah <= 0) return;
      var scale = Math.min(aw / cfg.width, ah / cfg.height);
      canvas.style.width = Math.floor(cfg.width * scale) + 'px';
      canvas.style.height = Math.floor(cfg.height * scale) + 'px';
      canvas.width = Math.floor(cfg.width * dpr);
      canvas.height = Math.floor(cfg.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    }
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', function () { setTimeout(resize, 200); });
    if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);

    /* ---------- overlays ---------- */
    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    /* the cabinet card every overlay sits in */
    function panel(x, y, w, h, col) {
      ctx.save();
      ctx.fillStyle = 'rgba(9,4,22,0.92)';
      roundRect(x, y, w, h, 10); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.shadowColor = col; ctx.shadowBlur = 16;
      roundRect(x + 1, y + 1, w - 2, h - 2, 10); ctx.stroke();
      /* corner ticks, like a targeting frame */
      ctx.shadowBlur = 0; ctx.lineWidth = 3;
      var t = 16;
      [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(function (c) {
        ctx.beginPath();
        ctx.moveTo(c[0] + t * c[2], c[1]);
        ctx.lineTo(c[0], c[1]);
        ctx.lineTo(c[0], c[1] + t * c[3]);
        ctx.stroke();
      });
      ctx.restore();
    }

    /* A / B / C button glyphs with what they do on this cabinet */
    function buttonLegend(cx, y, small) {
      var btns = cfg.buttons || [];
      if (!btns.length) return;
      var cols = [A.C.pink, A.C.cyan, A.C.yellow];
      var gap = Math.min(120, cfg.width / (btns.length + 0.6));
      var startX = cx - gap * (btns.length - 1) / 2;
      for (var i = 0; i < btns.length; i++) {
        var bx = startX + i * gap, col = cols[i % cols.length];
        ctx.save();
        ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(bx, y, 13, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        g.text((btns[i].id || 'a').toUpperCase(), bx, y + 1, { size: 10, color: '#08040f', glow: false });
        g.text(btns[i].label, bx, y + 26, { size: Math.max(6, small - 3), color: A.C.steel, glow: false });
      }
    }

    function chevrons(cx, y, col, t) {
      ctx.save();
      for (var i = 0; i < 3; i++) {
        ctx.globalAlpha = 0.25 + 0.75 * Math.max(0, Math.sin(t * 5 - i * 0.7));
        ctx.strokeStyle = col; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 10, y + i * 9 - 9);
        ctx.lineTo(cx, y + i * 9 - 3);
        ctx.lineTo(cx + 10, y + i * 9 - 9);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawOverlay() {
      ctx.save();
      ctx.fillStyle = 'rgba(5,2,14,0.78)';
      ctx.fillRect(0, 0, cfg.width, cfg.height);
      var cx = cfg.width / 2, cy = cfg.height / 2;
      var big = Math.max(14, Math.min(26, cfg.width / 17));
      var small = Math.max(8, Math.min(13, cfg.width / 36));
      var pw = Math.min(cfg.width - 28, 430);

      if (state === 'title') {
        var lines = cfg.instructions || [];
        var ph = 126 + lines.length * 22 + ((cfg.buttons || []).length ? 70 : 0) + 74;
        var py = cy - ph / 2;
        panel(cx - pw / 2, py, pw, ph, A.C.purple);

        var bob = Math.sin(titleT * 3) * 3;
        /* chromatic split on the title, the way a CRT smears a bright colour */
        g.text(cfg.title, cx - 2, py + 44 + bob, { size: big, color: 'rgba(255,46,136,0.55)', glow: false });
        g.text(cfg.title, cx + 2, py + 44 + bob, { size: big, color: 'rgba(34,224,255,0.55)', glow: false });
        g.text(cfg.title, cx, py + 44 + bob, { size: big, color: '#fff', glow: A.C.cyan });
        if (cfg.tagline) g.text(cfg.tagline, cx, py + 78 + bob, { size: small, color: A.C.pink });

        ctx.save();
        ctx.strokeStyle = 'rgba(157,77,255,0.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx - pw / 2 + 26, py + 100); ctx.lineTo(cx + pw / 2 - 26, py + 100); ctx.stroke();
        ctx.restore();

        var ly = py + 126;
        for (var i = 0; i < lines.length; i++)
          g.text(lines[i], cx, ly + i * 22, { size: small - 1, color: A.C.steel, glow: false });

        var by = ly + lines.length * 22 + 22;
        buttonLegend(cx, by, small);

        var sy = py + ph - 62;
        if (Math.floor(titleT * 2) % 2 === 0)
          g.text(cfg.startText, cx, sy, { size: small + 3, color: A.C.yellow, glow: A.C.yellow });
        g.text('BEST  ' + A.pad(g.best, 6), cx, sy + 30, { size: small, color: A.C.green });
        chevrons(cx, py + ph + 24, A.C.cyan, titleT);

      } else if (state === 'over') {
        var oh = 250, oy = cy - oh / 2;
        var oc = won ? A.C.green : A.C.pink;
        panel(cx - pw / 2, oy, pw, oh, oc);
        var pop = Math.min(1, overT * 6);                 /* the card punches in */
        ctx.save();
        ctx.translate(cx, oy + 52);
        ctx.scale(0.85 + pop * 0.15, 0.85 + pop * 0.15);
        ctx.translate(-cx, -(oy + 52));
        g.text(overMsg, cx, oy + 52, { size: big, color: oc, glow: oc });
        ctx.restore();

        row('SCORE', A.pad(g.score, 6), oy + 106, A.C.ink);
        row('BEST', A.pad(g.best, 6), oy + 136, A.C.yellow);
        if (g.score >= g.best && g.score > 0 && Math.floor(overT * 4) % 2 === 0)
          g.text('NEW  HIGH  SCORE!', cx, oy + 172, { size: small, color: A.C.green, glow: A.C.green });
        if (Math.floor(overT * 2) % 2 === 0 && overT > 0.7)
          g.text('TAP  TO  PLAY  AGAIN', cx, oy + oh - 26, { size: small, color: A.C.cyan });

      } else if (paused) {
        panel(cx - pw / 2, cy - 70, pw, 140, A.C.yellow);
        g.text('PAUSED', cx, cy - 18, { size: big, color: A.C.yellow, glow: A.C.yellow });
        g.text('PRESS  P  OR  TAP  TO  RESUME', cx, cy + 26, { size: small - 1, color: A.C.dim, glow: false });
      }

      function row(label, value, y, col) {
        var lx = cx - pw / 2 + 34, rx = cx + pw / 2 - 34;
        g.text(label, lx, y, { size: small, color: A.C.dim, align: 'left', glow: false });
        g.text(value, rx, y, { size: small + 2, color: col, align: 'right' });
        ctx.save();
        ctx.globalAlpha = 0.3; ctx.fillStyle = A.C.dim;
        for (var dx = lx + 58; dx < rx - 70; dx += 8) ctx.fillRect(dx, y, 2, 2);
        ctx.restore();
      }

      if (cfg.drawOverlayExtra) cfg.drawOverlayExtra(g, ctx, state);
      ctx.restore();
    }

    function drawBanner(dt) {
      if (bannerLeft <= 0) return;
      bannerLeft -= dt;
      var p = 1 - bannerLeft / bannerT;
      var a = p < 0.15 ? p / 0.15 : (p > 0.85 ? (1 - p) / 0.15 : 1);
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, a));
      var y = cfg.height * 0.32;
      ctx.fillStyle = 'rgba(5,2,14,0.72)';
      ctx.fillRect(0, y - 26, cfg.width, 52);
      ctx.fillStyle = bannerCol;
      ctx.fillRect(0, y - 27, cfg.width, 2);
      ctx.fillRect(0, y + 25, cfg.width, 2);
      g.text(bannerTxt, cfg.width / 2, y, { size: Math.max(11, Math.min(18, cfg.width / 26)), color: bannerCol, glow: bannerCol });
      ctx.restore();
    }

    /* ---------- loop ---------- */
    var last = 0;
    function frame(ts) {
      requestAnimationFrame(frame);
      if (!last) last = ts;
      var dt = Math.min(0.05, (ts - last) / 1000);
      last = ts;
      titleT += dt;
      if (state === 'over') overT += dt;

      ctx.save();
      if (shakeAmt > 0.2) {
        ctx.translate((Math.random() - 0.5) * shakeAmt, (Math.random() - 0.5) * shakeAmt);
        shakeAmt *= Math.pow(0.02, dt);
        if (shakeAmt < 0.2) shakeAmt = 0;
      }

      var frozen = hitstopT > 0;
      if (frozen) hitstopT -= dt;

      if (state === 'play' && !paused && !frozen) {
        g.time += dt;
        cfg.update(g, dt);
        for (var i = parts.length - 1; i >= 0; i--) {
          var p = parts[i];
          p.t += dt;
          if (p.t >= p.life) { parts.splice(i, 1); continue; }
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.gr * dt; p.vx *= 0.99;
        }
      }

      cfg.draw(g, ctx);

      ctx.save();
      for (var j = 0; j < parts.length; j++) {
        var q = parts[j];
        var qa = Math.max(0, 1 - q.t / q.life);
        ctx.globalAlpha = qa;
        ctx.fillStyle = q.c;
        if (q.hot) { ctx.shadowColor = q.c; ctx.shadowBlur = 8; } else { ctx.shadowBlur = 0; }
        var qs = q.s * (0.4 + qa * 0.6);
        ctx.fillRect(q.x - qs / 2, q.y - qs / 2, qs, qs);
      }
      ctx.restore();

      /* score popups rise off whatever you just hit */
      ctx.save();
      for (var k = popups.length - 1; k >= 0; k--) {
        var pu = popups[k];
        if (state === 'play' && !paused && !frozen) { pu.t += dt; pu.y += pu.vy * dt; pu.vy *= 0.94; }
        if (pu.t >= pu.life) { popups.splice(k, 1); continue; }
        var pa = Math.max(0, 1 - pu.t / pu.life);
        ctx.globalAlpha = pa;
        g.text(pu.text, pu.x, pu.y, { size: pu.size, color: pu.color, glow: pu.color, blur: 10 });
      }
      ctx.restore();

      if (flashLeft > 0) {
        flashLeft -= dt;
        ctx.save();
        ctx.globalAlpha = Math.max(0, flashLeft / flashT) * 0.7;
        ctx.fillStyle = flashCol;
        ctx.fillRect(0, 0, cfg.width, cfg.height);
        ctx.restore();
      }

      if (state === 'play' && !paused) drawBanner(dt);
      ctx.restore();

      if (state !== 'play' || paused) drawOverlay();

      /* ---- CRT glass ---- */
      ctx.save();
      ctx.globalAlpha = 0.09;
      ctx.fillStyle = '#000';
      for (var y = 0; y < cfg.height; y += 4) ctx.fillRect(0, y, cfg.width, 2);

      /* the slow bright band that rolls down a real tube */
      var bandY = ((titleT * 70) % (cfg.height + 260)) - 130;
      var band = ctx.createLinearGradient(0, bandY, 0, bandY + 130);
      band.addColorStop(0, 'rgba(160,220,255,0)');
      band.addColorStop(0.5, 'rgba(160,220,255,0.055)');
      band.addColorStop(1, 'rgba(160,220,255,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = band;
      ctx.fillRect(0, bandY, cfg.width, 130);

      /* vignette: built once, the tube is darker at the corners */
      if (!vignette) {
        vignette = ctx.createRadialGradient(
          cfg.width / 2, cfg.height / 2, Math.min(cfg.width, cfg.height) * 0.52,
          cfg.width / 2, cfg.height / 2, Math.max(cfg.width, cfg.height) * 0.82);
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(0.65, 'rgba(0,0,0,0.10)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.30)');
      }
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, cfg.width, cfg.height);
      ctx.restore();

      /* ---- neon wipe when a game starts ---- */
      if (wipeT > 0) {
        wipeT -= dt;
        var wp = Math.max(0, wipeT / wipeDur);
        ctx.save();
        ctx.globalAlpha = wp * 0.9;
        ctx.fillStyle = '#07040f';
        ctx.fillRect(0, 0, cfg.width, cfg.height);
        ctx.globalAlpha = Math.min(1, wp * 1.6);
        var wy = (1 - wp) * cfg.height;
        ctx.fillStyle = A.C.cyan; ctx.shadowColor = A.C.cyan; ctx.shadowBlur = 24;
        ctx.fillRect(0, wy - 2, cfg.width, 4);
        ctx.restore();
      }

      edge = {};
      pointer.justDown = false; pointer.justUp = false;
      pointer.dx = 0; pointer.dy = 0;
    }

    /* ---------- boot ---------- */
    function boot() {
      resize();
      reset();
      state = 'title';
      syncHud();
      requestAnimationFrame(frame);
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(boot).catch(boot);
      setTimeout(function () { if (!last) resize(); }, 500);
    } else boot();

    return g;
  };
})();
