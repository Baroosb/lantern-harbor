// differences.js — the level and difference data for Lantern Harbor.
//
// Every level is one scene of the same little harbor town, painted twice by a
// painter in scenes.js. A painter reads a "variant" object of named flags:
// the left picture is painted with the level's `base` flags, the right
// picture with `base` plus the `set` of every difference in the level. So a
// difference is pure data: the flag it flips, and the hotspot (x, y, radius
// in panel coordinates, panels are 580 by 580) where a click counts as
// finding it. Nothing about a difference lives in the painters beyond the
// flag they read, and nothing about the scenes lives here beyond the flags.

export const PANEL_SIZE = 580;

export const LEVELS = [
  {
    id: 'dawn',
    painter: 'dawn',
    title: 'First Light',
    subtitle: 'Pell Harbor wakes up',
    timeSeconds: 180,
    base: {
      lampLit: true,
      thirdGull: true,
      sailColor: 'cream',
      tallWinLit: true,
      catOnBarrel: true,
      pierFlag: true,
      buoy: true,
    },
    diffs: [
      { id: 'lamp', x: 100, y: 195, r: 28, set: { lampLit: false },
        blurb: 'The lighthouse lamp burns in one picture and is dark in the other.' },
      { id: 'gull', x: 330, y: 96, r: 24, set: { thirdGull: false },
        blurb: 'Three gulls cross the dawn sky in one picture, only two in the other.' },
      { id: 'window', x: 300, y: 294, r: 22, set: { tallWinLit: false },
        blurb: 'A window of the tall blue-roofed house is lit in one picture, dark in the other.' },
      { id: 'sail', x: 258, y: 400, r: 30, set: { sailColor: 'coral' },
        blurb: 'The big mainsail is cream in one picture and coral in the other.' },
      { id: 'buoy', x: 428, y: 452, r: 22, set: { buoy: false },
        blurb: 'A red channel buoy bobs in one picture and is gone in the other.' },
      { id: 'flag', x: 334, y: 462, r: 24, set: { pierFlag: false },
        blurb: 'The teal flag flies from the pier pole in one picture only.' },
      { id: 'cat', x: 252, y: 482, r: 26, set: { catOnBarrel: false },
        blurb: 'The harbor cat sits on the pier barrel in one picture and is off about its business in the other.' },
    ],
  },
  {
    id: 'market',
    painter: 'market',
    title: 'Market Day',
    subtitle: 'The square fills by noon',
    timeSeconds: 240,
    base: {
      clockMinute: 0,
      signGlyph: 'fish',
      buntingFlag: true,
      awningB: 'teal',
      stallLantern: true,
      fruit: 'apples',
      pigeon: true,
      sackCount: 3,
      cartShift: 0,
    },
    diffs: [
      { id: 'bunting', x: 422, y: 134, r: 22, set: { buntingFlag: false },
        blurb: 'One pennant is missing from the bunting strung over the square.' },
      { id: 'clock', x: 290, y: 150, r: 28, set: { clockMinute: 20 },
        blurb: 'The tower clock reads the hour in one picture and twenty past in the other.' },
      { id: 'sign', x: 52, y: 232, r: 24, set: { signGlyph: 'anchor' },
        blurb: 'The hanging shop sign shows a fish in one picture and an anchor in the other.' },
      { id: 'lantern', x: 258, y: 294, r: 20, set: { stallLantern: false },
        blurb: 'A small lantern hangs under the middle stall awning in one picture only.' },
      { id: 'awning', x: 460, y: 296, r: 30, set: { awningB: 'coral' },
        blurb: 'The right-hand stall awning is striped teal in one picture and coral in the other.' },
      { id: 'pigeon', x: 222, y: 452, r: 22, set: { pigeon: false },
        blurb: 'A pigeon perches on the fountain rim in one picture and has flown in the other.' },
      { id: 'fruit', x: 120, y: 462, r: 36, set: { fruit: 'oranges' },
        blurb: 'The crates in front of the left stall hold apples in one picture and oranges in the other.' },
      { id: 'sacks', x: 180, y: 490, r: 24, set: { sackCount: 2 },
        blurb: 'Three grain sacks lean by the left stall in one picture, two in the other.' },
      { id: 'cart', x: 452, y: 516, r: 32, set: { cartShift: -30 },
        blurb: 'The hand cart stands a pace to the left in one picture.' },
    ],
  },
  {
    id: 'dusk',
    painter: 'dusk',
    title: 'Lantern Dusk',
    subtitle: 'The festival lights come on',
    timeSeconds: 300,
    base: {
      brightStar: true,
      fireworkColor: 'gold',
      moonFlip: false,
      stringLanternColor: 'rose',
      beam: true,
      dropLantern: 0,
      duskWinLit: true,
      owl: true,
      lightReflection: true,
      boatFlagColor: 'amber',
      boatReflection: true,
    },
    diffs: [
      { id: 'star', x: 150, y: 70, r: 20, set: { brightStar: false },
        blurb: 'One bright star with a sparkle cross shines in one picture and is out in the other.' },
      { id: 'moon', x: 478, y: 88, r: 28, set: { moonFlip: true },
        blurb: 'The crescent moon faces the other way in one picture.' },
      { id: 'firework', x: 92, y: 128, r: 26, set: { fireworkColor: 'violet' },
        blurb: 'The firework over the lighthouse bursts gold in one picture and violet in the other.' },
      { id: 'lanterncolor', x: 163, y: 180, r: 20, set: { stringLanternColor: 'teal' },
        blurb: 'One lantern on the upper string is rose in one picture and teal in the other.' },
      { id: 'beam', x: 240, y: 206, r: 30, set: { beam: false },
        blurb: 'The lighthouse beam sweeps the bay in one picture and is switched off in the other.' },
      { id: 'drop', x: 396, y: 285, r: 22, set: { dropLantern: 18 },
        blurb: 'One lantern on the lower string hangs lower in one picture.' },
      { id: 'window', x: 416, y: 332, r: 18, set: { duskWinLit: false },
        blurb: 'A shore-house window glows in one picture and is dark in the other.' },
      { id: 'owl', x: 508, y: 276, r: 20, set: { owl: false },
        blurb: 'An owl keeps watch from the last roof in one picture only.' },
      { id: 'boatflag', x: 480, y: 434, r: 18, set: { boatFlagColor: 'teal' },
        blurb: 'The small boat mast flag is amber in one picture and teal in the other.' },
      { id: 'lightrefl', x: 92, y: 442, r: 24, set: { lightReflection: false },
        blurb: 'The lighthouse lamp lays a shimmering path on the water in one picture only.' },
      { id: 'boatrefl', x: 292, y: 512, r: 28, set: { boatReflection: false },
        blurb: 'The festival boat reflection ripples under the hull in one picture only.' },
    ],
  },
];

// rightVariant(level) — the flags the right picture is painted with: the
// base flags with every difference's `set` laid over them.
export function rightVariant(level) {
  const merged = { ...level.base };
  for (const diff of level.diffs) Object.assign(merged, diff.set);
  return merged;
}
