/**
 * @fileoverview LeaseAgreementSignalFormComponent — the lease-agreement create
 * form rebuilt on Angular 22's **official** Signal Forms API (`@angular/forms/signals`).
 *
 * Fifth migration of a *real product form* off the bespoke `createSignalForm`
 * util onto the official `form()` API (after auth-register #060, tenant-application
 * #061, auth-login #062, maintenance-request #063). It is a faithful, additive,
 * side-by-side twin of {@link LeaseAgreementFormComponent}: identical markup, styles,
 * inputs, the `submitted`/`cancelled` outputs and the same `LeaseAgreementService`
 * wiring — the **only** difference is the form engine.
 *
 * This twin proves the surfaces the earlier twins only partially touched, all bound
 * with the same `[formField]` two-way directive that owns the control:
 *   1. a **segmented button group** for `leaseType`, written imperatively via
 *      `f.leaseType().value.set(...)` (mirrors the bespoke `setValue` on click)
 *   2. two `<input type="date">` fields (start/end) bound through `[formField]`
 *   3. two `<input type="number">` fields (monthlyRent/depositAmount) parsed natively
 *      by `[formField]` — `number | null` model fields, `required` catches the empty
 *      state and `min(1)` the invalid-value one (the bespoke coerced strings on submit)
 *   4. a long `<textarea>` (terms) with a `minLength(50)` floor
 *   5. an optional, validator-free field (notes)
 *
 * Migration map (bespoke `createSignalForm` → official `form()`):
 * | bespoke (LeaseAgreementFormComponent)                 | official (this)                                   |
 * | ----------------------------------------------------- | ------------------------------------------------- |
 * | `createSignalForm({ terms: { validators:[...] } })`   | `form(model, (p) => { required(p.terms); ... })`  |
 * | `[value]` + `(input)` + `(blur)="…touch()"`           | `[formField]="f.terms"` (two-way)                 |
 * | `form.fields.terms.showError()`                       | `f.terms().touched() && f.terms().invalid()`      |
 * | `form.fields.leaseType.setValue(v)`                   | `f.leaseType().value.set(v)`                      |
 * | `form.valid()`                                        | `f().valid()`                                     |
 *
 * The bespoke component remains the shipped default; this twin sits behind
 * `LEASE_AGREEMENT_SIGNAL_FORM` and replaces nothing. A parity spec asserts both
 * hand `LeaseAgreementService.create` an identical payload.
 *
 * Feature flag: `LEASE_AGREEMENT_SIGNAL_FORM`
 *
 * @see libs/core/src/lib/components/lease-agreement/lease-agreement-form.component.ts — the bespoke twin
 * @see libs/core/src/lib/components/tenant-application-signal-form/tenant-application-signal-form.component.ts — number fields + segmented imperative set
 *
 * Night Shift 2026-08-24 — Signal Forms migration #5 (real product form).
 */
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FieldTree,
  FormField,
  form,
  min,
  minLength,
  required,
} from '@angular/forms/signals';
import {
  LeaseAgreementService,
  LeaseAgreement,
  LeaseType,
} from '../../services/lease-agreement.service';

// ─── Models ──────────────────────────────────────────────────────────────────

/**
 * The lease-agreement form's single source of truth. `monthlyRent`/`depositAmount`
 * are `number | null` so `[formField]` on a `<input type="number">` parses natively
 * (the bespoke twin kept them as coerce-on-submit strings); `null` is the empty
 * sentinel `required` rejects.
 */
export interface LeaseAgreementModel {
  leaseType: LeaseType;
  startDate: string;
  endDate: string;
  monthlyRent: number | null;
  depositAmount: number | null;
  terms: string;
  notes: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * `iu-lease-agreement-signal-form`
 *
 * Feature-parity with {@link LeaseAgreementFormComponent}: segmented lease-type
 * chooser, start/end date inputs, monthly-rent + deposit number inputs, a terms
 * textarea with a 50-char floor, optional internal notes, async submit with spinner
 * and success screen, and the same `submitted`/`cancelled` outputs driving the same
 * `LeaseAgreementService` — built on the official Signal Forms API.
 *
 * Feature flag: `LEASE_AGREEMENT_SIGNAL_FORM`
 *
 * @example
 * ```html
 * <iu-lease-agreement-signal-form
 *   [landlordId]="'landlord-001'"
 *   [landlordName]="'Carlos Mendes'"
 *   [propertyId]="'p1'"
 *   [propertyTitle]="'Apartamento T2 no Chiado'"
 *   [propertyAddress]="'Rua Garrett 42, Lisboa'"
 *   [tenantId]="'tenant-001'"
 *   [tenantName]="'Ana Ferreira'"
 *   (submitted)="onLeaseCreated($event)"
 *   (cancelled)="onCancel()" />
 * ```
 */
@Component({
  selector: 'iu-lease-agreement-signal-form',
  standalone: true,
  imports: [CommonModule, FormField],
  template: `
    <div class="laf-container">
      <div class="laf-header">
        <span class="material-symbols-outlined laf-icon">description</span>
        <div class="laf-header-text">
          <h2 class="laf-title">Novo Contrato de Arrendamento</h2>
          <p class="laf-subtitle">{{ propertyTitle() }} · {{ tenantName() }}</p>
        </div>
        <span class="laf-badge">form()</span>
      </div>

      @if (submittedSuccess()) {
        <div class="laf-success">
          <span class="material-symbols-outlined laf-success-icon">check_circle</span>
          <p class="laf-success-text">Contrato criado com sucesso! A aguardar assinatura do inquilino.</p>
        </div>
      } @else {
        <form class="laf-form" (submit)="onSubmit($event)" novalidate>

          <!-- Lease Type -->
          <div class="laf-section">
            <span class="laf-label" id="lafs-lease-type-label">Tipo de Arrendamento</span>
            <div class="laf-segment" role="group" aria-labelledby="lafs-lease-type-label">
              @for (opt of leaseTypeOptions; track opt.value) {
                <button
                  type="button"
                  class="laf-segment-btn"
                  [class.active]="f.leaseType().value() === opt.value"
                  (click)="f.leaseType().value.set(opt.value)">
                  <span class="material-symbols-outlined">{{ opt.icon }}</span>
                  {{ opt.label }}
                </button>
              }
            </div>
          </div>

          <!-- Dates row -->
          <div class="laf-row">
            <div class="laf-field">
              <label class="laf-label" for="lafs-start">Data de Início</label>
              <input
                id="lafs-start"
                class="laf-input"
                [class.error]="showError(f.startDate)"
                type="date"
                [formField]="f.startDate" />
              @if (showError(f.startDate)) {
                <span class="laf-error">{{ firstError(f.startDate) }}</span>
              }
            </div>
            <div class="laf-field">
              <label class="laf-label" for="lafs-end">Data de Fim</label>
              <input
                id="lafs-end"
                class="laf-input"
                [class.error]="showError(f.endDate)"
                type="date"
                [formField]="f.endDate" />
              @if (showError(f.endDate)) {
                <span class="laf-error">{{ firstError(f.endDate) }}</span>
              }
            </div>
          </div>

          <!-- Rent & Deposit row -->
          <div class="laf-row">
            <div class="laf-field">
              <label class="laf-label" for="lafs-rent">Renda Mensal (€)</label>
              <input
                id="lafs-rent"
                class="laf-input"
                [class.error]="showError(f.monthlyRent)"
                type="number"
                placeholder="ex: 1200"
                [formField]="f.monthlyRent" />
              @if (showError(f.monthlyRent)) {
                <span class="laf-error">{{ firstError(f.monthlyRent) }}</span>
              }
            </div>
            <div class="laf-field">
              <label class="laf-label" for="lafs-deposit">Depósito (€)</label>
              <input
                id="lafs-deposit"
                class="laf-input"
                [class.error]="showError(f.depositAmount)"
                type="number"
                placeholder="ex: 2400"
                [formField]="f.depositAmount" />
              @if (showError(f.depositAmount)) {
                <span class="laf-error">{{ firstError(f.depositAmount) }}</span>
              }
            </div>
          </div>

          <!-- Terms -->
          <div class="laf-field">
            <label class="laf-label" for="lafs-terms">Termos e Condições</label>
            <textarea
              id="lafs-terms"
              class="laf-textarea"
              [class.error]="showError(f.terms)"
              rows="8"
              placeholder="Insira as cláusulas do contrato..."
              [formField]="f.terms"></textarea>
            @if (showError(f.terms)) {
              <span class="laf-error">{{ firstError(f.terms) }}</span>
            }
          </div>

          <!-- Notes -->
          <div class="laf-field">
            <label class="laf-label" for="lafs-notes">Notas Internas (opcional)</label>
            <textarea
              id="lafs-notes"
              class="laf-textarea laf-textarea--small"
              rows="3"
              placeholder="Notas privadas do senhorio..."
              [formField]="f.notes"></textarea>
          </div>

          <!-- Summary -->
          @if (f().valid()) {
            <div class="laf-summary">
              <span class="material-symbols-outlined">info</span>
              <span>
                Contrato de {{ getLeaseTypeLabel(f.leaseType().value()) }}
                de <strong>{{ f.startDate().value() }}</strong>
                a <strong>{{ f.endDate().value() }}</strong>
                · Renda: <strong>{{ f.monthlyRent().value() }}€/mês</strong>
                · Depósito: <strong>{{ f.depositAmount().value() }}€</strong>
              </span>
            </div>
          }

          <!-- Actions -->
          <div class="laf-actions">
            <button type="button" class="laf-btn laf-btn--text" (click)="cancelled.emit()">
              Cancelar
            </button>
            <button
              type="submit"
              class="laf-btn laf-btn--filled"
              [disabled]="!f().valid() || saving()">
              @if (saving()) {
                <span class="laf-spinner"></span> A guardar...
              } @else {
                <span class="material-symbols-outlined">send</span>
                Criar Contrato
              }
            </button>
          </div>
        </form>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .laf-container {
      background: var(--md-sys-color-surface);
      border-radius: 16px;
      padding: 24px;
      max-width: 680px;
    }
    .laf-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .laf-icon {
      font-size: 32px;
      color: var(--md-sys-color-primary);
    }
    .laf-title {
      margin: 0;
      font-size: var(--md-sys-typescale-title-large-size, 22px);
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
    }
    .laf-subtitle {
      margin: 4px 0 0;
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant);
    }
    .laf-badge {
      margin-left: auto;
      align-self: flex-start;
      padding: 0.125rem 0.5rem;
      border-radius: 999px;
      font-family: ui-monospace, 'SF Mono', Menlo, monospace;
      font-size: 0.6875rem;
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
    }
    .laf-form { display: flex; flex-direction: column; gap: 20px; }
    .laf-section {}
    .laf-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant);
      margin-bottom: 8px;
    }
    .laf-segment {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .laf-segment-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 20px;
      border: 1.5px solid var(--md-sys-color-outline-variant);
      background: transparent;
      color: var(--md-sys-color-on-surface-variant);
      cursor: pointer;
      font-size: 14px;
      transition: all 0.15s;
    }
    .laf-segment-btn.active {
      border-color: var(--md-sys-color-primary);
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      font-weight: 600;
    }
    .laf-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .laf-field { display: flex; flex-direction: column; gap: 6px; }
    .laf-input, .laf-textarea {
      padding: 12px 14px;
      border-radius: 8px;
      border: 1.5px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface-container-lowest);
      color: var(--md-sys-color-on-surface);
      font-size: 14px;
      width: 100%;
      box-sizing: border-box;
      font-family: inherit;
      transition: border-color 0.15s;
    }
    .laf-input:focus, .laf-textarea:focus {
      outline: none;
      border-color: var(--md-sys-color-primary);
    }
    .laf-input.error, .laf-textarea.error { border-color: var(--md-sys-color-error); }
    .laf-textarea { resize: vertical; min-height: 80px; }
    .laf-textarea--small { min-height: 60px; }
    .laf-error { font-size: 12px; color: var(--md-sys-color-error); }
    .laf-summary {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 12px 16px;
      border-radius: 8px;
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
      font-size: 14px;
    }
    .laf-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 8px;
    }
    .laf-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.15s;
    }
    .laf-btn--text {
      background: transparent;
      color: var(--md-sys-color-primary);
    }
    .laf-btn--text:hover { background: var(--md-sys-color-primary-container); }
    .laf-btn--filled {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
    }
    .laf-btn--filled:disabled { opacity: 0.5; cursor: not-allowed; }
    .laf-spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: laf-spin 0.6s linear infinite;
      display: inline-block;
    }
    @keyframes laf-spin { to { transform: rotate(360deg); } }
    .laf-success {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 32px;
      text-align: center;
    }
    .laf-success-icon { font-size: 48px; color: var(--md-sys-color-primary); }
    .laf-success-text { color: var(--md-sys-color-on-surface-variant); }
  `],
})
export class LeaseAgreementSignalFormComponent {
  private readonly svc = inject(LeaseAgreementService);

  /** @input Landlord ID */
  readonly landlordId = input.required<string>();
  /** @input Landlord display name */
  readonly landlordName = input.required<string>();
  /** @input Property ID */
  readonly propertyId = input.required<string>();
  /** @input Property display title */
  readonly propertyTitle = input.required<string>();
  /** @input Property address */
  readonly propertyAddress = input.required<string>();
  /** @input Tenant ID */
  readonly tenantId = input.required<string>();
  /** @input Tenant display name */
  readonly tenantName = input.required<string>();

  /** @output Emits the created LeaseAgreement on successful submission */
  readonly submitted = output<LeaseAgreement>();
  /** @output Emits when user cancels */
  readonly cancelled = output<void>();

  /** True while the (mock) create request is in flight. */
  readonly saving = signal(false);

  /** True once the lease has been created (shows the success screen). */
  readonly submittedSuccess = signal(false);

  /** True once a submit has been attempted (drives error visibility). */
  private readonly submittedAttempt = signal(false);

  readonly leaseTypeOptions: { value: LeaseType; label: string; icon: string }[] = [
    { value: 'fixed', label: 'Prazo Fixo', icon: 'event' },
    { value: 'month-to-month', label: 'Mensal', icon: 'autorenew' },
    { value: 'short-term', label: 'Curta Duração', icon: 'schedule' },
  ];

  readonly leaseTypeLabelMap: Record<LeaseType, string> = {
    'fixed': 'Prazo Fixo',
    'month-to-month': 'Renovação Mensal',
    'short-term': 'Curta Duração',
  };

  // ── Official Signal Form ───────────────────────────────────────────────────

  /** Single source of truth; `form()` wraps and mutates it via `[formField]`. */
  private readonly model = signal<LeaseAgreementModel>({
    leaseType: 'fixed',
    startDate: '',
    endDate: '',
    monthlyRent: null,
    depositAmount: null,
    terms: '',
    notes: '',
  });

  /**
   * Field tree with every rule declared inline. Messages mirror the bespoke twin's
   * `createSignalForm` validators byte-for-byte so both surfaces read identically.
   * `leaseType` needs no rule — the segmented control seeds `'fixed'` and never
   * clears to an empty sentinel, exactly as the bespoke `required()` never surfaces.
   */
  protected readonly f = form(this.model, (path) => {
    required(path.startDate, { message: 'Seleccione a data de início.' });
    required(path.endDate, { message: 'Seleccione a data de fim.' });

    required(path.monthlyRent, { message: 'A renda mensal é obrigatória.' });
    min(path.monthlyRent, 1, { message: 'Insira um valor válido.' });

    required(path.depositAmount, { message: 'O depósito é obrigatório.' });

    required(path.terms, { message: 'Os termos são obrigatórios.' });
    minLength(path.terms, 50, { message: 'Os termos devem ter pelo menos 50 caracteres.' });
  });

  // ── Error-display helpers (mirror the bespoke showError/firstError) ─────────

  /** Whether a field should surface its error — touched (or submitted) AND invalid. */
  protected showError<T>(field: FieldTree<T>): boolean {
    const state = field();
    return (state.touched() || this.submittedAttempt()) && state.invalid();
  }

  /** First human-readable error message for a field, or empty string. */
  protected firstError<T>(field: FieldTree<T>): string {
    return field().errors()[0]?.message ?? '';
  }

  // ── Methods ────────────────────────────────────────────────────────────────

  /** Get lease type label for template (avoids template type cast). */
  getLeaseTypeLabel(type: string): string {
    return this.leaseTypeLabelMap[type as LeaseType] ?? type;
  }

  /** Handle form submission — full validation, then LeaseAgreementService. */
  onSubmit(e: Event): void {
    e.preventDefault();
    this.submittedAttempt.set(true);
    this.f().markAsTouched();

    if (this.f().invalid()) return;

    this.saving.set(true);
    const v = this.model();

    setTimeout(() => {
      const lease = this.svc.create({
        tenantId: this.tenantId(),
        tenantName: this.tenantName(),
        landlordId: this.landlordId(),
        landlordName: this.landlordName(),
        propertyId: this.propertyId(),
        propertyTitle: this.propertyTitle(),
        propertyAddress: this.propertyAddress(),
        leaseType: v.leaseType,
        monthlyRent: Number(v.monthlyRent),
        depositAmount: Number(v.depositAmount),
        startDate: v.startDate,
        endDate: v.endDate,
        terms: v.terms,
        notes: v.notes || undefined,
      });
      this.saving.set(false);
      this.submittedSuccess.set(true);
      this.submitted.emit(lease);
    }, 500);
  }
}
