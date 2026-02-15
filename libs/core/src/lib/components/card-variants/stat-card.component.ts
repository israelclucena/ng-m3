import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../card/card.component';

export type StatTrend = 'up' | 'down' | 'neutral';

/**
 * StatCard — Displays a key metric with trend indicator.
 *
 * Built on top of iu-card (elevated variant).
 *
 * @example
 * ```html
 * <iu-stat-card
 *   label="Monthly Revenue"
 *   value="€12,450"
 *   change="+8.3%"
 *   trend="up"
 *   icon="trending_up"
 * />
 * ```
 */
@Component({
  selector: 'iu-stat-card',
  standalone: true,
  imports: [CommonModule, CardComponent],
  template: `
    <iu-card [variant]="cardVariant()" [fullWidth]="true">
      <div class="iu-stat-card">
        @if (icon()) {
          <span class="iu-stat-card__icon material-symbols-outlined" [style.color]="iconColor()">
            {{ icon() }}
          </span>
        }
        <div class="iu-stat-card__content">
          <span class="iu-stat-card__label">{{ label() }}</span>
          <span class="iu-stat-card__value">{{ value() }}</span>
          @if (change()) {
            <span class="iu-stat-card__change" [class]="trendClass()">
              <span class="material-symbols-outlined iu-stat-card__trend-icon">{{ trendIcon() }}</span>
              {{ change() }}
            </span>
          }
        </div>
      </div>
    </iu-card>
  `,
  styleUrl: './stat-card.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCardComponent {
  /** Metric label */
  label = input.required<string>();
  /** Metric value (formatted string) */
  value = input.required<string>();
  /** Change text, e.g. "+8.3%" */
  change = input<string>('');
  /** Trend direction */
  trend = input<StatTrend>('neutral');
  /** Material icon name */
  icon = input<string>('');
  /** Icon color override */
  iconColor = input<string>('');
  /** Card variant */
  cardVariant = input<'elevated' | 'filled' | 'outlined'>('elevated');

  trendClass = computed(() => `iu-stat-card__change--${this.trend()}`);

  trendIcon = computed(() => {
    switch (this.trend()) {
      case 'up': return 'trending_up';
      case 'down': return 'trending_down';
      default: return 'trending_flat';
    }
  });
}
