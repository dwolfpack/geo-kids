# Progress

This is the resume point. When a session resumes, it fetches `games/foundation`, reads this file, and continues from **Next step**.

## Status

| Game | Branch | Status | PR |
|---|---|---|---|
| Foundation (docs + hub) | `games/foundation` | ✅ done | [#5](https://github.com/dwolfpack/geo-kids/pull/5) |
| Pirate Trader | `game/pirate-trader` | ✅ gauntlet passed | [#6](https://github.com/dwolfpack/geo-kids/pull/6) |
| Merchant Caravan | `game/merchant-caravan` | ⏳ next | — |
| Lemonade Empire | `game/lemonade-empire` | ⬜ | — |
| Island Shop | `game/island-shop` | ⬜ | — |
| Kids Market | `game/kids-market` | ⬜ | — |

## Next step
Build Merchant Caravan on `game/merchant-caravan`. Copy `games/pirate-trader/engine/` from the
`game/pirate-trader` branch (`git show origin/game/pirate-trader:games/pirate-trader/engine/engine.js`)
and follow the same file layout, sim and e2e structure.

## Gauntlet results
- **Pirate Trader:**
  - Sim: first milestone median 2.3 min, 🪙2,000 median 12.1 min (p10 9.1, p90 17.5). No arbitrage and no dead ends.
  - e2e: 28/28 checks pass.

## Lessons carried forward
- Add `[hidden] { display: none !important; }` in the engine. Without it, any `display:flex` element ignores `hidden`.
- In RTL, isolate numbers (`direction: ltr` on floats), and avoid putting a coin emoji right after "ל-" in Hebrew text.
- Heuristic sim players must not sell right after buying. Track `boughtAt`.
- Save screenshots as JPEG (quality 55) to keep the repo small.

## How to run the gauntlet for a game
```
python3 -m http.server 8080 &                          # from repo root
node games/<name>/tests/sim.js                         # economy
NODE_PATH=$(npm root -g) node games/<name>/tests/e2e.js # Playwright, needs server on :8080
node scripts/validate-countries-data.js --levels
```
