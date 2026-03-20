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
  // In CI the dashboard is pre-built with `npx nx build dashboard --configuration=development`
  // and served via `npx nx serve dashboard` or a static server.
  // Locally, set E2E_BASE_URL or let the dev server spin up.
  webServer: process.env['CI']
    ? {
        // Serve the pre-built dashboard from dist in CI
        command: 'npx serve dist/apps/dashboard -l 4200 --no-clipboard 2>/dev/null || npx nx serve dashboard --port=4200 --no-open',
        url: 'http://localhost:4200',
        reuseExistingServer: false,
        timeout: 120_000,
        stdout: 'pipe',
        stderr: 'pipe',
      }
    : undefined,
});
