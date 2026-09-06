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
const med = a => { const s = a.slice().sort((x,y)=>x-y); return s[Math.floor(s.length/2)]; };
(async () => {
  const b = await chromium.launch();
  const builds = process.argv.slice(2);
  const res = {};
  // interleave A/B/A/B so machine load drifts hit both builds equally
  for (let round = 0; round < 4; round++) {
    for (const f of builds) {
      const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } });
      const pg = await ctx.newPage();
      await pg.goto(fileUrl(f));
      await pg.waitForTimeout(900);
      await pg.evaluate(() => {
        const N = window.NYC, G = N.G;
        if (N.tutEnd) N.tutEnd();
        const kinds = ['food','retail','tech','finance','resi'];
        G.cash = 1e12; G.zoneBonus = 6; G.prestige = 5000;
        G.plots.forEach((p,i) => { if (p.park || p.rival) return; p.owned = true; p.biz = kinds[i%5];
          p.level = 6 + (i%8); p.built = 1; p.up = {marketing:3,synergy:3,automation:3,luxury:3}; });
        document.getElementById('sp3').click();
        window.__f = 0; const raf = requestAnimationFrame;
        (function c(){ window.__f++; raf(c); })();
      });
      await pg.waitForTimeout(8000);
      const fps = +(await pg.evaluate(() => (window.__f/8).toFixed(1)));
      (res[f] = res[f] || []).push(fps);
      await ctx.close();
    }
  }
  for (const f of builds) console.log(`${f.split('/').pop().padEnd(20)} fps median ${med(res[f])}  [${res[f].join(', ')}]`);
  await b.close();
})();
