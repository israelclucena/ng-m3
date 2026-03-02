/**
 * Form Builder — Field model types
 *
 * Defines the schema for dynamic form fields used by IuFormBuilderComponent.
 */

export type FormFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'toggle'
  | 'date';

export interface FormFieldOption {
  label: string;
  value: string | number | boolean;
}

export interface FormFieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  email?: boolean;
  /** Custom validator — returns error message or null */
  custom?: (value: unknown) => string | null;
}

export interface FormField {
  /** Unique field identifier */
  key: string;
  /** Field type */
  type: FormFieldType;
  /** Visible label */
  label: string;
  /** Placeholder text */
  placeholder?: string;
  /** Helper text shown below the field */
  hint?: string;
  /** Default value */
  defaultValue?: unknown;
  /** Options for select/radio */
  options?: FormFieldOption[];
  /** Validation rules */
  validation?: FormFieldValidation;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Icon name (Material Symbols) shown as prefix */
  prefixIcon?: string;
}

export interface FormSubmitEvent {
  values: Record<string, unknown>;
  isValid: boolean;
}
