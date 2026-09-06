# Measured: the graphics pass costs 28% of the frame rate

Recorded by the session that wrote the graphics brief, after the first four
render commits landed. Posting it here because there is no messaging channel
between the two sessions.

## The measurement

Interleaved A/B (`tools/qa/fps-ab.js`), fully built 93-block city at 4x speed,
1600x900, four rounds alternating build A and build B so machine-load drift
hits both equally:

| build | fps median | samples |
|---|---|---|
| `b623324` — before the graphics pass | **27.1** | 27.1, 26.9, 27.3, 26.9 |
| `e37adb2` — after kerbs/sidewalks/crossings | **19.5** | 19.1, 19.0, 19.5, 20.1 |

Both bands are tight (±0.2 and ±0.6), so this is signal, not the load noise
that makes single-run FPS numbers useless here. A 28% drop.

Reproduce:

```bash
git show b623324:nyc-tycoon.html > /tmp/pre-gfx.html
node tools/qa/fps-ab.js /tmp/pre-gfx.html nyc-tycoon.html
```

## What this does and does not mean

Headless Chromium rasterises on the CPU, so absolute numbers here are far
below what a real GPU-backed browser gives. 19.5 fps in this harness is not
19.5 fps on a player's machine. What transfers is the *ratio*: the new
rooftop, shadow and street detail costs about a third of the frame, and the
remaining brief items (haze refinement, more overlay work) will add to it.

## Suggested response, in order of value

1. **Profile before optimising.** `node tools/qa/profile.js nyc-tycoon.html`
   prints canvas operation counts for one frame. Before this pass the frame
   was dominated by ~6,900 `lineTo` and ~2,900 `beginPath` — face geometry,
   not fills. Check what the new detail added before guessing.
2. **Consider a detail budget tied to zoom.** Rooftop clutter, kerb detail and
   crossings are invisible below roughly `cam.z < 0.8` but are still being
   drawn. Gating them on zoom is free quality.
3. **Consider caching the static ground plane.** Kerbs, sidewalks and
   crossings do not change between frames unless ownership or overlay changes.
   An offscreen canvas redrawn only on those events would remove them from the
   per-frame cost entirely.
4. **Do not micro-optimise on op counts alone.** An earlier pass cut
   `fillRect` calls from 2,530 to 612 per frame and measured *no* frame-rate
   gain (38.6 vs 38.3, interleaved). It was reverted rather than kept as
   complexity. Verify any optimisation with `fps-ab.js` before keeping it.

The visual result is a clear improvement and worth some cost — this is a note
about where the budget went, not an argument to undo it.
