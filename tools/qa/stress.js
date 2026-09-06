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

/* Accept relative or absolute paths for the target HTML. */
const fileUrl = p => 'file://' + path.resolve(p);
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errs = [];
  pg.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  pg.on('console', m => { if (m.type()==='error') errs.push('CONSOLE ' + m.text()); });
  await pg.goto(fileUrl(process.argv[2]));
  await pg.waitForTimeout(800);
  // fully develop the whole city, then run 4x for 15s measuring FPS
  await pg.evaluate(() => {
    const G = window.NYC.G;
    G.cash = 1e12; G.zoneBonus = 6; G.prestige = 5000; G.transitLv = 8;
    const kinds = ['food','retail','tech','finance','resi'];
    G.plots.forEach((p,i) => { if (p.park) return; p.owned = true; p.biz = kinds[i%5];
      p.level = 6 + (i % 8); p.built = 1; p.up = {marketing:3,synergy:3,automation:3,luxury:3};
      if (i % 11 === 0) p.sketchy = true; });
    document.getElementById('sp3').click();
    window.__f = 0; const raf = requestAnimationFrame;
    (function c(){ window.__f++; raf(c); })();
  });
  await pg.waitForTimeout(15000);
  const res = await pg.evaluate(() => {
    const G = window.NYC.G;
    return { fps: (window.__f/15).toFixed(1), worth: window.NYC.netWorth(), cash: G.cash,
      gross: G.grossRate, peds: G.peds.length, cars: G.cars.length, pickups: (G.pickups||[]).length,
      prestige: Math.floor(G.prestige), influence: Math.floor(G.influence), risk: G.risk,
      events: G.activeEvents.map(e=>e.def.id), won: G.won };
  });
  console.log('STRESS', JSON.stringify(res, null, 1));
  await pg.screenshot({ path: process.argv[3] });
  // zoomed-in screenshot
  await pg.evaluate(() => { window.NYC.cam.tz = 2.3; });
  await pg.waitForTimeout(1200);
  await pg.screenshot({ path: process.argv[4] });
  // save/load round trip
  const rt = await pg.evaluate(async () => {
    document.getElementById('btn-save').click();
    return !!localStorage.getItem('nyc-metro-tycoon-v1');
  });
  await pg.reload(); await pg.waitForTimeout(1500);
  const after = await pg.evaluate(() => ({ owned: window.NYC.G.plots.filter(p=>p.owned).length, cash: window.NYC.G.cash }));
  console.log('SAVE', rt, 'RELOAD', JSON.stringify(after));
  console.log('ERRORS', errs.length ? errs.slice(0,8) : 'none');
  await b.close();
})();
