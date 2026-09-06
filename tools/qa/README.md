# NYC Metro Tycoon — headless QA harness

Every script drives `nyc-tycoon.html` in headless Chromium via Playwright and
prints a one-line verdict. They exist because this game cannot be verified by
reading it: most of the bugs found during development were only visible by
running the simulation or by looking at a screenshot.

```bash
npm i -g playwright        # once, if it is not already present
node tools/qa/boot.js nyc-tycoon.html /tmp/shot.png
```

Each script takes the path to the HTML file as its first argument, and any
screenshot paths after that.

| script | what it checks |
|---|---|
| `boot.js` | loads the page, prints every console/page error, screenshots |
| `play.js` | full interaction pass: select → buy → found → upgrade → micro-upgrade → risk toggle → every modal |
| `economy.js` | runs a greedy bot for 60 simulated minutes, prints the net-worth curve against rival progress |
| `stress.js` | fully built 93-block city at 4x, FPS, then a save/reload round trip |
| `tutorial.js` | the eight tutorial steps gate on real actions; contracts complete and refill without duplicates |
| `bug-hunt.js` | cross-system state: offers going stale when a block changes hands by another route |
| `save-fuzz.js` | twelve corrupt/legacy save payloads; asserts no NaN reaches the economy |
| `profile.js` | counts canvas operations in one frame and times the simulation step |
| `fps-ab.js` | **interleaved** FPS comparison of two builds — see the warning below |
| `bench-ab.js` | economy medians over N runs for two builds |

## Two traps that produce false results

**Absolute FPS numbers on a shared machine are meaningless.** The same build
measured 27 fps and 39 fps in this container depending on load. Only compare
builds with `fps-ab.js`, which interleaves A/B/A/B so drift hits both equally.

**A single economy run proves nothing.** The identical build varies about 7x
run to run. Use `bench-ab.js` and compare medians of at least five runs.

**Seed localStorage before the page loads, not after.** The game saves on
`beforeunload`, so `page.evaluate(setItem)` followed by `reload()` gets
overwritten by the game's own save. Use `context.addInitScript` — see
`save-fuzz.js`.

**A fresh browser context is a first-time player.** `localStorage.clear()`
plus a reload is not, for the reason above.
