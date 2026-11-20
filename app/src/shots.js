// Palmline Cover Studio — deterministic screenshot mode.
// ?shot=cover|editor&photo=&caption=&layout=&grade=&size=
// Cover mode renders one export-size cover on #stage and publishes it as
// window.__exportDataURL for the screenshot tooling. Editor mode opens the
// full editor with the requested state applied. Either way the page sets
// window.__shotReady once fonts and photos are loaded and drawn.

import { state, SIZES, render, initEditor, syncToolbar } from './editor.js';
import { LAYOUTS } from './panels.js';
import { GRADES } from './grades.js';
import { TITLE_STYLES } from './render.js';

function applyParams(q) {
  const photo = q.get('photo');
  if (photo) {
    const idx = state.photos.findIndex((p) => p.id === photo);
    if (idx >= 0) state.assign = state.assign.map(() => idx);
  }
  const caption = q.get('caption');
  if (caption) state.title = caption;
  const layout = q.get('layout');
  if (layout && LAYOUTS[layout]) state.layout = layout;
  const grade = q.get('grade');
  if (grade && GRADES[grade]) state.grade = grade;
  const style = q.get('style');
  if (style && TITLE_STYLES[style]) state.titleStyle = style;
  const size = q.get('size');
  if (size && SIZES[size]) state.size = size;
}

async function runShotMode() {
  const q = new URLSearchParams(location.search);
  const mode = q.get('shot');
  if (!mode) return false;
  await initEditor();
  applyParams(q);
  render();
  syncToolbar();
  const stage = document.getElementById('stage');
  if (mode === 'cover') {
    document.body.classList.add('shot-cover');
    await document.fonts.ready;
    render();
    const size = SIZES[state.size];
    window.__exportSize = { width: size.w, height: size.h };
    window.__exportDataURL = stage.toDataURL('image/png');
  }
  window.__shotReady = true;
  return true;
}

// Entry point: shot mode when ?shot= is present, plain editor otherwise.
if (new URLSearchParams(location.search).get('shot')) {
  runShotMode().catch((err) => {
    console.error('shot mode failed', err);
    window.__shotReady = false;
  });
} else {
  initEditor().catch((err) => console.error('editor failed to start', err));
}
