# Progress

This is the resume point. When a session resumes, it fetches `games/foundation`, reads this file, and continues from **Next step**.

## Status

| Game | Branch | Status | PR |
|---|---|---|---|
| Foundation (docs + hub) | `games/foundation` | ✅ done | [#5](https://github.com/dwolfpack/geo-kids/pull/5) |
| Pirate Trader | `game/pirate-trader` | ✅ gauntlet passed | [#6](https://github.com/dwolfpack/geo-kids/pull/6) |
| Merchant Caravan | `game/merchant-caravan` | ✅ gauntlet passed | [#7](https://github.com/dwolfpack/geo-kids/pull/7) |
| Lemonade Empire | `game/lemonade-empire` | ✅ gauntlet passed | [#8](https://github.com/dwolfpack/geo-kids/pull/8) |
| Island Shop | `game/island-shop` | ✅ gauntlet passed | [#9](https://github.com/dwolfpack/geo-kids/pull/9) |
| Kids Market | `game/kids-market` | ✅ gauntlet passed | [#10](https://github.com/dwolfpack/geo-kids/pull/10) |

## Next step
**All five games are done.** What's left is review and merging:
1. Merge [#5](https://github.com/dwolfpack/geo-kids/pull/5), the foundation, first. It adds the `/games/` hub and the geo-kids "Trading Games" card.
2. Merge the game PRs in any order: [#6](https://github.com/dwolfpack/geo-kids/pull/6), [#7](https://github.com/dwolfpack/geo-kids/pull/7), [#8](https://github.com/dwolfpack/geo-kids/pull/8), [#9](https://github.com/dwolfpack/geo-kids/pull/9) and [#10](https://github.com/dwolfpack/geo-kids/pull/10).
   Each game is self-contained under `games/<name>/`.

## Final summary

| Game | Teaches | 1st goal | Big goal (median) | e2e |
|---|---|---|---|---|
| 🏴‍☠️ Pirate Trader | Buy low / sell high, world ports, capitals | 🪙500 · 2.3 min | 🪙2,000 · 12.1 min | 28 ✓ |
| 🐫 Merchant Caravan | Route planning, upkeep, contracts, market memory | 🪙1,000 · 3.1 min | 🪙5,000 · 11.4 min | 31 ✓ |
| 🍋 Lemonade Empire | Pricing & demand, profit per unit, compounding | 🪙500 · 3.6 min | 🪙10,000 · 12.1 min | 30 ✓ |
| 🏝️ Island Shop | Customer willingness to pay, stock, rent, spoilage | 🪙400 · 3.1 min | 🪙2,000 · 15.6 min | 28 ✓ |
| 📈 Kids Market | Diversifying, fees, news, patience, dividends | 🪙500 · 3.6 min | 🪙1,500 · 16.2 min | 24 ✓ |

All games share these properties:
- Hebrew (RTL) and English, mobile-first at 375px, every tap target ≥44px, safe-area aware, offline PWA.
- No ads, purchases, tracking or network calls. Everything keeps working when storage is blocked.
- Each economy sim runs 1,000 playthroughs and checks no arbitrage or churn profit, no dead ends and no poverty traps.
- Screenshots are in each game's `tests/screens/`.

## How to run the gauntlet for a game
```
python3 -m http.server 8080 &                          # from repo root
node games/<name>/tests/sim.js                         # economy
NODE_PATH=$(npm root -g) node games/<name>/tests/e2e.js # Playwright, needs server on :8080
node scripts/validate-countries-data.js --levels
```
