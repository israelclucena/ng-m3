import '@material/web/fab/fab.js';
import '@material/web/fab/branded-fab.js';
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

export type FabSize = 'small' | 'medium' | 'large';
export type FabVariant = 'surface' | 'primary' | 'secondary' | 'tertiary';

/**
 * IU FAB — Angular wrapper over @material/web FAB.
 *
 * M3 spec: small 40px, medium 56px, large 96px.
 * Corner radius: small 12px, medium 16px, large 28px.
 *
 * When `label` is provided, renders as an Extended FAB.
 *
 * Usage:
 *   <iu-fab icon="add"></iu-fab>
 *   <iu-fab icon="edit" size="small" variant="primary"></iu-fab>
 *   <iu-fab icon="navigation" label="Navigate" variant="secondary"></iu-fab>
 */
@Component({
  selector: 'iu-fab',
  standalone: true,
  templateUrl: './fab.component.html',
  styleUrl: './fab.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FabComponent {
  // --- Inputs ---
  /** Material Symbols icon name */
  icon = input<string>('add');

  /** Label text — when provided, renders as Extended FAB */
  label = input<string>('');

  /** FAB size */
  size = input<FabSize>('medium');

  /** M3 color variant */
  variant = input<FabVariant>('surface');

  /** Lowered elevation (no shadow) */
  lowered = input<boolean>(false);

  /** Disabled state */
  disabled = input<boolean>(false);

  /** Accessible label for screen readers */
  ariaLabel = input<string>('');

  // --- Outputs ---
  clicked = output<MouseEvent>();

  // --- Derived ---
  hostClass = computed(() => {
    const c = ['iu-fab', `iu-fab--${this.size()}`, `iu-fab--${this.variant()}`];
    if (this.lowered()) c.push('iu-fab--lowered');
    if (this.label())   c.push('iu-fab--extended');
    return c.join(' ');
  });

  onClick(e: MouseEvent): void {
    this.clicked.emit(e);
  }
}
