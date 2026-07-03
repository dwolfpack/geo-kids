# Word Islands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build "Word Islands" — a browser game teaching English vocabulary to Hebrew-speaking kids via a world map of themed islands, flashcards, three games, stars, and a creature collection, per `docs/superpowers/specs/2026-07-03-word-islands-design.md`.

**Architecture:** Vite + React SPA in a new `word-islands/` directory, no backend. Pure-logic modules (`progress.js`, `gameLogic.js`) are unit-tested with Vitest; UI components are verified in the browser. Content is data-driven JSON. State persists to localStorage per kid profile.

**Tech Stack:** Vite 6, React 18, Vitest 3, Web Speech API (browser built-in), plain CSS.

**Conventions:** All paths below are relative to the repo root `C:\Users\drorw\Documents\claude_projects`. All commands run from `word-islands/` unless stated otherwise. Commit after every task.

---

### Task 1: Project scaffold

**Files:**
- Create: `word-islands/package.json`
- Create: `word-islands/vite.config.js`
- Create: `word-islands/index.html`
- Create: `word-islands/.gitignore`
- Create: `word-islands/src/main.jsx`
- Create: `word-islands/src/App.jsx` (placeholder, replaced in Task 7)
- Create: `word-islands/src/styles.css`

- [ ] **Step 1: Create `word-islands/package.json`**

```json
{
  "name": "word-islands",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^6.0.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create `word-islands/vite.config.js`**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

- [ ] **Step 3: Create `word-islands/.gitignore`**

```
node_modules/
dist/
```

- [ ] **Step 4: Create `word-islands/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Word Islands 🏝️</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `word-islands/src/main.jsx`**

```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 6: Create placeholder `word-islands/src/App.jsx`**

```jsx
export default function App() {
  return <h1>🏝️ Word Islands</h1>;
}
```

- [ ] **Step 7: Create `word-islands/src/styles.css`**

```css
* { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #e0f4ff;
  --card: #ffffff;
  --accent: #ff8a3d;
  --accent-dark: #e06a1f;
  --green: #4caf50;
  --red: #ef5350;
  --text: #29405b;
  --locked: #b9c7d4;
  --radius: 18px;
}

body {
  font-family: 'Segoe UI', 'Arial Rounded MT Bold', Arial, sans-serif;
  background: linear-gradient(180deg, #cdeeff 0%, #e0f4ff 60%, #d8f5e2 100%);
  color: var(--text);
  min-height: 100vh;
}

.app { max-width: 860px; margin: 0 auto; padding: 12px 16px 40px; }

.app-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0 16px;
}
.app-header h1 { font-size: 1.6rem; }
.header-right { display: flex; gap: 8px; }

button {
  font-family: inherit; font-size: 1rem; color: var(--text);
  border: none; border-radius: var(--radius); cursor: pointer;
  background: var(--card); box-shadow: 0 3px 0 rgba(0,0,0,0.12);
  padding: 10px 16px;
}
button:active { transform: translateY(2px); box-shadow: none; }
button:disabled { cursor: default; opacity: 0.7; }

.chip { border-radius: 999px; padding: 8px 14px; }

.big-btn {
  background: var(--accent); color: white; font-size: 1.3rem;
  padding: 14px 32px; box-shadow: 0 4px 0 var(--accent-dark);
}

.instruction { text-align: center; font-size: 1.15rem; margin: 10px 0 18px; }
.progress-text { text-align: center; margin-top: 14px; font-size: 1.1rem; }

/* Profiles */
.profiles { display: flex; flex-wrap: wrap; gap: 14px; justify-content: center; margin: 20px 0; }
.profile-btn { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 18px 26px; font-size: 1.1rem; }
.profile-btn .avatar { font-size: 3rem; }
.profile-form { display: flex; flex-direction: column; align-items: center; gap: 16px; margin-top: 16px; }
.profile-form input {
  font-size: 1.3rem; padding: 10px 16px; border-radius: var(--radius);
  border: 3px solid var(--accent); text-align: center; width: 240px;
}
.avatar-row, .path-row { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
.avatar-choice { font-size: 2.2rem; padding: 8px 12px; }
.avatar-choice.selected, .path-choice.selected { background: var(--accent); color: white; }

/* World map */
.map-top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
.islands { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-top: 20px; }
.island-tile {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 22px 10px; font-size: 1.1rem;
}
.island-tile .island-icon { font-size: 3.2rem; }
.island-tile.locked { background: var(--locked); }
.island-stars { letter-spacing: 3px; }

/* Flashcards */
.flashcards { display: flex; flex-direction: column; align-items: center; }
.card {
  background: var(--card); border-radius: 24px; box-shadow: 0 6px 0 rgba(0,0,0,0.1);
  width: min(340px, 90vw); padding: 30px 20px; text-align: center; cursor: pointer;
  position: relative;
}
.card-emoji { font-size: 6rem; }
.card-word { font-size: 2.2rem; font-weight: bold; margin-top: 10px; direction: ltr; }
.card-translation { font-size: 1.4rem; color: #6b7f95; margin-top: 6px; }
.audio-btn { font-size: 1.4rem; border-radius: 999px; padding: 8px 12px; margin-top: 10px; }
.nav { display: flex; align-items: center; gap: 18px; margin-top: 22px; font-size: 1.2rem; }

/* Games shared */
.game { display: flex; flex-direction: column; align-items: center; }
.prompt { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.prompt-word { font-size: 2.4rem; font-weight: bold; direction: ltr; }
.prompt-emoji { font-size: 5rem; }
.choices { display: grid; grid-template-columns: repeat(2, minmax(120px, 1fr)); gap: 14px; }
.choice { font-size: 1.4rem; padding: 20px; }
.choice-emoji { font-size: 3.4rem; }
.choice.wrong { background: var(--red); animation: shake 0.4s; }
.feedback { margin-top: 12px; font-size: 1.2rem; }
@keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }

/* Memory */
.memory-grid { display: grid; grid-template-columns: repeat(4, minmax(70px, 100px)); gap: 10px; }
.memory-card { font-size: 2rem; aspect-ratio: 1; padding: 4px; background: var(--accent); color: white; }
.memory-card.up { background: var(--card); color: var(--text); }
.memory-card.matched { background: var(--green); color: white; }
.memory-word { font-size: 1rem; font-weight: bold; direction: ltr; }
.memory-emoji { font-size: 2.2rem; }

/* Quiz */
.timer-bar { width: min(340px, 90vw); height: 12px; background: #ffffff; border-radius: 6px; margin-bottom: 16px; overflow: hidden; }
.timer-fill { height: 100%; background: var(--accent); transition: width 1s linear; }
.choice.right { background: var(--green); color: white; }

/* Reward */
.reward { text-align: center; padding-top: 30px; }
.reward-stars { font-size: 3rem; letter-spacing: 8px; }
.reward-creature { font-size: 7rem; margin: 18px 0; animation: pop 0.6s; }
@keyframes pop { 0% { transform: scale(0); } 70% { transform: scale(1.2); } 100% { transform: scale(1); } }
.reward .big-btn { margin-top: 20px; }

/* Sticker book */
.sticker-book { text-align: center; }
.sticker-book h2 { margin: 14px 0 20px; }
.stickers { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; }
.sticker { font-size: 4rem; background: var(--card); border-radius: var(--radius); padding: 18px; box-shadow: 0 4px 0 rgba(0,0,0,0.1); }
.sticker.locked { filter: grayscale(1); opacity: 0.5; }

/* Island screen */
.island-header { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
```

- [ ] **Step 8: Install dependencies and verify dev server**

Run from `word-islands/`: `npm install`
Then: `npm run dev` (or via preview tools) — open the served URL.
Expected: page renders "🏝️ Word Islands" with no console errors. Stop the server.

- [ ] **Step 9: Commit**

```bash
git add word-islands/
git commit -m "feat(word-islands): scaffold Vite + React project"
```

---

### Task 2: Vocabulary content (data-driven JSON)

**Files:**
- Create: `word-islands/src/content/islands57.json`
- Create: `word-islands/src/content/islands810.json`
- Create: `word-islands/src/content/manifest.js`

Each island: `id`, `icon` (map tile emoji), `name` (EN/HE), `creature` (collectible reward emoji, unique per island), `words` array of `{ english, hebrew, emoji }`. 8 words per island for ages 5–7, 10 for ages 8–10. Adding/editing content later requires only JSON edits.

- [ ] **Step 1: Create `word-islands/src/content/islands57.json`**

```json
[
  {
    "id": "animals",
    "icon": "🐾",
    "name": { "en": "Animal Island", "he": "אי החיות" },
    "creature": "🦁",
    "words": [
      { "english": "dog", "hebrew": "כלב", "emoji": "🐶" },
      { "english": "cat", "hebrew": "חתול", "emoji": "🐱" },
      { "english": "fish", "hebrew": "דג", "emoji": "🐟" },
      { "english": "bird", "hebrew": "ציפור", "emoji": "🐦" },
      { "english": "horse", "hebrew": "סוס", "emoji": "🐴" },
      { "english": "cow", "hebrew": "פרה", "emoji": "🐄" },
      { "english": "duck", "hebrew": "ברווז", "emoji": "🦆" },
      { "english": "rabbit", "hebrew": "ארנב", "emoji": "🐰" }
    ]
  },
  {
    "id": "colors",
    "icon": "🎨",
    "name": { "en": "Color Island", "he": "אי הצבעים" },
    "creature": "🦜",
    "words": [
      { "english": "red", "hebrew": "אדום", "emoji": "🔴" },
      { "english": "blue", "hebrew": "כחול", "emoji": "🔵" },
      { "english": "green", "hebrew": "ירוק", "emoji": "🟢" },
      { "english": "yellow", "hebrew": "צהוב", "emoji": "🟡" },
      { "english": "orange", "hebrew": "כתום", "emoji": "🟠" },
      { "english": "purple", "hebrew": "סגול", "emoji": "🟣" },
      { "english": "black", "hebrew": "שחור", "emoji": "⚫" },
      { "english": "white", "hebrew": "לבן", "emoji": "⚪" }
    ]
  },
  {
    "id": "food",
    "icon": "🍎",
    "name": { "en": "Food Island", "he": "אי האוכל" },
    "creature": "🐸",
    "words": [
      { "english": "apple", "hebrew": "תפוח", "emoji": "🍎" },
      { "english": "banana", "hebrew": "בננה", "emoji": "🍌" },
      { "english": "bread", "hebrew": "לחם", "emoji": "🍞" },
      { "english": "milk", "hebrew": "חלב", "emoji": "🥛" },
      { "english": "egg", "hebrew": "ביצה", "emoji": "🥚" },
      { "english": "cheese", "hebrew": "גבינה", "emoji": "🧀" },
      { "english": "pizza", "hebrew": "פיצה", "emoji": "🍕" },
      { "english": "cake", "hebrew": "עוגה", "emoji": "🍰" }
    ]
  },
  {
    "id": "home",
    "icon": "🏠",
    "name": { "en": "Home Island", "he": "אי הבית" },
    "creature": "🐢",
    "words": [
      { "english": "bed", "hebrew": "מיטה", "emoji": "🛏️" },
      { "english": "chair", "hebrew": "כיסא", "emoji": "🪑" },
      { "english": "sofa", "hebrew": "ספה", "emoji": "🛋️" },
      { "english": "door", "hebrew": "דלת", "emoji": "🚪" },
      { "english": "window", "hebrew": "חלון", "emoji": "🪟" },
      { "english": "key", "hebrew": "מפתח", "emoji": "🔑" },
      { "english": "lamp", "hebrew": "מנורה", "emoji": "💡" },
      { "english": "clock", "hebrew": "שעון", "emoji": "🕐" }
    ]
  },
  {
    "id": "body",
    "icon": "🙂",
    "name": { "en": "Body Island", "he": "אי הגוף" },
    "creature": "🦉",
    "words": [
      { "english": "eye", "hebrew": "עין", "emoji": "👁️" },
      { "english": "ear", "hebrew": "אוזן", "emoji": "👂" },
      { "english": "nose", "hebrew": "אף", "emoji": "👃" },
      { "english": "mouth", "hebrew": "פה", "emoji": "👄" },
      { "english": "hand", "hebrew": "יד", "emoji": "✋" },
      { "english": "foot", "hebrew": "כף רגל", "emoji": "🦶" },
      { "english": "tooth", "hebrew": "שן", "emoji": "🦷" },
      { "english": "tongue", "hebrew": "לשון", "emoji": "👅" }
    ]
  },
  {
    "id": "clothes",
    "icon": "👕",
    "name": { "en": "Clothes Island", "he": "אי הבגדים" },
    "creature": "🐬",
    "words": [
      { "english": "shirt", "hebrew": "חולצה", "emoji": "👕" },
      { "english": "pants", "hebrew": "מכנסיים", "emoji": "👖" },
      { "english": "dress", "hebrew": "שמלה", "emoji": "👗" },
      { "english": "shoes", "hebrew": "נעליים", "emoji": "👟" },
      { "english": "hat", "hebrew": "כובע", "emoji": "🧢" },
      { "english": "socks", "hebrew": "גרביים", "emoji": "🧦" },
      { "english": "coat", "hebrew": "מעיל", "emoji": "🧥" },
      { "english": "scarf", "hebrew": "צעיף", "emoji": "🧣" }
    ]
  }
]
```

- [ ] **Step 2: Create `word-islands/src/content/islands810.json`**

```json
[
  {
    "id": "animals",
    "icon": "🐾",
    "name": { "en": "Animal Island", "he": "אי החיות" },
    "creature": "🐉",
    "words": [
      { "english": "elephant", "hebrew": "פיל", "emoji": "🐘" },
      { "english": "monkey", "hebrew": "קוף", "emoji": "🐵" },
      { "english": "lion", "hebrew": "אריה", "emoji": "🦁" },
      { "english": "tiger", "hebrew": "נמר", "emoji": "🐯" },
      { "english": "bear", "hebrew": "דוב", "emoji": "🐻" },
      { "english": "wolf", "hebrew": "זאב", "emoji": "🐺" },
      { "english": "snake", "hebrew": "נחש", "emoji": "🐍" },
      { "english": "turtle", "hebrew": "צב", "emoji": "🐢" },
      { "english": "penguin", "hebrew": "פינגווין", "emoji": "🐧" },
      { "english": "dolphin", "hebrew": "דולפין", "emoji": "🐬" }
    ]
  },
  {
    "id": "colors",
    "icon": "🎨",
    "name": { "en": "Colors & Shapes Island", "he": "אי הצבעים והצורות" },
    "creature": "🦚",
    "words": [
      { "english": "pink", "hebrew": "ורוד", "emoji": "🩷" },
      { "english": "brown", "hebrew": "חום", "emoji": "🤎" },
      { "english": "gray", "hebrew": "אפור", "emoji": "🩶" },
      { "english": "circle", "hebrew": "עיגול", "emoji": "⭕" },
      { "english": "triangle", "hebrew": "משולש", "emoji": "🔺" },
      { "english": "square", "hebrew": "ריבוע", "emoji": "⬜" },
      { "english": "star", "hebrew": "כוכב", "emoji": "⭐" },
      { "english": "heart", "hebrew": "לב", "emoji": "❤️" },
      { "english": "diamond", "hebrew": "יהלום", "emoji": "💎" },
      { "english": "rainbow", "hebrew": "קשת", "emoji": "🌈" }
    ]
  },
  {
    "id": "food",
    "icon": "🍓",
    "name": { "en": "Food Island", "he": "אי האוכל" },
    "creature": "🦊",
    "words": [
      { "english": "strawberry", "hebrew": "תות", "emoji": "🍓" },
      { "english": "watermelon", "hebrew": "אבטיח", "emoji": "🍉" },
      { "english": "grapes", "hebrew": "ענבים", "emoji": "🍇" },
      { "english": "carrot", "hebrew": "גזר", "emoji": "🥕" },
      { "english": "tomato", "hebrew": "עגבנייה", "emoji": "🍅" },
      { "english": "cucumber", "hebrew": "מלפפון", "emoji": "🥒" },
      { "english": "chicken", "hebrew": "עוף", "emoji": "🍗" },
      { "english": "rice", "hebrew": "אורז", "emoji": "🍚" },
      { "english": "soup", "hebrew": "מרק", "emoji": "🍲" },
      { "english": "ice cream", "hebrew": "גלידה", "emoji": "🍦" }
    ]
  },
  {
    "id": "home",
    "icon": "🏠",
    "name": { "en": "Home Island", "he": "אי הבית" },
    "creature": "🦥",
    "words": [
      { "english": "television", "hebrew": "טלוויזיה", "emoji": "📺" },
      { "english": "phone", "hebrew": "טלפון", "emoji": "📱" },
      { "english": "computer", "hebrew": "מחשב", "emoji": "💻" },
      { "english": "mirror", "hebrew": "מראה", "emoji": "🪞" },
      { "english": "shower", "hebrew": "מקלחת", "emoji": "🚿" },
      { "english": "toilet", "hebrew": "שירותים", "emoji": "🚽" },
      { "english": "teapot", "hebrew": "קומקום", "emoji": "🫖" },
      { "english": "scissors", "hebrew": "מספריים", "emoji": "✂️" },
      { "english": "broom", "hebrew": "מטאטא", "emoji": "🧹" },
      { "english": "basket", "hebrew": "סל", "emoji": "🧺" }
    ]
  },
  {
    "id": "body",
    "icon": "💪",
    "name": { "en": "Body Island", "he": "אי הגוף" },
    "creature": "🦖",
    "words": [
      { "english": "brain", "hebrew": "מוח", "emoji": "🧠" },
      { "english": "bone", "hebrew": "עצם", "emoji": "🦴" },
      { "english": "muscle", "hebrew": "שריר", "emoji": "💪" },
      { "english": "lungs", "hebrew": "ריאות", "emoji": "🫁" },
      { "english": "leg", "hebrew": "רגל", "emoji": "🦵" },
      { "english": "finger", "hebrew": "אצבע", "emoji": "👆" },
      { "english": "blood", "hebrew": "דם", "emoji": "🩸" },
      { "english": "skull", "hebrew": "גולגולת", "emoji": "💀" },
      { "english": "eyes", "hebrew": "עיניים", "emoji": "👀" },
      { "english": "ear", "hebrew": "אוזן", "emoji": "👂" }
    ]
  },
  {
    "id": "clothes",
    "icon": "🎒",
    "name": { "en": "Clothes Island", "he": "אי הבגדים" },
    "creature": "🧜",
    "words": [
      { "english": "gloves", "hebrew": "כפפות", "emoji": "🧤" },
      { "english": "boots", "hebrew": "מגפיים", "emoji": "🥾" },
      { "english": "sandals", "hebrew": "סנדלים", "emoji": "🩴" },
      { "english": "swimsuit", "hebrew": "בגד ים", "emoji": "🩱" },
      { "english": "shorts", "hebrew": "מכנסיים קצרים", "emoji": "🩳" },
      { "english": "crown", "hebrew": "כתר", "emoji": "👑" },
      { "english": "glasses", "hebrew": "משקפיים", "emoji": "👓" },
      { "english": "ring", "hebrew": "טבעת", "emoji": "💍" },
      { "english": "watch", "hebrew": "שעון יד", "emoji": "⌚" },
      { "english": "backpack", "hebrew": "תיק גב", "emoji": "🎒" }
    ]
  }
]
```

- [ ] **Step 3: Create `word-islands/src/content/manifest.js`**

```js
import islands57 from './islands57.json';
import islands810 from './islands810.json';

export const MANIFEST = {
  '5-7': islands57,
  '8-10': islands810,
};

export const PATHS = ['5-7', '8-10'];
```

- [ ] **Step 4: Sanity-check the JSON parses**

Run from `word-islands/`:
```bash
node -e "const a=require('./src/content/islands57.json'),b=require('./src/content/islands810.json'); console.log(a.length, b.length, a.every(i=>i.words.length===8), b.every(i=>i.words.length===10))"
```
Expected output: `6 6 true true`

- [ ] **Step 5: Commit**

```bash
git add word-islands/src/content/
git commit -m "feat(word-islands): add vocabulary content for both age paths"
```

---

### Task 3: Game logic module (TDD)

**Files:**
- Create: `word-islands/src/gameLogic.js`
- Test: `word-islands/src/gameLogic.test.js`

Pure functions, no React, no DOM. All randomness goes through an injectable `rng` parameter (defaults to `Math.random`) so tests are deterministic.

- [ ] **Step 1: Write the failing tests — create `word-islands/src/gameLogic.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { shuffle, makeChoices, makePairs, starsForScore } from './gameLogic.js';

const WORDS = [
  { english: 'dog', hebrew: 'כלב', emoji: '🐶' },
  { english: 'cat', hebrew: 'חתול', emoji: '🐱' },
  { english: 'fish', hebrew: 'דג', emoji: '🐟' },
  { english: 'bird', hebrew: 'ציפור', emoji: '🐦' },
  { english: 'horse', hebrew: 'סוס', emoji: '🐴' },
  { english: 'cow', hebrew: 'פרה', emoji: '🐄' },
  { english: 'duck', hebrew: 'ברווז', emoji: '🦆' },
  { english: 'rabbit', hebrew: 'ארנב', emoji: '🐰' },
];

// Deterministic rng: always returns 0 (Fisher-Yates then always swaps with index 0)
const rng0 = () => 0;

describe('shuffle', () => {
  it('returns a new array with the same items', () => {
    const out = shuffle(WORDS, rng0);
    expect(out).toHaveLength(WORDS.length);
    expect(new Set(out.map((w) => w.english))).toEqual(new Set(WORDS.map((w) => w.english)));
  });

  it('does not mutate the input array', () => {
    const copy = [...WORDS];
    shuffle(WORDS, rng0);
    expect(WORDS).toEqual(copy);
  });
});

describe('makeChoices', () => {
  it('returns the requested number of choices including the correct word', () => {
    const correct = WORDS[2];
    const choices = makeChoices(WORDS, correct, 3, rng0);
    expect(choices).toHaveLength(3);
    expect(choices.some((w) => w.english === correct.english)).toBe(true);
  });

  it('has no duplicate choices', () => {
    const choices = makeChoices(WORDS, WORDS[0], 4, rng0);
    expect(new Set(choices.map((w) => w.english)).size).toBe(4);
  });
});

describe('makePairs', () => {
  it('returns two cards per word with matching wordIds and unique card ids', () => {
    const cards = makePairs(WORDS, 6, 'emoji-emoji', rng0);
    expect(cards).toHaveLength(12);
    expect(new Set(cards.map((c) => c.id)).size).toBe(12);
    const byWord = {};
    for (const c of cards) byWord[c.wordId] = (byWord[c.wordId] || 0) + 1;
    expect(Object.values(byWord)).toEqual([2, 2, 2, 2, 2, 2]);
  });

  it('uses emoji faces on both cards in emoji-emoji mode', () => {
    const cards = makePairs(WORDS, 6, 'emoji-emoji', rng0);
    expect(cards.every((c) => c.face === 'emoji')).toBe(true);
  });

  it('uses one emoji face and one word face per pair in emoji-word mode', () => {
    const cards = makePairs(WORDS, 6, 'emoji-word', rng0);
    const faces = {};
    for (const c of cards) (faces[c.wordId] ||= []).push(c.face);
    for (const pair of Object.values(faces)) {
      expect(pair.sort()).toEqual(['emoji', 'word']);
    }
  });
});

describe('starsForScore', () => {
  it('gives 3 stars for a perfect score', () => {
    expect(starsForScore(8, 8)).toBe(3);
  });
  it('gives 2 stars for 70% or better (but not perfect)', () => {
    expect(starsForScore(7, 10)).toBe(2);
    expect(starsForScore(9, 10)).toBe(2);
  });
  it('gives 1 star below 70%', () => {
    expect(starsForScore(3, 10)).toBe(1);
    expect(starsForScore(0, 10)).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run from `word-islands/`: `npx vitest run src/gameLogic.test.js`
Expected: FAIL — cannot resolve `./gameLogic.js`.

- [ ] **Step 3: Write the implementation — create `word-islands/src/gameLogic.js`**

```js
// Pure game logic — no React, no DOM. rng is injectable for deterministic tests.

export function shuffle(arr, rng = Math.random) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Returns `count` answer options (word objects) including `correct`, shuffled.
export function makeChoices(words, correct, count, rng = Math.random) {
  const others = shuffle(
    words.filter((w) => w.english !== correct.english),
    rng
  ).slice(0, count - 1);
  return shuffle([correct, ...others], rng);
}

// Returns 2 * pairCount memory cards, shuffled.
// mode 'emoji-emoji': both cards show the emoji (ages 5-7).
// mode 'emoji-word': one card shows the emoji, the other the written word (ages 8-10).
export function makePairs(words, pairCount, mode, rng = Math.random) {
  const chosen = shuffle(words, rng).slice(0, pairCount);
  const cards = chosen.flatMap((w) => [
    { id: `${w.english}-a`, wordId: w.english, face: 'emoji', word: w },
    {
      id: `${w.english}-b`,
      wordId: w.english,
      face: mode === 'emoji-word' ? 'word' : 'emoji',
      word: w,
    },
  ]);
  return shuffle(cards, rng);
}

// Quiz score -> stars. Finishing always earns at least 1 star (no dead ends).
export function starsForScore(correct, total) {
  const ratio = total > 0 ? correct / total : 0;
  if (ratio === 1) return 3;
  if (ratio >= 0.7) return 2;
  return 1;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/gameLogic.test.js`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add word-islands/src/gameLogic.js word-islands/src/gameLogic.test.js
git commit -m "feat(word-islands): add pure game logic with tests"
```

---

### Task 4: Progress & persistence module (TDD)

**Files:**
- Create: `word-islands/src/progress.js`
- Test: `word-islands/src/progress.test.js`

Pure logic + localStorage adapter. Storage is injectable so tests use a fake; the app uses the default (`globalThis.localStorage`). All failures fall back to a fresh default state — a kid never sees an error.

- [ ] **Step 1: Write the failing tests — create `word-islands/src/progress.test.js`**

```js
import { describe, it, expect } from 'vitest';
import {
  loadState,
  saveState,
  createProfile,
  recordResult,
  isIslandUnlocked,
} from './progress.js';

function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
  };
}

const ISLANDS = [{ id: 'animals' }, { id: 'colors' }, { id: 'food' }];

describe('loadState', () => {
  it('returns default state when storage is empty', () => {
    const s = loadState(fakeStorage());
    expect(s).toEqual({ profiles: [], activeProfileId: null, uiLang: 'en' });
  });

  it('round-trips through saveState', () => {
    const storage = fakeStorage();
    const s = loadState(storage);
    const { state: withProfile } = createProfile(s, { name: 'Noa', avatar: '🦊', path: '5-7' });
    saveState(withProfile, storage);
    const reloaded = loadState(storage);
    expect(reloaded.profiles).toHaveLength(1);
    expect(reloaded.profiles[0].name).toBe('Noa');
    expect(reloaded.activeProfileId).toBe(reloaded.profiles[0].id);
  });

  it('falls back to default state on corrupt JSON', () => {
    const s = loadState(fakeStorage({ wordIslands: '{not json!!' }));
    expect(s).toEqual({ profiles: [], activeProfileId: null, uiLang: 'en' });
  });

  it('falls back to default state when profiles is not an array', () => {
    const s = loadState(fakeStorage({ wordIslands: '{"profiles": 42}' }));
    expect(s.profiles).toEqual([]);
  });

  it('does not throw when storage itself is unavailable', () => {
    expect(() => loadState(undefined)).not.toThrow();
    expect(loadState(undefined).profiles).toEqual([]);
  });
});

describe('createProfile', () => {
  it('adds a profile with empty progress and makes it active', () => {
    const { state, profile } = createProfile(loadState(fakeStorage()), {
      name: 'Adam',
      avatar: '🐼',
      path: '8-10',
    });
    expect(profile.islands).toEqual({});
    expect(profile.creatures).toEqual([]);
    expect(profile.path).toBe('8-10');
    expect(state.activeProfileId).toBe(profile.id);
  });

  it('gives distinct ids to profiles created back-to-back', () => {
    const a = createProfile(loadState(fakeStorage()), { name: 'A', avatar: '🦊', path: '5-7' });
    const b = createProfile(a.state, { name: 'B', avatar: '🐼', path: '5-7' });
    expect(a.profile.id).not.toBe(b.profile.id);
  });
});

describe('recordResult', () => {
  function stateWithProfile() {
    return createProfile(loadState(fakeStorage()), { name: 'Noa', avatar: '🦊', path: '5-7' });
  }

  it('records stars and awards the creature', () => {
    const { state, profile } = stateWithProfile();
    const next = recordResult(state, profile.id, 'animals', 2, '🦁');
    expect(next.profiles[0].islands.animals.stars).toBe(2);
    expect(next.profiles[0].creatures).toEqual(['🦁']);
  });

  it('keeps the best star count on replay and does not duplicate creatures', () => {
    const { state, profile } = stateWithProfile();
    let next = recordResult(state, profile.id, 'animals', 3, '🦁');
    next = recordResult(next, profile.id, 'animals', 1, '🦁');
    expect(next.profiles[0].islands.animals.stars).toBe(3);
    expect(next.profiles[0].creatures).toEqual(['🦁']);
  });

  it('does not modify other profiles', () => {
    const a = createProfile(loadState(fakeStorage()), { name: 'A', avatar: '🦊', path: '5-7' });
    const b = createProfile(a.state, { name: 'B', avatar: '🐼', path: '5-7' });
    const next = recordResult(b.state, b.profile.id, 'animals', 2, '🦁');
    const profileA = next.profiles.find((p) => p.id === a.profile.id);
    expect(profileA.islands).toEqual({});
  });
});

describe('isIslandUnlocked', () => {
  it('always unlocks the first island', () => {
    const { profile } = createProfile(loadState(fakeStorage()), { name: 'N', avatar: '🦊', path: '5-7' });
    expect(isIslandUnlocked(profile, 0, ISLANDS)).toBe(true);
  });

  it('unlocks the next island when the previous has 2+ stars', () => {
    const { state, profile } = createProfile(loadState(fakeStorage()), { name: 'N', avatar: '🦊', path: '5-7' });
    const next = recordResult(state, profile.id, 'animals', 2, '🦁');
    expect(isIslandUnlocked(next.profiles[0], 1, ISLANDS)).toBe(true);
    expect(isIslandUnlocked(next.profiles[0], 2, ISLANDS)).toBe(false);
  });

  it('keeps the next island locked with fewer than 2 stars', () => {
    const { state, profile } = createProfile(loadState(fakeStorage()), { name: 'N', avatar: '🦊', path: '5-7' });
    const next = recordResult(state, profile.id, 'animals', 1, '🦁');
    expect(isIslandUnlocked(next.profiles[0], 1, ISLANDS)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/progress.test.js`
Expected: FAIL — cannot resolve `./progress.js`.

- [ ] **Step 3: Write the implementation — create `word-islands/src/progress.js`**

```js
// Profile progress + persistence. Storage is injectable for tests;
// the app uses the browser's localStorage by default. Every failure
// falls back to a fresh state — the kid never sees an error.

const STORAGE_KEY = 'wordIslands';

function defaultState() {
  return { profiles: [], activeProfileId: null, uiLang: 'en' };
}

export function loadState(storage = globalThis.localStorage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.profiles)) return defaultState();
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

export function saveState(state, storage = globalThis.localStorage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode / quota errors: play on without persistence.
  }
}

export function createProfile(state, { name, avatar, path }) {
  const id = `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const profile = { id, name, avatar, path, islands: {}, creatures: [] };
  return {
    state: { ...state, profiles: [...state.profiles, profile], activeProfileId: id },
    profile,
  };
}

// Records a quiz result: keeps the best star count, awards the creature once.
export function recordResult(state, profileId, islandId, stars, creature) {
  return {
    ...state,
    profiles: state.profiles.map((p) => {
      if (p.id !== profileId) return p;
      const prev = p.islands[islandId]?.stars || 0;
      const creatures =
        stars >= 1 && !p.creatures.includes(creature) ? [...p.creatures, creature] : p.creatures;
      return {
        ...p,
        islands: { ...p.islands, [islandId]: { stars: Math.max(prev, stars) } },
        creatures,
      };
    }),
  };
}

// Island 0 is always open; each next island needs 2+ stars on the previous one.
export function isIslandUnlocked(profile, index, islands) {
  if (index === 0) return true;
  const prev = islands[index - 1];
  return (profile.islands[prev.id]?.stars || 0) >= 2;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/progress.test.js`
Expected: all tests PASS.

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: gameLogic + progress suites all PASS.

- [ ] **Step 6: Commit**

```bash
git add word-islands/src/progress.js word-islands/src/progress.test.js
git commit -m "feat(word-islands): add profile progress module with tests"
```

---

### Task 5: i18n strings and speech wrapper

**Files:**
- Create: `word-islands/src/i18n.js`
- Create: `word-islands/src/speech.js`
- Test: `word-islands/src/i18n.test.js`

- [ ] **Step 1: Write the failing test — create `word-islands/src/i18n.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { t, STRINGS } from './i18n.js';

describe('i18n', () => {
  it('returns the English string', () => {
    expect(t('en', 'title')).toBe('Word Islands');
  });

  it('returns the Hebrew string', () => {
    expect(t('he', 'title')).toBe('איי המילים');
  });

  it('falls back to English for a missing Hebrew key, and to the key itself if unknown', () => {
    expect(t('he', 'noSuchKey')).toBe('noSuchKey');
  });

  it('has a Hebrew translation for every English key', () => {
    for (const key of Object.keys(STRINGS.en)) {
      expect(STRINGS.he[key], `missing Hebrew for "${key}"`).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/i18n.test.js`
Expected: FAIL — cannot resolve `./i18n.js`.

- [ ] **Step 3: Create `word-islands/src/i18n.js`**

```js
// UI strings in English and Hebrew. English vocabulary words are NEVER
// translated — only instructions and chrome. RTL is handled by dir="rtl" in App.

export const STRINGS = {
  en: {
    title: 'Word Islands',
    chooseProfile: 'Who is playing?',
    newProfile: 'New player',
    yourName: 'Your name',
    pickAvatar: 'Pick your animal',
    pickPath: 'Age group',
    path57: 'Ages 5–7',
    path810: 'Ages 8–10',
    start: "Let's go!",
    back: 'Back',
    backToMap: 'Back to the map',
    chooseIsland: 'Choose an island!',
    stickerBook: 'Sticker book',
    learnInstruction: 'Tap the card to hear the word',
    letsPlay: "Let's play!",
    tapInstruction: 'Tap the right picture!',
    memoryInstruction: 'Find the matching pairs!',
    quizInstruction: 'Quiz time! One try per question',
    tryAgain: 'Try again!',
    greatJob: 'Great job!',
    youEarned: 'You earned a new friend for your sticker book!',
  },
  he: {
    title: 'איי המילים',
    chooseProfile: 'מי משחק?',
    newProfile: 'שחקן חדש',
    yourName: 'השם שלך',
    pickAvatar: 'בחרו חיה',
    pickPath: 'קבוצת גיל',
    path57: 'גילאי 5–7',
    path810: 'גילאי 8–10',
    start: 'יאללה!',
    back: 'חזרה',
    backToMap: 'חזרה למפה',
    chooseIsland: 'בחרו אי!',
    stickerBook: 'אלבום מדבקות',
    learnInstruction: 'לחצו על הכרטיס כדי לשמוע את המילה',
    letsPlay: 'בואו נשחק!',
    tapInstruction: 'לחצו על התמונה הנכונה!',
    memoryInstruction: 'מצאו את הזוגות!',
    quizInstruction: 'חידון! ניסיון אחד לכל שאלה',
    tryAgain: 'נסו שוב!',
    greatJob: 'כל הכבוד!',
    youEarned: 'הרווחתם חבר חדש לאלבום המדבקות!',
  },
};

export function t(lang, key) {
  return STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/i18n.test.js`
Expected: all tests PASS.

- [ ] **Step 5: Create `word-islands/src/speech.js`** (browser-only; verified manually in Task 12)

```js
// Thin wrapper over the Web Speech API. If the browser has no speech
// synthesis or no English voice, isSpeechAvailable() is false and the UI
// hides audio buttons — the game stays fully playable visually.

export function isSpeechAvailable() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speak(text) {
  if (!isSpeechAvailable()) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.85; // slightly slow for learners
  const voice = window.speechSynthesis
    .getVoices()
    .find((v) => v.lang && v.lang.startsWith('en'));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.cancel(); // don't queue overlapping words
  window.speechSynthesis.speak(utterance);
}
```

- [ ] **Step 6: Commit**

```bash
git add word-islands/src/i18n.js word-islands/src/i18n.test.js word-islands/src/speech.js
git commit -m "feat(word-islands): add EN/HE strings and speech wrapper"
```

---

### Task 6: Profile picker component

**Files:**
- Create: `word-islands/src/components/ProfilePicker.jsx`

UI components are verified in the browser (per spec, unit tests cover logic modules only). Full browser verification happens after the App shell exists (Task 7).

- [ ] **Step 1: Create `word-islands/src/components/ProfilePicker.jsx`**

```jsx
import { useState } from 'react';
import { t } from '../i18n.js';

const AVATARS = ['🦊', '🐼', '🐯', '🦄', '🐸', '🐙', '🦋', '🐳'];

export default function ProfilePicker({ profiles, lang, onSelect, onCreate }) {
  const [creating, setCreating] = useState(profiles.length === 0);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [path, setPath] = useState('5-7');

  if (!creating) {
    return (
      <div>
        <h2 className="instruction">{t(lang, 'chooseProfile')}</h2>
        <div className="profiles">
          {profiles.map((p) => (
            <button key={p.id} className="profile-btn" onClick={() => onSelect(p.id)}>
              <span className="avatar">{p.avatar}</span>
              <span>{p.name}</span>
            </button>
          ))}
          <button className="profile-btn" onClick={() => setCreating(true)}>
            <span className="avatar">➕</span>
            <span>{t(lang, 'newProfile')}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-form">
      <h2>{t(lang, 'newProfile')}</h2>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t(lang, 'yourName')}
        maxLength={20}
      />
      <p>{t(lang, 'pickAvatar')}</p>
      <div className="avatar-row">
        {AVATARS.map((a) => (
          <button
            key={a}
            className={`avatar-choice ${a === avatar ? 'selected' : ''}`}
            onClick={() => setAvatar(a)}
          >
            {a}
          </button>
        ))}
      </div>
      <p>{t(lang, 'pickPath')}</p>
      <div className="path-row">
        <button
          className={`path-choice ${path === '5-7' ? 'selected' : ''}`}
          onClick={() => setPath('5-7')}
        >
          {t(lang, 'path57')}
        </button>
        <button
          className={`path-choice ${path === '8-10' ? 'selected' : ''}`}
          onClick={() => setPath('8-10')}
        >
          {t(lang, 'path810')}
        </button>
      </div>
      <button
        className="big-btn"
        disabled={!name.trim()}
        onClick={() => onCreate({ name: name.trim(), avatar, path })}
      >
        {t(lang, 'start')}
      </button>
      {profiles.length > 0 && (
        <button onClick={() => setCreating(false)}>{t(lang, 'back')}</button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add word-islands/src/components/ProfilePicker.jsx
git commit -m "feat(word-islands): add profile picker"
```

---

### Task 7: App shell, world map, and sticker book

**Files:**
- Modify: `word-islands/src/App.jsx` (replace the Task 1 placeholder entirely)
- Create: `word-islands/src/components/WorldMap.jsx`
- Create: `word-islands/src/components/StickerBook.jsx`

Note: `App.jsx` below imports `Island.jsx`, which is created in Task 8. Create a temporary stub so the app runs at the end of this task:

- [ ] **Step 1: Create stub `word-islands/src/components/Island.jsx`** (replaced in Task 8)

```jsx
export default function Island({ island, onExit }) {
  return (
    <div>
      <p>Island: {island.id} (coming soon)</p>
      <button onClick={onExit}>Back</button>
    </div>
  );
}
```

- [ ] **Step 2: Create `word-islands/src/components/WorldMap.jsx`**

```jsx
import { t } from '../i18n.js';
import { isIslandUnlocked } from '../progress.js';

export default function WorldMap({ profile, islands, lang, onEnter, onStickers }) {
  return (
    <div className="world-map">
      <div className="map-top">
        <h2>{t(lang, 'chooseIsland')}</h2>
        <button onClick={onStickers}>
          📖 {t(lang, 'stickerBook')} ({profile.creatures.length}/{islands.length})
        </button>
      </div>
      <div className="islands">
        {islands.map((island, i) => {
          const unlocked = isIslandUnlocked(profile, i, islands);
          const stars = profile.islands[island.id]?.stars || 0;
          return (
            <button
              key={island.id}
              className={`island-tile ${unlocked ? '' : 'locked'}`}
              disabled={!unlocked}
              onClick={() => onEnter(island.id)}
            >
              <span className="island-icon">{unlocked ? island.icon : '🔒'}</span>
              <span className="island-name">{island.name[lang]}</span>
              <span className="island-stars">
                {'⭐'.repeat(stars)}
                {'☆'.repeat(3 - stars)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `word-islands/src/components/StickerBook.jsx`**

```jsx
import { t } from '../i18n.js';

export default function StickerBook({ profile, islands, lang, onBack }) {
  return (
    <div className="sticker-book">
      <button onClick={onBack}>← {t(lang, 'back')}</button>
      <h2>
        📖 {t(lang, 'stickerBook')} — {profile.avatar} {profile.name}
      </h2>
      <div className="stickers">
        {islands.map((island) => {
          const earned = profile.creatures.includes(island.creature);
          return (
            <div key={island.id} className={`sticker ${earned ? '' : 'locked'}`}>
              {earned ? island.creature : '❔'}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Replace `word-islands/src/App.jsx` with the real shell**

```jsx
import { useState } from 'react';
import { loadState, saveState, createProfile, recordResult } from './progress.js';
import { t } from './i18n.js';
import { MANIFEST } from './content/manifest.js';
import ProfilePicker from './components/ProfilePicker.jsx';
import WorldMap from './components/WorldMap.jsx';
import Island from './components/Island.jsx';
import StickerBook from './components/StickerBook.jsx';

export default function App() {
  const [state, setState] = useState(loadState);
  const [screen, setScreen] = useState('profiles'); // profiles | map | island | stickers
  const [islandId, setIslandId] = useState(null);

  const lang = state.uiLang || 'en';
  const update = (next) => {
    saveState(next);
    setState(next);
  };
  const updateFn = (fn) =>
    setState((prev) => {
      const next = fn(prev);
      saveState(next);
      return next;
    });

  const profile = state.profiles.find((p) => p.id === state.activeProfileId) || null;
  const islands = profile ? MANIFEST[profile.path] : [];
  const island = islands.find((i) => i.id === islandId) || null;

  return (
    <div className="app" dir={lang === 'he' ? 'rtl' : 'ltr'}>
      <header className="app-header">
        <h1>🏝️ {t(lang, 'title')}</h1>
        <div className="header-right">
          {profile && screen !== 'profiles' && (
            <button className="chip" onClick={() => setScreen('profiles')}>
              {profile.avatar} {profile.name}
            </button>
          )}
          <button
            className="chip"
            onClick={() => update({ ...state, uiLang: lang === 'en' ? 'he' : 'en' })}
          >
            {lang === 'en' ? 'עברית' : 'English'}
          </button>
        </div>
      </header>
      <main>
        {screen === 'profiles' && (
          <ProfilePicker
            profiles={state.profiles}
            lang={lang}
            onSelect={(id) => {
              update({ ...state, activeProfileId: id });
              setScreen('map');
            }}
            onCreate={(info) => {
              updateFn((prev) => createProfile(prev, info).state);
              setScreen('map');
            }}
          />
        )}
        {screen === 'map' && profile && (
          <WorldMap
            profile={profile}
            islands={islands}
            lang={lang}
            onEnter={(id) => {
              setIslandId(id);
              setScreen('island');
            }}
            onStickers={() => setScreen('stickers')}
          />
        )}
        {screen === 'island' && island && profile && (
          <Island
            island={island}
            path={profile.path}
            lang={lang}
            onComplete={(stars, creature) =>
              updateFn((prev) => recordResult(prev, profile.id, island.id, stars, creature))
            }
            onExit={() => setScreen('map')}
          />
        )}
        {screen === 'stickers' && profile && (
          <StickerBook profile={profile} islands={islands} lang={lang} onBack={() => setScreen('map')} />
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Verify in the browser**

Start the dev server. Verify:
- Profile creation form appears (no profiles yet); create "Test" with any avatar, path 5–7.
- World map shows 6 islands; only the first is unlocked (others show 🔒 and are disabled).
- Sticker book shows 6 ❔ placeholders.
- Language toggle switches all chrome to Hebrew and flips layout to RTL.
- Clicking the first island shows the Task 7 stub with a working Back button.
- No console errors.

- [ ] **Step 6: Commit**

```bash
git add word-islands/src/App.jsx word-islands/src/components/
git commit -m "feat(word-islands): add app shell, world map, and sticker book"
```

---

### Task 8: Island orchestrator and flashcards

**Files:**
- Modify: `word-islands/src/components/Island.jsx` (replace stub entirely)
- Create: `word-islands/src/components/Flashcards.jsx`

`Island` runs the phase sequence learn → tap → memory → quiz → reward. Game components for tap/memory/quiz are created in Tasks 9–11; stub them here so the app keeps running:

- [ ] **Step 1: Create stub game components** (each replaced in its own task)

Create `word-islands/src/components/TapTheRightOne.jsx`:
```jsx
export default function TapTheRightOne({ onDone }) {
  return <button className="big-btn" onClick={onDone}>Tap game (stub) — continue</button>;
}
```

Create `word-islands/src/components/MemoryMatch.jsx`:
```jsx
export default function MemoryMatch({ onDone }) {
  return <button className="big-btn" onClick={onDone}>Memory game (stub) — continue</button>;
}
```

Create `word-islands/src/components/QuickQuiz.jsx`:
```jsx
export default function QuickQuiz({ words, onDone }) {
  return (
    <button className="big-btn" onClick={() => onDone(words.length, words.length)}>
      Quiz (stub) — perfect score
    </button>
  );
}
```

- [ ] **Step 2: Replace `word-islands/src/components/Island.jsx`**

```jsx
import { useState } from 'react';
import { t } from '../i18n.js';
import { starsForScore } from '../gameLogic.js';
import Flashcards from './Flashcards.jsx';
import TapTheRightOne from './TapTheRightOne.jsx';
import MemoryMatch from './MemoryMatch.jsx';
import QuickQuiz from './QuickQuiz.jsx';

export default function Island({ island, path, lang, onComplete, onExit }) {
  const [phase, setPhase] = useState('learn'); // learn | tap | memory | quiz | reward
  const [stars, setStars] = useState(0);
  const young = path === '5-7';

  return (
    <div className="island">
      <div className="island-header">
        <button onClick={onExit}>← {t(lang, 'back')}</button>
        <h2>
          {island.icon} {island.name[lang]}
        </h2>
      </div>

      {phase === 'learn' && (
        <Flashcards words={island.words} lang={lang} onDone={() => setPhase('tap')} />
      )}
      {phase === 'tap' && (
        <TapTheRightOne
          words={island.words}
          lang={lang}
          choiceCount={young ? 3 : 4}
          onDone={() => setPhase('memory')}
        />
      )}
      {phase === 'memory' && (
        <MemoryMatch
          words={island.words}
          lang={lang}
          mode={young ? 'emoji-emoji' : 'emoji-word'}
          onDone={() => setPhase('quiz')}
        />
      )}
      {phase === 'quiz' && (
        <QuickQuiz
          words={island.words}
          lang={lang}
          young={young}
          onDone={(correct, total) => {
            const earned = starsForScore(correct, total);
            setStars(earned);
            onComplete(earned, island.creature);
            setPhase('reward');
          }}
        />
      )}
      {phase === 'reward' && (
        <div className="reward">
          <div className="reward-stars">{'⭐'.repeat(stars)}</div>
          <div className="reward-creature">{island.creature}</div>
          <h2>{t(lang, 'greatJob')}</h2>
          <p>{t(lang, 'youEarned')}</p>
          <button className="big-btn" onClick={onExit}>
            {t(lang, 'backToMap')}
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `word-islands/src/components/Flashcards.jsx`**

```jsx
import { useEffect, useState } from 'react';
import { t } from '../i18n.js';
import { speak, isSpeechAvailable } from '../speech.js';

export default function Flashcards({ words, lang, onDone }) {
  const [index, setIndex] = useState(0);
  const word = words[index];

  useEffect(() => {
    speak(word.english);
  }, [word]);

  return (
    <div className="flashcards">
      <p className="instruction">{t(lang, 'learnInstruction')}</p>
      <div className="card" onClick={() => speak(word.english)}>
        <div className="card-emoji">{word.emoji}</div>
        <div className="card-word">{word.english}</div>
        {lang === 'he' && <div className="card-translation">{word.hebrew}</div>}
        {isSpeechAvailable() && (
          <button
            className="audio-btn"
            onClick={(e) => {
              e.stopPropagation();
              speak(word.english);
            }}
          >
            🔊
          </button>
        )}
      </div>
      <div className="nav">
        <button disabled={index === 0} onClick={() => setIndex(index - 1)}>
          ←
        </button>
        <span>
          {index + 1} / {words.length}
        </span>
        {index < words.length - 1 ? (
          <button onClick={() => setIndex(index + 1)}>→</button>
        ) : (
          <button className="big-btn" onClick={onDone}>
            {t(lang, 'letsPlay')}
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify in the browser**

Enter the first island. Verify:
- Flashcards page through all 8 words with emoji, English word, audio on tap (audio requires a user gesture first in some browsers — tap the card).
- In Hebrew UI mode, the Hebrew translation appears under the English word.
- Last card shows the "Let's play!" button; clicking it reaches the tap-game stub, then memory stub, then quiz stub, then the reward screen with 3 stars and the creature.
- Back on the map: island shows ⭐⭐⭐ and the second island is unlocked; sticker book shows the creature.
- No console errors.

- [ ] **Step 5: Commit**

```bash
git add word-islands/src/components/
git commit -m "feat(word-islands): add island phase flow and flashcards"
```

---

### Task 9: Tap the Right One game

**Files:**
- Modify: `word-islands/src/components/TapTheRightOne.jsx` (replace stub entirely)

Practice game: every word appears once (shuffled). Wrong taps get friendly shake feedback and the kid retries — no dead ends, no score.

- [ ] **Step 1: Replace `word-islands/src/components/TapTheRightOne.jsx`**

```jsx
import { useEffect, useMemo, useState } from 'react';
import { t } from '../i18n.js';
import { shuffle, makeChoices } from '../gameLogic.js';
import { speak, isSpeechAvailable } from '../speech.js';

export default function TapTheRightOne({ words, lang, choiceCount, onDone }) {
  const order = useMemo(() => shuffle(words), [words]);
  const [round, setRound] = useState(0);
  const [wrongId, setWrongId] = useState(null);
  const target = order[round];
  const choices = useMemo(
    () => makeChoices(words, target, choiceCount),
    [words, target, choiceCount]
  );

  useEffect(() => {
    speak(target.english);
  }, [target]);

  const pick = (word) => {
    if (word.english === target.english) {
      setWrongId(null);
      if (round + 1 < order.length) setRound(round + 1);
      else onDone();
    } else {
      setWrongId(word.english);
    }
  };

  return (
    <div className="game">
      <p className="instruction">{t(lang, 'tapInstruction')}</p>
      <div className="prompt">
        <span className="prompt-word">{target.english}</span>
        {isSpeechAvailable() && (
          <button className="audio-btn" onClick={() => speak(target.english)}>
            🔊
          </button>
        )}
      </div>
      <div className="choices">
        {choices.map((word) => (
          <button
            key={word.english}
            className={`choice ${wrongId === word.english ? 'wrong' : ''}`}
            onClick={() => pick(word)}
          >
            <span className="choice-emoji">{word.emoji}</span>
          </button>
        ))}
      </div>
      <p className="progress-text">
        {round + 1} / {order.length}
      </p>
      {wrongId && <p className="feedback">{t(lang, 'tryAgain')}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Verify in the browser**

Play the tap game on island 1 for both a 5–7 profile (3 picture choices) and an 8–10 profile (4 choices). Verify: word is spoken and shown, wrong tap shakes red with "Try again!" and stays on the same word, right tap advances, finishing moves to the memory phase. No console errors.

- [ ] **Step 3: Commit**

```bash
git add word-islands/src/components/TapTheRightOne.jsx
git commit -m "feat(word-islands): add tap-the-right-one game"
```

---

### Task 10: Memory Match game

**Files:**
- Modify: `word-islands/src/components/MemoryMatch.jsx` (replace stub entirely)

6 pairs (12 cards, 4×3 grid). Ages 5–7: emoji↔emoji pairs with audio on every flip. Ages 8–10: emoji↔written-word pairs, no audio on flip (audio would give matches away).

- [ ] **Step 1: Replace `word-islands/src/components/MemoryMatch.jsx`**

```jsx
import { useMemo, useState } from 'react';
import { t } from '../i18n.js';
import { makePairs } from '../gameLogic.js';
import { speak } from '../speech.js';

const PAIR_COUNT = 6;

export default function MemoryMatch({ words, lang, mode, onDone }) {
  const cards = useMemo(() => makePairs(words, PAIR_COUNT, mode), [words, mode]);
  const [flipped, setFlipped] = useState([]); // up to 2 card ids currently face up
  const [matched, setMatched] = useState([]); // matched wordIds
  const [busy, setBusy] = useState(false); // true while a wrong pair is showing

  const flip = (card) => {
    if (busy || flipped.includes(card.id) || matched.includes(card.wordId)) return;
    if (mode === 'emoji-emoji') speak(card.word.english);
    const next = [...flipped, card.id];
    setFlipped(next);
    if (next.length === 2) {
      const [a, b] = next.map((id) => cards.find((c) => c.id === id));
      if (a.wordId === b.wordId) {
        speak(a.word.english);
        const nowMatched = [...matched, a.wordId];
        setMatched(nowMatched);
        setFlipped([]);
        if (nowMatched.length === PAIR_COUNT) setTimeout(onDone, 900);
      } else {
        setBusy(true);
        setTimeout(() => {
          setFlipped([]);
          setBusy(false);
        }, 900);
      }
    }
  };

  return (
    <div className="game">
      <p className="instruction">{t(lang, 'memoryInstruction')}</p>
      <div className="memory-grid">
        {cards.map((card) => {
          const isMatched = matched.includes(card.wordId);
          const up = flipped.includes(card.id) || isMatched;
          return (
            <button
              key={card.id}
              className={`memory-card ${up ? 'up' : ''} ${isMatched ? 'matched' : ''}`}
              onClick={() => flip(card)}
            >
              {up ? (
                card.face === 'word' ? (
                  <span className="memory-word">{card.word.english}</span>
                ) : (
                  <span className="memory-emoji">{card.word.emoji}</span>
                )
              ) : (
                '❓'
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in the browser**

Play memory on both paths. Verify: 12 face-down cards; 5–7 shows emoji↔emoji pairs and speaks on flip; 8–10 shows emoji↔word pairs; wrong pairs flip back after ~1s; matched pairs turn green and stay; matching all 6 advances to the quiz phase. No console errors.

- [ ] **Step 3: Commit**

```bash
git add word-islands/src/components/MemoryMatch.jsx
git commit -m "feat(word-islands): add memory match game"
```

---

### Task 11: Quick Quiz (star finale)

**Files:**
- Modify: `word-islands/src/components/QuickQuiz.jsx` (replace stub entirely)

One attempt per question over all island words. Ages 5–7: word prompt (spoken) → 3 emoji choices, no timer. Ages 8–10: emoji prompt → 4 written-word choices with a 10-second timer per question (timeout = wrong). Score → `starsForScore` in `Island`.

- [ ] **Step 1: Replace `word-islands/src/components/QuickQuiz.jsx`**

```jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from '../i18n.js';
import { shuffle, makeChoices } from '../gameLogic.js';
import { speak, isSpeechAvailable } from '../speech.js';

const TIME_LIMIT = 10; // seconds per question, 8-10 path only

export default function QuickQuiz({ words, lang, young, onDone }) {
  const order = useMemo(() => shuffle(words), [words]);
  const [round, setRound] = useState(0);
  const [answered, setAnswered] = useState(null); // null | 'right' | 'wrong' | 'timeout'
  const [pickedId, setPickedId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const correctRef = useRef(0);
  const target = order[round];
  const choices = useMemo(() => makeChoices(words, target, young ? 3 : 4), [words, target, young]);

  // New question: reset the clock, speak the word for young players.
  useEffect(() => {
    setTimeLeft(TIME_LIMIT);
    if (young) speak(target.english);
  }, [target, young]);

  // Countdown (8-10 only), paused once answered.
  useEffect(() => {
    if (young || answered) return;
    if (timeLeft <= 0) {
      setAnswered('timeout');
      return;
    }
    const id = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, answered, young]);

  // After feedback, advance or finish.
  useEffect(() => {
    if (!answered) return;
    const id = setTimeout(() => {
      if (round + 1 < order.length) {
        setAnswered(null);
        setPickedId(null);
        setRound((r) => r + 1);
      } else {
        onDone(correctRef.current, order.length);
      }
    }, 1000);
    return () => clearTimeout(id);
  }, [answered, round, order.length, onDone]);

  const pick = (word) => {
    if (answered) return;
    const right = word.english === target.english;
    if (right) correctRef.current += 1;
    setPickedId(word.english);
    setAnswered(right ? 'right' : 'wrong');
  };

  const choiceClass = (word) => {
    if (!answered) return 'choice';
    if (word.english === target.english) return 'choice right';
    if (word.english === pickedId) return 'choice wrong';
    return 'choice';
  };

  return (
    <div className="game">
      <p className="instruction">{t(lang, 'quizInstruction')}</p>
      {!young && (
        <div className="timer-bar">
          <div className="timer-fill" style={{ width: `${(timeLeft / TIME_LIMIT) * 100}%` }} />
        </div>
      )}
      <div className="prompt">
        {young ? (
          <>
            <span className="prompt-word">{target.english}</span>
            {isSpeechAvailable() && (
              <button className="audio-btn" onClick={() => speak(target.english)}>
                🔊
              </button>
            )}
          </>
        ) : (
          <span className="prompt-emoji">{target.emoji}</span>
        )}
      </div>
      <div className="choices">
        {choices.map((word) => (
          <button key={word.english} className={choiceClass(word)} onClick={() => pick(word)}>
            {young ? (
              <span className="choice-emoji">{word.emoji}</span>
            ) : (
              <span className="prompt-word" style={{ fontSize: '1.4rem' }}>{word.english}</span>
            )}
          </button>
        ))}
      </div>
      <p className="progress-text">
        {round + 1} / {order.length}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Verify in the browser**

Play the quiz on both paths. Verify:
- 5–7: word shown + spoken, 3 emoji choices, no timer bar; right answer flashes green, wrong flashes red and highlights the correct one; auto-advances after ~1s.
- 8–10: emoji prompt, 4 word choices, timer bar drains over 10s; letting it run out marks the question wrong and advances.
- Finishing shows the reward screen; stars match performance (all right = 3⭐, ≥70% = 2⭐, else 1⭐); map and sticker book update; replaying an island never lowers the stars.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: all suites PASS.

- [ ] **Step 4: Commit**

```bash
git add word-islands/src/components/QuickQuiz.jsx
git commit -m "feat(word-islands): add quick quiz star finale"
```

---

### Task 12: Full-flow verification and launch config

**Files:**
- Create: `.claude/launch.json` (repo root — add the word-islands entry if the file exists)
- Create: `word-islands/README.md`

- [ ] **Step 1: Add dev-server launch config at `.claude/launch.json`**

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "word-islands",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev", "--prefix", "word-islands"],
      "port": 5173
    }
  ]
}
```
If `.claude/launch.json` already exists, append the configuration object to `configurations` instead of overwriting.

- [ ] **Step 2: Full manual pass (browser preview tools)**

Walk the entire flow end to end and confirm each item:
1. Fresh browser state (clear the `wordIslands` localStorage key via devtools/eval) → profile creation appears.
2. Create a 5–7 profile → learn → tap → memory → quiz → reward → map shows stars → sticker book shows the creature.
3. Earn ≥2 stars → island 2 unlocks; islands 3–6 stay locked.
4. Create a second profile on the 8–10 path → its map starts fresh (per-profile progress) → 8–10 games show written words + quiz timer.
5. Toggle to Hebrew: all instructions in Hebrew, layout RTL, English vocabulary still in English and spoken in English.
6. Reload the page → profiles and progress persist.
7. Check console for errors — must be clean.

- [ ] **Step 3: Create `word-islands/README.md`**

```markdown
# 🏝️ Word Islands

A browser game that teaches English vocabulary to Hebrew-speaking kids
(ages 5–7 and 8–10) through themed islands, flashcards, mini-games,
stars, and a creature sticker book.

## Run

    npm install
    npm run dev

## Test

    npm test

## Adding vocabulary

Edit `src/content/islands57.json` (ages 5–7, 8 words per island) or
`src/content/islands810.json` (ages 8–10, 10 words per island).
Each word is `{ "english": "...", "hebrew": "...", "emoji": "..." }`.
New islands need `id`, `icon`, `name` (en/he), a unique `creature`
emoji, and a `words` array — no code changes required.

Design spec: `docs/superpowers/specs/2026-07-03-word-islands-design.md`
```

- [ ] **Step 4: Final test run and commit**

Run from `word-islands/`: `npm test` — expected: all PASS.

```bash
git add .claude/launch.json word-islands/README.md
git commit -m "docs(word-islands): add README and launch config"
```
