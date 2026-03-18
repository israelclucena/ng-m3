/**
 * Smoke Tests — Israel UI Dashboard
 * Sprint 024 — Night Shift 2026-03-18
 *
 * Critical paths verified:
 *   1. Dashboard loads — title, nav, widget grid visible
 *   2. Features page — sections render, no JS errors
 *   3. Components page — catalog renders
 *   4. 404 page — correct error page shown
 *   5. Navigation — all main routes reachable
 *
 * Feature flag: E2E_SMOKE
 *
 * Run: npx playwright test --config=e2e/playwright.config.ts
 */
import { test, expect, Page } from '@playwright/test';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Collect JS errors during a test */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

// ─── Suite: Navigation ────────────────────────────────────────────────────────

test.describe('Navigation — shell routes', () => {
  test('redirects / to /dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('dashboard page title is correct', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveTitle(/Dashboard.*Israel UI/i);
  });

  test('features page title is correct', async ({ page }) => {
    await page.goto('/features');
    await expect(page).toHaveTitle(/Features.*Israel UI/i);
  });

  test('components page title is correct', async ({ page }) => {
    await page.goto('/components');
    await expect(page).toHaveTitle(/Components.*Israel UI/i);
  });

  test('settings page title is correct', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveTitle(/Settings.*Israel UI/i);
  });
});

// ─── Suite: Dashboard ─────────────────────────────────────────────────────────

test.describe('Dashboard page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('renders without JS errors', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });

  test('has a visible nav/sidebar element', async ({ page }) => {
    // At least one nav-related element should be present
    const nav = page.locator('iu-nav-rail, iu-nav-drawer, nav, [role="navigation"]').first();
    await expect(nav).toBeVisible({ timeout: 10_000 });
  });

  test('shows page content (not blank)', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    const body = await page.locator('body').textContent();
    expect(body?.trim().length).toBeGreaterThan(50);
  });
});

// ─── Suite: Features page ─────────────────────────────────────────────────────

test.describe('Features page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/features');
  });

  test('renders without JS errors', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/features');
    await page.waitForLoadState('networkidle');
    // Filter noise from dev tooling / service worker
    const real = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('service-worker') &&
      !e.includes('ngsw')
    );
    expect(real).toHaveLength(0);
  });

  test('renders Feature Showcase heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Feature Showcase/i })).toBeVisible({ timeout: 10_000 });
  });

  test('has web vitals section (WEB_VITALS flag)', async ({ page }) => {
    const section = page.locator('#web-vitals, iu-web-vitals-widget');
    await expect(section.first()).toBeVisible({ timeout: 10_000 });
  });

  test('has SSR section (SSR_MODULE flag)', async ({ page }) => {
    const section = page.locator('#ssr');
    await expect(section).toBeVisible({ timeout: 10_000 });
  });
});

// ─── Suite: 404 / Error pages ──────────────────────────────────────────────────

test.describe('Error pages', () => {
  test('unknown route shows a 404 page (not blank)', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-xyz');
    await page.waitForLoadState('domcontentloaded');
    const body = await page.locator('body').textContent();
    // Either redirected to 404 or the body has error text
    const url = page.url();
    const has404Content =
      url.includes('not-found') ||
      body?.toLowerCase().includes('404') ||
      body?.toLowerCase().includes('not found') ||
      body?.toLowerCase().includes('não encontrada');
    expect(has404Content).toBe(true);
  });

  test('/error route renders the error page component', async ({ page }) => {
    await page.goto('/error');
    await page.waitForLoadState('domcontentloaded');
    const body = await page.locator('body').textContent();
    // Should contain some error page text
    expect(body?.trim().length).toBeGreaterThan(20);
  });
});

// ─── Suite: Component catalog ──────────────────────────────────────────────────

test.describe('Components page', () => {
  test('renders without blank content', async ({ page }) => {
    await page.goto('/components');
    await page.waitForLoadState('domcontentloaded');
    const body = await page.locator('body').textContent();
    expect(body?.trim().length).toBeGreaterThan(50);
  });

  test('deep link to a component works', async ({ page }) => {
    await page.goto('/components/button');
    await expect(page).toHaveURL(/\/components\/button/);
    await page.waitForLoadState('domcontentloaded');
    const body = await page.locator('body').textContent();
    expect(body?.trim().length).toBeGreaterThan(50);
  });
});

// ─── Suite: Accessibility smoke ───────────────────────────────────────────────

test.describe('Accessibility — smoke checks', () => {
  test('dashboard has <h1> element', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible({ timeout: 8_000 });
  });

  test('features page has landmark elements', async ({ page }) => {
    await page.goto('/features');
    await page.waitForLoadState('domcontentloaded');
    // main content area or heading should exist
    const main = page.locator('main, [role="main"], h1').first();
    await expect(main).toBeVisible({ timeout: 8_000 });
  });
});
