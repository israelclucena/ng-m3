import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { ButtonComponent, DividerComponent, PaymentComponent } from '@israel-ui/core';
import type { PaymentIntentKind, PaymentState } from '@israel-ui/core';
import { FeatureFlags } from '../feature-flags';

/**
 * Payment — Onda 9b showcase (NG-06, milestone proof surface).
 *
 * A single dedicated page that renders the *one* `<iu-payment>` component across
 * its three intents (checkout | deposit | refund) and every state of its
 * lifecycle machine (idle → validating → ready → processing → success, plus
 * error+retry and the terminal cancelled/expired). This is the "algo que o
 * Israel mostra a outra pessoa": one component, one interface, the whole
 * payment behaviour — visible on one screen.
 *
 * **Never moves real money.** The component's money-move seam
 * (`IU_PAYMENT_GATEWAY`) defaults to an inert test-mode stub — no keys, no
 * network, no charge. The live-flow card below drives the real state machine
 * through that stub; the state gallery seeds each state via `initialState`
 * without running the machine. The real Stripe adapter (test mode, `sk_test_*`)
 * and the in-app adoption stay behind the separate `PAYMENT_V2` flag.
 *
 * Additive and self-contained: a new lazy route (`/payment-showcase`) gated by
 * `PAYMENT_SHOWCASE`, touching no existing page. The nav link + README/portfolio
 * link + screenshots land with the marco close.
 */
@Component({
  selector: 'app-payment-showcase-page',
  standalone: true,
  imports: [PaymentComponent, ButtonComponent, DividerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @if (flags.PAYMENT_SHOWCASE) {
      <div class="showcase" data-testid="payment-showcase">
        <header>
          <h1>Payment — one component, every state</h1>
          <p class="subtitle">
            The same <code>&lt;iu-payment&gt;</code> covers every intent and drives
            the whole lifecycle as an explicit state machine — no sibling
            components. Onda 9b deep-module proof.
          </p>
          <p class="safety" role="note" data-testid="safety-note">
            🔒 Test-mode only — the money-move seam is an inert stub. No keys, no
            network, <strong>no real charge</strong>.
          </p>
        </header>

        <iu-divider></iu-divider>

        <!-- ═══ LIVE FLOW ═══ -->
        <section aria-labelledby="sc-flow">
          <h2 id="sc-flow">Live flow — drive the machine</h2>
          <div class="group" data-testid="flow">
            <div class="row">
              <iu-payment
                #pay
                intent="checkout"
                [amount]="1200"
                currency="EUR"
                class="cell cell--wide"
                data-testid="payment-flow"
                (stateChange)="onState($event)"
              >
                <h3 slot="header">Checkout · 1200 EUR</h3>
                <div slot="summary" class="summary">
                  <span
                    class="state-badge"
                    [attr.data-state]="pay.state()"
                    data-testid="payment-state"
                    >{{ pay.state() }}</span
                  >
                  <span class="summary-hint">{{ pay.statusText() || '—' }}</span>
                </div>
                <div slot="actions" class="actions">
                  <iu-button
                    variant="filled"
                    label="Validar"
                    data-testid="pay-validate"
                    (clicked)="pay.validate()"
                  ></iu-button>
                  <iu-button
                    variant="filled"
                    label="Pagar"
                    data-testid="pay-submit"
                    (clicked)="pay.submit()"
                  ></iu-button>
                  <iu-button
                    variant="text"
                    label="Cancelar"
                    data-testid="pay-cancel"
                    (clicked)="pay.cancel()"
                  ></iu-button>
                  <iu-button
                    variant="text"
                    label="Expirar"
                    data-testid="pay-expire"
                    (clicked)="pay.expire()"
                  ></iu-button>
                  <iu-button
                    variant="text"
                    label="Recomeçar"
                    data-testid="pay-reset"
                    (clicked)="pay.reset()"
                  ></iu-button>
                </div>
              </iu-payment>

              <!-- Invalid amount → error on Validar (proves the error region + retry). -->
              <iu-payment
                #payBad
                intent="refund"
                [amount]="0"
                currency="EUR"
                class="cell"
                data-testid="payment-invalid"
              >
                <h3 slot="header">Montante inválido</h3>
                <div slot="summary" class="summary">
                  <span class="state-badge" [attr.data-state]="payBad.state()">{{
                    payBad.state()
                  }}</span>
                </div>
                <div slot="actions" class="actions">
                  <iu-button
                    variant="filled"
                    label="Validar"
                    data-testid="pay-bad-validate"
                    (clicked)="payBad.validate()"
                  ></iu-button>
                </div>
              </iu-payment>
            </div>
          </div>
        </section>

        <iu-divider></iu-divider>

        <!-- ═══ INTENTS ═══ -->
        <section aria-labelledby="sc-intents">
          <h2 id="sc-intents">Intents — one modifier, three surfaces</h2>
          <div class="group" data-testid="intents">
            <div class="row">
              @for (i of intents; track i) {
                <iu-payment
                  [intent]="i.kind"
                  [amount]="i.amount"
                  currency="EUR"
                  class="cell"
                  [attr.data-testid]="'intent-' + i.kind"
                >
                  <h3 slot="header">{{ i.kind }}</h3>
                  <div slot="summary" class="summary">
                    <span class="summary-hint">{{ i.amount }} EUR</span>
                  </div>
                </iu-payment>
              }
            </div>
          </div>
        </section>

        <iu-divider></iu-divider>

        <!-- ═══ STATE GALLERY ═══ -->
        <section aria-labelledby="sc-states">
          <h2 id="sc-states">Lifecycle states — seeded</h2>
          <p class="subtitle">
            Each cell is seeded into one state via <code>initialState</code>, so
            the whole machine is visible at a glance. The terminal affordances
            (retry / restart) are live.
          </p>
          <div class="group" data-testid="states">
            <div class="row">
              @for (s of states; track s) {
                <iu-payment
                  intent="checkout"
                  [amount]="500"
                  currency="EUR"
                  [initialState]="s"
                  class="cell"
                  [attr.data-testid]="'state-' + s"
                >
                  <h3 slot="header">{{ s }}</h3>
                </iu-payment>
              }
            </div>
          </div>
        </section>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; overflow-x: hidden; }
    .showcase {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
      overflow-x: hidden;
    }
    h1 {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 8px;
      color: var(--md-sys-color-primary, #6750a4);
    }
    .subtitle {
      font-size: 1rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin-bottom: 12px;
      max-width: 60ch;
    }
    .safety {
      display: inline-block;
      font-size: 0.875rem;
      color: var(--md-sys-color-on-tertiary-container, #31111d);
      background: var(--md-sys-color-tertiary-container, #ffd8e4);
      border-radius: 8px;
      padding: 6px 12px;
      margin: 4px 0 0;
    }
    code {
      font-family: 'Roboto Mono', ui-monospace, monospace;
      background: var(--md-sys-color-surface-container, #f3edf7);
      border-radius: 4px;
      padding: 0 4px;
    }
    section { margin: 32px 0; }
    h2 {
      font-size: 1.5rem;
      font-weight: 500;
      margin-bottom: 16px;
      color: var(--md-sys-color-on-surface, #1d1b20);
    }
    h3 {
      margin: 0 0 4px;
      font-size: 1rem;
      font-weight: 600;
      text-transform: capitalize;
      color: var(--md-sys-color-on-surface, #1d1b20);
    }
    .group { margin-bottom: 28px; }
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: 16px;
    }
    .cell { width: 260px; }
    .cell--wide { width: 380px; }
    .summary {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      margin: 4px 0;
    }
    .summary-hint {
      font-size: 0.875rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .state-badge {
      font: 600 12px/1.4 'Roboto Mono', ui-monospace, monospace;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--md-sys-color-surface-container-high, #ece6f0);
      color: var(--md-sys-color-on-surface, #1d1b20);
    }
    .state-badge[data-state='success'] {
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
    }
    .state-badge[data-state='error'],
    .state-badge[data-state='expired'] {
      background: var(--md-sys-color-error, #b3261e);
      color: var(--md-sys-color-on-error, #fff);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }
    @media (max-width: 600px) {
      .showcase { padding: 16px; }
      h1 { font-size: 1.5rem; }
      h2 { font-size: 1.25rem; }
      .row { gap: 12px; }
      .cell, .cell--wide { width: 100%; }
    }
  `],
})
export class PaymentShowcasePageComponent {
  protected readonly flags = FeatureFlags;

  /** The three intents, with a representative amount each. */
  protected readonly intents: readonly { kind: PaymentIntentKind; amount: number }[] = [
    { kind: 'checkout', amount: 800 },
    { kind: 'deposit', amount: 500 },
    { kind: 'refund', amount: 300 },
  ];

  /** Every lifecycle state, seeded into a cell so the whole machine is visible. */
  protected readonly states: readonly PaymentState[] = [
    'idle',
    'validating',
    'ready',
    'processing',
    'success',
    'error',
    'expired',
    'cancelled',
  ];

  /** Last state the live-flow card emitted — kept for future telemetry/debug. */
  protected lastState: PaymentState = 'idle';

  protected onState(state: PaymentState): void {
    this.lastState = state;
  }
}
