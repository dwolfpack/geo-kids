# Progress

This is the resume point. When a session resumes, it fetches `games/foundation`, reads this file, and continues from **Next step**.

## Status

| Game | Branch | Status | PR |
|---|---|---|---|
| Foundation (docs + hub) | `games/foundation` | ✅ done | _pending_ |
| Pirate Trader | `game/pirate-trader` | ⏳ next | — |
| Merchant Caravan | `game/merchant-caravan` | ⬜ | — |
| Lemonade Empire | `game/lemonade-empire` | ⬜ | — |
| Island Shop | `game/island-shop` | ⬜ | — |
| Kids Market | `game/kids-market` | ⬜ | — |

## Next step
Build Pirate Trader on `game/pirate-trader`, including the shared engine in `games/pirate-trader/engine/`.
Then run it through the gauntlet (see PLAN.md).

## How to run the gauntlet for a game
```
python3 -m http.server 8080 &                          # from repo root
node games/<name>/tests/sim.js                         # economy
NODE_PATH=$(npm root -g) node games/<name>/tests/e2e.js # Playwright, needs server on :8080
node scripts/validate-countries-data.js --levels
```
