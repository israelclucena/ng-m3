import '@material/web/textfield/outlined-text-field.js';
import '@material/web/textfield/filled-text-field.js';
import '@material/web/icon/icon.js';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';

export type InputVariant = 'outlined' | 'filled';
export type InputType = 'text' | 'password' | 'email' | 'number' | 'search' | 'tel';

/**
 * IU Input Component — Angular wrapper over @material/web text fields.
 *
 * Uses md-outlined-text-field (default) and md-filled-text-field.
 * Same pattern as ButtonComponent: @switch on variant.
 */
@Component({
  selector: 'iu-input',
  standalone: true,
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class InputComponent {
  // --- Inputs ---
  variant = input<InputVariant>('outlined');
  type = input<InputType>('text');
  label = input<string>('');
  placeholder = input<string>('');
  hint = input<string>('');
  errorMessage = input<string>('');
  disabled = input<boolean>(false);
  required = input<boolean>(false);
  fullWidth = input<boolean>(false);
  prefixIcon = input<string>('');
  suffixIcon = input<string>('');

  // --- Two-way binding ---
  value = model<string>('');

  // --- Outputs ---
  focused = output<FocusEvent>();
  blurred = output<FocusEvent>();
  entered = output<KeyboardEvent>();

  // --- Internal state ---
  showPassword = signal(false);

  // --- Computed ---
  hasError = computed(() => !!this.errorMessage());
  hasPrefix = computed(() => !!this.prefixIcon());
  hasSuffix = computed(() => !!this.suffixIcon() || this.type() === 'password');

  effectiveType = computed(() =>
    this.type() === 'password' && this.showPassword() ? 'text' : this.type()
  );

  passwordIcon = computed(() =>
    this.showPassword() ? 'visibility_off' : 'visibility'
  );

  hostClass = computed(() => {
    const c = ['iu-input'];
    if (this.fullWidth()) c.push('iu-input--full-width');
    return c.join(' ');
  });

  // --- Handlers ---
  onFocus(e: FocusEvent): void {
    this.focused.emit(e);
  }

  onBlur(e: FocusEvent): void {
    this.blurred.emit(e);
  }

  onInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.value.set(target.value);
  }

  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') this.entered.emit(e);
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }
}
