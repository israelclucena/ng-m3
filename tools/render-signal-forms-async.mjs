// Render SignalFormsAsync stories from built storybook-static to PNG.
// Screenshots the reference-claim form in its available (green tick) and taken
// (async error) states, driving the real validateAsync round-trip via playwright.
import { chromium } from '@playwright/test';
import http from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const ROOT = 'dist/storybook/core';
const OUT_DIR = process.env.OUT_DIR || 'artifacts';
const PORT = 4603;

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
const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 680, height: 560 } });

await page.goto(storyUrl('lisboarent-signalformsasync--default'), { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForSelector('.sfa', { timeout: 30000 });

// 1) Available — a free reference resolves to the green tick ─────────────────────
await page.fill('input[type="text"]', 'alfama-t2');
await page.waitForSelector('.sfa__input--ok', { timeout: 5000 });
await page.waitForTimeout(300);
let out = join(OUT_DIR, 'signal-forms-async-available-2026-08-20.png');
await (await page.$('.sfa')).screenshot({ path: out });
console.log('WROTE', out);

// 2) Taken — a reserved reference surfaces the async error after the round-trip ──
await page.fill('input[type="text"]', 'arroios-t3');
// Wait for the check to resolve (green tick gone), then submit to mark touched.
await page.waitForTimeout(1200);
await page.click('.sfa__submit');
await page.waitForSelector('.sfa__error', { timeout: 5000 });
await page.waitForTimeout(300);
out = join(OUT_DIR, 'signal-forms-async-taken-2026-08-20.png');
await (await page.$('.sfa')).screenshot({ path: out });
console.log('WROTE', out);

await browser.close();
server.close();
console.log('DONE');
