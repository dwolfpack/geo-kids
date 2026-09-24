# Decisions log

These are the judgement calls made without asking, following the rule "pick the safest and simplest option for kids".

| # | Decision | Why |
|---|---|---|
| 1 | Each game carries its own copy of the engine (`games/<name>/engine/`). | Every game PR merges independently, in any order. Duplication is small, around 15 KB. |
| 2 | The docs and the hub live under `games/` instead of the repo root. | Keeps the root clean, and GitHub Pages serves `/games/` as the hub URL. |
| 3 | Games reuse `../../geo-kids/js/countries-data.js` read-only. | Real geography for free. The file already exists on `main`, and the validator keeps passing. |
| 4 | Language and mute preferences use the same localStorage keys as geo-kids (`geo-lang`, `geo-sound-muted`). | A child sets them once for the whole site. |
| 5 | No Google Fonts in the games; they use a system font stack with Rubik/Heebo if already installed. | Works fully offline as a PWA, with no third-party requests (COPPA-safe). |
| 6 | Country flags are drawn as emoji from ISO codes, not flagcdn images. | Works offline and makes no network calls. On Windows they fall back to letters, which is acceptable. |
| 7 | Game rules are pure `logic.js` modules shared by the UI and the Node sims. | The economy gauntlet then tests the real game, not a model of it. |
| 8 | Pirate events are non-violent. You can flee, "cannonball splash" contest, or pay a toll. Losing costs coins and never ends the game. | Suitable for ages 7–12, and mistakes should never feel like failure. |
| 9 | Pacing uses a time model: each action has an estimated real-seconds cost (`TIME` in logic.js), and the sims add those up. | We can't have real kids play-test, so this is a transparent, tunable proxy. |
| 10 | Playwright uses the globally installed `playwright` package with `/opt/pw-browsers`. No `package.json` is added. | Keeps the repo build-free. The tests run with `NODE_PATH=$(npm root -g) node games/<name>/tests/e2e.js`. |
| 11 | "First big milestone" means the second milestone tier in each game. | The first tier is a quick win (about 2 minutes), and the second is the 10–20 minute goal. |
| 12 | Losses are shown in amber, never red. The soft "whoops" sound is used instead of a buzzer. | Follows the kids UX research (RESEARCH.md §5). |
