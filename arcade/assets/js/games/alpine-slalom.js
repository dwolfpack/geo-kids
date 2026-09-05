/* ALPINE SLALOM — downhill against the clock: gates, moguls, kickers, trees */
(function () {
  var C = Arcade.C;

  var COURSE = 3600;          /* course length in units */
  var PPU = 0.62;             /* pixels per unit of depth */
  var LINE = 0.80;            /* player line, fraction of height */
  var MAXS = 620, MINS = 150;

  var TREE = [
    '....gg....',
    '...gggg...',
    '..gggggg..',
    '.gggggggg.',
    '...gggg...',
    '..gggggg..',
    '.gggggggg.',
    'gggggggggg',
    '....tt....',
    '....tt....'
  ];
  var ROCK = [
    '..rrrr..',
    '.rrrrrr.',
    'rrrhhrrr',
    'rrrrrrrr',
    '.rrrrrr.'
  ];
  var SKIER = [
    '..bbb...',
    '..bbb...',
    '..ff....',
    '.jjjjj..',
    'jjjjjjj.',
    '.jjjjj..',
    '..jjj...',
    '..j.j...',
    '..s.s...',
    '.sss.sss'
  ];
  var TUCK = [
    '........',
    '..bbb...',
    '.jbbbj..',
    'jjjjjjj.',
    '.jjjjj..',
    '..jjj...',
    '..j.j...',
    '..s.s...',
    '.sss.sss',
    '........'
  ];
  var P_TREE = { g: '#1d6b3a', t: '#5b3a1c' };
  var P_ROCK = { r: '#7d8296', h: '#aab0c4' };
  var P_SKI = { b: C.yellow, f: '#f0c08a', j: C.pink, s: C.cyan };

  function buildCourse(g) {
    var o = [];
    var d = 260;
    var side = 1;
    while (d < COURSE - 200) {
      /* slalom gate */
      var gx = g.w * 0.5 + side * Arcade.rand(30, g.w * 0.26);
      o.push({ type: 'gate', d: d, x: gx, w: 104, red: side > 0, done: false });
      side = -side;
      /* scenery between gates */
      var extras = Arcade.randInt(1, 3);
      for (var i = 0; i < extras; i++) {
        var ed = d + Arcade.rand(30, 110);
        var ex = Arcade.rand(24, g.w - 24);
        if (Math.abs(ex - gx) < 70) ex = ex < gx ? ex - 70 : ex + 70;
        var r = Math.random();
        if (r < 0.45) o.push({ type: 'tree', d: ed, x: g.clamp(ex, 10, g.w - 10) });
        else if (r < 0.68) o.push({ type: 'rock', d: ed, x: g.clamp(ex, 10, g.w - 10) });
        else if (r < 0.86) o.push({ type: 'mogul', d: ed, x: g.clamp(ex, 10, g.w - 10) });
        else o.push({ type: 'kicker', d: ed, x: g.clamp(ex, 30, g.w - 30) });
      }
      d += Arcade.rand(150, 230);
    }
    o.push({ type: 'finish', d: COURSE, x: g.w / 2 });
    o.sort(function (a, b) { return a.d - b.d; });
    return o;
  }

  Arcade.game({
    id: 'alpine-slalom',
    title: 'ALPINE SLALOM',
    tagline: 'CARVE THE GATES. BEAT THE CLOCK.',
    help: 'LEFT / RIGHT CARVE. A TUCK FOR SPEED. B JUMP, HOLD IN AIR FOR A TRICK.',
    instructions: ['LEFT / RIGHT   CARVE', 'A   TUCK  (FASTER, LESS GRIP)', 'B   JUMP / SPIN IN THE AIR', 'MISS A GATE AND LOSE 3 SECONDS'],
    width: 480, height: 720,
    dpad: 'horizontal',
    buttons: [{ id: 'a', label: 'TUCK' }, { id: 'b', label: 'JUMP' }],
    hud: [{ id: 'gates', label: 'GATES' }, { id: 'time', label: 'TIME' }, { id: 'kph', label: 'KM/H' }],
    music: { bpm: 144,
      bass: [45, 45, 52, 45, 43, 43, 50, 43, 41, 41, 48, 41, 40, 40, 47, 47],
      lead: [81, 84, 88, 84, 86, 89, 93, 89, 84, 88, 91, 88, 81, 84, 88, 84],
      drums: 'x.o.x.o.x.o.x.oo' },

    setup: function (g) {
      g.obs = buildCourse(g);
      g.dist = 0; g.speed = 260; g.x = g.w / 2; g.vx = 0; g.lean = 0;
      g.air = 0; g.airT = 0; g.spin = 0; g.trick = 0;
      g.timeLeft = 70; g.gates = 0; g.missed = 0; g.combo = 0;
      g.crashT = 0; g.done = false; g.snow = [];
      for (var i = 0; i < 60; i++) g.snow.push({ x: Arcade.rand(0, g.w), y: Arcade.rand(0, g.h), s: Arcade.rand(0.4, 1.4) });
      g.setHud('gates', '0');
      g.setHud('time', '70.0');
      g.setHud('kph', '0');
      g.banner('DROP  IN!', 1.4, C.cyan);
    },

    update: function (g, dt) {
      if (g.done) return;
      var playerY = g.h * LINE;

      /* --- crash recovery --- */
      if (g.crashT > 0) {
        g.crashT -= dt;
        g.speed = Math.max(MINS * 0.5, g.speed - 500 * dt);
        g.dist += g.speed * dt * 0.4;
        g.timeLeft -= dt;
        if (g.timeLeft <= 0) return fail(g);
        g.setHud('time', g.timeLeft.toFixed(1));
        return;
      }

      /* --- speed --- */
      var tuck = g.held('a');
      var target = tuck ? MAXS : MAXS * 0.72;
      if (g.air > 0) target = g.speed;
      g.speed += (target - g.speed) * Math.min(1, dt * (tuck ? 0.9 : 0.6));
      /* carving scrubs speed */
      g.speed -= Math.abs(g.vx) * dt * 0.22;
      g.speed = g.clamp(g.speed, MINS, MAXS + 60);

      /* --- steering --- */
      var steer = g.axisX();
      if (!steer && g.pointer.down && g.pointer.inside) steer = g.clamp((g.pointer.x - g.x) / 60, -1, 1);
      var grip = (tuck ? 240 : 420) * (g.air > 0 ? 0.45 : 1);
      g.vx += steer * grip * dt;
      g.vx *= Math.pow(0.02, dt);
      g.x += g.vx * dt;
      g.lean = g.lerp(g.lean, steer, Math.min(1, dt * 9));
      if (g.x < 16) { g.x = 16; g.vx = Math.abs(g.vx) * 0.3; }
      if (g.x > g.w - 16) { g.x = g.w - 16; g.vx = -Math.abs(g.vx) * 0.3; }
      if (Math.abs(steer) > 0.5 && g.air <= 0 && Math.random() < 0.5) {
        g.burst(g.x - g.lean * 10, playerY + 16, ['#ffffff', '#cfe8ff'], 2, 70, 40);
        if (Math.random() < 0.08) g.sfx('carve');
      }

      /* --- air / tricks --- */
      if (g.air > 0) {
        g.airT += dt;
        g.air -= dt;
        if (g.held('b')) { g.spin += dt * 520; g.trick += dt * 260; }
        if (g.air <= 0) {
          g.air = 0;
          var spins = Math.floor(g.spin / 360);
          if (spins > 0) {
            var pts = spins * 500;
            g.addScore(pts);
            g.timeLeft += spins * 1.5;
            g.banner(spins >= 2 ? 'DOUBLE  SPIN!  +' + pts : 'SPIN!  +' + pts, 1.1, C.green);
            g.sfx('power');
          }
          g.spin = 0; g.trick = 0;
          g.burst(g.x, playerY + 14, ['#ffffff', '#cfe8ff'], 14, 130, 60);
          g.sfx('carve');
        }
      } else if (g.pressed('b')) {
        g.air = 0.55; g.airT = 0; g.spin = 0; g.sfx('jump');
      }

      /* --- move down the hill --- */
      g.dist += g.speed * dt;
      g.timeLeft -= dt;
      g.addScore(g.speed * dt * 0.02);

      /* --- collisions / gates --- */
      for (var i = 0; i < g.obs.length; i++) {
        var o = g.obs[i];
        var rel = o.d - g.dist;
        if (rel > 30 || rel < -30 || o.done) continue;
        if (o.type === 'gate') {
          o.done = true;
          if (Math.abs(g.x - o.x) < o.w / 2) {
            g.gates++; g.combo++;
            var bonus = 200 + g.combo * 25;
            g.addScore(bonus);
            g.timeLeft += 1.6;
            g.sfx('gate');
            g.setHud('gates', String(g.gates));
          } else {
            g.missed++; g.combo = 0;
            g.timeLeft -= 3;
            g.flash(C.red, 0.12);
            g.sfx('hit');
            g.banner('GATE  MISSED  -3s', 1.0, C.red);
          }
        } else if (o.type === 'finish') {
          o.done = true;
          g.done = true;
          var fin = 3000 + Math.floor(g.timeLeft * 150) + g.gates * 120;
          g.addScore(fin);
          g.sfx('medal');
          g.win('COURSE  CLEARED');
          return;
        } else if (Math.abs(rel) < 14 && g.air <= 0) {
          var near = Math.abs(g.x - o.x);
          if (o.type === 'tree' && near < 22) { o.done = true; crash(g, 'TREE!'); }
          else if (o.type === 'rock' && near < 20) { o.done = true; crash(g, 'ROCK!'); }
          else if (o.type === 'mogul' && near < 18) {
            o.done = true;
            g.speed *= 0.82; g.shake(8); g.sfx('carve');
            g.burst(g.x, g.h * LINE, ['#ffffff'], 8, 110, 60);
          } else if (o.type === 'kicker' && near < 30) {
            o.done = true;
            g.air = 0.8; g.airT = 0; g.spin = 0;
            g.sfx('jump'); g.addScore(150);
          }
        }
      }

      if (g.timeLeft <= 0) return fail(g);
      g.setHud('time', Math.max(0, g.timeLeft).toFixed(1));
      g.setHud('kph', String(Math.round(g.speed / 3.2)));

      /* snow drift */
      for (var s = 0; s < g.snow.length; s++) {
        var f = g.snow[s];
        f.y += (g.speed * 0.5 * f.s) * dt;
        f.x -= g.vx * dt * 0.4 * f.s;
        if (f.y > g.h) { f.y = -4; f.x = Arcade.rand(0, g.w); }
        if (f.x < 0) f.x += g.w; if (f.x > g.w) f.x -= g.w;
      }
    },

    draw: function (g, ctx) {
      var w = g.w, h = g.h, playerY = h * LINE;

      /* sky + peaks */
      ctx.fillStyle = g.gradient(0, h * 0.30, [[0, '#0d2a55'], [0.6, '#3f7cc0'], [1, '#a9d8f5']]);
      ctx.fillRect(0, 0, w, h * 0.30);
      ctx.fillStyle = '#c9e6ff';
      ctx.beginPath(); ctx.arc(w * 0.78, h * 0.09, 26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5f7fa8';
      for (var m = 0; m < 5; m++) {
        var mx = -40 + m * 130 - (g.x - w / 2) * 0.06;
        ctx.beginPath();
        ctx.moveTo(mx, h * 0.30); ctx.lineTo(mx + 70, h * 0.30 - (60 + (m % 3) * 34)); ctx.lineTo(mx + 140, h * 0.30);
        ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = '#eaf4ff';
      for (var m2 = 0; m2 < 5; m2++) {
        var mx2 = -40 + m2 * 130 - (g.x - w / 2) * 0.06;
        ctx.beginPath();
        ctx.moveTo(mx2 + 52, h * 0.30 - 40 - (m2 % 3) * 22);
        ctx.lineTo(mx2 + 70, h * 0.30 - (60 + (m2 % 3) * 34));
        ctx.lineTo(mx2 + 88, h * 0.30 - 40 - (m2 % 3) * 22);
        ctx.closePath(); ctx.fill();
      }

      /* snow field */
      ctx.fillStyle = g.gradient(h * 0.28, h, [[0, '#cfe2f2'], [0.35, '#eef6ff'], [1, '#ffffff']]);
      ctx.fillRect(0, h * 0.28, w, h - h * 0.28);
      /* piste stripes for speed feel */
      ctx.save();
      ctx.globalAlpha = 0.30;
      ctx.fillStyle = '#b9d4ea';
      for (var b = 0; b < 12; b++) {
        var by = ((g.dist * PPU * 0.5 + b * 70) % (h * 0.72)) + h * 0.28;
        var sc = (by - h * 0.28) / (h * 0.72);
        ctx.fillRect(0, by, w, 2 + sc * 5);
      }
      ctx.restore();
      /* side edges */
      ctx.fillStyle = '#dbe9f6';
      ctx.fillRect(0, h * 0.28, 8, h);
      ctx.fillRect(w - 8, h * 0.28, 8, h);

      /* objects, far to near */
      for (var i = g.obs.length - 1; i >= 0; i--) {
        var o = g.obs[i];
        var rel = o.d - g.dist;
        if (rel < -60) continue;
        var sy = playerY - rel * PPU;
        if (sy < h * 0.30) continue;   /* never draw scenery up in the sky */
        var depth = g.clamp((sy - h * 0.28) / (playerY - h * 0.28), 0, 1);
        var sc = 0.35 + depth * 0.75;
        var ox = w / 2 + (o.x - w / 2) * (0.55 + depth * 0.45);

        if (o.type === 'gate') {
          var col = o.red ? C.red : C.blue;
          var gw = o.w * sc;
          for (var s2 = -1; s2 <= 1; s2 += 2) {
            var px = ox + s2 * gw / 2;
            ctx.fillStyle = '#6b5a3a';
            ctx.fillRect(px - 1.5 * sc, sy - 34 * sc, 3 * sc, 34 * sc);
            ctx.save();
            ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 8;
            var flap = Math.sin(g.time * 6 + o.d) * 3 * sc;
            ctx.beginPath();
            ctx.moveTo(px, sy - 34 * sc);
            ctx.lineTo(px + 16 * sc * s2, sy - 28 * sc + flap);
            ctx.lineTo(px, sy - 20 * sc);
            ctx.closePath(); ctx.fill();
            ctx.restore();
          }
          if (o.done) {
            ctx.save(); ctx.globalAlpha = 0.5;
            g.text(g.combo > 0 ? 'OK' : 'X', ox, sy - 46 * sc, { size: 9 * sc + 4, color: g.combo > 0 ? C.green : C.red });
            ctx.restore();
          }
        } else if (o.type === 'tree') {
          g.pixels(TREE, ox - Arcade.artW(TREE, 3.2 * sc) / 2, sy - Arcade.artH(TREE, 3.2 * sc), 3.2 * sc, P_TREE);
        } else if (o.type === 'rock') {
          g.pixels(ROCK, ox - Arcade.artW(ROCK, 3 * sc) / 2, sy - Arcade.artH(ROCK, 3 * sc), 3 * sc, P_ROCK);
        } else if (o.type === 'mogul') {
          ctx.save(); ctx.fillStyle = '#d7e7f5';
          ctx.beginPath(); ctx.ellipse(ox, sy, 20 * sc, 8 * sc, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#b9d0e6';
          ctx.beginPath(); ctx.ellipse(ox, sy + 3 * sc, 20 * sc, 5 * sc, 0, 0, Math.PI); ctx.fill();
          ctx.restore();
        } else if (o.type === 'kicker') {
          ctx.save();
          ctx.fillStyle = '#8fd3ff';
          ctx.beginPath();
          ctx.moveTo(ox - 30 * sc, sy); ctx.lineTo(ox + 30 * sc, sy); ctx.lineTo(ox + 30 * sc, sy - 16 * sc);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = C.yellow; ctx.fillRect(ox - 30 * sc, sy - 2, 60 * sc, 3);
          ctx.restore();
        } else if (o.type === 'finish') {
          ctx.save();
          for (var f2 = 0; f2 < 12; f2++) {
            ctx.fillStyle = f2 % 2 ? '#111' : '#fff';
            ctx.fillRect(ox - 110 * sc + f2 * 18 * sc, sy - 46 * sc, 18 * sc, 12 * sc);
          }
          ctx.fillStyle = '#6b5a3a';
          ctx.fillRect(ox - 112 * sc, sy - 46 * sc, 4 * sc, 46 * sc);
          ctx.fillRect(ox + 108 * sc, sy - 46 * sc, 4 * sc, 46 * sc);
          g.text('FINISH', ox, sy - 60 * sc, { size: 12, color: C.yellow, glow: C.yellow });
          ctx.restore();
        }
      }

      /* skier */
      ctx.save();
      var art = g.held('a') && g.air <= 0 ? TUCK : SKIER;
      var sz = 5;
      var sy2 = playerY - (g.air > 0 ? Math.sin((1 - g.air / 0.8) * Math.PI) * 46 : 0);
      if (g.air > 0) {
        ctx.translate(g.x, sy2 - 18);
        ctx.rotate(g.spin * Math.PI / 180);
        ctx.translate(-g.x, -(sy2 - 18));
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
      }
      if (g.crashT > 0) {
        ctx.translate(g.x, sy2);
        ctx.rotate(Math.sin(g.time * 26) * 0.9);
        ctx.translate(-g.x, -sy2);
      }
      /* shadow */
      ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#3a5a78';
      ctx.beginPath(); ctx.ellipse(g.x, playerY + 6, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      g.pixels(art, g.x - Arcade.artW(art, sz) / 2, sy2 - Arcade.artH(art, sz), sz, P_SKI, g.lean < -0.3);
      ctx.restore();

      /* falling snow */
      ctx.save();
      ctx.fillStyle = '#ffffff';
      for (var s3 = 0; s3 < g.snow.length; s3++) {
        var fl = g.snow[s3];
        ctx.globalAlpha = 0.25 + fl.s * 0.35;
        ctx.fillRect(fl.x, fl.y, 1 + fl.s, 1 + fl.s);
      }
      ctx.restore();

      /* HUD */
      ctx.fillStyle = 'rgba(6,3,16,0.55)';
      ctx.fillRect(0, 0, w, 54);
      var tcol = g.timeLeft < 8 ? (Math.floor(g.time * 6) % 2 ? C.red : C.yellow) : C.ink;
      g.text(Math.max(0, g.timeLeft).toFixed(1), 10, 22, { size: 18, color: tcol, align: 'left', glow: tcol });
      g.text('GATES ' + g.gates + '   MISS ' + g.missed, 10, 44, { size: 8, color: C.steel, align: 'left', glow: false });
      g.text(Math.round(g.speed / 3.2) + ' KM/H', w - 10, 22, { size: 12, color: C.cyan, align: 'right' });
      if (g.combo > 2) g.text('COMBO x' + g.combo, w - 10, 44, { size: 9, color: C.green, align: 'right' });

      /* course progress */
      g.bar(w - 22, 70, 12, h - 160, 1 - g.dist / COURSE, C.pink);
      if (g.air > 0 && g.spin > 90) g.text(Math.floor(g.spin) + '°', g.x, sy2 - 60, { size: 12, color: C.yellow });
    }
  });

  function crash(g, msg) {
    g.crashT = 1.1;
    g.combo = 0;
    g.speed *= 0.25;
    g.timeLeft -= 2;
    g.shake(20); g.flash(C.red, 0.16);
    g.sfx('crash');
    g.burst(g.x, g.h * LINE, ['#ffffff', '#cfe8ff', C.pink], 24, 200, 120);
    g.banner(msg + '  -2s', 1.1, C.red);
  }
  function fail(g) {
    g.done = true;
    g.sfx('die');
    g.over('OUT  OF  TIME');
  }
})();
