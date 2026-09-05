/* AXE OF FURY — a side-scrolling brawler: three stages, orcs, skeletons,
   knock-downs, throwing axes and screen-clearing magic. */
(function () {
  var C = Arcade.C;

  var FLOOR_TOP = 430, FLOOR_BOT = 600;       /* the walkable depth band */
  var GRAV = 1500;

  /* ---------- sprites (12 wide) ---------- */
  var HERO_IDLE = [
    '....hhhh....',
    '...hffffh...',
    '...hfwwfh...',
    '....ffff....',
    '..bbbbbbbb..',
    '.bbbbbbbbbb.',
    'f.bbbbbbbb.f',
    'f.bbbbbbbb.f',
    '..bbbbbbbb..',
    '...ll..ll...',
    '...ll..ll...',
    '...ll..ll...',
    '..sss..sss..'
  ];
  var HERO_WALK = [
    '....hhhh....',
    '...hffffh...',
    '...hfwwfh...',
    '....ffff....',
    '..bbbbbbbb..',
    '.bbbbbbbbbb.',
    'f.bbbbbbbb..',
    '..bbbbbbbb.f',
    '..bbbbbbbb..',
    '..ll....ll..',
    '.ll......ll.',
    '.ll......ll.',
    'sss......sss'
  ];
  var HERO_ATK = [
    '....hhhh..a.',
    '...hffffhaa.',
    '...hfwwfaa..',
    '....ffffa...',
    '..bbbbbbbb..',
    '.bbbbbbbbbbf',
    'f.bbbbbbbb..',
    '..bbbbbbbb..',
    '..bbbbbbbb..',
    '...ll..ll...',
    '..ll....ll..',
    '..ll....ll..',
    '.sss....sss.'
  ];
  var HERO_JUMP = [
    '....hhhh....',
    '...hffffh...',
    '...hfwwfh...',
    '....ffff....',
    'f.bbbbbbbb.f',
    'f.bbbbbbbb.f',
    '..bbbbbbbb..',
    '..bbbbbbbb..',
    '...llllll...',
    '..ll....ll..',
    '.ll......ll.',
    'sss......sss',
    '............'
  ];
  var DOWN = [
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
    '..hhff......',
    '.hffbbbbbb..',
    '..ffbbbbbbll',
    '....bbbbllss',
    '............',
    '............',
    '............'
  ];
  var ORC = [
    '...gggggg...',
    '..gggggggg..',
    '..grggggrg..',
    '..gggwwggg..',
    '...gggggg...',
    '..vvvvvvvv..',
    'g.vvvvvvvv.g',
    'g.vvvvvvvv.g',
    '..vvvvvvvv..',
    '..gg....gg..',
    '..gg....gg..',
    '..gg....gg..',
    '.kkk....kkk.'
  ];
  var SKEL = [
    '...wwwwww...',
    '..wwwwwwww..',
    '..wrwwwwrw..',
    '..wwwwwwww..',
    '...w.ww.w...',
    '...wwwwww...',
    'w.wwwwwwww.w',
    'w..wwwwww..w',
    '...wwwwww...',
    '...ww..ww...',
    '...ww..ww...',
    '...ww..ww...',
    '..www..www..'
  ];
  var BOSS = [
    '..rr....rr..',
    '.rrrrrrrrrr.',
    'rryrrrrrryrr',
    'rrrrwwwwrrrr',
    '.rrrrrrrrrr.',
    '.mmmmmmmmmm.',
    'rmmmmmmmmmmr',
    'rmmmmmmmmmmr',
    '.mmmmmmmmmm.',
    '.rrr....rrr.',
    '.rrr....rrr.',
    '.rrr....rrr.',
    'kkkk....kkkk'
  ];
  var AXE = ['.ss.', 'sSSs', 'sSSs', '.ss.'];
  var MEAT = ['.rr.', 'rrrr', 'rrrr', '.bb.'];
  var POTION = ['.cc.', 'cwwc', 'cwwc', '.cc.'];

  var P_HERO = { h: '#8a5a2a', f: '#f0c08a', w: '#1a1020', b: C.pink, l: '#3a5ad8', s: '#6b4a2a', a: '#d8dcf0' };
  var P_ORC  = { g: '#4a9c4a', r: C.red, w: '#f2efe6', v: '#7d5a3a', k: '#3a2a1a' };
  var P_SKEL = { w: '#e8e2d0', r: C.red };
  var P_BOSS = { r: '#b0202a', y: C.yellow, w: '#f2efe6', m: '#3a2a4a', k: '#241a2a' };
  var P_AXE  = { s: '#8fa3c8', S: '#d8dcf0' };
  var P_MEAT = { r: '#c1392b', b: '#e8e2d0' };
  var P_POT  = { c: '#22e0ff', w: '#f2efe6' };

  var ENEMIES = {
    orc:   { art: ORC,  pal: P_ORC,  hp: 34, spd: 62,  dmg: 8,  score: 300, size: 3.9 },
    skel:  { art: SKEL, pal: P_SKEL, hp: 24, spd: 88,  dmg: 7,  score: 350, size: 3.7, throws: true },
    boss:  { art: BOSS, pal: P_BOSS, hp: 260, spd: 58, dmg: 16, score: 4000, size: 5.4, boss: true }
  };

  var STAGES = [
    { name: 'THE  BURNING  VILLAGE', len: 2400, sky: ['#3a0d2a', '#a02a2a', '#ff7a3a'], ground: '#4a2f22',
      waves: [ [['orc', 2]], [['orc', 2], ['skel', 1]], [['skel', 3]] ] },
    { name: 'THE  ICE  BRIDGE',      len: 2600, sky: ['#0d1f4a', '#2a5aa0', '#9fd8ff'], ground: '#2c4a5a',
      waves: [ [['skel', 3]], [['orc', 3]], [['orc', 2], ['skel', 2]] ] },
    { name: 'THE  DEATH  KEEP',      len: 2200, sky: ['#20062a', '#5a0d4a', '#c02a6a'], ground: '#33223a',
      waves: [ [['orc', 3], ['skel', 2]], [['skel', 4]], [['boss', 1], ['orc', 2]] ] }
  ];

  function depth(y) { return (y - FLOOR_TOP) / (FLOOR_BOT - FLOOR_TOP); }
  function scaleAt(y) { return 0.78 + depth(y) * 0.5; }

  Arcade.game({
    id: 'axe-of-fury',
    title: 'AXE OF FURY',
    tagline: 'THREE STAGES OF SKULL SPLITTING.',
    help: 'MOVE IN ALL FOUR DIRECTIONS. A ATTACK, B JUMP, C MAGIC.',
    instructions: ['ARROWS   MOVE  (UP/DOWN = DEPTH)', 'A  ATTACK   -  3 HITS KNOCK THEM DOWN', 'B  JUMP     -  B THEN A = JUMP KICK', 'C  MAGIC    -  CLEARS THE SCREEN'],
    width: 512, height: 672,
    dpad: 'full',
    buttons: [{ id: 'a', label: 'ATTACK' }, { id: 'b', label: 'JUMP' }, { id: 'c', label: 'MAGIC' }],
    showLives: true,
    hud: [{ id: 'stage', label: 'STAGE' }, { id: 'hp', label: 'HP' }, { id: 'magic', label: 'MAGIC' }, { id: 'combo', label: 'COMBO' }],
    music: { bpm: 128,
      bass: [33, 33, 40, 33, 36, 36, 43, 36, 31, 31, 38, 31, 34, 34, 41, 41],
      lead: [69, null, 72, 74, null, 76, null, 74, 72, null, 69, null, 67, null, 69, null],
      drums: 'x..ox..ox..ox.ox' },

    setup: function (g) {
      g.stageIdx = 0;
      g.setLives(3);
      g.magic = 3;
      g.maxHp = 120;
      g.hp = g.maxHp;
      startStage(g);
    },
    update: function (g, dt) { step(g, dt); },
    draw: function (g, ctx) { render(g, ctx); }
  });

  /* ============================================================ */
  function startStage(g) {
    var st = STAGES[g.stageIdx];
    g.stage = st;
    g.cam = 0;
    g.waveIdx = -1;
    g.foes = [];
    g.items = [];
    g.axes = [];
    g.hits = [];
    g.px = 90; g.py = (FLOOR_TOP + FLOOR_BOT) / 2; g.pz = 0; g.pvz = 0; g.pvx = 0;
    g.face = 1; g.walkT = 0;
    g.atk = 0; g.atkHit = false; g.combo = 0; g.comboT = 0;
    g.hurt = 0; g.inv = 0; g.down = 0;
    g.gateOpen = false;
    g.hp = Math.max(g.hp, 60);
    g.setHud('stage', (g.stageIdx + 1) + '/' + STAGES.length);
    g.banner('STAGE ' + (g.stageIdx + 1) + ' - ' + st.name, 2.2, C.yellow);
    nextWave(g);
    sync(g);
  }

  function sync(g) {
    g.setHud('hp', Math.max(0, Math.round(g.hp)));
    g.setHud('magic', g.magic);
    g.setHud('combo', 'x' + g.combo);
  }

  function nextWave(g) {
    g.waveIdx++;
    if (g.waveIdx >= g.stage.waves.length) { g.gateOpen = true; return; }
    var spec = g.stage.waves[g.waveIdx];
    for (var i = 0; i < spec.length; i++) {
      var kind = spec[i][0], count = spec[i][1];
      for (var n = 0; n < count; n++) spawn(g, kind, n);
    }
    g.gateOpen = false;
  }

  function spawn(g, kind, n) {
    var d = ENEMIES[kind];
    var side = Math.random() < 0.5 ? -1 : 1;
    g.foes.push({
      kind: kind, def: d,
      x: g.px + side * (g.w * 0.55 + n * 60 + Arcade.rand(0, 80)),
      y: Arcade.rand(FLOOR_TOP + 12, FLOOR_BOT - 12),
      z: 0, hp: d.hp, maxHp: d.hp,
      face: -side, state: 'walk', t: Arcade.rand(0, 1),
      atk: 0, hurt: 0, down: 0, vx: 0, vy: 0, throwCd: Arcade.rand(1.5, 4)
    });
  }

  function step(g, dt) {
    var st = g.stage;

    /* ---------- player ---------- */
    if (g.down > 0) {
      g.down -= dt;
      g.px += g.pvx * dt; g.pvx *= Math.pow(0.02, dt);
      if (g.down <= 0) { g.inv = 1.0; }
    } else {
      var ax = g.axisX(), ay = g.axisY();
      if (g.pointer.down && g.pointer.inside) {
        var tx = g.pointer.x - (g.px - g.cam), ty = g.pointer.y - g.py;
        if (Math.abs(tx) > 24) ax = tx > 0 ? 1 : -1;
        if (Math.abs(ty) > 24) ay = ty > 0 ? 1 : -1;
      }
      if (g.atk <= 0) {
        var sp = 168 * dt;
        if (ax) { g.px += ax * sp; g.face = ax; }
        if (ay && g.pz <= 0) g.py = g.clamp(g.py + ay * sp * 0.62, FLOOR_TOP, FLOOR_BOT);
        if (ax || ay) g.walkT += dt * 9;
      }
      /* jump */
      if (g.pz > 0 || g.pvz !== 0) {
        g.pz += g.pvz * dt;
        g.pvz -= GRAV * dt * 0.6;
        if (g.pz <= 0) { g.pz = 0; g.pvz = 0; }
      } else if (g.pressed('b')) {
        g.pvz = 430; g.sfx('jump');
      }
      /* attack */
      if (g.atk > 0) {
        g.atk -= dt;
        if (!g.atkHit && g.atk < 0.20) {
          g.atkHit = true;
          swing(g);
        }
      } else if (g.pressed('a')) {
        g.atk = 0.30; g.atkHit = false;
        g.sfx('slash');
      }
      /* magic */
      if (g.pressed('c') && g.magic > 0) {
        g.magic--;
        g.flash(C.cyan, 0.4); g.shake(22); g.sfx('explode');
        for (var m = 0; m < g.foes.length; m++) {
          var f = g.foes[m];
          if (f.hp <= 0) continue;
          damageFoe(g, f, f.def.boss ? 70 : 200, 0);
        }
        g.banner('MAGIC!', 1.0, C.cyan);
        sync(g);
      }
    }
    g.px = g.clamp(g.px, g.cam + 20, g.cam + g.w - 20);
    if (g.inv > 0) g.inv -= dt;
    if (g.comboT > 0) { g.comboT -= dt; if (g.comboT <= 0) { g.combo = 0; sync(g); } }

    /* ---------- camera ---------- */
    var alive = 0;
    for (var i = 0; i < g.foes.length; i++) if (g.foes[i].hp > 0) alive++;
    if (alive === 0 && !g.gateOpen) {
      if (g.waveIdx >= 0) {
        g.addScore(500);
        g.items.push({ x: g.px + 40, y: g.py, kind: Math.random() < 0.55 ? 'meat' : 'potion', t: 0 });
      }
      g.gateOpen = true;
      g.banner('GO  ->', 1.2, C.green);
    }
    if (g.gateOpen) {
      var want = g.clamp(g.px - g.w * 0.38, 0, st.len - g.w);
      g.cam = g.lerp(g.cam, want, Math.min(1, dt * 3));
      /* next wave trigger every third of the stage */
      var trig = (g.waveIdx + 1) * (st.len - g.w) / g.stage.waves.length;
      if (g.cam >= trig - 4 && g.waveIdx + 1 < g.stage.waves.length) {
        nextWave(g);
        g.sfx('whistle');
      } else if (g.waveIdx + 1 >= g.stage.waves.length && g.cam >= st.len - g.w - 6) {
        /* stage cleared */
        g.addScore(3000 + Math.floor(g.hp * 10));
        g.stageIdx++;
        if (g.stageIdx >= STAGES.length) { g.win('THE  KEEP  IS  YOURS'); return; }
        g.sfx('medal');
        startStage(g);
        return;
      }
    }

    /* ---------- enemies ---------- */
    for (i = g.foes.length - 1; i >= 0; i--) {
      var f = g.foes[i];
      if (f.hp <= 0) { f.t += dt; if (f.t > 1.1) g.foes.splice(i, 1); continue; }
      if (f.down > 0) {
        f.down -= dt;
        f.x += f.vx * dt; f.vx *= Math.pow(0.02, dt);
        continue;
      }
      if (f.hurt > 0) { f.hurt -= dt; f.x += f.vx * dt; f.vx *= Math.pow(0.01, dt); continue; }

      var dx = g.px - f.x, dy = g.py - f.y;
      f.face = dx > 0 ? 1 : -1;
      var near = Math.abs(dx) < 58 && Math.abs(dy) < 18;

      if (f.def.throws) {
        f.throwCd -= dt;
        if (f.throwCd <= 0 && Math.abs(dx) > 70 && Math.abs(dx) < 300 && Math.abs(dy) < 26) {
          f.throwCd = Arcade.rand(2.4, 4.4);
          g.axes.push({ x: f.x, y: f.y, vx: f.face * 260, spin: 0, dmg: 6 });
          g.sfx('slash');
        }
      }

      if (f.atk > 0) {
        f.atk -= dt;
        if (f.atk < 0.18 && !f.atkHit) {
          f.atkHit = true;
          if (near && g.pz < 30 && g.down <= 0) playerHurt(g, f.def.dmg, f.face);
        }
      } else if (near) {
        f.atk = 0.5; f.atkHit = false;
      } else {
        var sp2 = f.def.spd * dt;
        /* circle in rather than charging straight */
        f.x += Math.sign(dx) * sp2 * (Math.abs(dx) > 50 ? 1 : -0.4);
        f.y = g.clamp(f.y + Math.sign(dy) * sp2 * 0.5, FLOOR_TOP, FLOOR_BOT);
        f.t += dt;
      }
    }

    /* ---------- thrown axes ---------- */
    for (i = g.axes.length - 1; i >= 0; i--) {
      var a = g.axes[i];
      a.x += a.vx * dt; a.spin += dt * 14;
      if (a.x < g.cam - 40 || a.x > g.cam + g.w + 40) { g.axes.splice(i, 1); continue; }
      if (Math.abs(a.x - g.px) < 16 && Math.abs(a.y - g.py) < 16 && g.pz < 26 && g.down <= 0) {
        playerHurt(g, a.dmg, a.vx > 0 ? 1 : -1);
        g.axes.splice(i, 1);
      }
    }

    /* ---------- items ---------- */
    for (i = g.items.length - 1; i >= 0; i--) {
      var it = g.items[i];
      it.t += dt;
      if (Math.abs(it.x - g.px) < 22 && Math.abs(it.y - g.py) < 18) {
        if (it.kind === 'meat') { g.hp = Math.min(g.maxHp, g.hp + 35); g.banner('+35 HP', 0.8, C.green); }
        else { g.magic = Math.min(6, g.magic + 1); g.banner('MAGIC +1', 0.8, C.cyan); }
        g.sfx('coin'); g.addScore(150);
        g.items.splice(i, 1);
        sync(g);
      }
    }

    /* hit sparks */
    for (i = g.hits.length - 1; i >= 0; i--) {
      g.hits[i].t += dt;
      if (g.hits[i].t > 0.22) g.hits.splice(i, 1);
    }
  }

  function swing(g) {
    var reach = 66, hitAny = false;
    var jumpKick = g.pz > 20;
    for (var i = 0; i < g.foes.length; i++) {
      var f = g.foes[i];
      if (f.hp <= 0) continue;
      var dx = (f.x - g.px) * g.face;
      if (dx > -16 && dx < reach && Math.abs(f.y - g.py) < 22 && Math.abs(f.z - g.pz) < 60) {
        g.combo++; g.comboT = 1.3;
        var dmg = (jumpKick ? 18 : 12) + (g.combo % 3 === 0 ? 12 : 0);
        damageFoe(g, f, dmg, g.face, g.combo % 3 === 0);
        hitAny = true;
      }
    }
    if (hitAny) {
      g.sfx('punch');
      g.shake(5);
      sync(g);
    }
  }

  function damageFoe(g, f, dmg, dir, knockdown) {
    f.hp -= dmg;
    f.hurt = 0.18;
    f.vx = dir * (knockdown ? 260 : 90);
    g.hits.push({ x: f.x, y: f.y - 30, t: 0 });
    g.burst(f.x - g.cam, f.y - 30, [C.yellow, C.orange, '#fff'], 8, 130);
    if (knockdown) { f.down = 0.8; f.hurt = 0; }
    if (f.hp <= 0) {
      f.hp = 0; f.t = 0;
      g.addScore(f.def.score * Math.max(1, Math.floor(g.combo / 3) + 1));
      g.sfx('explode');
      g.burst(f.x - g.cam, f.y - 30, [C.red, C.orange, C.yellow], 20, 200);
      if (Math.random() < 0.22) g.items.push({ x: f.x, y: f.y, kind: Math.random() < 0.6 ? 'meat' : 'potion', t: 0 });
    }
  }

  function playerHurt(g, dmg, dir) {
    if (g.inv > 0 || g.down > 0) return;
    g.hp -= dmg;
    g.combo = 0; g.comboT = 0;
    g.inv = 0.7;
    g.pvx = dir * 150;
    g.hurt = 0.3;
    g.shake(12); g.flash('#a01020', 0.14);
    g.sfx('hit');
    sync(g);
    if (g.hp <= 0) {
      g.hp = 0;
      g.down = 1.4;
      g.setLives(g.lives - 1);
      g.sfx('die');
      if (g.lives <= 0) { g.over('YOUR  QUEST  ENDS'); return; }
      g.hp = g.maxHp * 0.8;
      g.magic = Math.max(g.magic, 1);
      g.banner('GET  UP!', 1.2, C.red);
    } else if (dmg >= 14) {
      g.down = 0.8;
    }
  }

  /* ============================================================ */
  function render(g, ctx) {
    var w = g.w, h = g.h, st = g.stage;

    /* sky */
    ctx.fillStyle = g.gradient(0, FLOOR_TOP, [[0, st.sky[0]], [0.55, st.sky[1]], [1, st.sky[2]]]);
    ctx.fillRect(0, 0, w, FLOOR_TOP);
    /* moon / sun */
    ctx.save();
    ctx.fillStyle = 'rgba(255,240,200,0.85)'; ctx.shadowColor = '#ffd9a0'; ctx.shadowBlur = 26;
    ctx.beginPath(); ctx.arc(w * 0.8 - g.cam * 0.02, 78, 34, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    /* far parallax ridges */
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    for (var m = -1; m < 8; m++) {
      var mx = m * 170 - (g.cam * 0.12) % 170;
      ctx.beginPath();
      ctx.moveTo(mx, FLOOR_TOP - 40);
      ctx.lineTo(mx + 85, FLOOR_TOP - 150 - (m % 3) * 34);
      ctx.lineTo(mx + 170, FLOOR_TOP - 40);
      ctx.closePath(); ctx.fill();
    }
    /* mid: towers / trees */
    for (var t2 = -1; t2 < 9; t2++) {
      var tx = t2 * 140 - (g.cam * 0.35) % 140;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      var th = 90 + (t2 % 3) * 40;
      ctx.fillRect(tx, FLOOR_TOP - th, 46, th);
      ctx.beginPath();
      ctx.moveTo(tx - 6, FLOOR_TOP - th);
      ctx.lineTo(tx + 23, FLOOR_TOP - th - 30);
      ctx.lineTo(tx + 52, FLOOR_TOP - th);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,180,60,0.5)';
      ctx.fillRect(tx + 16, FLOOR_TOP - th + 26, 12, 16);
    }

    /* ground */
    ctx.fillStyle = g.gradient(FLOOR_TOP - 30, h, [[0, st.ground], [1, '#100a16']]);
    ctx.fillRect(0, FLOOR_TOP - 30, w, h - FLOOR_TOP + 30);
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    for (var r = 0; r < 8; r++) {
      var ry = FLOOR_TOP - 20 + r * 24;
      ctx.beginPath(); ctx.moveTo(0, ry); ctx.lineTo(w, ry); ctx.stroke();
    }
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#000';
    for (var s = 0; s < 26; s++) {
      var sx = ((s * 97 - g.cam) % (w + 60)) - 30;
      ctx.fillRect(sx, FLOOR_TOP + (s * 53) % 160, 14, 4);
    }
    ctx.restore();

    /* --- draw order: everything sorted by floor y --- */
    var list = [];
    for (var i = 0; i < g.foes.length; i++) list.push({ y: g.foes[i].y, kind: 'foe', o: g.foes[i] });
    for (i = 0; i < g.items.length; i++) list.push({ y: g.items[i].y, kind: 'item', o: g.items[i] });
    for (i = 0; i < g.axes.length; i++) list.push({ y: g.axes[i].y, kind: 'axe', o: g.axes[i] });
    list.push({ y: g.py, kind: 'hero', o: null });
    list.sort(function (a, b) { return a.y - b.y; });

    for (i = 0; i < list.length; i++) {
      var e = list[i];
      if (e.kind === 'hero') drawHero(g, ctx);
      else if (e.kind === 'foe') drawFoe(g, ctx, e.o);
      else if (e.kind === 'item') {
        var it = e.o, isz = 4 * scaleAt(it.y);
        var art = it.kind === 'meat' ? MEAT : POTION;
        var pal = it.kind === 'meat' ? P_MEAT : P_POT;
        shadow(g, ctx, it.x - g.cam, it.y, 10);
        g.pixels(art, it.x - g.cam - Arcade.artW(art, isz) / 2,
                 it.y - Arcade.artH(art, isz) - Math.abs(Math.sin(it.t * 4)) * 6, isz, pal);
      } else {
        var a = e.o, asz = 4 * scaleAt(a.y);
        ctx.save();
        ctx.translate(a.x - g.cam, a.y - 26);
        ctx.rotate(a.spin);
        g.pixels(AXE, -Arcade.artW(AXE, asz) / 2, -Arcade.artH(AXE, asz) / 2, asz, P_AXE);
        ctx.restore();
      }
    }

    /* hit sparks */
    for (i = 0; i < g.hits.length; i++) {
      var hs = g.hits[i];
      var hr = 6 + hs.t * 70;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - hs.t / 0.22);
      ctx.strokeStyle = C.yellow; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(hs.x - g.cam, hs.y, hr, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    /* ---------- HUD ---------- */
    ctx.save();
    ctx.fillStyle = 'rgba(6,3,16,0.62)';
    ctx.fillRect(0, 0, w, 62);
    g.text('PLAYER', 12, 16, { size: 8, color: C.dim, align: 'left', glow: false });
    g.bar(12, 24, 180, 14, g.hp / g.maxHp, g.hp > g.maxHp * 0.35 ? C.green : C.red);
    g.text('LIVES ' + Math.max(0, g.lives), 12, 52, { size: 8, color: C.pink, align: 'left', glow: false });

    for (var mm = 0; mm < g.magic; mm++)
      g.pixels(POTION, 208 + mm * 16, 24, 3.5, P_POT);
    g.text('MAGIC', 208, 16, { size: 8, color: C.dim, align: 'left', glow: false });

    g.text(st.name, w - 12, 18, { size: 9, color: C.yellow, align: 'right' });
    g.text('STAGE ' + (g.stageIdx + 1) + '/' + STAGES.length, w - 12, 38, { size: 8, color: C.cyan, align: 'right', glow: false });
    if (g.combo > 1) g.text(g.combo + '  HIT  COMBO', w - 12, 56, { size: 9, color: C.orange, align: 'right' });

    /* boss bar */
    for (i = 0; i < g.foes.length; i++) {
      if (g.foes[i].def.boss && g.foes[i].hp > 0) {
        g.text('DEATH  ADDER', w / 2, 78, { size: 10, color: C.red, glow: C.red });
        g.bar(w / 2 - 140, 88, 280, 12, g.foes[i].hp / g.foes[i].maxHp, C.red);
        break;
      }
    }

    /* go arrow */
    if (g.gateOpen && g.cam < st.len - w - 8) {
      var ax2 = w - 60 + Math.sin(g.time * 6) * 8;
      g.text('GO', ax2, 120, { size: 14, color: C.green, glow: C.green });
      g.poly([[ax2 + 40, 120], [ax2 + 18, 112], [ax2 + 18, 128]], C.green, true);
    }
    /* progress */
    g.bar(w / 2 - 100, h - 16, 200, 8, g.cam / Math.max(1, st.len - w), C.purple);
    ctx.restore();
  }

  function shadow(g, ctx, sx, sy, r) {
    ctx.save();
    ctx.globalAlpha = 0.32; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(sx, sy, r, r * 0.34, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawHero(g, ctx) {
    var sc = 4.2 * scaleAt(g.py);
    var art = HERO_IDLE;
    if (g.down > 0) art = DOWN;
    else if (g.pz > 2) art = HERO_JUMP;
    else if (g.atk > 0) art = HERO_ATK;
    else if (Math.floor(g.walkT) % 2) art = HERO_WALK;
    var sx = g.px - g.cam, sy = g.py - g.pz;
    shadow(g, ctx, sx, g.py, 14 * scaleAt(g.py));
    ctx.save();
    if (g.inv > 0 && Math.floor(g.time * 20) % 2) ctx.globalAlpha = 0.4;
    g.pixels(art, sx - Arcade.artW(art, sc) / 2, sy - Arcade.artH(art, sc), sc, P_HERO, g.face < 0);
    ctx.restore();
    /* axe arc */
    if (g.atk > 0 && g.atk < 0.24) {
      ctx.save();
      ctx.strokeStyle = '#d8dcf0'; ctx.lineWidth = 4;
      ctx.shadowColor = '#fff'; ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(sx, sy - 26, 40, g.face > 0 ? -1.1 : Math.PI + 0.2, g.face > 0 ? 0.5 : Math.PI + 1.8);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawFoe(g, ctx, f) {
    var d = f.def;
    var sc = d.size * scaleAt(f.y) * (d.boss ? 1 : 1);
    var art = f.down > 0 || f.hp <= 0 ? DOWN : d.art;
    var sx = f.x - g.cam, sy = f.y - f.z;
    if (sx < -80 || sx > g.w + 80) return;
    shadow(g, ctx, sx, f.y, 13 * scaleAt(f.y) * (d.boss ? 1.5 : 1));
    ctx.save();
    if (f.hp <= 0) ctx.globalAlpha = Math.max(0, 1 - f.t / 1.1);
    if (f.hurt > 0.08) {
      /* flash white on impact */
      var pal2 = {}; for (var k in d.pal) pal2[k] = '#ffffff';
      g.pixels(art, sx - Arcade.artW(art, sc) / 2, sy - Arcade.artH(art, sc), sc, pal2, f.face > 0);
    } else {
      g.pixels(art, sx - Arcade.artW(art, sc) / 2, sy - Arcade.artH(art, sc), sc, d.pal, f.face > 0);
    }
    ctx.restore();
    /* wind-up tell */
    if (f.atk > 0.2) {
      g.text('!', sx, sy - Arcade.artH(art, sc) - 12, { size: 12, color: C.red, glow: C.red });
    }
    if (!d.boss && f.hp > 0 && f.hp < f.maxHp) {
      g.bar(sx - 16, sy - Arcade.artH(art, sc) - 8, 32, 4, f.hp / f.maxHp, C.red);
    }
  }
})();
