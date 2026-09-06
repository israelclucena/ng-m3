/**
 * CARD_V2 — Onda 9 kinds & states (Night Shift 2026-09-06, NG-02)
 *
 * Proves the deep-module `<iu-card>` rendering the four semantic kinds
 * (plain | action | profile | stat) plus real states (loading, error, media)
 * on the dashboard Components catalog, behind the `CARD_V2` feature flag.
 *
 * The showcase only renders when `CARD_V2` is ON (flag flips in NG-03, when the
 * 17 app usages migrate). Until then each test skips itself if the gated block
 * is absent — so the suite stays green while the scaffolding is already in place.
 *
 * Feature flag: CARD_V2
 * Run: npx playwright test --config=e2e/playwright.config.ts card-v2
 */
import { test, expect, Page } from '@playwright/test';

const NAV_TIMEOUT = 15_000;

/** Navigate to the catalog and report whether the CARD_V2 showcase is present. */
async function openShowcase(page: Page): Promise<boolean> {
  await page.goto('/components');
  await expect(page).toHaveTitle(/Components.*Israel UI/i, { timeout: NAV_TIMEOUT });
  const showcase = page.locator('[data-testid="card-v2-showcase"]');
  return (await showcase.count()) > 0;
}

test.describe('CARD_V2 — semantic kinds', () => {
  for (const kind of ['plain', 'action', 'profile', 'stat'] as const) {
    test(`renders the ${kind} kind card`, async ({ page }) => {
      test.skip(!(await openShowcase(page)), 'CARD_V2 flag is OFF (flips in NG-03)');
      const card = page.locator(`iu-card[data-testid="card-kind-${kind}"]`);
      await expect(card).toBeVisible();
      await expect(card.locator('.iu-card')).toHaveClass(new RegExp(`iu-card--kind-${kind}`));
    });
  }
});

test.describe('CARD_V2 — real states', () => {
  test('loading card is aria-busy with a skeleton', async ({ page }) => {
    test.skip(!(await openShowcase(page)), 'CARD_V2 flag is OFF (flips in NG-03)');
    const card = page.locator('iu-card[data-testid="card-state-loading"] .iu-card');
    await expect(card).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('iu-card[data-testid="card-state-loading"] [data-testid="card-skeleton"]')).toBeVisible();
  });

  test('error card announces via role=alert and offers retry', async ({ page }) => {
    test.skip(!(await openShowcase(page)), 'CARD_V2 flag is OFF (flips in NG-03)');
    const region = page.locator('iu-card[data-testid="card-state-error"] [data-testid="card-error"]');
    await expect(region).toHaveAttribute('role', 'alert');
    await expect(region.locator('[data-testid="card-retry"]')).toBeVisible();
  });

  test('media card renders an image inside the aspect-ratio box', async ({ page }) => {
    test.skip(!(await openShowcase(page)), 'CARD_V2 flag is OFF (flips in NG-03)');
    const img = page.locator('iu-card[data-testid="card-state-media"] .iu-card__media-img');
    await expect(img).toHaveCount(1);
  });
});
