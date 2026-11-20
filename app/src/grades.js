// Palmline Cover Studio — colour grades.
// A grade is a canvas filter applied while the photo is drawn, plus a
// translucent tint washed over the panel and a vignette strength. All of
// the values below are the studio's own recipe, tuned for a Vice City
// sunset / neon poster look.

export const GRADES = {
  sunset: {
    label: 'Sunset',
    filter: 'saturate(1.35) contrast(1.08) brightness(1.05)',
    tint: '#ff7a18',
    tintAlpha: 0.16,
    tintBlend: 'overlay',
    vignette: 0.3,
  },
  neon: {
    label: 'Neon',
    filter: 'saturate(1.85) contrast(1.15) brightness(1.02)',
    tint: '#ff2d78',
    tintAlpha: 0.14,
    tintBlend: 'overlay',
    vignette: 0.32,
  },
  vice: {
    label: 'Vice',
    filter: 'saturate(1.5) contrast(1.1) hue-rotate(-14deg)',
    tint: '#ff5e8a',
    tintAlpha: 0.13,
    tintBlend: 'soft-light',
    vignette: 0.3,
  },
  dusk: {
    label: 'Dusk',
    filter: 'saturate(1.2) contrast(1.06) brightness(0.92)',
    tint: '#5b2a86',
    tintAlpha: 0.2,
    tintBlend: 'overlay',
    vignette: 0.38,
  },
  heat: {
    label: 'Heat',
    filter: 'saturate(1.6) contrast(1.2) brightness(1.03)',
    tint: '#ff3d00',
    tintAlpha: 0.15,
    tintBlend: 'overlay',
    vignette: 0.3,
  },
  noir: {
    label: 'Noir',
    filter: 'grayscale(0.85) contrast(1.28) brightness(0.95)',
    tint: '#101014',
    tintAlpha: 0.12,
    tintBlend: 'multiply',
    vignette: 0.42,
  },
  palm: {
    label: 'Palm',
    filter: 'saturate(1.3) sepia(0.28) contrast(1.05)',
    tint: '#0e7a6b',
    tintAlpha: 0.13,
    tintBlend: 'soft-light',
    vignette: 0.3,
  },
  chrome: {
    label: 'Chrome',
    filter: 'saturate(0.9) contrast(1.32) brightness(1.08)',
    tint: '#cfd8dc',
    tintAlpha: 0.1,
    tintBlend: 'overlay',
    vignette: 0.26,
  },
  midnight: {
    label: 'Midnight',
    filter: 'saturate(1.45) contrast(1.12) brightness(0.85) hue-rotate(16deg)',
    tint: '#0a1a4f',
    tintAlpha: 0.22,
    tintBlend: 'overlay',
    vignette: 0.4,
  },
};

export const GRADE_KEYS = Object.keys(GRADES);
