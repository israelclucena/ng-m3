/**
 * Playwright E2E Configuration — Sprint 024
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

  // Uncomment to auto-start the Angular dev server:
  // webServer: {
  //   command: 'npx nx run dashboard:serve',
  //   url: 'http://localhost:4200',
  //   reuseExistingServer: !process.env['CI'],
  //   timeout: 120 * 1000,
  // },
});
