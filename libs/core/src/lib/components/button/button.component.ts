import '@material/web/button/elevated-button.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/filled-tonal-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import '@material/web/icon/icon.js';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
} from '@angular/core';

export type ButtonVariant =
  | 'primary'    // md-filled-button
  | 'secondary'  // md-filled-tonal-button
  | 'outlined'   // md-outlined-button
  | 'elevated'   // md-elevated-button
  | 'text'       // md-text-button
  | 'danger'     // md-filled-button (error theme)
  | 'selected'   // md-filled-tonal-button (secondary theme)
  | 'ghost';     // alias for text

export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * IU Button — Angular wrapper over @material/web buttons.
 *
 * Key architectural decision:
 * Angular `<ng-content>` inside `@switch/@case` does NOT re-project
 * dynamically when the active case changes. So we use a `label` input
 * for the button text. Use `<ng-content>` only for static rich content
 * (the button variant MUST NOT change after init in that case).
 *
 * Usage:
 *   <iu-button variant="primary" label="Confirmar" icon="upload"></iu-button>
 *   <iu-button variant="outlined" label="Cancelar"></iu-button>
 */
@Component({
  selector: 'iu-button',
  standalone: true,
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  // None: lets our CSS target md-* elements in template without ng-deep
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ButtonComponent {
  private readonly el = inject(ElementRef<HTMLElement>);

  // --- Inputs ---
  /** M3 button variant */
  variant = input<ButtonVariant>('primary');

  /** Visible text label inside the button */
  label = input<string>('');

  /** Material Symbols icon name (e.g. 'upload', 'add', 'home') */
  icon = input<string>('');

  /** When true, icon renders AFTER the label */
  trailingIcon = input<boolean>(false);

  /** sm=32px | md=40px | lg=48px height */
  size = input<ButtonSize>('md');

  /** Hard-disabled: button not focusable */
  disabled = input<boolean>(false);

  /**
   * Soft-disabled: looks disabled but remains focusable (ARIA pattern for toolbars).
   * https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_disabled_controls
   */
  softDisabled = input<boolean>(false);

  /**
   * Loading: same as soft-disabled but also blocks clicks.
   * Sets aria-busy on the host.
   */
  loading = input<boolean>(false);

  /** Stretch to 100% width of the container */
  fullWidth = input<boolean>(false);

  /** aria-label for screen readers */
  ariaLabel = input<string>('');

  /** button type attr */
  type = input<'button' | 'submit' | 'reset'>('button');

  // --- Outputs ---
  clicked = output<MouseEvent>();

  // --- Derived ---
  isDisabled    = computed(() => this.disabled());
  isSoftDisabled = computed(() => this.softDisabled() || this.loading());
  hasIcon       = computed(() => !!this.icon());

  /** CSS tokens for this variant+size, applied to the md-* element */
  hostClass = computed(() => {
    const c = [
      'iu-btn',
      `iu-btn--${this.variant()}`,
      `iu-btn--${this.size()}`,
    ];
    if (this.fullWidth())      c.push('iu-btn--full-width');
    if (this.loading())        c.push('iu-btn--loading');
    if (this.isDisabled())     c.push('iu-btn--disabled');
    if (this.isSoftDisabled()) c.push('iu-btn--soft-disabled');
    return c.join(' ');
  });

  onClick(e: MouseEvent): void {
    if (this.isDisabled() || this.isSoftDisabled()) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this.clicked.emit(e);
  }
}
