/* SURF RIDER — stay ahead of the break, hit the lip, get barrelled */
(function () {
  var C = Arcade.C;

  var SURF = [
    '...hhh..',
    '...hhh..',
    '..jjjj..',
    '.jjjjjj.',
    '.jjjjjj.',
    '..jjjj..',
    '..s..s..',
    '..s..s..',
    'bbbbbbbb'
  ];
  var CROUCH = [
    '........',
    '..hhh...',
    '..hhh...',
    '.jjjjjj.',
    'jjjjjjjj',
    '.jjjjjj.',
    '..s..s..',
    'bbbbbbbb',
    '........'
  ];
  var P_SURF = { h: '#f0c08a', j: C.pink, s: '#f0c08a', b: C.yellow };

  var LEAD_MIN = 0, LEAD_MAX = 420;

  Arcade.game({
    id: 'surf-rider',
    title: 'SURF RIDER',
    tagline: 'STAY IN THE POCKET.',
    help: 'UP / DOWN THE FACE. A PUMP FOR SPEED. B LAUNCH OFF THE LIP.',
    instructions: ['UP / DOWN   CLIMB OR DROP THE FACE', 'A   PUMP FOR SPEED', 'B   AIR OFF THE LIP', 'STAY AHEAD OF THE WHITEWATER'],
    width: 480, height: 720,
    dpad: 'vertical',
    buttons: [{ id: 'a', label: 'PUMP' }, { id: 'b', label: 'AIR' }],
    showLives: true,
    hud: [{ id: 'spd', label: 'SPEED' }, { id: 'tube', label: 'TUBE' }, { id: 'combo', label: 'COMBO' }],
    music: { bpm: 126,
      bass: [38, 38, 45, 38, 41, 41, 48, 41, 43, 43, 50, 43, 36, 36, 43, 43],
      lead: [74, 78, 81, 78, 76, 81, 85, 81, 78, 83, 86, 83, 74, 78, 81, 85],
      drums: 'x...o...x...o..o' },

    setup: function (g) {
      g.lead = 220;          /* distance ahead of the breaking lip */
      g.face = 0.55;         /* 0 = trough, 1 = lip */
      g.vFace = 0;
      g.speed = 190;
      g.breakSpeed = 175;
      g.ride = 0;
      g.air = 0; g.airSpin = 0; g.airPeak = 0;
      g.tubeT = 0; g.tubeTotal = 0; g.inTube = false;
      g.combo = 0; g.comboT = 0;
      g.snapArmed = false;
      g.wipe = 0;
      g.setLives(3);
      g.foam = [];
      g.spray = [];
      g.setHud('spd', '0');
      g.setHud('tube', '0.0s');
      g.setHud('combo', 'x0');
      g.banner('PADDLE  IN!', 1.4, C.cyan);
    },

    update: function (g, dt) {
      /* ---- wipeout recovery ---- */
      if (g.wipe > 0) {
        g.wipe -= dt;
        if (g.wipe <= 0) {
          if (g.lives <= 0) { g.over('WIPED  OUT'); return; }
          g.lead = 260; g.face = 0.5; g.vFace = 0; g.speed = 190; g.air = 0;
          g.inTube = false; g.tubeT = 0; g.combo = 0;
          g.banner('BACK  ON  IT', 1.0, C.cyan);
        }
        return;
      }

      g.ride += dt;
      g.breakSpeed = 175 + g.ride * 3.4;      /* the wave gets meaner */

      /* ---- vertical position on the face ---- */
      var steer = -g.axisY();                  /* up = climb */
      if (g.pointer.down && g.pointer.inside) steer = g.clamp((g.h * 0.62 - g.pointer.y) / 120, -1, 1);

      if (g.air > 0) {
        g.air -= dt;
        g.airSpin += (g.held('b') ? 460 : 200) * dt;
        g.face += g.vFace * dt;
        g.vFace += 1.6 * dt;                   /* gravity brings you back down */
        if (g.face <= 0.86 && g.vFace > 0) {
          /* landing */
          var spins = Math.floor(g.airSpin / 360);
          var landPts = 300 + spins * 700 + Math.floor(g.airPeak * 400);
          g.addScore(landPts * Math.max(1, g.combo));
          g.combo++; g.comboT = 3;
          g.banner((spins > 0 ? spins + '  SPIN  AIR!' : 'AIR!') + '  +' + landPts, 1.1, C.green);
          g.sfx('power');
          g.air = 0; g.airSpin = 0; g.vFace = -0.2;
          for (var s = 0; s < 16; s++) g.burst(g.w * 0.42, g.h * 0.55, ['#ffffff', '#bfeaff'], 2, 180, 220);
        }
      } else {
        g.vFace += steer * 1.35 * dt;
        g.vFace *= Math.pow(0.05, dt);
        g.face += g.vFace * dt;

        /* pumping: gains speed low on the face, bleeds it high */
        if (g.held('a')) {
          var eff = 1 - Math.abs(g.face - 0.35) * 1.4;
          g.speed += 150 * Math.max(-0.3, eff) * dt;
          if (Math.random() < 0.35) g.spray.push({ x: g.w * 0.42, y: g.h * 0.56, vx: -Arcade.rand(40, 160), vy: -Arcade.rand(10, 90), t: 0 });
        }
        /* gravity: dropping down the face is free speed */
        g.speed += -g.vFace * 210 * dt;
        g.speed -= (18 + g.face * 26) * dt;
        g.speed = g.clamp(g.speed, 60, 430);

        /* snap off the lip */
        if (g.face > 0.9 && !g.snapArmed) { g.snapArmed = true; }
        if (g.snapArmed && g.face < 0.62) {
          g.snapArmed = false;
          g.combo++; g.comboT = 3;
          var snap = 260 * Math.max(1, g.combo);
          g.addScore(snap);
          g.sfx('carve');
          g.burst(g.w * 0.42, g.h * 0.5, ['#ffffff', '#bfeaff'], 12, 200, 160);
        }
        /* launch */
        if (g.pressed('b') && g.face > 0.82) {
          g.air = 1.0; g.airSpin = 0; g.vFace = -0.9;
          g.airPeak = g.speed / 430;
          g.sfx('jump');
        }
        if (g.face > 1.12) {          /* flew over the back of the wave */
          wipe(g, 'OVER  THE  FALLS');
          return;
        }
        if (g.face < 0.02) {
          g.face = 0.02; g.vFace = Math.abs(g.vFace) * 0.4;
        }
      }
      g.face = g.clamp(g.face, 0, 1.3);

      /* ---- horizontal: racing the break ---- */
      g.lead += (g.speed - g.breakSpeed) * dt;
      if (g.lead < LEAD_MIN) { wipe(g, 'EATEN  BY  THE  FOAM'); return; }
      if (g.lead > LEAD_MAX) {
        /* out on the shoulder: the wave falls behind, lose speed */
        g.lead = LEAD_MAX;
        g.speed -= 90 * dt;
        if (Math.floor(g.time * 2) % 2 === 0) g.setHud('spd', 'SLOW');
      }

      /* ---- barrel ---- */
      var barrel = Math.sin(g.ride * 0.55) > 0.35;
      var pocket = g.lead < 150 && g.face > 0.42 && g.face < 0.86;
      g.inTube = barrel && pocket && g.air <= 0;
      if (g.inTube) {
        g.tubeT += dt; g.tubeTotal += dt;
        g.addScore(420 * dt * (1 + g.combo * 0.3));
        if (Math.floor(g.tubeT * 2) !== Math.floor((g.tubeT - dt) * 2)) g.sfx('blip');
        if (g.tubeT > 1 && Math.floor(g.tubeT) !== Math.floor(g.tubeT - dt))
          g.banner('IN  THE  BARREL  ' + g.tubeT.toFixed(0) + 's', 0.8, C.cyan);
      } else if (g.tubeT > 0) {
        if (g.tubeT > 0.8) { g.combo++; g.comboT = 3; g.sfx('medal'); }
        g.tubeT = 0;
      }

      /* pocket riding pays */
      if (pocket && !g.inTube) g.addScore(70 * dt);
      g.addScore(g.speed * dt * 0.05);

      if (g.comboT > 0) { g.comboT -= dt; if (g.comboT <= 0) g.combo = 0; }

      /* spray particles */
      for (var i = g.spray.length - 1; i >= 0; i--) {
        var p = g.spray[i];
        p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt;
        if (p.t > 0.7) g.spray.splice(i, 1);
      }

      g.setHud('spd', String(Math.round(g.speed / 4)));
      g.setHud('tube', g.tubeTotal.toFixed(1) + 's');
      g.setHud('combo', 'x' + g.combo);

      /* the ride can only end in a wipeout — but a long ride wins the heat */
      if (g.ride > 100) { g.addScore(6000); g.win('HEAT  WON'); }
    },

    draw: function (g, ctx) {
      var w = g.w, h = g.h;
      var horizon = h * 0.26;

      /* sky */
      ctx.fillStyle = g.gradient(0, horizon + 20, [[0, '#241056'], [0.45, '#b13a76'], [0.8, '#ff7a3a'], [1, '#ffc46a']]);
      ctx.fillRect(0, 0, w, horizon + 20);
      ctx.save();
      ctx.fillStyle = '#ffe08a'; ctx.shadowColor = '#ffb04a'; ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.arc(w * 0.72, horizon - 34, 44, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      /* headland + pier */
      ctx.fillStyle = '#2a1740';
      ctx.beginPath();
      ctx.moveTo(0, horizon); ctx.lineTo(70, horizon - 46); ctx.lineTo(150, horizon - 18); ctx.lineTo(190, horizon);
      ctx.closePath(); ctx.fill();
      for (var pl = 0; pl < 5; pl++) {
        var px = 18 + pl * 26;
        ctx.fillStyle = '#3b2358'; ctx.fillRect(px, horizon - 60 - (pl % 2) * 8, 3, 22);
        ctx.fillStyle = '#1d6b3a';
        ctx.beginPath(); ctx.arc(px + 1, horizon - 62 - (pl % 2) * 8, 8, 0, Math.PI * 2); ctx.fill();
      }

      /* open ocean */
      ctx.fillStyle = g.gradient(horizon, h, [[0, '#0b3f70'], [0.5, '#0a5c96'], [1, '#063352']]);
      ctx.fillRect(0, horizon, w, h - horizon);
      ctx.save();
      ctx.globalAlpha = 0.25; ctx.fillStyle = '#8fd8ff';
      for (var l = 0; l < 7; l++) {
        var ly = horizon + 12 + l * 9;
        ctx.fillRect(((g.time * (20 + l * 8)) % (w + 120)) - 120, ly, 90, 2);
      }
      ctx.restore();

      /* ---- the wave ----
         One continuous crest curve: a peak at the breaking lip that tapers
         off along the unbroken shoulder to the right and collapses into
         whitewater to the left. */
      var faceBase = h * 0.94, WAVE_H = h * 0.48;
      var lipX = w * 0.42 - g.lead * 0.55;
      var barrel = Math.sin(g.ride * 0.55) > 0.35;

      function hgtAt(x) {
        var dx = x - lipX;
        if (dx >= 0) return WAVE_H * Math.exp(-Math.pow(dx / 320, 2));
        return WAVE_H * (0.20 + 0.80 * Math.exp(-Math.pow(dx / 200, 2)));
      }
      function crestAt(x) {
        return faceBase - hgtAt(x) + Math.sin(x * 0.03 + g.time * 2.5) * 3;
      }

      /* body of the wave */
      ctx.save();
      ctx.fillStyle = g.gradient(faceBase - WAVE_H, faceBase, [[0, '#2bb6e4'], [0.4, '#0e6ea8'], [1, '#052a45']]);
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (var x = 0; x <= w; x += 6) ctx.lineTo(x, crestAt(x));
      ctx.lineTo(w, h);
      ctx.closePath(); ctx.fill();

      /* face shading: a lighter band just under the lip */
      ctx.globalAlpha = 0.22; ctx.fillStyle = '#9fe4ff';
      ctx.beginPath();
      ctx.moveTo(0, crestAt(0) + 70);
      for (var x2 = 0; x2 <= w; x2 += 6) ctx.lineTo(x2, crestAt(x2));
      for (var x3 = w; x3 >= 0; x3 -= 6) ctx.lineTo(x3, crestAt(x3) + 46);
      ctx.closePath(); ctx.fill();
      ctx.restore();

      /* crest line */
      ctx.save();
      ctx.strokeStyle = '#dff4ff'; ctx.lineWidth = 4;
      ctx.shadowColor = '#bfeaff'; ctx.shadowBlur = 10;
      ctx.beginPath();
      for (var x4 = 0; x4 <= w; x4 += 6) {
        if (x4 === 0) ctx.moveTo(x4, crestAt(x4)); else ctx.lineTo(x4, crestAt(x4));
      }
      ctx.stroke();
      ctx.restore();

      /* whitewater: everything left of the lip is already broken */
      ctx.save();
      ctx.fillStyle = g.gradient(crestAt(Math.max(0, lipX)) - 20, h, [[0, '#ffffff'], [0.45, '#dceefb'], [1, '#7fb2d0']]);
      ctx.beginPath();
      ctx.moveTo(-10, h);
      for (var x5 = -10; x5 <= lipX + 8; x5 += 8) ctx.lineTo(x5, crestAt(x5) - 2);
      ctx.lineTo(lipX + 8, h);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 0.55; ctx.fillStyle = '#8fc4e0';
      for (var fb = 0; fb < 40; fb++) {
        var fx = ((fb * 41 + g.time * 90) % (lipX + 60)) - 30;
        if (fx > lipX) continue;
        var fy = crestAt(fx) + 12 + ((fb * 37) % 90);
        ctx.beginPath();
        ctx.arc(fx, fy + Math.sin(fb + g.time * 6) * 5, 5 + (fb % 4) * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      /* the rider stays on the surface line: a low g.face slides him down the
         face toward the shoulder, a high one puts him up on the lip */
      var slide = (1 - g.clamp(g.face, 0, 1)) * 120;
      var riderX = w * 0.42 + slide;
      var airLift = g.air > 0 ? Math.sin((1 - g.air) * Math.PI) * 80 : 0;
      var slope = Math.atan2(crestAt(riderX + 10) - crestAt(riderX - 10), 20);
      var riderY = crestAt(riderX) - 4 - airLift;

      /* wake down the face */
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(riderX - 6, riderY + 6);
      ctx.quadraticCurveTo(riderX - 70, crestAt(riderX - 70) + 22, riderX - 150, crestAt(riderX - 150) + 34);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(riderX, riderY);
      if (g.wipe > 0) ctx.rotate(g.time * 12);
      else if (g.air > 0) ctx.rotate(g.airSpin * Math.PI / 180);
      else ctx.rotate(g.clamp(slope, -0.9, 0.9));
      ctx.translate(-riderX, -riderY);
      var art = g.held('a') && g.air <= 0 ? CROUCH : SURF;
      var sz = 5;
      g.pixels(art, riderX - Arcade.artW(art, sz) / 2, riderY - Arcade.artH(art, sz), sz, P_SURF);
      ctx.restore();

      /* spray */
      ctx.save(); ctx.fillStyle = '#ffffff';
      for (var i = 0; i < g.spray.length; i++) {
        var p = g.spray[i];
        ctx.globalAlpha = Math.max(0, 1 - p.t / 0.7);
        ctx.fillRect(p.x, p.y, 3, 3);
      }
      ctx.restore();

      /* the curl throws over the rider - drawn last so you are inside it */
      if (barrel && g.lead < 260) {
        var cy = crestAt(lipX);
        ctx.save();
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = '#0a4f7d';
        ctx.beginPath();
        ctx.moveTo(lipX - 30, cy - 4);
        ctx.quadraticCurveTo(lipX + 120, cy - 60, lipX + 260, cy + 90);
        ctx.quadraticCurveTo(lipX + 130, cy + 6, lipX - 30, cy + 56);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#e6f7ff'; ctx.lineWidth = 5;
        ctx.shadowColor = '#cdefff'; ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.moveTo(lipX - 30, cy - 2);
        ctx.quadraticCurveTo(lipX + 120, cy - 58, lipX + 260, cy + 92);
        ctx.stroke();
        ctx.restore();
      }

      /* ---- HUD ---- */
      ctx.fillStyle = 'rgba(6,3,16,0.55)';
      ctx.fillRect(0, 0, w, 50);
      g.text('SCORE ' + g.pad(g.score, 6), 10, 18, { size: 10, color: C.yellow, align: 'left' });
      g.text('RIDE ' + g.ride.toFixed(0) + 's', 10, 38, { size: 8, color: C.steel, align: 'left', glow: false });
      g.text('WIPEOUTS LEFT ' + Math.max(0, g.lives), w - 10, 18, { size: 8, color: C.pink, align: 'right', glow: false });
      if (g.combo > 0) g.text('COMBO x' + g.combo, w - 10, 38, { size: 10, color: C.green, align: 'right' });

      /* pocket meter: how close the foam is */
      g.text(g.lead < 90 ? 'FOAM  ON  YOUR  HEELS!' : 'HOW  FAR  AHEAD  OF  THE  BREAK  YOU  ARE',
        w / 2, h - 40, { size: 7, color: g.lead < 90 ? C.red : C.steel, glow: false });
      g.bar(20, h - 30, w - 40, 14, 1 - g.lead / LEAD_MAX, g.lead < 90 ? C.red : C.cyan);

      if (g.inTube) g.text('BARRELLED!', w / 2, h * 0.3, { size: 18, color: C.cyan, glow: C.cyan });
      if (g.wipe > 0) g.text('WIPEOUT!', w / 2, h * 0.42, { size: 22, color: C.red, glow: C.red });
    }
  });

  function wipe(g, msg) {
    g.wipe = 1.4;
    g.setLives(g.lives - 1);
    g.combo = 0; g.tubeT = 0;
    g.sfx('splash'); g.sfx('crash');
    g.shake(18); g.flash('#bfeaff', 0.14);
    g.burst(g.w * 0.42, g.h * 0.6, ['#ffffff', '#bfeaff', '#8fd8ff'], 30, 240, 200);
    g.banner(msg, 1.3, C.red);
  }
})();
