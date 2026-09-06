# NYC Metro Tycoon — graphics brief

The game is one self-contained file: `nyc-tycoon.html` (~3,600 lines, canvas
renderer + simulation + UI, no dependencies, no build step). It is functionally
complete after eleven development passes. **This brief covers the next pass,
which is visual only.** Do not change game rules, economy constants or balance
without measuring — see "Do not break" at the bottom.

## The target

The user supplied a four-panel concept mock-up. The new session cannot see it,
so it is described here in full. Each panel is a photographic-looking aerial
view of Manhattan with a dark game UI composited over it.

**Panel 1 — "ZONING & DEVELOPMENT".** Aerial of midtown at a steep angle. A
white glass tower is picked out in the centre. Several city blocks carry
translucent, saturated colour fills — a strong blue and a magenta/pink — with
bright crisp edges, reading like zoning rectangles painted onto the roofs and
lots. Left sidebar sections: OVERLAYS (Zoning, Traffic, Utilities, Profit),
BUILD (Residential, Commercial, Office, Infrastructure, Landmarks), MANAGEMENT
(Taxes, Services, Policies). Bottom-right card: "SELECTED BLOCK / TIMES SQUARE"
listing Zone Type, Land Value, Current Revenue, Potential Revenue, with an
"UPGRADE & DEVELOP" call to action. Top bar: CITY FUNDS, POPULATION, YEAR,
MONTH. Wordmark "NYC METRO TYCOON" top right.

**Panel 2 — "TRANSPORT OPTIMIZATION".** The same city with the avenues carrying
flowing ribbons of colour — green through yellow to red — showing congestion
along the street grid rather than individual vehicles. A circular node marker
with a transit glyph and a "+" pin floats over an intersection. Right card:
"MAJOR SUBWAY STATION" with pass/hr, congestion and revenue, above buttons ADD
BUS ROUTE, EXPAND SIDEWALK, BUILD PARKING GARAGE, TAXI FLEET.

**Panel 3 — "DISTRICT MANAGEMENT".** A whole district outlined by a glowing
white boundary drawn over the rooftops. A floating panel reads "GARMENT
DISTRICT: Select A Policy" with four options — Promote High End Retail,
Establish Tech Incubator, Encourage Art & Culture, Deregulate Manufacturing —
each with an estimated revenue and job-growth effect, beside a FINANCIALS
column of revenue and expense lines.

**Panel 4 — "LANDMARK CONSTRUCT".** A construction site with a tower crane and
an unfinished tower. Right card: "NEW AMSTERDAM CENTER (Landmark Mixed Use)",
Progress 15% Complete, Est. Cost, Revenue Boost, above ACCELERATE CONSTRUCTION,
ADVERTISE TENANCIES, HOST FUNDRAISER, and a SPECIAL LANDMARKS list.

## What is honestly achievable

The mock-ups are photographic. A hand-written 2D canvas renderer will not
become photoreal, and no copyrighted aerial photography may be shipped in the
file. The goal is to move the *rendered* city materially toward that read.
State this plainly to the user rather than implying a photographic result.

The UI chrome is already close to the mock-ups (dark translucent panels, left
sidebar with the same section structure, a selected-block inspector on the
right, a top stat bar, the wordmark). The gap is almost entirely in the map.

## Priority order for the map

1. **Density and roof detail.** Buildings are currently flat-topped extruded
   boxes. Aerial photography reads as *roofs*: HVAC units, water towers,
   stairwell bulkheads, parapets, rooftop gardens, helipads, skylights, roof
   colour variation (tar black, gravel grey, white membrane). This single
   change does more than anything else on the list.
2. **Light and shadow.** One consistent sun direction with long soft shadows
   cast across neighbouring lots, ambient occlusion darkening street canyons,
   and a brighter sunlit face versus a deep shaded face. Currently shadows are
   a flat ellipse under each building.
3. **Colour grading and depth.** A subtle warm highlight / cool shadow grade,
   atmospheric haze that desaturates distance, and light bloom at night.
4. **Overlay treatment.** Rework the overlays to match the mock: saturated
   translucent fills with a bright 1px edge and an outer glow, drawn as if
   painted on the ground, instead of the current flat wash.
5. **Traffic as flow ribbons.** Add congestion ribbons along the street grid,
   green→yellow→red, driven by the existing foot-traffic and transit values.
   Keep the individual cabs; they read well close in.
6. **Selection and district boundary.** A glowing outline plus a soft vertical
   light beam on the selected block, and a glowing boundary stroke around a
   district when its panel is open (panel 3).
7. **Construction.** The crane exists but is a stick figure. Give it a mast,
   jib, counterweight and a hanging load, plus scaffolding and a progress ring
   on a block that is mid-upgrade (panel 4).

## How to work

Run the harness in `tools/qa/` after every change — see `tools/qa/README.md`.
`boot.js` catches errors, `stress.js` renders a fully built city, and
screenshots are the only way to judge this work. **Look at the screenshots.**
Several bugs in this project passed every assertion and were only visible in an
image: the whole unowned city rendering black because a colour helper returned
`NaN`, cabs drawing through towers, and a coaching panel covering the control
it pointed at.

Measure before optimising. `fps-ab.js` interleaves two builds because absolute
FPS on a shared machine swings 27–39 for the *same* build. A previous pass cut
canvas calls from 2,530 to 612 per frame and gained nothing measurable.

## Do not break

- No dependencies, no build step, single file, runs from `file://`.
- Economy medians: a greedy bot reaches roughly $1.2B net worth in 60 simulated
  minutes (`bench-ab.js`, medians of ≥5 runs, ~7x run-to-run variance).
- Save compatibility: `save-fuzz.js` must stay at 12/12.
- Accessibility: colour-safe palette (C) must still re-tint anything new, and
  `prefers-reduced-motion` must still suppress new animation.
