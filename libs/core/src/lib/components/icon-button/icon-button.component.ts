import '@material/web/iconbutton/icon-button.js';
import '@material/web/iconbutton/filled-icon-button.js';
import '@material/web/iconbutton/filled-tonal-icon-button.js';
import '@material/web/iconbutton/outlined-icon-button.js';
import '@material/web/icon/icon.js';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';

export type IconButtonVariant = 'standard' | 'filled' | 'tonal' | 'outlined';

/**
 * IU Icon Button — Angular wrapper over @material/web icon buttons.
 *
 * M3 spec: 40×40px standard, 48×48px touch target, corner radius 20px (full).
 *
 * Usage:
 *   <iu-icon-button icon="settings"></iu-icon-button>
 *   <iu-icon-button variant="filled" icon="edit" ariaLabel="Edit"></iu-icon-button>
 *   <iu-icon-button variant="tonal" icon="favorite" [toggle]="true" [selected]="isFav"></iu-icon-button>
 */
@Component({
  selector: 'iu-icon-button',
  standalone: true,
  templateUrl: './icon-button.component.html',
  styleUrl: './icon-button.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class IconButtonComponent {
  // --- Inputs ---
  /** Material Symbols icon name */
  icon = input.required<string>();

  /** M3 icon button variant */
  variant = input<IconButtonVariant>('standard');

  /** Hard-disabled */
  disabled = input<boolean>(false);

  /** Toggle mode — enables selected/unselected states */
  toggle = input<boolean>(false);

  /** Selected state (only meaningful when toggle=true) */
  selected = input<boolean>(false);

  /** Accessible label */
  ariaLabel = input<string>('');

  // --- Outputs ---
  clicked = output<MouseEvent>();

  // --- Derived ---
  hostClass = computed(() => {
    const c = ['iu-icon-btn', `iu-icon-btn--${this.variant()}`];
    if (this.disabled()) c.push('iu-icon-btn--disabled');
    if (this.toggle())   c.push('iu-icon-btn--toggle');
    if (this.selected()) c.push('iu-icon-btn--selected');
    return c.join(' ');
  });

  onClick(e: MouseEvent): void {
    if (this.disabled()) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this.clicked.emit(e);
  }
}
