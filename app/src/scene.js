// Palmline Cover Studio — a sunset street scene drawn from scratch.
// No photo needed: this canvas is one of the sample photos ("Sunset
// Street"). Everything here is original vector drawing, so the studio
// always has a cover-ready image even before the user uploads one.

export function makeSunsetScene(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');

  // Sky: deep violet at the top, burning orange at the horizon.
  const sky = x.createLinearGradient(0, 0, 0, h * 0.62);
  sky.addColorStop(0, '#241040');
  sky.addColorStop(0.42, '#7a2a6d');
  sky.addColorStop(0.72, '#ff6a2a');
  sky.addColorStop(1, '#ffc46b');
  x.fillStyle = sky;
  x.fillRect(0, 0, w, h * 0.62);

  // Sun low over the street, with a soft halo.
  const sunX = w * 0.5;
  const sunY = h * 0.52;
  const sunR = h * 0.13;
  const halo = x.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 3.2);
  halo.addColorStop(0, 'rgba(255, 214, 120, 0.85)');
  halo.addColorStop(0.35, 'rgba(255, 140, 60, 0.35)');
  halo.addColorStop(1, 'rgba(255, 140, 60, 0)');
  x.fillStyle = halo;
  x.fillRect(0, 0, w, h * 0.62);
  x.fillStyle = '#ffe9a8';
  x.beginPath();
  x.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  x.fill();
  // A few horizontal heat bands across the disc.
  x.fillStyle = 'rgba(255, 122, 24, 0.5)';
  for (let i = 0; i < 3; i++) {
    const by = sunY - sunR * 0.3 + i * sunR * 0.32;
    x.fillRect(sunX - sunR, by, sunR * 2, sunR * 0.09);
  }

  // Far skyline: dark violet slabs, deliberately leaving a gap in the
  // middle so the sun stays visible.
  const horizon = h * 0.62;
  x.fillStyle = '#3a1850';
  const towers = [
    [0.0, 0.16, 0.1],
    [0.09, 0.24, 0.13],
    [0.2, 0.13, 0.09],
    [0.28, 0.2, 0.11],
    [0.62, 0.18, 0.1],
    [0.71, 0.26, 0.14],
    [0.84, 0.15, 0.09],
    [0.92, 0.22, 0.1],
  ];
  for (const [fx, fw, fh] of towers) {
    x.fillRect(w * fx, horizon - h * fh, w * fw, h * fh);
  }

  // Near buildings: almost black, with a sprinkle of lit windows.
  x.fillStyle = '#160a24';
  const blocks = [
    [0.0, 0.2, 0.2],
    [0.18, 0.13, 0.15],
    [0.3, 0.17, 0.24],
    [0.68, 0.15, 0.2],
    [0.82, 0.18, 0.26],
  ];
  for (const [fx, fw, fh] of blocks) {
    const bx = w * fx;
    const bw = w * fw;
    const bh = h * fh;
    x.fillRect(bx, horizon - bh, bw, bh);
    // Lit windows, deterministic pseudo-random from the block index.
    let seed = Math.round(fx * 1000) + 7;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    x.fillStyle = '#ffd166';
    const cols = Math.max(2, Math.floor(bw / (w * 0.028)));
    const rows = Math.max(2, Math.floor(bh / (h * 0.05)));
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        if (rnd() < 0.42) {
          x.fillRect(
            bx + bw * 0.12 + col * (bw * 0.8 / cols),
            horizon - bh + bh * 0.12 + r * (bh * 0.8 / rows),
            Math.max(2, w * 0.008),
            Math.max(3, h * 0.014),
          );
        }
      }
    }
    x.fillStyle = '#160a24';
  }

  // Neon signs on two of the near blocks.
  x.save();
  x.shadowColor = '#ff2d78';
  x.shadowBlur = w * 0.02;
  x.fillStyle = '#ff5e9c';
  x.fillRect(w * 0.31, horizon - h * 0.2, w * 0.13, h * 0.028);
  x.fillStyle = '#37e0ff';
  x.shadowColor = '#37e0ff';
  x.fillRect(w * 0.83, horizon - h * 0.16, w * 0.11, h * 0.028);
  x.restore();

  // Street: dark asphalt with a warm centre line and side glow.
  const road = x.createLinearGradient(0, horizon, 0, h);
  road.addColorStop(0, '#2a1a33');
  road.addColorStop(1, '#0d0812');
  x.fillStyle = road;
  x.fillRect(0, horizon, w, h - horizon);
  x.strokeStyle = 'rgba(255, 196, 107, 0.85)';
  x.lineWidth = Math.max(2, h * 0.006);
  x.setLineDash([w * 0.05, w * 0.035]);
  x.beginPath();
  x.moveTo(w * 0.5, horizon);
  x.lineTo(w * 0.5, h);
  x.stroke();
  x.setLineDash([]);
  // Wet-road reflection of the sun.
  const refl = x.createLinearGradient(0, horizon, 0, h);
  refl.addColorStop(0, 'rgba(255, 170, 80, 0.35)');
  refl.addColorStop(1, 'rgba(255, 170, 80, 0)');
  x.fillStyle = refl;
  x.beginPath();
  x.moveTo(w * 0.44, horizon);
  x.lineTo(w * 0.56, horizon);
  x.lineTo(w * 0.68, h);
  x.lineTo(w * 0.32, h);
  x.closePath();
  x.fill();

  // Palm silhouettes framing both sides.
  drawPalm(x, w * 0.06, horizon + h * 0.02, h * 0.3, '#0d0812');
  drawPalm(x, w * 0.95, horizon + h * 0.05, h * 0.26, '#0d0812');
  drawPalm(x, w * 0.9, horizon + h * 0.1, h * 0.18, '#140b1e');

  return c;
}

function drawPalm(x, baseX, baseY, size, color) {
  x.strokeStyle = color;
  x.fillStyle = color;
  x.lineWidth = Math.max(3, size * 0.03);
  x.lineCap = 'round';
  // Trunk, leaning slightly.
  x.beginPath();
  x.moveTo(baseX, baseY);
  x.quadraticCurveTo(baseX + size * 0.08, baseY - size * 0.55, baseX + size * 0.16, baseY - size);
  x.stroke();
  const topX = baseX + size * 0.16;
  const topY = baseY - size;
  // Seven drooping fronds.
  for (let i = 0; i < 7; i++) {
    const a = (-Math.PI * 0.95 * i) / 6 - Math.PI * 0.05;
    const tipX = topX + Math.cos(a) * size * 0.52;
    const tipY = topY + Math.sin(a) * size * 0.34 + size * 0.22;
    x.beginPath();
    x.moveTo(topX, topY);
    x.quadraticCurveTo(
      topX + Math.cos(a) * size * 0.3,
      topY + Math.sin(a) * size * 0.12 - size * 0.08,
      tipX,
      tipY,
    );
    x.stroke();
  }
  // Coconuts.
  x.beginPath();
  x.arc(topX - size * 0.02, topY + size * 0.03, size * 0.035, 0, Math.PI * 2);
  x.arc(topX + size * 0.04, topY + size * 0.04, size * 0.03, 0, Math.PI * 2);
  x.fill();
}
