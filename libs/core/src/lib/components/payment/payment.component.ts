import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  type OnInit,
  ViewEncapsulation,
  computed,
  inject,
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
 *
 * From any *active* (non-terminal) state the session may drop into a terminal
 * state: `cancelled` (user aborts) or `expired` (session times out). The three
 * terminal states — `success`, `expired`, `cancelled` — are only left via
 * `reset()`.
 *
 * Slices so far: fatia 1 wired `idle → validating → ready | error`; fatia 2
 * added the terminal `expired`/`cancelled` transitions; fatia 4 wires
 * `ready → processing → success | error` through the {@link IU_PAYMENT_GATEWAY}
 * seam (test-mode stub by default — the real Stripe adapter lands later).
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

/**
 * A failure surfaced to the UI in the `error` state — either a rejected
 * pre-condition (`invalid_amount`/`invalid_currency`) or a settlement failure
 * from the gateway seam (`gateway_declined`/`gateway_timeout`). Never carries a
 * live Stripe secret: the gateway runs in test mode only.
 */
export interface PaymentValidationError {
  /** Machine-readable reason — stable for tests and copy lookup. */
  code:
    | 'invalid_amount'
    | 'invalid_currency'
    | 'gateway_declined'
    | 'gateway_timeout';
  /** Human copy shown in the error region (PT-first, matches the app). */
  message: string;
}

/** What the gateway seam is asked to authorize. Test-mode data only. */
export interface PaymentGatewayRequest {
  /** Amount in major currency units, already validated (> 0, finite). */
  amount: number;
  /** Validated ISO-4217 currency code. */
  currency: string;
  /** The surface's intent — lets a real adapter branch on checkout/deposit/refund. */
  intent: PaymentIntentKind;
  /** Stable across retries of the *same* attempt — dedupes double-submits. */
  idempotencyKey: string;
}

/** The gateway's verdict for an authorize call. Never exposes raw Stripe payloads. */
export type PaymentAuthResult =
  | { outcome: 'succeeded' }
  | { outcome: 'declined'; message?: string };

/** The money-move seam behind `<iu-payment>`. Implementations must stay test-mode. */
export interface PaymentGateway {
  authorize(req: PaymentGatewayRequest): Promise<PaymentAuthResult>;
}

/**
 * Injection seam for the money move. The default (root) implementation is an
 * inert test-mode stub that approves without touching any API — it NEVER moves
 * real money. The real Stripe adapter (test-mode `sk_test_*`, provided over
 * this token) is wired in the Stripe slice. Deliberately NOT re-exported from
 * the package index — the public surface stays ≤5 symbols per the Onda 9b
 * mandate; tests provide a fake by importing this token from the component file.
 */
export const IU_PAYMENT_GATEWAY = new InjectionToken<PaymentGateway>(
  'IU_PAYMENT_GATEWAY',
  {
    providedIn: 'root',
    factory: () => ({
      async authorize(): Promise<PaymentAuthResult> {
        return { outcome: 'succeeded' };
      },
    }),
  },
);

/** Internal marker for a gateway call that overran its budget. Not exported. */
class PaymentTimeoutError extends Error {}

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
export class PaymentComponent implements OnInit {
  // --- Inputs ---
  /** What the surface is for — checkout | deposit | refund. */
  intent   = input<PaymentIntentKind>('checkout');
  /** Amount to move, in major currency units. Must be finite and > 0. */
  amount   = input<number>(0);
  /** ISO-4217 currency code (3 upper-case letters), e.g. `EUR`. */
  currency = input<string>('EUR');
  /** Inert while true — `validate()`/`retry()` become no-ops. */
  disabled = input<boolean>(false);
  /**
   * Seed the surface in a given lifecycle state **once**, at init, *without*
   * running the machine — lets a presentational wrapper (e.g. a post-payment
   * confirmation) show a terminal state (`success`/`error`/`expired`/
   * `cancelled`) it already knows about. Applied in `ngOnInit`; later changes
   * are ignored (the machine owns the state after that). Defaults to `idle`
   * (no seed). Pair with {@link presentational} to suppress the built-in
   * terminal affordances and own the presentation via the slots.
   */
  initialState = input<PaymentState>('idle');
  /**
   * When true, the built-in terminal affordance blocks (the fixed status copy
   * + retry/restart button for `error`/`expired`/`cancelled`/`success`) are
   * **not** rendered, so a wrapper can own the terminal presentation entirely
   * through the `header`/`summary`/default/`actions` slots. The `aria-live`
   * status region is kept. Defaults to `false` (built-in affordances shown).
   */
  presentational = input<boolean>(false);

  // --- Outputs ---
  /** Fires on every state transition with the new state. */
  stateChange = output<PaymentState>();

  // --- Injected seam ---
  /** Test-mode money-move seam; the root default never touches a live API. */
  private readonly gateway = inject(IU_PAYMENT_GATEWAY);

  /** Wall-clock budget for a single gateway authorize before we give up. */
  private static readonly SUBMIT_TIMEOUT_MS = 20_000;

  // --- Internal state ---
  private _state = signal<PaymentState>('idle');
  private _error = signal<PaymentValidationError | null>(null);
  private _idempotencyKey = signal<string | null>(null);

  /** Current lifecycle state (read-only to the outside world). */
  readonly state = this._state.asReadonly();
  /** The validation error when `state === 'error'`, else `null`. */
  readonly error = this._error.asReadonly();
  /**
   * Idempotency key for the in-flight attempt — stable across `retry()`+`submit()`
   * of the same logical payment, cleared by `reset()`. Lets the gateway dedupe a
   * re-submit after a decline. `null` until the first `submit()`.
   */
  readonly idempotencyKey = this._idempotencyKey.asReadonly();

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

  /**
   * True once the attempt has settled and only `reset()` can leave it —
   * `success`, `expired` or `cancelled`. Guards re-entrant transitions.
   */
  isTerminal = computed(() => {
    const s = this._state();
    return s === 'success' || s === 'expired' || s === 'cancelled';
  });

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

  /**
   * One-shot presentational seed. Applied here (not in the constructor, where
   * bound inputs aren't yet available) and set directly on the state signal so
   * it does **not** emit `stateChange` — a seed is not a transition. Ignored
   * when the seed is `idle` (the default). The state machine owns the state
   * from this point on.
   */
  ngOnInit(): void {
    const seed = this.initialState();
    if (seed !== 'idle') this._state.set(seed);
  }

  // --- Handlers ---
  /**
   * Run the pre-flight checks. `idle → validating`, then resolves to `ready`
   * (valid) or `error` (with a {@link PaymentValidationError}). Returns whether
   * the flow may advance. No-op while disabled or already busy.
   */
  validate(): boolean {
    if (this.disabled() || this.isBusy() || this.isTerminal()) return false;
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

  /**
   * Move the (validated) attempt through the gateway. `ready → processing`, then
   * resolves to `success` or `error` (`gateway_declined`/`gateway_timeout`).
   * Reuses the attempt's {@link idempotencyKey} across retries so a re-submit
   * after a decline is deduped. No-op unless the state is `ready`. Resolves to
   * whether the payment succeeded.
   *
   * Never moves real money: the call goes through {@link IU_PAYMENT_GATEWAY},
   * whose default is a test-mode stub. A `cancel()`/`expire()` that lands while
   * the gateway is in flight wins — a late resolution is ignored.
   */
  async submit(): Promise<boolean> {
    if (this.disabled() || this.isBusy() || this.isTerminal()) return false;
    if (this._state() !== 'ready') return false;

    // One key per logical attempt: minted on first submit, kept across retries.
    if (!this._idempotencyKey()) this._idempotencyKey.set(this.newIdempotencyKey());
    const key = this._idempotencyKey()!;

    this._error.set(null);
    this.setState('processing');

    try {
      const result = await this.withTimeout(
        this.gateway.authorize({
          amount: this.amount(),
          currency: this.currency(),
          intent: this.intent(),
          idempotencyKey: key,
        }),
        PaymentComponent.SUBMIT_TIMEOUT_MS,
      );

      // A cancel()/expire() (or a fresh attempt) may have landed mid-flight —
      // if we're no longer processing this same attempt, drop the stale result.
      if (this._state() !== 'processing' || this._idempotencyKey() !== key) {
        return false;
      }

      if (result.outcome === 'succeeded') {
        this.setState('success');
        return true;
      }
      this.fail({
        code: 'gateway_declined',
        message: result.message ?? 'Pagamento recusado.',
      });
      return false;
    } catch (err) {
      if (this._state() !== 'processing' || this._idempotencyKey() !== key) {
        return false;
      }
      this.fail(
        err instanceof PaymentTimeoutError
          ? { code: 'gateway_timeout', message: 'O pagamento excedeu o tempo limite.' }
          : { code: 'gateway_declined', message: 'Não foi possível processar o pagamento.' },
      );
      return false;
    }
  }

  /**
   * Abort the attempt (user-initiated). Moves to the terminal `cancelled`
   * state from any active state, clearing any pending error. No-op once the
   * attempt has settled (`success`/`expired`/`cancelled`). Returns whether the
   * transition happened.
   */
  cancel(): boolean {
    if (this.isTerminal()) return false;
    this._error.set(null);
    this.setState('cancelled');
    return true;
  }

  /**
   * Mark the payment session as timed-out (system-driven). Moves to the
   * terminal `expired` state from any active state, clearing any pending error.
   * No-op once the attempt has settled. Returns whether the transition happened.
   */
  expire(): boolean {
    if (this.isTerminal()) return false;
    this._error.set(null);
    this.setState('expired');
    return true;
  }

  /** Return the machine to `idle`, clearing any error and the attempt's key. */
  reset(): void {
    this._error.set(null);
    this._idempotencyKey.set(null);
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

  /** Race a gateway call against the submit budget; reject on overrun. */
  private withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new PaymentTimeoutError()), ms);
      work.then(
        (value) => { clearTimeout(timer); resolve(value); },
        (error) => { clearTimeout(timer); reject(error); },
      );
    });
  }

  /** Mint a fresh idempotency key (crypto UUID when available). */
  private newIdempotencyKey(): string {
    const c = globalThis.crypto;
    if (c && typeof c.randomUUID === 'function') return c.randomUUID();
    return `pay_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}
