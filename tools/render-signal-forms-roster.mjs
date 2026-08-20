// Render SignalFormsRoster stories from built storybook-static to PNG.
// Serves dist/storybook/core over http and screenshots the story iframe, both a
// balanced two-tenant roster and the live cross-item share-sum error, via playwright.
import { chromium } from '@playwright/test';
import http from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const ROOT = 'dist/storybook/core';
const OUT_DIR = process.env.OUT_DIR || 'artifacts';
const PORT = 4602;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.ttf': 'font/ttf', '.map': 'application/json', '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(req.url.split('?')[0]);
    if (path === '/') path = '/index.html';
    const filePath = normalize(join(ROOT, path));
    await stat(filePath);
    const body = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('not found');
  }
});

await new Promise((r) => server.listen(PORT, r));
await mkdir(OUT_DIR, { recursive: true });

const storyUrl = (id) => `http://localhost:${PORT}/iframe.html?id=${id}&viewMode=story`;
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 760, height: 1000 } });

await page.goto(storyUrl('lisboarent-signalformsroster--default'), { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForSelector('.sfr', { timeout: 30000 });

const tenant = (i) => page.locator('.sfr__tenant').nth(i);
const fill = async (loc, sel, val) => loc.locator(sel).fill(val);

// Build a balanced two-tenant 50/50 roster ─────────────────────────────────────
await page.fill('input[placeholder^="Ex:"]', 'T3 Arroios — 2026/09');
await fill(tenant(0), 'input[type="text"]', 'Ana Dias');
await fill(tenant(0), 'input[type="email"]', 'ana@mail.pt');
await fill(tenant(0), 'input[type="number"]', '50');
await page.click('.sfr__add');
await page.waitForTimeout(200);
await fill(tenant(1), 'input[type="text"]', 'Rui Sá');
await fill(tenant(1), 'input[type="email"]', 'rui@mail.pt');
await fill(tenant(1), 'input[type="number"]', '50');
await page.waitForTimeout(300);
let out = join(OUT_DIR, 'signal-forms-roster-balanced-2026-08-20.png');
await (await page.$('.sfr')).screenshot({ path: out });
console.log('WROTE', out);

// Drive the live cross-item share-sum error (60 + 50 = 110 ≠ 100) ───────────────
await fill(tenant(0), 'input[type="number"]', '60');
await page.click('.sfr__submit');
await page.waitForSelector('.sfr__error', { timeout: 5000 });
await page.waitForTimeout(300);
out = join(OUT_DIR, 'signal-forms-roster-sharesum-2026-08-20.png');
await (await page.$('.sfr')).screenshot({ path: out });
console.log('WROTE', out);

await browser.close();
server.close();
console.log('DONE');
