import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyReview, RatingSummary, StarRating } from './reviews.types';
import { RatingDisplayComponent } from './rating-display.component';
import { ReviewCardComponent } from './review-card.component';

// ─── Helpers ─────────────────────────────────────────────────────────────────

type SortOption = 'recent' | 'highest' | 'lowest';

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * PropertyReviews — full reviews section for a LisboaRent property.
 *
 * Renders a rating summary bar (average + breakdown per star level),
 * sort controls, and a paginated list of ReviewCards.
 * Pure Signals — no RxJS.
 *
 * Feature flag: `REVIEWS_MODULE`
 *
 * @example
 * ```html
 * <iu-property-reviews
 *   [reviews]="property.reviews"
 *   [propertyTitle]="property.title"
 * />
 * ```
 */
@Component({
  selector: 'iu-property-reviews',
  standalone: true,
  imports: [CommonModule, RatingDisplayComponent, ReviewCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="iu-property-reviews">
      <!-- Header -->
      <div class="iu-property-reviews__header">
        <h3 class="iu-property-reviews__title">
          Avaliações
          @if (summary().total > 0) {
            <span class="iu-property-reviews__count">({{ summary().total }})</span>
          }
        </h3>
      </div>

      @if (reviews().length === 0) {
        <!-- Empty state -->
        <div class="iu-property-reviews__empty">
          <span class="material-symbols-outlined">rate_review</span>
          <p>Ainda não há avaliações para esta propriedade.</p>
          <span>Seja o primeiro a avaliar!</span>
        </div>
      } @else {
        <!-- Summary panel -->
        <div class="iu-property-reviews__summary">
          <div class="iu-property-reviews__average">
            <span class="iu-property-reviews__avg-number">{{ summary().average | number:'1.1-1' }}</span>
            <iu-rating-display [rating]="summary().average" [count]="summary().total" size="lg" />
          </div>

          <!-- Breakdown bars -->
          <div class="iu-property-reviews__breakdown">
            @for (star of [5, 4, 3, 2, 1]; track star) {
              <div class="iu-property-reviews__bar-row">
                <span class="iu-property-reviews__bar-label">{{ star }}</span>
                <span class="material-symbols-outlined iu-property-reviews__bar-star">star</span>
                <div class="iu-property-reviews__bar-track">
                  <div
                    class="iu-property-reviews__bar-fill"
                    [style.width.%]="barWidth(star)"
                  ></div>
                </div>
                <span class="iu-property-reviews__bar-count">{{ barCount(star) }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Sort controls -->
        <div class="iu-property-reviews__controls">
          <span class="iu-property-reviews__controls-label">Ordenar:</span>
          @for (opt of sortOptions; track opt.value) {
            <button
              class="iu-property-reviews__sort-btn"
              [class.iu-property-reviews__sort-btn--active]="sortBy() === opt.value"
              (click)="sortBy.set(opt.value)"
              type="button"
            >{{ opt.label }}</button>
          }
        </div>

        <!-- Review list -->
        <div class="iu-property-reviews__list">
          @for (review of visibleReviews(); track review.id) {
            <iu-review-card [review]="review" />
          }
        </div>

        <!-- Load more -->
        @if (hasMore()) {
          <button class="iu-property-reviews__load-more" (click)="loadMore()" type="button">
            <span class="material-symbols-outlined">expand_more</span>
            Ver mais {{ remaining() }} avaliação(ões)
          </button>
        }
      }
    </section>
  `,
  styles: [`
    .iu-property-reviews {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* ── Header ── */
    .iu-property-reviews__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .iu-property-reviews__title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .iu-property-reviews__count {
      font-size: 16px;
      font-weight: 400;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    /* ── Empty state ── */
    .iu-property-reviews__empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 48px 24px;
      text-align: center;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .iu-property-reviews__empty .material-symbols-outlined {
      font-size: 48px;
      color: var(--md-sys-color-outline, #79747e);
    }

    .iu-property-reviews__empty p {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }

    .iu-property-reviews__empty span {
      font-size: 13px;
    }

    /* ── Summary ── */
    .iu-property-reviews__summary {
      display: flex;
      gap: 32px;
      padding: 20px;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 16px;
      flex-wrap: wrap;
    }

    .iu-property-reviews__average {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      min-width: 120px;
    }

    .iu-property-reviews__avg-number {
      font-size: 48px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      line-height: 1;
    }

    /* ── Breakdown bars ── */
    .iu-property-reviews__breakdown {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
      justify-content: center;
      min-width: 180px;
    }

    .iu-property-reviews__bar-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .iu-property-reviews__bar-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      width: 8px;
      text-align: right;
    }

    .iu-property-reviews__bar-star {
      font-size: 14px;
      color: #f59e0b;
      font-variation-settings: 'FILL' 1;
    }

    .iu-property-reviews__bar-track {
      flex: 1;
      height: 8px;
      background: var(--md-sys-color-surface-variant, #e7e0ec);
      border-radius: 4px;
      overflow: hidden;
    }

    .iu-property-reviews__bar-fill {
      height: 100%;
      background: #f59e0b;
      border-radius: 4px;
      transition: width 600ms var(--md-sys-motion-easing-standard, cubic-bezier(0.2,0,0,1));
    }

    .iu-property-reviews__bar-count {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      width: 20px;
      text-align: right;
    }

    /* ── Controls ── */
    .iu-property-reviews__controls {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .iu-property-reviews__controls-label {
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .iu-property-reviews__sort-btn {
      padding: 6px 14px;
      border: 1.5px solid var(--md-sys-color-outline, #79747e);
      border-radius: 20px;
      background: transparent;
      cursor: pointer;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      transition: background 150ms, color 150ms, border-color 150ms;
    }

    .iu-property-reviews__sort-btn:hover {
      background: var(--md-sys-color-surface-container, #f3edf7);
    }

    .iu-property-reviews__sort-btn--active {
      background: var(--md-sys-color-secondary-container, #e8def8);
      border-color: var(--md-sys-color-secondary, #625b71);
      color: var(--md-sys-color-on-secondary-container, #1d192b);
      font-weight: 600;
    }

    /* ── Review list ── */
    .iu-property-reviews__list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* ── Load more ── */
    .iu-property-reviews__load-more {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      padding: 14px;
      border: 1.5px dashed var(--md-sys-color-outline-variant, #cac4d0);
      border-radius: 12px;
      background: transparent;
      cursor: pointer;
      font-size: 14px;
      color: var(--md-sys-color-primary, #6750a4);
      font-weight: 500;
      transition: background 150ms;
    }

    .iu-property-reviews__load-more:hover {
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
    }

    .iu-property-reviews__load-more .material-symbols-outlined {
      font-size: 20px;
    }
  `],
})
export class PropertyReviewsComponent {
  /** Reviews to display */
  readonly reviews = input.required<PropertyReview[]>();

  /** Optional property title for aria context */
  readonly propertyTitle = input('');

  /** How many reviews to show per page */
  readonly pageSize = input(5);

  // ─── Internal state ─────────────────────────────────────────────────────────
  readonly sortBy = signal<SortOption>('recent');
  private readonly _page = signal(1);

  readonly sortOptions: Array<{ value: SortOption; label: string }> = [
    { value: 'recent', label: 'Mais recentes' },
    { value: 'highest', label: 'Melhor nota' },
    { value: 'lowest', label: 'Pior nota' },
  ];

  // ─── Derived ────────────────────────────────────────────────────────────────

  /** Computed rating summary (average + breakdown) */
  readonly summary = computed<RatingSummary>(() => {
    const all = this.reviews();
    if (all.length === 0) {
      return { average: 0, total: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    }
    const breakdown: Record<StarRating, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    for (const r of all) {
      breakdown[r.rating] = (breakdown[r.rating] ?? 0) + 1;
      sum += r.rating;
    }
    return { average: sum / all.length, total: all.length, breakdown };
  });

  readonly sorted = computed<PropertyReview[]>(() => {
    const all = [...this.reviews()];
    switch (this.sortBy()) {
      case 'highest': return all.sort((a, b) => b.rating - a.rating);
      case 'lowest':  return all.sort((a, b) => a.rating - b.rating);
      default:        return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  });

  readonly visibleReviews = computed(() => this.sorted().slice(0, this._page() * this.pageSize()));
  readonly hasMore = computed(() => this.visibleReviews().length < this.reviews().length);
  readonly remaining = computed(() => this.reviews().length - this.visibleReviews().length);

  loadMore(): void {
    this._page.update(p => p + 1);
  }

  /**
   * Returns the % fill for a star-level bar in the breakdown.
   * @param star Star level (1–5)
   */
  barWidth(star: number): number {
    const total = this.summary().total;
    if (total === 0) return 0;
    const count = this.barCount(star);
    return Math.round((count / total) * 100);
  }

  /**
   * Returns the review count for a given star level.
   * @param star Star level (1–5)
   */
  barCount(star: number): number {
    const breakdown = this.summary().breakdown;
    return breakdown[star as StarRating] ?? 0;
  }
}
