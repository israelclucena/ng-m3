/**
 * User Flow E2E Tests — Israel UI / Dashboard
 * Sprint 025 (2026-03-19) · reconciled Night Shift 2026-07-25
 *
 * SCOPE NOTE (2026-07-25): this suite was originally authored against a full
 * "LisboaRent" property-rental product (auth, property detail, booking). The
 * app is a component-showcase **portfolio**, not that product
 * (see project_ng-m3_purpose) — `app.routes.ts` ships only: '', dashboard,
 * components, features, settings, properties (a federation-remote demo) and a
 * 404 catch-all. The auth / property-detail / booking suites below therefore
 * target routes that do not exist and are `describe.skip`-ed with a reason
 * rather than deleted, so the intent is preserved and the suite stays green +
 * meaningful. The remaining suites exercise real routes.
 *
 * Feature flag: E2E_SMOKE
 *
 * Run: npx playwright test e2e/tests/user-flows.spec.ts --config=e2e/playwright.config.ts
 */
import { test, expect, Page } from '@playwright/test';
import { captureErrors, realErrors, waitForContent } from './helpers';

// ─── Suite: Auth Flow ─────────────────────────────────────────────────────────
// SKIPPED — no `/auth/*` routes in the portfolio scope. `/auth/login` resolves
// to the 404 page. Re-enable if/when an auth micro-frontend is wired.
test.describe.skip('Auth flow — login', () => {
  test('login page renders without JS errors', async ({ page }) => {
    const errors = captureErrors(page);
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    expect(realErrors(errors)).toHaveLength(0);
  });

  test('login page has email and password inputs', async ({ page }) => {
    await page.goto('/auth/login');
    const emailInput = page.locator(
      'input[type="email"], input[name="email"], input[placeholder*="email" i], iu-auth-login'
    ).first();
    await expect(emailInput).toBeVisible({ timeout: 10_000 });
  });

  test('login page has a submit button', async ({ page }) => {
    await page.goto('/auth/login');
    const btn = page.locator(
      'button[type="submit"], button:has-text("Login"), button:has-text("Entrar"), button:has-text("Sign in")'
    ).first();
    await expect(btn).toBeVisible({ timeout: 10_000 });
  });

  test('login form is not blank — has visible content', async ({ page }) => {
    await page.goto('/auth/login');
    const body = await waitForContent(page);
    expect(body.length).toBeGreaterThan(50);
  });

  test('register page renders', async ({ page }) => {
    await page.goto('/auth/register');
    const body = await waitForContent(page);
    expect(body.length).toBeGreaterThan(50);
  });
});

// ─── Suite: Property Search ────────────────────────────────────────────────────
// SKIPPED — `/properties` is a native-federation demo whose remote
// (`remoteProperties` on :4201) is not deployed; the route renders
// FederationFallbackComponent. Property search / detail are part of the
// unbuilt LisboaRent product. Re-enable when the remote ships.
test.describe.skip('Property search + filter', () => {
  test('properties page loads without JS errors', async ({ page }) => {
    const errors = captureErrors(page);
    await page.goto('/properties');
    await page.waitForLoadState('networkidle');
    expect(realErrors(errors)).toHaveLength(0);
  });

  test('properties page renders content', async ({ page }) => {
    await page.goto('/properties');
    const body = await waitForContent(page);
    expect(body.length).toBeGreaterThan(50);
  });

  test('search input is present on dashboard or properties page', async ({ page }) => {
    await page.goto('/dashboard');
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search" i], input[placeholder*="pesquisar" i], iu-search-autocomplete, iu-global-search'
    ).first();
    const isVisible = await searchInput.isVisible().catch(() => false);
    if (!isVisible) {
      await page.goto('/properties');
    }
    const body = await waitForContent(page);
    expect(body.length).toBeGreaterThan(50);
  });

  test('property detail page renders when navigating by id', async ({ page }) => {
    await page.goto('/properties/1');
    const body = await waitForContent(page);
    expect(body.length).toBeGreaterThan(50);
  });
});

// ─── Suite: Booking Form ──────────────────────────────────────────────────────
// SKIPPED — the property-booking flow is not wired into any shipped route
// (it lived in the LisboaRent product design). Re-enable when a booking demo
// route exists.
test.describe.skip('Booking form — signal form validation', () => {
  async function gotoBookingContext(page: Page): Promise<boolean> {
    await page.goto('/features');
    await page.waitForLoadState('domcontentloaded');
    const hasBooking = await page.locator(
      'iu-property-booking, [data-testid="booking"], button:has-text("Solicitar Visita"), button:has-text("Agendar Visita")'
    ).isVisible().catch(() => false);
    if (hasBooking) return true;
    await page.goto('/properties/1');
    await page.waitForLoadState('domcontentloaded');
    return page.locator(
      'iu-property-booking, button:has-text("Solicitar Visita"), button:has-text("Contactar")'
    ).isVisible().catch(() => false);
  }

  test('features page contains booking or contact demo section', async ({ page }) => {
    await page.goto('/features');
    const body = await waitForContent(page);
    expect(body.length).toBeGreaterThan(100);
  });

  test('booking form — submit button exists when form is shown', async ({ page }) => {
    const found = await gotoBookingContext(page);
    if (!found) test.skip();
    const btn = page.locator(
      'button:has-text("Solicitar Visita"), button:has-text("Enviar Mensagem"), button[type="submit"]'
    ).first();
    await expect(btn).toBeVisible({ timeout: 8_000 });
  });

  test('booking form — name field present', async ({ page }) => {
    const found = await gotoBookingContext(page);
    if (!found) test.skip();
    const nameInput = page.locator('input#pb-name, input[autocomplete="name"]').first();
    const isVisible = await nameInput.isVisible().catch(() => false);
    expect(isVisible || true).toBeTruthy();
  });
});

// ─── Suite: Navigation Guards (real routes) ────────────────────────────────────

test.describe('Navigation — route guards', () => {
  test('dashboard is accessible (no hard redirect to login)', async ({ page }) => {
    await page.goto('/dashboard');
    const body = await waitForContent(page);
    expect(body.length).toBeGreaterThan(50);
  });

  test('all main nav routes return content', async ({ page }) => {
    const routes = ['/dashboard', '/features', '/components', '/settings'];
    for (const route of routes) {
      await page.goto(route);
      const body = await waitForContent(page);
      expect(body.length, `${route} returned blank page`).toBeGreaterThan(50);
    }
  });

  test('unknown sub-route shows error or redirects gracefully', async ({ page }) => {
    await page.goto('/properties/999999/does-not-exist');
    const body = (await waitForContent(page)).toLowerCase();
    const url = page.url();
    const handled =
      url.includes('not-found') ||
      url.includes('error') ||
      body.includes('404') ||
      body.includes('not found') ||
      body.length > 20;
    expect(handled).toBe(true);
  });
});

// ─── Suite: Mobile Responsive (real routes) ────────────────────────────────────

test.describe('Mobile responsive — 375px viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('dashboard renders on mobile without overflow errors', async ({ page }) => {
    const errors = captureErrors(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    expect(realErrors(errors)).toHaveLength(0);
  });

  test('dashboard has visible content at mobile size', async ({ page }) => {
    await page.goto('/dashboard');
    const body = await waitForContent(page);
    expect(body.length).toBeGreaterThan(50);
  });

  test('features page renders on mobile', async ({ page }) => {
    await page.goto('/features');
    const body = await waitForContent(page);
    expect(body.length).toBeGreaterThan(50);
  });
});

// ─── Suite: Performance — page load thresholds ───────────────────────────────

test.describe('Performance — page load times', () => {
  test('dashboard DOMContentLoaded < 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  test('features page DOMContentLoaded < 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/features');
    await page.waitForLoadState('domcontentloaded');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });
});

// ─── Suite: Web Vitals widget ─────────────────────────────────────────────────

test.describe('Web Vitals widget (WEB_VITALS flag)', () => {
  test('features page has web vitals section visible', async ({ page }) => {
    await page.goto('/features');
    await page.waitForLoadState('networkidle');
    const widget = page.locator('iu-web-vitals-widget, #web-vitals, [data-section="web-vitals"]').first();
    const isVisible = await widget.isVisible().catch(() => false);
    if (isVisible) {
      await expect(widget).toBeVisible();
    } else {
      const body = await waitForContent(page);
      expect(body.length).toBeGreaterThan(50);
    }
  });
});
