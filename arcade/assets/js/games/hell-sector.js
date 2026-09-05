/* HELL SECTOR — a texture-shaded raycaster FPS: three floors, four demons,
   three guns, keycards and a very red exit. */
(function () {
  var C = Arcade.C;

  var STATUS_H = 96;
  var VIEW_H = 640 - STATUS_H;      /* the 3D view runs right down to the status bar */
  var RAY_STEP = 2;                 /* pixels per ray column */
  var FOV = Math.PI / 3;

  /* ---------- maps ----------
     # brick wall   = tech wall   % flesh wall   + locked door
     E exit   P start   k keycard   h health   a ammo   s shotgun   c chaingun
     1 imp    2 demon   3 skull     4 baron                                   */
  var MAPS = [
    [
      '####################',
      '#P....#....a...#...#',
      '#.....#........#.h.#',
      '#..h..+...1....=...#',
      '#.....#........#..1#',
      '###.###..####..##.##',
      '#......s.#..#......#',
      '#..1.....#..#...2..#',
      '#........#..#......#',
      '#..#####.#..#.####.#',
      '#..#.....#..#....#.#',
      '#..#..1..%..%..k.#.#',
      '#..#.....#..#....#.#',
      '#..#######..######.#',
      '#.........+......E.#',
      '####################'
    ],
    [
      '####################',
      '#P...#...1....#....#',
      '#....#........#..a.#',
      '#.h..=...##...=....#',
      '#....#...##...#..2.#',
      '##.###...##...###.##',
      '#........c.........#',
      '#..2...#####...1...#',
      '#......#...#.......#',
      '####.###...###.#####',
      '#......#.k.#.....h.#',
      '#..3...#...#...3...#',
      '#......%...%.......#',
      '#..#####...#####...#',
      '#........+.......E.#',
      '####################'
    ],
    [
      '####################',
      '#P..#....2....#...a#',
      '#...#.........#....#',
      '#.h.=....%%...=..3.#',
      '#...#....%%...#....#',
      '##.##....%%....##.##',
      '#.......s..........#',
      '#..3..#######..2...#',
      '#.....#.....#......#',
      '###.###..k..###.####',
      '#...........#....h.#',
      '#..4..%.....%..1...#',
      '#.....#######......#',
      '#..####.....####...#',
      '#........+.......E.#',
      '####################'
    ]
  ];

  var WALLS = {
    '#': { base: [104, 92, 84], accent: [150, 136, 120], name: 'brick' },
    '=': { base: [56, 82, 120], accent: [96, 142, 186], name: 'tech' },
    '%': { base: [132, 40, 58], accent: [190, 70, 84], name: 'flesh' },
    '+': { base: [148, 118, 32], accent: [212, 176, 60], name: 'door' },
    'E': { base: [30, 150, 96], accent: [80, 220, 150], name: 'exit' }
  };

  /* ---------- enemy sprites ---------- */
  var IMP = [
    '..rr....rr..',
    '.rrrr..rrrr.',
    '..rrrrrrrr..',
    '.rryrrrryrr.',
    '.rrrrwwrrrr.',
    '..rrrrrrrr..',
    '.rrrrrrrrrr.',
    'r.rrrrrrrr.r',
    'r..rrrrrr..r',
    '...rr..rr...',
    '...rr..rr...',
    '..rrr..rrr..'
  ];
  var DEMON = [
    '.pp......pp.',
    'pppp....pppp',
    '.pppppppppp.',
    'ppyppppppypp',
    'pppwwwwwwppp',
    'ppwwwwwwwwpp',
    '.pppppppppp.',
    'pppppppppppp',
    'pp.pppppp.pp',
    'p..pp..pp..p',
    '...pp..pp...',
    '..ppp..ppp..'
  ];
  var SKULL = [
    '...wwwwww...',
    '..wwwwwwww..',
    '.wwwwwwwwww.',
    '.wwrrwwrrww.',
    '.wwrrwwrrww.',
    '.wwwwwwwwww.',
    '..wwwwwwww..',
    '..w.w.w.w.w.',
    'y..wwwwww..y',
    'yy........yy',
    '.y........y.',
    '............'
  ];
  var BARON = [
    '.gg......gg.',
    'gggg....gggg',
    '.gggggggggg.',
    'ggrggggggrgg',
    'gggwwwwwwggg',
    '.gggggggggg.',
    'gggggggggggg',
    'ggggggggggg g',
    'gg.gggggg.gg',
    'g..gg..gg..g',
    '...gg..gg...',
    '..ggg..ggg..'
  ];
  var FIRE = [
    '.oo.',
    'oyyo',
    'oyyo',
    '.oo.'
  ];
  var PICKUP = {
    /* health: a red cross on a white kit */
    h: ['.wwwwww.',
        'wwwwwwww',
        'ww.rr.ww',
        'wwrrrrww',
        'wwrrrrww',
        'ww.rr.ww',
        'wwwwwwww',
        '.wwwwww.'],
    /* ammo: a box of shells */
    a: ['ssssssss',
        'syyyyyys',
        'sy.oo.ys',
        'sy.oo.ys',
        'sy.oo.ys',
        'sy.oo.ys',
        'syyyyyys',
        'ssssssss'],
    /* keycard */
    k: ['.cccccc.',
        'cccccccc',
        'cc.ww.cc',
        'cccccccc',
        'cc.ww.cc',
        'cccccccc',
        '.cccccc.',
        '..c..c..'],
    /* shotgun on the floor */
    s: ['........',
        '..bbbbbb',
        '.bbbbbbb',
        'ssssssss',
        'ssssssss',
        '..bb....',
        '.bb.....',
        '........'],
    /* chaingun on the floor */
    c: ['........',
        'ssssssss',
        'ssssssss',
        'ssssssss',
        '.bbbb...',
        '.bbbb...',
        '..bb....',
        '........']
  };
  var PAL = {
    r: '#c1392b', p: '#d9668a', g: '#3fa35a', w: '#f2efe6', y: '#ffd400',
    o: '#ff7a1a', s: '#8fa3c8', b: '#7d5a3a', c: '#22e0ff'
  };

  var ENEMY_DEF = {
    1: { art: IMP,   hp: 30, spd: 1.5, dmg: 9,  range: 7,  fire: true,  score: 250, name: 'IMP' },
    2: { art: DEMON, hp: 55, spd: 2.6, dmg: 16, range: 1.1, fire: false, score: 400, name: 'DEMON' },
    3: { art: SKULL, hp: 18, spd: 3.2, dmg: 11, range: 1.0, fire: false, score: 300, name: 'SKULL' },
    4: { art: BARON, hp: 160, spd: 1.6, dmg: 24, range: 9, fire: true,  score: 1500, name: 'BARON' }
  };

  var GUNS = [
    { name: 'PISTOL',   dmg: 14, cd: 0.34, spread: 0.02, pellets: 1, ammo: 'bul', use: 1, sfx: 'pistol' },
    { name: 'SHOTGUN',  dmg: 12, cd: 0.78, spread: 0.14, pellets: 7, ammo: 'shl', use: 1, sfx: 'shotgun' },
    { name: 'CHAINGUN', dmg: 9,  cd: 0.09, spread: 0.06, pellets: 1, ammo: 'bul', use: 1, sfx: 'chain' }
  ];

  function shade(rgb, f) {
    return 'rgb(' + Math.round(rgb[0] * f) + ',' + Math.round(rgb[1] * f) + ',' + Math.round(rgb[2] * f) + ')';
  }

  Arcade.game({
    id: 'hell-sector',
    title: 'HELL SECTOR',
    tagline: 'THREE FLOORS. NO REINFORCEMENTS.',
    help: 'UP/DOWN MOVE, LEFT/RIGHT TURN. A FIRE, B STRAFE, C SWAP GUN. DRAG TO LOOK.',
    instructions: ['UP / DOWN   WALK', 'LEFT / RIGHT   TURN  (HOLD B TO STRAFE)', 'A  FIRE     C  SWAP WEAPON', 'FIND THE KEYCARD, OPEN THE DOOR, GET OUT'],
    width: 480, height: 640,
    dpad: 'full',
    buttons: [{ id: 'a', label: 'FIRE' }, { id: 'b', label: 'STRAFE' }, { id: 'c', label: 'GUN' }],
    showLives: true,
    hud: [{ id: 'hp', label: 'HP' }, { id: 'ammo', label: 'AMMO' }, { id: 'gun', label: 'GUN' }, { id: 'lvl', label: 'FLOOR' }],
    music: { bpm: 158,
      bass: [28, 28, 28, 31, 28, 28, 33, 31, 28, 28, 28, 34, 33, 31, 28, 26],
      lead: [null, null, 55, null, null, null, 58, null, null, null, 55, null, 53, null, 51, null],
      drums: 'x.xox.xox.xoxxox' },

    setup: function (g) {
      g.levelIdx = 0;
      g.setLives(3);
      loadLevel(g, 0, true);
    },

    update: function (g, dt) { step(g, dt); },
    draw: function (g, ctx) { render(g, ctx); }
  });

  /* ============================================================ */
  function loadLevel(g, idx, fresh) {
    var raw = MAPS[idx];
    g.levelIdx = idx;
    g.map = [];
    g.things = [];
    g.enemies = [];
    g.shots = [];
    g.blood = [];
    for (var y = 0; y < raw.length; y++) {
      var row = [];
      for (var x = 0; x < raw[y].length; x++) {
        var ch = raw[y][x];
        if (WALLS[ch]) { row.push(ch); continue; }
        row.push('.');
        var cx = x + 0.5, cy = y + 0.5;
        if (ch === 'P') { g.px = cx; g.py = cy; g.dir = 0; }
        else if (ENEMY_DEF[ch]) {
          var d = ENEMY_DEF[ch];
          g.enemies.push({ x: cx, y: cy, hp: d.hp, def: d, cd: Arcade.rand(0, 1.5), hurt: 0, dead: 0, kind: ch });
        } else if (PICKUP[ch]) {
          g.things.push({ x: cx, y: cy, kind: ch, bob: Arcade.rand(0, 6) });
        }
      }
      g.map.push(row);
    }
    g.mapW = g.map[0].length; g.mapH = g.map.length;
    if (fresh) {
      g.hp = 100; g.armor = 0; g.bul = 60; g.shl = 0; g.gun = 0; g.hasGun = [true, false, false];
    }
    g.hp = Math.max(g.hp, 40);
    g.keys = 0;
    g.cool = 0; g.flashT = 0; g.bob = 0; g.hurtT = 0; g.kills = 0;
    g.total = g.enemies.length;
    g.exitMsg = 0;
    syncHud(g);
    g.banner('FLOOR ' + (idx + 1) + ' / ' + MAPS.length, 1.6, C.red);
  }

  function syncHud(g) {
    g.setHud('hp', Math.max(0, Math.round(g.hp)));
    g.setHud('ammo', GUNS[g.gun].ammo === 'shl' ? g.shl : g.bul);
    g.setHud('gun', GUNS[g.gun].name);
    g.setHud('lvl', (g.levelIdx + 1) + '/' + MAPS.length);
  }

  function tileAt(g, x, y) {
    var ix = Math.floor(x), iy = Math.floor(y);
    if (ix < 0 || iy < 0 || ix >= g.mapW || iy >= g.mapH) return '#';
    return g.map[iy][ix];
  }
  function solid(g, x, y) {
    var t = tileAt(g, x, y);
    if (t === '.') return false;
    if (t === '+' && g.keys > 0) return false;
    if (t === 'E') return false;
    return true;
  }
  /* the player and the demons have a body, so they stop short of the wall */
  var R = 0.22;
  function blocked(g, x, y) {
    return solid(g, x + R, y) || solid(g, x - R, y) || solid(g, x, y + R) || solid(g, x, y - R);
  }

  function step(g, dt) {
    if (g.hp <= 0) return;
    var mv = -g.axisY(), turn = g.axisX();
    var strafe = 0;
    if (g.held('b')) { strafe = turn; turn = 0; }
    if (g.pointer.down && g.pointer.inside && g.pointer.y < VIEW_H) {
      turn += g.clamp(g.pointer.dx * 0.06, -1.4, 1.4);
      mv += 0.6;
    }
    g.dir += turn * 2.4 * dt;

    var spd = 3.1 * dt;
    var nx = g.px + Math.cos(g.dir) * mv * spd + Math.cos(g.dir + Math.PI / 2) * strafe * spd;
    var ny = g.py + Math.sin(g.dir) * mv * spd + Math.sin(g.dir + Math.PI / 2) * strafe * spd;
    if (!blocked(g, nx, g.py)) g.px = nx;
    if (!blocked(g, g.px, ny)) g.py = ny;
    if (mv || strafe) g.bob += dt * 9;

    /* exit tile */
    if (tileAt(g, g.px, g.py) === 'E') {
      g.addScore(2500 + g.kills * 100);
      if (g.levelIdx + 1 >= MAPS.length) { g.sfx('win'); g.win('HELL  CLEARED'); return; }
      g.sfx('medal');
      loadLevel(g, g.levelIdx + 1, false);
      return;
    }

    /* weapon swap */
    if (g.pressed('c')) {
      for (var i = 1; i <= 3; i++) {
        var n = (g.gun + i) % GUNS.length;
        if (g.hasGun[n]) { g.gun = n; g.sfx('reload'); break; }
      }
      syncHud(g);
    }

    /* fire */
    g.cool -= dt;
    if (g.flashT > 0) g.flashT -= dt;
    var wantFire = g.held('a') || (g.pointer.down && g.pointer.y > VIEW_H * 0.55 && g.pointer.inside);
    if (wantFire && g.cool <= 0) fire(g);

    /* pickups */
    for (var t = g.things.length - 1; t >= 0; t--) {
      var th = g.things[t];
      if (g.dist(th.x, th.y, g.px, g.py) < 0.55) {
        grab(g, th.kind);
        g.things.splice(t, 1);
      }
    }

    /* enemies */
    for (var e = 0; e < g.enemies.length; e++) {
      var en = g.enemies[e];
      if (en.dead > 0) { en.dead += dt; continue; }
      if (en.hurt > 0) en.hurt -= dt;
      var d = g.dist(en.x, en.y, g.px, g.py);
      var see = lineOfSight(g, en.x, en.y, g.px, g.py);
      if (see && d < 20) {
        var ang = Math.atan2(g.py - en.y, g.px - en.x);
        if (d > (en.def.fire ? 2.2 : 0.75)) {
          var sp = en.def.spd * dt * (0.7 + Math.sin(g.time * 3 + e) * 0.15);
          var ex = en.x + Math.cos(ang) * sp, ey = en.y + Math.sin(ang) * sp;
          if (!blocked(g, ex, en.y)) en.x = ex;
          if (!blocked(g, en.x, ey)) en.y = ey;
        }
        en.cd -= dt;
        if (en.cd <= 0 && d < en.def.range) {
          en.cd = en.def.fire ? Arcade.rand(1.4, 2.6) : Arcade.rand(0.8, 1.4);
          if (en.def.fire) {
            g.shots.push({ x: en.x, y: en.y, vx: Math.cos(ang) * 4.2, vy: Math.sin(ang) * 4.2, dmg: en.def.dmg });
            g.sfx('shoot');
          } else if (d < 1.3) {
            hurt(g, en.def.dmg);
          }
        }
      }
    }

    /* enemy fireballs */
    for (var s = g.shots.length - 1; s >= 0; s--) {
      var sh = g.shots[s];
      sh.x += sh.vx * dt; sh.y += sh.vy * dt;
      if (solid(g, sh.x, sh.y)) { g.shots.splice(s, 1); continue; }
      if (g.dist(sh.x, sh.y, g.px, g.py) < 0.4) { hurt(g, sh.dmg); g.shots.splice(s, 1); }
    }

    if (g.hurtT > 0) g.hurtT -= dt;
    syncHud(g);
  }

  function grab(g, kind) {
    if (kind === 'h') { g.hp = Math.min(150, g.hp + 25); g.sfx('power'); g.addScore(50); g.banner('+25 HEALTH', 0.8, C.green); }
    else if (kind === 'a') { g.bul += 30; g.shl += 8; g.sfx('coin'); g.addScore(50); g.banner('AMMO', 0.7, C.yellow); }
    else if (kind === 'k') { g.keys++; g.sfx('medal'); g.addScore(300); g.banner('KEYCARD  -  DOORS  OPEN', 1.4, C.cyan); }
    else if (kind === 's') { g.hasGun[1] = true; g.gun = 1; g.shl += 16; g.sfx('power'); g.addScore(200); g.banner('SHOTGUN!', 1.2, C.orange); }
    else if (kind === 'c') { g.hasGun[2] = true; g.gun = 2; g.bul += 80; g.sfx('power'); g.addScore(300); g.banner('CHAINGUN!', 1.2, C.orange); }
    syncHud(g);
  }

  function hurt(g, dmg) {
    if (g.armor > 0) { var abs = Math.min(g.armor, dmg * 0.4); g.armor -= abs; dmg -= abs; }
    g.hp -= dmg;
    g.hurtT = 0.35;
    g.shake(9); g.flash('#a01020', 0.14);
    g.sfx('hit');
    if (g.hp <= 0) {
      g.hp = 0;
      g.setLives(g.lives - 1);
      g.sfx('die');
      if (g.lives <= 0) { g.over('YOU  DIED'); return; }
      g.banner('RESPAWNING...', 1.4, C.red);
      g.hp = 60; g.bul = Math.max(g.bul, 30);
      loadLevel(g, g.levelIdx, false);
    }
  }

  function fire(g) {
    var gun = GUNS[g.gun];
    var pool = gun.ammo;
    if (g[pool] < gun.use) { g.sfx('beep'); g.cool = 0.35; return; }
    g[pool] -= gun.use;
    g.cool = gun.cd;
    g.flashT = 0.06;
    g.sfx(gun.sfx);
    g.shake(gun.pellets > 1 ? 8 : 4);
    for (var p = 0; p < gun.pellets; p++) {
      var ang = g.dir + (Math.random() - 0.5) * gun.spread * 2;
      hitscan(g, ang, gun.dmg);
    }
    syncHud(g);
  }

  function hitscan(g, ang, dmg) {
    var dx = Math.cos(ang), dy = Math.sin(ang);
    var x = g.px, y = g.py;
    for (var t = 0; t < 200; t++) {
      x += dx * 0.1; y += dy * 0.1;
      if (solid(g, x, y)) return;
      for (var i = 0; i < g.enemies.length; i++) {
        var en = g.enemies[i];
        if (en.dead > 0) continue;
        if (g.dist(x, y, en.x, en.y) < 0.42) {
          en.hp -= dmg;
          en.hurt = 0.15;
          g.sfx('punch');
          if (en.hp <= 0) {
            en.dead = 0.01;
            g.kills++;
            g.addScore(en.def.score);
            g.sfx('explode');
            if (g.kills === g.total) g.banner('FLOOR  CLEARED  -  FIND  THE  EXIT', 1.8, C.green);
          }
          return;
        }
      }
    }
  }

  function lineOfSight(g, x0, y0, x1, y1) {
    var d = Arcade.dist(x0, y0, x1, y1);
    var steps = Math.ceil(d * 8);
    for (var i = 1; i < steps; i++) {
      var t = i / steps;
      if (solid(g, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false;
    }
    return true;
  }

  /* ============================================================ */
  function render(g, ctx) {
    var w = g.w, h = g.h;
    var zbuf = [];

    /* ceiling + floor */
    ctx.fillStyle = ctx.createLinearGradient ? g.gradient(0, VIEW_H / 2, [[0, '#150a12'], [1, '#39202c']]) : '#241018';
    ctx.fillRect(0, 0, w, VIEW_H / 2);
    ctx.fillStyle = g.gradient(VIEW_H / 2, VIEW_H, [[0, '#2b1a18'], [1, '#5a3a2c']]);
    ctx.fillRect(0, VIEW_H / 2, w, VIEW_H / 2);

    /* ---- raycast walls ---- */
    var planeHalf = Math.tan(FOV / 2);
    for (var col = 0; col < w; col += RAY_STEP) {
      var camX = 2 * col / w - 1;
      var rayAng = g.dir + Math.atan(camX * planeHalf);
      var rdx = Math.cos(rayAng), rdy = Math.sin(rayAng);
      var mapX = Math.floor(g.px), mapY = Math.floor(g.py);
      var deltaX = Math.abs(1 / (rdx || 1e-6)), deltaY = Math.abs(1 / (rdy || 1e-6));
      var stepX, stepY, sideX, sideY;
      if (rdx < 0) { stepX = -1; sideX = (g.px - mapX) * deltaX; }
      else { stepX = 1; sideX = (mapX + 1 - g.px) * deltaX; }
      if (rdy < 0) { stepY = -1; sideY = (g.py - mapY) * deltaY; }
      else { stepY = 1; sideY = (mapY + 1 - g.py) * deltaY; }

      var hitTile = '#', side = 0, guard = 0;
      while (guard++ < 96) {
        if (sideX < sideY) { sideX += deltaX; mapX += stepX; side = 0; }
        else { sideY += deltaY; mapY += stepY; side = 1; }
        var t = (mapX < 0 || mapY < 0 || mapX >= g.mapW || mapY >= g.mapH) ? '#' : g.map[mapY][mapX];
        if (t !== '.') { hitTile = t; break; }
      }
      var perp = side === 0 ? (sideX - deltaX) : (sideY - deltaY);
      if (perp < 0.05) perp = 0.05;
      /* correct for the fisheye of the angular projection */
      perp *= Math.cos(rayAng - g.dir);
      zbuf.push({ x: col, d: perp });

      var lineH = Math.min(VIEW_H * 8, VIEW_H / perp);
      var top = VIEW_H / 2 - lineH / 2;
      var def = WALLS[hitTile] || WALLS['#'];
      var fog = Math.max(0.16, Math.min(1, 1.6 / (1 + perp * 0.55)));
      var lit = fog * (side === 1 ? 0.70 : 1);

      /* where along the wall face this ray landed - drives the brick pattern */
      var wallX = side === 0 ? g.py + perp * rdy : g.px + perp * rdx;
      wallX -= Math.floor(wallX);

      var tech = def.name === 'tech';
      var courses = tech ? 5 : 9;
      var brickW = tech ? 0.5 : 0.25;
      var courseH = lineH / courses;
      for (var b = 0; b < courses; b++) {
        var yTop = top + b * courseH;
        if (yTop + courseH < 0) continue;
        if (yTop > VIEW_H) break;
        var offset = (b % 2) * brickW * 0.5;
        var brick = Math.floor((wallX + offset) / brickW);
        var vary = ((brick * 37 + b * 23) % 7) / 7;
        ctx.fillStyle = shade(def.base, lit * (0.80 + vary * 0.34));
        ctx.fillRect(col, yTop, RAY_STEP, Math.ceil(courseH) + 1);
        /* horizontal mortar */
        ctx.fillStyle = shade(def.base, lit * 0.42);
        ctx.fillRect(col, yTop, RAY_STEP, Math.max(1, courseH * 0.10));
        /* vertical mortar */
        var fx = ((wallX + offset) % brickW) / brickW;
        if (fx < 0.055) ctx.fillRect(col, yTop, RAY_STEP, Math.ceil(courseH));
      }
      /* doors and the exit get a lit band so you can spot them across a room */
      if (hitTile === '+' || hitTile === 'E') {
        ctx.fillStyle = shade(def.accent, Math.min(1, lit * 1.4));
        ctx.fillRect(col, top + lineH * 0.40, RAY_STEP, Math.max(2, lineH * 0.08));
      }
      /* darken the very bottom of the wall where it meets the floor */
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#000';
      ctx.fillRect(col, top + lineH * 0.88, RAY_STEP, Math.max(1, lineH * 0.12));
      ctx.restore();
    }

    /* ---- sprites (enemies, fireballs, pickups) ---- */
    var sprites = [];
    var i;
    for (i = 0; i < g.enemies.length; i++) {
      var en = g.enemies[i];
      if (en.dead > 1.2) continue;
      sprites.push({ x: en.x, y: en.y, art: en.def.art, scale: en.dead > 0 ? 0.55 : 1,
                     tint: en.hurt > 0 ? '#ffffff' : null, drop: en.dead > 0 ? 0.5 : 0, kind: 'e' });
    }
    for (i = 0; i < g.shots.length; i++)
      sprites.push({ x: g.shots[i].x, y: g.shots[i].y, art: FIRE, scale: 0.4, kind: 'f' });
    for (i = 0; i < g.things.length; i++) {
      var th = g.things[i];
      sprites.push({ x: th.x, y: th.y, art: PICKUP[th.kind], scale: 0.34,
                     bob: Math.sin(g.time * 3 + th.bob) * 0.06, drop: 0.5, kind: 'p' });
    }
    for (i = 0; i < sprites.length; i++)
      sprites[i].d = Arcade.dist(sprites[i].x, sprites[i].y, g.px, g.py);
    sprites.sort(function (a, b) { return b.d - a.d; });

    for (i = 0; i < sprites.length; i++) {
      var sp = sprites[i];
      var relAng = Arcade.wrapAngle(Math.atan2(sp.y - g.py, sp.x - g.px) - g.dir);
      if (Math.abs(relAng) > FOV * 0.85 || sp.d < 0.25) continue;
      var screenX = w / 2 + Math.tan(relAng) / planeHalf * (w / 2);
      var full = VIEW_H / sp.d;              /* screen height of a full-height wall here */
      var size = full * sp.scale;
      var artW = sp.art[0].length, artH = sp.art.length;
      var px = size / artW, py = size / artH;
      var x0 = screenX - size / 2;
      /* feet on the floor line, minus any bob for hovering pickups */
      var floorY = VIEW_H / 2 + full / 2 - (sp.bob || 0) * full;
      var y0 = floorY - size;
      var fogA = Math.max(0.25, Math.min(1, 1.8 / (1 + sp.d * 0.4)));
      ctx.save();
      ctx.globalAlpha = fogA;
      for (var cx = 0; cx < artW; cx++) {
        var colX = x0 + cx * px;
        if (colX + px < 0 || colX > w) continue;
        /* depth test against the wall buffer */
        var zi = Math.min(zbuf.length - 1, Math.max(0, Math.round(colX / RAY_STEP)));
        if (zbuf[zi] && zbuf[zi].d < sp.d) continue;
        for (var cy = 0; cy < artH; cy++) {
          var ch = sp.art[cy][cx];
          if (ch === '.' || ch === ' ') continue;
          ctx.fillStyle = sp.tint || PAL[ch] || '#fff';
          ctx.fillRect(colX, y0 + cy * py, Math.ceil(px), Math.ceil(py));
        }
      }
      ctx.restore();
    }

    /* ---- weapon ---- */
    drawGun(g, ctx);

    /* ---- damage flash ---- */
    if (g.hurtT > 0) {
      ctx.save();
      ctx.globalAlpha = g.hurtT * 0.8;
      ctx.fillStyle = '#c8102e';
      ctx.fillRect(0, 0, w, VIEW_H);
      ctx.restore();
    }

    /* ---- automap + status bar ---- */
    drawMap(g, ctx);
    drawStatus(g, ctx);
  }

  function drawGun(g, ctx) {
    var w = g.w;
    var bob = Math.sin(g.bob) * 6;
    var recoil = g.flashT > 0 ? 10 : 0;
    var baseY = VIEW_H + 18 + bob + recoil;
    ctx.save();
    if (g.gun === 0) {
      ctx.fillStyle = '#3a3f52'; ctx.fillRect(w / 2 - 14, baseY - 92, 28, 60);
      ctx.fillStyle = '#22252f'; ctx.fillRect(w / 2 - 9, baseY - 116, 18, 30);
      ctx.fillStyle = '#585f78'; ctx.fillRect(w / 2 - 6, baseY - 118, 12, 8);
    } else if (g.gun === 1) {
      ctx.fillStyle = '#6b4a2a'; ctx.fillRect(w / 2 - 20, baseY - 82, 40, 54);
      ctx.fillStyle = '#3a3f52'; ctx.fillRect(w / 2 - 15, baseY - 132, 30, 56);
      ctx.fillStyle = '#22252f'; ctx.fillRect(w / 2 - 11, baseY - 136, 9, 12);
      ctx.fillRect(w / 2 + 2, baseY - 136, 9, 12);
    } else {
      ctx.fillStyle = '#3a3f52'; ctx.fillRect(w / 2 - 24, baseY - 96, 48, 62);
      for (var b = 0; b < 4; b++) {
        ctx.fillStyle = b % 2 ? '#585f78' : '#22252f';
        ctx.fillRect(w / 2 - 20 + b * 11, baseY - 140, 8, 48);
      }
    }
    if (g.flashT > 0) {
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#ffd400'; ctx.shadowColor = '#ff7a1a'; ctx.shadowBlur = 26;
      ctx.beginPath();
      ctx.arc(w / 2, baseY - (g.gun === 1 ? 142 : 126), 22 + Math.random() * 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    /* crosshair */
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 10, VIEW_H / 2); ctx.lineTo(w / 2 - 3, VIEW_H / 2);
    ctx.moveTo(w / 2 + 3, VIEW_H / 2); ctx.lineTo(w / 2 + 10, VIEW_H / 2);
    ctx.moveTo(w / 2, VIEW_H / 2 - 10); ctx.lineTo(w / 2, VIEW_H / 2 - 3);
    ctx.moveTo(w / 2, VIEW_H / 2 + 3); ctx.lineTo(w / 2, VIEW_H / 2 + 10);
    ctx.stroke();
    ctx.restore();
  }

  function drawStatus(g, ctx) {
    var w = g.w, h = g.h, top = h - STATUS_H;
    ctx.save();
    ctx.fillStyle = '#1a1220';
    ctx.fillRect(0, top, w, h - top);
    ctx.fillStyle = '#3a2a4a';
    ctx.fillRect(0, top, w, 3);

    var hpCol = g.hp > 60 ? C.green : g.hp > 25 ? C.yellow : C.red;
    g.text('HEALTH', 12, top + 18, { size: 8, color: C.dim, align: 'left', glow: false });
    g.text(Math.max(0, Math.round(g.hp)) + '%', 12, top + 40, { size: 20, color: hpCol, align: 'left', glow: hpCol });
    g.bar(12, top + 54, 120, 10, g.hp / 100, hpCol);

    var gun = GUNS[g.gun];
    g.text('AMMO', w - 12, top + 18, { size: 8, color: C.dim, align: 'right', glow: false });
    g.text(String(gun.ammo === 'shl' ? g.shl : g.bul), w - 12, top + 40, { size: 20, color: C.yellow, align: 'right', glow: C.yellow });
    g.text(gun.name, w - 12, top + 60, { size: 9, color: C.orange, align: 'right' });

    g.text('FLOOR ' + (g.levelIdx + 1) + '/' + MAPS.length, w / 2, top + 16, { size: 9, color: C.cyan });
    g.text('KILLS ' + g.kills + '/' + g.total, w / 2, top + 34, { size: 9, color: C.ink });
    g.text(g.keys > 0 ? 'KEYCARD  YES' : 'KEYCARD  NO', w / 2, top + 52, { size: 8, color: g.keys > 0 ? C.cyan : C.dim, glow: false });
    g.text('LIVES ' + Math.max(0, g.lives), w / 2, top + 70, { size: 8, color: C.pink, glow: false });

    ctx.restore();
  }

  function drawMap(g, ctx) {
    var mmS = 4, pad = 6;
    var mw = g.mapW * mmS, mh = g.mapH * mmS;
    var mx = g.w - mw - 10, my = 10;
    ctx.save();
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = '#07040f';
    ctx.fillRect(mx - pad, my - pad, mw + pad * 2, mh + pad * 2);
    ctx.strokeStyle = '#5a4a78'; ctx.lineWidth = 1;
    ctx.strokeRect(mx - pad + 0.5, my - pad + 0.5, mw + pad * 2 - 1, mh + pad * 2 - 1);
    for (var y = 0; y < g.mapH; y++) {
      for (var x = 0; x < g.mapW; x++) {
        var t = g.map[y][x];
        if (t === '.') continue;
        ctx.fillStyle = t === 'E' ? C.green : t === '+' ? C.yellow : '#6a5a94';
        ctx.fillRect(mx + x * mmS, my + y * mmS, mmS, mmS);
      }
    }
    /* the player, pointing where they look */
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.pink;
    var pxm = mx + g.px * mmS, pym = my + g.py * mmS;
    ctx.beginPath();
    ctx.moveTo(pxm + Math.cos(g.dir) * 6, pym + Math.sin(g.dir) * 6);
    ctx.lineTo(pxm + Math.cos(g.dir + 2.5) * 5, pym + Math.sin(g.dir + 2.5) * 5);
    ctx.lineTo(pxm + Math.cos(g.dir - 2.5) * 5, pym + Math.sin(g.dir - 2.5) * 5);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
})();
