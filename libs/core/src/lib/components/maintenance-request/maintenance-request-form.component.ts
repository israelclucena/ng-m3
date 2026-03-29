/**
 * @fileoverview MaintenanceRequestFormComponent — Sprint 034
 *
 * `iu-maintenance-request-form` — Tenant-facing form to submit maintenance requests.
 *
 * Uses createSignalForm() for pure signal-based form state.
 * Emits (submitted) with the created MaintenanceRequest on success.
 *
 * Feature flag: MAINTENANCE_MODULE
 *
 * @example
 * ```html
 * <iu-maintenance-request-form
 *   [tenantId]="'tenant-001'"
 *   [tenantName]="'Ana Ferreira'"
 *   [landlordId]="'landlord-001'"
 *   [propertyId]="'p1'"
 *   [propertyTitle]="'Apartamento T2 no Chiado'"
 *   (submitted)="onRequestSubmitted($event)" />
 * ```
 */
import { Component, input, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MaintenanceRequestService,
  MaintenanceRequest,
  CreateMaintenanceRequestPayload,
  MaintenanceCategory,
  MaintenancePriority,
} from '../../services/maintenance-request.service';
import { createSignalForm, required, minLength, maxLength } from '../../utils/signal-form';

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * `iu-maintenance-request-form`
 *
 * Signal-based form for tenants to submit maintenance requests.
 * Category + Priority selects, title + description inputs with validation.
 *
 * Feature flag: MAINTENANCE_MODULE
 */
@Component({
  selector: 'iu-maintenance-request-form',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mrf-container">
      <div class="mrf-header">
        <span class="material-symbols-outlined mrf-icon">build</span>
        <div>
          <h3 class="mrf-title">Report Maintenance Issue</h3>
          <p class="mrf-subtitle">{{ propertyTitle() }}</p>
        </div>
      </div>

      @if (submitted$()) {
        <div class="mrf-success">
          <span class="material-symbols-outlined">check_circle</span>
          <div>
            <strong>Request submitted!</strong>
            <p>Your request has been sent to the landlord. You'll be notified of updates.</p>
          </div>
        </div>
      } @else {
        <form class="mrf-form" (submit)="onSubmit($event)">

          <!-- Row: Category + Priority -->
          <div class="mrf-row">
            <div class="mrf-field">
              <label class="mrf-label" for="mrf-category">Category *</label>
              <select
                id="mrf-category"
                class="mrf-select"
                [value]="form.fields.category.value()"
                (change)="form.fields.category.setValue($any($event.target).value)"
                (blur)="form.fields.category.touch()"
                [class.mrf-error-input]="form.fields.category.showError()">
                <option value="">Select category…</option>
                <option value="plumbing">🚿 Plumbing</option>
                <option value="electrical">⚡ Electrical</option>
                <option value="hvac">❄️ HVAC / Heating</option>
                <option value="appliance">🍳 Appliance</option>
                <option value="structural">🏗️ Structural</option>
                <option value="pest">🐛 Pest Control</option>
                <option value="other">🔧 Other</option>
              </select>
              @if (form.fields.category.showError()) {
                <span class="mrf-error-msg">{{ form.fields.category.firstError() }}</span>
              }
            </div>

            <div class="mrf-field">
              <label class="mrf-label" for="mrf-priority">Priority *</label>
              <select
                id="mrf-priority"
                class="mrf-select"
                [value]="form.fields.priority.value()"
                (change)="form.fields.priority.setValue($any($event.target).value)"
                (blur)="form.fields.priority.touch()"
                [class.mrf-error-input]="form.fields.priority.showError()">
                <option value="">Select priority…</option>
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
              @if (form.fields.priority.showError()) {
                <span class="mrf-error-msg">{{ form.fields.priority.firstError() }}</span>
              }
            </div>
          </div>

          <!-- Title -->
          <div class="mrf-field">
            <label class="mrf-label" for="mrf-title">Issue Title *</label>
            <input
              id="mrf-title"
              class="mrf-input"
              type="text"
              placeholder="Brief description of the issue"
              [value]="form.fields.title.value()"
              (input)="form.fields.title.setValue($any($event.target).value)"
              (blur)="form.fields.title.touch()"
              [class.mrf-error-input]="form.fields.title.showError()" />
            <div class="mrf-field-footer">
              @if (form.fields.title.showError()) {
                <span class="mrf-error-msg">{{ form.fields.title.firstError() }}</span>
              } @else {
                <span></span>
              }
              <span class="mrf-char-count">{{ form.fields.title.value().length }}/100</span>
            </div>
          </div>

          <!-- Description -->
          <div class="mrf-field">
            <label class="mrf-label" for="mrf-description">Description *</label>
            <textarea
              id="mrf-description"
              class="mrf-textarea"
              rows="4"
              placeholder="Describe the issue in detail. When did it start? How severe is it?"
              [value]="form.fields.description.value()"
              (input)="form.fields.description.setValue($any($event.target).value)"
              (blur)="form.fields.description.touch()"
              [class.mrf-error-input]="form.fields.description.showError()"></textarea>
            <div class="mrf-field-footer">
              @if (form.fields.description.showError()) {
                <span class="mrf-error-msg">{{ form.fields.description.firstError() }}</span>
              } @else {
                <span></span>
              }
              <span class="mrf-char-count">{{ form.fields.description.value().length }}/1000</span>
            </div>
          </div>

          <!-- Submit -->
          <div class="mrf-actions">
            <button
              type="button"
              class="mrf-btn-secondary"
              (click)="resetForm()">
              Cancel
            </button>
            <button
              type="submit"
              class="mrf-btn-primary"
              [disabled]="submitting()">
              @if (submitting()) {
                <span class="mrf-spinner"></span>
                Submitting…
              } @else {
                <span class="material-symbols-outlined">send</span>
                Submit Request
              }
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .mrf-container {
      background: var(--md-sys-color-surface-container-low, #f3eff4);
      border-radius: 16px;
      padding: 24px;
      max-width: 640px;
    }
    .mrf-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .mrf-icon {
      font-size: 32px;
      color: var(--md-sys-color-primary, #6750a4);
    }
    .mrf-title {
      margin: 0 0 2px;
      font-size: 20px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .mrf-subtitle {
      margin: 0;
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .mrf-success {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: var(--md-sys-color-tertiary-container, #d7f4ca);
      color: var(--md-sys-color-on-tertiary-container, #0d2007);
      border-radius: 12px;
      padding: 16px;
    }
    .mrf-success .material-symbols-outlined {
      font-size: 28px;
      color: var(--md-sys-color-tertiary, #386a20);
      flex-shrink: 0;
    }
    .mrf-success strong { display: block; margin-bottom: 4px; }
    .mrf-success p { margin: 0; font-size: 14px; }
    .mrf-form { display: flex; flex-direction: column; gap: 16px; }
    .mrf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 480px) { .mrf-row { grid-template-columns: 1fr; } }
    .mrf-field { display: flex; flex-direction: column; gap: 4px; }
    .mrf-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .mrf-input, .mrf-select, .mrf-textarea {
      padding: 12px 14px;
      background: var(--md-sys-color-surface, #fffbfe);
      border: 1px solid var(--md-sys-color-outline, #79747e);
      border-radius: 8px;
      font-size: 14px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      transition: border-color 0.15s, box-shadow 0.15s;
      font-family: inherit;
      outline: none;
    }
    .mrf-input:focus, .mrf-select:focus, .mrf-textarea:focus {
      border-color: var(--md-sys-color-primary, #6750a4);
      box-shadow: 0 0 0 2px var(--md-sys-color-primary-container, #eaddff);
    }
    .mrf-error-input {
      border-color: var(--md-sys-color-error, #b3261e) !important;
    }
    .mrf-textarea { resize: vertical; min-height: 100px; }
    .mrf-field-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .mrf-error-msg {
      font-size: 12px;
      color: var(--md-sys-color-error, #b3261e);
    }
    .mrf-char-count {
      font-size: 11px;
      color: var(--md-sys-color-outline, #79747e);
    }
    .mrf-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 8px;
    }
    .mrf-btn-primary, .mrf-btn-secondary {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      border-radius: 20px;
      border: none;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s, opacity 0.15s;
    }
    .mrf-btn-primary {
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #ffffff);
    }
    .mrf-btn-primary:hover { opacity: 0.9; }
    .mrf-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .mrf-btn-primary .material-symbols-outlined { font-size: 18px; }
    .mrf-btn-secondary {
      background: transparent;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      border: 1px solid var(--md-sys-color-outline, #79747e);
    }
    .mrf-btn-secondary:hover {
      background: var(--md-sys-color-surface-variant, #e7e0ec);
    }
    .mrf-spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: mrf-spin 0.6s linear infinite;
    }
    @keyframes mrf-spin { to { transform: rotate(360deg); } }
  `],
})
export class MaintenanceRequestFormComponent {
  /** @input Tenant identifier */
  readonly tenantId = input.required<string>();
  /** @input Tenant display name */
  readonly tenantName = input.required<string>();
  /** @input Landlord identifier */
  readonly landlordId = input.required<string>();
  /** @input Property identifier */
  readonly propertyId = input.required<string>();
  /** @input Property display title */
  readonly propertyTitle = input.required<string>();

  /** @output Emits the created MaintenanceRequest on success */
  readonly submitted = output<MaintenanceRequest>();

  private readonly service = inject(MaintenanceRequestService);

  readonly submitting = signal(false);
  readonly submitted$ = signal(false);

  readonly form = createSignalForm({
    category: { value: '' as MaintenanceCategory | '', validators: [required()] },
    priority: { value: '' as MaintenancePriority | '', validators: [required()] },
    title: { value: '', validators: [required(), minLength(5), maxLength(100)] },
    description: { value: '', validators: [required(), minLength(20), maxLength(1000)] },
  });

  /** Handle form submission. */
  onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.form.submit()) return;

    this.submitting.set(true);
    setTimeout(() => {
      const payload: CreateMaintenanceRequestPayload = {
        tenantId: this.tenantId(),
        tenantName: this.tenantName(),
        landlordId: this.landlordId(),
        propertyId: this.propertyId(),
        propertyTitle: this.propertyTitle(),
        category: this.form.fields.category.value() as MaintenanceCategory,
        priority: this.form.fields.priority.value() as MaintenancePriority,
        title: this.form.fields.title.value() as string,
        description: this.form.fields.description.value() as string,
      };
      const created = this.service.create(payload);
      this.submitting.set(false);
      this.submitted$.set(true);
      this.submitted.emit(created);
    }, 500);
  }

  /** Reset form to initial state. */
  resetForm(): void {
    this.submitted$.set(false);
    this.submitting.set(false);
  }
}
