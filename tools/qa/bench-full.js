/* Whole-project benchmark. Prints a report: static size, load, runtime frame
   rate at four city scales, memory, simulation cost, canvas load, save payload
   and economy medians. Absolute frame rates here are CPU-rasterised and far
   below a real GPU-backed browser; the value is the shape across scales and
   the run-to-run spread, not the number. */
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const { execSync } = require('child_process');

function loadPlaywright() {
  const candidates = ['playwright', '/opt/node22/lib/node_modules/playwright',
    '/usr/lib/node_modules/playwright'];
  for (const c of candidates) { try { return require(c); } catch (e) {} }
  console.error('playwright not found'); process.exit(2);
}
const { chromium } = loadPlaywright();
const fileUrl = p => 'file://' + path.resolve(p);

const med = a => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const kb = n => (n / 1024).toFixed(1) + ' KB';
const pad = (s, n) => String(s).padEnd(n);
const rpad = (s, n) => String(s).padStart(n);

/* ---------- 1. static ---------- */
function staticMetrics(file) {
  const src = fs.readFileSync(file, 'utf8');
  const gz = zlib.gzipSync(src).length;
  const scripts = [...src.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
  const styles = [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
  const ext = [...src.matchAll(/<(?:script|link)[^>]*(?:src|href)="(https?:\/\/[^"]+)"/g)].length;
  return {
    bytes: src.length, gzip: gz, lines: src.split('\n').length,
    js: scripts.length, css: styles.length,
    jsLines: scripts.split('\n').length,
    fns: (scripts.match(/^\s*function \w+\s*\(/gm) || []).length,
    external: ext
  };
}

/* ---------- city builder used by several probes ---------- */
/* NOTE: page.evaluate passes ONE argument, so this takes a destructured pair.
   Taking (n, tier) silently made n the whole array, slice(0, NaN) returned
   nothing, and every "scale" measured an empty city. */
const buildCity = `([n, tier]) => {
  const N = window.NYC, G = N.G;
  if (N.tutEnd) N.tutEnd();
  const kinds = ['food','retail','tech','finance','resi'];
  G.cash = 1e12; G.zoneBonus = 6; G.prestige = 4000;
  const pool = G.plots.filter(p => !p.park && !p.rival);
  pool.slice(0, n).forEach((p, i) => {
    p.owned = true; p.biz = kinds[i % 5]; p.level = tier + (i % 4); p.built = 1;
    p.up = { marketing: 3, synergy: 3, automation: 3, luxury: 3 };
  });
  for (let i = 0; i < 100; i++) N.simulate(0.1);
  return pool.slice(0, n).length;
}`;

(async () => {
  const GAME = process.argv[2] || 'nyc-tycoon.html';
  const KIDS = process.argv[3] || 'geo-kids/index.html';
  const browser = await chromium.launch();
  const out = [];
  const say = s => { out.push(s); console.log(s); };

  say('='.repeat(78));
  say('NYC METRO TYCOON — WHOLE-PROJECT BENCHMARK');
  say('commit ' + execSync('git rev-parse --short HEAD').toString().trim() +
      '   ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC');
  say('='.repeat(78));

  /* ---------- static ---------- */
  say('\n── STATIC ' + '─'.repeat(67));
  for (const [label, f] of [['nyc-tycoon.html', GAME], ['geo-kids/index.html', KIDS]]) {
    if (!fs.existsSync(f)) continue;
    const m = staticMetrics(f);
    say(pad(label, 22) + rpad(kb(m.bytes), 10) + rpad('gz ' + kb(m.gzip), 14) +
        rpad(m.lines + ' lines', 12) + rpad(m.external + ' external refs', 20));
    say(pad('', 22) + rpad('js ' + kb(m.js), 10) + rpad('css ' + kb(m.css), 14) +
        rpad(m.fns + ' functions', 12));
  }

  /* ---------- load ---------- */
  say('\n── LOAD ' + '─'.repeat(69));
  for (const [label, f] of [['nyc-tycoon.html', GAME], ['geo-kids/index.html', KIDS]]) {
    if (!fs.existsSync(f)) continue;
    const samples = [];
    for (let i = 0; i < 5; i++) {
      const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
      const pg = await ctx.newPage();
      await pg.goto(fileUrl(f), { waitUntil: 'load' });
      const t = await pg.evaluate(() => {
        const n = performance.getEntriesByType('navigation')[0] || {};
        return { dcl: Math.round(n.domContentLoadedEventEnd || 0),
                 load: Math.round(n.loadEventEnd || 0) };
      });
      samples.push(t); await ctx.close();
    }
    say(pad(label, 22) + 'DOMContentLoaded ' + rpad(med(samples.map(s => s.dcl)) + ' ms', 8) +
        '    load ' + rpad(med(samples.map(s => s.load)) + ' ms', 8) + '   (median of 5)');
  }

  /* ---------- runtime: fps / memory / canvas load by city scale ---------- */
  say('\n── RUNTIME BY CITY SCALE ' + '─'.repeat(52));
  say(pad('city', 20) + rpad('fps 1x', 9) + rpad('fps 4x', 9) + rpad('heap', 10) +
      rpad('canvas ops/frame', 19) + rpad('sim ms', 9));
  const scales = [['empty (0 blocks)', 0, 0], ['early (10 blocks)', 10, 2],
                  ['mid (40 blocks)', 40, 4], ['full (93 blocks)', 93, 6]];
  const fpsRows = {};
  for (const [label, n, tier] of scales) {
    const row = { fps1: [], fps4: [], heap: 0, ops: 0, sim: 0 };
    for (const speed of ['1x', '4x']) {
      for (let r = 0; r < 2; r++) {
        const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
        const pg = await ctx.newPage();
        await pg.goto(fileUrl(GAME));
        await pg.waitForTimeout(900);
        if (n > 0) await pg.evaluate(new Function('return ' + buildCity)(), [n, tier]);
        await pg.evaluate((sp) => {
          window.NYC.tutEnd && window.NYC.tutEnd();
          document.getElementById(sp === '4x' ? 'sp3' : 'sp1').click();
          window.__f = 0; const raf = requestAnimationFrame;
          (function c() { window.__f++; raf(c); })();
        }, speed);
        await pg.waitForTimeout(6000);
        const fps = +(await pg.evaluate(() => (window.__f / 6).toFixed(1)));
        row[speed === '1x' ? 'fps1' : 'fps4'].push(fps);
        if (speed === '4x' && r === 0) {
          row.heap = await pg.evaluate(() =>
            performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : 0);
          row.sim = await pg.evaluate(() => {
            const N = window.NYC, s = performance.now();
            for (let i = 0; i < 200; i++) N.simulate(0.1);
            return +((performance.now() - s) / 200).toFixed(3);
          });
          row.ops = await pg.evaluate(async () => {
            const c2 = document.getElementById('cv').getContext('2d');
            let count = 0; const orig = {};
            for (const m of ['fillRect','fill','stroke','beginPath','arc','moveTo','lineTo','fillText']) {
              orig[m] = c2[m].bind(c2);
              c2[m] = function (...a) { count++; return orig[m](...a); };
            }
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            for (const m in orig) c2[m] = orig[m];
            return count;
          });
        }
        await ctx.close();
      }
    }
    fpsRows[label] = row;
    say(pad(label, 20) + rpad(med(row.fps1), 9) + rpad(med(row.fps4), 9) +
        rpad(row.heap ? row.heap + ' MB' : 'n/a', 10) +
        rpad(row.ops.toLocaleString(), 19) + rpad(row.sim, 9));
  }

  /* ---------- save payload ---------- */
  say('\n── SAVE PAYLOAD ' + '─'.repeat(61));
  {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    const pg = await ctx.newPage();
    await pg.goto(fileUrl(GAME)); await pg.waitForTimeout(900);
    await pg.evaluate(new Function('return ' + buildCity)(), [93, 6]);
    const sz = await pg.evaluate(() => {
      document.getElementById('btn-save').click();
      const s = localStorage.getItem('nyc-metro-tycoon-v1') || '';
      return { bytes: s.length, keys: Object.keys(localStorage).length };
    });
    say(pad('full city save', 22) + rpad(kb(sz.bytes), 10) +
        rpad(sz.keys + ' storage keys', 20) + '  (localStorage cap is ~5 MB)');
    await ctx.close();
  }

  /* ---------- economy ---------- */
  say('\n── ECONOMY (greedy bot, 60 simulated minutes) ' + '─'.repeat(32));
  const worths = [];
  for (let i = 0; i < 5; i++) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const pg = await ctx.newPage();
    await pg.goto(fileUrl(GAME)); await pg.waitForTimeout(500);
    const w = await pg.evaluate(() => {
      const N = window.NYC, G = N.G;
      if (N.tutEnd) N.tutEnd();
      const caps = { wall: 9, times: 8, brooklyn: 7, uptown: 7 };
      for (let step = 0; step < 36000; step++) {
        N.simulate(0.1);
        if (step % 20 === 0) for (let k = 0; k < 4; k++) {
          const owned = G.plots.filter(p => p.owned && !p.park && p.biz);
          let best = null, score = 0;
          for (const p of owned) {
            const cap = Math.min(15, caps[p.d] + G.zoneBonus);
            if (p.level < cap) {
              const c = N.upgradeCost(p);
              const gain = N.plotRevenue(p) * (Math.pow((p.level + 1) / p.level, 2.85) - 1);
              if (c <= G.cash && gain / c > score) { score = gain / c; best = { t: 'up', p }; }
            }
          }
          const free = G.plots.filter(p => !p.owned && !p.rival && !p.park)
            .sort((a, b) => N.landPrice(a) - N.landPrice(b));
          if (free.length && N.landPrice(free[0]) <= G.cash * 0.5 && 0.00002 > score)
            best = { t: 'buy', p: free[0] };
          if (!best) break;
          if (best.t === 'up') { G.cash -= N.upgradeCost(best.p); best.p.level++; }
          else { G.cash -= N.landPrice(best.p); best.p.owned = true; best.p.biz = 'finance';
                 best.p.level = 1; best.p.built = 1; }
        }
      }
      return N.netWorth();
    });
    worths.push(w); await ctx.close();
  }
  const b = worths.map(w => w / 1e9);
  say(pad('net worth at 60 min', 22) + 'median $' + med(b).toFixed(2) + 'B' +
      '   spread $' + Math.min(...b).toFixed(2) + 'B – $' + Math.max(...b).toFixed(2) + 'B' +
      '   (' + (Math.max(...b) / Math.max(0.01, Math.min(...b))).toFixed(1) + 'x, n=5)');

  say('\n' + '='.repeat(78));
  fs.writeFileSync(process.argv[4] || '/tmp/bench-report.txt', out.join('\n') + '\n');
  await browser.close();
})();
