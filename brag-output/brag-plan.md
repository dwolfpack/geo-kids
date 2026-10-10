# /brag plan — geo-kids ("Around the World Adventure" / מסע סביב העולם)

**What it is:** A set of bilingual (Hebrew + English) geography games for kids that runs in the browser: flag quiz, capitals, continents, memory, and a country explorer, covering all 195 countries across 5 difficulty levels.

**Who it's for:** Young learners (and the parents who hand them the tablet).

**What sets it apart:** Real kid-friendly content: every answer reveals a fun fact ("Mongolia has more horses than people!"). Difficulty goes from 39 famous countries to all 195. It's Hebrew-first with a one-tap English toggle, and it saves stars per player.

**Hook:** An unfamiliar flag fills the screen: "Which country does this flag belong to?" A finger taps *Mongolia*, the button pops green, confetti falls, and the fact appears.

**Tone:** `default`. Punchy, playful and clean, in the app's own palette (coral / sky / leaf / sun / berry on a minty dot grid, Rubik + Heebo).

**Share caption:** Mongolia has more horses than people. My geography games for kids teach things like that: flags, capitals, continents and memory, 195 countries, in Hebrew and English.

## Visual identity (from the source)
- bg `#E4EFEE` + 22px dot grid, cards `#FFFCF3`, ink `#1E2C2A`
- coral `#D6553B`, sky `#2E7D96`, leaf `#4C9166`, sun `#E0A83E`, berry `#A6567D`
- Rubik 800 display, Heebo body
- The real app is rendered live in iframes, with real CSS, real `pop`/`rise`/`fall` keyframes and real confetti. All of it is driven frame by frame.

## Storyboard (landscape 1920×1080, 30fps, ~22.7s, 120 BPM so every cut lands on a beat)

| # | Time | Scene | On screen | Readable text |
|---|---|---|---|---|
| 1 | 0.0–4.0 | **Hook: Flag Quiz** | Close-up on the Mongolia flag and question. Four options rise in, a finger taps Mongolia (1.5s), it pops green with confetti, and the fact bubble appears. | "Which country does this flag belong to?" / "Correct! Mongolia has more horses than people!" |
| 2 | 4.0–7.5 | **Reveal: Home** | The camera pulls back into an app window (URL bar: dwolfpack.github.io/geo-kids) and the drums enter. The six game cards cascade in and the finger taps Flag Quiz. | Kicker "Around the World Adventure", caption "Geography games and adventures for kids." |
| 3 | 7.5–11.0 | **Highlight: Levels** | The difficulty screen appears. The five level buttons pop in on 8th notes (39 → 79 → 118 → 157 → 195 countries) and a ring highlights Expert. | "From 39 countries to all 195." |
| 4 | 11.0–15.0 | **Highlight: Discover a Country** | "Japan" is typed, the suggestion chip is tapped, and the country ID card rises (Tokyo, Mount Fuji, 320 km/h trains). | "Type a name. Discover everything about it." |
| 5 | 15.0–18.0 | **Highlight: Memory** | Cards flip. One pair misses and flips back, then pairs match green and the counter ticks up. | "Match each flag to its country." |
| 6 | 18.0–20.0 | **Payoff: Result** | Trophy, three stars and a confetti burst. | "Stars and records for every player." |
| 7 | 20.0–22.7 | **Outro** | The window slides away and the end card appears: title, Hebrew title, URL, and a marquee of flags. | "Around the World Adventure", "מסע סביב העולם", "dwolfpack.github.io/geo-kids" |

## Sound
An original track synthesized in C major at 120 BPM, with sparse marimba and pad under the hook. Drums enter on the reveal (4.0s). Sound effects are in key and share the same reverb: the app's own C5+E5 chime on correct answers, pentatonic marimba pops for the level buttons, soft ticks for typing, soft swishes for card flips, and a C-major arpeggio fanfare on the result.
