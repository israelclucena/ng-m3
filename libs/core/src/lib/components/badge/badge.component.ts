import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'small' | 'large';

/**
 * IU Badge — Custom M3 implementation.
 *
 * Usage:
 *   <iu-badge variant="small" />
 *   <iu-badge variant="large" value="3" />
 *   <div style="position: relative">
 *     <md-icon>mail</md-icon>
 *     <iu-badge value="12" />
 *   </div>
 */
@Component({
  selector: 'iu-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  /** Badge variant */
  variant = input<BadgeVariant>('large');

  /** Badge value (number or string) */
  value = input<number | string | undefined>(undefined);

  /** Whether the badge is visible */
  visible = input<boolean>(true);

  hostClass = computed(() => {
    const classes = ['iu-badge', `iu-badge--${this.variant()}`];
    if (!this.visible()) classes.push('iu-badge--hidden');
    return classes.join(' ');
  });

  displayValue = computed(() => {
    const v = this.value();
    if (this.variant() === 'small' || v === undefined) return '';
    if (typeof v === 'number' && v > 999) return '999+';
    return String(v);
  });
}
