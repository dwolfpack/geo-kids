# Progress

This is the resume point. When a session resumes, it fetches `games/foundation`, reads this file, and continues from **Next step**.

## Status

| Game | Branch | Status | PR |
|---|---|---|---|
| Foundation (docs + hub) | `games/foundation` | ✅ done | [#5](https://github.com/dwolfpack/geo-kids/pull/5) |
| Pirate Trader | `game/pirate-trader` | ✅ gauntlet passed | [#6](https://github.com/dwolfpack/geo-kids/pull/6) |
| Merchant Caravan | `game/merchant-caravan` | ✅ gauntlet passed | [#7](https://github.com/dwolfpack/geo-kids/pull/7) |
| Lemonade Empire | `game/lemonade-empire` | ⏳ next | — |
| Island Shop | `game/island-shop` | ⬜ | — |
| Kids Market | `game/kids-market` | ⬜ | — |

## Next step
Build Lemonade Empire (an idle tycoon) on `game/lemonade-empire`. Copy the engine from
`origin/game/merchant-caravan:games/merchant-caravan/engine/`. This game is time-based rather than
turn-based, so its sim steps simulated seconds instead of actions.

## Gauntlet results
- **Pirate Trader:**
  - Sim: first milestone median 2.3 min, 🪙2,000 median 12.1 min (p10 9.1, p90 17.5). No arbitrage and no dead ends.
  - e2e: 28/28 checks pass.

- **Merchant Caravan:**
  - Sim: first milestone median 3.1 min, 🪙5,000 median 11.4 min (p10 8.9, p90 14.9), win reached by 217/500 within an hour.
  - The sim caught contract farming and a poverty trap. Both are fixed.
  - e2e: 31/31 checks pass.

## Lessons carried forward
- Gate "time spent broke" in the sims. The formal no-dead-end check misses poverty spirals.
- Price impact must stay small relative to late-game capacity, or growth plateaus.
- Set milestone values from the measured growth curve instead of guessing them upfront.
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
