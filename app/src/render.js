// Palmline Cover Studio — the cover renderer.
// Draws the whole poster onto any 2d context at any size: panels with
// their photos, the grade, the title block, cast chips, billing line and
// the Palmline seal. The editor and the exporter both call drawCover.

import { LAYOUTS, panelBox } from './panels.js';
import { GRADES } from './grades.js';

export const TITLE_STYLES = {
  chrome: { label: 'Chrome', kind: 'gradient', stops: ['#ffffff', '#d7e0e6', '#7d8b96', '#e8eef2'] },
  sunset: { label: 'Sunset', kind: 'gradient', stops: ['#ffe259', '#ff9a3d', '#ff2d78'] },
  outline: { label: 'Outline', kind: 'outline' },
};

function pathPoly(ctx, pts, W, H) {
  ctx.beginPath();
  pts.forEach(([fx, fy], i) => {
    const px = fx * W;
    const py = fy * H;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
}

function fitTitle(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px Anton, sans-serif`;
  while (size > startSize * 0.3 && ctx.measureText(text).width > maxWidth) {
    size *= 0.92;
    ctx.font = `${size}px Anton, sans-serif`;
  }
  return size;
}

function drawTitle(ctx, W, H, state) {
  const text = (state.title || 'UNTITLED').toUpperCase();
  const style = TITLE_STYLES[state.titleStyle] || TITLE_STYLES.chrome;
  const baseline = H * 0.9;
  const size = fitTitle(ctx, text, W * 0.93, H * 0.155);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  if (style.kind === 'gradient') {
    // 3D extrude: the same glyphs stacked downwards in a dark shade.
    ctx.fillStyle = '#1a0b1e';
    const steps = Math.max(3, Math.round(size * 0.045));
    for (let i = steps; i >= 1; i--) {
      ctx.fillText(text, W / 2, baseline + i * size * 0.018);
    }
    const grad = ctx.createLinearGradient(0, baseline - size, 0, baseline);
    style.stops.forEach((c, i) => grad.addColorStop(i / (style.stops.length - 1), c));
    ctx.fillStyle = grad;
    ctx.fillText(text, W / 2, baseline);
    ctx.lineWidth = Math.max(2, size * 0.022);
    ctx.strokeStyle = 'rgba(20, 8, 24, 0.9)';
    ctx.strokeText(text, W / 2, baseline);
  } else {
    ctx.lineWidth = Math.max(3, size * 0.045);
    ctx.strokeStyle = '#ffffff';
    ctx.shadowColor = '#ff2d78';
    ctx.shadowBlur = size * 0.12;
    ctx.strokeText(text, W / 2, baseline);
    ctx.shadowBlur = 0;
  }
  ctx.restore();
  return { baseline, size };
}

function drawSubtitle(ctx, W, H, state, titleTop) {
  const sub = (state.subtitle || '').toUpperCase();
  if (!sub) return;
  ctx.save();
  ctx.font = `800 ${Math.round(H * 0.032)}px Archivo, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  try {
    ctx.letterSpacing = `${Math.round(H * 0.012)}px`;
  } catch {
    /* older canvas: no letter spacing, fine */
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  const y = titleTop - H * 0.018;
  ctx.fillText(sub, W / 2, y);
  // Short rules flanking the subtitle.
  const tw = ctx.measureText(sub).width;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = Math.max(2, H * 0.003);
  ctx.beginPath();
  ctx.moveTo(W / 2 - tw / 2 - W * 0.06, y - H * 0.01);
  ctx.lineTo(W / 2 - tw / 2 - W * 0.015, y - H * 0.01);
  ctx.moveTo(W / 2 + tw / 2 + W * 0.015, y - H * 0.01);
  ctx.lineTo(W / 2 + tw / 2 + W * 0.06, y - H * 0.01);
  ctx.stroke();
  ctx.restore();
}

function drawChips(ctx, W, H, state, layout) {
  const tags = (state.tags || []).filter((t) => t && t.trim());
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  layout.panels.forEach((p, i) => {
    if (i >= tags.length) return;
    const box = panelBox(p.pts);
    const fs = Math.max(10, Math.round(H * 0.024));
    ctx.font = `700 ${fs}px Archivo, sans-serif`;
    const label = tags[i].toUpperCase();
    const padX = fs * 0.7;
    const padY = fs * 0.45;
    const tw = ctx.measureText(label).width;
    const bx = box.x * W + W * 0.018;
    const by = box.y * H + H * 0.028;
    const bw = tw + padX * 2;
    const bh = fs + padY * 2;
    ctx.fillStyle = 'rgba(10, 6, 16, 0.72)';
    roundRect(ctx, bx, by, bw, bh, bh / 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(1.5, H * 0.0016);
    roundRect(ctx, bx, by, bw, bh, bh / 2);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, bx + padX, by + bh / 2 + fs * 0.04);
  });
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBilling(ctx, W, H) {
  ctx.save();
  ctx.font = `600 ${Math.max(9, Math.round(H * 0.014))}px Archivo, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.62)';
  ctx.fillText(
    'PALMLINE PICTURES  •  A PALMLINE ORIGINAL  •  SHOT ON LOCATION IN VICE CITY',
    W / 2,
    H * 0.965,
  );
  ctx.restore();
}

function drawSeal(ctx, W, H) {
  const cx = W * 0.925;
  const cy = H * 0.085;
  const r = Math.min(W, H) * 0.052;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = 'rgba(10, 6, 16, 0.66)';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = Math.max(2, r * 0.07);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = Math.max(1, r * 0.035);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${Math.round(r * 0.34)}px Archivo, sans-serif`;
  ctx.fillText('PALM', 0, -r * 0.16);
  ctx.fillText('LINE', 0, r * 0.22);
  ctx.restore();
}

function drawPhotoIntoPanel(ctx, W, H, photo, view, box, grade) {
  const img = photo && photo.img;
  const iw = img ? img.naturalWidth || img.width : 0;
  const ih = img ? img.naturalHeight || img.height : 0;
  const px = box.x * W;
  const py = box.y * H;
  const pw = box.w * W;
  const ph = box.h * H;
  if (!img || !iw || !ih) {
    const g = ctx.createLinearGradient(px, py, px + pw, py + ph);
    g.addColorStop(0, '#2a1740');
    g.addColorStop(1, '#12081d');
    ctx.fillStyle = g;
    ctx.fillRect(px, py, pw, ph);
    return;
  }
  const zoom = view && view.zoom ? view.zoom : 1;
  const dx = view && view.dx ? view.dx : 0;
  const dy = view && view.dy ? view.dy : 0;
  const scale = Math.max(pw / iw, ph / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  // Pan is clamped so the photo can never slide off a panel edge and
  // leave a black strip: the centre may only drift half the overhang.
  const maxDx = Math.max(0, (dw - pw) / 2 / pw);
  const maxDy = Math.max(0, (dh - ph) / 2 / ph);
  const cx = px + pw / 2 + Math.max(-maxDx, Math.min(maxDx, dx)) * pw;
  const cy = py + ph / 2 + Math.max(-maxDy, Math.min(maxDy, dy)) * ph;
  ctx.save();
  ctx.filter = grade.filter;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.restore();
}

export function drawCover(ctx, W, H, state) {
  const layout = LAYOUTS[state.layout] || LAYOUTS['hero-left'];
  const grade = GRADES[state.grade] || GRADES.sunset;
  ctx.save();
  ctx.fillStyle = '#0d0812';
  ctx.fillRect(0, 0, W, H);

  // Panels: photo, tint, border.
  layout.panels.forEach((p, i) => {
    const box = panelBox(p.pts);
    const photo = state.photos[state.assign ? state.assign[i] || 0 : 0];
    const view = state.views ? state.views[i] : null;
    ctx.save();
    pathPoly(ctx, p.pts, W, H);
    ctx.clip();
    drawPhotoIntoPanel(ctx, W, H, photo, view, box, grade);
    ctx.globalCompositeOperation = grade.tintBlend;
    ctx.globalAlpha = grade.tintAlpha;
    ctx.fillStyle = grade.tint;
    ctx.fillRect(box.x * W, box.y * H, box.w * W, box.h * H);
    ctx.restore();
    // Gutter line around the panel.
    ctx.save();
    pathPoly(ctx, p.pts, W, H);
    ctx.strokeStyle = 'rgba(8, 4, 12, 0.9)';
    ctx.lineWidth = Math.max(2, W * 0.003);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = Math.max(1, W * 0.001);
    ctx.stroke();
    ctx.restore();
  });

  // Vignette over the whole cover.
  const vg = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.42,
    W / 2, H / 2, Math.max(W, H) * 0.78,
  );
  vg.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vg.addColorStop(1, `rgba(0, 0, 0, ${grade.vignette})`);
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  // Title block: scrim, subtitle, title, billing.
  const scrim = ctx.createLinearGradient(0, H * 0.52, 0, H);
  scrim.addColorStop(0, 'rgba(0, 0, 0, 0)');
  scrim.addColorStop(0.55, 'rgba(0, 0, 0, 0.45)');
  scrim.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, H * 0.52, W, H * 0.48);
  const { size } = drawTitle(ctx, W, H, state);
  drawSubtitle(ctx, W, H, state, H * 0.9 - size);
  drawChips(ctx, W, H, state, layout);
  drawBilling(ctx, W, H);
  drawSeal(ctx, W, H);

  // Thin gold poster frame.
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.85)';
  ctx.lineWidth = Math.max(2, W * 0.0025);
  ctx.strokeRect(W * 0.008, H * 0.012, W * 0.984, H * 0.976);
  ctx.restore();
}
