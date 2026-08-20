/**
 * @fileoverview SignalFormsAsyncComponent — Angular 22 Signal Forms, async validation.
 *
 * Fourth in the Signal Forms migration-PoC line:
 *   1. {@link SignalFormsPocComponent}     (Sprint 056) — official `form()`, simple.
 *   2. {@link SignalFormsListingComponent} (Sprint 057) — cross-field + custom rules.
 *   3. {@link SignalFormsRosterComponent}  (Sprint 058) — dynamic arrays (`applyEach`).
 *   4. **this one** (Sprint 059) — the last unproven surface: **asynchronous
 *      validation** — a server-side uniqueness check with a pending state, debounce,
 *      and a late-arriving error.
 *
 * Why it matters: the in-house `createSignalForm` has no async story at all. The most
 * common real need — "is this reference / handle / email already taken?" — can only
 * be answered by a round-trip. Before the bespoke util can be retired, the official
 * `validateAsync` (resource-backed) has to be proven end-to-end.
 *
 * The concrete model is a **listing-reference claim**: a single `reference` field
 * that, once it passes synchronous validation, is checked for availability against a
 * (mock) backend. It exercises:
 *
 * 1. **`validateAsync(path, { params, factory, onSuccess, onError })`** — a resource
 *    keyed on the field value; the result maps to a validation error or `null`.
 * 2. **Gating** — async validation only runs once *sync* validation passes (Angular's
 *    contract), so a too-short reference never hits the backend.
 * 3. **A pending state** — `field().pending()` drives a live "a verificar…" hint and
 *    disables submit while the check is in flight.
 * 4. **Debounce** — the resource only fires after the user stops typing.
 *
 * Both the availability resolver and the debounce are overridable (public fields) so
 * the surface is deterministically testable without a real network.
 *
 * Migration note (extends the map in {@link SignalFormsRosterComponent}):
 * | bespoke `createSignalForm`                       | official Signal Forms                          |
 * | ------------------------------------------------ | ---------------------------------------------- |
 * | no async support — manual subscribe + setError   | `validateAsync(path, { params, factory, … })`  |
 * | hand-rolled "checking…" boolean                  | `field().pending()`                            |
 * | manual debounce via `setTimeout` bookkeeping     | `debounce` option on the async validator       |
 *
 * Feature flag: `SIGNAL_FORMS_ASYNC`
 *
 * @see libs/core/src/lib/components/signal-forms-roster/signal-forms-roster.component.ts — the dynamic-array sibling
 *
 * Night Shift 2026-08-20 — Signal Forms PoC #4 (async validation / validateAsync).
 */
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  output,
  resource,
  signal,
} from '@angular/core';
import {
  FieldTree,
  FormField,
  form,
  minLength,
  pattern,
  required,
  validateAsync,
} from '@angular/forms/signals';

// ─── Models ──────────────────────────────────────────────────────────────────

/** The reference-claim payload emitted on a valid, available submit. */
export interface SignalFormsAsyncClaim {
  /** The listing reference the user is claiming */
  reference: string;
}

/** References already taken in the default mock backend. */
const DEFAULT_TAKEN = new Set(['lisboarent', 'admin', 'arroios-t3', 'demo']);

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Reference-claim form built with Angular 22's official Signal Forms, exercising
 * resource-backed **async validation**.
 *
 * The single source of truth is the {@link model} writable signal. Synchronous rules
 * (required / min-length / slug pattern) run first; only when they pass does
 * {@link validateAsync} spin up a resource keyed on the reference to check
 * availability against {@link checkAvailability}.
 *
 * @example
 * ```html
 * <iu-signal-forms-async (claimed)="onClaim($event)" />
 * ```
 */
@Component({
  selector: 'iu-signal-forms-async',
  standalone: true,
  imports: [FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.Emulated,
  template: `
    <form class="sfa" (submit)="onSubmit($event)" novalidate>
      <header class="sfa__header">
        <h2 class="sfa__title">Reservar referência</h2>
        <p class="sfa__subtitle">
          Angular 22 · Signal Forms
          <span class="sfa__badge">form()</span>
          <span class="sfa__badge sfa__badge--alt">validateAsync</span>
        </p>
      </header>

      <label class="sfa__field">
        <span class="sfa__label">Referência do anúncio</span>
        <div class="sfa__control">
          <input
            class="sfa__input"
            type="text"
            autocomplete="off"
            [formField]="f.reference"
            [class.sfa__input--invalid]="showError(f.reference)"
            [class.sfa__input--ok]="isAvailable()"
            placeholder="ex: alfama-t2" />
          <span class="sfa__status" aria-live="polite">
            @if (pending()) {
              <span class="sfa__spinner" role="status" aria-label="A verificar"></span>
            } @else if (isAvailable()) {
              <span class="sfa__tick" role="status">✓</span>
            }
          </span>
        </div>
        <span class="sfa__hint">
          @if (pending()) {
            A verificar disponibilidade…
          } @else if (isAvailable()) {
            Disponível
          } @else {
            Letras minúsculas, números e hífen · mínimo 3
          }
        </span>
        @if (showError(f.reference)) {
          <span class="sfa__error">{{ firstError(f.reference) }}</span>
        }
      </label>

      <footer class="sfa__footer">
        <button
          class="sfa__submit"
          type="submit"
          [disabled]="pending() || (submitted() && f().invalid())">
          Reservar
        </button>
        @if (justClaimed()) {
          <span class="sfa__ok" role="status">✓ Referência reservada</span>
        }
      </footer>
    </form>
  `,
  styles: [
    `
      .sfa {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        max-width: 30rem;
        padding: 1.5rem;
        border-radius: 1rem;
        background: var(--md-sys-color-surface-container-low, #f5f2f7);
        color: var(--md-sys-color-on-surface, #1c1b1f);
        font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      }
      .sfa__header {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .sfa__title {
        margin: 0;
        font-size: 1.375rem;
        font-weight: 600;
        letter-spacing: -0.01em;
      }
      .sfa__subtitle {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8125rem;
        color: var(--md-sys-color-on-surface-variant, #49454e);
      }
      .sfa__badge {
        padding: 0.125rem 0.5rem;
        border-radius: 999px;
        font-family: ui-monospace, 'SF Mono', Menlo, monospace;
        font-size: 0.6875rem;
        background: var(--md-sys-color-primary-container, #e9ddff);
        color: var(--md-sys-color-on-primary-container, #22005d);
      }
      .sfa__badge--alt {
        background: var(--md-sys-color-tertiary-container, #ffd8e4);
        color: var(--md-sys-color-on-tertiary-container, #31111d);
      }
      .sfa__field {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }
      .sfa__label {
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--md-sys-color-on-surface-variant, #49454e);
      }
      .sfa__control {
        position: relative;
        display: flex;
        align-items: center;
      }
      .sfa__input {
        flex: 1;
        padding: 0.625rem 2.25rem 0.625rem 0.75rem;
        border: 1px solid var(--md-sys-color-outline, #79747e);
        border-radius: 0.5rem;
        background: var(--md-sys-color-surface, #fffbff);
        color: var(--md-sys-color-on-surface, #1c1b1f);
        font-size: 0.9375rem;
        transition: border-color 120ms ease, box-shadow 120ms ease;
      }
      .sfa__input:focus {
        outline: none;
        border-color: var(--md-sys-color-primary, #6750a4);
        box-shadow: 0 0 0 2px
          color-mix(in srgb, var(--md-sys-color-primary, #6750a4) 24%, transparent);
      }
      .sfa__input--invalid {
        border-color: var(--md-sys-color-error, #ba1a1a);
      }
      .sfa__input--ok {
        border-color: #2e7d32;
      }
      .sfa__status {
        position: absolute;
        right: 0.625rem;
        display: grid;
        place-items: center;
        width: 1.25rem;
        height: 1.25rem;
      }
      .sfa__spinner {
        width: 0.875rem;
        height: 0.875rem;
        border: 2px solid
          color-mix(in srgb, var(--md-sys-color-primary, #6750a4) 30%, transparent);
        border-top-color: var(--md-sys-color-primary, #6750a4);
        border-radius: 50%;
        animation: sfa-spin 700ms linear infinite;
      }
      @keyframes sfa-spin {
        to {
          transform: rotate(360deg);
        }
      }
      .sfa__tick {
        color: #2e7d32;
        font-size: 0.9375rem;
        font-weight: 700;
      }
      .sfa__hint {
        font-size: 0.6875rem;
        color: var(--md-sys-color-on-surface-variant, #49454e);
      }
      .sfa__error {
        font-size: 0.75rem;
        color: var(--md-sys-color-error, #ba1a1a);
      }
      .sfa__footer {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .sfa__submit {
        padding: 0.625rem 1.25rem;
        border: none;
        border-radius: 999px;
        background: var(--md-sys-color-primary, #6750a4);
        color: var(--md-sys-color-on-primary, #fff);
        font-size: 0.9375rem;
        font-weight: 500;
        cursor: pointer;
        transition: filter 120ms ease;
      }
      .sfa__submit:hover:not(:disabled) {
        filter: brightness(1.08);
      }
      .sfa__submit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .sfa__ok {
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--md-sys-color-primary, #6750a4);
      }
    `,
  ],
})
export class SignalFormsAsyncComponent {
  /**
   * Availability resolver — resolves `true` if the reference is free. Overridable so
   * specs can drive it deterministically (and a real app can point it at an HTTP
   * call). Defaults to a mock backed by {@link DEFAULT_TAKEN} with a short latency.
   */
  checkAvailability: (reference: string) => Promise<boolean> = (reference) =>
    new Promise((res) =>
      setTimeout(() => res(!DEFAULT_TAKEN.has(reference.trim().toLowerCase())), 450),
    );

  /** Debounce (ms) before the availability resource fires. Overridable in specs. */
  debounceMs = 350;

  /** Slug pattern: lowercase letters, digits and hyphens. */
  private readonly slugPattern = /^[a-z0-9-]+$/;

  /** The form's single source of truth. */
  private readonly model = signal<SignalFormsAsyncClaim>({ reference: '' });

  /**
   * The official Signal Forms field tree. Sync validators run first; `validateAsync`
   * only fires once they pass, spinning up a resource keyed on the reference value.
   */
  protected readonly f = form(this.model, (path) => {
    required(path.reference, { message: 'Indique uma referência.' });
    minLength(path.reference, 3, { message: 'Mínimo 3 caracteres.' });
    pattern(path.reference, this.slugPattern, {
      message: 'Só minúsculas, números e hífen.',
    });

    validateAsync(path.reference, {
      // The resource re-keys on the (normalised) reference value.
      params: ({ value }) => value().trim().toLowerCase(),
      debounce: this.debounceMs,
      factory: (refParam) =>
        resource({
          params: refParam,
          loader: ({ params }) => this.checkAvailability(params),
        }),
      onError: () => ({
        kind: 'refCheckFailed',
        message: 'Não foi possível verificar. Tente novamente.',
      }),
      onSuccess: (available) =>
        available
          ? null
          : { kind: 'refTaken', message: 'Referência já utilizada.' },
    });
  });

  /** True once a submit has been attempted (drives error visibility + disabled). */
  protected readonly submitted = signal(false);

  /** Emits the claim payload when a valid, available reference is submitted. */
  readonly claimed$ = output<SignalFormsAsyncClaim>({ alias: 'claimed' });

  /** Transient success flag cleared on the next edit-then-submit cycle. */
  private readonly _justClaimed = signal(false);
  protected readonly justClaimed = computed(() => this._justClaimed());

  /** Whether the async availability check is currently in flight. */
  protected readonly pending = computed(() => this.f.reference().pending());

  /**
   * Whether the reference is confirmed available — non-empty, fully valid, and not
   * pending. Drives the green tick + hint.
   */
  protected readonly isAvailable = computed(() => {
    const state = this.f.reference();
    return (
      this.model().reference.trim().length >= 3 &&
      state.valid() &&
      !state.pending()
    );
  });

  /**
   * Whether a field should surface its error — touched (or a submit attempted) AND
   * currently invalid (and not still pending).
   */
  protected showError<T>(field: FieldTree<T>): boolean {
    const state = field();
    return (
      (state.touched() || this.submitted()) && state.invalid() && !state.pending()
    );
  }

  /** First human-readable error message for a field, or empty string. */
  protected firstError<T>(field: FieldTree<T>): string {
    return field().errors()[0]?.message ?? '';
  }

  /**
   * Submit handler: mark touched, then emit only if valid (which, thanks to the
   * async gate, means the reference is also confirmed available).
   */
  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
    this.f().markAsTouched();

    if (this.f().pending() || this.f().invalid()) {
      this._justClaimed.set(false);
      return;
    }

    this.claimed$.emit({ reference: this.model().reference });
    this._justClaimed.set(true);
  }
}
