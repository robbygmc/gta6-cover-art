// Palmline Cover Studio — editor state and interactions.
// Owns the cover state, the photo tray, panel picking and cropping, and
// PNG export. Rendering itself lives in render.js; this file only decides
// WHAT is drawn and reacts to the user.

import { LAYOUTS, LAYOUT_KEYS, panelAt } from './panels.js';
import { GRADES, GRADE_KEYS } from './grades.js';
import { TITLE_STYLES, drawCover } from './render.js';
import { makeSunsetScene } from './scene.js';

export const SIZES = {
  landscape: { label: '1920 × 1080', w: 1920, h: 1080 },
  portrait: { label: '1080 × 1350', w: 1080, h: 1350 },
  square: { label: '1080 × 1080', w: 1080, h: 1080 },
};

const SAMPLES = [
  { id: 'boulevard', name: 'Boulevard', src: 'samples/boulevard.jpg' },
  { id: 'pier', name: 'Pier Days', src: 'samples/pier.jpg' },
];

export const state = {
  layout: 'hero-left',
  grade: 'sunset',
  titleStyle: 'chrome',
  title: 'Boulevard Queen',
  subtitle: 'A Palmline Original',
  tags: ['Mara Voss', 'Diego Reyes', 'Lucia Fern'],
  size: 'landscape',
  photos: [],
  assign: [],
  views: [],
  selected: 0,
};

let stage = null;
let stageCtx = null;

function defaultView(i) {
  // Deterministic per-panel framing, so one photo never looks identical
  // in every panel: zoom steps up, pan drifts a little each panel.
  return {
    zoom: 1 + (i % 3) * 0.12,
    dx: (((i * 37) % 21) - 10) / 100,
    dy: (((i * 53) % 17) - 8) / 100,
  };
}

function syncPanels() {
  const count = LAYOUTS[state.layout].panels.length;
  // A panel added by a layout switch inherits the selected panel's photo,
  // never photo 0: otherwise a layout with more panels than the last one
  // silently mixes in a photo the user never picked for it.
  while (state.assign.length < count) {
    state.assign.push(state.assign[state.selected] ?? state.assign[0] ?? 0);
  }
  while (state.views.length < count) state.views.push(defaultView(state.views.length));
  state.assign.length = count;
  state.views.length = count;
  if (state.selected >= count) state.selected = 0;
}

export function render() {
  if (!stage) return;
  const size = SIZES[state.size];
  if (stage.width !== size.w || stage.height !== size.h) {
    stage.width = size.w;
    stage.height = size.h;
  }
  syncPanels();
  drawCover(stageCtx, size.w, size.h, state);
  updatePanelLabel();
}

function updatePanelLabel() {
  const el = document.getElementById('panelLabel');
  if (!el) return;
  const count = LAYOUTS[state.layout].panels.length;
  const tag = LAYOUTS[state.layout].panels[state.selected]?.tag || 'frame';
  el.textContent = `Panel ${state.selected + 1} of ${count} — ${tag} frame`;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadSamples() {
  for (const s of SAMPLES) {
    try {
      const img = await loadImage(s.src);
      state.photos.push({ id: s.id, name: s.name, img });
    } catch {
      /* a missing sample just means fewer tray photos */
    }
  }
  // The drawn sunset street is always available as a photo.
  const scene = makeSunsetScene(1600, 900);
  state.photos.push({ id: 'sunset', name: 'Sunset Street', img: scene });
  buildTray();
}

function buildTray() {
  const tray = document.getElementById('tray');
  if (!tray) return;
  tray.innerHTML = '';
  state.photos.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tray-item';
    b.dataset.photo = String(i);
    const thumb = document.createElement('canvas');
    thumb.width = 120;
    thumb.height = 68;
    const tctx = thumb.getContext('2d');
    const iw = p.img.naturalWidth || p.img.width;
    const ih = p.img.naturalHeight || p.img.height;
    const s = Math.max(120 / iw, 68 / ih);
    tctx.drawImage(p.img, (120 - iw * s) / 2, (68 - ih * s) / 2, iw * s, ih * s);
    b.appendChild(thumb);
    const cap = document.createElement('span');
    cap.textContent = p.name;
    b.appendChild(cap);
    b.addEventListener('click', () => {
      state.assign[state.selected] = i;
      state.views[state.selected] = defaultView(state.selected);
      render();
      markActive();
    });
    tray.appendChild(b);
  });
  markActive();
}

function markActive() {
  document.querySelectorAll('#layoutBar [data-layout]').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  document.querySelectorAll('#gradeBar [data-grade]').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  document.querySelectorAll('#styleBar [data-style]').forEach((b) => {
    b.classList.toggle('active', b.dataset.style === state.titleStyle);
  });
  document.querySelectorAll('#sizeBar [data-size]').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === state.size);
  });
  document.querySelectorAll('.tray-item').forEach((b) => {
    b.classList.toggle('active', Number(b.dataset.photo) === state.assign[state.selected]);
  });
}

// Push the whole state back into the toolbar controls (inputs + active
// chips). Shot mode applies query params after the toolbar was built, so
// it calls this to keep the controls honest with the cover on screen.
export function syncToolbar() {
  const titleInput = document.getElementById('titleInput');
  if (titleInput) titleInput.value = state.title;
  const subInput = document.getElementById('subtitleInput');
  if (subInput) subInput.value = state.subtitle;
  document.querySelectorAll('.tag-input').forEach((inp, i) => {
    inp.value = state.tags[i] || '';
  });
  const zoom = document.getElementById('zoomSlider');
  if (zoom) zoom.value = String(state.views[state.selected]?.zoom ?? 1);
  markActive();
}

function bindToolbar() {
  document.querySelectorAll('#layoutBar [data-layout]').forEach((b) => {
    b.addEventListener('click', () => {
      state.layout = b.dataset.layout;
      state.selected = 0;
      render();
      markActive();
    });
  });
  document.querySelectorAll('#gradeBar [data-grade]').forEach((b) => {
    b.addEventListener('click', () => {
      state.grade = b.dataset.grade;
      render();
      markActive();
    });
  });
  document.querySelectorAll('#styleBar [data-style]').forEach((b) => {
    b.addEventListener('click', () => {
      state.titleStyle = b.dataset.style;
      render();
      markActive();
    });
  });
  document.querySelectorAll('#sizeBar [data-size]').forEach((b) => {
    b.addEventListener('click', () => {
      state.size = b.dataset.size;
      render();
      markActive();
    });
  });

  const titleInput = document.getElementById('titleInput');
  if (titleInput) {
    titleInput.value = state.title;
    titleInput.addEventListener('input', () => {
      state.title = titleInput.value;
      render();
    });
  }
  const subInput = document.getElementById('subtitleInput');
  if (subInput) {
    subInput.value = state.subtitle;
    subInput.addEventListener('input', () => {
      state.subtitle = subInput.value;
      render();
    });
  }
  document.querySelectorAll('.tag-input').forEach((inp, i) => {
    inp.value = state.tags[i] || '';
    inp.addEventListener('input', () => {
      state.tags[i] = inp.value;
      render();
    });
  });

  const zoom = document.getElementById('zoomSlider');
  if (zoom) {
    zoom.addEventListener('input', () => {
      state.views[state.selected].zoom = Number(zoom.value);
      render();
    });
  }
  const fillAll = document.getElementById('fillAllBtn');
  if (fillAll) {
    fillAll.addEventListener('click', () => {
      const photo = state.assign[state.selected];
      state.assign = state.assign.map(() => photo);
      state.views = state.views.map((_, i) => defaultView(i));
      render();
      markActive();
    });
  }
  const upload = document.getElementById('uploadInput');
  if (upload) {
    upload.addEventListener('change', () => {
      for (const file of upload.files || []) {
        if (!file.type.startsWith('image/')) continue;
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            state.photos.push({ id: `up-${Date.now()}-${state.photos.length}`, name: file.name, img });
            buildTray();
            render();
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      }
      upload.value = '';
    });
  }
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      stage.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `palmline-cover-${state.size}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      }, 'image/png');
    });
  }
}

function bindCanvas() {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  stage.addEventListener('pointerdown', (e) => {
    const r = stage.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width;
    const fy = (e.clientY - r.top) / r.height;
    const hit = panelAt(state.layout, fx, fy);
    if (hit >= 0) {
      state.selected = hit;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      stage.setPointerCapture(e.pointerId);
      render();
      markActive();
      const zoom = document.getElementById('zoomSlider');
      if (zoom) zoom.value = String(state.views[state.selected].zoom);
    }
  });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const r = stage.getBoundingClientRect();
    const view = state.views[state.selected];
    view.dx += (e.clientX - lastX) / r.width;
    view.dy += (e.clientY - lastY) / r.height;
    view.dx = Math.max(-0.6, Math.min(0.6, view.dx));
    view.dy = Math.max(-0.6, Math.min(0.6, view.dy));
    lastX = e.clientX;
    lastY = e.clientY;
    render();
  });
  stage.addEventListener('pointerup', () => {
    dragging = false;
  });
  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    const view = state.views[state.selected];
    const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
    view.zoom = Math.max(1, Math.min(3.5, view.zoom * factor));
    const zoom = document.getElementById('zoomSlider');
    if (zoom) zoom.value = String(view.zoom);
    render();
  }, { passive: false });
}

function buildBars() {
  const layoutBar = document.getElementById('layoutBar');
  if (layoutBar) {
    for (const key of LAYOUT_KEYS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.layout = key;
      b.textContent = LAYOUTS[key].label;
      b.title = LAYOUTS[key].blurb;
      layoutBar.appendChild(b);
    }
  }
  const gradeBar = document.getElementById('gradeBar');
  if (gradeBar) {
    for (const key of GRADE_KEYS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.grade = key;
      b.textContent = GRADES[key].label;
      gradeBar.appendChild(b);
    }
  }
  const styleBar = document.getElementById('styleBar');
  if (styleBar) {
    for (const key of Object.keys(TITLE_STYLES)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.style = key;
      b.textContent = TITLE_STYLES[key].label;
      styleBar.appendChild(b);
    }
  }
}

export async function initEditor() {
  stage = document.getElementById('stage');
  stageCtx = stage.getContext('2d');
  buildBars();
  bindToolbar();
  bindCanvas();
  syncPanels();
  await loadSamples();
  await document.fonts.ready;
  render();
  window.__palmline = { state, render, SIZES };
  window.__palmlineReady = true;
}
