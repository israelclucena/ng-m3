// Render AuthRegisterSignalForm stories from built storybook-static to PNG.
// Captures the official-form() registration twin in two states: a valid guided
// fill (strength meter + enabled submit) and a live cross-field confirm mismatch
// (the validate(path.confirmPassword, ({valueOf})=>…) rule firing). Playwright
// drives the real [formField] two-way binding over storybook-static.
import { chromium } from '@playwright/test';
import http from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const ROOT = 'dist/storybook/core';
const OUT_DIR = process.env.OUT_DIR || 'artifacts';
const PORT = 4611;

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
const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 560, height: 900 } });

const typeInto = async (sel, val) => {
  await page.fill(sel, val);
  await page.dispatchEvent(sel, 'input');
};

// 1) Guided — valid landlord registration: strength meter "Forte" + enabled submit
await page.goto(storyUrl('auth-authregistersignalform--default'), { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForSelector('.iu-arsf', { timeout: 30000 });
await page.click('.iu-arsf__role-btn:nth-child(2)'); // landlord
await typeInto('#arsf-name', 'Israel Lucena');
await typeInto('#arsf-email', 'israel@lisboarent.pt');
await typeInto('#arsf-password', 'MinhaPassword123!');
await typeInto('#arsf-confirm', 'MinhaPassword123!');
await page.check('.iu-arsf__checkbox');
await page.waitForTimeout(400);
let out = join(OUT_DIR, 'auth-register-signal-form-valid-2026-08-21.png');
await (await page.$('.iu-arsf')).screenshot({ path: out });
console.log('WROTE', out);

// 2) Mismatch — the cross-field confirm rule firing live after a submit attempt
await page.goto(storyUrl('auth-authregistersignalform--default'), { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForSelector('.iu-arsf', { timeout: 30000 });
await typeInto('#arsf-name', 'Israel Lucena');
await typeInto('#arsf-email', 'israel@lisboarent.pt');
await typeInto('#arsf-password', 'MinhaPassword123!');
await typeInto('#arsf-confirm', 'OutraPassword456!');
await page.check('.iu-arsf__checkbox');
// Submit stays (correctly) disabled while invalid, so blur the confirm field to
// mark it touched — that surfaces the cross-field mismatch error live.
await page.dispatchEvent('#arsf-confirm', 'blur');
await page.waitForSelector('.iu-arsf__field-error', { timeout: 5000 });
await page.waitForTimeout(300);
out = join(OUT_DIR, 'auth-register-signal-form-mismatch-2026-08-21.png');
await (await page.$('.iu-arsf')).screenshot({ path: out });
console.log('WROTE', out);

await browser.close();
server.close();
