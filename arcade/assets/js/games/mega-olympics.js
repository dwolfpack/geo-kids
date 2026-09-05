/* MEGA OLYMPICS — a four-event meet: sprint, hurdles, long jump, javelin.
   Hammer A and B alternately to build speed, C to jump / throw. */
(function () {
  var C = Arcade.C;

  /* ---------- athlete frames (10 wide) ---------- */
  var RUN1 = [
    '...hhh....',
    '...hhh....',
    '....ss....',
    '..jjjjj...',
    '.j.jjj.j..',
    'j..jjj..j.',
    '...jjj....',
    '...s.s....',
    '..s...s...',
    '.s.....s..',
    '.b.....b..'
  ];
  var RUN2 = [
    '...hhh....',
    '...hhh....',
    '....ss....',
    '..jjjjj.j.',
    '.j.jjj.j..',
    '...jjj....',
    '...jjj....',
    '...ss.....',
    '..s..s....',
    '.s....ss..',
    '.b......b.'
  ];
  var JUMP = [
    '.....hhh..',
    '.....hhh..',
    '......ss..',
    'j..jjjjj..',
    '.jjjjjj...',
    '...jjj....',
    '..s.ss....',
    '.s....s...',
    's......s..',
    'b.......b.',
    '..........'
  ];
  var THROW = [
    '...hhh....',
    '...hhh....',
    '....ss....',
    '.jjjjjjj..',
    'j..jjj....',
    '...jjj....',
    '...jjj....',
    '...s.s....',
    '..s...s...',
    '.s.....s..',
    '.b.....b..'
  ];
  var PAL = { h: '#3a2418', s: '#f0c08a', j: C.pink, b: '#f4f6ff' };
  var PAL_R = { h: '#1c2a44', s: '#c98a5a', j: C.cyan, b: '#d8dcf0' };

  var EVENTS = [
    { id: 'sprint',  name: '100M  SPRINT',   unit: 's',  gold: 10.2, silver: 11.0, bronze: 12.0 },
    { id: 'hurdles', name: '110M  HURDLES',  unit: 's',  gold: 13.5, silver: 15.0, bronze: 17.0 },
    { id: 'long',    name: 'LONG  JUMP',     unit: 'm',  gold: 8.2,  silver: 7.2,  bronze: 6.0, higher: true },
    { id: 'javelin', name: 'JAVELIN  THROW', unit: 'm',  gold: 84,   silver: 72,   bronze: 58,  higher: true }
  ];

  function medalOf(ev, v) {
    if (ev.higher) return v >= ev.gold ? 'GOLD' : v >= ev.silver ? 'SILVER' : v >= ev.bronze ? 'BRONZE' : '';
    return v <= ev.gold ? 'GOLD' : v <= ev.silver ? 'SILVER' : v <= ev.bronze ? 'BRONZE' : '';
  }
  var MEDAL_COL = { GOLD: C.yellow, SILVER: '#d8dcf0', BRONZE: '#d2803a', '': C.dim };
  var MEDAL_PTS = { GOLD: 3000, SILVER: 1800, BRONZE: 900, '': 0 };

  Arcade.game({
    id: 'mega-olympics',
    title: 'MEGA OLYMPICS',
    tagline: 'FOUR EVENTS. ONE PODIUM.',
    help: 'HAMMER A / B TO RUN. C TO JUMP OR THROW.',
    instructions: ['ALTERNATE A AND B AS FAST AS YOU CAN', 'C  JUMP / RELEASE', 'THE ANGLE METER SWINGS - TIME IT', 'GOLD, SILVER OR BRONZE IN 4 EVENTS'],
    width: 480, height: 720,
    dpad: false,
    buttons: [{ id: 'a', label: 'RUN A' }, { id: 'b', label: 'RUN B' }, { id: 'c', label: 'ACT' }],
    hud: [{ id: 'ev', label: 'EVENT' }, { id: 'val', label: 'MARK' }, { id: 'med', label: 'MEDALS' }],
    music: { bpm: 138,
      bass: [40, 40, 47, 40, 45, 45, 52, 45, 43, 43, 50, 43, 38, 38, 45, 45],
      lead: [76, 79, 83, 79, 81, 84, 88, 84, 79, 83, 86, 83, 76, 79, 83, 88],
      drums: 'x..ox..ox..ox.oo' },

    setup: function (g) {
      g.evIdx = 0;
      g.medals = { GOLD: 0, SILVER: 0, BRONZE: 0 };
      g.results = [];
      startEvent(g);
    },

    update: function (g, dt) { tick(g, dt); },
    draw: function (g, ctx) { render(g, ctx); }
  });

  /* ============================================================ */
  function startEvent(g) {
    var ev = EVENTS[g.evIdx];
    g.ev = ev;
    g.phase = 'ready';
    g.phaseT = 0;
    g.power = 0;
    g.lastKey = '';
    g.dist = 0;
    g.runSpeed = 0;
    g.athX = 60;
    g.frame = 0;
    g.result = 0;
    g.medal = '';
    g.elapsed = 0;
    g.angle = 0;
    g.angleDir = 1;
    g.jumping = false;
    g.jy = 0; g.jvy = 0; g.jvx = 0;
    g.flight = null;
    g.foul = false;
    g.hurdleHit = 0;
    g.hurdles = [];
    if (ev.id === 'hurdles') for (var i = 0; i < 10; i++) g.hurdles.push({ x: 130 + i * 100, down: false });
    g.setHud('ev', (g.evIdx + 1) + '/4');
    g.setHud('val', '-');
    g.setHud('med', g.medals.GOLD + 'G ' + g.medals.SILVER + 'S ' + g.medals.BRONZE + 'B');
    g.banner(ev.name, 1.8, C.cyan);
  }

  function mash(g) {
    /* alternating A/B pays double; same key still counts a little */
    var gain = 0;
    if (g.pressed('a')) { gain = g.lastKey === 'a' ? 0.35 : 1; g.lastKey = 'a'; }
    else if (g.pressed('b')) { gain = g.lastKey === 'b' ? 0.35 : 1; g.lastKey = 'b'; }
    else if (g.pointer.justDown) { gain = g.lastKey === 'p' ? 0.4 : 0.9; g.lastKey = 'p'; }
    if (gain > 0) { g.sfx('blip'); }
    return gain;
  }

  function tick(g, dt) {
    g.phaseT += dt;
    var ev = g.ev;

    if (g.phase === 'ready') {
      if (g.phaseT > 1.9) { g.phase = 'go'; g.phaseT = 0; g.sfx('whistle'); g.banner('GO!', 0.8, C.green); }
      return;
    }

    if (g.phase === 'result') {
      if (g.phaseT > 2.6 || g.pressed('c') || g.pressed('a')) nextEvent(g);
      return;
    }

    /* running phases share the mash-power model */
    if (g.phase === 'go' || g.phase === 'runup') {
      g.power += mash(g) * 0.075;
      g.power = Math.max(0, g.power - dt * (0.30 + g.power * 0.28));
      g.runSpeed = g.power * 210;
      g.frame += g.runSpeed * dt * 0.16;
      g.elapsed += dt;
    }

    if (ev.id === 'sprint') {
      g.dist += g.runSpeed * dt * 0.1;
      if (g.dist >= 100) {
        g.result = Math.max(9.4, g.elapsed);
        finishEvent(g);
      } else if (g.elapsed > 22) { g.result = 22; finishEvent(g); }
      g.setHud('val', g.dist.toFixed(0) + 'm');
      return;
    }

    if (ev.id === 'hurdles') {
      g.dist += g.runSpeed * dt * 0.1;
      if (g.jumping) {
        g.jy += g.jvy * dt; g.jvy += 950 * dt;
        if (g.jy <= 0) { g.jy = 0; g.jumping = false; }
      } else if (g.pressed('c')) {
        g.jumping = true; g.jvy = -330; g.sfx('jump');
      }
      /* hurdles every 9m from 13m */
      for (var i = 0; i < g.hurdles.length; i++) {
        var hx = 13 + i * 9;
        if (!g.hurdles[i].down && g.dist > hx - 0.6 && g.dist < hx + 0.6) {
          if (g.jy > 22) { g.hurdles[i].down = true; g.addScore(120); g.sfx('gate'); }
          else {
            g.hurdles[i].down = true; g.hurdleHit++;
            g.power *= 0.42; g.sfx('crash'); g.shake(12); g.flash(C.red, 0.1);
          }
        }
      }
      if (g.dist >= 110) { g.result = Math.max(12.6, g.elapsed); finishEvent(g); }
      else if (g.elapsed > 30) { g.result = 30; finishEvent(g); }
      g.setHud('val', g.dist.toFixed(0) + 'm');
      return;
    }

    if (ev.id === 'long' || ev.id === 'javelin') {
      if (g.phase === 'go') g.phase = 'runup';
      if (g.phase === 'runup') {
        g.athX += g.runSpeed * dt * 0.55;
        /* angle meter swings while running */
        g.angle += g.angleDir * dt * 62;
        if (g.angle > 85) { g.angle = 85; g.angleDir = -1; }
        if (g.angle < 5) { g.angle = 5; g.angleDir = 1; }
        var board = g.w * 0.62;
        if (g.pressed('c')) {
          if (g.athX > board + 26) { g.foul = true; g.sfx('die'); g.result = 0; finishEvent(g); return; }
          launch(g);
        } else if (g.athX > board + 26) {
          g.foul = true; g.sfx('die'); g.result = 0; finishEvent(g); return;
        }
        g.setHud('val', Math.round(g.angle) + 'deg');
      } else if (g.phase === 'flight') {
        var f = g.flight;
        f.t += dt;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.vy += 640 * dt;
        f.spin += dt * 8;
        if (f.y >= 0) {
          f.y = 0;
          g.result = ev.id === 'long'
            ? Math.max(0, f.x / 26)
            : Math.max(0, f.x / 5.2);
          g.sfx(ev.id === 'long' ? 'crash' : 'hit');
          g.burst(g.w * 0.5, g.h * 0.72, ['#c9a86a', '#8f7443'], 16, 150);
          finishEvent(g);
        }
        g.setHud('val', (ev.id === 'long' ? f.x / 26 : f.x / 5.2).toFixed(2) + 'm');
      }
      return;
    }
  }

  function launch(g) {
    var rad = g.angle * Math.PI / 180;
    var v = 120 + g.power * 340;
    g.flight = { x: 0, y: 0, vx: Math.cos(rad) * v, vy: -Math.sin(rad) * v, t: 0, spin: 0 };
    g.phase = 'flight';
    g.sfx(g.ev.id === 'long' ? 'jump' : 'slash');
  }

  function finishEvent(g) {
    var ev = g.ev;
    g.medal = g.foul ? '' : medalOf(ev, g.result);
    if (g.medal) { g.medals[g.medal]++; g.sfx('medal'); }
    else g.sfx('over');
    g.addScore(MEDAL_PTS[g.medal] + Math.floor((ev.higher ? g.result * 40 : Math.max(0, 30 - g.result) * 120)));
    g.results.push({ name: ev.name, value: g.foul ? 'FOUL' : g.result.toFixed(2) + ev.unit, medal: g.medal });
    g.phase = 'result';
    g.phaseT = 0;
    g.setHud('med', g.medals.GOLD + 'G ' + g.medals.SILVER + 'S ' + g.medals.BRONZE + 'B');
  }

  function nextEvent(g) {
    g.evIdx++;
    if (g.evIdx >= EVENTS.length) {
      var total = g.medals.GOLD * 3 + g.medals.SILVER * 2 + g.medals.BRONZE;
      if (g.medals.GOLD >= 3) g.win('OLYMPIC  LEGEND');
      else if (total >= 4) g.win('ON  THE  PODIUM');
      else g.over('MEET  OVER');
      return;
    }
    startEvent(g);
  }

  /* ============================================================ */
  function stadium(g, ctx) {
    var w = g.w, h = g.h;
    ctx.fillStyle = g.gradient(0, h * 0.4, [[0, '#1a2e6b'], [1, '#57a0e0']]);
    ctx.fillRect(0, 0, w, h * 0.4);
    /* crowd */
    for (var y = 0; y < 5; y++) {
      for (var x = 0; x < 40; x++) {
        var seed = (x * 7 + y * 13 + Math.floor(g.time * 2 + x) % 3);
        ctx.fillStyle = ['#ff7a1a', '#22e0ff', '#ff2e88', '#ffd400', '#39ff88', '#f4f6ff'][seed % 6];
        ctx.globalAlpha = 0.75;
        ctx.fillRect(x * 12 + (y % 2) * 5, h * 0.16 + y * 13 + (Math.floor(g.time * 4 + x + y) % 2) * 2, 8, 8);
      }
    }
    ctx.globalAlpha = 1;
    /* stadium rim */
    ctx.fillStyle = '#12173a';
    ctx.fillRect(0, h * 0.30, w, 16);
    ctx.fillStyle = '#0d1130';
    ctx.fillRect(0, 0, w, h * 0.16);
    /* flood lights */
    for (var i = 0; i < 3; i++) {
      var lx = 60 + i * 180;
      ctx.fillStyle = '#3d4470'; ctx.fillRect(lx, 20, 6, h * 0.14);
      ctx.fillStyle = '#fff8c8'; ctx.shadowColor = '#fff8c8'; ctx.shadowBlur = 22;
      ctx.fillRect(lx - 16, 8, 40, 14);
      ctx.shadowBlur = 0;
    }
  }

  function trackFloor(g, ctx, scrollPx) {
    var w = g.w, h = g.h;
    var top = h * 0.46;
    ctx.fillStyle = '#2c7a3f'; ctx.fillRect(0, h * 0.346, w, top - h * 0.346);
    ctx.fillStyle = '#b34a2a'; ctx.fillRect(0, top, w, h - top);
    ctx.fillStyle = '#c25a35'; ctx.fillRect(0, top, w, 6);
    /* lane lines */
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (var l = 1; l < 5; l++) ctx.fillRect(0, top + l * ((h - top) / 5), w, 2);
    /* scrolling tick marks for the sense of speed */
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    for (var lane = 0; lane < 5; lane++) {
      var ly = top + lane * ((h - top) / 5) + ((h - top) / 10);
      for (var x = -((scrollPx || 0) % 72); x < w; x += 72) ctx.fillRect(x, ly, 26, 2);
    }
  }

  function render(g, ctx) {
    var w = g.w, h = g.h, ev = g.ev;
    g.clear('#0a0a1e');
    stadium(g, ctx);

    var scroll = (ev.id === 'sprint' || ev.id === 'hurdles') ? g.dist * 26 : g.athX;
    trackFloor(g, ctx, scroll);

    var groundY = h * 0.84;
    var art = RUN1, pal = PAL, sz = 6;

    if (ev.id === 'sprint' || ev.id === 'hurdles') {
      /* rival runners give the pack a sense of pace */
      for (var r = 0; r < 3; r++) {
        var rivalDist = g.elapsed * (9.4 + r * 0.55);
        var rx = 60 + (rivalDist - g.dist) * 26;
        if (rx > -40 && rx < w + 40) {
          /* each rival runs in the lane above, a little smaller for depth */
          var rsz = 5.2 - r * 0.5;
          var ry = groundY - 62 - r * 40;
          g.pixels(Math.floor(g.time * 12 + r) % 2 ? RUN1 : RUN2,
                   rx, ry - Arcade.artH(RUN1, rsz), rsz, PAL_R);
        }
      }
      /* hurdles */
      if (ev.id === 'hurdles') {
        for (var i = 0; i < g.hurdles.length; i++) {
          var hx = 60 + (13 + i * 9 - g.dist) * 26;
          if (hx < -30 || hx > w + 30) continue;
          var hd = g.hurdles[i].down;
          ctx.save();
          ctx.translate(hx, groundY);
          if (hd) ctx.rotate(-0.9);
          ctx.fillStyle = '#f4f6ff'; ctx.fillRect(-14, -34, 28, 5);
          ctx.fillStyle = '#ffd400'; ctx.fillRect(-14, -22, 28, 4);
          ctx.fillStyle = '#8fa3c8'; ctx.fillRect(-13, -30, 3, 30); ctx.fillRect(10, -30, 3, 30);
          ctx.restore();
        }
      }
      art = Math.floor(g.frame) % 2 ? RUN2 : RUN1;
      if (g.jumping) art = JUMP;
      g.pixels(art, 52, groundY - Arcade.artH(art, sz) - g.jy, sz, PAL);
      /* distance strip */
      g.bar(20, 96, w - 40, 14, g.dist / (ev.id === 'sprint' ? 100 : 110), C.green);
      g.text(Math.floor(g.dist) + ' / ' + (ev.id === 'sprint' ? 100 : 110) + ' M', w / 2, 103, { size: 8, color: '#04120a', glow: false });
      g.text(g.elapsed.toFixed(2) + 's', w / 2, 74, { size: 18, color: C.yellow, glow: C.yellow });
    }

    if (ev.id === 'long' || ev.id === 'javelin') {
      var board = w * 0.62;
      /* pit / field */
      if (ev.id === 'long') {
        ctx.fillStyle = '#e4d3a2'; ctx.fillRect(board + 20, groundY, w - board - 20, h - groundY);
        ctx.fillStyle = '#f4f6ff'; ctx.fillRect(board, groundY - 4, 18, 6);
      } else {
        ctx.fillStyle = '#2f8a45'; ctx.fillRect(board + 20, groundY, w - board - 20, h - groundY);
        ctx.fillStyle = '#f4f6ff'; ctx.fillRect(board, groundY - 4, 6, 6);
      }
      if (g.phase === 'runup' || g.phase === 'ready' || g.phase === 'go') {
        art = Math.floor(g.frame) % 2 ? RUN2 : RUN1;
        if (ev.id === 'javelin') {
          g.line(g.athX + 4, groundY - 44, g.athX + 62, groundY - 58, C.steel, 3);
        }
        g.pixels(art, g.athX, groundY - Arcade.artH(art, sz), sz, PAL);
      } else if (g.phase === 'flight' || g.phase === 'result') {
        var f = g.flight || { x: 0, y: 0, spin: 0 };
        var camX = Math.max(0, f.x - (w * 0.5));
        var fx = board + f.x - camX;
        var fy = groundY + f.y;
        if (ev.id === 'long') {
          g.pixels(JUMP, fx - 30, fy - Arcade.artH(JUMP, sz), sz, PAL);
        } else {
          g.pixels(THROW, board - camX - 20, groundY - Arcade.artH(THROW, sz), sz, PAL);
          ctx.save();
          ctx.translate(fx, fy - 40);
          ctx.rotate(Math.atan2(f.vy || 0, f.vx || 1));
          ctx.fillStyle = C.steel; ctx.shadowColor = C.cyan; ctx.shadowBlur = 8;
          ctx.fillRect(-34, -2, 68, 4);
          ctx.fillStyle = C.yellow; ctx.fillRect(28, -3, 10, 6);
          ctx.restore();
        }
        /* distance markers */
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        for (var m = 1; m <= 12; m++) {
          var mx = board + m * (ev.id === 'long' ? 26 : 52) - camX;
          if (mx > 0 && mx < w) {
            ctx.fillRect(mx, groundY, 2, 10);
            g.text(String(m * (ev.id === 'long' ? 1 : 10)), mx, groundY + 22, { size: 7, color: '#f4f6ff', glow: false });
          }
        }
      }
      /* angle meter */
      if (g.phase === 'runup') {
        var mx0 = w - 84, my0 = 150;
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(mx0, my0, 42, -Math.PI / 2, 0); ctx.stroke();
        var rad = g.angle * Math.PI / 180;
        g.line(mx0, my0, mx0 + Math.cos(rad) * 42, my0 - Math.sin(rad) * 42, C.yellow, 4, true);
        g.text(Math.round(g.angle) + '°', mx0 - 4, my0 + 22, { size: 10, color: C.yellow });
        ctx.restore();
        g.text('C = ' + (ev.id === 'long' ? 'JUMP' : 'THROW'), w / 2, 74, { size: 10, color: C.cyan });
      }
    }

    /* power meter */
    g.bar(20, h - 34, w - 40, 16, Math.min(1, g.power), g.power > 0.85 ? C.yellow : C.pink);
    g.text('POWER', w / 2, h - 26, { size: 8, color: '#08040f', glow: false });

    /* event title strip */
    ctx.fillStyle = 'rgba(6,3,16,0.6)';
    ctx.fillRect(0, 26, w, 26);
    g.text(ev.name + '   (' + (g.evIdx + 1) + '/4)', w / 2, 39, { size: 10, color: C.cyan });

    if (g.phase === 'ready') {
      var n = 3 - Math.floor(g.phaseT / 0.6);
      g.text(n > 0 ? String(n) : 'SET', w / 2, h * 0.42, { size: 40, color: C.yellow, glow: C.yellow });
      g.text('HAMMER  A  AND  B', w / 2, h * 0.42 + 52, { size: 10, color: C.ink });
    }
    if (g.phase === 'result') {
      ctx.fillStyle = 'rgba(6,3,16,0.72)';
      ctx.fillRect(0, h * 0.32, w, 190);
      var last = g.results[g.results.length - 1];
      g.text(last.value, w / 2, h * 0.38, { size: 26, color: C.ink, glow: C.cyan });
      g.text(g.medal ? g.medal + '  MEDAL' : 'NO  MEDAL', w / 2, h * 0.44,
        { size: 16, color: MEDAL_COL[g.medal], glow: MEDAL_COL[g.medal] });
      g.text('GOLD ' + g.medals.GOLD + '   SILVER ' + g.medals.SILVER + '   BRONZE ' + g.medals.BRONZE,
        w / 2, h * 0.50, { size: 9, color: C.steel, glow: false });
      g.text('C  =  NEXT  EVENT', w / 2, h * 0.55, { size: 9, color: C.yellow });
    }
  }
})();
