import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * What the payment surface is *for*. Drives copy/emphasis and (later slices)
 * which fields the flow collects — one component replaces the four sibling
 * payment components (`payment-summary-card`, `payment-gateway-demo`,
 * `payment-receipt`, `booking-confirmation`) as the Onda 9b marco lands.
 */
export type PaymentIntentKind = 'checkout' | 'deposit' | 'refund';

/**
 * The full lifecycle of a payment attempt. Resolved as an explicit state
 * machine (no RxJS) so every branch is testable:
 *
 * idle → validating → ready → processing → success
 *                       ↘ error (retry → validating)
 *                                 ↘ expired | cancelled (terminal)
 *
 * This slice (NG-05 · fatia 1) wires `idle → validating → ready | error`.
 * `processing`/`success`/`expired`/`cancelled` are part of the stable API
 * shape but are driven in the following slices.
 */
export type PaymentState =
  | 'idle'
  | 'validating'
  | 'ready'
  | 'processing'
  | 'success'
  | 'error'
  | 'expired'
  | 'cancelled';

/** A rejected pre-condition surfaced to the UI (never a live Stripe error). */
export interface PaymentValidationError {
  /** Machine-readable reason — stable for tests and copy lookup. */
  code: 'invalid_amount' | 'invalid_currency';
  /** Human copy shown in the error region (PT-first, matches the app). */
  message: string;
}

/**
 * IU Payment Component (`<iu-payment>`) — Onda 9b, gated by `PAYMENT_V2`.
 *
 * Standalone, signal-based, M3-inspired. Deliberately NO money moves here:
 * the component owns the *state machine and validation* of a payment attempt;
 * Stripe (test mode only, `sk_test_*`) is wired in a later slice behind the
 * flag. Replaces the four sibling payment components as the interface shrinks.
 *
 * Slots:
 *   - [slot="header"]  → title / context
 *   - [slot="summary"] → amount breakdown / line items
 *   - Default slot     → the collection form (later slice)
 *   - [slot="actions"] → CTA buttons
 *
 * State (this slice): `validate()` moves `idle → validating` then resolves to
 * `ready` (amount + currency valid) or `error` (with a `PaymentValidationError`).
 * The status region is `role="status" aria-live="polite"` so each transition is
 * announced. `retry()` re-runs validation; `reset()` returns to `idle`.
 */
@Component({
  selector: 'iu-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentComponent {
  // --- Inputs ---
  /** What the surface is for — checkout | deposit | refund. */
  intent   = input<PaymentIntentKind>('checkout');
  /** Amount to move, in major currency units. Must be finite and > 0. */
  amount   = input<number>(0);
  /** ISO-4217 currency code (3 upper-case letters), e.g. `EUR`. */
  currency = input<string>('EUR');
  /** Inert while true — `validate()`/`retry()` become no-ops. */
  disabled = input<boolean>(false);

  // --- Outputs ---
  /** Fires on every state transition with the new state. */
  stateChange = output<PaymentState>();

  // --- Internal state ---
  private _state = signal<PaymentState>('idle');
  private _error = signal<PaymentValidationError | null>(null);

  /** Current lifecycle state (read-only to the outside world). */
  readonly state = this._state.asReadonly();
  /** The validation error when `state === 'error'`, else `null`. */
  readonly error = this._error.asReadonly();

  // --- Computed validation ---
  /** Amount is a real, positive number. */
  amountValid   = computed(() => Number.isFinite(this.amount()) && this.amount() > 0);
  /** Currency is a well-formed ISO-4217 code. */
  currencyValid = computed(() => /^[A-Z]{3}$/.test(this.currency()));
  /** Both pre-conditions hold — the flow may advance. */
  isValid       = computed(() => this.amountValid() && this.currencyValid());

  // --- Computed UI ---
  /** True while the machine is doing work (busy affordances + aria-busy). */
  isBusy = computed(() =>
    this._state() === 'validating' || this._state() === 'processing',
  );

  /** Live-region copy — announced on every state change. */
  statusText = computed(() => {
    switch (this._state()) {
      case 'validating': return 'A validar o pagamento…';
      case 'ready':      return 'Pronto para pagar.';
      case 'processing': return 'A processar o pagamento…';
      case 'success':    return 'Pagamento concluído.';
      case 'error':      return this._error()?.message ?? 'Não foi possível continuar.';
      case 'expired':    return 'A sessão de pagamento expirou.';
      case 'cancelled':  return 'Pagamento cancelado.';
      default:           return '';
    }
  });

  ariaBusy = computed(() => (this.isBusy() ? 'true' : null));

  hostClass = computed(() => {
    const c = [
      'iu-payment',
      `iu-payment--${this.intent()}`,
      `iu-payment--state-${this._state()}`,
    ];
    if (this.disabled()) c.push('iu-payment--disabled');
    if (this.isBusy())   c.push('iu-payment--busy');
    return c.join(' ');
  });

  // --- Handlers ---
  /**
   * Run the pre-flight checks. `idle → validating`, then resolves to `ready`
   * (valid) or `error` (with a {@link PaymentValidationError}). Returns whether
   * the flow may advance. No-op while disabled or already busy.
   */
  validate(): boolean {
    if (this.disabled() || this.isBusy()) return false;
    this.setState('validating');

    if (!this.amountValid()) {
      this.fail({ code: 'invalid_amount', message: 'Montante inválido.' });
      return false;
    }
    if (!this.currencyValid()) {
      this.fail({ code: 'invalid_currency', message: 'Moeda inválida.' });
      return false;
    }

    this._error.set(null);
    this.setState('ready');
    return true;
  }

  /** Re-run validation after an error. Inert unless the state is `error`. */
  retry(): boolean {
    if (this._state() !== 'error') return false;
    return this.validate();
  }

  /** Return the machine to `idle` and clear any error. */
  reset(): void {
    this._error.set(null);
    this.setState('idle');
  }

  private fail(err: PaymentValidationError): void {
    this._error.set(err);
    this.setState('error');
  }

  private setState(next: PaymentState): void {
    this._state.set(next);
    this.stateChange.emit(next);
  }
}
