// Render the ExpressiveShowcase A/B stories from the built storybook-static to PNG.
// Serves dist/storybook/core over http and screenshots each story iframe via playwright.
import { chromium } from '@playwright/test';
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const ROOT = 'dist/storybook/core';
const OUT_DIR = process.env.OUT_DIR || '/tmp/expressive';
const PORT = 4599;

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

const stories = [
  { id: 'theme-expressiveshowcase--side-by-side', file: 'expressive-ab-sidebyside.png' },
  { id: 'theme-expressiveshowcase--default', file: 'expressive-default.png' },
  { id: 'theme-expressiveshowcase--baseline', file: 'expressive-baseline.png' },
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1400, height: 900 } });

for (const s of stories) {
  const url = `http://localhost:${PORT}/iframe.html?id=${s.id}&viewMode=story`;
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  // wait for the component root to render
  await page.waitForSelector('.iu-expressive', { timeout: 30000 });
  await page.waitForTimeout(600); // let fonts/transitions settle
  const root = await page.$('#storybook-root, #root');
  const out = join(OUT_DIR, s.file);
  await (root || page).screenshot({ path: out });
  console.log('WROTE', out);
}

await browser.close();
server.close();
console.log('DONE');
