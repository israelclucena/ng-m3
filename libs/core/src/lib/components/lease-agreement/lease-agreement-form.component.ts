/**
 * @fileoverview LeaseAgreementFormComponent — Sprint 035
 *
 * `iu-lease-agreement-form` — Landlord-facing form to create a new lease agreement.
 *
 * Inputs: landlordId, landlordName, propertyId, propertyTitle, propertyAddress, tenantId, tenantName
 * Outputs: (submitted) with the created LeaseAgreement, (cancelled)
 *
 * Feature flag: LEASE_MODULE
 *
 * @example
 * ```html
 * <iu-lease-agreement-form
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
import { Component, input, output, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LeaseAgreementService,
  LeaseAgreement,
  LeaseType,
} from '../../services/lease-agreement.service';
import { createSignalForm, required, minLength, range } from '../../utils/signal-form';

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * `iu-lease-agreement-form`
 *
 * Signal-based form for landlords to create a new lease agreement.
 * Includes lease type, rental terms, dates, deposit, and custom terms.
 *
 * Feature flag: LEASE_MODULE
 */
@Component({
  selector: 'iu-lease-agreement-form',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="laf-container">
      <div class="laf-header">
        <span class="material-symbols-outlined laf-icon">description</span>
        <div class="laf-header-text">
          <h2 class="laf-title">Novo Contrato de Arrendamento</h2>
          <p class="laf-subtitle">{{ propertyTitle() }} · {{ tenantName() }}</p>
        </div>
      </div>

      @if (submittedSuccess()) {
        <div class="laf-success">
          <span class="material-symbols-outlined laf-success-icon">check_circle</span>
          <p class="laf-success-text">Contrato criado com sucesso! A aguardar assinatura do inquilino.</p>
        </div>
      } @else {
        <form class="laf-form" (submit)="onSubmit($event)">

          <!-- Lease Type -->
          <div class="laf-section">
            <label class="laf-label">Tipo de Arrendamento</label>
            <div class="laf-segment">
              @for (opt of leaseTypeOptions; track opt.value) {
                <button
                  type="button"
                  class="laf-segment-btn"
                  [class.active]="form.fields.leaseType.value() === opt.value"
                  (click)="form.fields.leaseType.setValue(opt.value)">
                  <span class="material-symbols-outlined">{{ opt.icon }}</span>
                  {{ opt.label }}
                </button>
              }
            </div>
          </div>

          <!-- Dates row -->
          <div class="laf-row">
            <div class="laf-field">
              <label class="laf-label" for="laf-start">Data de Início</label>
              <input
                id="laf-start"
                class="laf-input"
                [class.error]="form.fields.startDate.showError()"
                type="date"
                [value]="form.fields.startDate.value()"
                (input)="form.fields.startDate.setValue($any($event.target).value)"
                (blur)="form.fields.startDate.touch()" />
              @if (form.fields.startDate.showError()) {
                <span class="laf-error">{{ form.fields.startDate.firstError() }}</span>
              }
            </div>
            <div class="laf-field">
              <label class="laf-label" for="laf-end">Data de Fim</label>
              <input
                id="laf-end"
                class="laf-input"
                [class.error]="form.fields.endDate.showError()"
                type="date"
                [value]="form.fields.endDate.value()"
                (input)="form.fields.endDate.setValue($any($event.target).value)"
                (blur)="form.fields.endDate.touch()" />
              @if (form.fields.endDate.showError()) {
                <span class="laf-error">{{ form.fields.endDate.firstError() }}</span>
              }
            </div>
          </div>

          <!-- Rent & Deposit row -->
          <div class="laf-row">
            <div class="laf-field">
              <label class="laf-label" for="laf-rent">Renda Mensal (€)</label>
              <input
                id="laf-rent"
                class="laf-input"
                [class.error]="form.fields.monthlyRent.showError()"
                type="number"
                min="1"
                placeholder="ex: 1200"
                [value]="form.fields.monthlyRent.value()"
                (input)="form.fields.monthlyRent.setValue($any($event.target).value)"
                (blur)="form.fields.monthlyRent.touch()" />
              @if (form.fields.monthlyRent.showError()) {
                <span class="laf-error">{{ form.fields.monthlyRent.firstError() }}</span>
              }
            </div>
            <div class="laf-field">
              <label class="laf-label" for="laf-deposit">Depósito (€)</label>
              <input
                id="laf-deposit"
                class="laf-input"
                [class.error]="form.fields.depositAmount.showError()"
                type="number"
                min="0"
                placeholder="ex: 2400"
                [value]="form.fields.depositAmount.value()"
                (input)="form.fields.depositAmount.setValue($any($event.target).value)"
                (blur)="form.fields.depositAmount.touch()" />
              @if (form.fields.depositAmount.showError()) {
                <span class="laf-error">{{ form.fields.depositAmount.firstError() }}</span>
              }
            </div>
          </div>

          <!-- Terms -->
          <div class="laf-field">
            <label class="laf-label" for="laf-terms">Termos e Condições</label>
            <textarea
              id="laf-terms"
              class="laf-textarea"
              [class.error]="form.fields.terms.showError()"
              rows="8"
              placeholder="Insira as cláusulas do contrato..."
              [value]="form.fields.terms.value()"
              (input)="form.fields.terms.setValue($any($event.target).value)"
              (blur)="form.fields.terms.touch()"></textarea>
            @if (form.fields.terms.showError()) {
              <span class="laf-error">{{ form.fields.terms.firstError() }}</span>
            }
          </div>

          <!-- Notes -->
          <div class="laf-field">
            <label class="laf-label" for="laf-notes">Notas Internas (opcional)</label>
            <textarea
              id="laf-notes"
              class="laf-textarea laf-textarea--small"
              rows="3"
              placeholder="Notas privadas do senhorio..."
              [value]="form.fields.notes.value()"
              (input)="form.fields.notes.setValue($any($event.target).value)"></textarea>
          </div>

          <!-- Summary -->
          @if (form.valid()) {
            <div class="laf-summary">
              <span class="material-symbols-outlined">info</span>
              <span>
                Contrato de {{ getLeaseTypeLabel(form.fields.leaseType.value()) }}
                de <strong>{{ form.fields.startDate.value() }}</strong>
                a <strong>{{ form.fields.endDate.value() }}</strong>
                · Renda: <strong>{{ form.fields.monthlyRent.value() }}€/mês</strong>
                · Depósito: <strong>{{ form.fields.depositAmount.value() }}€</strong>
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
              [disabled]="!form.valid() || saving()">
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
export class LeaseAgreementFormComponent {
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

  readonly saving = signal(false);
  readonly submitted$ = signal(false);

  /** Expose LeaseType for template use */
  readonly LeaseType!: LeaseType;

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

  readonly form = createSignalForm({
    leaseType:     { value: 'fixed' as string,  validators: [required()] },
    startDate:     { value: '',                  validators: [required('Seleccione a data de início.')] },
    endDate:       { value: '',                  validators: [required('Seleccione a data de fim.')] },
    monthlyRent:   { value: '',                  validators: [required('A renda mensal é obrigatória.'), minLength(1, 'Insira um valor válido.')] },
    depositAmount: { value: '',                  validators: [required('O depósito é obrigatório.')] },
    terms:         { value: '',                  validators: [required('Os termos são obrigatórios.'), minLength(50, 'Os termos devem ter pelo menos 50 caracteres.')] },
    notes:         { value: '' },
  });

  /** Track submitted state for success display */
  readonly submittedSuccess = signal(false);


  /** Get lease type label for template (avoids template type cast) */
  getLeaseTypeLabel(type: string): string {
    return this.leaseTypeLabelMap[type as LeaseType] ?? type;
  }

  onSubmit(e: Event): void {
    e.preventDefault();
    if (!this.form.valid()) return;

    this.saving.set(true);
    const v = this.form.value();

    setTimeout(() => {
      const lease = this.svc.create({
        tenantId: this.tenantId(),
        tenantName: this.tenantName(),
        landlordId: this.landlordId(),
        landlordName: this.landlordName(),
        propertyId: this.propertyId(),
        propertyTitle: this.propertyTitle(),
        propertyAddress: this.propertyAddress(),
        leaseType: v['leaseType'] as LeaseType,
        monthlyRent: Number(v['monthlyRent']),
        depositAmount: Number(v['depositAmount']),
        startDate: v['startDate'] as string,
        endDate: v['endDate'] as string,
        terms: v['terms'] as string,
        notes: v['notes'] as string || undefined,
      });
      this.saving.set(false);
      this.submittedSuccess.set(true);
      this.submitted.emit(lease);
    }, 500);
  }
}
