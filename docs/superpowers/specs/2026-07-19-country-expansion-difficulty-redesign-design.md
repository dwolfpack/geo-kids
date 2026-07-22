# Country Expansion & Difficulty Redesign

## Problem

The geo-kids app currently ships 100 countries with a 5-level difficulty system
(`LEVELS` in `geo-kids/index.html`) that is ranked purely by population and
sized 30/30/30/5/5. Two problems with this:

1. **Population doesn't track what's actually hard for a kid.** Countries
   with iconic, easily-recognized flags (e.g. Switzerland) can land in a
   harder tier than countries with far less familiar flags (e.g. Bangladesh,
   Myanmar) purely because of population size.
2. **Continent representation is skewed.** Of the 100 countries, only 10 are
   African (real world: ~54) and only 4 are Oceanian (real world: ~14). Asia
   and Europe are over-represented (34 and 31 respectively). This limits how
   often kids see Africa/Oceania in the `continents` quiz and in the flags
   pool generally.

## Goals

- Expand the country roster from 100 to all ~195 UN-recognized sovereign
  countries, each with the full existing bilingual (Hebrew/English) schema.
- Re-rank difficulty by kid-facing recognizability instead of population.
- Split levels evenly (39 countries per level) instead of front-loading
  levels 1-3.
- Keep the app's existing architecture and mechanics otherwise unchanged.

## Non-goals

- Per-game-type difficulty (e.g. flags ranked differently from capitals).
  The single recognizability ranking continues to drive all three quiz types
  (flags/capitals/continents), same as today.
- Changing the memory game, which already samples 8 random countries from
  the full pool regardless of difficulty — no change needed there.
- Adding non-sovereign territories (Hong Kong, Puerto Rico, Greenland, etc.)
  — scope is the ~195 sovereign states only.

## Design

### A. Country dataset — 100 → ~195

Every UN-recognized sovereign country gets the existing per-country schema,
matching the current 100 entries in both Hebrew and English:

```js
{ code, name: {he, en}, capital: {he, en}, continent: {he, en},
  lat, lon, pop: {he, en}, lang: {he, en}, landmark: {he, en}, fact: {he, en} }
```

The 95 new countries need real capitals, coordinates, and population
figures, plus an original kid-friendly landmark (with emoji) and fun fact,
matching the tone of the existing 100 entries (e.g. "Lego was invented in
Denmark!"). This is the largest chunk of work in this project — content
generation for ~95 countries × 8 fields × 2 languages.

Expanding to the full sovereign-state list also resolves the continent
skew: real-world Africa (~54) and Oceania (~14) become properly
represented instead of 10 and 4.

### B. Data file split

`COUNTRIES` and `CONTINENTS` move out of the inline `<script>` block in
`geo-kids/index.html` into a new `geo-kids/js/countries-data.js`, loaded via:

```html
<script src="js/countries-data.js"></script>
```

placed before the inline game-logic `<script>` block, following the same
pattern already used for `explorer.js`, `worldmap.js`, `sound.js`,
`profiles.js`, `records.js`. The inline script continues to reference the
global `COUNTRIES` / `CONTINENTS` exactly as it does today — this is a pure
file-location change, no logic changes.

### C. Difficulty levels — recognizability-ranked, evenly split

- Keep 5 levels. With ~195 countries, each level gets **39 countries**
  (195 ÷ 5), replacing the current 30/30/30/5/5 split.
- Replace population as the sort key with a **kid-recognizability ranking**:
  countries ordered by how likely a Hebrew-speaking child is to recognize
  the country/flag — weighing global cultural prominence, flag
  distinctiveness, and geographic/media familiarity. Most-recognizable
  countries go in Level 1 ("Easy"), least-recognizable in Level 5
  ("Expert").
- `poolForLevel()` keeps its current **cumulative** behavior — selecting
  Level 3 still includes Levels 1 and 2's countries too. Only the ranking
  and level sizes change; the pooling mechanic is untouched.
- The same `LEVELS` array (with `codes` per level) continues to drive all
  three quiz types (`flags`, `capitals`, `continents`) via `GAME_DEFS`, same
  as today — no architectural change there.

### D. Explicitly unchanged

- Memory game (`startMemory()`) — already samples 8 random countries from
  the whole `COUNTRIES` pool; benefits from more variety with no code
  change.
- Quiz UI/mechanics, explorer/records/profile screens, level
  labels/emoji/colors (`levelEasy` ... `levelExpert`, `lvl-1` ... `lvl-5`
  CSS classes).
- `poolForLevel()`'s cumulative-inclusion mechanic.

## Open questions for the implementation plan

- How the ~95 new countries' content (capital, landmark, fact) gets
  generated and reviewed for accuracy and kid-appropriateness before
  merging — this is the single largest effort in this project and should
  be broken into manageable batches in the implementation plan.
- Exact recognizability ranking methodology/criteria to apply consistently
  across all 195 countries (to be defined and shown for review before
  large-scale re-tiering).
