/**
 * Shared E2E helpers — Israel UI Dashboard
 * Night Shift 2026-07-25
 *
 * Extracted so smoke.spec.ts and user-flows.spec.ts share one correct
 * definition of "did the app render?" and "is this a real JS error?".
 *
 * NOTE: filename is `helpers.ts` (not `*.spec.ts`) so Playwright's
 * `testMatch: '**\/*.spec.ts'` does NOT collect it as a test file.
 */
import { expect, Page } from '@playwright/test';

/**
 * The dashboard's `main.ts` calls `initFederation()` against a dev-only
 * micro-frontend remote at this origin. The remote is NOT deployed alongside
 * the shell (see remote-properties/README.md + FederationFallbackComponent),
 * so in CI/headless the fetch fails with ERR_CONNECTION_REFUSED / "Failed to
 * fetch". That failure is expected and handled gracefully by the app.
 */
export const FEDERATION_REMOTE_HINT = ':4201';

/**
 * URLs that are dev-server/tooling internals and can never be a real production
 * app resource, so a failure to load them is NOT a regression:
 *  - `:4201` — the dev-only micro-frontend federation remote (not deployed).
 *  - `/vite/deps/` + `/.angular/cache/` — Vite's optimizeDeps pre-bundles. Under
 *    `nx serve` a re-optimization can briefly invalidate a `?v=<hash>` bundle
 *    referenced by an already-loaded `main.js`, yielding a transient
 *    "Failed to fetch" — a dev HMR race, never a shipped asset.
 */
function isDevToolingUrl(u: string): boolean {
  return (
    u.includes(FEDERATION_REMOTE_HINT) ||
    u.includes('/vite/deps/') ||
    u.includes('/.angular/cache/')
  );
}

/** Console/page errors plus the URLs of any failed network requests. */
export interface Captured {
  messages: string[];
  failedUrls: string[];
}

/** Attach listeners that collect JS errors + failed request URLs for a test. */
export function captureErrors(page: Page): Captured {
  const c: Captured = { messages: [], failedUrls: [] };
  page.on('pageerror', err => c.messages.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') c.messages.push(msg.text());
  });
  page.on('requestfailed', req => c.failedUrls.push(req.url()));
  return c;
}

/**
 * Filter dev-tooling / service-worker noise and the network chatter that is
 * inherent to running this native-federation app under the `nx serve` (Vite)
 * dev harness, WITHOUT going blind to real app JS errors.
 *
 * What is dropped, and why it is safe:
 *  - favicon / service-worker / ngsw / ResizeObserver — long-standing dev noise.
 *  - Any message naming a Vite/`.angular/cache` internal — optimizeDeps races.
 *  - The two GENERIC network strings `Failed to fetch` and
 *    `ERR_CONNECTION_REFUSED`: in this mock-data app (no backend) the only
 *    refused connection is the dev-only `:4201` federation remote, and the only
 *    bare "Failed to fetch" is the Vite optimizeDeps re-optimization race.
 *
 * Why this stays NON-BLIND: real app defects surface as THROWN exceptions with
 * rich messages (e.g. `NG0701: Missing locale data`, `TypeError: … is not a
 * function`) captured via `pageerror` — none of which match the strings above,
 * so they still fail the test. And a genuinely broken resource load also blanks
 * the page, which the content/visibility assertions catch independently.
 */
export function realErrors(c: Captured): string[] {
  // Real app-resource failures (a URL that is NOT dev-tooling) must never be
  // hidden — surface them explicitly so the generic-string drop below is safe.
  const realResourceFailures = c.failedUrls.filter(u => !isDevToolingUrl(u));

  const filtered = c.messages.filter(e => {
    if (
      e.includes('favicon') ||
      e.includes('service-worker') ||
      e.includes('ngsw') ||
      e.includes('ResizeObserver') ||
      e.includes('/vite/deps/') ||
      e.includes('/.angular/cache/')
    ) {
      return false;
    }
    if (e.includes('Failed to fetch') || e.includes('ERR_CONNECTION_REFUSED')) {
      return false;
    }
    return true;
  });

  return [...filtered, ...realResourceFailures.map(u => `Real resource failed to load: ${u}`)];
}

/**
 * Wait for the Angular app to actually render content. The dashboard is a
 * client-side-rendered SPA under `nx serve`, so `DOMContentLoaded` fires while
 * the body is still the ~17-char empty shell. This polls (bounded) until the
 * body has meaningful content, then returns the trimmed body text so the caller
 * can make its own threshold assertion.
 *
 * Non-blind: if the page never renders (real regression), the poll times out
 * (swallowed here) and the caller's assertion runs against the empty body and
 * fails.
 */
export async function waitForContent(page: Page): Promise<string> {
  await page.waitForLoadState('domcontentloaded');
  try {
    await expect
      .poll(async () => (await page.locator('body').textContent())?.trim().length ?? 0, {
        timeout: 15_000,
        intervals: [200, 400, 800, 1500],
      })
      .toBeGreaterThan(30); // > empty-shell size (~17)
  } catch {
    /* fall through — the caller makes the real assertion on the body below */
  }
  return (await page.locator('body').textContent())?.trim() ?? '';
}
