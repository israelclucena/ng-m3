/**
 * @fileoverview SignalFormsListingComponent — Angular 22 Signal Forms, complex form.
 *
 * Companion to {@link SignalFormsPocComponent} (Sprint 056). Where that PoC proved
 * the official `form()` / `schema` API on a *simple* three-field inquiry, this one
 * stresses the API on a **realistic, cross-validated** surface: a property-listing
 * form modelled on the fields the in-house multi-step `AddPropertyComponent`
 * collects (`NewPropertyForm`). It is additive, side-by-side, gated behind the
 * `SIGNAL_FORMS_LISTING` feature flag, and replaces nothing.
 *
 * The point of this second PoC is the surface the first one never touched:
 *
 * 1. **Cross-field validation** via `validate(path, ({ value, valueOf }) => …)` —
 *    the deposit must sit between 1× and 3× the monthly rent (reads a sibling), and
 *    a `studio` may not declare separate bedrooms (a field validated against the
 *    value of another field).
 * 2. **Typed number + enum + date fields** bound with the same `[formField]`
 *    directive, with `min` / `max` limit validators.
 * 3. **A custom runtime validator** (future-date guard) returning a bespoke
 *    `ValidationError` `{ kind, message }` — the official escape hatch for rules the
 *    built-ins don't cover.
 *
 * Migration note (extends the map in {@link SignalFormsPocComponent}):
 * | bespoke `createSignalForm`                     | official Signal Forms                         |
 * | ---------------------------------------------- | --------------------------------------------- |
 * | cross-field validator reading `form.fields.*`  | `validate(p.deposit, ({valueOf}) => valueOf(p.priceMonthly))` |
 * | manual `Number(value)` coercion on `<input>`   | `[formField]` native number parse             |
 * | custom error object pushed onto a field        | return `{ kind, message }` from `validate`    |
 *
 * Feature flag: `SIGNAL_FORMS_LISTING`
 *
 * @see libs/core/src/lib/components/signal-forms-poc/signal-forms-poc.component.ts — the simple sibling
 * @see libs/core/src/lib/components/add-property/add-property.component.ts — the bespoke multi-step form this mirrors
 *
 * Night Shift 2026-08-19 — Signal Forms PoC #2 (cross-field / complex).
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
  form,
  max,
  maxLength,
  min,
  minLength,
  required,
  validate,
} from '@angular/forms/signals';

// ─── Models ──────────────────────────────────────────────────────────────────

/** Property type accepted by the listing form. `''` = nothing chosen yet. */
export type ListingType =
  | ''
  | 'apartment'
  | 'studio'
  | 'house'
  | 'penthouse'
  | 'villa';

/**
 * Property-listing payload emitted on a valid submit. A deliberate subset of the
 * bespoke `NewPropertyForm` — the fields that carry cross-field rules.
 */
export interface SignalFormsListing {
  /** Advert headline */
  title: string;
  /** Kind of property */
  type: ListingType;
  /** Monthly rent, € */
  priceMonthly: number;
  /** Security deposit, € — constrained to 1×–3× the monthly rent */
  deposit: number;
  /** Number of separate bedrooms (0 for a studio) */
  bedrooms: number;
  /** Usable floor area, m² */
  areaSqm: number;
  /** ISO date (yyyy-mm-dd) the property becomes available — today or later */
  availableFrom: string;
  /** Whether pets are allowed */
  petsAllowed: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Property-listing form built with Angular 22's official Signal Forms, exercising
 * cross-field and custom validation.
 *
 * The single source of truth is the {@link model} writable signal; `form()` wraps
 * it and the schema declares every rule inline — including validators that read a
 * *sibling* field's value via the `valueOf` helper on the field context. No
 * validator classes, no RxJS, no NgModules.
 *
 * @example
 * ```html
 * <iu-signal-forms-listing (submitted)="onListing($event)" />
 * ```
 */
@Component({
  selector: 'iu-signal-forms-listing',
  standalone: true,
  imports: [FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.Emulated,
  template: `
    <form class="sfl" (submit)="onSubmit($event)" novalidate>
      <header class="sfl__header">
        <h2 class="sfl__title">Publicar imóvel</h2>
        <p class="sfl__subtitle">
          Angular 22 · Signal Forms
          <span class="sfl__badge">form()</span>
          <span class="sfl__badge sfl__badge--alt">cross-field</span>
        </p>
      </header>

      <!-- ── Secção: Básico ────────────────────────────────────────────────── -->
      <fieldset class="sfl__group">
        <legend class="sfl__legend">Básico</legend>

        <label class="sfl__field">
          <span class="sfl__label">Título do anúncio</span>
          <input
            class="sfl__input"
            type="text"
            [formField]="f.title"
            [class.sfl__input--invalid]="showError(f.title)"
            placeholder="Ex: Apartamento T2 renovado em Príncipe Real" />
          <span class="sfl__hint">{{ f.title().value().length }} / {{ maxTitleLength }}</span>
          @if (showError(f.title)) {
            <span class="sfl__error">{{ firstError(f.title) }}</span>
          }
        </label>

        <div class="sfl__row">
          <label class="sfl__field">
            <span class="sfl__label">Tipo</span>
            <select
              class="sfl__input"
              [formField]="f.type"
              [class.sfl__input--invalid]="showError(f.type)">
              <option value="">— selecionar —</option>
              <option value="apartment">Apartamento</option>
              <option value="studio">Estúdio</option>
              <option value="house">Moradia</option>
              <option value="penthouse">Penthouse</option>
              <option value="villa">Villa</option>
            </select>
            @if (showError(f.type)) {
              <span class="sfl__error">{{ firstError(f.type) }}</span>
            }
          </label>

          <label class="sfl__field">
            <span class="sfl__label">Área (m²)</span>
            <input
              class="sfl__input"
              type="number"
              [formField]="f.areaSqm"
              [class.sfl__input--invalid]="showError(f.areaSqm)"
              placeholder="65" />
            @if (showError(f.areaSqm)) {
              <span class="sfl__error">{{ firstError(f.areaSqm) }}</span>
            }
          </label>
        </div>
      </fieldset>

      <!-- ── Secção: Condições ─────────────────────────────────────────────── -->
      <fieldset class="sfl__group">
        <legend class="sfl__legend">Condições</legend>

        <div class="sfl__row">
          <label class="sfl__field">
            <span class="sfl__label">Renda mensal (€)</span>
            <input
              class="sfl__input"
              type="number"
              [formField]="f.priceMonthly"
              [class.sfl__input--invalid]="showError(f.priceMonthly)"
              placeholder="1200" />
            @if (showError(f.priceMonthly)) {
              <span class="sfl__error">{{ firstError(f.priceMonthly) }}</span>
            }
          </label>

          <label class="sfl__field">
            <span class="sfl__label">Caução (€)</span>
            <input
              class="sfl__input"
              type="number"
              [formField]="f.deposit"
              [class.sfl__input--invalid]="showError(f.deposit)"
              placeholder="2400" />
            <span class="sfl__hint">1× a 3× a renda</span>
            @if (showError(f.deposit)) {
              <span class="sfl__error">{{ firstError(f.deposit) }}</span>
            }
          </label>
        </div>

        <div class="sfl__row">
          <label class="sfl__field">
            <span class="sfl__label">Quartos</span>
            <input
              class="sfl__input"
              type="number"
              [formField]="f.bedrooms"
              [class.sfl__input--invalid]="showError(f.bedrooms)"
              placeholder="2" />
            @if (showError(f.bedrooms)) {
              <span class="sfl__error">{{ firstError(f.bedrooms) }}</span>
            }
          </label>

          <label class="sfl__field">
            <span class="sfl__label">Disponível a partir de</span>
            <input
              class="sfl__input"
              type="date"
              [formField]="f.availableFrom"
              [class.sfl__input--invalid]="showError(f.availableFrom)" />
            @if (showError(f.availableFrom)) {
              <span class="sfl__error">{{ firstError(f.availableFrom) }}</span>
            }
          </label>
        </div>

        <label class="sfl__check">
          <input type="checkbox" [formField]="f.petsAllowed" />
          <span>Aceita animais de estimação</span>
        </label>
      </fieldset>

      <footer class="sfl__footer">
        <button
          class="sfl__submit"
          type="submit"
          [disabled]="submitted() && f().invalid()">
          Publicar
        </button>
        @if (justSubmitted()) {
          <span class="sfl__ok" role="status">✓ Imóvel publicado</span>
        }
      </footer>
    </form>
  `,
  styles: [
    `
      .sfl {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        max-width: 32rem;
        padding: 1.5rem;
        border-radius: 1rem;
        background: var(--md-sys-color-surface-container-low, #f5f2f7);
        color: var(--md-sys-color-on-surface, #1c1b1f);
        font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      }
      .sfl__header {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .sfl__title {
        margin: 0;
        font-size: 1.375rem;
        font-weight: 600;
        letter-spacing: -0.01em;
      }
      .sfl__subtitle {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8125rem;
        color: var(--md-sys-color-on-surface-variant, #49454e);
      }
      .sfl__badge {
        padding: 0.125rem 0.5rem;
        border-radius: 999px;
        font-family: ui-monospace, 'SF Mono', Menlo, monospace;
        font-size: 0.6875rem;
        background: var(--md-sys-color-primary-container, #e9ddff);
        color: var(--md-sys-color-on-primary-container, #22005d);
      }
      .sfl__badge--alt {
        background: var(--md-sys-color-tertiary-container, #ffd8e4);
        color: var(--md-sys-color-on-tertiary-container, #31111d);
      }
      .sfl__group {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin: 0;
        padding: 1rem 1rem 1.125rem;
        border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
        border-radius: 0.75rem;
      }
      .sfl__legend {
        padding: 0 0.375rem;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--md-sys-color-on-surface-variant, #49454e);
      }
      .sfl__row {
        display: flex;
        gap: 0.875rem;
        flex-wrap: wrap;
      }
      .sfl__row > .sfl__field {
        flex: 1 1 10rem;
      }
      .sfl__field {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }
      .sfl__label {
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--md-sys-color-on-surface-variant, #49454e);
      }
      .sfl__input {
        padding: 0.625rem 0.75rem;
        border: 1px solid var(--md-sys-color-outline, #79747e);
        border-radius: 0.5rem;
        background: var(--md-sys-color-surface, #fffbff);
        color: var(--md-sys-color-on-surface, #1c1b1f);
        font-size: 0.9375rem;
        transition: border-color 120ms ease, box-shadow 120ms ease;
      }
      .sfl__input:focus {
        outline: none;
        border-color: var(--md-sys-color-primary, #6750a4);
        box-shadow: 0 0 0 2px
          color-mix(in srgb, var(--md-sys-color-primary, #6750a4) 24%, transparent);
      }
      .sfl__input--invalid {
        border-color: var(--md-sys-color-error, #ba1a1a);
      }
      .sfl__hint {
        align-self: flex-end;
        font-size: 0.6875rem;
        color: var(--md-sys-color-on-surface-variant, #49454e);
      }
      .sfl__error {
        font-size: 0.75rem;
        color: var(--md-sys-color-error, #ba1a1a);
      }
      .sfl__check {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: var(--md-sys-color-on-surface, #1c1b1f);
      }
      .sfl__footer {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .sfl__submit {
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
      .sfl__submit:hover:not(:disabled) {
        filter: brightness(1.08);
      }
      .sfl__submit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .sfl__ok {
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--md-sys-color-primary, #6750a4);
      }
    `,
  ],
})
export class SignalFormsListingComponent {
  /** Maximum length accepted for the advert title. */
  readonly maxTitleLength = 100;
  /** Deposit floor as a multiple of the monthly rent. */
  readonly depositMinMonths = 1;
  /** Deposit ceiling as a multiple of the monthly rent. */
  readonly depositMaxMonths = 3;

  /**
   * The form's single source of truth. `form()` wraps this signal directly and
   * mutates it in place — reading `model()` after edits reflects live user input.
   */
  private readonly model = signal<SignalFormsListing>({
    title: '',
    type: '',
    priceMonthly: 0,
    deposit: 0,
    bedrooms: 0,
    areaSqm: 0,
    availableFrom: '',
    petsAllowed: false,
  });

  /**
   * The official Signal Forms field tree. Standard limit validators live inline;
   * the three custom rules below reach across fields via `valueOf`.
   */
  protected readonly f = form(this.model, (path) => {
    required(path.title, { message: 'Indique um título.' });
    minLength(path.title, 8, { message: 'Mínimo 8 caracteres.' });
    maxLength(path.title, this.maxTitleLength, {
      message: `Máximo ${this.maxTitleLength} caracteres.`,
    });

    // Enum select: '' is empty → required rejects it.
    required(path.type, { message: 'Escolha o tipo de imóvel.' });

    required(path.priceMonthly, { message: 'Indique a renda.' });
    min(path.priceMonthly, 100, { message: 'Renda mínima €100.' });
    max(path.priceMonthly, 50000, { message: 'Renda máxima €50 000.' });

    min(path.areaSqm, 10, { message: 'Área mínima 10 m².' });
    max(path.areaSqm, 2000, { message: 'Área máxima 2000 m².' });

    min(path.bedrooms, 0, { message: 'Não pode ser negativo.' });
    max(path.bedrooms, 20, { message: 'Máximo 20 quartos.' });

    required(path.availableFrom, { message: 'Indique a data.' });

    // ── Cross-field: caução entre 1× e 3× a renda ─────────────────────────
    validate(path.deposit, ({ value, valueOf }) => {
      const rent = valueOf(path.priceMonthly);
      const dep = value();
      if (!rent || rent <= 0) return null; // rent not set yet — nothing to check
      if (dep < rent * this.depositMinMonths) {
        return {
          kind: 'depositTooLow',
          message: `Caução mínima ${this.depositMinMonths} mês (€${rent * this.depositMinMonths}).`,
        };
      }
      if (dep > rent * this.depositMaxMonths) {
        return {
          kind: 'depositTooHigh',
          message: `Caução máxima ${this.depositMaxMonths} meses (€${rent * this.depositMaxMonths}).`,
        };
      }
      return null;
    });

    // ── Cross-field: um estúdio não declara quartos separados ─────────────
    validate(path.bedrooms, ({ value, valueOf }) => {
      if (valueOf(path.type) === 'studio' && value() > 0) {
        return {
          kind: 'studioHasBedrooms',
          message: 'Um estúdio tem 0 quartos separados.',
        };
      }
      return null;
    });

    // ── Custom runtime rule: a data deve ser hoje ou futura ───────────────
    validate(path.availableFrom, ({ value }) => {
      const raw = value();
      if (!raw) return null; // empty is handled by required()
      const picked = new Date(`${raw}T00:00:00`);
      if (Number.isNaN(picked.getTime())) {
        return { kind: 'dateInvalid', message: 'Data inválida.' };
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (picked < today) {
        return { kind: 'datePast', message: 'A data deve ser hoje ou futura.' };
      }
      return null;
    });
  });

  /** True once a submit has been attempted (drives error visibility + disabled). */
  protected readonly submitted = signal(false);

  /** Emits the listing payload when a valid form is submitted. */
  readonly submitted$ = output<SignalFormsListing>({ alias: 'submitted' });

  /** Transient success flag cleared on the next edit-then-submit cycle. */
  private readonly _justSubmitted = signal(false);
  protected readonly justSubmitted = computed(() => this._justSubmitted());

  /**
   * Whether a field should surface its error — touched (or a submit attempted)
   * AND currently invalid. Generic so number/enum/string fields all fit.
   */
  protected showError<T>(field: FieldTree<T>): boolean {
    const state = field();
    return (state.touched() || this.submitted()) && state.invalid();
  }

  /** First human-readable error message for a field, or empty string. */
  protected firstError<T>(field: FieldTree<T>): string {
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
