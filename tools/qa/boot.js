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
  const pg = await b.newPage({ viewport: { width: 1600, height: 900 } });
  pg.on('console', m => console.log('CONSOLE', m.type(), m.text()));
  pg.on('pageerror', e => console.log('PAGEERROR', e.message, '\n', (e.stack||'').split('\n').slice(0,4).join('\n')));
  await pg.goto('file://' + process.argv[2]);
  await pg.waitForTimeout(1500);
  await pg.screenshot({ path: process.argv[3] });
  await b.close();
})();
