import '@material/web/select/outlined-select.js';
import '@material/web/select/filled-select.js';
import '@material/web/select/select-option.js';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';

export type SelectVariant = 'outlined' | 'filled';

/**
 * IU Select — Angular wrapper over @material/web select.
 *
 * Usage:
 *   <iu-select variant="outlined" label="País">
 *     <md-select-option value="pt"><div slot="headline">Portugal</div></md-select-option>
 *     <md-select-option value="br"><div slot="headline">Brasil</div></md-select-option>
 *   </iu-select>
 */
@Component({
  selector: 'iu-select',
  standalone: true,
  templateUrl: './select.component.html',
  styleUrl: './select.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SelectComponent {
  // --- Inputs ---
  /** M3 select variant */
  variant = input<SelectVariant>('outlined');

  /** Label text */
  label = input<string>('');

  /** Hard-disabled */
  disabled = input<boolean>(false);

  /** Required field */
  required = input<boolean>(false);

  /** Error text shown below the select */
  errorText = input<string>('');

  /** Supporting text shown below the select */
  supportingText = input<string>('');

  // --- Outputs ---
  change = output<Event>();
  input = output<Event>();

  // --- Derived ---
  hostClass = computed(() => {
    const c = ['iu-select', `iu-select--${this.variant()}`];
    if (this.disabled()) c.push('iu-select--disabled');
    if (this.errorText()) c.push('iu-select--error');
    return c.join(' ');
  });

  onChange(e: Event): void {
    this.change.emit(e);
  }

  onInput(e: Event): void {
    this.input.emit(e);
  }
}
