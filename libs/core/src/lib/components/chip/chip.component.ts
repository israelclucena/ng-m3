import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';

export type ChipVariant = 'assist' | 'filter' | 'input' | 'suggestion';

/**
 * IU Chip — Angular wrapper over @material/web chip components.
 *
 * Usage:
 *   <iu-chip variant="assist" label="Help"></iu-chip>
 *   <iu-chip variant="filter" label="Vegetarian" [selected]="true"></iu-chip>
 *   <iu-chip variant="input" label="John" [removable]="true"></iu-chip>
 *   <iu-chip variant="suggestion" label="Try this"></iu-chip>
 *
 * For chip sets, wrap in a <md-chip-set> or use iu-chip-set (coming soon).
 */
@Component({
  selector: 'iu-chip',
  standalone: true,
  templateUrl: './chip.component.html',
  styleUrl: './chip.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ChipComponent {
  // --- Inputs ---
  /** Chip variant */
  variant = input<ChipVariant>('assist');

  /** Chip label text */
  label = input<string>('');

  /** Elevated style */
  elevated = input<boolean>(false);

  /** Disabled state */
  disabled = input<boolean>(false);

  /** Selected state (filter chips) */
  selected = input<boolean>(false);

  /** Removable (input chips) */
  removable = input<boolean>(false);

  /** Leading icon (Material Symbols name) */
  icon = input<string>('');

  /** aria-label override */
  ariaLabel = input<string>('');

  // --- Outputs ---
  /** Emitted when chip is clicked */
  chipClick = output<void>();

  /** Emitted when chip selection changes (filter) */
  selectedChange = output<boolean>();

  /** Emitted when remove button is clicked (input) */
  removed = output<void>();

  // --- Computed ---
  hasIcon = computed(() => !!this.icon());

  hostClass = computed(() => {
    const c = ['iu-chip', `iu-chip--${this.variant()}`];
    if (this.elevated()) c.push('iu-chip--elevated');
    if (this.disabled()) c.push('iu-chip--disabled');
    if (this.selected()) c.push('iu-chip--selected');
    return c.join(' ');
  });

  onSelected(e: Event): void {
    const target = e.target as HTMLElement & { selected?: boolean };
    this.selectedChange.emit(target.selected ?? false);
  }

  onRemoved(): void {
    this.removed.emit();
  }

  onClick(): void {
    if (!this.disabled()) {
      this.chipClick.emit();
    }
  }
}
