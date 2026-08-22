// Render TenantApplicationSignalForm stories from built storybook-static to PNG.
// Captures the official-form() tenant-application twin in two states: a clean
// guided Personal step (valid phone/NIF/nationality) and the NIF pattern(/^\d{9}$/)
// validator firing live after a bad NIF + blur. Playwright drives the real
// [formField] two-way binding over storybook-static.
import { chromium } from '@playwright/test';
import http from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const ROOT = 'dist/storybook/core';
const OUT_DIR = process.env.OUT_DIR || 'artifacts';
const PORT = 4612;

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
const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 700, height: 900 } });

const typeInto = async (sel, val) => {
  await page.fill(sel, val);
  await page.dispatchEvent(sel, 'input');
};

const STORY = 'tenant-tenantapplicationsignalform--default';

// 1) Guided — valid Personal step: phone / NIF (9 digits) / nationality, pets = Sim
await page.goto(storyUrl(STORY), { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForSelector('.taf-container', { timeout: 30000 });
await typeInto('#tafs-phone', '912345678');
await typeInto('#tafs-nif', '123456789');
await typeInto('#tafs-nationality', 'Portuguesa');
await page.click('.taf-seg-btn:nth-child(2)'); // "Sim" — has pets
await page.waitForTimeout(400);
let out = join(OUT_DIR, 'tenant-application-signal-form-valid-2026-08-22.png');
await (await page.$('.taf-container')).screenshot({ path: out });
console.log('WROTE', out);

// 2) NIF pattern error — a malformed NIF + blur surfaces the pattern rule live
await page.goto(storyUrl(STORY), { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForSelector('.taf-container', { timeout: 30000 });
await typeInto('#tafs-phone', '912345678');
await typeInto('#tafs-nif', '12'); // not 9 digits → pattern(/^\d{9}$/) fails
await page.dispatchEvent('#tafs-nif', 'blur'); // mark touched → error visible
await page.waitForSelector('.taf-error', { timeout: 5000 });
await page.waitForTimeout(300);
out = join(OUT_DIR, 'tenant-application-signal-form-nif-error-2026-08-22.png');
await (await page.$('.taf-container')).screenshot({ path: out });
console.log('WROTE', out);

await browser.close();
server.close();
