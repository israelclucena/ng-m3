/**
 * FederationFallbackComponent — placeholder shown when the remote-properties
 * micro-frontend is not reachable (i.e. `nx serve remote-properties` is not
 * running on :4201).
 *
 * Sprint 009 originally wired Module Federation between the dashboard shell
 * and `remote-properties`. The setup is intentionally dev-only — there is no
 * production host for the remote — so this component exists to give a clear,
 * self-documenting message instead of failing silently.
 *
 * See: remote-properties/README.md for setup instructions.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-federation-fallback',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mf-fallback">
      <div class="mf-fallback-card">
        <div class="mf-fallback-icon" aria-hidden="true">🏗️</div>
        <h1 class="mf-fallback-title">Module Federation demo</h1>
        <p class="mf-fallback-lead">
          The <code>remote-properties</code> micro-frontend is not currently
          reachable. This route is part of an architectural demo, not a
          production feature.
        </p>

        <div class="mf-fallback-howto">
          <h2>Run the demo locally</h2>
          <p>In a separate terminal, start the remote on port 4201:</p>
          <pre><code>pnpm nx serve remote-properties</code></pre>
          <p>
            Then refresh this page. See
            <code>remote-properties/README.md</code> for the full setup.
          </p>
        </div>

        <p class="mf-fallback-note">
          ng-m3 is a portfolio repository — this demo showcases Angular 21 +
          Native Federation + SSR wiring. The remote is intentionally not
          deployed alongside the shell.
        </p>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }

    .mf-fallback {
      display: flex;
      justify-content: center;
      padding: 4rem 1.5rem;
      min-height: calc(100vh - 8rem);
    }

    .mf-fallback-card {
      max-width: 640px;
      width: 100%;
      padding: 2.5rem;
      background: var(--md-sys-color-surface-container, #fafafa);
      border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
      border-radius: 16px;
      color: var(--md-sys-color-on-surface, #1a1a1a);
    }

    .mf-fallback-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .mf-fallback-title {
      margin: 0 0 0.75rem;
      font-size: 1.75rem;
      font-weight: 500;
    }

    .mf-fallback-lead {
      margin: 0 0 2rem;
      line-height: 1.6;
      color: var(--md-sys-color-on-surface-variant, #4a4a4a);
    }

    .mf-fallback-howto {
      padding: 1.25rem;
      background: var(--md-sys-color-surface-container-high, #f0f0f0);
      border-radius: 12px;
      margin-bottom: 1.5rem;
    }

    .mf-fallback-howto h2 {
      margin: 0 0 0.5rem;
      font-size: 1rem;
      font-weight: 600;
    }

    .mf-fallback-howto p {
      margin: 0.5rem 0;
      line-height: 1.5;
    }

    pre {
      margin: 0.5rem 0;
      padding: 0.75rem 1rem;
      background: var(--md-sys-color-surface-container-highest, #e8e8e8);
      border-radius: 8px;
      overflow-x: auto;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.875rem;
    }

    code {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.875em;
    }

    .mf-fallback-note {
      margin: 0;
      padding-top: 1rem;
      border-top: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
      font-size: 0.875rem;
      color: var(--md-sys-color-on-surface-variant, #6a6a6a);
      line-height: 1.5;
    }
  `],
})
export class FederationFallbackComponent {}
