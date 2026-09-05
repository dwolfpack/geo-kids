# NEON ARCADE 95

**Six original mid-90s arcade games in one site.** A sequel to the 8-bit-flavoured
[NEON ARCADE](https://dwolfpack.github.io/neon-arcade/): same cabinet, bigger games —
pseudo-3D racing, a four-event Olympic meet, a downhill ski run, a surf break,
a raycaster shooter and a beat-em-up.

No installs, no plugins, no ads, no network calls. Works on phones (touch d-pad +
up to three buttons + drag on the screen), tablets and desktop (arrows / WASD,
space = A, X = B, C = C).

## The cabinets

| Game | Type | What it is |
|---|---|---|
| NITRO GT | racing | Pseudo-3D checkpoint racer: 3 laps, 9 rivals, drift, nitro that refills by overtaking |
| MEGA OLYMPICS | sports | 100m sprint, 110m hurdles, long jump and javelin — hammer A/B, time the angle meter |
| ALPINE SLALOM | snow | Downhill against the clock: slalom gates, moguls, kickers, trees, spin tricks |
| SURF RIDER | wave | Stay ahead of the break, snap off the lip, get barrelled, land airs |
| HELL SECTOR | fps | Texture-shaded raycaster: three floors, four demon types, three guns, keycards |
| AXE OF FURY | brawler | Three-stage beat-em-up: combos, knockdowns, thrown axes, screen-clearing magic, a boss |

## How it is built

Plain HTML5 canvas and vanilla JavaScript. No frameworks, no build step, no
dependencies. High scores live in the browser's own `localStorage`
(`neon95:hs:<game-id>`).

```
index.html                  the arcade hub
games/<id>.html             one thin page per cabinet
assets/css/arcade.css       the whole theme (CRT scanlines, marquee, 3-button touch deck)
assets/js/engine.js         the shared cabinet: loop, input, sound synth + chiptune
                            sequencer, particles, banners, HUD slots, overlays, high scores
assets/js/games/<id>.js     one file per game — setup(g) / update(g, dt) / draw(g, ctx)
assets/js/games-list.js     the line-up and its pixel-art icons
```

### What the engine gives a game

Input (`g.held`, `g.pressed`, `g.axisX/axisY`, `g.pointer` with `dx/dy` for drag-to-look),
drawing (`g.rect`, `g.circle`, `g.line`, `g.poly`, `g.bar`, `g.text`, `g.pixels`,
`g.gradient`, `g.sky`, `g.grid`), juice (`g.burst`, `g.shake`, `g.flash`, `g.banner`),
sound (`g.sfx('shotgun')` and a `music:` chiptune loop per cabinet), scoring
(`g.addScore`, `g.setLives`, `g.setHud('lap', ...)`) and the title / pause / game-over
screens.

### Adding a cabinet

1. Drop `assets/js/games/my-game.js` that calls `Arcade.game({ id, title, setup, update, draw, ... })`.
2. Copy a page shell from `games/` and point it at the new file.
3. Add an entry (with its pixel-art icon) to `assets/js/games-list.js`.

## Running locally

Any static server works:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/arcade/
```

## License

MIT — take it, fork it, add cabinets.
