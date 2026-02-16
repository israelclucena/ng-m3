import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../card/card.component';

/**
 * ActionCard — Card with prominent CTA, icon, and description.
 *
 * @example
 * ```html
 * <iu-action-card
 *   title="Create Project"
 *   description="Start a new project from scratch"
 *   icon="add_circle"
 *   actionLabel="Get Started"
 *   (actionClick)="onCreate()"
 * />
 * ```
 */
@Component({
  selector: 'iu-action-card',
  standalone: true,
  imports: [CommonModule, CardComponent],
  template: `
    <iu-card [variant]="cardVariant()" [fullWidth]="true" [clickable]="true" (cardClick)="actionClick.emit()">
      <div class="iu-action-card">
        @if (icon()) {
          <span class="iu-action-card__icon material-symbols-outlined">{{ icon() }}</span>
        }
        <div class="iu-action-card__content">
          <h3 class="iu-action-card__title">{{ title() }}</h3>
          @if (description()) {
            <p class="iu-action-card__description">{{ description() }}</p>
          }
        </div>
        @if (actionLabel()) {
          <span class="iu-action-card__action">{{ actionLabel() }}</span>
        }
      </div>
    </iu-card>
  `,
  styleUrl: './action-card.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionCardComponent {
  /** Card title */
  title = input.required<string>();
  /** Description text */
  description = input<string>('');
  /** Material icon name */
  icon = input<string>('');
  /** CTA button label */
  actionLabel = input<string>('');
  /** Card variant */
  cardVariant = input<'elevated' | 'filled' | 'outlined'>('outlined');
  /** Emitted when card or action is clicked */
  actionClick = output<void>();
}
