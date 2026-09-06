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
  pg.on('pageerror', e => errs.push(e.message));
  pg.on('dialog', d => d.accept());
  await pg.goto(fileUrl(process.argv[2]));
  await pg.waitForTimeout(900);

  const out = await pg.evaluate(() => {
    const N = window.NYC, G = N.G, R = {};
    N.tutEnd();
    const setup = () => {
      G.plots.forEach(p => { p.owned=false; p.rival=null; p.biz=null; p.level=0; p.mega=false;
        p.up={marketing:0,synergy:0,automation:0,luxury:0}; });
      G.rivals.forEach((r,i) => { r.eliminated=false; r.cash=5e6; r.spite=0; });
      G.cash = 5e8; G.offer = null;
      const mine = G.plots.filter(p=>!p.park).slice(0,10);
      mine.forEach(p => { p.owned=true; p.biz='tech'; p.level=4; p.built=1; });
      const riv = G.plots.filter(p=>!p.park && !p.owned).slice(0,3);
      riv.forEach((p,i) => { p.rival=G.rivals[i%3].id; p.biz='finance'; p.level=3; p.built=1; });
      for (let i=0;i<30;i++) N.simulate(0.1);
      return { mine, riv };
    };

    // BUG HUNT 1: sell a block that has a live rival bid on it, then accept the bid
    let s = setup();
    const target = s.mine[0];
    G.offer = { type:'buy', plot: target, rival: G.rivals[0].id, price: 1e6, left: 45 };
    N.select(target);
    const cashBefore = G.cash;
    target.owned = false; target.biz = null; target.level = 0;   // simulate having sold it
    N.acceptOffer();
    R.sellUnderOffer = { gained: Math.round(G.cash - cashBefore), plotOwned: target.owned,
      plotRival: target.rival, sold: G.sold };

    // BUG HUNT 2: buy a rival block that has a live distressed sale on it, then accept
    s = setup();
    const rp = s.riv[0];
    G.offer = { type:'sale', plot: rp, rival: rp.rival, price: 5e5, left: 45 };
    const c2 = G.cash;
    N.buyoutPlot(rp);                       // player buys it the normal way
    const afterBuyout = { owned: rp.owned, rival: rp.rival, offerStill: !!G.offer };
    if (G.offer) N.acceptOffer();           // now accept the stale distressed sale
    R.buyoutUnderSale = Object.assign(afterBuyout,
      { spentTwice: Math.round(c2 - G.cash), nowRival: rp.rival, nowOwned: rp.owned });

    // BUG HUNT 3: hostile takeover while one of that rival's blocks is under a sale offer
    s = setup();
    const rp2 = G.plots.find(p => p.rival);
    G.offer = { type:'sale', plot: rp2, rival: rp2.rival, price: 4e5, left: 45 };
    G.influence = 500; G.cash = 1e12;
    const r = G.rivals.find(x => x.id === rp2.rival);
    N.hostileTakeover ? N.hostileTakeover(r) : null;
    R.takeoverUnderSale = { plotOwned: rp2.owned, plotRival: rp2.rival,
      offerStill: !!G.offer, offerPlotOwned: G.offer ? G.offer.plot.owned : null };

    // BUG HUNT 4: does an expired offer leave a dangling selected-plot render?
    s = setup();
    const t4 = s.mine[1];
    G.offer = { type:'buy', plot: t4, rival: G.rivals[0].id, price: 1e6, left: 0.05 };
    for (let i=0;i<10;i++) N.simulate(0.1);
    R.expiry = { offer: G.offer };

    // BUG HUNT 5: mega tower on a plot, then sell it — is the win flag still claimed?
    s = setup();
    const t5 = s.mine[2];
    t5.mega = true; G.won.mega = true;
    t5.owned = false; t5.mega = false;       // sold
    R.megaAfterSell = { wonMega: G.won.mega, anyMegaOnBoard: G.plots.some(p=>p.mega) };

    return R;
  });
  console.log(JSON.stringify(out, null, 1));
  console.log('ERRORS', errs.length ? errs : 'none');
  await b.close();
})();
