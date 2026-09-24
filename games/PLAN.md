# Plan — Wealth Games for Kids

The rationale behind each rule is in [RESEARCH.md](RESEARCH.md). Judgement calls are logged in [DECISIONS.md](DECISIONS.md),
and live status is in [PROGRESS.md](PROGRESS.md).

## Branch & folder layout

| Branch | Contents |
|---|---|
| `games/foundation` | `games/index.html` (hub), `games/*.md` docs, and a link from the geo-kids home screen |
| `game/pirate-trader` | `games/pirate-trader/` |
| `game/merchant-caravan` | `games/merchant-caravan/` |
| `game/lemonade-empire` | `games/lemonade-empire/` |
| `game/island-shop` | `games/island-shop/` |
| `game/kids-market` | `games/kids-market/` |

Every branch starts from `main`, and every PR can be merged independently. Each game folder is self-contained:

```
games/<name>/
  index.html            markup + screens
  style.css             game-specific styles (on top of engine.css)
  logic.js              PURE game rules, no DOM (UMD: browser global + Node require)
  ui.js                 DOM rendering + input, calls logic.js
  manifest.webmanifest  PWA manifest
  icon.svg              app icon
  sw.js                 cache-first service worker (versioned cache)
  engine/engine.css     shared tokens, layout, buttons, modal, toast, fx
  engine/engine.js      shared runtime: i18n, safe storage, sound, fx, rng, format, PWA
  tests/sim.js          economy gauntlet (Node): 1,000 playthroughs
  tests/e2e.js          Playwright gauntlet (Chromium): mobile + desktop
  tests/screens/        screenshots produced by e2e.js
```

The only shared dependency outside the folder is the read-only `../../geo-kids/js/countries-data.js`,
which is already on `main`.

## Shared engine (`engine/`), copied into each game

- **i18n:** `GE.lang` is read from `localStorage["geo-lang"]`. `GE.t(key)` does dictionary lookup with `{var}`
  interpolation. `GE.setLang()` flips `dir`/`lang` and re-renders.
- **store:** `GE.load(key, fallback)` and `GE.save(key, obj)` wrap every read and write in try/catch.
  If storage throws, the game keeps running in memory and shows a small "progress won't be saved" note once.
- **sound:** WebAudio synth sounds: `coin`, `buy`, `sell` (pitch rises on streak), `tap`, `event`, `whoops`
  (soft), `win` (arpeggio), and `sail`. It unlocks on the first gesture. Mute is shared with geo-kids through
  `geo-sound-muted`.
- **fx:**
  - `GE.coinBurst(fromEl, toEl, n)` flies coins with transform-only motion and pools particles (max 12).
  - `GE.float(el, text, kind)` shows a floating +/− number.
  - `GE.flash(el, kind)` briefly flashes an element.
  - `GE.toast(msg)` shows a short message.
  - `GE.countUp(el, from, to)` animates a number.
  - `GE.confetti()` celebrates.
  - All of these respect `prefers-reduced-motion`.
- **rng:** `GE.rng(seed)` is mulberry32. `logic.js` receives the rng from the caller, so sims are deterministic.
- **format:** `GE.money(n)` gives `🪙 1,234`, with `Intl.NumberFormat` using the current locale.
- **pwa:** `GE.registerSW()` does nothing on `file://`.
- **modal:** `GE.modal({title, body, actions})` builds an accessible dialog with focus management, and
  every button in it is at least 48px.

## Pure logic contract (every game)

`logic.js` exports `newGame(seed)`, `actions(state)` (the list of currently legal actions),
`apply(state, action, rng)` (which returns `{state, events}`), `netWorth(state)`, `milestone(state)`
and `TIME` (estimated real seconds per action, used for pacing). The UI and the sims both drive the game
through this same API. That means the sims test the real rules, not a copy of them.

## Gauntlet (a game ships only when every item passes)

1. **Fun:** the core loop is clear within 30s. There are milestones, a win screen, and free play afterwards.
2. **Economy sim (`tests/sim.js`)** runs 1,000 seeded playthroughs, split into 500 random players and
   500 heuristic "sensible kid" players. It asserts:
   - **No money exploit:** every state has sell < buy for the same good in the same place, and
     money never grows by more than a bounded amount per action.
   - **No dead end:** every visited state has at least one legal action that eventually increases money.
     The always-available free-income action makes this hold.
   - **Pacing:** the heuristic player reaches the first big milestone in 10–20 simulated minutes (median),
     and random players still make some progress.
3. **Polish:** a cohesive palette, coin bursts, price flashes, idle animations, and WebAudio sound with a mute button.
4. **Playwright (`tests/e2e.js`)** runs in an iPhone-13-sized viewport with touch enabled, and on desktop:
   - it plays the core loop, asserts money changes correctly, reloads and checks the save,
     and checks there are no console errors and no horizontal overflow;
   - it takes screenshots that get reviewed by eye.
5. `node scripts/validate-countries-data.js --levels` passes.
6. Adversarial self-review of the diff.

## Games

### 1. Pirate Trader 🏴‍☠️ (`game/pirate-trader`)
- **Loop:** at port, buy cargo → choose a destination on the world map → voyage (a sailing animation with a
  random event) → sell.
- **Ports:** 12 real harbour cities linked to country codes (London, Lisbon, Amsterdam, Alexandria,
  Cape Town, Mumbai, Jakarta, Guangzhou, Nagasaki, Sydney, Rio de Janeiro, Kingston). The Asian and
  Oceania ports unlock by buying Navigator Charts.
- **Goods:** Tea 🍵, Spices 🌶️, Silk 🧵, Sugar 🍬, Cocoa 🍫, Coffee ☕, Gems 💎.
  - Each port *makes* 1–2 goods (≈0.6× base) and *wants* 1–2 (≈1.6× base).
  - Daily prices follow a mean-reverting random walk (±12%).
  - Sell price is 85% of buy price. Price impact is ±3% per unit, and it recovers over days.
- **Voyage:** days = great-circle distance ÷ speed. Supplies cost `days × dailyCost` and are paid when
  leaving port (sink).
- **Events (kid-friendly):**
  - Storm: lose some cargo; a stronger hull reduces the loss.
  - Pirates: flee (chance depends on sails), fight (chance depends on cannons; winning gives loot, losing
    costs some coins), or pay a toll.
  - Treasure island: gain coins.
  - Dolphins: shows a fact about the destination country.
- **Upgrades (sinks, ×1.6 per level):** Hold +10, Sails +speed, Cannons, Hull, and Navigator Charts (unlock regions).
- **Fallback:** 🎣 Go fishing gives +6–12 coins with no cost, always available at port.
- **Geography:** on arrival you meet the harbour master (flag, country, capital fact). An optional
  "Which country is this port in?" question gives +bonus coins.
- **Milestones:**
  - 🪙500 Deckhand → Captain
  - 🪙2,000 Merchant Captain (first big milestone, target 10–20 min)
  - 🪙5,000 Admiral
  - 🪙10,000 Legendary Captain (win screen, then free play)

### 2. Merchant Caravan 🐫 (`game/merchant-caravan`)
- **Loop:** at a city, buy goods → pick a road on the Silk Road route map → travel (a desert event) → sell.
- **Cities:** Xi'an, Kashgar, Samarkand, Merv, Isfahan, Baghdad, Damascus, Constantinople, Venice, Cairo, Delhi.
  They are connected by a route **graph**, and some roads are locked behind a one-time permit fee.
- **Different from Pirate Trader:**
  - **Camels** are both your capacity and your upkeep. Each camel carries 10 and eats food every day.
  - **Market memory** is strong. Selling a lot of one good depresses its price for many days, so you have
    to rotate goods and routes.
  - **Contracts:** each city posts one delivery request ("bring 8 🧵 to Venice within 20 days") with a bonus.
  - **Guards:** hire them to reduce bandit risk. They cost wages per trip.
- **Fallback:** 🧺 Help at the bazaar gives +coins, always available.
- **Milestones:** 🪙800, 🪙3,000 (first big milestone), 🪙8,000, and 🪙15,000 Master of the Silk Road (win).

### 3. Lemonade Empire 🍋 (`game/lemonade-empire`)
- **Idle/tycoon.** Start with one stand in Tel Aviv, and tap "Squeeze & Sell!" to serve customers.
- **Price lesson:** a price slider controls demand, where customers = base × weather × f(price) and
  revenue = price × customers, so the kid discovers the sweet spot. A live "customers/min" and
  "coins/min" readout teaches it.
- **Weather:** each city has a climate. The weather changes every in-game day (☀️ ×1.4, ⛅ ×1.0, 🌧️ ×0.5).
- **Generators:** open stands in world cities (8 cities, cost ×2.3 each). Hire helpers so stands sell
  automatically; costs grow ×1.15 per helper. Upgrades include recipe quality, a bigger jug, and a sign.
- **Offline earnings:** from automated stands only, capped at 2 hours, and shown in a "while you were away" modal.
- **Milestones:** 🪙1,000, 🪙10,000 (first big milestone), 🪙100,000, and 🪙1,000,000 Lemonade Tycoon (win).
- **No dead end:** tapping to sell always works. The lemons are free, but the quality recipe costs money.

### 4. Island Shop 🏝️ (`game/island-shop`)
- **Loop:** morning → a ship from a real country docks with 3–4 goods at wholesale prices; buy stock.
  Day → customers walk in wanting specific items, each with a max price in mind; you set a price tag
  (cheap / fair / pricey) for each item. Evening → takings, rent, and spoilage.
- **Customers:** tourist (souvenirs 🗿, postcards), sailor (rope 🪢, fish 🐟), kid (candy 🍭, toys 🪁),
  and chef (spices, fruit).
- **Sinks:** rent is a small daily charge that grows with shop size. Fresh goods spoil after 2 days (a fridge
  upgrade fixes this). Upgrades: shelves (more item types), fridge, sign (more customers), and bigger shop.
- **Fallback:** 🧹 Beach cleanup gives +coins. Rent is never charged below 🪙0.
- **Milestones:** 🪙600, 🪙2,500 (first big milestone), 🪙6,000, and 🪙12,000 Island Tycoon (win).

### 5. Kids Market 📈 (stretch, `game/kids-market`)
- Five pretend companies: Banana Boat Co. 🍌, Robo Toys 🤖, Frosty Ice Cream 🍦, Star Rockets 🚀, and Pizza Planet 🍕.
- **Daily news** moves prices: "Heatwave! Ice cream sales up!" Prices follow a random walk with company
  drift, never falling below 🪙1.
- **Sinks:** a 2% trade fee, so there's no buy-sell churn exploit. Allowance: +🪙20 every 5 days (fallback source).
- **Lessons:** diversification (a "basket" badge for holding 4+ companies), and a patience bonus for holding
  through a dip.
- **Milestones:** 🪙500 portfolio, 🪙1,500 (first big milestone), 🪙4,000, and 🪙8,000 Market Wizard (win).

## Order of work
foundation docs + hub → Pirate Trader → Merchant Caravan → Lemonade Empire → Island Shop → Kids Market.
Each game goes through the full gauntlet before the next one starts.
