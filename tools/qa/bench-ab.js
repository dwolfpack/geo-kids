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

function bot() {
  const N = window.NYC, G = N.G;
  const caps = { wall: 9, times: 8, brooklyn: 7, uptown: 7 };
  for (let step = 0; step < 36000; step++) {
    N.simulate(0.1);
    if (step % 20 === 0) {
      for (let k = 0; k < 4; k++) {
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
  }
  return { worth: N.netWorth(), owned: G.plots.filter(p => p.owned).length };
}

function fpsProbe() {
  const G = window.NYC.G;
  const kinds = ['food','retail','tech','finance','resi'];
  G.cash = 1e12; G.zoneBonus = 6; G.prestige = 5000;
  G.plots.forEach((p,i) => { if (p.park || p.rival) return; p.owned = true; p.biz = kinds[i%5];
    p.level = 6 + (i%8); p.built = 1; p.up = {marketing:3,synergy:3,automation:3,luxury:3}; });
  document.getElementById('sp3').click();
  window.__f = 0; const raf = requestAnimationFrame;
  (function c(){ window.__f++; raf(c); })();
}

const med = a => { const s = a.slice().sort((x,y)=>x-y); return s[Math.floor(s.length/2)]; };

(async () => {
  const b = await chromium.launch();
  const builds = [['gen 8', process.argv[2]], ['gen 9', process.argv[3]]];
  const N = 7;
  for (const [label, file] of builds) {
    const worths = [], fpss = [];
    for (let i = 0; i < N; i++) {
      const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
      const pg = await ctx.newPage();
      await pg.goto(fileUrl(file));
      await pg.waitForTimeout(500);
      const r = await pg.evaluate(bot);
      worths.push(r.worth);
      await ctx.close();
    }
    for (let i = 0; i < 0; i++) {
      const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } });
      const pg = await ctx.newPage();
      await pg.goto(fileUrl(file));
      await pg.waitForTimeout(900);
      await pg.evaluate(fpsProbe);
      await pg.waitForTimeout(9000);
      fpss.push(+(await pg.evaluate(() => (window.__f/9).toFixed(1))));
      await ctx.close();
    }
    console.log(`${label}: 60-min worth median $${(med(worths)/1e9).toFixed(2)}B ` +
      `[${worths.map(w=>(w/1e9).toFixed(1)).join(', ')}]  |  fps median ${med(fpss)} [${fpss.join(', ')}]`);
  }
  await b.close();
})();
