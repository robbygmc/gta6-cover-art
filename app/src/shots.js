// Palmline Cover Studio — deterministic screenshot mode.
//
// Opened with ?shot=cover or ?shot=editor the app renders one fixed
// picture and raises window.__shotReady when it is done, so a headless
// browser can capture exactly the same image every time:
//
//   ?shot=cover&photo=pier&caption=Sunset%20Heist&layout=palmline
//     &grade=neon&size=landscape
//       the exported cover alone, full-window; the real export is also
//       saved as window.__exportDataURL (a PNG data URL).
//   ?shot=editor&photo=boulevard&caption=Boulevard%20Queen
//       the editor with that photo loaded and that caption set.
//
// Parameters, all optional:
//   photo    pier | boulevard | sunset   (default pier)
//   caption  the title text             (default: the editor's title)
//   layout   any layout id              (default: the editor's layout)
//   grade    any grade id               (default: the editor's grade)
//   size     square | portrait | landscape (default landscape in cover
//            mode, the editor's size in editor mode)
//   titleStyle  chrome | sunset | outline

import { drawCover, ensureFonts, EXPORT_SIZES } from './cover.js';

const PHOTO_IDS = ['pier', 'boulevard', 'sunset-street'];

/** Pick the sample photo the query names, falling back to the first. */
function photoIndexFor(api, name) {
  const wanted = name === 'sunset' ? 'sunset-street' : name;
  const at = api.state.photos.findIndex((p) => p.id === wanted);
  if (at !== -1) return at;
  const first = api.state.photos.findIndex((p) => PHOTO_IDS.includes(p.id));
  return first === -1 ? 0 : first;
}

/** Apply the shared query parameters to the state. */
function applyParams(api, query) {
  const s = api.state;
  if (query.get('photo')) {
    const index = photoIndexFor(api, query.get('photo'));
    for (const view of s.panels) view.photo = index;
    s.selected = 0;
  }
  if (query.get('caption')) s.title = query.get('caption');
  if (query.get('layout')) s.layout = query.get('layout');
  if (query.get('grade')) s.grade = query.get('grade');
  if (query.get('titleStyle')) s.titleStyle = query.get('titleStyle');
  if (query.get('subtitle')) s.subtitle = query.get('subtitle');
}

/** The cover shot: the export itself, drawn full-window. */
async function coverShot(api, query) {
  const sizeKey = query.get('size') || 'landscape';
  const size = EXPORT_SIZES[sizeKey] ?? EXPORT_SIZES.landscape;
  api.state.size = sizeKey in EXPORT_SIZES ? sizeKey : 'landscape';
  applyParams(api, query);
  await ensureFonts();
  document.body.classList.add('shot-cover');
  const stage = document.getElementById('stage');
  stage.width = size.width;
  stage.height = size.height;
  drawCover(stage.getContext('2d'), api.state, size.width, size.height);
  // The genuine export, as a PNG data URL, for the screenshot tooling.
  window.__exportDataURL = stage.toDataURL('image/png');
  window.__exportSize = { width: size.width, height: size.height };
  window.__shotReady = true;
}

/** The editor shot: the app at work with a photo loaded. */
async function editorShot(api, query) {
  applyParams(api, query);
  if (query.get('size') && EXPORT_SIZES[query.get('size')]) api.state.size = query.get('size');
  await ensureFonts();
  api.buildPhotoStrip();
  api.renderPreview();
  window.__shotReady = true;
}

/**
 * Run the screenshot mode named by ?shot=, or do nothing when the page
 * was opened normally. Returns true when a shot mode ran.
 */
export async function runShotMode(api) {
  const query = new URLSearchParams(window.location.search);
  const mode = query.get('shot');
  if (mode === 'cover') {
    await coverShot(api, query);
    return true;
  }
  if (mode === 'editor') {
    await editorShot(api, query);
    return true;
  }
  return false;
}
