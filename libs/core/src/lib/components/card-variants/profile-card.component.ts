import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../card/card.component';

/**
 * ProfileCard — User/entity profile display with avatar, name, role, and action.
 *
 * @example
 * ```html
 * <iu-profile-card
 *   name="Israel"
 *   role="Developer"
 *   avatarIcon="person"
 *   [stats]="[{label: 'Projects', value: '12'}, {label: 'Commits', value: '847'}]"
 * />
 * ```
 */
@Component({
  selector: 'iu-profile-card',
  standalone: true,
  imports: [CommonModule, CardComponent],
  template: `
    <iu-card [variant]="cardVariant()" [fullWidth]="true">
      <div class="iu-profile-card">
        <div class="iu-profile-card__avatar">
          @if (avatarUrl()) {
            <img [src]="avatarUrl()" [alt]="name()" class="iu-profile-card__avatar-img" />
          } @else {
            <span class="material-symbols-outlined">{{ avatarIcon() }}</span>
          }
        </div>
        <h3 class="iu-profile-card__name">{{ name() }}</h3>
        @if (role()) {
          <p class="iu-profile-card__role">{{ role() }}</p>
        }
        @if (stats().length > 0) {
          <div class="iu-profile-card__stats">
            @for (stat of stats(); track stat.label) {
              <div class="iu-profile-card__stat">
                <span class="iu-profile-card__stat-value">{{ stat.value }}</span>
                <span class="iu-profile-card__stat-label">{{ stat.label }}</span>
              </div>
            }
          </div>
        }
        <ng-content />
      </div>
    </iu-card>
  `,
  styleUrl: './profile-card.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileCardComponent {
  /** Display name */
  name = input.required<string>();
  /** Role or subtitle */
  role = input<string>('');
  /** Material icon for avatar fallback */
  avatarIcon = input<string>('person');
  /** Avatar image URL */
  avatarUrl = input<string>('');
  /** Stats to display below name */
  stats = input<{ label: string; value: string }[]>([]);
  /** Card variant */
  cardVariant = input<'elevated' | 'filled' | 'outlined'>('elevated');
}
