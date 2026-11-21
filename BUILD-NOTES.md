# Build notes — Lantern Harbor

## The game

**Lantern Harbor** is an original spot-the-difference game set in one
invented harbor town, Pell Harbor, at three times of day. Every scene is
painted twice, side by side, entirely in code with Canvas 2D vector shapes —
there are no image files, no libraries and no network requests. Vanilla JS
ES modules only.

How a scene becomes two pictures: each level has one painter in
`game/js/scenes.js` that reads a set of named variant flags. The left
picture is painted with the level's `base` flags from
`game/js/differences.js`; the right picture with `base` plus every
difference's `set`. So the differences are data — a flag flip plus a
hotspot (x, y, radius in the 580×580 panel) — and the two panels provably
differ only where a difference says so. Scenes are painted once per level
onto offscreen canvases (`game/js/render.js`); the frame loop only blits
and draws the player's marks.

Play: click a difference in either panel and a gold ring marks it on both,
with a synthesized pop (`game/js/audio.js`, WebAudio, no audio files). The
HUD shows the level, **Found X of Y**, **Z to go**, mistakes, score, and a
countdown bar that turns red under 30 seconds. A wrong click costs 5
seconds and leaves a fading red cross on the panel clicked. **Hint**
(button or `H`) pulses soft rings over the neighbourhood of one unfound
difference for 1.5 s — 3 hints per level, 15 points each. `P`/`Esc` pauses.
Finishing a level pays a time bonus equal to the seconds left; running out
of time offers a retry of the level. A found difference posts its one-line
story to the ticker under the panels ("Found: The harbor cat sits on the
pier barrel…"). Start screen, level-complete, pause, time-up and win
screens are overlays from `game/js/main.js`, which also owns the state
machine and the clock.

Difficulty rises by count and by subtlety: 7 differences at dawn (whole
objects, bold colours), 9 at noon (a clock's minute hand, one pennant, a
shifted cart), 11 at dusk (a flipped crescent, a lantern 18 px lower, a
reflection gone) with smaller hotspots.

## The levels and their differences

Hotspots are panel coordinates (x, y) with click radius r, exactly as in
`game/js/differences.js`. These are also the coordinates to click when
playing the game for real to reach a mid-game state.

### Level 1 · First Light — dawn harbor, 180 s, 7 differences

| id | hotspot | r | what differs |
|---|---|---|---|
| lamp | 100, 195 | 28 | The lighthouse lamp burns in one picture and is dark in the other. |
| gull | 330, 96 | 24 | Three gulls cross the dawn sky in one picture, only two in the other. |
| window | 300, 294 | 22 | A window of the tall blue-roofed house is lit in one picture, dark in the other. |
| sail | 258, 400 | 30 | The big mainsail is cream in one picture and coral in the other. |
| buoy | 428, 452 | 22 | A red channel buoy bobs in one picture and is gone in the other. |
| flag | 334, 462 | 24 | The teal flag flies from the pier pole in one picture only. |
| cat | 252, 482 | 26 | The harbor cat sits on the pier barrel in one picture and is off about its business in the other. |

### Level 2 · Market Day — noon market square, 240 s, 9 differences

| id | hotspot | r | what differs |
|---|---|---|---|
| bunting | 422, 134 | 22 | One pennant is missing from the bunting strung over the square. |
| clock | 290, 150 | 28 | The tower clock reads the hour in one picture and twenty past in the other. |
| sign | 52, 232 | 24 | The hanging shop sign shows a fish in one picture and an anchor in the other. |
| lantern | 258, 294 | 20 | A small lantern hangs under the middle stall awning in one picture only. |
| awning | 460, 296 | 30 | The right-hand stall awning is striped teal in one picture and coral in the other. |
| pigeon | 222, 452 | 22 | A pigeon perches on the fountain rim in one picture and has flown in the other. |
| fruit | 120, 462 | 36 | The crates in front of the left stall hold apples in one picture and oranges in the other. |
| sacks | 180, 490 | 24 | Three grain sacks lean by the left stall in one picture, two in the other. |
| cart | 452, 516 | 32 | The hand cart stands a pace to the left in one picture. |

### Level 3 · Lantern Dusk — festival evening, 300 s, 11 differences

| id | hotspot | r | what differs |
|---|---|---|---|
| star | 150, 70 | 20 | One bright star with a sparkle cross shines in one picture and is out in the other. |
| moon | 478, 88 | 28 | The crescent moon faces the other way in one picture. |
| firework | 92, 128 | 26 | The firework over the lighthouse bursts gold in one picture and violet in the other. |
| lanterncolor | 163, 180 | 20 | One lantern on the upper string is rose in one picture and teal in the other. |
| beam | 240, 206 | 30 | The lighthouse beam sweeps the bay in one picture and is switched off in the other. |
| drop | 396, 285 | 22 | One lantern on the lower string hangs lower in one picture. |
| window | 416, 332 | 18 | A shore-house window glows in one picture and is dark in the other. |
| owl | 508, 276 | 20 | An owl keeps watch from the last roof in one picture only. |
| boatflag | 480, 434 | 18 | The small boat mast flag is amber in one picture and teal in the other. |
| lightrefl | 92, 442 | 24 | The lighthouse lamp lays a shimmering path on the water in one picture only. |
| boatrefl | 292, 512 | 28 | The festival boat reflection ripples under the hull in one picture only. |

## Run it locally

```sh
node serve.ts            # serves game/ at http://localhost:8080
# or: node serve.ts --port 8901
```

Open the address in desktop Chrome. The layout is built for ~1280×800:
two 580×580 panels in cream frames, HUD above, help line below.

Hand-in check:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` into the output directory and
writes `dossier.json` via `buildDossier` from `vendor/makefun-game.ts`
(copied from the kit unchanged — sha256
dc67187521b24025ff952f8c231485a6eb92d6d71d29edd2a08154ffb4376129).
With an empty `screenshots/` it refuses, by design of the library: "the
first is the cover". Once screenshots exist it runs clean (verified, see
below).

## Screenshots — TAKEN (2026-11-21)

`screenshots/` holds the four renders, taken in a real Chromium browser
(Playwright, viewport 1280x800) served from this repo root, using the
game's own `?shot=` mode — each state reached through the game's real
`markFound` path with the clock frozen, no compositing or editing:

1. `1-cover-dawn.jpg` (108,656 B) — level 1, lamp/sail/cat found (3 found, 4 to go)
2. `2-market-day.jpg` (130,178 B) — level 2, 4 found, 5 to go
3. `3-lantern-dusk.jpg` (107,346 B) — level 3, 5 found, 6 to go
4. `4-win.jpg` (74,861 B) — win screen, final score 2913

All four are whole JPEGs, 1280x800, each <= 256 KiB. The parent agent
visually verified each one (both panels, HUD counters, found markers,
ticker text) before packaging.

## Verification results (this build session)

Static checks:

- All five `game/js/*.js` files parse as ES modules (`node --check` on
  `.mjs` copies): audio, differences, main, render, scenes — OK.
- `game/index.html` references resolve inside `game/` (`styles.css`,
  `js/main.js`); all module imports are relative and resolve inside
  `game/`; no `http:`/`https:`/protocol-relative URL anywhere in `game/`
  (grep-verified).
- Gate numbers: `game/` holds 8 entries (limit 993) and 70,230 bytes
  (limit 48 MiB); `game/index.html` is 1,679 bytes (limit 1 MiB).
- `serve.ts` serves `/`, `js/main.js`, `styles.css` with 200s and refuses
  paths outside `game/`.

Painter checks (recording stub-canvas harness in Node, 100+ assertions):

- Every level paints both variants without errors. Recorded draw ops:
  dawn 250 (left) / 225 (right), market 475 / 434, dusk 487 / 454.
- Every difference's flag exists in its level's `base`, changes the value,
  and is read by a painter; every `base` flag is read by a painter (no
  dead or misspelled flags — a difference that paints identically on both
  panels cannot slip through).
- All 27 hotspots lie inside the panel; no two hotspots in a level
  overlap.
- Promised changes are visible in the recorded draw streams: the dawn
  lamp fills gold on the left and grey `#8fa5b5` on the right; the coral
  sail appears only on the right; market's right panel records fewer ops
  (missing pennant, lantern, pigeon, sack); the dusk beam's gradient is
  created only on the left.

Hand-in checks (scratch copy in /tmp with placeholder images, so the real
`screenshots/` was never polluted):

- `main.ts` runs clean; three runs produce byte-identical outputs
  (dossier sha256 6c0e87e13247e72c54645b77c0c94e8b315b2c37b18c6ab3b4b5b6a9a0181c22,
  159,123 bytes ≤ 1.5 MiB), and an independent `buildDossier` rebuild from
  the output's `game/` + `screenshots/` reproduces `dossier.json` byte
  for byte (same sha256).
- In the real repo (empty `screenshots/`), `main.ts` copies `game/`
  correctly and then refuses at the dossier step with the library's
  "screenshots/ holds no image" error — the expected state until the
  screenshots above are taken.

Not verified here: live play in a real browser (no working browser was
available to this session — see Screenshots). The click path, timer,
hint, pause and overlay flow are exercised only by the code paths the
shot mode shares with them (`markFound`, HUD updates) plus the static
checks; a human or the parent agent should play one level end to end in
Chrome when taking the screenshots.
