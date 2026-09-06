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
  pg.on('console', m => { if (m.type() === 'error' || m.type()==='warning') errs.push(m.type()+': '+m.text()); });
  pg.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  await pg.goto(fileUrl(process.argv[2]));
  await pg.waitForTimeout(2500);
  const info = await pg.evaluate(() => {
    const N = window.NYC; if (!N) return { fatal: 'no NYC hook' };
    return {
      plots: N.G.plots.length,
      buildable: N.G.plots.filter(p=>!p.park).length,
      cash: N.G.cash, cars: N.G.cars.length, peds: N.G.peds.length
    };
  });
  console.log('BOOT', JSON.stringify(info));
  // Economy sim: greedy AI buying+upgrading for N sim-seconds
  const econ = await pg.evaluate(() => {
    const N = window.NYC, G = N.G;
    const log = [];
    let t = 0;
    for (let step = 0; step < 36000; step++) { // 3600 sim seconds at 0.1
      N.simulate(0.1); t += 0.1;
      if (step % 20 === 0) {
        // greedy: buy best upgrade/plot affordable
        for (let k = 0; k < 4; k++) {
          const owned = G.plots.filter(p=>p.owned && !p.park);
          let best = null, bestScore = 0;
          for (const p of owned) {
            if (!p.biz) { continue; }
            const cap = Math.min(9, ({wall:9,times:8,brooklyn:7,uptown:7})[p.d] + G.zoneBonus);
            if (p.level < cap) {
              const c = N.upgradeCost(p);
              const gain = N.plotRevenue(p) * (Math.pow((p.level+1)/p.level, 2.6) - 1);
              if (c <= G.cash && gain / c > bestScore) { bestScore = gain/c; best = {t:'up',p}; }
            }
          }
          const free = G.plots.filter(p=>!p.owned && !p.rival && !p.park);
          if (free.length) {
            free.sort((a,b)=>N.landPrice(a)-N.landPrice(b));
            const p = free[0], c = N.landPrice(p);
            if (c <= G.cash * 0.5) { const sc = 0.00002; if (sc > bestScore) { bestScore = sc; best = {t:'buy',p}; } }
          }
          for (const p of owned) if (!p.biz) { const c = N.plotRevenue; }
          if (!best) break;
          if (best.t==='up') { G.cash -= N.upgradeCost(best.p); best.p.level++; }
          else { G.cash -= N.landPrice(best.p); best.p.owned = true; best.p.biz = 'finance'; best.p.level = 1; best.p.built=1; }
        }
      }
      if (step % 6000 === 0) log.push({min:(t/60).toFixed(0), worth: N.netWorth(), cash:G.cash, owned:G.plots.filter(p=>p.owned).length, gross:G.grossRate, rb:G.plots.filter(p=>p.rival).length, rw:Math.max(...G.rivals.map(r=>N.rivalWorth(r)))});
    }
    log.push({min:(t/60).toFixed(0), worth:N.netWorth(), cash:G.cash, owned:G.plots.filter(p=>p.owned).length, gross:G.grossRate, rb:G.plots.filter(p=>p.rival).length, rw:Math.max(...G.rivals.map(r=>N.rivalWorth(r)))});
    return log;
  });
  console.log('ECON');
  for (const r of econ) console.log(`  t=${r.min}min playerWorth=${(r.worth/1e6).toFixed(2)}M owned=${r.owned} | rivalBlocks=${r.rb} topRivalWorth=${(r.rw/1e6).toFixed(2)}M ratio=${(r.worth/r.rw).toFixed(2)}x`);
  await pg.screenshot({ path: process.argv[3] });
  console.log('ERRORS', errs.length ? errs.slice(0,12) : 'none');
  await b.close();
})();
