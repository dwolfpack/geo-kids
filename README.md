# geo-kids

Browser games for kids, in Hebrew (RTL) with English. No ads, purchases, tracking or network calls.
Everything is static HTML/JS and deploys to GitHub Pages from `main`.

**Play:** https://dwolfpack.github.io/geo-kids/

## What's here

| Path | Game | What it teaches |
|---|---|---|
| [`geo-kids/`](geo-kids/) | 🌍 מסע סביב העולם (Around the World) | 195 countries: capitals, continents, flags, landmarks |
| [`games/`](games/) | 💰 Trading games hub | Links to the games below |
| [`games/pirate-trader/`](games/pirate-trader/) | 🏴‍☠️ Pirate Trader | Buy low, sell high; world ports and capitals |
| [`games/merchant-caravan/`](games/merchant-caravan/) | 🐫 Merchant Caravan | Route planning, upkeep, contracts |
| [`games/lemonade-empire/`](games/lemonade-empire/) | 🍋 Lemonade Empire | Pricing and demand, profit per unit, compounding |
| [`games/island-shop/`](games/island-shop/) | 🏝️ Island Shop | Willingness to pay, stock, rent, spoilage |
| [`games/kids-market/`](games/kids-market/) | 📈 Kids Market | Diversifying, fees, news, patience, dividends |
| [`games/sky-rescue/`](games/sky-rescue/) | 🚁 Sky Rescue | 3D helicopter game (three.js) across 7 real-world places |

The root `index.html` redirects to `geo-kids/`.

## Run locally

```sh
python3 -m http.server 8080
# open http://localhost:8080/
```

## Tests

Start the server above first. The e2e tests use Playwright with the preinstalled Chromium.

```sh
node scripts/validate-countries-data.js --levels          # geo-kids country data
node games/<game>/tests/sim.js                            # economy sim, 1,000 playthroughs (trading games)
NODE_PATH=$(npm root -g) node games/<game>/tests/e2e.js   # browser gauntlet
NODE_PATH=$(npm root -g) node games/sky-rescue/tests/levels.js
```

## Docs

- [`games/PLAN.md`](games/PLAN.md), [`games/RESEARCH.md`](games/RESEARCH.md), [`games/DECISIONS.md`](games/DECISIONS.md): how the trading games were designed
- [`games/PROGRESS.md`](games/PROGRESS.md): build log, including the Sky Rescue critic rounds
- [`docs/superpowers/`](docs/superpowers/): spec and plan for the 195-country expansion
