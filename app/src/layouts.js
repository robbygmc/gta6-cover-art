// Palmline Cover Studio — poster layouts.
//
// Every layout is a function of the cover's pixel size (W, H) and returns
// the panels it is made of: rectangles in pixels plus an optional slant.
// A slanted panel is drawn as a parallelogram: its top edge is shifted
// right by `slant` pixels relative to its bottom edge, the GTA poster
// look. A gutter of 1.4% of the short side separates the panels; the
// background behind the gaps is the cover's dark base colour.
//
// Panel order matters: the first panels are the big ones, and the first
// three panels carry the cast tags.

export const GUTTER_FRACTION = 0.014;

/** One panel: its rectangle in pixels and its top-edge shift. */
function panel(x, y, w, h, slant = 0) {
  return { x, y, w, h, slant };
}

/** The gutter in pixels for a cover of this size. */
function gutter(W, H) {
  return Math.round(Math.min(W, H) * GUTTER_FRACTION);
}

// --- the eight layouts -------------------------------------------------

function viceGrid(W, H) {
  const g = gutter(W, H);
  const hw = (W - g) / 2;
  const hh = (H - g) / 2;
  return [
    panel(0, 0, hw, hh),
    panel(hw + g, 0, hw, hh),
    panel(0, hh + g, hw, hh),
    panel(hw + g, hh + g, hw, hh),
  ];
}

function heroLeft(W, H) {
  const g = gutter(W, H);
  const leftW = Math.round(W * 0.6);
  const rightX = leftW + g;
  const rightW = W - rightX;
  const hh = (H - g) / 2;
  return [
    panel(0, 0, leftW, H),
    panel(rightX, 0, rightW, hh),
    panel(rightX, hh + g, rightW, hh),
  ];
}

function heroRight(W, H) {
  const g = gutter(W, H);
  const rightW = Math.round(W * 0.6);
  const leftW = W - rightW - g;
  const hh = (H - g) / 2;
  return [
    panel(0, 0, leftW, hh),
    panel(0, hh + g, leftW, hh),
    panel(leftW + g, 0, rightW, H),
  ];
}

function strip(W, H) {
  const g = gutter(W, H);
  const bandH = (H - 2 * g) / 3;
  return [
    panel(0, 0, W, bandH),
    panel(0, bandH + g, W, bandH),
    panel(0, 2 * (bandH + g), W, bandH),
  ];
}

function palmline(W, H) {
  // Three full-width diagonal bands, the slant alternating so the poster
  // reads like a slash of sunset. Each band is a parallelogram.
  const g = gutter(W, H);
  const bandH = (H - 2 * g) / 3;
  const s = Math.round(W * 0.055);
  return [
    panel(0, 0, W, bandH, s),
    panel(0, bandH + g, W, bandH, -s),
    panel(0, 2 * (bandH + g), W, bandH, s),
  ];
}

function billboard(W, H) {
  const g = gutter(W, H);
  const heroH = Math.round(H * 0.64);
  const stripY = heroH + g;
  const stripH = H - stripY;
  const cellW = (W - 2 * g) / 3;
  return [
    panel(0, 0, W, heroH),
    panel(0, stripY, cellW, stripH),
    panel(cellW + g, stripY, cellW, stripH),
    panel(2 * (cellW + g), stripY, cellW, stripH),
  ];
}

function triptych(W, H) {
  // Three vertical columns; the middle one stands taller than its
  // neighbours, like a centre spread.
  const g = gutter(W, H);
  const colW = (W - 2 * g) / 3;
  const inset = Math.round(H * 0.07);
  return [
    panel(0, inset, colW, H - 2 * inset),
    panel(colW + g, 0, colW, H),
    panel(2 * (colW + g), inset, colW, H - 2 * inset),
  ];
}

function mosaic(W, H) {
  const g = gutter(W, H);
  const heroH = Math.round(H * 0.52);
  const gridY = heroH + g;
  const gridH = H - gridY;
  const cw = (W - g) / 2;
  const ch = (gridH - g) / 2;
  return [
    panel(0, 0, W, heroH),
    panel(0, gridY, cw, ch),
    panel(cw + g, gridY, cw, ch),
    panel(0, gridY + ch + g, cw, ch),
    panel(cw + g, gridY + ch + g, cw, ch),
  ];
}

// --- registry ----------------------------------------------------------

export const LAYOUTS = [
  { id: 'vice-grid', name: 'Vice Grid', blurb: 'Classic 2 × 2 poster grid', build: viceGrid },
  { id: 'hero-left', name: 'Hero Left', blurb: 'One big moment, two beside it', build: heroLeft },
  { id: 'hero-right', name: 'Hero Right', blurb: 'Mirror of Hero Left', build: heroRight },
  { id: 'strip', name: 'Strip', blurb: 'Three stacked cinema bands', build: strip },
  { id: 'palmline', name: 'Palmline', blurb: 'Slanted diagonal bands', build: palmline },
  { id: 'billboard', name: 'Billboard', blurb: 'Big hero over three panels', build: billboard },
  { id: 'triptych', name: 'Triptych', blurb: 'Three columns, tall centre', build: triptych },
  { id: 'mosaic', name: 'Mosaic', blurb: 'Hero over a 2 × 2 grid', build: mosaic },
];

/** The layout with this id, or the first layout when the id is unknown. */
export function layoutById(id) {
  return LAYOUTS.find((entry) => entry.id === id) ?? LAYOUTS[0];
}

/** The panels of a layout at a cover size, in pixels. */
export function panelsFor(layoutId, W, H) {
  return layoutById(layoutId).build(W, H);
}

/** How many panels a layout has. */
export function panelCount(layoutId) {
  return panelsFor(layoutId, 100, 100).length;
}
