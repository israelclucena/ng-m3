/**
 * shot-payment-showcase.mjs — capture desktop + mobile screenshots of the
 * Onda 9b payment-showcase page (NG-06 proof). Additive tooling, no product code.
 *
 * Test-mode only: the page renders the deep-module `<iu-payment>` driven by the
 * inert root gateway stub — no keys, no network, no money.
 *
 * Usage: node tools/shot-payment-showcase.mjs [baseURL] [outDir]
 *   baseURL default http://localhost:4278
 *   outDir  default docs/portfolio
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const base = process.argv[2] ?? 'http://localhost:4278';
const outDir = process.argv[3] ?? 'docs/portfolio';
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] });

// The showcase renders inside the dashboard shell, whose scroll chain
// (:host → .app-shell → .main → .page-wrapper → .page-content) pins the body to
// 100vh with an INTERNAL `overflow-y:auto`. Because the content lives in that
// internal scroll region and not in normal document flow, neither
// `page.screenshot({ fullPage })` nor an element-scoped capture of the tall
// content div forces Chromium to paint the never-scrolled lower sections (state
// gallery, folded kinds) — they keep real DOM height but render blank. Collapsing
// the scroll chain into document flow (height:auto / overflow:visible) puts every
// section in the document, so `fullPage` grows to the real height AND paints it.
// The fixed chrome (nav-rail / top-app-bar) is hidden so the artifact is just the
// showcase. See memory reference_ng_m3_showcase_screenshot_fullpage_blank.
const FLATTEN_SHELL_CSS = `
  html, body, app-root, .app-shell, .main, .page-wrapper, .page-content {
    height: auto !important;
    max-height: none !important;
    overflow: visible !important;
  }
  .main { margin-left: 0 !important; }
  iu-nav-rail, iu-top-app-bar { display: none !important; }
`;

async function shot(name, viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
  await page.goto(`${base}/payment-showcase`, { waitUntil: 'networkidle', timeout: 30_000 });
  await page.locator('[data-testid="payment-showcase"]').waitFor({ state: 'visible', timeout: 15_000 });
  await page.addStyleTag({ content: FLATTEN_SHELL_CSS });
  // give web components / images + reflow a beat to settle
  await page.waitForTimeout(1500);
  const out = `${outDir}/payment-showcase-${name}.png`;
  await page.screenshot({ path: out, fullPage: true });
  console.log(`✓ ${out}`);
  await page.close();
}

await shot('desktop', { width: 1280, height: 900 });
await shot('mobile', { width: 390, height: 844 });

await browser.close();
