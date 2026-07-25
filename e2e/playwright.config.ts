/**
 * Playwright E2E Configuration — Sprint 024 / Enhanced Sprint 026
 *
 * Smoke tests for the Israel UI dashboard.
 * Targets a locally running dev server on port 4200 by default.
 *
 * Usage:
 *   npx playwright test --config=e2e/playwright.config.ts
 *
 * With a running dev server (starts automatically):
 *   npx playwright test --config=e2e/playwright.config.ts
 *
 * Headless CI:
 *   npx playwright test --config=e2e/playwright.config.ts --reporter=list
 *
 * Feature flag: E2E_SMOKE
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',

  // Run tests in parallel
  fullyParallel: true,

  // Retry on CI
  retries: process.env['CI'] ? 2 : 0,

  // Max workers
  workers: process.env['CI'] ? 1 : undefined,

  // Reporter
  reporter: [['html', { outputFolder: '../playwright-report', open: 'never' }], ['list']],

  use: {
    // Base URL for tests
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:4200',

    // Collect trace on failure
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Viewport
    viewport: { width: 1280, height: 720 },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  // Web server — auto-started in CI when no external server is running.
  // The dashboard uses the `@angular/build:application` builder (module-federation +
  // prerender aware), so `npx nx serve dashboard` is the reliable server and the primary
  // command here. The static fallback serves the builder's `browser/` output — note the
  // path: `@angular/build:application` emits under `dist/apps/dashboard/browser/`, not the
  // outputPath root (which only holds `3rdpartylicenses.txt` + `prerendered-routes.json`).
  // `-s` makes the static server fall back to index.html so client-side routes resolve.
  // Locally, set E2E_BASE_URL or let the dev server spin up.
  webServer: process.env['CI']
    ? {
        command:
          'npx nx serve dashboard --port=4200 --no-open || npx serve dist/apps/dashboard/browser -l 4200 -s --no-clipboard',
        url: 'http://localhost:4200',
        reuseExistingServer: false,
        timeout: 120_000,
        stdout: 'pipe',
        stderr: 'pipe',
      }
    : undefined,
});
