// Palmline Cover Studio — entrypoint (Node 22, standard library only).
//
// This program hands the app in: it copies this repository's app/ and
// screenshots/ into the output directory and writes /output/dossier.json
// with buildDossier from the vendored make.fun library.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Inside the grader MAKEFUN_OUTPUT_DIR is unset and /output is used.
// The program is deterministic: two runs write byte-identical output.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The repository root is the directory holding this file.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));

// The grader hands us a writable /output; anywhere else the environment
// variable names the directory so a local run can be inspected.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The caps the scorer applies to this bounty (gate.json): only
// text_max_bytes shapes the dossier bytes; the rest refuse an entry the
// scorer would refuse, so passing them here fails early in the same way.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
} as const;

function copyTree(source: string, target: string): void {
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

// Start from a clean output directory so a stale file from an earlier run
// can never leak into the handed-in entry.
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

// The app itself: plain static files under app/, loaded offline.
copyTree(join(repoRoot, 'app'), join(outputDir, 'app'));

// The screenshots, when present: 3 or 4 images, the first by name the cover.
const shotsDir = join(repoRoot, 'screenshots');
if (existsSync(shotsDir)) copyTree(shotsDir, join(outputDir, 'screenshots'));

// The dossier the judge reads, written from exactly what was just copied.
const dossier = buildDossier(outputDir, DOSSIER_CAPS);
writeFileSync(join(outputDir, 'dossier.json'), dossier);

console.log(`Palmline Cover Studio handed in to ${outputDir} (${dossier.length} byte dossier).`);
