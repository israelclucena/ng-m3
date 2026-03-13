import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { StarRating } from './reviews.types';

/**
 * RatingDisplay — compact star rating widget for LisboaRent.
 *
 * Renders 1–5 filled/half/empty stars with an optional numeric label.
 * Pure display component — no interaction.
 *
 * Feature flag: `REVIEWS_MODULE`
 *
 * @example
 * ```html
 * <iu-rating-display [rating]="4.5" [count]="28" />
 * ```
 */
@Component({
  selector: 'iu-rating-display',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="iu-rating" [class]="'iu-rating--' + size()">
      <!-- Stars -->
      <div class="iu-rating__stars" [attr.aria-label]="ariaLabel()">
        @for (star of stars(); track $index) {
          <span class="material-symbols-outlined iu-rating__star"
            [class.iu-rating__star--filled]="star === 'full'"
            [class.iu-rating__star--half]="star === 'half'"
            [class.iu-rating__star--empty]="star === 'empty'"
          >
            {{ star === 'full' ? 'star' : star === 'half' ? 'star_half' : 'star_outline' }}
          </span>
        }
      </div>

      <!-- Numeric label -->
      @if (showLabel()) {
        <span class="iu-rating__label">
          {{ rating() | number:'1.1-1' }}
          @if (count() !== null) {
            <span class="iu-rating__count">({{ count() }})</span>
          }
        </span>
      }
    </div>
  `,
  styles: [`
    .iu-rating {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .iu-rating__stars {
      display: flex;
      align-items: center;
    }

    .iu-rating__star {
      color: var(--md-sys-color-outline-variant, #cac4d0);
      transition: color 150ms;
      font-variation-settings: 'FILL' 0;
    }

    .iu-rating__star--filled {
      color: #f59e0b;
      font-variation-settings: 'FILL' 1;
    }

    .iu-rating__star--half {
      color: #f59e0b;
    }

    .iu-rating__star--empty {
      color: var(--md-sys-color-outline-variant, #cac4d0);
    }

    /* Sizes */
    .iu-rating--sm .iu-rating__star { font-size: 16px; }
    .iu-rating--md .iu-rating__star { font-size: 20px; }
    .iu-rating--lg .iu-rating__star { font-size: 28px; }

    .iu-rating__label {
      font-size: 14px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .iu-rating--sm .iu-rating__label { font-size: 12px; }
    .iu-rating--lg .iu-rating__label { font-size: 18px; }

    .iu-rating__count {
      font-weight: 400;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
  `],
})
export class RatingDisplayComponent {
  /** Numeric rating value (0–5, supports decimals) */
  readonly rating = input.required<number>();

  /** Optional count of reviews to show in parentheses */
  readonly count = input<number | null>(null);

  /** Display size */
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  /** Whether to show the numeric label next to stars */
  readonly showLabel = input(true);

  /** Derived star fill state for each of the 5 stars */
  readonly stars = computed<Array<'full' | 'half' | 'empty'>>(() => {
    const r = Math.max(0, Math.min(5, this.rating()));
    return [1, 2, 3, 4, 5].map(i => {
      if (r >= i) return 'full';
      if (r >= i - 0.5) return 'half';
      return 'empty';
    });
  });

  readonly ariaLabel = computed(() => {
    const r = this.rating().toFixed(1);
    const c = this.count();
    return c !== null ? `${r} de 5 estrelas, ${c} avaliações` : `${r} de 5 estrelas`;
  });
}
