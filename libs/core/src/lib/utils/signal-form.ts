/**
 * @fileoverview signalForm — lightweight signal-based form utility.
 *
 * Replaces Angular Reactive Forms / template-driven forms with pure Signal
 * state for simple forms. No RxJS, no NgModules, no validators classes.
 *
 * Key design decisions:
 * - Validators are plain functions: `(value: T) => string | null`
 * - Errors are computed signals so they re-derive automatically
 * - Touched state is manually controlled (set on blur)
 * - `submit()` marks all fields as touched for error visibility
 *
 * @example
 * ```ts
 * // In a component
 * readonly form = createSignalForm({
 *   name:    { value: '',    validators: [required(), minLength(2)] },
 *   email:   { value: '',    validators: [required(), email()] },
 *   message: { value: '',    validators: [required(), maxLength(500)] },
 * });
 *
 * // Template
 * <input [value]="form.fields.name.value()"
 *        (input)="form.fields.name.setValue($event.target.value)"
 *        (blur)="form.fields.name.touch()" />
 * <span *ngIf="form.fields.name.showError()">{{ form.fields.name.firstError() }}</span>
 * <button [disabled]="!form.valid()" (click)="onSubmit()">Submit</button>
 *
 * // In the submit handler
 * onSubmit() {
 *   if (!this.form.submit()) return; // marks all touched, returns false if invalid
 *   console.log(this.form.value());  // { name: '…', email: '…', message: '…' }
 * }
 * ```
 *
 * Sprint 024 — Signal Forms — Night Shift 2026-03-18
 * Sprint 026 — Type inference fix for TypeScript 5.9.x stricter generic inference
 */
import {
  Signal,
  WritableSignal,
  computed,
  signal,
} from '@angular/core';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Validator function: returns an error message string, or null if valid.
 */
export type SignalValidator<T> = (value: T) => string | null;

/**
 * Configuration for a single form field.
 */
export interface SignalFieldConfig<T> {
  /** Initial value */
  value: T;
  /** Optional validators (run in order; first failure wins) */
  validators?: SignalValidator<T>[];
}

/**
 * A reactive signal-based form field.
 */
export interface SignalField<T> {
  /** Current field value as a signal */
  readonly value: Signal<T>;
  /** Whether the field has been interacted with */
  readonly touched: Signal<boolean>;
  /** Whether the value differs from initial */
  readonly dirty: Signal<boolean>;
  /** Array of all current validation errors */
  readonly errors: Signal<string[]>;
  /** First error message (or null) */
  readonly firstError: Signal<string | null>;
  /** True if there are validation errors */
  readonly invalid: Signal<boolean>;
  /** True if touched AND invalid (use for showing error messages) */
  readonly showError: Signal<boolean>;

  /** Set the field's value */
  setValue(value: T): void;
  /** Mark field as touched (call on blur) */
  touch(): void;
  /** Reset to initial value + clear touched */
  reset(): void;
}

/**
 * Config map shape: maps string keys to `SignalFieldConfig` entries.
 *
 * Uses `SignalFieldConfig<any>` (not `unknown`) so that validators typed for concrete
 * types like `SignalValidator<string>` remain assignable — validators are contravariant
 * on their parameter, so `(v: string) => string | null` is NOT assignable to
 * `(v: unknown) => string | null`. The `any` here is intentional and scoped.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SignalFormConfig = { [K: string]: SignalFieldConfig<any> };

/**
 * Extracts the exact per-field value types from a config object.
 *
 * The `as string extends K ? never : K` remapping filters OUT the `string` index key
 * (where `string extends string` is true) while KEEPING literal keys like `'name'`
 * (where `string extends 'name'` is false). This avoids both TS4111 index-signature
 * errors AND the problem of `keyof` including the bare `string` index, which caused
 * value types to collapse to `unknown` in TypeScript 5.9+.
 *
 * @example
 * `InferFormValues<{ name: { value: '' }, age: { value: 0 } }>` → `{ name: string; age: number }`
 */
export type InferFormValues<C extends SignalFormConfig> = {
  [K in keyof C as string extends K ? never : K]: C[K] extends SignalFieldConfig<infer V> ? V : never;
};

/**
 * The return type of `createSignalForm`.
 * `T` is derived from the config via `InferFormValues<C>` to preserve exact value types.
 */
export interface SignalForm<T extends Record<string, unknown>> {
  /** Map of field names to reactive field objects */
  readonly fields: { [K in keyof T]: SignalField<T[K]> };
  /** Current values of all fields as a plain object (fully typed) */
  readonly value: Signal<T>;
  /** True if ALL fields are valid */
  readonly valid: Signal<boolean>;
  /** True if ANY field is invalid */
  readonly invalid: Signal<boolean>;
  /** True if ANY field is dirty */
  readonly dirty: Signal<boolean>;
  /** True if ALL fields have been touched */
  readonly allTouched: Signal<boolean>;
  /**
   * Mark all fields as touched and return validity.
   * Call in form submit handler to trigger error display.
   * @returns true if form is valid, false otherwise
   */
  submit(): boolean;
  /** Reset all fields to initial values */
  reset(): void;
}

// ─── Built-in validators ──────────────────────────────────────────────────────

/**
 * Validates that the value is non-empty.
 * Works for strings, arrays, and any truthy value.
 */
export function required(message = 'This field is required.'): SignalValidator<unknown> {
  return (value) => {
    if (value === null || value === undefined) return message;
    if (typeof value === 'string' && value.trim() === '') return message;
    if (Array.isArray(value) && value.length === 0) return message;
    return null;
  };
}

/**
 * Validates minimum string length.
 */
export function minLength(min: number, message?: string): SignalValidator<string> {
  return (value) => {
    const msg = message ?? `Minimum ${min} characters required.`;
    return value.trim().length < min ? msg : null;
  };
}

/**
 * Validates maximum string length.
 */
export function maxLength(max: number, message?: string): SignalValidator<string> {
  return (value) => {
    const msg = message ?? `Maximum ${max} characters allowed.`;
    return value.trim().length > max ? msg : null;
  };
}

/**
 * Validates email format.
 */
export function emailValidator(message = 'Enter a valid email address.'): SignalValidator<string> {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return (value) => (value && !re.test(value) ? message : null);
}

/**
 * Validates that a numeric value is within a range.
 */
export function range(
  min: number,
  max: number,
  message?: string
): SignalValidator<number> {
  return (value) => {
    const msg = message ?? `Value must be between ${min} and ${max}.`;
    return value < min || value > max ? msg : null;
  };
}

/**
 * Validates against a RegExp pattern.
 */
export function pattern(
  re: RegExp,
  message = 'Invalid format.'
): SignalValidator<string> {
  return (value) => (value && !re.test(value) ? message : null);
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Creates a signal-based form from a config object.
 *
 * Uses `InferFormValues<C>` to derive the value types directly from the config,
 * preserving per-field types without relying on `T extends Record<string, unknown>`
 * inference (which broke under TypeScript 5.9.x's stricter generic inference).
 *
 * Call inside an Angular injection context (component constructor, service).
 * No `inject()` calls are made internally, so it is safe to call anywhere.
 *
 * @template C  Config object shape (inferred automatically)
 * @param config Field definitions with initial values and optional validators
 * @returns A reactive `SignalForm<InferFormValues<C>>` object
 */
export function createSignalForm<C extends SignalFormConfig>(
  config: C
): SignalForm<InferFormValues<C>> {
  type T = InferFormValues<C>;
  const keys = Object.keys(config) as (keyof T)[];

  // Build individual fields
  const fields = {} as { [K in keyof T]: SignalField<T[K]> };

  for (const key of keys) {
    const cfg = config[key] as SignalFieldConfig<T[typeof key]>;
    const initial = cfg.value;
    const validators = cfg.validators ?? [];

    const valueSignal: WritableSignal<T[typeof key]> = signal(initial);
    const touchedSignal: WritableSignal<boolean> = signal(false);
    const dirtySignal = computed(() => valueSignal() !== initial);

    const errorsSignal = computed<string[]>(() => {
      const v = valueSignal();
      const errs: string[] = [];
      for (const validator of validators) {
        const err = validator(v);
        if (err !== null) errs.push(err);
      }
      return errs;
    });

    const firstErrorSignal = computed(() => errorsSignal()[0] ?? null);
    const invalidSignal = computed(() => errorsSignal().length > 0);
    const showErrorSignal = computed(() => touchedSignal() && invalidSignal());

    fields[key] = {
      value: valueSignal.asReadonly(),
      touched: touchedSignal.asReadonly(),
      dirty: dirtySignal,
      errors: errorsSignal,
      firstError: firstErrorSignal,
      invalid: invalidSignal,
      showError: showErrorSignal,
      setValue(v: T[typeof key]) { valueSignal.set(v); },
      touch() { touchedSignal.set(true); },
      reset() {
        valueSignal.set(initial);
        touchedSignal.set(false);
      },
    } as SignalField<T[typeof key]>;
  }

  // Aggregate signals
  const valueSignal = computed(() => {
    const result = {} as T;
    for (const key of keys) {
      result[key] = fields[key].value() as T[typeof key];
    }
    return result;
  });

  const validSignal = computed(() => keys.every(k => !fields[k].invalid()));
  const invalidSignal = computed(() => !validSignal());
  const dirtySignal = computed(() => keys.some(k => fields[k].dirty()));
  const allTouchedSignal = computed(() => keys.every(k => fields[k].touched()));

  return {
    fields,
    value: valueSignal,
    valid: validSignal,
    invalid: invalidSignal,
    dirty: dirtySignal,
    allTouched: allTouchedSignal,
    submit(): boolean {
      for (const key of keys) {
        fields[key].touch();
      }
      return validSignal();
    },
    reset() {
      for (const key of keys) {
        fields[key].reset();
      }
    },
  };
}
