import {
  Component,
  input,
  output,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  FormField,
  FormFieldValidation,
  FormSubmitEvent,
} from './form-field.model';

/**
 * IuFormBuilder — Dynamic form builder with validation and M3 design tokens.
 *
 * Renders a form from a `FormField[]` schema. Tracks state via Angular Signals.
 * Emits `(submitted)` with values and validity when the user submits.
 *
 * @example
 * ```html
 * <iu-form-builder
 *   [fields]="myFields"
 *   submitLabel="Guardar"
 *   (submitted)="onSubmit($event)"
 * ></iu-form-builder>
 * ```
 */
@Component({
  selector: 'iu-form-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <form class="iu-form" (ngSubmit)="submit()" novalidate>

      @for (field of fields(); track field.key) {
        <div class="iu-form__field" [class.iu-form__field--error]="hasError(field.key)">

          <!-- Label (not for checkbox/toggle which have inline labels) -->
          @if (field.type !== 'checkbox' && field.type !== 'toggle') {
            <label class="iu-form__label" [for]="field.key">
              {{ field.label }}
              @if (field.validation?.required) {
                <span class="iu-form__required" aria-hidden="true">*</span>
              }
            </label>
          }

          <!-- TEXT / EMAIL / PASSWORD / NUMBER / DATE -->
          @if (['text','email','password','number','date'].includes(field.type)) {
            <div class="iu-form__input-wrap" [class.iu-form__input-wrap--icon]="field.prefixIcon">
              @if (field.prefixIcon) {
                <span class="iu-form__prefix-icon material-symbols-outlined">{{ field.prefixIcon }}</span>
              }
              <input
                class="iu-form__input"
                [id]="field.key"
                [type]="field.type"
                [placeholder]="field.placeholder || ''"
                [disabled]="field.disabled || false"
                [value]="getValue(field.key)"
                (input)="onInput(field.key, $event)"
                (blur)="touch(field.key)"
              />
            </div>
          }

          <!-- TEXTAREA -->
          @if (field.type === 'textarea') {
            <textarea
              class="iu-form__input iu-form__textarea"
              [id]="field.key"
              [placeholder]="field.placeholder || ''"
              [disabled]="field.disabled || false"
              rows="4"
              (input)="onInput(field.key, $event)"
              (blur)="touch(field.key)"
            >{{ getValue(field.key) }}</textarea>
          }

          <!-- SELECT -->
          @if (field.type === 'select') {
            <select
              class="iu-form__input iu-form__select"
              [id]="field.key"
              [disabled]="field.disabled || false"
              (change)="onSelectChange(field.key, $event)"
              (blur)="touch(field.key)"
            >
              <option value="" disabled [selected]="!getValue(field.key)">
                {{ field.placeholder || 'Selecionar...' }}
              </option>
              @for (opt of field.options || []; track opt.value) {
                <option [value]="opt.value" [selected]="getValue(field.key) === opt.value">
                  {{ opt.label }}
                </option>
              }
            </select>
          }

          <!-- RADIO -->
          @if (field.type === 'radio') {
            <div class="iu-form__radio-group" role="radiogroup" [attr.aria-labelledby]="field.key + '-label'">
              @for (opt of field.options || []; track opt.value) {
                <label class="iu-form__radio-label">
                  <input
                    type="radio"
                    class="iu-form__radio"
                    [name]="field.key"
                    [value]="opt.value"
                    [checked]="getValue(field.key) === opt.value"
                    [disabled]="field.disabled || false"
                    (change)="setValue(field.key, opt.value); touch(field.key)"
                  />
                  <span class="iu-form__radio-text">{{ opt.label }}</span>
                </label>
              }
            </div>
          }

          <!-- CHECKBOX -->
          @if (field.type === 'checkbox') {
            <label class="iu-form__checkbox-label" [for]="field.key">
              <input
                type="checkbox"
                class="iu-form__checkbox"
                [id]="field.key"
                [checked]="!!getValue(field.key)"
                [disabled]="field.disabled || false"
                (change)="onCheckboxChange(field.key, $event)"
                (blur)="touch(field.key)"
              />
              <span class="iu-form__checkbox-text">
                {{ field.label }}
                @if (field.validation?.required) {
                  <span class="iu-form__required" aria-hidden="true">*</span>
                }
              </span>
            </label>
          }

          <!-- TOGGLE -->
          @if (field.type === 'toggle') {
            <label class="iu-form__toggle-label" [for]="field.key">
              <div class="iu-form__toggle-track" [class.iu-form__toggle-track--on]="!!getValue(field.key)">
                <input
                  type="checkbox"
                  class="iu-form__toggle-input"
                  [id]="field.key"
                  [checked]="!!getValue(field.key)"
                  [disabled]="field.disabled || false"
                  (change)="onCheckboxChange(field.key, $event)"
                  (blur)="touch(field.key)"
                />
                <div class="iu-form__toggle-thumb"></div>
              </div>
              <span class="iu-form__toggle-text">
                {{ field.label }}
                @if (field.validation?.required) {
                  <span class="iu-form__required" aria-hidden="true">*</span>
                }
              </span>
            </label>
          }

          <!-- Hint -->
          @if (field.hint && !hasError(field.key)) {
            <p class="iu-form__hint">{{ field.hint }}</p>
          }

          <!-- Error -->
          @if (hasError(field.key)) {
            <p class="iu-form__error" role="alert">
              <span class="material-symbols-outlined">error</span>
              {{ getError(field.key) }}
            </p>
          }

        </div>
      }

      <!-- Actions -->
      <div class="iu-form__actions">
        @if (showReset()) {
          <button
            type="button"
            class="iu-form__btn iu-form__btn--ghost"
            (click)="reset()"
          >
            {{ resetLabel() }}
          </button>
        }
        <button
          type="submit"
          class="iu-form__btn iu-form__btn--primary"
          [disabled]="submitted() && !isValid()"
        >
          @if (loading()) {
            <span class="iu-form__spinner"></span>
          }
          {{ submitLabel() }}
        </button>
      </div>

    </form>
  `,
  styles: [`
    :host { display: block; }

    .iu-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .iu-form__field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .iu-form__label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--md-sys-color-on-surface-variant);
      letter-spacing: 0.015em;
    }

    .iu-form__required {
      color: var(--md-sys-color-error);
      margin-left: 2px;
    }

    /* Input wrapper for prefix icon */
    .iu-form__input-wrap {
      position: relative;
      &.iu-form__input-wrap--icon .iu-form__input {
        padding-left: 44px;
      }
    }

    .iu-form__prefix-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 20px;
      color: var(--md-sys-color-on-surface-variant);
      pointer-events: none;
    }

    /* Base input styles */
    .iu-form__input {
      width: 100%;
      height: 56px;
      padding: 0 16px;
      border: 1px solid var(--md-sys-color-outline);
      border-radius: 4px 4px 0 0;
      border-bottom-width: 2px;
      background: var(--md-sys-color-surface-container-highest);
      color: var(--md-sys-color-on-surface);
      font-size: 1rem;
      font-family: inherit;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.2s, background 0.2s;
      appearance: none;

      &::placeholder { color: var(--md-sys-color-on-surface-variant); }
      &:focus {
        border-bottom-color: var(--md-sys-color-primary);
        background: var(--md-sys-color-surface-container-high);
      }
      &:disabled {
        opacity: 0.38;
        cursor: not-allowed;
      }
    }

    .iu-form__textarea {
      height: auto;
      padding: 14px 16px;
      resize: vertical;
      border-radius: 4px 4px 0 0;
    }

    .iu-form__select {
      cursor: pointer;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23888' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      padding-right: 44px;
    }

    /* Error state */
    .iu-form__field--error {
      .iu-form__input {
        border-bottom-color: var(--md-sys-color-error);
      }
      .iu-form__label {
        color: var(--md-sys-color-error);
      }
    }

    /* Radio */
    .iu-form__radio-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .iu-form__radio-label {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      font-size: 0.95rem;
    }
    .iu-form__radio {
      width: 20px;
      height: 20px;
      accent-color: var(--md-sys-color-primary);
      cursor: pointer;
    }

    /* Checkbox */
    .iu-form__checkbox-label {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
    }
    .iu-form__checkbox {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      accent-color: var(--md-sys-color-primary);
      cursor: pointer;
      flex-shrink: 0;
    }
    .iu-form__checkbox-text, .iu-form__radio-text {
      font-size: 0.95rem;
      color: var(--md-sys-color-on-surface);
    }

    /* Toggle */
    .iu-form__toggle-label {
      display: flex;
      align-items: center;
      gap: 14px;
      cursor: pointer;
    }
    .iu-form__toggle-track {
      position: relative;
      width: 52px;
      height: 32px;
      border-radius: 16px;
      background: var(--md-sys-color-surface-container-highest);
      border: 2px solid var(--md-sys-color-outline);
      transition: background 0.2s, border-color 0.2s;
      flex-shrink: 0;

      &.iu-form__toggle-track--on {
        background: var(--md-sys-color-primary);
        border-color: var(--md-sys-color-primary);

        .iu-form__toggle-thumb {
          transform: translateX(20px);
          background: var(--md-sys-color-on-primary);
        }
      }
    }
    .iu-form__toggle-input {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }
    .iu-form__toggle-thumb {
      position: absolute;
      top: 4px;
      left: 4px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--md-sys-color-outline);
      transition: transform 0.2s, background 0.2s;
    }
    .iu-form__toggle-text {
      font-size: 0.95rem;
      color: var(--md-sys-color-on-surface);
    }

    /* Hint & Error */
    .iu-form__hint {
      font-size: 0.8rem;
      color: var(--md-sys-color-on-surface-variant);
      margin: 0;
      padding-left: 4px;
    }
    .iu-form__error {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      color: var(--md-sys-color-error);
      margin: 0;
      padding-left: 4px;
      .material-symbols-outlined { font-size: 16px; }
    }

    /* Actions */
    .iu-form__actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 8px;
      border-top: 1px solid var(--md-sys-color-outline-variant);
    }

    .iu-form__btn {
      height: 40px;
      padding: 0 24px;
      border-radius: 20px;
      border: none;
      font-size: 0.875rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background 0.2s, opacity 0.2s;

      &--primary {
        background: var(--md-sys-color-primary);
        color: var(--md-sys-color-on-primary);
        &:hover { filter: brightness(0.92); }
        &:disabled { opacity: 0.38; cursor: not-allowed; }
      }
      &--ghost {
        background: transparent;
        color: var(--md-sys-color-primary);
        &:hover { background: var(--md-sys-color-primary-container); }
      }
    }

    /* Loading spinner */
    .iu-form__spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class FormBuilderComponent implements OnInit {
  /** Form field schema */
  readonly fields = input<FormField[]>([]);

  /** Submit button label */
  readonly submitLabel = input<string>('Guardar');

  /** Reset button label */
  readonly resetLabel = input<string>('Limpar');

  /** Whether to show a reset button */
  readonly showReset = input<boolean>(false);

  /** Show loading spinner on submit button */
  readonly loading = input<boolean>(false);

  /** Emits when form is submitted */
  readonly submitted_event = output<FormSubmitEvent>({ alias: 'submitted' });

  // ── Internal state (Signals) ──────────────────────────────────────
  private readonly _values = signal<Record<string, unknown>>({});
  private readonly _errors = signal<Record<string, string>>({});
  private readonly _touched = signal<Set<string>>(new Set());
  readonly submitted = signal(false);

  readonly isValid = computed(() => Object.keys(this._errors()).length === 0);

  ngOnInit(): void {
    // Seed default values
    const defaults: Record<string, unknown> = {};
    for (const f of this.fields()) {
      defaults[f.key] = f.defaultValue ?? (f.type === 'checkbox' || f.type === 'toggle' ? false : '');
    }
    this._values.set(defaults);
    this._validateAll();
  }

  /** Get current field value */
  getValue(key: string): unknown {
    return this._values()[key] ?? '';
  }

  /** Set a field value and re-validate */
  setValue(key: string, value: unknown): void {
    this._values.update(v => ({ ...v, [key]: value }));
    this._validateField(key);
  }

  /** Mark field as touched */
  touch(key: string): void {
    this._touched.update(s => { const n = new Set(s); n.add(key); return n; });
    this._validateField(key);
  }

  /** Whether a field has a visible error (touched or submitted) */
  hasError(key: string): boolean {
    const hasErr = !!this._errors()[key];
    return hasErr && (this._touched().has(key) || this.submitted());
  }

  /** Get error message for a field */
  getError(key: string): string {
    return this._errors()[key] ?? '';
  }

  onInput(key: string, event: Event): void {
    const input = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.setValue(key, input.value);
  }

  onSelectChange(key: string, event: Event): void {
    const sel = event.target as HTMLSelectElement;
    this.setValue(key, sel.value);
  }

  onCheckboxChange(key: string, event: Event): void {
    const cb = event.target as HTMLInputElement;
    this.setValue(key, cb.checked);
  }

  /** Submit the form */
  submit(): void {
    this.submitted.set(true);
    // Touch all fields
    const touched = new Set(this.fields().map(f => f.key));
    this._touched.set(touched);
    this._validateAll();

    this.submitted_event.emit({
      values: { ...this._values() },
      isValid: this.isValid(),
    });
  }

  /** Reset form to defaults */
  reset(): void {
    this.submitted.set(false);
    this._touched.set(new Set());
    this._errors.set({});
    const defaults: Record<string, unknown> = {};
    for (const f of this.fields()) {
      defaults[f.key] = f.defaultValue ?? (f.type === 'checkbox' || f.type === 'toggle' ? false : '');
    }
    this._values.set(defaults);
  }

  // ── Validation ────────────────────────────────────────────────────

  private _validateAll(): void {
    for (const f of this.fields()) {
      this._validateField(f.key);
    }
  }

  private _validateField(key: string): void {
    const field = this.fields().find(f => f.key === key);
    if (!field) return;

    const error = this._runValidation(field, this._values()[key]);
    this._errors.update(e => {
      const next = { ...e };
      if (error) {
        next[key] = error;
      } else {
        delete next[key];
      }
      return next;
    });
  }

  private _runValidation(field: FormField, value: unknown): string | null {
    const v = field.validation;
    if (!v) return null;

    const strVal = String(value ?? '').trim();
    const numVal = Number(value);

    if (v.required) {
      if (field.type === 'checkbox' || field.type === 'toggle') {
        if (!value) return `${field.label} é obrigatório`;
      } else if (!strVal) {
        return `${field.label} é obrigatório`;
      }
    }

    if (!strVal) return null; // empty optional — no further checks

    if (v.email || field.type === 'email') {
      const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRx.test(strVal)) return 'Email inválido';
    }

    if (v.minLength !== undefined && strVal.length < v.minLength) {
      return `Mínimo ${v.minLength} caracteres`;
    }

    if (v.maxLength !== undefined && strVal.length > v.maxLength) {
      return `Máximo ${v.maxLength} caracteres`;
    }

    if (v.min !== undefined && numVal < v.min) {
      return `Valor mínimo: ${v.min}`;
    }

    if (v.max !== undefined && numVal > v.max) {
      return `Valor máximo: ${v.max}`;
    }

    if (v.pattern) {
      const rx = new RegExp(v.pattern);
      if (!rx.test(strVal)) return 'Formato inválido';
    }

    if (v.custom) {
      return v.custom(value);
    }

    return null;
  }
}
