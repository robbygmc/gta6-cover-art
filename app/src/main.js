// Palmline Cover Studio — editor wiring.
//
// Owns the state, builds the pickers, paints the live preview and handles
// every interaction: uploading photos, choosing a photo per panel, picking
// a layout and a grade, editing the lettering, dragging a panel to crop
// it, and exporting the finished cover as a PNG.
//
// The cover itself is drawn by cover.js; this file never draws a pixel
// of the poster directly, it only asks cover.js to draw it.

import {
  drawCover,
  ensureFonts,
  exportCoverBlob,
  EXPORT_SIZES,
  TITLE_STYLES,
} from './cover.js';
import { GRADES } from './grades.js';
import { LAYOUTS, panelsFor } from './layouts.js';
import { loadSamplePhotos } from './samples.js';
import { runShotMode } from './shots.js';

/** A fresh cover state: the defaults a first-time visitor sees. */
function defaultState() {
  // Each panel starts with its own framing of the same photo — a
  // different zoom and pan per panel — so one photo reads as several
  // shots across the poster instead of one image sliced into strips.
  // py is positive when the photo's upper part should show (a face in a
  // portrait photo inside a wide panel), negative for its lower part.
  const framings = [
    { photo: 0, zoom: 1.25, px: 0, py: 0.45 },
    { photo: 0, zoom: 1.6, px: -0.5, py: 0.2 },
    { photo: 0, zoom: 1.5, px: 0.5, py: -0.3 },
    { photo: 0, zoom: 1.35, px: -0.2, py: 0.5 },
    { photo: 0, zoom: 1.7, px: 0.3, py: 0.1 },
  ];
  return {
    layout: 'vice-grid',
    grade: 'sunset',
    titleStyle: 'chrome',
    title: 'PALMLINE',
    subtitle: 'VICE CITY • 2026',
    tags: ['THE DRIVER', 'THE HEIST', 'THE GETAWAY'],
    billing: 'PALMLINE PICTURES PRESENTS',
    size: 'landscape',
    selected: 0,
    photos: [],
    panels: framings,
  };
}

const state = defaultState();
const stage = document.getElementById('stage');
const stageCtx = stage.getContext('2d');

/** Paint the live preview at the chosen export aspect. */
function renderPreview() {
  const size = EXPORT_SIZES[state.size];
  if (stage.width !== size.width || stage.height !== size.height) {
    stage.width = size.width;
    stage.height = size.height;
  }
  drawCover(stageCtx, state, size.width, size.height);
  const label = document.getElementById('panel-label');
  const count = panelsFor(state.layout, size.width, size.height).length;
  label.textContent = `Panel ${state.selected + 1} of ${count} — click a panel on the cover to select it, then drag it to crop.`;
  const view = state.panels[state.selected];
  document.getElementById('zoom-slider').value = String(Math.round(view.zoom * 100));
  document.getElementById('zoom-value').textContent = `${Math.round(view.zoom * 100)}%`;
}

/** The panels of the current layout at preview size. */
function currentPanels() {
  const size = EXPORT_SIZES[state.size];
  return panelsFor(state.layout, size.width, size.height);
}

/** Which panel holds a point on the stage canvas (pixels), if any. */
function panelAt(px, py) {
  const panels = currentPanels();
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    if (px >= p.x && px <= p.x + p.w && py >= p.y && py <= p.y + p.h) return i;
  }
  return -1;
}

// --- pickers -----------------------------------------------------------

function buildLayoutPicker() {
  const grid = document.getElementById('layout-grid');
  for (const layout of LAYOUTS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'layout-btn';
    btn.setAttribute('aria-pressed', String(layout.id === state.layout));
    btn.innerHTML = '';
    const name = document.createElement('span');
    name.textContent = layout.name;
    const blurb = document.createElement('small');
    blurb.textContent = layout.blurb;
    btn.append(name, blurb);
    btn.addEventListener('click', () => {
      state.layout = layout.id;
      state.selected = 0;
      grid.querySelectorAll('.layout-btn').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      renderPreview();
    });
    grid.append(btn);
  }
}

function buildGradePicker() {
  const grid = document.getElementById('grade-grid');
  for (const grade of GRADES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'grade-btn';
    btn.setAttribute('aria-pressed', String(grade.id === state.grade));
    const swatch = document.createElement('i');
    swatch.style.background = grade.swatch;
    const name = document.createElement('span');
    name.textContent = grade.name;
    btn.append(swatch, name);
    btn.addEventListener('click', () => {
      state.grade = grade.id;
      grid.querySelectorAll('.grade-btn').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      renderPreview();
    });
    grid.append(btn);
  }
}

function buildTitleStyles() {
  const wrap = document.getElementById('title-styles');
  for (const style of TITLE_STYLES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = style.name;
    btn.setAttribute('aria-pressed', String(style.id === state.titleStyle));
    btn.addEventListener('click', () => {
      state.titleStyle = style.id;
      wrap.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      renderPreview();
    });
    wrap.append(btn);
  }
}

function buildSizePicker() {
  const wrap = document.getElementById('size-grid');
  for (const [key, size] of Object.entries(EXPORT_SIZES)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = size.label;
    btn.setAttribute('aria-pressed', String(key === state.size));
    btn.addEventListener('click', () => {
      state.size = key;
      wrap.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      renderPreview();
    });
    wrap.append(btn);
  }
}

// --- photos ------------------------------------------------------------

/** Rebuild the photo strip from state.photos; `active` is highlighted. */
function buildPhotoStrip() {
  const strip = document.getElementById('photo-strip');
  strip.innerHTML = '';
  state.photos.forEach((photo, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'photo-thumb';
    btn.setAttribute('aria-pressed', String(state.panels[state.selected].photo === index));
    const thumb = document.createElement('img');
    thumb.alt = photo.label;
    thumb.src = photo.img instanceof HTMLCanvasElement ? photo.img.toDataURL('image/jpeg', 0.85) : photo.img.src;
    const label = document.createElement('span');
    label.textContent = photo.label;
    btn.append(thumb, label);
    btn.addEventListener('click', () => {
      state.panels[state.selected].photo = index;
      buildPhotoStrip();
      renderPreview();
    });
    strip.append(btn);
  });
}

/** Add an uploaded file as a photo and put it in the selected panel. */
function addUploadedPhoto(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      state.photos.push({ id: `upload-${state.photos.length}`, label: file.name.slice(0, 14) || 'Upload', img });
      state.panels[state.selected].photo = state.photos.length - 1;
      buildPhotoStrip();
      renderPreview();
    };
    img.src = String(reader.result);
  };
  reader.readAsDataURL(file);
}

// --- export ------------------------------------------------------------

async function exportPng() {
  const size = EXPORT_SIZES[state.size];
  const blob = await exportCoverBlob(state, state.size);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `palmline-cover-${size.width}x${size.height}.png`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// --- panel cropping ----------------------------------------------------

let drag = null;

stage.addEventListener('pointerdown', (event) => {
  const rect = stage.getBoundingClientRect();
  const px = ((event.clientX - rect.left) / rect.width) * stage.width;
  const py = ((event.clientY - rect.top) / rect.height) * stage.height;
  const hit = panelAt(px, py);
  if (hit === -1) return;
  state.selected = hit;
  const view = state.panels[hit];
  drag = { x: event.clientX, y: event.clientY, px: view.px, py: view.py };
  stage.setPointerCapture(event.pointerId);
  buildPhotoStrip();
  renderPreview();
});

stage.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const rect = stage.getBoundingClientRect();
  const panels = currentPanels();
  const p = panels[state.selected];
  const view = state.panels[state.selected];
  const dx = ((event.clientX - drag.x) / rect.width) * stage.width;
  const dy = ((event.clientY - drag.y) / rect.height) * stage.height;
  view.px = Math.max(-1, Math.min(1, drag.px + (dx / p.w) * 2));
  view.py = Math.max(-1, Math.min(1, drag.py + (dy / p.h) * 2));
  renderPreview();
});

stage.addEventListener('pointerup', () => { drag = null; });
stage.addEventListener('pointercancel', () => { drag = null; });

stage.addEventListener('wheel', (event) => {
  event.preventDefault();
  const view = state.panels[state.selected];
  view.zoom = Math.max(1, Math.min(3, view.zoom * (1 - event.deltaY * 0.0012)));
  renderPreview();
}, { passive: false });

// --- wiring ------------------------------------------------------------

function wireControls() {
  document.getElementById('file-photo').addEventListener('change', (event) => {
    for (const file of event.target.files ?? []) addUploadedPhoto(file);
    event.target.value = '';
  });

  document.getElementById('btn-fill-all').addEventListener('click', () => {
    const photo = state.panels[state.selected].photo;
    for (const view of state.panels) view.photo = photo;
    renderPreview();
  });

  document.getElementById('btn-panel-reset').addEventListener('click', () => {
    state.panels[state.selected] = { ...state.panels[state.selected], zoom: 1, px: 0, py: 0 };
    renderPreview();
  });

  document.getElementById('btn-panel-photo').addEventListener('click', () => {
    const view = state.panels[state.selected];
    view.photo = (view.photo + 1) % Math.max(1, state.photos.length);
    buildPhotoStrip();
    renderPreview();
  });

  document.getElementById('zoom-slider').addEventListener('input', (event) => {
    state.panels[state.selected].zoom = Number(event.target.value) / 100;
    renderPreview();
  });

  document.getElementById('input-title').addEventListener('input', (event) => {
    state.title = event.target.value;
    renderPreview();
  });
  document.getElementById('input-subtitle').addEventListener('input', (event) => {
    state.subtitle = event.target.value;
    renderPreview();
  });
  document.getElementById('input-billing').addEventListener('input', (event) => {
    state.billing = event.target.value;
    renderPreview();
  });
  document.querySelectorAll('.input-tag').forEach((input, i) => {
    input.addEventListener('input', (event) => {
      state.tags[i] = event.target.value;
      renderPreview();
    });
  });

  document.getElementById('btn-export').addEventListener('click', exportPng);
  document.getElementById('btn-export-2').addEventListener('click', exportPng);

  document.getElementById('btn-random').addEventListener('click', () => {
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    state.layout = pick(LAYOUTS).id;
    state.grade = pick(GRADES).id;
    state.titleStyle = pick(TITLE_STYLES).id;
    state.selected = 0;
    document.querySelectorAll('.layout-btn').forEach((b, i) => b.setAttribute('aria-pressed', String(LAYOUTS[i].id === state.layout)));
    document.querySelectorAll('.grade-btn').forEach((b, i) => b.setAttribute('aria-pressed', String(GRADES[i].id === state.grade)));
    document.querySelectorAll('#title-styles button').forEach((b, i) => b.setAttribute('aria-pressed', String(TITLE_STYLES[i].id === state.titleStyle)));
    renderPreview();
  });
}

// --- boot --------------------------------------------------------------

/** The handle the deterministic screenshot mode drives. */
const api = {
  state,
  renderPreview,
  buildPhotoStrip,
  setPhoto(index) {
    state.panels[state.selected].photo = index;
    buildPhotoStrip();
    renderPreview();
  },
};

async function boot() {
  await ensureFonts();
  state.photos = await loadSamplePhotos();
  buildLayoutPicker();
  buildGradePicker();
  buildTitleStyles();
  buildSizePicker();
  buildPhotoStrip();
  wireControls();
  renderPreview();
  // Deterministic screenshot mode (?shot=...) takes over from here when
  // the page was opened with it; in normal use it is a no-op.
  await runShotMode(api);
  window.__palmline = api;
  window.__palmlineReady = true;
}

boot().catch((err) => {
  console.error('Palmline Cover Studio failed to start:', err);
  window.__palmlineError = String(err?.message ?? err);
});
