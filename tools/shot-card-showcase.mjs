/**
 * shot-card-showcase.mjs — capture desktop + mobile screenshots of the
 * Onda 9 card-showcase page (NG-03 proof). Additive tooling, no product code.
 *
 * Usage: node tools/shot-card-showcase.mjs [baseURL] [outDir]
 *   baseURL default http://localhost:4278
 *   outDir  default docs/portfolio
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const base = process.argv[2] ?? 'http://localhost:4278';
const outDir = process.argv[3] ?? 'docs/portfolio';
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] });

async function shot(name, viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
  await page.goto(`${base}/card-showcase`, { waitUntil: 'networkidle', timeout: 30_000 });
  await page.locator('[data-testid="card-showcase"]').waitFor({ state: 'visible', timeout: 15_000 });
  // give web components / images a beat to settle
  await page.waitForTimeout(1200);
  const out = `${outDir}/card-showcase-${name}.png`;
  await page.screenshot({ path: out, fullPage: true });
  console.log(`✓ ${out}`);
  await page.close();
}

await shot('desktop', { width: 1280, height: 900 });
await shot('mobile', { width: 390, height: 844 });

await browser.close();
