/**
 * @fileoverview MaintenanceRequestSignalFormComponent — the maintenance-request
 * form rebuilt on Angular 22's **official** Signal Forms API (`@angular/forms/signals`).
 *
 * Fourth migration of a *real product form* off the bespoke `createSignalForm`
 * util onto the official `form()` API (after auth-register #060, tenant-application
 * #061, auth-login #062). It is a faithful, additive, side-by-side twin of
 * {@link MaintenanceRequestFormComponent}: identical markup, styles, inputs, the
 * `submitted` output and the same `MaintenanceRequestService` wiring — the **only**
 * difference is the form engine.
 *
 * This twin proves two surfaces the auth/tenant twins only partially touched, both
 * bound with the same `[formField]` two-way directive that owns the control:
 *   1. a `<select>`/enum for **category** and **priority** (`''` → `required` rejects)
 *   2. a `<textarea>` for the **description** with a `maxLength(1000)` ceiling
 * — plus the `minLength`/`maxLength` pair on both the title and description.
 *
 * Migration map (bespoke `createSignalForm` → official `form()`):
 * | bespoke (MaintenanceRequestFormComponent)              | official (this)                                   |
 * | ----------------------------------------------------- | ------------------------------------------------- |
 * | `createSignalForm({ title: { validators:[...] } })`   | `form(model, (p) => { required(p.title); ... })`  |
 * | `[value]` + `(input/change)` + `(blur)="…touch()"`    | `[formField]="f.title"` (two-way, select+textarea)|
 * | `form.fields.title.showError()`                       | `f.title().touched() && f.title().invalid()`      |
 * | `form.fields.title.value().length`                    | `f.title().value().length` (live char count)      |
 * | `form.submit()` (marks all touched)                   | `f().markAsTouched()` + `f().invalid()`           |
 *
 * The bespoke component remains the shipped default; this twin sits behind
 * `MAINTENANCE_REQUEST_SIGNAL_FORM` and replaces nothing. A parity spec asserts
 * both hand `MaintenanceRequestService.create` an identical payload.
 *
 * Feature flag: `MAINTENANCE_REQUEST_SIGNAL_FORM`
 *
 * @see libs/core/src/lib/components/maintenance-request/maintenance-request-form.component.ts — the bespoke twin
 * @see libs/core/src/lib/components/signal-forms-listing/signal-forms-listing.component.ts — enum select via [formField]
 *
 * Night Shift 2026-08-23 — Signal Forms migration #4 (real product form).
 */
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
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
  maxLength,
  minLength,
  required,
} from '@angular/forms/signals';
import {
  MaintenanceRequestService,
  MaintenanceRequest,
  CreateMaintenanceRequestPayload,
  MaintenanceCategory,
  MaintenancePriority,
} from '../../services/maintenance-request.service';

// ─── Models ──────────────────────────────────────────────────────────────────

/**
 * The maintenance-request form's single source of truth. `category` and `priority`
 * carry the empty string as their unselected sentinel — exactly what the bespoke
 * twin seeds `createSignalForm` with — so `required` rejects the placeholder option.
 */
export interface MaintenanceRequestModel {
  category: MaintenanceCategory | '';
  priority: MaintenancePriority | '';
  title: string;
  description: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * `iu-maintenance-request-signal-form`
 *
 * Feature-parity with {@link MaintenanceRequestFormComponent}: category + priority
 * enum selects, title + description with min/max validation and live char counts,
 * async submit with spinner, success screen, and the same `submitted` output driving
 * the same `MaintenanceRequestService` — built on the official Signal Forms API.
 *
 * Feature flag: `MAINTENANCE_REQUEST_SIGNAL_FORM`
 *
 * @example
 * ```html
 * <iu-maintenance-request-signal-form
 *   [tenantId]="'tenant-001'"
 *   [tenantName]="'Ana Ferreira'"
 *   [landlordId]="'landlord-001'"
 *   [propertyId]="'p1'"
 *   [propertyTitle]="'Apartamento T2 no Chiado'"
 *   (submitted)="onRequestSubmitted($event)" />
 * ```
 */
@Component({
  selector: 'iu-maintenance-request-signal-form',
  standalone: true,
  imports: [CommonModule, FormField],
  template: `
    <div class="mrsf-container">
      <div class="mrsf-header">
        <span class="material-symbols-outlined mrsf-icon">build</span>
        <div>
          <h3 class="mrsf-title">Report Maintenance Issue</h3>
          <p class="mrsf-subtitle">{{ propertyTitle() }}</p>
        </div>
        <span class="mrsf-badge">form()</span>
      </div>

      @if (submitted$()) {
        <div class="mrsf-success">
          <span class="material-symbols-outlined">check_circle</span>
          <div>
            <strong>Request submitted!</strong>
            <p>Your request has been sent to the landlord. You'll be notified of updates.</p>
          </div>
        </div>
      } @else {
        <form class="mrsf-form" (submit)="onSubmit($event)" novalidate>

          <!-- Row: Category + Priority -->
          <div class="mrsf-row">
            <div class="mrsf-field">
              <label class="mrsf-label" for="mrsf-category">Category *</label>
              <select
                id="mrsf-category"
                class="mrsf-select"
                [formField]="f.category"
                [class.mrsf-error-input]="showError(f.category)">
                <option value="">Select category…</option>
                <option value="plumbing">🚿 Plumbing</option>
                <option value="electrical">⚡ Electrical</option>
                <option value="hvac">❄️ HVAC / Heating</option>
                <option value="appliance">🍳 Appliance</option>
                <option value="structural">🏗️ Structural</option>
                <option value="pest">🐛 Pest Control</option>
                <option value="other">🔧 Other</option>
              </select>
              @if (showError(f.category)) {
                <span class="mrsf-error-msg">{{ firstError(f.category) }}</span>
              }
            </div>

            <div class="mrsf-field">
              <label class="mrsf-label" for="mrsf-priority">Priority *</label>
              <select
                id="mrsf-priority"
                class="mrsf-select"
                [formField]="f.priority"
                [class.mrsf-error-input]="showError(f.priority)">
                <option value="">Select priority…</option>
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
              @if (showError(f.priority)) {
                <span class="mrsf-error-msg">{{ firstError(f.priority) }}</span>
              }
            </div>
          </div>

          <!-- Title -->
          <div class="mrsf-field">
            <label class="mrsf-label" for="mrsf-title">Issue Title *</label>
            <input
              id="mrsf-title"
              class="mrsf-input"
              type="text"
              placeholder="Brief description of the issue"
              [formField]="f.title"
              [class.mrsf-error-input]="showError(f.title)" />
            <div class="mrsf-field-footer">
              @if (showError(f.title)) {
                <span class="mrsf-error-msg">{{ firstError(f.title) }}</span>
              } @else {
                <span></span>
              }
              <span class="mrsf-char-count">{{ f.title().value().length }}/100</span>
            </div>
          </div>

          <!-- Description -->
          <div class="mrsf-field">
            <label class="mrsf-label" for="mrsf-description">Description *</label>
            <textarea
              id="mrsf-description"
              class="mrsf-textarea"
              rows="4"
              placeholder="Describe the issue in detail. When did it start? How severe is it?"
              [formField]="f.description"
              [class.mrsf-error-input]="showError(f.description)"></textarea>
            <div class="mrsf-field-footer">
              @if (showError(f.description)) {
                <span class="mrsf-error-msg">{{ firstError(f.description) }}</span>
              } @else {
                <span></span>
              }
              <span class="mrsf-char-count">{{ f.description().value().length }}/1000</span>
            </div>
          </div>

          <!-- Submit -->
          <div class="mrsf-actions">
            <button
              type="button"
              class="mrsf-btn-secondary"
              (click)="resetForm()">
              Cancel
            </button>
            <button
              type="submit"
              class="mrsf-btn-primary"
              [disabled]="submitting()">
              @if (submitting()) {
                <span class="mrsf-spinner"></span>
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
    .mrsf-container {
      background: var(--md-sys-color-surface-container-low, #f3eff4);
      border-radius: 16px;
      padding: 24px;
      max-width: 640px;
    }
    .mrsf-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .mrsf-icon {
      font-size: 32px;
      color: var(--md-sys-color-primary, #6750a4);
    }
    .mrsf-title {
      margin: 0 0 2px;
      font-size: 20px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .mrsf-subtitle {
      margin: 0;
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .mrsf-badge {
      margin-left: auto;
      align-self: flex-start;
      padding: 0.125rem 0.5rem;
      border-radius: 999px;
      font-family: ui-monospace, 'SF Mono', Menlo, monospace;
      font-size: 0.6875rem;
      background: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
    }
    .mrsf-success {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: var(--md-sys-color-tertiary-container, #d7f4ca);
      color: var(--md-sys-color-on-tertiary-container, #0d2007);
      border-radius: 12px;
      padding: 16px;
    }
    .mrsf-success .material-symbols-outlined {
      font-size: 28px;
      color: var(--md-sys-color-tertiary, #386a20);
      flex-shrink: 0;
    }
    .mrsf-success strong { display: block; margin-bottom: 4px; }
    .mrsf-success p { margin: 0; font-size: 14px; }
    .mrsf-form { display: flex; flex-direction: column; gap: 16px; }
    .mrsf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 480px) { .mrsf-row { grid-template-columns: 1fr; } }
    .mrsf-field { display: flex; flex-direction: column; gap: 4px; }
    .mrsf-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .mrsf-input, .mrsf-select, .mrsf-textarea {
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
    .mrsf-input:focus, .mrsf-select:focus, .mrsf-textarea:focus {
      border-color: var(--md-sys-color-primary, #6750a4);
      box-shadow: 0 0 0 2px var(--md-sys-color-primary-container, #eaddff);
    }
    .mrsf-error-input {
      border-color: var(--md-sys-color-error, #b3261e) !important;
    }
    .mrsf-textarea { resize: vertical; min-height: 100px; }
    .mrsf-field-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .mrsf-error-msg {
      font-size: 12px;
      color: var(--md-sys-color-error, #b3261e);
    }
    .mrsf-char-count {
      font-size: 11px;
      color: var(--md-sys-color-outline, #79747e);
    }
    .mrsf-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 8px;
    }
    .mrsf-btn-primary, .mrsf-btn-secondary {
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
    .mrsf-btn-primary {
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #ffffff);
    }
    .mrsf-btn-primary:hover { opacity: 0.9; }
    .mrsf-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .mrsf-btn-primary .material-symbols-outlined { font-size: 18px; }
    .mrsf-btn-secondary {
      background: transparent;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      border: 1px solid var(--md-sys-color-outline, #79747e);
    }
    .mrsf-btn-secondary:hover {
      background: var(--md-sys-color-surface-variant, #e7e0ec);
    }
    .mrsf-spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: mrsf-spin 0.6s linear infinite;
    }
    @keyframes mrsf-spin { to { transform: rotate(360deg); } }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenanceRequestSignalFormComponent {
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

  /** True while the (mock) create request is in flight. */
  readonly submitting = signal(false);

  /** True once the request has been created (shows the success screen). */
  readonly submitted$ = signal(false);

  /** True once a submit has been attempted (drives error visibility). */
  private readonly submittedAttempt = signal(false);

  // ── Official Signal Form ───────────────────────────────────────────────────

  /** Single source of truth; `form()` wraps and mutates it via `[formField]`. */
  private readonly model = signal<MaintenanceRequestModel>({
    category: '',
    priority: '',
    title: '',
    description: '',
  });

  /**
   * Field tree with every rule declared inline. Messages mirror the bespoke twin's
   * `createSignalForm` defaults byte-for-byte so both surfaces read identically.
   */
  protected readonly f = form(this.model, (path) => {
    required(path.category, { message: 'This field is required.' });
    required(path.priority, { message: 'This field is required.' });

    required(path.title, { message: 'This field is required.' });
    minLength(path.title, 5, { message: 'Minimum 5 characters required.' });
    maxLength(path.title, 100, { message: 'Maximum 100 characters allowed.' });

    required(path.description, { message: 'This field is required.' });
    minLength(path.description, 20, { message: 'Minimum 20 characters required.' });
    maxLength(path.description, 1000, { message: 'Maximum 1000 characters allowed.' });
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

  /** Handle form submission — full validation, then MaintenanceRequestService. */
  onSubmit(event: Event): void {
    event.preventDefault();
    this.submittedAttempt.set(true);
    this.f().markAsTouched();

    if (this.f().invalid()) return;

    this.submitting.set(true);
    setTimeout(() => {
      const v = this.model();
      const payload: CreateMaintenanceRequestPayload = {
        tenantId: this.tenantId(),
        tenantName: this.tenantName(),
        landlordId: this.landlordId(),
        propertyId: this.propertyId(),
        propertyTitle: this.propertyTitle(),
        category: v.category as MaintenanceCategory,
        priority: v.priority as MaintenancePriority,
        title: v.title,
        description: v.description,
      };
      const created = this.service.create(payload);
      this.submitting.set(false);
      this.submitted$.set(true);
      this.submitted.emit(created);
    }, 500);
  }

  /** Reset the success/submitting state back to the editable form. */
  resetForm(): void {
    this.submitted$.set(false);
    this.submitting.set(false);
    this.submittedAttempt.set(false);
  }
}
