// Palmline Cover Studio — panel layouts.
// Every layout is a list of panels. A panel is a polygon in fractions of
// the cover (x/y 0..1), so the same layout works at 1920x1080, 1080x1350
// and 1080x1080. `tag` hints where the cast chips go.

function rect(x, y, w, h) {
  return [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ];
}

// A rectangle whose vertical dividers lean: the top edge slides right by
// `lean` and the bottom edge slides left by the same amount.
function leanRect(x, y, w, h, lean) {
  return [
    [x + lean, y],
    [x + w + lean, y],
    [x + w - lean, y + h],
    [x - lean, y + h],
  ];
}

function panel(pts, tag) {
  return { pts, tag };
}

export const LAYOUTS = {
  'vice-grid': {
    label: 'Vice Grid',
    blurb: 'Four equal frames, classic poster grid',
    panels: [
      panel(rect(0, 0, 0.5, 0.5), 'hero'),
      panel(rect(0.5, 0, 0.5, 0.5), 'side'),
      panel(rect(0, 0.5, 0.5, 0.5), 'side'),
      panel(rect(0.5, 0.5, 0.5, 0.5), 'side'),
    ],
  },
  'hero-left': {
    label: 'Hero Left',
    blurb: 'One big frame left, two stacked right',
    panels: [
      panel(rect(0, 0, 0.56, 1), 'hero'),
      panel(rect(0.56, 0, 0.44, 0.5), 'side'),
      panel(rect(0.56, 0.5, 0.44, 0.5), 'side'),
    ],
  },
  'hero-right': {
    label: 'Hero Right',
    blurb: 'Two stacked left, one big frame right',
    panels: [
      panel(rect(0, 0, 0.44, 0.5), 'side'),
      panel(rect(0, 0.5, 0.44, 0.5), 'side'),
      panel(rect(0.44, 0, 0.56, 1), 'hero'),
    ],
  },
  strip: {
    label: 'Strip',
    blurb: 'Three leaning vertical strips',
    panels: [
      panel(leanRect(0, 0, 0.34, 1, 0.02), 'hero'),
      panel(leanRect(0.33, 0, 0.34, 1, 0.02), 'side'),
      panel(leanRect(0.66, 0, 0.34, 1, 0.02), 'side'),
    ],
  },
  palmline: {
    label: 'Palmline',
    blurb: 'A diagonal sash splits the cover in two',
    panels: [
      panel(
        [
          [0, 0],
          [1, 0],
          [1, 0.44],
          [0, 0.8],
        ],
        'hero',
      ),
      panel(
        [
          [0, 0.8],
          [1, 0.44],
          [1, 1],
          [0, 1],
        ],
        'side',
      ),
    ],
  },
  billboard: {
    label: 'Billboard',
    blurb: 'Wide hero on top, three frames below',
    panels: [
      panel(rect(0, 0, 1, 0.6), 'hero'),
      panel(rect(0, 0.6, 0.34, 0.4), 'side'),
      panel(rect(0.34, 0.6, 0.33, 0.4), 'side'),
      panel(rect(0.67, 0.6, 0.33, 0.4), 'side'),
    ],
  },
  triptych: {
    label: 'Triptych',
    blurb: 'Wide centre frame flanked by two narrow ones',
    panels: [
      panel(rect(0, 0, 0.25, 1), 'side'),
      panel(rect(0.25, 0, 0.5, 1), 'hero'),
      panel(rect(0.75, 0, 0.25, 1), 'side'),
    ],
  },
  mosaic: {
    label: 'Mosaic',
    blurb: 'Five frames, big opener top-left',
    panels: [
      panel(rect(0, 0, 0.62, 0.55), 'hero'),
      panel(rect(0.62, 0, 0.38, 0.27), 'side'),
      panel(rect(0.62, 0.27, 0.38, 0.28), 'side'),
      panel(rect(0, 0.55, 0.5, 0.45), 'side'),
      panel(rect(0.5, 0.55, 0.5, 0.45), 'side'),
    ],
  },
};

export const LAYOUT_KEYS = Object.keys(LAYOUTS);

// Point-in-polygon (ray casting) on fraction coordinates.
export function panelAt(layoutKey, fx, fy) {
  const layout = LAYOUTS[layoutKey];
  if (!layout) return -1;
  for (let i = 0; i < layout.panels.length; i++) {
    const pts = layout.panels[i].pts;
    let inside = false;
    for (let a = 0, b = pts.length - 1; a < pts.length; b = a++) {
      const [ax, ay] = pts[a];
      const [bx, by] = pts[b];
      if (ay > fy !== by > fy && fx < ((bx - ax) * (fy - ay)) / (by - ay) + ax) {
        inside = !inside;
      }
    }
    if (inside) return i;
  }
  return -1;
}

// Bounding box of a panel in fractions (for cover-fit math).
export function panelBox(pts) {
  let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
  for (const [x, y] of pts) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
