// Palmline Cover Studio — sample photos.
//
// Two photos ship with the app (app/samples/, made with an image model
// for make.fun and free to use), and a third scene is drawn by code:
// a flat sunset street with palms and a neon skyline, so the app always
// has a cover-ready photo even before the user uploads one.
//
// A photo is { id, label, img } where img is an <img> or a <canvas> —
// the renderer draws either with drawImage, so generated art and loaded
// photos are interchangeable.

export const SAMPLE_DEFS = [
  { id: 'pier', label: 'Pier Sunset', src: 'samples/pier.jpg' },
  { id: 'boulevard', label: 'Boulevard Night', src: 'samples/boulevard.jpg' },
  { id: 'sunset-street', label: 'Sunset Street (drawn)', generated: true },
];

/** Load one image file, resolving with the element once it decodes. */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

// --- the drawn scene ---------------------------------------------------

/** A palm silhouette: a curved trunk and seven drooping fronds. */
function drawPalm(ctx, x, y, height, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#160a24';
  ctx.fillStyle = '#160a24';
  ctx.lineWidth = Math.max(3, height * 0.035);
  ctx.lineCap = 'round';
  // Trunk, leaning with the wind.
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(lean * 0.4, -height * 0.55, lean, -height);
  ctx.stroke();
  // Fronds fan out from the crown.
  ctx.translate(lean, -height);
  for (let i = 0; i < 7; i++) {
    const angle = -Math.PI * (0.08 + (i * 0.84) / 6);
    const len = height * (0.42 + (i % 2) * 0.08);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(
      Math.cos(angle) * len * 0.6,
      Math.sin(angle) * len * 0.6 - height * 0.08,
      Math.cos(angle) * len,
      Math.sin(angle) * len + height * 0.12,
    );
    ctx.lineWidth = Math.max(2, height * 0.02);
    ctx.stroke();
  }
  // Coconuts.
  ctx.beginPath();
  ctx.arc(-height * 0.03, height * 0.02, height * 0.025, 0, Math.PI * 2);
  ctx.arc(height * 0.04, height * 0.03, height * 0.022, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Draw the flat sunset street: a gradient sky, a low sun, a skyline of
 * lit windows, a perspective road and two palms. Returns the canvas.
 */
export function makeSunsetStreet(width = 1080, height = 1350) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const W = width;
  const H = height;

  // Sky: peach at the horizon, magenta, then deep violet up top.
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.62);
  sky.addColorStop(0, '#2b1055');
  sky.addColorStop(0.45, '#7597de');
  sky.addColorStop(0.62, '#ff7e5f');
  sky.addColorStop(0.78, '#feb47b');
  sky.addColorStop(1, '#ffd194');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H * 0.62);

  // Sun, low and huge, with a soft halo.
  const sunX = W * 0.5;
  const sunY = H * 0.52;
  const sunR = W * 0.16;
  const halo = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.6);
  halo.addColorStop(0, 'rgba(255, 214, 120, 0.85)');
  halo.addColorStop(1, 'rgba(255, 214, 120, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H * 0.62);
  ctx.fillStyle = '#fff3b0';
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  // Thin cloud streaks catching the light.
  ctx.fillStyle = 'rgba(255, 190, 160, 0.5)';
  for (const [cy, cw, ch] of [[0.16, 0.7, 0.012], [0.24, 0.5, 0.01], [0.33, 0.62, 0.014], [0.42, 0.4, 0.009]]) {
    ctx.beginPath();
    ctx.ellipse(W * 0.5, H * cy, W * cw * 0.5, H * ch, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Skyline: dark towers with a few lit windows, back and front rows.
  // Both rows leave the centre open, so the low sun stays visible
  // between them instead of hiding behind a rooftop.
  const horizon = H * 0.62;
  const backRow = [[0.02, 0.26, 0.3], [0.66, 0.2, 0.42], [0.88, 0.12, 0.3]];
  ctx.fillStyle = '#3a1c5e';
  for (const [bx, bw, bh] of backRow) {
    ctx.fillRect(W * bx, horizon - H * bh, W * bw, H * bh);
  }
  const frontRow = [[0.06, 0.14, 0.2], [0.8, 0.16, 0.24]];
  ctx.fillStyle = '#1d0b33';
  for (const [bx, bw, bh] of frontRow) {
    ctx.fillRect(W * bx, horizon - H * bh, W * bw, H * bh);
  }
  // Lit windows, a sparse warm scatter — never on the sun's disc.
  ctx.fillStyle = 'rgba(255, 205, 110, 0.9)';
  for (let i = 0; i < 90; i++) {
    const wx = (i * 97.3) % 100 / 100 * W;
    const wy = horizon - ((i * 57.7) % 100) / 100 * H * 0.38;
    const dx = (wx - sunX) / sunR;
    const dy = (wy - sunY) / sunR;
    if (dx * dx + dy * dy < 1.21) continue;
    ctx.fillRect(wx, wy, Math.max(3, W * 0.008), Math.max(4, H * 0.006));
  }

  // Neon sign blocks on two of the towers.
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(W * 0.075, horizon - H * 0.175, W * 0.11, H * 0.02);
  ctx.fillStyle = '#00e5ff';
  ctx.fillRect(W * 0.815, horizon - H * 0.215, W * 0.13, H * 0.018);

  // Street: dark asphalt widening toward the viewer, with a centre line.
  ctx.fillStyle = '#170b26';
  ctx.beginPath();
  ctx.moveTo(W * 0.42, horizon);
  ctx.lineTo(W * 0.58, horizon);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 210, 120, 0.85)';
  ctx.lineWidth = Math.max(3, W * 0.008);
  ctx.setLineDash([H * 0.045, H * 0.035]);
  ctx.beginPath();
  ctx.moveTo(W * 0.5, horizon + 4);
  ctx.lineTo(W * 0.5, H);
  ctx.stroke();
  ctx.setLineDash([]);

  // Sidewalks and their warm edge light.
  ctx.fillStyle = '#2c1445';
  ctx.beginPath();
  ctx.moveTo(0, horizon);
  ctx.lineTo(W * 0.42, horizon);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W * 0.58, horizon);
  ctx.lineTo(W, horizon);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();

  // Palms frame the street, one each side.
  drawPalm(ctx, W * 0.12, H * 0.98, H * 0.34, W * 0.05);
  drawPalm(ctx, W * 0.88, H * 0.96, H * 0.3, -W * 0.045);

  // A lone car silhouette waiting at the light, headlights on.
  ctx.fillStyle = '#0d0518';
  ctx.beginPath();
  ctx.moveTo(W * 0.36, H * 0.86);
  ctx.lineTo(W * 0.42, H * 0.815);
  ctx.lineTo(W * 0.58, H * 0.815);
  ctx.lineTo(W * 0.64, H * 0.86);
  ctx.lineTo(W * 0.64, H * 0.885);
  ctx.lineTo(W * 0.36, H * 0.885);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 240, 180, 0.95)';
  ctx.beginPath();
  ctx.arc(W * 0.4, H * 0.875, W * 0.012, 0, Math.PI * 2);
  ctx.arc(W * 0.6, H * 0.875, W * 0.012, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

// --- loading -----------------------------------------------------------

/** Load every sample photo; the drawn scene needs no network at all. */
export async function loadSamplePhotos() {
  const photos = [];
  for (const def of SAMPLE_DEFS) {
    if (def.generated) {
      photos.push({ id: def.id, label: def.label, img: makeSunsetStreet() });
    } else {
      photos.push({ id: def.id, label: def.label, img: await loadImage(def.src) });
    }
  }
  return photos;
}
