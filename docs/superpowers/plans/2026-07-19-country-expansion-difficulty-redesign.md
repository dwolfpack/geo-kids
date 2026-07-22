# Country Expansion & Difficulty Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand geo-kids' country roster from 100 to ~194 UN-recognized sovereign states, move that data into its own file, and re-tier the 5 difficulty levels around kid-recognizability (39/39/39/39/38) instead of population (30/30/30/5/5).

**Architecture:** `COUNTRIES`/`CONTINENTS` move from an inline `<script>` in `geo-kids/index.html` into `geo-kids/js/countries-data.js`. A new Node validation script (`scripts/validate-countries-data.js`, no dependencies — uses only `fs`/`path`/`vm`) checks data integrity after every content-adding task. Country content is authored in continent-sized batches. The final task rewrites `LEVELS` in `index.html` using a recognizability ranking.

**Tech Stack:** Vanilla JS/HTML/CSS (no build step), Node.js (v24+, already installed) for the validation script only.

## Global Constraints

- Every `COUNTRIES` entry keeps the existing schema exactly: `{ code, name:{he,en}, capital:{he,en}, continent:{he,en}, lat, lon, pop:{he,en}, lang:{he,en}, landmark:{he,en}, fact:{he,en} }`.
- `code` is the lowercase ISO 3166-1 alpha-2 code, matching `flagUrl`/`flagUrlSmall` (`https://flagcdn.com/w320/${code}.png`) — this determines which flag image renders, so it must be correct.
- Hebrew fields are not literal translations of the English text — `landmark`/`fact` are original kid-friendly copy in Hebrew, matching the warm, simple tone of the existing 100 entries (e.g. `"בלגו הומצאה בדנמרק!"`-style: short, upbeat, one concrete fact, ends with an exclamation mark or emoji where natural). Country/capital names use standard Hebrew geographic naming (as used on Hebrew Wikipedia).
- `pop` values are approximate, formatted like the existing data: Hebrew `"כ-X מיליון"` / `"כ-X אלף"`, English `"~X million"` / `"~X thousand"`.
- No new external dependencies. No build tooling introduced.
- After every content task, run `node scripts/validate-countries-data.js` and confirm it prints `PASS`.

---

## File Structure

- **Create:** `geo-kids/js/countries-data.js` — holds `COUNTRIES` and `CONTINENTS` (moved from `index.html`), plus a Node-compatible export at the bottom.
- **Create:** `scripts/validate-countries-data.js` — structural validator (schema completeness, unique codes) always; level-coverage validator (used only in the final task) checked via a `--levels` flag.
- **Modify:** `geo-kids/index.html` — remove the inline `COUNTRIES`/`CONTINENTS` array, add a `<script src="js/countries-data.js">` tag before the existing inline `<script>` block, and (in the final task) replace the `LEVELS` array.

---

### Task 1: Extract COUNTRIES/CONTINENTS into their own file

**Files:**
- Create: `geo-kids/js/countries-data.js`
- Modify: `geo-kids/index.html:522-627` (remove `const COUNTRIES = [...]` and `const CONTINENTS = [...]`), and the `<head>`/script-include area (add the new `<script>` tag)

**Interfaces:**
- Produces: global `COUNTRIES` (array of country objects) and `CONTINENTS` (array of `{he,en}` objects), available to every other inline script in `index.html`, identical in shape/values to what's there today.

- [ ] **Step 1: Create `geo-kids/js/countries-data.js` with the current data**

Copy the existing `const COUNTRIES = [ ... ];` (currently `index.html:522-623`) and `const CONTINENTS = [ ... ];` (currently `index.html:624-627`) verbatim into the new file, then append a Node-compatible export guard:

```js
// Country and continent data shared by all geo-kids games. Loaded as a
// plain <script> in index.html (defines globals COUNTRIES/CONTINENTS),
// and also requireable from Node for the data-validation script.
const COUNTRIES = [
  // ...exact array contents copied from the current index.html...
];
const CONTINENTS = [
  {he:"אסיה",en:"Asia"}, {he:"אירופה",en:"Europe"}, {he:"אפריקה",en:"Africa"},
  {he:"אמריקה הצפונית",en:"North America"}, {he:"אמריקה הדרומית",en:"South America"}, {he:"אוקיאניה",en:"Oceania"},
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { COUNTRIES, CONTINENTS };
}
```

- [ ] **Step 2: Remove the arrays from `index.html` and load the new file**

In `geo-kids/index.html`, delete the `const COUNTRIES = [...]` and `const CONTINENTS = [...]` block (lines 522-627 in the current file) from the inline `<script>`. Add, immediately before the inline `<script>` tag that now starts with `const flagUrl = ...`:

```html
<script src="js/countries-data.js"></script>
```

- [ ] **Step 3: Verify the file is syntactically valid and the page still works**

Run: `node -c geo-kids/js/countries-data.js`
Expected: no output (silent success = valid syntax)

Run: `grep -c "const COUNTRIES" geo-kids/index.html`
Expected: `0`

Start the app (`python -m http.server 3700 --directory geo-kids` or the `geo-kids` launch config) and open it in a browser. Play one round of the flags quiz to confirm countries/flags still render.

- [ ] **Step 4: Commit**

```bash
git add geo-kids/js/countries-data.js geo-kids/index.html
git commit -m "refactor: move COUNTRIES/CONTINENTS data into js/countries-data.js"
```

---

### Task 2: Add the data validation script

**Files:**
- Create: `scripts/validate-countries-data.js`

**Interfaces:**
- Consumes: `geo-kids/js/countries-data.js` (via `require`, using the `module.exports` guard added in Task 1), `geo-kids/index.html` (via regex-extracting the `const LEVELS = [...]` block, only when run with `--levels`).
- Produces: a CLI that exits `0` and prints `PASS` on success, or exits `1` and prints one `FAIL: ...` line per problem found.

- [ ] **Step 1: Write the validator**

```js
#!/usr/bin/env node
// Validates geo-kids/js/countries-data.js (schema, uniqueness) and,
// with --levels, cross-checks index.html's LEVELS array against it.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const REQUIRED_FIELDS = ["name", "capital", "continent", "pop", "lang", "landmark", "fact"];

function loadCountriesData() {
  const file = path.join(ROOT, "geo-kids/js/countries-data.js");
  return require(file);
}

function loadLevels() {
  const file = path.join(ROOT, "geo-kids/index.html");
  const html = fs.readFileSync(file, "utf8");
  const match = html.match(/const LEVELS = (\[[\s\S]*?\]);/);
  if (!match) throw new Error("LEVELS array not found in geo-kids/index.html");
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(`this.LEVELS = ${match[1]};`, sandbox);
  return sandbox.LEVELS;
}

function validateCountries(countries) {
  const errors = [];
  if (!Array.isArray(countries) || countries.length === 0) {
    errors.push("COUNTRIES is missing or empty");
    return errors;
  }
  const seenCodes = new Set();
  countries.forEach((c, i) => {
    if (!c.code || typeof c.code !== "string" || c.code !== c.code.toLowerCase()) {
      errors.push(`entry ${i}: missing/invalid lowercase "code"`);
    } else if (seenCodes.has(c.code)) {
      errors.push(`duplicate code "${c.code}"`);
    } else {
      seenCodes.add(c.code);
    }
    REQUIRED_FIELDS.forEach(field => {
      const v = c[field];
      if (!v || typeof v.he !== "string" || !v.he || typeof v.en !== "string" || !v.en) {
        errors.push(`entry ${c.code || i}: field "${field}" missing he/en text`);
      }
    });
    if (typeof c.lat !== "number" || typeof c.lon !== "number") {
      errors.push(`entry ${c.code || i}: lat/lon must be numbers`);
    }
  });
  return errors;
}

function validateLevels(levels, countries) {
  const errors = [];
  const countryCodes = new Set(countries.map(c => c.code));
  const seenInLevels = new Set();
  levels.forEach(level => {
    level.codes.forEach(code => {
      if (seenInLevels.has(code)) errors.push(`code "${code}" appears in more than one level`);
      seenInLevels.add(code);
      if (!countryCodes.has(code)) errors.push(`level ${level.key}: code "${code}" not found in COUNTRIES`);
    });
  });
  countryCodes.forEach(code => {
    if (!seenInLevels.has(code)) errors.push(`COUNTRIES code "${code}" is not assigned to any level`);
  });
  return errors;
}

function main() {
  const checkLevels = process.argv.includes("--levels");
  const { COUNTRIES } = loadCountriesData();
  let errors = validateCountries(COUNTRIES);

  if (checkLevels) {
    const LEVELS = loadLevels();
    errors = errors.concat(validateLevels(LEVELS, COUNTRIES));
  }

  if (errors.length > 0) {
    errors.forEach(e => console.error(`FAIL: ${e}`));
    console.error(`\n${errors.length} problem(s) found across ${COUNTRIES.length} countries.`);
    process.exit(1);
  }
  console.log(`PASS: ${COUNTRIES.length} countries valid${checkLevels ? ", LEVELS coverage valid" : ""}.`);
}

main();
```

- [ ] **Step 2: Run it against the current (Task 1) baseline**

Run: `node scripts/validate-countries-data.js --levels`
Expected: `PASS: 100 countries valid, LEVELS coverage valid.`

(This passes today because the existing `LEVELS` already covers all 100 countries — it's a real regression check, not a no-op.)

- [ ] **Step 3: Commit**

```bash
git add scripts/validate-countries-data.js
git commit -m "test: add countries-data validation script"
```

---

### Task 3: Add Africa batch 1 — North & West Africa (22 countries)

**Files:**
- Modify: `geo-kids/js/countries-data.js` (append entries to `COUNTRIES`)

**Interfaces:**
- Consumes: schema from Task 1; validator from Task 2.
- Produces: 22 new `COUNTRIES` entries (codes below), bringing the running total to 122.

Add one entry per row below (code / English name / capital / approx lat,lon / approx population / main language). Write full `he`/`en` for every field, including an original Hebrew `landmark`/`fact` (not a translation) in the tone of the worked example.

| code | name (en) | capital (en) | lat,lon | pop | lang (en) |
|---|---|---|---|---|---|
| sd | Sudan | Khartoum | 15.5, 32.5 | ~48 million | Arabic |
| ss | South Sudan | Juba | 4.85, 31.6 | ~11 million | English |
| td | Chad | N'Djamena | 12.1, 15.05 | ~18 million | French and Arabic |
| ne | Niger | Niamey | 13.5, 2.1 | ~27 million | French |
| ml | Mali | Bamako | 12.65, -8.0 | ~23 million | French |
| mr | Mauritania | Nouakchott | 18.08, -15.98 | ~4.9 million | Arabic |
| sn | Senegal | Dakar | 14.72, -17.47 | ~18 million | French |
| gm | Gambia | Banjul | 13.45, -16.58 | ~2.7 million | English |
| gw | Guinea-Bissau | Bissau | 11.86, -15.6 | ~2.1 million | Portuguese |
| gn | Guinea | Conakry | 9.51, -13.71 | ~14 million | French |
| sl | Sierra Leone | Freetown | 8.48, -13.23 | ~8.6 million | English |
| lr | Liberia | Monrovia | 6.3, -10.8 | ~5.4 million | English |
| ci | Ivory Coast | Yamoussoukro | 6.83, -5.29 | ~29 million | French |
| bf | Burkina Faso | Ouagadougou | 12.37, -1.52 | ~23 million | French |
| tg | Togo | Lomé | 6.13, 1.22 | ~8.9 million | French |
| bj | Benin | Porto-Novo | 6.5, 2.6 | ~13 million | French |
| cm | Cameroon | Yaoundé | 3.87, 11.52 | ~28 million | French and English |
| cf | Central African Republic | Bangui | 4.36, 18.55 | ~5.6 million | French and Sango |
| gq | Equatorial Guinea | Malabo | 3.75, 8.78 | ~1.7 million | Spanish |
| ga | Gabon | Libreville | 0.39, 9.45 | ~2.4 million | French |
| cv | Cape Verde | Praia | 14.93, -23.51 | ~600 thousand | Portuguese |
| st | São Tomé and Príncipe | São Tomé | 0.34, 6.73 | ~230 thousand | Portuguese |

Worked example (Sudan) — follow this exact shape and tone for the other 21:

```js
{ code:"sd", name:{he:"סודן",en:"Sudan"}, capital:{he:"חרטום",en:"Khartoum"}, continent:{he:"אפריקה",en:"Africa"}, lat:15.5, lon:32.5, pop:{he:"כ-48 מיליון",en:"~48 million"}, lang:{he:"ערבית",en:"Arabic"}, landmark:{he:"מפגש הנילים 🌊",en:"The meeting of the Niles 🌊"}, fact:{he:"בחרטום נפגשים הנילוס הכחול והנילוס הלבן והופכים לנהר הנילוס הגדול!",en:"In Khartoum, the Blue Nile and White Nile meet and become the great Nile River!"} },
```

- [ ] **Step 1: Author all 22 entries** and append them to `COUNTRIES` in `geo-kids/js/countries-data.js` (before the closing `];`), each tagged `continent:{he:"אפריקה",en:"Africa"}`.

- [ ] **Step 2: Validate**

Run: `node scripts/validate-countries-data.js`
Expected: `PASS: 122 countries valid.`

- [ ] **Step 3: Commit**

```bash
git add geo-kids/js/countries-data.js
git commit -m "content: add North & West Africa countries (22)"
```

---

### Task 4: Add Africa batch 2 — Central, East & Southern Africa (22 countries)

**Files:**
- Modify: `geo-kids/js/countries-data.js`

**Interfaces:**
- Consumes/Produces: same as Task 3. Running total after this task: 144.

| code | name (en) | capital (en) | lat,lon | pop | lang (en) |
|---|---|---|---|---|---|
| cg | Republic of the Congo | Brazzaville | -4.27, 15.28 | ~6 million | French |
| cd | DR Congo | Kinshasa | -4.32, 15.31 | ~102 million | French |
| ao | Angola | Luanda | -8.84, 13.23 | ~36 million | Portuguese |
| zm | Zambia | Lusaka | -15.39, 28.32 | ~20 million | English |
| mw | Malawi | Lilongwe | -13.96, 33.79 | ~21 million | English and Chichewa |
| mz | Mozambique | Maputo | -25.97, 32.58 | ~33 million | Portuguese |
| zw | Zimbabwe | Harare | -17.83, 31.05 | ~16 million | English |
| bw | Botswana | Gaborone | -24.63, 25.9 | ~2.5 million | English and Setswana |
| na | Namibia | Windhoek | -22.56, 17.08 | ~2.6 million | English |
| sz | Eswatini | Mbabane | -26.32, 31.13 | ~1.2 million | English and Swati |
| ls | Lesotho | Maseru | -29.31, 27.48 | ~2.3 million | Sesotho and English |
| mg | Madagascar | Antananarivo | -18.88, 47.5 | ~30 million | Malagasy and French |
| km | Comoros | Moroni | -11.7, 43.26 | ~850 thousand | Comorian |
| mu | Mauritius | Port Louis | -20.16, 57.5 | ~1.3 million | English |
| sc | Seychelles | Victoria | -4.62, 55.45 | ~100 thousand | Creole |
| dj | Djibouti | Djibouti City | 11.59, 43.15 | ~1.1 million | French and Arabic |
| er | Eritrea | Asmara | 15.32, 38.93 | ~3.7 million | Tigrinya |
| so | Somalia | Mogadishu | 2.04, 45.34 | ~18 million | Somali |
| rw | Rwanda | Kigali | -1.94, 30.06 | ~14 million | Kinyarwanda |
| bi | Burundi | Gitega | -3.43, 29.93 | ~13 million | Kirundi and French |
| ug | Uganda | Kampala | 0.35, 32.58 | ~48 million | English |
| tz | Tanzania | Dodoma | -6.16, 35.75 | ~67 million | Swahili |

Worked example (Rwanda) — same shape:

```js
{ code:"rw", name:{he:"רואנדה",en:"Rwanda"}, capital:{he:"קיגali",en:"Kigali"}, continent:{he:"אפריקה",en:"Africa"}, lat:-1.94, lon:30.06, pop:{he:"כ-14 מיליון",en:"~14 million"}, lang:{he:"קיניארואנדית",en:"Kinyarwanda"}, landmark:{he:"גורילות הרים 🦍",en:"Mountain gorillas 🦍"}, fact:{he:"ברואנדה חיים חלק מהגורילות ההרריות הנדירות האחרונות בעולם!",en:"Rwanda is home to some of the last mountain gorillas left in the world!"} },
```

(Fix any Hebrew transliteration typos when authoring — e.g. "קיגali" above is illustrative only; write it correctly as "קיגali" → "קיגאלי".)

- [ ] **Step 1: Author all 22 entries**, `continent:{he:"אפריקה",en:"Africa"}`, append to `COUNTRIES`.
- [ ] **Step 2: Validate** — Run: `node scripts/validate-countries-data.js` — Expected: `PASS: 144 countries valid.`
- [ ] **Step 3: Commit**

```bash
git add geo-kids/js/countries-data.js
git commit -m "content: add Central, East & Southern Africa countries (22)"
```

---

### Task 5: Add Oceania & South America completion (12 countries)

**Files:**
- Modify: `geo-kids/js/countries-data.js`

**Interfaces:**
- Consumes/Produces: same as Task 3. Running total after this task: 156.

| code | name (en) | capital (en) | lat,lon | pop | lang (en) | continent |
|---|---|---|---|---|---|---|
| sb | Solomon Islands | Honiara | -9.43, 159.95 | ~740 thousand | English | Oceania |
| vu | Vanuatu | Port Vila | -17.73, 168.32 | ~330 thousand | Bislama | Oceania |
| ws | Samoa | Apia | -13.83, -171.76 | ~220 thousand | Samoan | Oceania |
| to | Tonga | Nukuʻalofa | -21.14, -175.2 | ~106 thousand | Tongan | Oceania |
| ki | Kiribati | Tarawa | 1.33, 172.98 | ~130 thousand | Gilbertese | Oceania |
| fm | Micronesia | Palikir | 6.92, 158.16 | ~113 thousand | English | Oceania |
| mh | Marshall Islands | Majuro | 7.1, 171.38 | ~42 thousand | Marshallese | Oceania |
| pw | Palau | Ngerulmud | 7.5, 134.62 | ~18 thousand | Palauan | Oceania |
| nr | Nauru | Yaren | -0.55, 166.92 | ~12 thousand | Nauruan | Oceania |
| tv | Tuvalu | Funafuti | -8.52, 179.2 | ~11 thousand | Tuvaluan | Oceania |
| gy | Guyana | Georgetown | 6.8, -58.16 | ~810 thousand | English | South America |
| sr | Suriname | Paramaribo | 5.87, -55.17 | ~610 thousand | Dutch | South America |

Worked example (Tonga):

```js
{ code:"to", name:{he:"טונגה",en:"Tonga"}, capital:{he:"נוקואלופה",en:"Nukuʻalofa"}, continent:{he:"אוקיאניה",en:"Oceania"}, lat:-21.14, lon:-175.2, pop:{he:"כ-106 אלף",en:"~106 thousand"}, lang:{he:"טונגית",en:"Tongan"}, landmark:{he:"ארמון המלוכה 👑",en:"The Royal Palace 👑"}, fact:{he:"טונגה היא המדינה היחידה באוקיאניה שמעולם לא נכבשה על ידי מעצמה זרה!",en:"Tonga is the only country in Oceania that was never colonized by a foreign power!"} },
```

- [ ] **Step 1: Author all 12 entries**, using the correct `continent` per the table, append to `COUNTRIES`.
- [ ] **Step 2: Validate** — Run: `node scripts/validate-countries-data.js` — Expected: `PASS: 156 countries valid.`
- [ ] **Step 3: Commit**

```bash
git add geo-kids/js/countries-data.js
git commit -m "content: add remaining Oceania and South America countries (12)"
```

---

### Task 6: Add remaining Asia countries (13)

**Files:**
- Modify: `geo-kids/js/countries-data.js`

**Interfaces:**
- Consumes/Produces: same as Task 3. Running total after this task: 169.

| code | name (en) | capital (en) | lat,lon | pop | lang (en) |
|---|---|---|---|---|---|
| af | Afghanistan | Kabul | 34.53, 69.17 | ~40 million | Pashto and Dari |
| bh | Bahrain | Manama | 26.23, 50.59 | ~1.5 million | Arabic |
| bt | Bhutan | Thimphu | 27.47, 89.64 | ~780 thousand | Dzongkha |
| bn | Brunei | Bandar Seri Begawan | 4.94, 114.94 | ~450 thousand | Malay |
| mv | Maldives | Malé | 4.17, 73.51 | ~520 thousand | Dhivehi |
| kp | North Korea | Pyongyang | 39.02, 125.75 | ~26 million | Korean |
| kg | Kyrgyzstan | Bishkek | 42.87, 74.59 | ~7 million | Kyrgyz |
| ps | Palestine | Ramallah | 31.9, 35.2 | ~5.3 million | Arabic |
| sy | Syria | Damascus | 33.51, 36.28 | ~23 million | Arabic |
| tj | Tajikistan | Dushanbe | 38.56, 68.79 | ~10 million | Tajik |
| tl | Timor-Leste | Dili | -8.55, 125.57 | ~1.4 million | Tetum and Portuguese |
| tm | Turkmenistan | Ashgabat | 37.95, 58.38 | ~6.4 million | Turkmen |
| ye | Yemen | Sana'a | 15.37, 44.19 | ~34 million | Arabic |

Worked example (Maldives):

```js
{ code:"mv", name:{he:"האיים המלדיביים",en:"Maldives"}, capital:{he:"מאלה",en:"Malé"}, continent:{he:"אסיה",en:"Asia"}, lat:4.17, lon:73.51, pop:{he:"כ-520 אלף",en:"~520 thousand"}, lang:{he:"דיווהי",en:"Dhivehi"}, landmark:{he:"בונגלוז מעל המים 🏝️",en:"Overwater bungalows 🏝️"}, fact:{he:"האיים המלדיביים מורכבים מכ-1,200 איים קטנים ואלמוגים!",en:"The Maldives is made up of around 1,200 small coral islands!"} },
```

- [ ] **Step 1: Author all 13 entries**, `continent:{he:"אסיה",en:"Asia"}`, append to `COUNTRIES`.
- [ ] **Step 2: Validate** — Run: `node scripts/validate-countries-data.js` — Expected: `PASS: 169 countries valid.`
- [ ] **Step 3: Commit**

```bash
git add geo-kids/js/countries-data.js
git commit -m "content: add remaining Asian countries (13)"
```

---

### Task 7: Add remaining Europe countries (13)

**Files:**
- Modify: `geo-kids/js/countries-data.js`

**Interfaces:**
- Consumes/Produces: same as Task 3. Running total after this task: 182.

| code | name (en) | capital (en) | lat,lon | pop | lang (en) |
|---|---|---|---|---|---|
| cy | Cyprus | Nicosia | 35.17, 33.36 | ~1.3 million | Greek and Turkish |
| mt | Malta | Valletta | 35.9, 14.51 | ~530 thousand | Maltese and English |
| lu | Luxembourg | Luxembourg City | 49.61, 6.13 | ~660 thousand | Luxembourgish, French, German |
| ad | Andorra | Andorra la Vella | 42.51, 1.52 | ~80 thousand | Catalan |
| mc | Monaco | Monaco | 43.73, 7.42 | ~39 thousand | French |
| sm | San Marino | San Marino | 43.94, 12.45 | ~34 thousand | Italian |
| li | Liechtenstein | Vaduz | 47.14, 9.52 | ~40 thousand | German |
| md | Moldova | Chișinău | 47.01, 28.86 | ~2.5 million | Romanian |
| by | Belarus | Minsk | 53.9, 27.57 | ~9.2 million | Belarusian and Russian |
| mk | North Macedonia | Skopje | 42.0, 21.43 | ~1.8 million | Macedonian |
| me | Montenegro | Podgorica | 42.44, 19.26 | ~620 thousand | Montenegrin |
| ba | Bosnia and Herzegovina | Sarajevo | 43.86, 18.41 | ~3.2 million | Bosnian, Croatian, Serbian |
| va | Vatican City | Vatican City | 41.9, 12.45 | ~800 | Italian and Latin |

Worked example (Monaco):

```js
{ code:"mc", name:{he:"מונקו",en:"Monaco"}, capital:{he:"מונקו",en:"Monaco"}, continent:{he:"אירופה",en:"Europe"}, lat:43.73, lon:7.42, pop:{he:"כ-39 אלף",en:"~39 thousand"}, lang:{he:"צרפתית",en:"French"}, landmark:{he:"מסלול הפורמולה 1 🏎️",en:"The Formula 1 circuit 🏎️"}, fact:{he:"מונקו היא המדינה השנייה הכי קטנה בעולם, אחרי הוותיקן!",en:"Monaco is the second-smallest country in the world, after Vatican City!"} },
```

- [ ] **Step 1: Author all 13 entries**, `continent:{he:"אירופה",en:"Europe"}`, append to `COUNTRIES`.
- [ ] **Step 2: Validate** — Run: `node scripts/validate-countries-data.js` — Expected: `PASS: 182 countries valid.`
- [ ] **Step 3: Commit**

```bash
git add geo-kids/js/countries-data.js
git commit -m "content: add remaining European countries (13)"
```

---

### Task 8: Add remaining North America countries (12)

**Files:**
- Modify: `geo-kids/js/countries-data.js`

**Interfaces:**
- Consumes/Produces: same as Task 3. Running total after this task: 194.

| code | name (en) | capital (en) | lat,lon | pop | lang (en) |
|---|---|---|---|---|---|
| bz | Belize | Belmopan | 17.25, -88.77 | ~410 thousand | English |
| ni | Nicaragua | Managua | 12.13, -86.25 | ~6.9 million | Spanish |
| sv | El Salvador | San Salvador | 13.69, -89.19 | ~6.3 million | Spanish |
| bs | Bahamas | Nassau | 25.06, -77.35 | ~410 thousand | English |
| bb | Barbados | Bridgetown | 13.1, -59.62 | ~280 thousand | English |
| gd | Grenada | St. George's | 12.05, -61.75 | ~125 thousand | English |
| lc | Saint Lucia | Castries | 14.0, -60.98 | ~180 thousand | English |
| vc | Saint Vincent and the Grenadines | Kingstown | 13.16, -61.22 | ~100 thousand | English |
| ag | Antigua and Barbuda | St. John's | 17.12, -61.85 | ~93 thousand | English |
| kn | Saint Kitts and Nevis | Basseterre | 17.3, -62.72 | ~48 thousand | English |
| dm | Dominica | Roseau | 15.3, -61.39 | ~72 thousand | English |
| ht | Haiti | Port-au-Prince | 18.53, -72.34 | ~11.5 million | French and Haitian Creole |

Worked example (Haiti):

```js
{ code:"ht", name:{he:"האיטי",en:"Haiti"}, capital:{he:"פורט-או-פראנס",en:"Port-au-Prince"}, continent:{he:"אמריקה הצפונית",en:"North America"}, lat:18.53, lon:-72.34, pop:{he:"כ-11.5 מיליון",en:"~11.5 million"}, lang:{he:"צרפתית וקריאולית האיטית",en:"French and Haitian Creole"}, landmark:{he:"מצודת לה סיטדל 🏰",en:"The Citadelle Laferrière 🏰"}, fact:{he:"האיטי הייתה המדינה השחורה העצמאית הראשונה בעולם!",en:"Haiti was the first Black-led independent republic in the world!"} },
```

- [ ] **Step 1: Author all 12 entries**, `continent:{he:"אמריקה הצפונית",en:"North America"}`, append to `COUNTRIES`.
- [ ] **Step 2: Validate** — Run: `node scripts/validate-countries-data.js` — Expected: `PASS: 194 countries valid.`
- [ ] **Step 3: Commit**

```bash
git add geo-kids/js/countries-data.js
git commit -m "content: add remaining North American countries (12)"
```

---

### Task 9: Re-tier LEVELS by recognizability (39/39/39/39/38)

**Files:**
- Modify: `geo-kids/index.html` (replace the `LEVELS` array and its comment)

**Interfaces:**
- Consumes: all 194 `COUNTRIES` codes from Tasks 1-8.
- Produces: new `LEVELS` array read by `renderDifficultyOptions()` and `poolForLevel()` (unchanged functions — only the data changes).

**Ranking rubric** (apply to every country not already anchored below): rank by how likely a Hebrew-speaking child is to recognize the country's name or flag, weighing (a) global cultural/media prominence, (b) flag distinctiveness (bold, simple, unique symbols score higher than similar-looking tricolors), and (c) geographic/travel familiarity for an Israeli family. Most recognizable → Level 1, least → Level 5.

**Tier 1 anchor — Easy (39, highest confidence, globally iconic):**
`us, cn, gb, fr, de, it, es, jp, ru, br, in, eg, il, ca, au, mx, kr, gr, nl, ch, se, tr, sa, ae, th, za, ar, pt, nz, dk, no, fi, be, ua, pl, at, ie, id, cu`

**Tier 5 anchor — Expert (38, highest confidence, most obscure/smallest):**
`tv, nr, pw, mh, fm, ki, gd, lc, vc, ag, kn, dm, va, sm, li, ad, mc, st, gq, gw, km, sc, sz, ls, gm, bj, tg, bf, cf, mr, ne, td, ss, bt, bn, mv, tl, tm`

**Tiers 2-4 (Medium/Hard/Very Hard, 39 each):** every other code from `COUNTRIES` — apply the rubric above to sort them, then split into three consecutive groups of 39. As a starting point (adjust by rubric where two countries seem swapped): well-known-but-not-top-of-mind countries (Vietnam, Philippines, Nigeria, Kenya, Morocco, Peru, Colombia, Iceland, Jordan, Czechia, Hungary, Romania, Bulgaria, Croatia, Serbia, Slovakia, Slovenia, Malaysia, Singapore, Bangladesh, Pakistan, Iraq, Lebanon, Qatar, Kuwait, Oman, Algeria, Tunisia, Libya, Uruguay, Paraguay, Bolivia, Ecuador, Venezuela, Panama, Costa Rica, Guatemala, Honduras, Dominican Republic) go in Level 2; moderately-known ones (Sri Lanka, Nepal, Myanmar, Cambodia, Laos, Mongolia, Kazakhstan, Uzbekistan, Georgia, Armenia, Azerbaijan, Jamaica, Trinidad and Tobago, Fiji, Papua New Guinea, Ghana, Ethiopia, Algeria-adjacent African states, etc.) in Level 3; the rest in Level 4.

- [ ] **Step 1: Produce the final ordered list**

Write a scratch list of all 194 codes ordered from most to least recognizable (Tier 1 anchor first, then the rubric-sorted middle 117, then the Tier 5 anchor last). Slice it into 5 groups: `[0:39]`, `[39:78]`, `[78:117]`, `[117:156]`, `[156:194]`.

- [ ] **Step 2: Replace `LEVELS` in `geo-kids/index.html`**

Replace the existing `LEVELS` block and its preceding comment with:

```js
/* Levels are ranked by kid-recognizability (global fame + flag
   distinctiveness + geographic familiarity for a Hebrew-speaking child),
   not population. Split evenly across the ~194-country roster: 39/39/39/39/38. */
const LEVELS = [
  { key:1, labelKey:"levelEasy",     emoji:"🟢", cls:"lvl-1", codes:[/* 39 codes from Step 1, slice [0:39] */] },
  { key:2, labelKey:"levelMedium",   emoji:"🟡", cls:"lvl-2", codes:[/* 39 codes, slice [39:78] */] },
  { key:3, labelKey:"levelHard",     emoji:"🟠", cls:"lvl-3", codes:[/* 39 codes, slice [78:117] */] },
  { key:4, labelKey:"levelVeryHard", emoji:"🔴", cls:"lvl-4", codes:[/* 39 codes, slice [117:156] */] },
  { key:5, labelKey:"levelExpert",   emoji:"🟣", cls:"lvl-5", codes:[/* 38 codes, slice [156:194] */] },
];
```

(`poolForLevel()` immediately below stays unchanged — it already computes the cumulative pool from `LEVELS[i].codes`.)

- [ ] **Step 3: Validate strictly**

Run: `node scripts/validate-countries-data.js --levels`
Expected: `PASS: 194 countries valid, LEVELS coverage valid.`

If it fails with `FAIL: code "X" appears in more than one level` or `FAIL: COUNTRIES code "X" is not assigned to any level`, fix the affected `LEVELS[i].codes` array (cross-reference against the full code list from Tasks 3-8) and re-run until it passes.

- [ ] **Step 4: Commit**

```bash
git add geo-kids/index.html
git commit -m "feat: re-tier difficulty levels by recognizability instead of population"
```

---

### Task 10: Final integration check

**Files:** none (verification only)

- [ ] **Step 1: Run the full validator**

Run: `node scripts/validate-countries-data.js --levels`
Expected: `PASS: 194 countries valid, LEVELS coverage valid.`

- [ ] **Step 2: Browser smoke test**

Start the app (`python -m http.server 3700 --directory geo-kids`), open it, and confirm:
- The difficulty screen for any game shows 5 buttons with cumulative counts 39 / 78 / 117 / 156 / 194.
- Selecting Level 5 in the flags quiz occasionally surfaces a newly-added country (e.g. Tuvalu, Nauru, Vatican City).
- The Explorer screen can find a newly-added country by typing part of its name (e.g. "רואנדה" / "Rwanda") and its full panel (capital, continent, population, language, landmark, fact, mini-map) renders correctly.
- The `continents` quiz now offers Africa/Oceania answers noticeably more often than before (spot-check a few rounds).
- The memory game still deals 8 random flag/name pairs without errors.

- [ ] **Step 3: Confirm no leftover references to the old data location**

Run: `grep -rn "const COUNTRIES" geo-kids/index.html`
Expected: no matches.

No commit needed for this task — it's verification of the work already committed in Tasks 1-9.
