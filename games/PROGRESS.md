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
| Sky Rescue (3D) | `game/sky-rescue` | ✅ Gauntlet Loop: critic said YES in round 8 | _PR pending_ |

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

## Sky Rescue: Gauntlet Loop log
- The visual bar is `games/sky-rescue/ref/REFERENCE.md`: a Canva-generated reference plus an After Burner II motion spec.
- `tests/capture.js` records real pixels for every round:
  - 16:9 and phone stills;
  - bank, hit and bomb filmstrips;
  - full autopilot playthroughs of all 3 stages.
- Each round went to a fresh critic subagent with clean context, never shown builder notes. The critic judged the pixels
  and ran blind A/B tests against the previous round, then named the single biggest gap:
  - r1: flat, low camera; tiny dark helicopter
  - r2: camera too steep
  - r3: collected rings blocking the view
  - r4: camera clipping into sea stacks on a hit
  - r5: hits not registering during start invulnerability (a real bug)
  - r6: helicopter too small and turned wrong
  - r7: helicopter reads as a blob
  - r8: **YES**, all 5 win criteria pass
- Round 9 applied r8's top note: the helicopter now sits lower so targets stay in view.
- **Follow-up:** a speed ramp (+55% by the end of a stage), a loop-the-loop stunt (🔄 / L), and more realistic flight: spring-damped bank, yaw into turns, rotor downwash spray, vibration and a speed-driven FOV.
- **New worlds, stages 4–7:** a snowy Himalaya canyon, the Egyptian Nile with camel caravans, Amazon jungle ruins and the Canadian Arctic, built from the user's concept art (`ref/user-ref-*.webp`).
  A fresh critic said NO at first: turquoise sea everywhere erased the sense of place. The fix added sand, snow and jungle ground, so each world's water becomes a river; warmed the desert light; guaranteed an early jungle ruin; and made the people waiting on the ice bigger.
  The autopilot finishes all 7 stages with no errors. Snapshots are in `tests/rounds/worlds-s*.jpg`.
- **Hits, hangar and visuals:**
  - **Hits:** the hitbox now matches the visible airframe, and every obstacle hit costs exactly one heart (a second crash straight after also counts). The loop no longer protects you.
  - **Hangar:** paint the helicopter (body colour, stripe style and colour, 2–5 blades, blade-tip colour). The choice is saved.
  - **Visuals:** the helicopter casts a real-time shadow, the sky has cumulus clouds, and particles are soft sprites (smoke plumes, spray, snow, flares). Fires glow, the rotor blades are fainter in flight, speed lines are subtler, and the camera sits a little further back.
  - A blind A/B critic preferred the new build in 4/4 pairs.
  - The service worker cache is bumped to v3.
- Snapshots of rounds r1, r8 and r9 (JPEG) are in `games/sky-rescue/tests/rounds/`.

## How to run the gauntlet for a game
```
python3 -m http.server 8080 &                          # from repo root
node games/<name>/tests/sim.js                         # economy
NODE_PATH=$(npm root -g) node games/<name>/tests/e2e.js # Playwright, needs server on :8080
node scripts/validate-countries-data.js --levels
```
