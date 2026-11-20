// Palmline Cover Studio — the cover renderer.
//
// drawCover paints one poster onto a 2d context: the layout's panels with
// the user's photos (each cropped by its own pan and zoom), the chosen
// colour grade over every panel, then the lettering — the big title, the
// subtitle, the cast tags, the billing line and the round Palmline seal.
// renderCover is the same drawing on a fresh canvas at export size, so
// the preview and the exported PNG are the same picture at any size.

import { panelsFor } from './layouts.js';
import { gradeById } from './grades.js';

/** The three export sizes, keyed the way the editor names them. */
export const EXPORT_SIZES = {
  square: { width: 1080, height: 1080, label: '1080 × 1080' },
  portrait: { width: 1080, height: 1350, label: '1080 × 1350' },
  landscape: { width: 1920, height: 1080, label: '1920 × 1080' },
};

/** The three title treatments. */
export const TITLE_STYLES = [
  { id: 'chrome', name: 'Chrome' },
  { id: 'sunset', name: 'Sunset' },
  { id: 'outline', name: 'Outline' },
];

/** Colours the cast tags cycle through, top to bottom. */
const TAG_COLOURS = ['#ff2e88', '#00a8e8', '#ffb300'];

/** Make sure Anton and Archivo are usable before a cover is drawn. */
export async function ensureFonts() {
  try {
    await Promise.all([
      document.fonts.load('400 100px Anton'),
      document.fonts.load('800 40px Archivo'),
      document.fonts.load('900 40px Archivo'),
      document.fonts.load('600 20px Archivo'),
    ]);
    await document.fonts.ready;
  } catch {
    // A missing font falls back to the next family in the stack; the
    // cover still draws, just in a plainer face.
  }
}

// --- panels ------------------------------------------------------------

/** The clip path of a panel: a rectangle, or a parallelogram when slanted. */
function panelPath(ctx, p) {
  const s = p.slant || 0;
  ctx.beginPath();
  ctx.moveTo(p.x + s, p.y);
  ctx.lineTo(p.x + p.w, p.y);
  ctx.lineTo(p.x + p.w - s, p.y + p.h);
  ctx.lineTo(p.x, p.y + p.h);
  ctx.closePath();
}

/** The natural size of a photo, whether it is an <img> or a <canvas>. */
function photoSize(img) {
  return {
    w: img.naturalWidth || img.width,
    h: img.naturalHeight || img.height,
  };
}

/**
 * Draw one photo into one panel: cover-fit, then the panel's own zoom
 * (1 is fit) and pan (-1..1, a fraction of the overflow each way, so the
 * photo follows the drag instead of sliding out of frame).
 */
function drawPanelPhoto(ctx, img, p, view) {
  const { w: iw, h: ih } = photoSize(img);
  if (!iw || !ih) return;
  const zoom = view?.zoom || 1;
  const scale = Math.max(p.w / iw, p.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const overflowX = Math.max(0, (dw - p.w) / 2);
  const overflowY = Math.max(0, (dh - p.h) / 2);
  const dx = p.x + (p.w - dw) / 2 + (view?.px || 0) * overflowX;
  const dy = p.y + (p.h - dh) / 2 + (view?.py || 0) * overflowY;
  ctx.drawImage(img, dx, dy, dw, dh);
}

/** A gradient across a rectangle, from a grade's angle and stops. */
function gradeGradient(ctx, p, overlay) {
  const rad = (overlay.angle * Math.PI) / 180;
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;
  const rx = (Math.abs(Math.cos(rad)) * p.w + Math.abs(Math.sin(rad)) * p.h) / 2;
  const ry = (Math.abs(Math.sin(rad)) * p.w + Math.abs(Math.cos(rad)) * p.h) / 2;
  const grad = ctx.createLinearGradient(cx - Math.cos(rad) * rx, cy - Math.sin(rad) * ry, cx + Math.cos(rad) * rx, cy + Math.sin(rad) * ry);
  for (const [at, colour] of overlay.stops) grad.addColorStop(at, colour);
  return grad;
}

/** One panel: photo, grade filter and overlay, vignette. */
function drawPanel(ctx, img, p, view, grade) {
  ctx.save();
  panelPath(ctx, p);
  ctx.clip();
  if (img) {
    ctx.filter = grade.filter;
    drawPanelPhoto(ctx, img, p, view);
    ctx.filter = 'none';
  } else {
    // An empty panel is a dark placeholder, never a hole in the poster.
    ctx.fillStyle = '#241335';
    ctx.fillRect(p.x, p.y, p.w, p.h);
  }
  if (grade.overlay) {
    ctx.globalCompositeOperation = grade.overlay.blend;
    ctx.globalAlpha = grade.overlay.alpha;
    ctx.fillStyle = gradeGradient(ctx, p, grade.overlay);
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
  // Vignette: a radial darkening toward the panel's edges.
  const vig = ctx.createRadialGradient(
    p.x + p.w / 2, p.y + p.h / 2, Math.min(p.w, p.h) * 0.35,
    p.x + p.w / 2, p.y + p.h / 2, Math.max(p.w, p.h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(8, 2, 16, 0)');
  vig.addColorStop(1, `rgba(8, 2, 16, ${0.55 * grade.vignette})`);
  ctx.fillStyle = vig;
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.restore();
  // A hairline frame keeps neighbouring panels distinct.
  ctx.save();
  panelPath(ctx, p);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = Math.max(1, Math.min(p.w, p.h) * 0.004);
  ctx.stroke();
  ctx.restore();
}

// --- lettering ---------------------------------------------------------

/** Shrink a font until the text fits maxWidth; returns the fitted size. */
function fitFont(ctx, text, family, weight, startSize, maxWidth) {
  let size = startSize;
  for (;;) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth || size <= 12) return size;
    size = Math.floor(size * 0.92);
  }
}

/** The title in its style: layered offsets, a gradient face, a dark edge. */
function drawTitle(ctx, text, style, cx, baseline, maxWidth, startSize) {
  const size = fitFont(ctx, text, 'Anton, sans-serif', 400, startSize, maxWidth);
  const face = ctx.createLinearGradient(0, baseline - size, 0, baseline + size * 0.1);
  if (style === 'sunset') {
    face.addColorStop(0, '#ffd194');
    face.addColorStop(0.5, '#ff7e5f');
    face.addColorStop(1, '#b24592');
  } else if (style === 'outline') {
    face.addColorStop(0, 'rgba(255,255,255,0)');
    face.addColorStop(1, 'rgba(255,255,255,0)');
  } else {
    // Chrome: white hot at the top, gold, then hot pink at the base.
    face.addColorStop(0, '#ffffff');
    face.addColorStop(0.35, '#ffe259');
    face.addColorStop(0.65, '#ff7e5f');
    face.addColorStop(1, '#ff2e88');
  }
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `400 ${size}px Anton, sans-serif`;
  try { ctx.letterSpacing = '1px'; } catch { /* older canvas: no letter-spacing */ }
  const off = size * 0.045;
  // Deep shadow, then the pink echo, then the face on top.
  ctx.fillStyle = '#160425';
  ctx.fillText(text, cx + off, baseline + off);
  if (style !== 'outline') {
    ctx.fillStyle = '#ff2e88';
    ctx.fillText(text, cx + off * 0.5, baseline + off * 0.5);
  }
  ctx.lineWidth = Math.max(2, size * 0.02);
  ctx.strokeStyle = style === 'outline' ? '#ffffff' : '#2b0a3d';
  ctx.lineJoin = 'round';
  ctx.strokeText(text, cx, baseline);
  if (style !== 'outline') {
    ctx.fillStyle = face;
    ctx.fillText(text, cx, baseline);
    // A thin hot highlight across the top of the letters.
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(cx - maxWidth / 2, baseline - size, maxWidth, size * 0.18);
    ctx.restore();
  }
  ctx.restore();
  return size;
}

/** One cast tag: a solid pill, slightly rotated, bottom-left of a panel. */
function drawTag(ctx, text, p, index, W, H) {
  const size = Math.round(Math.min(W, H) * 0.02);
  ctx.save();
  ctx.font = `900 ${size}px Archivo, sans-serif`;
  const textW = ctx.measureText(text).width;
  const padX = size * 0.7;
  const padY = size * 0.45;
  const boxW = textW + padX * 2;
  const boxH = size + padY * 2;
  const inset = Math.min(p.w, p.h) * 0.05;
  let x = p.x + inset;
  let y = p.y + p.h - boxH - inset;
  // A tag at the bottom of a low panel would sit on the title and the
  // billing line when that panel is near the poster's centre — put it at
  // the panel's top instead, where the picture is clear.
  const lowPanel = p.y + p.h > H * 0.78;
  const centreBand = x + boxW / 2 > W * 0.22 && x + boxW / 2 < W * 0.78;
  if (lowPanel && centreBand) y = p.y + inset;
  ctx.translate(x + boxW / 2, y + boxH / 2);
  ctx.rotate((-2 * Math.PI) / 180);
  ctx.fillStyle = TAG_COLOURS[index % TAG_COLOURS.length];
  ctx.fillRect(-boxW / 2, -boxH / 2, boxW, boxH);
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${size}px Archivo, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, size * 0.04);
  ctx.restore();
}

/** The round Palmline seal, top-right, with text set on a circle. */
function drawSeal(ctx, W, H) {
  const r = Math.min(W, H) * 0.052;
  const cx = W - r - Math.min(W, H) * 0.028;
  const cy = r + Math.min(W, H) * 0.028;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = 'rgba(12, 4, 24, 0.62)';
  ctx.strokeStyle = '#ff2e88';
  ctx.lineWidth = Math.max(2, r * 0.05);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = Math.max(1, r * 0.025);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
  ctx.stroke();
  // Circular legend, one character at a time around the ring.
  const legend = 'PALMLINE • COVER STUDIO • ';
  const size = r * 0.21;
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${size}px Archivo, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const radius = r * 0.9;
  for (let i = 0; i < legend.length; i++) {
    const angle = (i / legend.length) * Math.PI * 2 - Math.PI / 2;
    ctx.save();
    ctx.rotate(angle);
    ctx.translate(0, -radius);
    ctx.fillText(legend[i], 0, 0);
    ctx.restore();
  }
  ctx.font = `${r * 0.52}px Anton, sans-serif`;
  ctx.fillStyle = '#ffd166';
  ctx.fillText('PL', 0, r * 0.02);
  ctx.restore();
}

// --- the whole cover ---------------------------------------------------

/**
 * Paint the cover for `state` onto `ctx` at W × H.
 * state: { layout, grade, titleStyle, title, subtitle, tags[3], billing,
 *          photos: [{img}], panels: [{photo, zoom, px, py}] }
 */
export function drawCover(ctx, state, W, H) {
  const grade = gradeById(state.grade);
  const panels = panelsFor(state.layout, W, H);

  // Base: deep violet-black, visible in the gutters and behind slants.
  ctx.save();
  ctx.fillStyle = '#12081f';
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < panels.length; i++) {
    const view = state.panels?.[i] ?? { photo: 0, zoom: 1, px: 0, py: 0 };
    const photo = state.photos?.[view.photo];
    drawPanel(ctx, photo?.img ?? null, panels[i], view, grade);
  }

  // Bottom scrim so the lettering reads over any photo.
  const scrim = ctx.createLinearGradient(0, H * 0.58, 0, H);
  scrim.addColorStop(0, 'rgba(10, 4, 20, 0)');
  scrim.addColorStop(0.55, 'rgba(10, 4, 20, 0.42)');
  scrim.addColorStop(1, 'rgba(10, 4, 20, 0.72)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, H * 0.58, W, H * 0.42);

  // "A PALMLINE ORIGINAL", small, top-left.
  const eyebrowSize = Math.round(Math.min(W, H) * 0.016);
  ctx.save();
  ctx.font = `800 ${eyebrowSize}px Archivo, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  try { ctx.letterSpacing = `${eyebrowSize * 0.32}px`; } catch { /* no letter-spacing */ }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = eyebrowSize * 0.4;
  ctx.fillText('A  PALMLINE  ORIGINAL', Math.min(W, H) * 0.028, Math.min(W, H) * 0.026);
  ctx.restore();

  drawSeal(ctx, W, H);

  // Cast tags on the first three panels.
  const tags = (state.tags ?? []).filter((t) => t && t.trim() !== '');
  for (let i = 0; i < Math.min(3, tags.length, panels.length); i++) {
    drawTag(ctx, tags[i].toUpperCase(), panels[i], i, W, H);
  }

  // Lettering block, built up from the bottom edge.
  const pad = Math.min(W, H) * 0.028;
  const billingSize = Math.round(Math.min(W, H) * 0.016);
  const subtitleSize = Math.round(Math.min(W, H) * 0.024);
  const billingY = H - pad;
  const subtitleY = billingY - billingSize * 1.1 - subtitleSize * 1.15;
  const titleBaseline = subtitleY - subtitleSize * 0.9;

  const title = (state.title ?? 'PALMLINE').toUpperCase() || 'PALMLINE';
  drawTitle(ctx, title, state.titleStyle ?? 'chrome', W / 2, titleBaseline, W * 0.94, Math.min(W, H) * 0.13);

  // Subtitle, centred, with a rule on each side.
  const subtitle = (state.subtitle ?? '').toUpperCase();
  if (subtitle) {
    ctx.save();
    ctx.font = `800 ${subtitleSize}px Archivo, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    try { ctx.letterSpacing = `${subtitleSize * 0.3}px`; } catch { /* no letter-spacing */ }
    const subW = ctx.measureText(subtitle).width;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = subtitleSize * 0.3;
    ctx.fillText(subtitle, W / 2, subtitleY);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = Math.max(1, subtitleSize * 0.06);
    const gap = subtitleSize * 0.9;
    const ruleY = subtitleY - subtitleSize * 0.32;
    const ruleLen = Math.min(W * 0.12, (W - subW) / 2 - gap * 2);
    if (ruleLen > 4) {
      ctx.beginPath();
      ctx.moveTo(W / 2 - subW / 2 - gap - ruleLen, ruleY);
      ctx.lineTo(W / 2 - subW / 2 - gap, ruleY);
      ctx.moveTo(W / 2 + subW / 2 + gap, ruleY);
      ctx.lineTo(W / 2 + subW / 2 + gap + ruleLen, ruleY);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Billing block, tiny, centred on the bottom edge.
  const billing = (state.billing ?? '').toUpperCase();
  if (billing) {
    ctx.save();
    ctx.font = `600 ${billingSize}px Archivo, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    try { ctx.letterSpacing = `${billingSize * 0.22}px`; } catch { /* no letter-spacing */ }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText(billing, W / 2, billingY);
    ctx.restore();
  }
  ctx.restore();
}

/** Render the cover for `state` on a fresh canvas at W × H. */
export function renderCover(state, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawCover(canvas.getContext('2d'), state, width, height);
  return canvas;
}

/** The cover for `state` at an export size, as a PNG blob. */
export function exportCoverBlob(state, sizeKey) {
  const size = EXPORT_SIZES[sizeKey] ?? EXPORT_SIZES.square;
  return new Promise((resolve) => {
    renderCover(state, size.width, size.height).toBlob(resolve, 'image/png');
  });
}
