// Palmline Cover Studio — colour grades.
//
// A grade is three things applied in order over a panel's photo:
//   1. a canvas `filter` string (saturation, contrast, brightness),
//   2. a two-stop gradient overlay drawn with a blend mode,
//   3. a vignette that darkens the corners so the lettering pops.
// `swatch` is the CSS gradient the editor shows for the grade button.
// The grades are named after the light they imitate, never after a game.

export const GRADES = [
  {
    id: 'sunset',
    name: 'Sunset',
    swatch: 'linear-gradient(135deg,#ffb347,#ff5e62 55%,#b24592)',
    filter: 'saturate(1.35) contrast(1.08) brightness(1.03)',
    overlay: { angle: 180, stops: [[0, '#ff9a3c'], [1, '#ff2e88']], blend: 'overlay', alpha: 0.32 },
    tint: null,
    vignette: 0.5,
  },
  {
    id: 'neon',
    name: 'Neon',
    swatch: 'linear-gradient(135deg,#00f5d4,#00bbff 50%,#ff00aa)',
    filter: 'saturate(1.85) contrast(1.15) brightness(1.02) hue-rotate(-8deg)',
    overlay: { angle: 135, stops: [[0, '#00e5ff'], [1, '#ff00a8']], blend: 'overlay', alpha: 0.34 },
    tint: null,
    vignette: 0.45,
  },
  {
    id: 'vice',
    name: 'Vice',
    swatch: 'linear-gradient(135deg,#ff6ec7,#7873f5 55%,#4adede)',
    filter: 'saturate(1.5) contrast(1.1) brightness(1.02)',
    overlay: { angle: 135, stops: [[0, '#ff6ec7'], [1, '#2dd4d4']], blend: 'soft-light', alpha: 0.55 },
    tint: null,
    vignette: 0.5,
  },
  {
    id: 'dusk',
    name: 'Dusk',
    swatch: 'linear-gradient(135deg,#5b2a86,#2c1a4d 55%,#0f0c29)',
    filter: 'saturate(1.2) contrast(1.06) brightness(0.94)',
    overlay: { angle: 180, stops: [[0, '#7b4bd6'], [1, '#141033']], blend: 'overlay', alpha: 0.4 },
    tint: null,
    vignette: 0.65,
  },
  {
    id: 'heat',
    name: 'Heat',
    swatch: 'linear-gradient(135deg,#ffe259,#ffa751 55%,#e73827)',
    filter: 'saturate(1.45) contrast(1.12) brightness(1.05) sepia(0.18)',
    overlay: { angle: 180, stops: [[0, '#ffb347'], [1, '#e73827']], blend: 'soft-light', alpha: 0.5 },
    tint: null,
    vignette: 0.45,
  },
  {
    id: 'noir',
    name: 'Noir',
    swatch: 'linear-gradient(135deg,#e8e8e8,#8a8a8a 55%,#111111)',
    filter: 'grayscale(0.85) contrast(1.25) brightness(0.96)',
    overlay: { angle: 180, stops: [[0, '#9db4d4'], [1, '#0a0a12']], blend: 'overlay', alpha: 0.28 },
    tint: null,
    vignette: 0.7,
  },
  {
    id: 'palm',
    name: 'Palm',
    swatch: 'linear-gradient(135deg,#a8e063,#56ab2f 55%,#0ba360)',
    filter: 'saturate(1.3) contrast(1.05) brightness(1.02)',
    overlay: { angle: 135, stops: [[0, '#3ddc97'], [1, '#0b6e4f']], blend: 'soft-light', alpha: 0.5 },
    tint: null,
    vignette: 0.4,
  },
  {
    id: 'chrome',
    name: 'Chrome',
    swatch: 'linear-gradient(135deg,#fdfbfb,#c9d6df 50%,#8e9eab)',
    filter: 'saturate(0.9) contrast(1.2) brightness(1.08)',
    overlay: { angle: 135, stops: [[0, '#e8f0f8'], [1, '#5a6b7d']], blend: 'soft-light', alpha: 0.45 },
    tint: null,
    vignette: 0.35,
  },
  {
    id: 'midnight',
    name: 'Midnight',
    swatch: 'linear-gradient(135deg,#141e30,#243b55 55%,#050810)',
    filter: 'saturate(1.1) contrast(1.1) brightness(0.85)',
    overlay: { angle: 180, stops: [[0, '#274b8f'], [1, '#020617']], blend: 'overlay', alpha: 0.45 },
    tint: null,
    vignette: 0.75,
  },
];

/** The grade with this id, or Sunset when the id is unknown. */
export function gradeById(id) {
  return GRADES.find((entry) => entry.id === id) ?? GRADES[0];
}
