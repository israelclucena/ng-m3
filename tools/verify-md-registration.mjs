// Runtime proof that @material/web elements register in the PROD build.
// Serves dist/apps/dashboard/browser statically, loads the app in headless
// Chromium, and checks customElements.get(tag) for representative <md-*> tags.
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

const ROOT = 'dist/apps/dashboard/browser';
const PORT = 4291;
const MIME = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = join(ROOT, p);
    try { if ((await stat(file)).isDirectory()) file = join(ROOT, 'index.html'); }
    catch { file = join(ROOT, 'index.html'); } // SPA fallback
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end('nf'); }
});
await new Promise((r) => server.listen(PORT, r));

const TAGS = [
  'md-filled-button', 'md-outlined-button', 'md-text-button', 'md-elevated-button',
  'md-icon', 'md-icon-button', 'md-filled-text-field', 'md-outlined-select',
  'md-checkbox', 'md-switch', 'md-list', 'md-tabs', 'md-dialog', 'md-linear-progress',
];

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage();
await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
const results = await page.evaluate(
  (tags) => tags.map((t) => [t, !!customElements.get(t)]),
  TAGS,
);
await browser.close();
server.close();

const defined = results.filter(([, ok]) => ok).length;
console.log(`Registered ${defined}/${results.length} md-* elements:`);
for (const [t, ok] of results) console.log(`  ${ok ? '✅' : '❌'} ${t}`);
process.exit(defined === results.length ? 0 : 1);
