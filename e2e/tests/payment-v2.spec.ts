/**
 * PAYMENT_V2 — Onda 9b lifecycle & intents (Night Shift 2026-09-07, NG-05 fatia 7)
 *
 * Proves the deep-module `<iu-payment>` state machine on the dashboard Components
 * catalog, behind the `PAYMENT_V2` feature flag: the three intents (checkout |
 * deposit | refund), the happy path (validate → ready → submit → processing →
 * success, via the inert test-mode gateway stub — NO keys, NO network, NO money),
 * the terminal drops (cancelled / expired) and the invalid-amount error + retry.
 *
 * The showcase only renders when `PAYMENT_V2` is ON (flips when the Stripe
 * test-mode adapter + the interface collapse land, NG-06). Until then each test
 * skips itself if the gated block is absent — so the suite stays green while the
 * e2e scaffolding is already in place (same shape as card-v2.spec.ts / NG-02).
 *
 * Feature flag: PAYMENT_V2
 * Run: npx playwright test --config=e2e/playwright.config.ts payment-v2
 */
import { test, expect, Page } from '@playwright/test';

const NAV_TIMEOUT = 15_000;

/** Navigate to the catalog and report whether the PAYMENT_V2 showcase is present. */
async function openShowcase(page: Page): Promise<boolean> {
  await page.goto('/components');
  await expect(page).toHaveTitle(/Components.*Israel UI/i, { timeout: NAV_TIMEOUT });
  const showcase = page.locator('[data-testid="payment-v2-showcase"]');
  return (await showcase.count()) > 0;
}

test.describe('PAYMENT_V2 — intents', () => {
  for (const intent of ['checkout', 'deposit', 'refund'] as const) {
    test(`renders the ${intent} intent surface`, async ({ page }) => {
      test.skip(!(await openShowcase(page)), 'PAYMENT_V2 flag is OFF (flips in NG-06)');
      const host = page.locator(`iu-payment[data-testid="payment-intent-${intent}"] .iu-payment`);
      await expect(host).toBeVisible();
      await expect(host).toHaveClass(new RegExp(`iu-payment--${intent}`));
      // Idle at rest: no busy affordance, no error/terminal region announced.
      await expect(host).toHaveClass(/iu-payment--state-idle/);
    });
  }
});

test.describe('PAYMENT_V2 — happy path', () => {
  test('validate moves idle → ready and announces via the status region', async ({ page }) => {
    test.skip(!(await openShowcase(page)), 'PAYMENT_V2 flag is OFF (flips in NG-06)');
    const flow = page.locator('iu-payment[data-testid="payment-flow"]');
    await expect(page.locator('[data-testid="payment-state"]')).toHaveText('idle');

    await page.locator('[data-testid="pay-validate"]').click();

    await expect(page.locator('[data-testid="payment-state"]')).toHaveText('ready');
    await expect(flow.locator('.iu-payment')).toHaveClass(/iu-payment--state-ready/);
    await expect(flow.locator('.iu-payment__status')).toHaveText(/Pronto para pagar/);
  });

  test('submit takes ready → success through the test-mode stub', async ({ page }) => {
    test.skip(!(await openShowcase(page)), 'PAYMENT_V2 flag is OFF (flips in NG-06)');
    const flow = page.locator('iu-payment[data-testid="payment-flow"]');
    await page.locator('[data-testid="pay-validate"]').click();
    await page.locator('[data-testid="pay-submit"]').click();

    await expect(page.locator('[data-testid="payment-state"]')).toHaveText('success');
    const success = flow.locator('.iu-payment__success');
    await expect(success).toHaveAttribute('role', 'status');
    await expect(success.locator('.iu-payment__restart')).toBeVisible();
    // Settled: the busy flag is cleared (never the literal string 'false').
    await expect(flow.locator('.iu-payment')).not.toHaveAttribute('aria-busy', /.*/);
  });

  test('reset returns success → idle', async ({ page }) => {
    test.skip(!(await openShowcase(page)), 'PAYMENT_V2 flag is OFF (flips in NG-06)');
    await page.locator('[data-testid="pay-validate"]').click();
    await page.locator('[data-testid="pay-submit"]').click();
    await expect(page.locator('[data-testid="payment-state"]')).toHaveText('success');

    await page.locator('[data-testid="pay-reset"]').click();
    await expect(page.locator('[data-testid="payment-state"]')).toHaveText('idle');
  });
});

test.describe('PAYMENT_V2 — terminal states', () => {
  test('cancel drops into the cancelled terminal (polite status + restart)', async ({ page }) => {
    test.skip(!(await openShowcase(page)), 'PAYMENT_V2 flag is OFF (flips in NG-06)');
    const flow = page.locator('iu-payment[data-testid="payment-flow"]');
    await page.locator('[data-testid="pay-cancel"]').click();

    await expect(page.locator('[data-testid="payment-state"]')).toHaveText('cancelled');
    const terminal = flow.locator('.iu-payment__terminal');
    await expect(terminal).toHaveAttribute('role', 'status');
    await expect(terminal).toHaveText(/Pagamento cancelado/);
    await expect(terminal.locator('.iu-payment__restart')).toBeVisible();
  });

  test('expire drops into the expired terminal and announces via role=alert', async ({ page }) => {
    test.skip(!(await openShowcase(page)), 'PAYMENT_V2 flag is OFF (flips in NG-06)');
    const flow = page.locator('iu-payment[data-testid="payment-flow"]');
    await page.locator('[data-testid="pay-expire"]').click();

    await expect(page.locator('[data-testid="payment-state"]')).toHaveText('expired');
    const terminal = flow.locator('.iu-payment__terminal');
    await expect(terminal).toHaveClass(/iu-payment__terminal--expired/);
    await expect(terminal).toHaveAttribute('role', 'alert');
    await expect(terminal).toHaveText(/expirou/);
  });
});

test.describe('PAYMENT_V2 — validation error', () => {
  test('an invalid amount surfaces role=alert with a retry affordance', async ({ page }) => {
    test.skip(!(await openShowcase(page)), 'PAYMENT_V2 flag is OFF (flips in NG-06)');
    const bad = page.locator('iu-payment[data-testid="payment-invalid"]');
    await bad.locator('[data-testid="pay-bad-validate"]').click();

    const errorRegion = bad.locator('.iu-payment__error');
    await expect(errorRegion).toHaveAttribute('role', 'alert');
    await expect(errorRegion).toHaveText(/Montante inválido/);
    await expect(errorRegion.locator('.iu-payment__retry')).toBeVisible();
  });
});
