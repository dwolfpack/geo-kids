/* NITRO GT — pseudo-3D checkpoint racer: 3 laps, rivals, drift and nitro */
(function () {
  var C = Arcade.C;

  var SEG = 200, RUMBLE = 3, ROAD_W = 1200;
  var DRAW = 110, CAM_H = 1250, CAM_D = 0.84, HORIZON = 0.42;
  var PLAYER_Z = CAM_H * CAM_D;
  var TOP = 12500, OFF_MAX = 3200, CENTRIF = 0.32;
  var LAPS = 3, START_TIME = 42, LAP_BONUS = 26;

  /* ---------- art ---------- */
  var CAR = [
    '.....wwwww.....',
    '....wxxxxxw....',
    '...wwxxxxxww...',
    '..wxxxxxxxxxw..',
    '.wxxxxxxxxxxxw.',
    'txxxxxxxxxxxxxt',
    'txxLxxxxxxxLxxt',
    'txxxxxxxxxxxxxt',
    '.ttt.......ttt.',
    '.ttt.......ttt.'
  ];
  var RIVAL = [
    '.....xxxxx.....',
    '....xxwwwxx....',
    '...xxxxxxxxx...',
    '..xxxxxxxxxxx..',
    '.xxxxxxxxxxxxx.',
    'txxxxxxxxxxxxxt',
    'txxRxxxxxxxRxxt',
    'txxxxxxxxxxxxxt',
    '.ttt.......ttt.',
    '.ttt.......ttt.'
  ];
  var PALM = [
    '..g...g..',
    '.gg.g.gg.',
    'gg.ggg.gg',
    '.g..t..g.',
    '....t....',
    '....t....',
    '....t....',
    '....t....',
    '....t....',
    '...ttt...'
  ];
  var BOARD = [
    'ccccccccccc',
    'c.........c',
    'c.aaa.aaa.c',
    'c.a.....a.c',
    'c.aaa.aaa.c',
    'c.........c',
    'ccccccccccc',
    '.....p.....',
    '.....p.....',
    '.....p.....',
    '.....p.....'
  ];
  var STAND = [
    'sssssssssssss',
    's.d.d.d.d.d.s',
    'sd.d.d.d.d.ds',
    'sssssssssssss',
    'pppppppppppp.',
    'p...........p'
  ];
  var ARCH = [
    'yyyyyyyyyyyyyyy',
    'y.ccccccccccc.y',
    'yyyyyyyyyyyyyyy',
    'p.............p',
    'p.............p',
    'p.............p',
    'p.............p',
    'p.............p'
  ];

  var P_CAR = { x: C.pink, w: '#ffd6e8', t: '#150a26', L: C.yellow };
  var P_PALM = { g: C.green, t: '#4a2f7a' };
  var P_BOARD = { c: C.cyan, a: C.pink, p: '#3a2b63' };
  var P_STAND = { s: '#4a3b7d', d: C.yellow, p: '#241a45' };
  var P_ARCH = { y: C.yellow, c: C.cyan, p: '#3a2b63' };
  var RIVAL_PALS = [C.cyan, C.green, C.orange, C.blue, C.yellow, C.teal].map(function (c) {
    return { x: c, w: '#08040f', t: '#150a26', R: C.red };
  });

  /* ---------- track ---------- */
  function lastY(s) { return s.length === 0 ? 0 : s[s.length - 1].p2.world.y; }
  function addSeg(s, curve, y) {
    var n = s.length;
    s.push({
      index: n, curve: curve, sprite: null, clip: 0, looped: false,
      light: Math.floor(n / RUMBLE) % 2 === 0,
      p1: { world: { y: lastY(s), z: n * SEG }, camera: {}, screen: {} },
      p2: { world: { y: y, z: (n + 1) * SEG }, camera: {}, screen: {} }
    });
  }
  function easeIn(a, b, p) { return a + (b - a) * p * p; }
  function easeOut(a, b, p) { return a + (b - a) * (1 - (1 - p) * (1 - p)); }
  function easeIO(a, b, p) { return a + (b - a) * (-Math.cos(p * Math.PI) / 2 + 0.5); }
  function addRoad(s, enter, hold, leave, curve, hill) {
    var y0 = lastY(s), y1 = y0 + hill * SEG, total = enter + hold + leave, n;
    for (n = 0; n < enter; n++) addSeg(s, easeIn(0, curve, n / enter), easeIO(y0, y1, n / total));
    for (n = 0; n < hold; n++) addSeg(s, curve, easeIO(y0, y1, (enter + n) / total));
    for (n = 0; n < leave; n++) addSeg(s, easeOut(curve, 0, n / leave), easeIO(y0, y1, (enter + hold + n) / total));
  }
  function buildTrack() {
    var s = [];
    addRoad(s, 20, 60, 20, 0, 0);
    for (var i = 0; i < 20; i++) {
      var curve = Arcade.pick([0, 2.4, -2.4, 4.5, -4.5, 6.4, -6.4, 3, -3]);
      var hill = Arcade.pick([0, 0, 25, -25, 45, -45, 60]);
      addRoad(s, Arcade.randInt(22, 40), Arcade.randInt(30, 74), Arcade.randInt(22, 40), curve, hill);
    }
    addRoad(s, 30, 50, 30, 0, -lastY(s) / SEG);
    /* scenery */
    for (var n = 14; n < s.length - 8; n += Arcade.randInt(7, 18)) {
      var side = Math.random() < 0.5 ? -1 : 1;
      var r = Math.random();
      if (r < 0.5) s[n].sprite = { art: PALM, pal: P_PALM, off: side * Arcade.rand(1.4, 2.8), ww: 900 };
      else if (r < 0.78) s[n].sprite = { art: BOARD, pal: P_BOARD, off: side * Arcade.rand(1.7, 2.5), ww: 1100 };
      else s[n].sprite = { art: STAND, pal: P_STAND, off: side * Arcade.rand(2.0, 2.9), ww: 2000 };
    }
    /* start / finish gantry */
    s[4].sprite = { art: ARCH, pal: P_ARCH, off: 0, ww: 3000, arch: true };
    return s;
  }

  function project(p, camX, camY, camZ, w, h) {
    p.camera.x = (p.world.x || 0) - camX;
    p.camera.y = p.world.y - camY;
    p.camera.z = p.world.z - camZ;
    var sc = CAM_D / p.camera.z;
    p.screen.scale = sc;
    p.screen.x = Math.round(w / 2 + sc * p.camera.x * w / 2);
    p.screen.y = Math.round(h * HORIZON - sc * p.camera.y * h / 2);
    p.screen.w = Math.round(sc * ROAD_W * w / 2);
  }
  function quad(ctx, x1, y1, w1, x2, y2, w2, col) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x1 - w1, y1); ctx.lineTo(x2 - w2, y2);
    ctx.lineTo(x2 + w2, y2); ctx.lineTo(x1 + w1, y1);
    ctx.closePath(); ctx.fill();
  }

  Arcade.game({
    id: 'nitro-gt',
    title: 'NITRO GT',
    tagline: 'THREE LAPS. ONE TANK OF NITRO.',
    help: 'STEER, GAS, BRAKE, NITRO. BEAT THE CLOCK AT EVERY LAP.',
    instructions: ['LEFT / RIGHT   STEER', 'A  GAS    B  BRAKE', 'C  NITRO  (REFILLS BY OVERTAKING)', '3 LAPS BEFORE THE CLOCK RUNS OUT'],
    width: 480, height: 720,
    dpad: 'horizontal',
    buttons: [{ id: 'a', label: 'GAS' }, { id: 'b', label: 'BRAKE' }, { id: 'c', label: 'NITRO' }],
    hud: [{ id: 'lap', label: 'LAP' }, { id: 'pos', label: 'POS' }, { id: 'time', label: 'TIME' }, { id: 'kph', label: 'KM/H' }],
    music: { bpm: 150,
      bass: [33, 33, 45, 33, 36, 36, 48, 36, 38, 38, 50, 38, 31, 31, 43, 43],
      lead: [69, null, 72, null, 76, null, 72, null, 74, null, 71, null, 69, null, null, null],
      drums: 'x.o.x.o.x.o.xxo.' },

    setup: function (g) {
      g.seg = buildTrack();
      g.trackLen = g.seg.length * SEG;
      g.pos = 0; g.speed = 0; g.playerX = 0; g.steer = 0; g.lean = 0;
      g.lap = 1; g.timeLeft = START_TIME; g.lapTime = 0; g.bestLap = 0;
      g.nitro = 1; g.boosting = false; g.boostT = 0;
      g.offroadT = 0; g.spin = 0; g.finished = false;
      g.rivals = [];
      for (var i = 0; i < 9; i++) {
        g.rivals.push({
          z: (400 + i * 900 + Arcade.rand(0, 500)) % g.trackLen,
          x: Arcade.pick([-0.62, -0.3, 0, 0.3, 0.62]),
          spd: TOP * Arcade.rand(0.42, 0.66),
          pal: RIVAL_PALS[i % RIVAL_PALS.length],
          lane: 0, passed: false
        });
      }
      g.passCount = 0; g.travel = 0;
      g.setHud('lap', '1/' + LAPS);
      g.setHud('pos', '-');
      g.setHud('time', START_TIME.toFixed(0));
      g.setHud('kph', '0');
      g.banner('LAP 1  -  GO!', 1.5, C.green);
    },

    update: function (g, dt) {
      if (g.finished) return;
      var maxSpeed = TOP * (g.boosting ? 1.34 : 1);
      var segNow = g.seg[Math.floor(g.pos / SEG) % g.seg.length];
      var speedPct = g.speed / TOP;

      /* --- throttle --- */
      var gas = g.held('a') || g.pointer.down;
      var brake = g.held('b');
      if (g.spin > 0) { g.spin -= dt; gas = false; }
      if (gas) g.speed += (brake ? 2000 : 5600) * dt;
      else g.speed -= 2600 * dt;
      if (brake) g.speed -= 9000 * dt;
      g.speed = g.clamp(g.speed, 0, maxSpeed);

      /* --- nitro --- */
      if (g.held('c') && g.nitro > 0.02 && g.speed > TOP * 0.35) {
        g.boosting = true;
        g.nitro = Math.max(0, g.nitro - dt * 0.34);
        if (g.nitro <= 0) g.boosting = false;
        if (Math.random() < 0.6) g.burst(g.w / 2 + Arcade.rand(-40, 40), g.h - 60, [C.cyan, C.yellow], 2, 120);
      } else {
        g.boosting = false;
        g.nitro = Math.min(1, g.nitro + dt * 0.02);
      }

      /* --- steering --- */
      var dx = dt * 2.4 * speedPct;
      var steerIn = g.axisX();
      if (!steerIn && g.pointer.down && g.pointer.inside) {
        steerIn = g.clamp((g.pointer.x - g.w / 2) / (g.w * 0.28), -1, 1);
      }
      if (g.spin > 0) steerIn = Math.sin(g.time * 22) * 1.2;
      g.steer = g.lerp(g.steer, steerIn, Math.min(1, dt * 9));
      g.playerX += g.steer * dx;
      g.playerX -= dx * speedPct * segNow.curve * CENTRIF;
      g.lean = g.lerp(g.lean, g.steer, Math.min(1, dt * 8));

      /* --- offroad --- */
      var off = Math.abs(g.playerX) > 1;
      if (off) {
        g.speed = Math.min(g.speed, TOP * 0.42);
        g.speed -= 3200 * dt;
        g.offroadT += dt;
        if (g.offroadT > 0.12) { g.offroadT = 0; g.sfx('carve'); g.shake(4); }
        g.burst(g.w / 2 + g.playerX * 60, g.h - 40, ['#8a7a3a', '#5f5230'], 2, 90);
      }
      g.playerX = g.clamp(g.playerX, -OFF_MAX / ROAD_W, OFF_MAX / ROAD_W);

      /* --- move --- */
      var prev = g.pos;
      g.pos = (g.pos + g.speed * dt) % g.trackLen;
      g.travel += g.speed * dt;
      if (g.pos < prev) {
        /* crossed the line */
        if (g.lap >= LAPS) {
          g.finished = true;
          var bonus = 4000 + Math.floor(g.timeLeft * 120);
          g.addScore(bonus);
          g.banner('FINISH!  +' + bonus, 2.2, C.green);
          g.win('RACE  COMPLETE');
          return;
        }
        g.lap++;
        g.timeLeft += LAP_BONUS;
        g.addScore(1500);
        g.nitro = Math.min(1, g.nitro + 0.4);
        g.sfx('medal');
        g.banner('LAP ' + g.lap + '  +' + LAP_BONUS + 's', 1.6, C.yellow);
        g.setHud('lap', g.lap + '/' + LAPS);
      }

      /* --- rivals --- */
      for (var i = 0; i < g.rivals.length; i++) {
        var r = g.rivals[i];
        var rseg = g.seg[Math.floor(r.z / SEG) % g.seg.length];
        /* simple AI: drift away from the curve and from the player */
        r.x = g.clamp(r.x - rseg.curve * dt * 0.06, -0.85, 0.85);
        var d = r.z - g.pos;
        if (d < -g.trackLen / 2) d += g.trackLen;
        if (d > g.trackLen / 2) d -= g.trackLen;
        if (d > 0 && d < 2200 && Math.abs(r.x - g.playerX) < 0.3) {
          r.x += (r.x > g.playerX ? 1 : -1) * dt * 0.7;
          r.x = g.clamp(r.x, -0.85, 0.85);
        }
        r.z = (r.z + r.spd * dt) % g.trackLen;

        /* collision */
        if (d < 0 && d > -420 && Math.abs(r.x - g.playerX) < 0.20 && g.speed > r.spd * 0.4) {
          g.speed = r.spd * 0.35;
          g.spin = 0.35;
          g.sfx('crash'); g.shake(18); g.flash(C.red, 0.12);
          g.burst(g.w / 2, g.h - 120, [C.orange, C.yellow, C.red], 22, 220);
          r.z = (r.z + 700) % g.trackLen;
        }
        /* overtake bonus */
        if (d > -1600 && d < -300 && !r.passed) {
          r.passed = true; g.passCount++;
          g.addScore(180);
          g.nitro = Math.min(1, g.nitro + 0.12);
          g.sfx('blip');
        }
        if (d > 900) r.passed = false;
      }

      /* --- clock --- */
      g.timeLeft -= dt;
      g.lapTime += dt;
      g.addScore(g.speed * dt * 0.004);
      if (g.timeLeft <= 0) {
        g.timeLeft = 0;
        g.sfx('die');
        g.over('TIME  UP');
        return;
      }
      g.setHud('time', g.timeLeft.toFixed(1));
      g.setHud('kph', String(Math.round(g.speed / 42)));
      /* position = rivals still ahead of us in the pack */
      var ahead = 1;
      for (var k = 0; k < g.rivals.length; k++) {
        var dz = g.rivals[k].z - g.pos;
        if (dz < -g.trackLen / 2) dz += g.trackLen;
        if (dz > 0 && dz < g.trackLen / 2) ahead++;
      }
      g.setHud('pos', ahead + '/' + (g.rivals.length + 1));
      g.position = ahead;
    },

    draw: function (g, ctx) {
      var w = g.w, h = g.h;
      var baseIdx = Math.floor(g.pos / SEG) % g.seg.length;
      var base = g.seg[baseIdx];
      var basePct = (g.pos % SEG) / SEG;
      var camY = CAM_H + base.p1.world.y + (base.p2.world.y - base.p1.world.y) * basePct;
      var horizonY = h * HORIZON;

      /* sky + sun */
      var t = g.time * 0.02;
      ctx.fillStyle = g.gradient(0, horizonY + 10, [
        [0, '#20064a'], [0.45, '#6b1170'], [0.75, '#c0316a'], [1, '#ff7a3a']
      ]);
      ctx.fillRect(0, 0, w, horizonY + 12);
      var sunX = w / 2 - g.playerX * 30 - (base.curve * 12);
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#ffd06a';
      ctx.beginPath(); ctx.arc(sunX, horizonY - 62, 62, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'destination-out';
      for (var b = 0; b < 7; b++) ctx.fillRect(sunX - 70, horizonY - 96 + b * 13 + Math.sin(t) * 2, 140, 4 + b);
      ctx.restore();
      /* skyline */
      ctx.save();
      ctx.fillStyle = '#2a0d4e';
      var sk = (g.pos * 0.00006 + g.playerX * 0.05) % 1;
      for (var m = -1; m < 8; m++) {
        var mx = ((m - sk) / 7) * (w + 220) - 60;
        var mh = 40 + ((m + 9) % 4) * 22;
        ctx.fillRect(mx, horizonY - mh, 78, mh);
        ctx.fillRect(mx + 20, horizonY - mh - 18, 20, 18);
      }
      ctx.restore();

      /* ground */
      ctx.fillStyle = '#123018';
      ctx.fillRect(0, horizonY, w, h - horizonY);

      /* --- road --- */
      var maxY = h, x = 0, dxc = -(base.curve * basePct), n, seg;
      for (n = 0; n < DRAW; n++) {
        seg = g.seg[(baseIdx + n) % g.seg.length];
        seg.looped = (baseIdx + n) >= g.seg.length;
        seg.clip = maxY;
        var camZ = g.pos - (seg.looped ? g.trackLen : 0);
        project(seg.p1, g.playerX * ROAD_W - x, camY, camZ, w, h);
        project(seg.p2, g.playerX * ROAD_W - x - dxc, camY, camZ, w, h);
        x += dxc; dxc += seg.curve;
        if (seg.p1.camera.z <= CAM_D || seg.p2.screen.y >= seg.p1.screen.y || seg.p2.screen.y >= maxY) continue;

        var p1 = seg.p1.screen, p2 = seg.p2.screen;
        var light = seg.light;
        var grass = light ? '#1b4a24' : '#173f20';
        var rumble = light ? '#ff2e88' : '#f4f6ff';
        var road = light ? '#3a3a46' : '#33333f';

        ctx.fillStyle = grass;
        ctx.fillRect(0, p2.y, w, p1.y - p2.y);
        quad(ctx, p1.x, p1.y, p1.w * 1.22, p2.x, p2.y, p2.w * 1.22, rumble);
        quad(ctx, p1.x, p1.y, p1.w, p2.x, p2.y, p2.w, road);
        if (light) {
          quad(ctx, p1.x, p1.y, p1.w * 0.02, p2.x, p2.y, p2.w * 0.02, '#e9e9f5');
          quad(ctx, p1.x - p1.w * 0.34, p1.y, p1.w * 0.015, p2.x - p2.w * 0.34, p2.y, p2.w * 0.015, '#c9c9de');
          quad(ctx, p1.x + p1.w * 0.34, p1.y, p1.w * 0.015, p2.x + p2.w * 0.34, p2.y, p2.w * 0.015, '#c9c9de');
        }
        /* start/finish line */
        var idx = (baseIdx + n) % g.seg.length;
        if (idx === 3 || idx === 2) quad(ctx, p1.x, p1.y, p1.w, p2.x, p2.y, p2.w, '#e8e8f0');
        maxY = p2.y;
      }

      /* --- sprites + rivals, far to near --- */
      for (n = DRAW - 1; n >= 0; n--) {
        seg = g.seg[(baseIdx + n) % g.seg.length];
        var sp = seg.sprite;
        if (sp && seg.p1.screen.scale > 0) {
          var scale = seg.p1.screen.scale;
          var destW = scale * sp.ww * w / 2;
          var s = destW / Arcade.artW(sp.art, 1);
          var sx = seg.p1.screen.x + scale * sp.off * ROAD_W * w / 2;
          var sy = seg.p1.screen.y;
          var sh = Arcade.artH(sp.art, s);
          /* skip sprites that are practically on top of the camera - a gantry
             one segment away would otherwise flood the whole screen */
          if (destW < w * 2.2 && (sy - sh < seg.clip + 2 || sp.arch)) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, w, Math.max(0, seg.clip));
            ctx.clip();
            g.pixels(sp.art, sx - destW / 2, sy - sh, s, sp.pal);
            ctx.restore();
          }
        }
        /* rivals in this segment */
        for (var i = 0; i < g.rivals.length; i++) {
          var r = g.rivals[i];
          if (Math.floor(r.z / SEG) % g.seg.length !== (baseIdx + n) % g.seg.length) continue;
          var pct = (r.z % SEG) / SEG;
          var rs = seg.p1.screen.scale + (seg.p2.screen.scale - seg.p1.screen.scale) * pct;
          if (rs <= 0) continue;
          var rw = rs * 1100 * w / 2;
          var rsz = rw / Arcade.artW(RIVAL, 1);
          var rx = (seg.p1.screen.x + (seg.p2.screen.x - seg.p1.screen.x) * pct) + rs * r.x * ROAD_W * w / 2;
          var ry = seg.p1.screen.y + (seg.p2.screen.y - seg.p1.screen.y) * pct;
          if (rw < 4) continue;
          ctx.save();
          ctx.beginPath(); ctx.rect(0, 0, w, Math.max(0, seg.clip + 6)); ctx.clip();
          g.pixels(RIVAL, rx - rw / 2, ry - Arcade.artH(RIVAL, rsz), rsz, r.pal);
          ctx.restore();
        }
      }

      /* --- speed streaks --- */
      if (g.boosting) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        for (var q = 0; q < 16; q++) {
          var ay = (g.time * 1400 + q * 97) % h;
          var ax = q % 2 ? Arcade.rand(0, w * 0.22) : Arcade.rand(w * 0.78, w);
          ctx.fillStyle = q % 3 ? C.cyan : '#fff';
          ctx.fillRect(ax, ay, 2, 40);
        }
        ctx.restore();
      }

      /* --- player car --- */
      var carW = w * 0.36;
      var cs = carW / Arcade.artW(CAR, 1);
      var bump = Math.sin(g.time * 22) * (g.speed / TOP) * 2;
      var cx = w / 2 + g.lean * 26 - carW / 2;
      var cy = h - Arcade.artH(CAR, cs) - 74 + bump;
      /* shadow */
      ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(w / 2 + g.lean * 26, cy + Arcade.artH(CAR, cs) - 2, carW * 0.5, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      g.pixels(CAR, cx, cy, cs, P_CAR, g.lean < -0.35);
      if (g.boosting) {
        for (var f = 0; f < 2; f++) {
          var fx = cx + carW * (f ? 0.66 : 0.28);
          g.circle(fx, cy + Arcade.artH(CAR, cs) - 4, 5 + Math.random() * 5, f ? C.cyan : C.yellow, 16);
        }
      }

      /* --- HUD on glass --- */
      ctx.save();
      ctx.fillStyle = 'rgba(6,3,16,0.55)';
      ctx.fillRect(0, 0, w, 62);
      g.text('LAP ' + g.lap + '/' + LAPS, 10, 18, { size: 11, color: C.yellow, align: 'left' });
      g.text('POS ' + (g.position || 1) + '/' + (g.rivals.length + 1), 10, 42, { size: 11, color: C.cyan, align: 'left' });
      var tcol = g.timeLeft < 8 ? (Math.floor(g.time * 6) % 2 ? C.red : C.yellow) : C.ink;
      g.text(g.timeLeft.toFixed(1), w - 10, 22, { size: 20, color: tcol, align: 'right', glow: tcol });
      g.text('TIME', w - 10, 46, { size: 8, color: C.dim, align: 'right', glow: false });
      ctx.restore();

      /* speedo + nitro */
      g.bar(10, h - 40, w - 20, 12, g.speed / TOP, g.boosting ? C.cyan : C.pink);
      g.text(Math.round(g.speed / 42) + ' KM/H', w / 2, h - 34, { size: 9, color: '#08040f', glow: false });
      g.bar(10, h - 22, w - 20, 10, g.nitro, C.green);
      g.text('NITRO', 46, h - 17, { size: 7, color: '#04120a', glow: false });
    }
  });
})();
