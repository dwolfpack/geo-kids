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
  await pg.waitForTimeout(1200);
  // give player money and select a cheap brooklyn plot via API-free UI path:
  await pg.evaluate(() => { window.NYC.G.cash = 5e7; });
  // click on a plot: find screen coords of a brooklyn plot through the page's own transform
  const pt = await pg.evaluate(() => {
    const G = window.NYC.G;
    const p = G.plots.find(q => q.d === 'brooklyn' && !q.park);
    const cam = window.NYC.cam;
    return { name: p.name, x: p.x, y: p.y };
  });
  // use keyboard/UI: simulate select through pointer at center-ish by scanning
  const clicked = await pg.evaluate(({x,y}) => {
    // replicate worldToScreen using exported helper
    const ev = window.NYC;
    const s = ev.worldToScreen(x + .5, y + .5);
    return s;
  }, pt).catch(() => null);
  if (clicked) {
    await pg.mouse.move(clicked.x, clicked.y);
    await pg.waitForTimeout(300);
    await pg.mouse.click(clicked.x, clicked.y);
    await pg.waitForTimeout(400);
  }
  const inspOpen = await pg.evaluate(() => !document.getElementById('insp').classList.contains('hidden'));
  const buyBtn = await pg.$('#a-buy');
  if (buyBtn) await buyBtn.click();
  await pg.waitForTimeout(300);
  const bizCard = await pg.$('.bizc[data-biz="tech"]');
  if (bizCard) await bizCard.click();
  await pg.waitForTimeout(300);
  for (let i=0;i<3;i++){ const u = await pg.$('#a-up'); if(u){ await u.click(); await pg.waitForTimeout(250);} }
  const mk = await pg.$('[data-up="marketing"]'); if (mk) { await mk.click(); await pg.waitForTimeout(250); }
  const sk = await pg.$('#a-sketch'); if (sk) { await sk.click(); await pg.waitForTimeout(250); }
  await pg.waitForTimeout(600);
  const state = await pg.evaluate(() => {
    const p = window.NYC.G.selected;
    return p ? { name:p.name, owned:p.owned, biz:p.biz, level:p.level, rev:p.revenue } : null;
  });
  console.log('INSPECTOR OPEN:', inspOpen, 'PLOT:', JSON.stringify(state));
  // modals
  for (const id of ['btn-lobby','btn-goals','btn-help']) {
    await pg.click('#' + id); await pg.waitForTimeout(250);
    const open = await pg.evaluate(() => document.getElementById('modal').classList.contains('open'));
    const h = await pg.evaluate(() => document.querySelector('#mbox h1')?.textContent);
    console.log('MODAL', id, open, h);
    await pg.click('#m-close'); await pg.waitForTimeout(150);
  }
  // district modal
  await pg.click('.dcard'); await pg.waitForTimeout(300);
  console.log('DISTRICT MODAL', await pg.evaluate(() => document.querySelector('#mbox h1')?.textContent));
  await pg.click('#m-close');
  // overlays
  for (const k of ['2','3','4','5','1']) { await pg.keyboard.press(k); await pg.waitForTimeout(120); }
  await pg.waitForTimeout(500);
  await pg.screenshot({ path: process.argv[3] });
  console.log('ERRORS', errs.length ? errs : 'none');
  await b.close();
})();
