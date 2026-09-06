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
  const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  pg.on('console', m => { if (m.type()==='error') errs.push('CONSOLE ' + m.text()); });
  pg.on('dialog', d => d.accept());
  await pg.goto(fileUrl(process.argv[2]));      // fresh context = genuine first-time player
  await pg.waitForTimeout(1600);

  // --- TUTORIAL: does it appear for a new player and gate on real actions? ---
  const t0 = await pg.evaluate(() => ({
    coach: !document.getElementById('coach').hidden,
    step: document.getElementById('coach-step').textContent,
    nextDisabled: document.getElementById('coach-next').disabled
  }));
  await pg.click('#coach-next'); await pg.waitForTimeout(400);
  const t1 = await pg.evaluate(() => ({
    step: document.getElementById('coach-step').textContent,
    nextDisabled: document.getElementById('coach-next').disabled,
    spotVisible: !document.getElementById('spot').hidden,
    spot: document.getElementById('spot').getBoundingClientRect(),
    plot: window.TUT_TEST.plot && window.TUT_TEST.plot.name
  }));
  // step 2 gates on clicking the highlighted plot — click its centre
  const c = { x: t1.spot.x + t1.spot.width/2, y: t1.spot.y + t1.spot.height/2 };
  await pg.mouse.click(c.x, c.y); await pg.waitForTimeout(500);
  const t2 = await pg.evaluate(() => ({ step: document.getElementById('coach-step').textContent,
    selected: window.NYC.G.selected && window.NYC.G.selected.name }));
  // step 3 gates on buying
  await pg.click('#a-buy'); await pg.waitForTimeout(500);
  const t3 = await pg.evaluate(() => document.getElementById('coach-step').textContent);
  // step 4 gates on founding a business
  await pg.click('.bizc[data-biz="tech"]'); await pg.waitForTimeout(500);
  const t4 = await pg.evaluate(() => document.getElementById('coach-step').textContent);
  // step 5 gates on an upgrade
  await pg.evaluate(() => { window.NYC.G.cash = 5e6; });
  await pg.waitForTimeout(300);
  const upBtn = await pg.$('#a-up');
  if (upBtn) { await upBtn.click(); await pg.waitForTimeout(600); }
  const t5 = await pg.evaluate(() => document.getElementById('coach-step').textContent);
  console.log('TUTORIAL', JSON.stringify(t0), '\n  step2', JSON.stringify({step:t1.step, spot:t1.spotVisible, plot:t1.plot, gated:t1.nextDisabled}),
    '\n  after click:', t2.step, '(selected ' + t2.selected + ')',
    '\n  after buy:', t3, '| after found:', t4, '| after upgrade:', t5);
  await pg.screenshot({ path: process.argv[3] });
  // finish the rest
  for (let i = 0; i < 5; i++) {
    const vis = await pg.evaluate(() => !document.getElementById('coach').hidden &&
      !document.getElementById('coach-next').disabled);
    if (!vis) break;
    await pg.click('#coach-next'); await pg.waitForTimeout(300);
  }
  const done = await pg.evaluate(() => ({ hidden: document.getElementById('coach').hidden,
    stored: localStorage.getItem('nyc-tutorial-done') }));
  console.log('TUTORIAL END', JSON.stringify(done));
  // does it stay dismissed on reload?
  await pg.reload(); await pg.waitForTimeout(1400);
  console.log('AFTER RELOAD coach hidden:', await pg.evaluate(() => document.getElementById('coach').hidden));

  // --- CONTRACTS ---
  const con = await pg.evaluate(() => {
    const N = window.NYC, G = N.G;
    G.cash = 5e7;
    const first = (G.contracts||[]).map(c => c.text);
    // satisfy one deliberately: own N blocks in a district
    let completed = 0, seen = new Set(first);
    for (let i = 0; i < 12000; i++) {
      N.simulate(0.1);
      if (i % 200 === 0) {
        const free = G.plots.filter(p => !p.owned && !p.rival && !p.park)
          .sort((a,b)=>N.landPrice(a)-N.landPrice(b))[0];
        if (free && N.landPrice(free) < G.cash) {
          G.cash -= N.landPrice(free); free.owned = true; free.biz = 'tech'; free.level = 3; free.built = 1;
        }
      }
      (G.contracts||[]).forEach(c => seen.add(c.text));
    }
    return { first, completed: G.stats.contracts, distinctSeen: seen.size, active: G.contracts.length,
      sample: G.contracts.map(c => c.text + ' [' + Math.floor(c.now()) + '/' + Math.floor(c.goal) + ']') };
  });
  console.log('CONTRACTS start:', JSON.stringify(con.first));
  console.log('  completed in 20 sim-min:', con.completed, '| distinct offered:', con.distinctSeen, '| active now:', con.active);
  console.log('  live:', con.sample.join(' | '));
  console.log('ERRORS', errs.length ? errs.slice(0,6) : 'none');
  await b.close();
})();
