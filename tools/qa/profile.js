const path = require('path');
/* Playwright lives in different places depending on the machine; try the usual ones. */
function loadPlaywright() {
  const candidates = [
    'playwright',
    '/opt/node22/lib/node_modules/playwright',
    '/usr/lib/node_modules/playwright',
    path.join(process.env.HOME || '', '.npm-global/lib/node_modules/playwright')
  ];
  for (const c of candidates) { try { return require(c); } catch (e) { /* next */ } }
  console.error('Could not load playwright. Install it with: npm i -g playwright');
  process.exit(2);
}
const { chromium } = loadPlaywright();
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file://' + process.argv[2]);
  await pg.waitForTimeout(1000);
  const r = await pg.evaluate(async () => {
    const N = window.NYC, G = N.G;
    N.tutEnd();
    const kinds = ['food','retail','tech','finance','resi'];
    G.cash = 1e12; G.zoneBonus = 6; G.prestige = 5000;
    G.plots.forEach((p,i) => { if (p.park || p.rival) return; p.owned = true; p.biz = kinds[i%5];
      p.level = 6 + (i%8); p.built = 1; p.up = {marketing:3,synergy:3,automation:3,luxury:3}; });
    // instrument: count canvas ops for one frame by proxying the 2d context
    const cv = document.getElementById('cv');
    const c2 = cv.getContext('2d');
    const counts = {};
    const orig = {};
    for (const m of ['fillRect','fill','stroke','beginPath','arc','moveTo','lineTo',
                     'fillText','createLinearGradient','createRadialGradient','save','restore']) {
      orig[m] = c2[m].bind(c2);
      counts[m] = 0;
      c2[m] = function(...a) { counts[m]++; return orig[m](...a); };
    }
    await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
    const oneFrame = JSON.parse(JSON.stringify(counts));
    for (const m in orig) c2[m] = orig[m];
    // time the phases directly
    const t = {};
    const time = (name, fn, n) => { const s = performance.now();
      for (let i = 0; i < n; i++) fn(); t[name] = +((performance.now()-s)/n).toFixed(2); };
    time('simulate(0.1)', () => N.simulate(0.1), 200);
    return { oneFrame, t, plots: G.plots.length, peds: G.peds.length, cars: G.cars.length };
  });
  console.log('CANVAS OPS IN ONE FRAME (full 93-block city):');
  Object.entries(r.oneFrame).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => { if (v) console.log(`  ${k.padEnd(22)} ${v}`); });
  console.log('PHASE TIMING (ms):', JSON.stringify(r.t));
  console.log('entities: peds=' + r.peds, 'cars=' + r.cars);
  await b.close();
})();
