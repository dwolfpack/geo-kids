# NYC Metro Tycoon — UI audit against the concept mock-up

Audited build: `nyc-tycoon.html` at `e37adb2` (after the four-commit graphics pass:
rooftop detail, single-sun shadows, colour grade + haze, painted overlays,
congestion ribbons, selection beam, kerbs/sidewalks/crossings).

Method: 33 headless screenshots via `tools/qa/`-style Playwright drives, each from
a **fresh browser context** — first load with the tutorial live; unowned /
owned-vacant / developed-tower / rival-held / live-offer inspectors; all five
overlays with legends; all six modals plus a district panel; a fully built 93-block
city at default and 2.3× zoom; 430×860 and 1280×800. Zero console errors and zero
page errors across every state — the build is functionally solid; everything below
is presentation.

Reference target is the four-panel mock described in `GRAPHICS_BRIEF.md`.

**Cost context.** The graphics pass measured 27.1 → 19.5 fps interleaved on a full
city at 4×. Two proposals below (H1, H4) *remove* per-frame work; nothing proposed
here adds a full-screen pass.

---

## 1. Broken or confusing

Ranked by how much play it costs.

### B1 — Phone HUD stat values overwrite each other · state: 430×860, any time cash exceeds ~5 characters
At 430 px the HUD is `overflow-x:auto` with `.stat{min-width:78px}` but `.v` is
still `font-size:15px`. `$499.68M` and `+$28.5K/s` physically overlap; `PRESTIGE 0`
is painted over by `INFLUENCE`. The player cannot read their own cash — the single
number the whole game is about.
**Change:** in the `max-width:720px` block set `.stat .v{font-size:12.5px}` and
`.stat{min-width:auto;padding:0 9px}`, and let `.stat` size to content
(`flex:0 0 auto`) instead of a fixed minimum.

### B2 — The offer countdown is frozen · state: rival block with a live offer, and own block with a bid
The inspector prints "Offer lapses in 52s" / "Expires in 38s" once, at select time.
The 0.25 s UI tick (line ~4234) refreshes only `#live-rev` and `#live-opex`, so the
number never moves; then the whole offer block silently disappears when it expires.
A timed decision with a stopped clock, and no feedback that it ran out.
**Change:** give the countdown its own id (`#offer-left`) and update it in the same
0.25 s block as `live-rev`; when `G.offer.left < 10` colour it `var(--red)`. On
expiry, `toast("bad", "Offer Lapsed", …)` rather than a silent DOM removal.

### B3 — Modals open pre-scrolled with their heading off screen · state: any modal opened after a long one
`openModal()` replaces `#mbox.innerHTML` but never resets `#mbox.scrollTop`. Scroll
to the bottom of Portfolio to reach its Close button, press `R`, and the Competition
modal opens mid-list — the `<h1>` and the "Your empire" card are above the fold. I
hit this without trying to.
**Change:** add `$("mbox").scrollTop = 0;` in `openModal` after the innerHTML
assignment.

### B4 — Profit and Audit Risk overlays have no gradation · state: overlays 4 and 5, 30/93 city
Both legends promise a three-step ramp; the map paints one flat colour. Two causes,
both fixable:
- Profit uses `r = p.revenue / maxRev`, but revenue scales at the 2.6 power of tier,
  so one tier-9 tower puts every other block below `r < 0.1`. Every owned block is
  the same faint cyan.
- The overlay edge stroke is drawn at a **fixed** `globalAlpha = 0.95` in `o.c`
  regardless of the block's value, so a clean-books block and a back-room operation
  get identical bright red outlines.

These are the two overlays whose only job is "which blocks should I act on", and
they answer nothing.
**Change:** (a) profit → `r = Math.log1p(p.revenue) / Math.log1p(Math.max(1, maxRev))`;
(b) in `drawOverlays`, scale the crisp line with the value:
`ctx.globalAlpha = 0.30 + 0.65 * ((o.a - 0.08) / 0.52)` instead of the constant
`0.95`, and raise the bloom pass the same way. (c) risk: floor the fill at
`a = 0.18` so "clean books" is visible at all, and widen its three steps to
`{0.18, 0.45, 0.9}`.

### B5 — Half the sidebar is below the fold, with no scroll affordance · state: every desktop size; worst at 1280×800
`#side` is `top:56px;bottom:0` with ~940 px of content. At 1600×900 the last three
rows (**How To Play**, Save Empire, Demolish Save) are cut. At 1280×800 five of the
eight Management rows are cut, including **Competition**, **Portfolio** and
**Objectives**. The tutorial and the hint line both tell the player to press `H` and
`L` for panels they cannot see. The scrollbar is 6 px and only paints on hover in
WebKit, so there is no cue anything is below.
**Change:** move CONTRACTS into its own non-scrolling top region and let only
OVERLAYS/DISTRICTS scroll; failing that, drop `.row` padding from `7px 12px` to
`5px 12px` and `.dcard` from `7px 9px` to `5px 8px` (recovers ~90 px, enough for
1280×800), and add a persistent 12 px bottom fade
(`#side{background-image:linear-gradient(transparent 92%, var(--panel))}`) as the
"more below" cue.

### B6 — Speed and pause are unreachable on phone · state: 430×860
`#hud` becomes `overflow-x:auto` at ≤720 px and shows 5.5 of 9 stats. `#speedbox`
and the wordmark sit past the right edge with no scroll indicator. The player cannot
pause, and cannot reach 2×/4× — on the platform where they most want to leave the
game running.
**Change:** at ≤720 px pull `#speedbox` out of the scrolling strip — position it
`fixed; right:6px; top:6px; z-index:21` over the HUD, and drop it to the three
buttons that matter (`II`, `1x`, `4x`) at 26×24.

### B7 — Overlay 3 has two different names and paints the wrong thing · state: overlay 3
Sidebar says **Foot Traffic**; the on-canvas legend says **STREET CONGESTION**; the
ribbons are drawn along the road grid, not on blocks. A player pressing `3` looking
for pedestrian density gets road congestion under a third name. Separately, at 30/93
the ramp is so bottom-heavy that essentially the whole grid is green — the overlay
shows a spread only in the last minutes of a game.
**Change:** rename the sidebar row to **Congestion** so it matches the legend, and
normalise the ramp against the current city maximum
(`t = clamp(raw / Math.max(0.15, cityMaxTraffic), 0, 1)`) so mid-game shows the
green→yellow→red spread the mock-up panel 2 does.

### B8 — Long modals hide their own Close button · state: Portfolio (24 holdings), City Hall on phone
`#m-close` is appended after the content, so closing a 24-row Portfolio means
scrolling past all 24 rows. `Esc` is not advertised anywhere in the modal.
**Change:** make the close control sticky —
`.mbox .close{position:sticky;bottom:0;margin-top:18px}` plus
`.mbox{padding-bottom:0}` — or add an `✕` in the modal's top-right matching
`#iclose`, which the inspector already has.

### B9 — Disabled City Hall cards never say why · state: City Hall
`.lobc.dis{opacity:.42}` and nothing else. "Regulatory Cleanup" greys out with no
text; on phone with 8 influence all eight cards are dim and indistinguishable from
each other.
**Change:** when a card is unaffordable, replace its cost line with
`Need 14 more influence` (or `Need $8.00M`) in `var(--red)`; when it is
inapplicable (cleanup at 0 risk), show `No audit risk to erase`.

---

## 2. Visual gap vs. the mock-up

### H1 — Atmospheric haze is applied in screen space, so near towers are fogged
`drawHaze()` paints one full-width vertical gradient (up to `rgba(46,78,108,0.5)`)
keyed to the *screen* Y of the grid's far corner, after all buildings. A tall tower
close to the camera pokes into the top of the screen and gets hazed at 50 % as if it
were on the horizon. This is why a tier-9 tower reads as a translucent hologram
rather than glass — at 1280×800 the ground plane is clearly visible through it.
Distance haze that ignores distance is the biggest single thing holding the render
back from the mock's depth.
**Change:** delete the full-screen `fillRect` and apply haze per item in pass 2:
`ctx.globalAlpha = 1 - 0.34 * clamp((farD - it.d) / farD, 0, 1)` over a flat
`rgba(46,78,108,·)` composite on each building's bounding box, keyed to world depth
`it.d = x + y`. **This removes a 1600×900 fill per frame** — it should claw back
part of the 27.1 → 19.5 fps regression rather than adding to it.

### H2 — Street canyons crush to pure black at full build
State: 93-block city at 2.3× zoom. The shadow/AO pass drives the street tiles to
`#000`. Every asset the graphics pass just added down there — kerbs, sidewalks,
zebra crossings — plus the cabs and pedestrians are completely invisible. The
mock-up's aerial keeps readable asphalt in shadow.
**Change:** clamp the shadow multiplier so a street tile never falls below 22 % of
its unshadowed luminance (`shadeMul = Math.max(0.22, shadeMul)` in the street
branch), and let the crossing stripes ignore AO entirely.

### H3 — No district identity in the default view
State: overlay "None", every zoom. The mock's panel 1 has saturated blue and magenta
zoning reading straight off the roofs. Here, with no overlay, the four districts are
indistinguishable — a wash of dusty pink / sage / tan / lilac driven by *business
type*, not district. The player's mental map of the city ("Wall Street is the blue
one") never forms, and the sidebar's four colour dots correspond to nothing on screen.
**Change:** tint the roof plane only — not the facades — toward
`DISTRICTS[p.d].color` at 14 % in the "None" overlay. It costs nothing extra (the
roof pass already exists), preserves the business-colour facades, and gives the
default view the zoning read the mock leads with.

### H4 — The selection beam is a wide grey smudge
State: any selected block. `h = 240 * cam.z` with stops at `rgba(gold,0.26)` /
`0.10` produces a ~200 px cone of near-neutral haze that reads as a light leak or a
rendering artifact, not a marker. In the tower shot it is invisible behind the
building it is meant to mark.
**Change:** halve the width and double the saturation — beam width
`tw * 0.55` instead of a full-screen-height cone, stops
`rgba(gold,0.42) → rgba(gold,0.14) → 0`, and clip it to the block's diamond footprint
so it reads as light rising *from the lot*. A narrower beam is also fewer shaded
pixels per frame.

### H5 — Inspector has no typographic hierarchy, and the primary action is under-styled
State: developed tower. Seven `.kv` rows at identical 11.5 px weight — land value,
district yield, height cap, synergy, gross revenue, operating cost, prestige — with
no separation between *what the land is* and *what the business earns*. The mock's
card leads with Land Value and Current/Potential Revenue at display size with a
single loud CTA.

Worse: **"Build Up →" is a plain `.btn`** while "Acquire Deed" and "Sell Property"
get `.btn.buy` and `.btn.danger`. The most-repeated action in the game is the least
prominent button on the panel.
**Change:** (a) give `#a-up` the `buy` class; (b) promote gross revenue to its own
block above the `.kv` list at `font-size:22px;font-weight:800;color:var(--green)`
with `Gross revenue` as a 9 px label above it, matching `.stat` in the HUD;
(c) split the remaining rows under two `.sechead`s, `LAND` and `OPERATIONS`.

### H6 — Unowned blocks give no earnings figure
State: unowned parcel. The panel shows Land value, District yield ×1.35, Height cap
7 tiers, Synergy ×1.10 — four abstractions and not one dollar of income. The mock's
card explicitly pairs **Current Revenue** with **Potential Revenue**. A player
comparing two parcels has to do the arithmetic themselves.
**Change:** add one row, `Potential at tier 1  +$47/s`, computed with the same
`26 * b.mult * D.rev` preview the found-a-business cards already use, taking the
district's specialty business.

### H7 — District labels paint over buildings, at 30 % alpha
`drawDistrictLabels()` runs after pass 2, so "UPPER EAST SIDE" prints across the face
of any tower under it, and at `globalAlpha 0.30` over the newly darkened grade it is
simultaneously too faint to read and visible enough to look like a smudge. At the
left edge, "WALL STREET" is half-hidden behind the sidebar.
**Change:** draw labels between pass 1 and pass 2 so buildings occlude them (they are
ground markings in the mock, painted on the map); raise alpha to 0.5 to compensate,
and offset the label centroid by the sidebar width so it lands in visible space.

### H8 — Rooftop detail is invisible where the player spends most of the game
Priority 1 of the brief, and it reads well on tier 1–4 blocks. But from tier 6 up the
towers fill the frame with *walls*, and their roofs are slivers at or above the top
edge — in the full-city state almost no roof is visible at all, while the per-frame
cost is paid on every block, every frame. This is a targeting problem, not a quality
one; the work is good where you can see it.
**Change:** skip the roof-detail pass when a building's roof plane is above the
viewport or smaller than ~14 px on screen (`if (roofArea < 200 || top < 0) return;`).
Pure win: the detail you cannot see stops costing frames, which directly addresses
the 19.5 fps figure.

### H9 — Windows read as confetti
Facade windows are drawn in five saturated hues (green, pink, orange, cyan, violet)
at random positions. At 2.3× zoom on a full city it reads as scattered sweets rather
than lit offices, and it fights the sun/shadow model the pass just introduced.
**Change:** one warm window colour per building — `rgba(255,214,140,·)` — at two
alphas (0.9 lit / 0.25 dark), placed on a regular per-floor grid rather than random
offsets, with roughly 35 % lit. Keep the per-business hue as a faint tint (10 %) so
the district still reads.

### H10 — Endgame camera does not fit the city
State: 93 blocks built, default zoom. The skyline runs off the top and left edges,
towers are clipped by the HUD, and over half the frame is empty water. The player's
finished city — the payoff — cannot be seen whole.
**Change:** add a "frame the city" action bound to `F` and fired once on win:
compute the world AABB of built plots and set `cam.tz` to fit it inside
`(W - 196 - 322) × (H - 56 - 34)`, i.e. inside the actual free viewport rather than
the window. Allow `cam.tz` down to 0.34 (from 0.42) so a full city fits at all.

### H11 — Portfolio wastes 5× the vertical space it needs
Each holding is an ~85 px three-line card, so 6 of 24 blocks are visible. It is a
sortable table rendered as cards.
**Change:** one 34 px row per holding in four columns — name / biz · tier /
district / revenue — reusing `.kv` metrics (11.5 px, tabular-nums). Twenty rows
visible instead of six, and the sort controls start doing something.

### H12 — District boundary glow is lost over bright rooftops
The boundary the brief asks for (panel 3) *is* implemented and the district panel is
otherwise the closest thing in the game to the mock. But at
`rgba(240,248,255,~0.9)` / 1.8 px, white-on-white, it disappears across the pale
roofs it crosses.
**Change:** tint the 11 px outer bloom to the district colour at 0.30 and keep the
1.8 px core white; add a 1 px `rgba(0,0,0,0.5)` under-stroke so the line holds over
both dark asphalt and light membrane roofs.

---

## 3. Polish

- **Legend swatch for "Clean books" is invisible** (audit-risk overlay): the swatch
  is `rgba(255,70,90,0.1)` on a `rgba(10,15,24,0.9)` panel — the row reads as a blank
  square. Draw legend swatches at a fixed 0.55 alpha and let only the *hue* vary.
- **Coach button reads "…" when gated**: a disabled button labelled with an ellipsis
  says nothing. Label it `Do it to continue` and keep it disabled.
- **Tutorial spotlight is a screen-space rectangle over an isometric diamond**, so
  the gold box around "the one lit up" contains parts of four blocks. Clip `#spot` to
  the diamond, or draw the highlight on canvas as a filled diamond at
  `rgba(255,207,74,0.18)` — the copy says "lit up" and nothing is actually lit.
- **The tutorial dims the whole map to 38 % for all eight steps**, so a first-time
  player's first two minutes are a near-black screen — the worst possible showcase for
  the new render. Drop the spotlight scrim from `rgba(3,6,11,.62)` to `.42`.
- **Toasts slide under the district panel** (`#toasts{right:340px}` vs. a ~530 px
  panel). Set `right:560px` while `#modal.district` is open.
- **The win toast is styled exactly like a milestone toast.** "TOTAL MONOPOLY — every
  block in New York is yours" arrives third in a stack of three identical cards. Give
  the win state a full-width banner, or at minimum a `.toast.win` with a gold 3 px
  border on all sides and a 2× duration.
- **Micro-upgrade pips are 11×3 px.** At a glance you cannot tell 2 of 3 from 3 of 3
  on the block you are actively upgrading. Take them to 14×5 with 3 px gaps.
- **Ticker text paints over the "NYSE WIRE" label.** `#tscroll` follows `#tlabel` in
  DOM order with both statically positioned, so the translated text renders on top of
  the gold chip — visible in nearly every screenshot. Fix:
  `#tlabel{position:relative;z-index:1}`.
- **City Hall's 3-column grid leaves a ragged 2-of-3 last row** at 760 px with ~840 px
  of unused viewport either side. Widen `.mbox` to `min(980px, 92vw)` for City Hall so
  eight cards land as 4×2.

---

## 4. What the current UI does better than the mock-up — keep these

1. **The district panel is better than mock panel 3.** It does not dim the map, it
   sits to the side, and it highlights the district's boundary on the live city while
   open. The mock's floating card hides the thing it describes. Keep the side-anchored
   treatment and the `#modal.district` no-scrim variant.
2. **Keyboard shortcuts are surfaced inline.** Every sidebar row carries its key in a
   `.kbd` chip, and the overlays are numbered 1–5 in place. The mock has no
   affordance for this at all.
3. **The contracts rail.** A persistent three-card queue of live objectives with
   progress and reward, top-left, always visible. The mock has nothing equivalent —
   it is the main reason the early game has direction.
4. **Overlay legends exist and are correct.** The mock shows overlay buttons but never
   explains a colour. Every overlay here ships a legend keyed to the actual ramp
   function.
5. **Buttons re-enable the instant you can afford them** (the `[data-cost]` sweep on
   the 0.25 s tick), and every priced control carries its price on its face. Do not
   lose this in a restyle.
6. **The ticker.** A running NYSE wire of your own acquisitions, milestones and rival
   moves gives the city a world outside the player. Nothing in the mock does this.
7. **Colour-safe palette and `prefers-reduced-motion` are first-class**, toggled from
   the HUD. Any new colour or animation must go through `cbc()` and `REDUCE_MOTION`.
8. **The zoning overlay is already on-target.** Saturated translucent fills, crisp
   bright edges, soft outer bloom, painted as if on the ground — this is the mock's
   treatment, achieved. Use it as the reference for fixing the other four (B4).
9. **The tower crane** now has mast, jib and counterweight and reads correctly at
   distance (brief item 7). It still wants the progress ring, but the silhouette is
   right.
