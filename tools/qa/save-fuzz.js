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
const CASES = {
  'empty string':        '',
  'not json':            '{{{',
  'null':                'null',
  'array not object':    '[1,2,3]',
  'missing everything':  '{}',
  'NaN-ish numbers':     '{"cash":"abc","prestige":null,"taxRate":"x","risk":9,"plots":[]}',
  'plots not array':     '{"cash":5000,"plots":"nope"}',
  'junk plot entries':   '{"cash":5000,"plots":[null,{"x":999,"y":999,"l":5},{"x":1,"y":1,"b":"nope","l":3}]}',
  'unknown rival id':    '{"cash":5000,"plots":[{"x":11,"y":5,"b":"tech","l":2,"r":"ghost"}]}',
  'corrupt legacy':      '{"cash":5000,"plots":[],"legacy":{"shares":"x","up":{"instinct":99,"bogus":3}}}',
  'v1-era save':         '{"cash":900000,"prestige":12,"influence":3,"risk":0.1,"taxRate":0.28,"zoneBonus":0,"transitLv":0,"tourismLv":0,"plots":[{"x":10,"y":5,"b":"tech","l":3,"u":{"marketing":1,"synergy":0,"automation":0,"luxury":0},"s":false,"m":false},{"x":10,"y":6,"b":"food","l":2,"u":{"marketing":0,"synergy":0,"automation":0,"luxury":0},"s":false,"m":false}]}',
  'coords on a street':   '{"cash":7000,"plots":[{"x":11,"y":5,"b":"tech","l":4},{"x":9,"y":2,"b":"food","l":3}]}'
};
(async () => {
  const b = await chromium.launch();
  for (const [name, payload] of Object.entries(CASES)) {
    const ctx = await b.newContext({ viewport: { width: 1024, height: 700 } });
    // seed storage BEFORE any page script runs, so the game's own beforeunload
    // save cannot overwrite the payload during a reload
    await ctx.addInitScript(p => {
      try { localStorage.setItem('nyc-metro-tycoon-v1', p); } catch (e) {}
    }, payload);
    const pg = await ctx.newPage();
    const errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    await pg.goto('file://' + process.argv[2]);
    await pg.waitForTimeout(1200);
    const st = await pg.evaluate(() => {
      const N = window.NYC, G = N.G;
      for (let i = 0; i < 100; i++) N.simulate(0.1);      // run the economy on the loaded state
      const bad = [];
      for (const k of ['cash','prestige','influence','risk','taxRate','grossRate','opexRate','lastNet'])
        if (!Number.isFinite(G[k])) bad.push(k);
      if (!Number.isFinite(N.netWorth())) bad.push('netWorth');
      for (const p of G.plots) if (!Number.isFinite(p.revenue)) { bad.push('plot.revenue'); break; }
      return { bad, cash: Math.round(G.cash), owned: G.plots.filter(p=>p.owned).length,
               rivals: G.plots.filter(p=>p.rival).length, hud: document.getElementById('s-cash').textContent };
    });
    const ok = st.bad.length === 0 && errs.length === 0;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(20)} cash=${String(st.cash).padStart(9)} owned=${st.owned} rivals=${st.rivals} hud="${st.hud}"` +
      (st.bad.length ? '  NaN in: ' + st.bad.join(',') : '') + (errs.length ? '  ERR: ' + errs[0].slice(0,60) : ''));
    await ctx.close();
  }
  await b.close();
})();
