// Render SignalFormsListing stories from built storybook-static to PNG.
// Serves dist/storybook/core over http and screenshots the story iframe, both
// empty and driven to the live cross-field deposit error, via playwright.
import { chromium } from '@playwright/test';
import http from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const ROOT = 'dist/storybook/core';
const OUT_DIR = process.env.OUT_DIR || 'artifacts';
const PORT = 4601;

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
const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 720, height: 900 } });

// 1) Empty form ───────────────────────────────────────────────────────────────
await page.goto(storyUrl('lisboarent-signalformslisting--default'), { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForSelector('.sfl', { timeout: 30000 });
await page.waitForTimeout(500);
let out = join(OUT_DIR, 'signal-forms-listing-empty-2026-08-19.png');
await (await page.$('.sfl')).screenshot({ path: out });
console.log('WROTE', out);

// 2) Live cross-field error — deposit above 3× the rent ─────────────────────────
await page.fill('input[type="text"]', 'Apartamento T2 renovado em Príncipe Real');
await page.selectOption('select', 'apartment');
await page.fill('input[placeholder="1200"]', '1000');
await page.fill('input[placeholder="2400"]', '5000'); // 5× → violates 1×–3×
await page.fill('input[placeholder="65"]', '72');
await page.fill('input[placeholder="2"]', '2');
await page.fill('input[type="date"]', '2999-01-01');
await page.click('.sfl__submit');
await page.waitForSelector('.sfl__error', { timeout: 5000 });
await page.waitForTimeout(400);
out = join(OUT_DIR, 'signal-forms-listing-crossfield-2026-08-19.png');
await (await page.$('.sfl')).screenshot({ path: out });
console.log('WROTE', out);

await browser.close();
server.close();
console.log('DONE');
