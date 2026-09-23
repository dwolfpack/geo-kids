# Research — Trading & Tycoon Games for Kids

This is the research behind the design of every game in `/games/`. Each finding
is followed by the rule we adopted, and every rule is checked in the gauntlet.

## 1. Codebase findings (geo-kids)

- The stack is vanilla HTML/CSS/JS with no build step. It is deployed to GitHub Pages
  from the repo root (`.github/workflows/pages.yml`), so `/games/<name>/` gets served as is.
- `geo-kids/js/countries-data.js` defines the `COUNTRIES` global (195 entries, with
  `code`, bilingual `name`/`capital`/`continent`/`fact`, and `lat`/`lon`), and it can
  also be required from Node. **Adopted:** the games load it through
  `../../geo-kids/js/countries-data.js` so real geography comes for free. Ports and
  cities are referenced by country `code` and checked against the data.
- Language is stored in `localStorage["geo-lang"]` (`"he"` default, or `"en"`), and the
  `<html>` `dir`/`lang` attributes are flipped on change. **Adopted:** the games share that key,
  so a child's language choice carries over.
- Mute is stored in `localStorage["geo-sound-muted"]` (`"1"` = muted), with WebAudio synth
  sounds and no audio files. **Adopted:** we share that key and use the same no-asset approach.
- The visual language is a warm paper card (`#FFFCF3`) on a mint dotted background, with
  Rubik/Heebo fonts and coral/sky/leaf/sun/berry accents. **Adopted:** the games reuse the
  same tokens so they feel like part of the same family.
- `scripts/validate-countries-data.js` must keep passing. The games never modify the data.

## 2. Mobile web game UX

- Touch targets should be at least 44–48 CSS px, with 8px+ gaps between them. Primary actions
  belong in the bottom-centre "natural" thumb zone.
  ([Inkbot Design](https://inkbotdesign.com/mobile-ux/), [Parachute Design](https://parachutedesign.ca/blog/thumb-zone-ux/), [eDesignify](https://edesignify.com/blogs/tap-targets-and-touch-zones-mobile-ux-that-works))
- Pad with `max(16px, env(safe-area-inset-bottom))`, and use `viewport-fit=cover` for notched phones.
  ([theosoti](https://theosoti.com/short/safe-area-inset/), [iPhone PWA game guide](https://gist.github.com/fozzedout/5e77925381991a9570151550992baf14))
- `touch-action: manipulation` removes double-tap zoom and the tap delay on buttons.
  ([MDN touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action))
- **Adopted rules:**
  - Every button is `min-height: 48px`, and the main action bar is fixed at the bottom
    and respects the safe area.
  - There are no hover-only affordances, and `overscroll-behavior: none` prevents pull-to-refresh bounce.
  - The layout is designed at 375×667 portrait first. A Playwright check asserts no horizontal overflow.

## 3. Game economy design

- Every currency has **sources** (where it enters) and **sinks** (where it leaves). Inflation happens
  when sources outrun sinks. Common causes are over-rewarding events and upgrade costs that are too
  cheap. ([dev.to: Sources, Sinks, Loops](https://dev.to/hiroshi_takamura_c851fe71/how-to-design-a-game-economy-sources-sinks-loops-and-balance-j05),
  [Machinations: inflation](https://machinations.io/articles/what-is-game-economy-inflation-how-to-foresee-it-and-how-to-overcome-it-in-your-game-design),
  [Mobile Free To Play](https://mobilefreetoplay.com/bible/building-lasting-free-play-economy/))
- "Cost curves are the clock of the game": upgrade costs grow exponentially (about 1.07–1.15× per purchase)
  so the player always feels slightly behind but never stuck.
  ([Game Developer: Math of Idle Games III](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-iii),
  [Math — backbone of idle games](https://medvescekmurovec.medium.com/math-the-backbone-of-idle-games-part-1-f46b54706cf1))
- Offline earnings: store a timestamp, credit income on load, and **cap** it.
  ([Game Developer](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-iii))
- **Adopted rules:**
  - **No same-place arbitrage.** Everywhere, sell price is below buy price for every good.
    A price-impact model also makes dumping many units lower the price, so no loop can
    mint money. The sim checks this on every tick.
  - **Recurring sinks:** wages, repairs, supplies, and upgrades with exponential cost (×1.12–1.6).
  - **No dead ends.** Every game has a free, always-available fallback income source,
    like fishing, odd jobs, or a "tip jar". A player can never reach a state with no possible
    progress. The sim asserts this for every state it visits.
  - **Capped offline income** (2 hours max) in the idle game.

## 4. Trading and tycoon references

- *Taipan!* (1982) keeps the core loop simple: buy low, sell high, with price variance between ports.
  Risk and reward come from random events like pirates, storms, and confiscation, and play is open-ended
  with an optional retirement at a wealth goal.
  ([Wikipedia](https://en.wikipedia.org/wiki/Taipan!), [TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/Taipan), [MobyGames](https://www.mobygames.com/game/13486/taipan/))
- *Sid Meier's Pirates!* and *Port Royale* are the other references. Each port has goods it
  produces cheaply and goods it demands expensively, and you upgrade your ship to open up new trade routes.
- Idle and incremental games hook players with generators that add to a rate, multipliers, exponential
  costs, and visible numbers going up.
  ([André Games: idle vs tycoon](https://medium.com/tindalos-games/idle-vs-incremental-vs-tycoon-understanding-the-core-mechanics-f12d62f4b9f7))
- **Adopted rules:**
  - Each location **produces** some goods (cheap) and **wants** others (expensive), shown with
    clear 🟢/🔴 price hints.
  - Random events stay kid-friendly. Pirates can be outrun, fought, or bribed, and nothing is ever
    violent or graphic. Storms cost cargo, never the ship.
  - Each game has a named wealth goal ("Legendary Captain: 🪙10,000") with a win screen, and
    free play continues afterwards.

## 5. Designing for kids aged 7–12

- Kids lose motivation quickly, so they need **steady small wins**, progress tracking, and a
  simple, uncluttered UI with minimal text.
  ([NN/g: Kids' cognition](https://www.nngroup.com/articles/kids-cognition/),
  [Smashing: Designing for children](https://www.smashingmagazine.com/2024/02/practical-guide-design-children/),
  [NN/g: children's usability](https://www.nngroup.com/articles/childrens-websites-usability-issues/))
- Mistakes shouldn't feel like failure. Avoid red ✗ marks and buzzers, and use a soft "whoops" plus a gentle reset instead.
  ([Smart Interface Design Patterns](https://smart-interface-design-patterns.com/articles/design-guidelines-children/))
- Reward accomplishments with celebratory sounds and confetti.
  ([UXmatters](https://www.uxmatters.com/mt/archives/2015/11/how-to-balance-design-guidelines-for-children.php))
- **Adopted rules:**
  - Milestones are frequent (the first one comes within about 2 minutes), and there's a
    progress bar toward the next goal.
  - A loss shows a soft sound and an encouraging message, and there is never a game over.
    Losing money shows up as a gentle "−" float in amber, not red.
  - Text is short, backed by emoji icons, and every number is always visible.

## 6. Privacy and safety (COPPA / GDPR-K)

- The safest approach is to collect no personal information at all, avoid third-party ad or analytics SDKs,
  and avoid identifiers.
  ([Filament Games](https://www.filamentgames.com/blog/coppa-compliance-and-educational-video-games/),
  [SuperAwesome](https://www.superawesome.com/blog/how-to-build-coppa-and-gdpr-compliant-location-based-games-for-kids/),
  [GDPR Local](https://gdprlocal.com/coppa-complete-guide/))
- localStorage *can* count as personal info if it's used to **track or identify** a child
  ([CookieHub](https://www.cookiehub.com/coppa)).
- **Adopted rules:**
  - The games have no network calls, analytics, ads, purchases, or text input fields.
  - localStorage holds only the game state (money, cargo, upgrades) and never leaves the device.
  - Fonts fall back to system fonts, so the games work fully offline with nothing third-party.

## 7. PWA and offline

- Use cache-first for static assets and version the caches, deleting old ones on `activate`.
  ([MDN js13kGames offline](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Tutorials/js13kGames/Offline_Service_workers),
  [MagicBell](https://www.magicbell.com/blog/offline-first-pwas-service-worker-caching-strategies))
- The manifest carries the name, icons, theme color, and `display: standalone`.
- **Adopted rules:**
  - Each game has its own `manifest.webmanifest`, an SVG icon, and a `sw.js` scoped to its folder.
    That service worker precaches the game files and `../../geo-kids/js/countries-data.js`.
  - Registration is skipped on `file://`, so the game still works when you just open `index.html`.

## 8. Performance on low-end phones

- Animate only `transform`/`opacity`, which lets the compositor skip layout and paint. Batch DOM reads and
  writes, use `requestAnimationFrame`, and honour `prefers-reduced-motion`.
  ([cr0x: transform/opacity rules](https://cr0x.net/en/css-animations-performance-rules/),
  [Motion: performance tier list](https://motion.dev/magazine/web-animation-performance-tier-list))
- **Adopted rules:**
  - All the juice (coin bursts, floats, bobbing) uses transform and opacity only, and the
    particles are pooled and capped at 12.
  - Under reduced motion, particle effects are skipped and replaced by a simple fade.
  - Rendering is driven by state diffing per screen. Nothing runs a per-frame layout loop.

## 9. Game feel ("juice")

- "Juice it or Lose it" (GDC 2012) turned a dull game fun with flash, shake, floating text, sound,
  and particles, without changing any rules.
  ([Cobble Games](https://cobble.games/wise-inspiring-smart/game-design/juice-it-or-lose-it),
  [valdemird: game feel on the web](https://valdemird.com/blog/game-feel-on-the-web/),
  [BetterLink](https://eastondev.com/blog/en/posts/dev/20260521-game-feedback-feel/))
- **Adopted rules:**
  - Buttons squash when pressed, coins fly to the wallet, numbers count up, price changes flash,
    and the ship bobs. Pitch rises on sale streaks.

## 10. Web audio on iOS

- An AudioContext must be created or resumed **inside** a gesture's completion event
  (click/touchend/keydown), or iOS keeps it suspended.
  ([Matt Montag](https://www.mattmontag.com/web/unlock-web-audio-in-safari-for-ios-and-macos),
  [HackerNoon](https://medium.com/hackernoon/unlocking-web-audio-the-smarter-way-8858218c0e09))
- **Adopted rules:**
  - The engine unlocks audio on the first `click`/`touchend`/`keydown` listener, and all
    sounds are synthesised.

## 11. Accessibility

- Text contrast is at least WCAG AA.
- All icon buttons have an `aria-label`.
- The money display is an `aria-live="polite"` region.
- Everything is keyboard operable through native `<button>`s, with a visible focus ring.
