/**
 * @fileoverview SignalFormsPocComponent — Angular 22 official Signal Forms PoC.
 *
 * Angular v22 promoted **Signal Forms** (`@angular/forms/signals`) to a stable,
 * production-ready API. This repo has shipped a *bespoke* signal-form abstraction
 * (`libs/core/src/lib/utils/signal-form.ts`, `createSignalForm`) since Sprint 024,
 * built before the official API existed.
 *
 * This component is an **additive, side-by-side proof-of-concept** that rebuilds a
 * property-inquiry form with the official `form()` / `schema` API — the same shape
 * `PropertyBookingComponent` builds with the in-house `createSignalForm`. It is
 * gated behind the `SIGNAL_FORMS_POC` feature flag and replaces nothing; its
 * purpose is to de-risk a future migration (bespoke → official) and give Israel a
 * concrete A/B artifact to ratify direction.
 *
 * Migration map (bespoke `createSignalForm` → official `form()`):
 * | bespoke                              | official Signal Forms                 |
 * | ------------------------------------ | ------------------------------------- |
 * | `createSignalForm({ name: {...} })`  | `form(signal({...}), schemaFn)`       |
 * | `validators: [required()]`           | `required(path.name)` inside schema   |
 * | `form.fields.name.value()`           | `f.name().value()`                    |
 * | `form.fields.name.setValue(v)` (manual) | `[formField]` directive (two-way)  |
 * | `form.fields.name.showError()`       | `f.name().touched() && f.name().invalid()` |
 * | `form.valid()`                       | `f().valid()`                         |
 * | `form.submit()` (marks touched)      | `f().markAsTouched()` + `f().valid()` |
 *
 * Feature flag: `SIGNAL_FORMS_POC`
 *
 * @see libs/core/src/lib/utils/signal-form.ts — the bespoke abstraction this compares against
 * @see libs/core/src/lib/components/property-booking/property-booking.component.ts — bespoke consumer
 *
 * Night Shift 2026-08-18 — Signal Forms PoC (Angular 22 GA).
 */
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  output,
  signal,
} from '@angular/core';
import {
  FieldTree,
  FormField,
  email,
  form,
  maxLength,
  minLength,
  required,
} from '@angular/forms/signals';

// ─── Models ──────────────────────────────────────────────────────────────────

/**
 * Property-inquiry payload emitted on a valid submit.
 * Mirrors the bespoke `BookingFormData` subset used for inquiries.
 */
export interface SignalFormsInquiry {
  /** Full name of the enquirer */
  name: string;
  /** Contact email */
  email: string;
  /** Free-text message / question about the property */
  message: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Property-inquiry form built with Angular 22's official Signal Forms.
 *
 * The single source of truth is the {@link model} writable signal; `form()` wraps
 * it (no internal copy) and the `[formField]` directive provides two-way binding
 * plus native validity wiring. Validation rules live in a declarative schema
 * co-located with the form — no validator classes, no RxJS, no NgModules.
 *
 * @example
 * ```html
 * <iu-signal-forms-poc (submitted)="onInquiry($event)" />
 * ```
 */
@Component({
  selector: 'iu-signal-forms-poc',
  standalone: true,
  imports: [FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.Emulated,
  template: `
    <form class="sfp" (submit)="onSubmit($event)" novalidate>
      <header class="sfp__header">
        <h2 class="sfp__title">Pedido de informação</h2>
        <p class="sfp__subtitle">
          Angular 22 · Signal Forms
          <span class="sfp__badge">form()</span>
        </p>
      </header>

      <!-- Name ------------------------------------------------------------- -->
      <label class="sfp__field">
        <span class="sfp__label">Nome</span>
        <input
          class="sfp__input"
          type="text"
          [formField]="f.name"
          [class.sfp__input--invalid]="showError(f.name)"
          autocomplete="name"
          placeholder="O seu nome" />
        @if (showError(f.name)) {
          <span class="sfp__error">{{ firstError(f.name) }}</span>
        }
      </label>

      <!-- Email ------------------------------------------------------------ -->
      <label class="sfp__field">
        <span class="sfp__label">Email</span>
        <input
          class="sfp__input"
          type="email"
          [formField]="f.email"
          [class.sfp__input--invalid]="showError(f.email)"
          autocomplete="email"
          placeholder="voce@exemplo.pt" />
        @if (showError(f.email)) {
          <span class="sfp__error">{{ firstError(f.email) }}</span>
        }
      </label>

      <!-- Message ---------------------------------------------------------- -->
      <label class="sfp__field">
        <span class="sfp__label">Mensagem</span>
        <textarea
          class="sfp__input sfp__textarea"
          [formField]="f.message"
          [class.sfp__input--invalid]="showError(f.message)"
          rows="4"
          placeholder="A sua questão sobre o imóvel"></textarea>
        <span class="sfp__hint">{{ f.message().value().length }} / {{ maxMessageLength }}</span>
        @if (showError(f.message)) {
          <span class="sfp__error">{{ firstError(f.message) }}</span>
        }
      </label>

      <footer class="sfp__footer">
        <button
          class="sfp__submit"
          type="submit"
          [disabled]="submitted() && f().invalid()">
          Enviar
        </button>
        @if (justSubmitted()) {
          <span class="sfp__ok" role="status">✓ Pedido enviado</span>
        }
      </footer>
    </form>
  `,
  styles: [
    `
      .sfp {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-width: 26rem;
        padding: 1.5rem;
        border-radius: 1rem;
        background: var(--md-sys-color-surface-container-low, #f5f2f7);
        color: var(--md-sys-color-on-surface, #1c1b1f);
        font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      }
      .sfp__header {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .sfp__title {
        margin: 0;
        font-size: 1.375rem;
        font-weight: 600;
        letter-spacing: -0.01em;
      }
      .sfp__subtitle {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8125rem;
        color: var(--md-sys-color-on-surface-variant, #49454e);
      }
      .sfp__badge {
        padding: 0.125rem 0.5rem;
        border-radius: 999px;
        font-family: ui-monospace, 'SF Mono', Menlo, monospace;
        font-size: 0.6875rem;
        background: var(--md-sys-color-primary-container, #e9ddff);
        color: var(--md-sys-color-on-primary-container, #22005d);
      }
      .sfp__field {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }
      .sfp__label {
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--md-sys-color-on-surface-variant, #49454e);
      }
      .sfp__input {
        padding: 0.625rem 0.75rem;
        border: 1px solid var(--md-sys-color-outline, #79747e);
        border-radius: 0.5rem;
        background: var(--md-sys-color-surface, #fffbff);
        color: var(--md-sys-color-on-surface, #1c1b1f);
        font-size: 0.9375rem;
        transition: border-color 120ms ease, box-shadow 120ms ease;
      }
      .sfp__input:focus {
        outline: none;
        border-color: var(--md-sys-color-primary, #6750a4);
        box-shadow: 0 0 0 2px
          color-mix(in srgb, var(--md-sys-color-primary, #6750a4) 24%, transparent);
      }
      .sfp__input--invalid {
        border-color: var(--md-sys-color-error, #ba1a1a);
      }
      .sfp__textarea {
        resize: vertical;
        min-height: 4.5rem;
        font-family: inherit;
      }
      .sfp__hint {
        align-self: flex-end;
        font-size: 0.6875rem;
        color: var(--md-sys-color-on-surface-variant, #49454e);
      }
      .sfp__error {
        font-size: 0.75rem;
        color: var(--md-sys-color-error, #ba1a1a);
      }
      .sfp__footer {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .sfp__submit {
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
      .sfp__submit:hover:not(:disabled) {
        filter: brightness(1.08);
      }
      .sfp__submit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .sfp__ok {
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--md-sys-color-primary, #6750a4);
      }
    `,
  ],
})
export class SignalFormsPocComponent {
  /** Maximum length accepted for the free-text message. */
  readonly maxMessageLength = 500;

  /**
   * The form's single source of truth. `form()` wraps this signal directly and
   * mutates it in place — reading `model()` after edits reflects live user input.
   */
  private readonly model = signal<SignalFormsInquiry>({
    name: '',
    email: '',
    message: '',
  });

  /**
   * The official Signal Forms field tree. Validation rules are declared inline in
   * the schema function; each rule binds to a typed path on the model.
   */
  protected readonly f = form(this.model, (path) => {
    required(path.name, { message: 'Indique o seu nome.' });
    minLength(path.name, 2, { message: 'Mínimo 2 caracteres.' });

    required(path.email, { message: 'Indique o seu email.' });
    email(path.email, { message: 'Email inválido.' });

    required(path.message, { message: 'Escreva a sua mensagem.' });
    maxLength(path.message, this.maxMessageLength, {
      message: `Máximo ${this.maxMessageLength} caracteres.`,
    });
  });

  /** True once a submit has been attempted (drives error visibility + disabled). */
  protected readonly submitted = signal(false);

  /** Emits the inquiry payload when a valid form is submitted. */
  readonly submitted$ = output<SignalFormsInquiry>({ alias: 'submitted' });

  /** Transient success flag cleared on the next edit-then-submit cycle. */
  private readonly _justSubmitted = signal(false);
  protected readonly justSubmitted = computed(() => this._justSubmitted());

  /**
   * Whether a field should surface its error — touched (or a submit attempted)
   * AND currently invalid. Mirrors the bespoke `SignalField.showError()`.
   */
  protected showError(field: FieldTree<string>): boolean {
    const state = field();
    return (state.touched() || this.submitted()) && state.invalid();
  }

  /** First human-readable error message for a field, or empty string. */
  protected firstError(field: FieldTree<string>): string {
    return field().errors()[0]?.message ?? '';
  }

  /**
   * Submit handler: mark the whole tree touched (so every error shows), then emit
   * only if valid. The official equivalent of the bespoke `form.submit()`.
   */
  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
    this.f().markAsTouched();

    if (this.f().invalid()) {
      this._justSubmitted.set(false);
      return;
    }

    this.submitted$.emit({ ...this.model() });
    this._justSubmitted.set(true);
  }
}
