/**
 * @fileoverview SignalFormsRosterComponent — Angular 22 Signal Forms, dynamic arrays.
 *
 * Third in the Signal Forms migration-PoC line:
 *   1. {@link SignalFormsPocComponent}     (Sprint 056) — the official `form()` on a
 *      *simple* scalar form (name / email / message).
 *   2. {@link SignalFormsListingComponent} (Sprint 057) — cross-field + custom
 *      validators on a realistic scalar surface.
 *   3. **this one** (Sprint 058) — the surface neither PoC touched: a **dynamic,
 *      repeating array of sub-objects** with add/remove, per-item validation, an
 *      array-level minimum, and a cross-item (tree) rule.
 *
 * Why it matters: the in-house `createSignalForm` almost certainly cannot model a
 * *collection* field (a list of co-tenants, amenities, photos…). Before the bespoke
 * util can be retired, the official API has to be proven on the multi-item case.
 *
 * The concrete model is a **split-lease roster** — a lease shared by N co-tenants,
 * each carrying a name, a contact email and a rent share (%). It exercises:
 *
 * 1. **`applyEach(path.tenants, (tenant) => …)`** — one schema applied to *every*
 *    element of the array (`required` name, `email` contact, `min`/`max` share).
 * 2. **An array-level minimum** — `minLength(path.tenants, 1)`: a lease needs at
 *    least one tenant. (`minLength` accepts array paths, not only strings.)
 * 3. **A cross-item / tree rule** — `validate(path.tenants, …)` reads the whole
 *    array's `value()` and rejects it unless the shares sum to exactly 100 %.
 * 4. **Live structural edits** — `addTenant()` / `removeTenant(i)` mutate the model
 *    signal; `form()` rebuilds the per-item field nodes and their validators.
 *
 * Migration note (extends the map in {@link SignalFormsListingComponent}):
 * | bespoke `createSignalForm`                       | official Signal Forms                          |
 * | ------------------------------------------------ | ---------------------------------------------- |
 * | manual `FormArray`-style push/splice + re-wire   | mutate the model array; `applyEach` re-applies |
 * | per-row validator wired by hand on each push     | `applyEach(path.tenants, tenantSchema)` once   |
 * | ad-hoc "sum of shares" check in the submit path  | `validate(path.tenants, ({value}) => …)` tree  |
 *
 * Feature flag: `SIGNAL_FORMS_ROSTER`
 *
 * @see libs/core/src/lib/components/signal-forms-listing/signal-forms-listing.component.ts — the cross-field sibling
 *
 * Night Shift 2026-08-20 — Signal Forms PoC #3 (dynamic arrays / applyEach).
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
  applyEach,
  email,
  form,
  max,
  maxLength,
  min,
  minLength,
  required,
  validate,
} from '@angular/forms/signals';

// ─── Models ──────────────────────────────────────────────────────────────────

/** A single co-tenant on a shared lease. */
export interface RosterTenant {
  /** Full name */
  name: string;
  /** Contact email */
  email: string;
  /** Share of the rent this tenant pays, in percent (0–100) */
  sharePct: number;
}

/** The split-lease payload emitted on a valid submit. */
export interface SignalFormsRoster {
  /** Advert reference / internal label for the lease */
  reference: string;
  /** The co-tenants sharing the lease — at least one, shares summing to 100 % */
  tenants: RosterTenant[];
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Split-lease roster form built with Angular 22's official Signal Forms, exercising
 * a dynamic array of sub-objects via `applyEach`.
 *
 * The single source of truth is the {@link model} writable signal. Structural edits
 * (add / remove a tenant) mutate the `tenants` array on that signal and `form()`
 * reconciles the field tree — no manual `FormArray` bookkeeping.
 *
 * @example
 * ```html
 * <iu-signal-forms-roster (submitted)="onRoster($event)" />
 * ```
 */
@Component({
  selector: 'iu-signal-forms-roster',
  standalone: true,
  imports: [FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.Emulated,
  template: `
    <form class="sfr" (submit)="onSubmit($event)" novalidate>
      <header class="sfr__header">
        <h2 class="sfr__title">Contrato partilhado</h2>
        <p class="sfr__subtitle">
          Angular 22 · Signal Forms
          <span class="sfr__badge">form()</span>
          <span class="sfr__badge sfr__badge--alt">applyEach</span>
        </p>
      </header>

      <label class="sfr__field">
        <span class="sfr__label">Referência do contrato</span>
        <input
          class="sfr__input"
          type="text"
          [formField]="f.reference"
          [class.sfr__input--invalid]="showError(f.reference)"
          placeholder="Ex: T3 Arroios — 2026/09" />
        @if (showError(f.reference)) {
          <span class="sfr__error">{{ firstError(f.reference) }}</span>
        }
      </label>

      <!-- ── Array dinâmico de inquilinos ─────────────────────────────────── -->
      <fieldset class="sfr__group">
        <legend class="sfr__legend">
          Inquilinos
          <span class="sfr__count">{{ tenantCount() }}</span>
        </legend>

        @for (t of f.tenants().value(); track idx; let idx = $index) {
          <div class="sfr__tenant" [class.sfr__tenant--invalid]="tenantInvalid(idx)">
            <div class="sfr__tenant-head">
              <span class="sfr__tenant-n">#{{ idx + 1 }}</span>
              <button
                class="sfr__remove"
                type="button"
                [disabled]="tenantCount() <= 1"
                (click)="removeTenant(idx)"
                aria-label="Remover inquilino">
                ✕
              </button>
            </div>

            <label class="sfr__field">
              <span class="sfr__label">Nome</span>
              <input
                class="sfr__input"
                type="text"
                [formField]="f.tenants[idx].name"
                [class.sfr__input--invalid]="showError(f.tenants[idx].name)"
                placeholder="Nome completo" />
              @if (showError(f.tenants[idx].name)) {
                <span class="sfr__error">{{ firstError(f.tenants[idx].name) }}</span>
              }
            </label>

            <div class="sfr__row">
              <label class="sfr__field sfr__field--grow">
                <span class="sfr__label">Email</span>
                <input
                  class="sfr__input"
                  type="email"
                  [formField]="f.tenants[idx].email"
                  [class.sfr__input--invalid]="showError(f.tenants[idx].email)"
                  placeholder="nome@email.pt" />
                @if (showError(f.tenants[idx].email)) {
                  <span class="sfr__error">{{ firstError(f.tenants[idx].email) }}</span>
                }
              </label>

              <label class="sfr__field sfr__field--share">
                <span class="sfr__label">Quota (%)</span>
                <input
                  class="sfr__input"
                  type="number"
                  [formField]="f.tenants[idx].sharePct"
                  [class.sfr__input--invalid]="showError(f.tenants[idx].sharePct)"
                  placeholder="50" />
                @if (showError(f.tenants[idx].sharePct)) {
                  <span class="sfr__error">{{ firstError(f.tenants[idx].sharePct) }}</span>
                }
              </label>
            </div>
          </div>
        }

        <button class="sfr__add" type="button" (click)="addTenant()">
          + Adicionar inquilino
        </button>

        <!-- Cross-item: soma das quotas -->
        <div
          class="sfr__sum"
          [class.sfr__sum--bad]="showError(f.tenants) && shareError()">
          <span>Soma das quotas</span>
          <strong>{{ shareTotal() }} %</strong>
        </div>
        @if (showError(f.tenants) && shareError()) {
          <span class="sfr__error">{{ shareError() }}</span>
        }
      </fieldset>

      <footer class="sfr__footer">
        <button
          class="sfr__submit"
          type="submit"
          [disabled]="submitted() && f().invalid()">
          Guardar contrato
        </button>
        @if (justSubmitted()) {
          <span class="sfr__ok" role="status">✓ Contrato guardado</span>
        }
      </footer>
    </form>
  `,
  styles: [
    `
      .sfr {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        max-width: 34rem;
        padding: 1.5rem;
        border-radius: 1rem;
        background: var(--md-sys-color-surface-container-low, #f5f2f7);
        color: var(--md-sys-color-on-surface, #1c1b1f);
        font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      }
      .sfr__header {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .sfr__title {
        margin: 0;
        font-size: 1.375rem;
        font-weight: 600;
        letter-spacing: -0.01em;
      }
      .sfr__subtitle {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8125rem;
        color: var(--md-sys-color-on-surface-variant, #49454e);
      }
      .sfr__badge {
        padding: 0.125rem 0.5rem;
        border-radius: 999px;
        font-family: ui-monospace, 'SF Mono', Menlo, monospace;
        font-size: 0.6875rem;
        background: var(--md-sys-color-primary-container, #e9ddff);
        color: var(--md-sys-color-on-primary-container, #22005d);
      }
      .sfr__badge--alt {
        background: var(--md-sys-color-tertiary-container, #ffd8e4);
        color: var(--md-sys-color-on-tertiary-container, #31111d);
      }
      .sfr__group {
        display: flex;
        flex-direction: column;
        gap: 0.875rem;
        margin: 0;
        padding: 1rem 1rem 1.125rem;
        border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
        border-radius: 0.75rem;
      }
      .sfr__legend {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0 0.375rem;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--md-sys-color-on-surface-variant, #49454e);
      }
      .sfr__count {
        display: inline-grid;
        place-items: center;
        min-width: 1.25rem;
        height: 1.25rem;
        padding: 0 0.25rem;
        border-radius: 999px;
        font-size: 0.6875rem;
        background: var(--md-sys-color-secondary-container, #e8def8);
        color: var(--md-sys-color-on-secondary-container, #1d192b);
      }
      .sfr__tenant {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
        padding: 0.875rem;
        border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
        border-radius: 0.625rem;
        background: var(--md-sys-color-surface, #fffbff);
      }
      .sfr__tenant--invalid {
        border-color: var(--md-sys-color-error, #ba1a1a);
      }
      .sfr__tenant-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .sfr__tenant-n {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--md-sys-color-on-surface-variant, #49454e);
      }
      .sfr__remove {
        display: grid;
        place-items: center;
        width: 1.75rem;
        height: 1.75rem;
        border: none;
        border-radius: 999px;
        background: transparent;
        color: var(--md-sys-color-on-surface-variant, #49454e);
        font-size: 0.875rem;
        cursor: pointer;
        transition: background 120ms ease;
      }
      .sfr__remove:hover:not(:disabled) {
        background: var(--md-sys-color-error-container, #ffdad6);
        color: var(--md-sys-color-on-error-container, #410002);
      }
      .sfr__remove:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }
      .sfr__row {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
      .sfr__field {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }
      .sfr__field--grow {
        flex: 1 1 12rem;
      }
      .sfr__field--share {
        flex: 0 0 6rem;
      }
      .sfr__label {
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--md-sys-color-on-surface-variant, #49454e);
      }
      .sfr__input {
        padding: 0.625rem 0.75rem;
        border: 1px solid var(--md-sys-color-outline, #79747e);
        border-radius: 0.5rem;
        background: var(--md-sys-color-surface, #fffbff);
        color: var(--md-sys-color-on-surface, #1c1b1f);
        font-size: 0.9375rem;
        transition: border-color 120ms ease, box-shadow 120ms ease;
      }
      .sfr__input:focus {
        outline: none;
        border-color: var(--md-sys-color-primary, #6750a4);
        box-shadow: 0 0 0 2px
          color-mix(in srgb, var(--md-sys-color-primary, #6750a4) 24%, transparent);
      }
      .sfr__input--invalid {
        border-color: var(--md-sys-color-error, #ba1a1a);
      }
      .sfr__error {
        font-size: 0.75rem;
        color: var(--md-sys-color-error, #ba1a1a);
      }
      .sfr__add {
        align-self: flex-start;
        padding: 0.5rem 0.875rem;
        border: 1px dashed var(--md-sys-color-outline, #79747e);
        border-radius: 999px;
        background: transparent;
        color: var(--md-sys-color-primary, #6750a4);
        font-size: 0.8125rem;
        font-weight: 500;
        cursor: pointer;
        transition: background 120ms ease;
      }
      .sfr__add:hover {
        background: color-mix(
          in srgb,
          var(--md-sys-color-primary, #6750a4) 8%,
          transparent
        );
      }
      .sfr__sum {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 0.75rem;
        border-radius: 0.5rem;
        background: var(--md-sys-color-surface-container, #ece6f0);
        font-size: 0.8125rem;
        color: var(--md-sys-color-on-surface-variant, #49454e);
      }
      .sfr__sum strong {
        color: var(--md-sys-color-on-surface, #1c1b1f);
      }
      .sfr__sum--bad {
        background: var(--md-sys-color-error-container, #ffdad6);
        color: var(--md-sys-color-on-error-container, #410002);
      }
      .sfr__sum--bad strong {
        color: var(--md-sys-color-on-error-container, #410002);
      }
      .sfr__footer {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .sfr__submit {
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
      .sfr__submit:hover:not(:disabled) {
        filter: brightness(1.08);
      }
      .sfr__submit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .sfr__ok {
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--md-sys-color-primary, #6750a4);
      }
    `,
  ],
})
export class SignalFormsRosterComponent {
  /** Percentage the tenant shares must sum to for a valid lease. */
  readonly requiredShareTotal = 100;

  /**
   * The form's single source of truth. `form()` wraps this signal and mutates it in
   * place; structural edits go through {@link addTenant} / {@link removeTenant}.
   */
  private readonly model = signal<SignalFormsRoster>({
    reference: '',
    tenants: [{ name: '', email: '', sharePct: 100 }],
  });

  /**
   * The official Signal Forms field tree. `applyEach` applies one schema to every
   * element of `tenants`; the array-level `minLength` and the cross-item sum rule
   * live directly on the `tenants` path.
   */
  protected readonly f = form(this.model, (path) => {
    required(path.reference, { message: 'Indique uma referência.' });
    maxLength(path.reference, 80, { message: 'Máximo 80 caracteres.' });

    // At least one tenant on the lease.
    minLength(path.tenants, 1, { message: 'Pelo menos um inquilino.' });

    // ── Per-item schema applied to every tenant ─────────────────────────────
    applyEach(path.tenants, (tenant) => {
      required(tenant.name, { message: 'Nome obrigatório.' });
      required(tenant.email, { message: 'Email obrigatório.' });
      email(tenant.email, { message: 'Email inválido.' });
      min(tenant.sharePct, 0, { message: 'Mínimo 0 %.' });
      max(tenant.sharePct, 100, { message: 'Máximo 100 %.' });
    });

    // ── Cross-item / tree rule: as quotas somam 100 % ───────────────────────
    validate(path.tenants, ({ value }) => {
      const total = value().reduce((sum, t) => sum + (Number(t.sharePct) || 0), 0);
      if (total !== this.requiredShareTotal) {
        return {
          kind: 'shareSum',
          message: `As quotas têm de somar ${this.requiredShareTotal} % (atual: ${total} %).`,
        };
      }
      return null;
    });
  });

  /** True once a submit has been attempted (drives error visibility + disabled). */
  protected readonly submitted = signal(false);

  /** Emits the roster payload when a valid form is submitted. */
  readonly submitted$ = output<SignalFormsRoster>({ alias: 'submitted' });

  /** Transient success flag cleared on the next edit-then-submit cycle. */
  private readonly _justSubmitted = signal(false);
  protected readonly justSubmitted = computed(() => this._justSubmitted());

  /** Number of tenants currently on the lease. */
  protected readonly tenantCount = computed(() => this.f.tenants().value().length);

  /** Live sum of the tenant shares, in percent. */
  protected readonly shareTotal = computed(() =>
    this.f
      .tenants()
      .value()
      .reduce((sum, t) => sum + (Number(t.sharePct) || 0), 0),
  );

  /** The cross-item share-sum error message on the array, if any. */
  protected readonly shareError = computed(
    () =>
      this.f
        .tenants()
        .errors()
        .find((e) => (e as { kind?: string }).kind === 'shareSum')?.message ?? '',
  );

  /**
   * Append a blank tenant. The new field node and its per-item validators are wired
   * automatically by `applyEach` when `form()` reconciles the mutated array.
   */
  protected addTenant(): void {
    this.model.update((m) => ({
      ...m,
      tenants: [...m.tenants, { name: '', email: '', sharePct: 0 }],
    }));
  }

  /** Remove the tenant at {@link index}; never drops below one tenant. */
  protected removeTenant(index: number): void {
    this.model.update((m) => {
      if (m.tenants.length <= 1) return m;
      return { ...m, tenants: m.tenants.filter((_, i) => i !== index) };
    });
  }

  /** Whether any field on the tenant at {@link index} is currently invalid. */
  protected tenantInvalid(index: number): boolean {
    if (!this.submitted()) return false;
    const t = this.f.tenants[index];
    return (
      t.name().invalid() || t.email().invalid() || t.sharePct().invalid()
    );
  }

  /**
   * Whether a field should surface its error — touched (or a submit attempted) AND
   * currently invalid. Generic so number/string/array fields all fit.
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

    // Rebuild clean tenant objects: Signal Forms tags array items with an internal
    // Symbol key, so spread the named fields explicitly rather than `{ ...t }`.
    this.submitted$.emit({
      reference: this.model().reference,
      tenants: this.model().tenants.map((t) => ({
        name: t.name,
        email: t.email,
        sharePct: t.sharePct,
      })),
    });
    this._justSubmitted.set(true);
  }
}
