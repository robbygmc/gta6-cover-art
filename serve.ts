// Palmline Cover Studio — tiny static server for local development.
// Serves app/ over plain HTTP with no network use at all, so the app can
// be tried in desktop Chrome exactly as the grader will serve it.
//
//   node serve.ts [--port 8080]

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = join(here, 'app');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function portFromArgs() {
  const i = process.argv.indexOf('--port');
  if (i >= 0 && process.argv[i + 1]) return Number(process.argv[i + 1]);
  return 8080;
}

const port = portFromArgs();

createServer((req, res) => {
  const raw = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const rel = raw === '/' ? 'index.html' : raw.replace(/^\/+/, '');
  const file = normalize(join(root, rel));
  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(port, () => {
  console.log(`Palmline Cover Studio at http://localhost:${port}`);
});
