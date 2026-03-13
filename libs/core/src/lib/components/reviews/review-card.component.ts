import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyReview } from './reviews.types';
import { RatingDisplayComponent } from './rating-display.component';

/**
 * ReviewCard — single property review card for LisboaRent.
 *
 * Displays reviewer avatar (or initials fallback), name, star rating,
 * verified badge, review body with expand/collapse for long text,
 * date, and optional landlord reply.
 *
 * Feature flag: `REVIEWS_MODULE`
 *
 * @example
 * ```html
 * <iu-review-card [review]="review" />
 * ```
 */
@Component({
  selector: 'iu-review-card',
  standalone: true,
  imports: [CommonModule, RatingDisplayComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <article class="iu-review-card" [class.iu-review-card--expanded]="isExpanded()">
      <!-- Header -->
      <div class="iu-review-card__header">
        <!-- Avatar -->
        <div class="iu-review-card__avatar">
          @if (review().authorAvatarUrl) {
            <img [src]="review().authorAvatarUrl" [alt]="review().authorName" />
          } @else {
            <span>{{ initials() }}</span>
          }
        </div>

        <!-- Meta -->
        <div class="iu-review-card__meta">
          <div class="iu-review-card__name-row">
            <span class="iu-review-card__name">{{ review().authorName }}</span>
            @if (review().verified) {
              <span class="iu-review-card__verified" title="Arrendamento verificado">
                <span class="material-symbols-outlined">verified</span>
                Verificado
              </span>
            }
          </div>
          <div class="iu-review-card__rating-row">
            <iu-rating-display [rating]="review().rating" [showLabel]="false" size="sm" />
            <span class="iu-review-card__date">{{ formattedDate() }}</span>
          </div>
        </div>
      </div>

      <!-- Body -->
      <div class="iu-review-card__body" [class.iu-review-card__body--clamped]="!isExpanded() && isLong()">
        {{ review().body }}
      </div>

      @if (isLong()) {
        <button class="iu-review-card__toggle" (click)="isExpanded.set(!isExpanded())" type="button">
          {{ isExpanded() ? 'Mostrar menos' : 'Ler mais' }}
          <span class="material-symbols-outlined">{{ isExpanded() ? 'expand_less' : 'expand_more' }}</span>
        </button>
      }

      <!-- Landlord reply -->
      @if (review().landlordReply) {
        <div class="iu-review-card__reply">
          <div class="iu-review-card__reply-header">
            <span class="material-symbols-outlined">reply</span>
            <span>Resposta do senhorio</span>
          </div>
          <p class="iu-review-card__reply-body">{{ review().landlordReply }}</p>
        </div>
      }
    </article>
  `,
  styles: [`
    .iu-review-card {
      padding: 16px;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* ── Header ── */
    .iu-review-card__header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .iu-review-card__avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
      flex-shrink: 0;
      overflow: hidden;
    }

    .iu-review-card__avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .iu-review-card__meta {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .iu-review-card__name-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .iu-review-card__name {
      font-size: 14px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .iu-review-card__verified {
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 11px;
      font-weight: 500;
      color: var(--md-sys-color-primary, #6750a4);
    }

    .iu-review-card__verified .material-symbols-outlined {
      font-size: 14px;
    }

    .iu-review-card__rating-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .iu-review-card__date {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    /* ── Body ── */
    .iu-review-card__body {
      font-size: 14px;
      line-height: 1.6;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .iu-review-card__body--clamped {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* ── Toggle ── */
    .iu-review-card__toggle {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: var(--md-sys-color-primary, #6750a4);
      padding: 0;
    }

    .iu-review-card__toggle .material-symbols-outlined {
      font-size: 16px;
    }

    /* ── Landlord reply ── */
    .iu-review-card__reply {
      padding: 12px 14px;
      background: var(--md-sys-color-surface-container, #f3edf7);
      border-left: 3px solid var(--md-sys-color-primary, #6750a4);
      border-radius: 0 8px 8px 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .iu-review-card__reply-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--md-sys-color-primary, #6750a4);
    }

    .iu-review-card__reply-header .material-symbols-outlined {
      font-size: 16px;
    }

    .iu-review-card__reply-body {
      font-size: 13px;
      line-height: 1.5;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin: 0;
    }
  `],
})
export class ReviewCardComponent {
  /** Review data to display */
  readonly review = input.required<PropertyReview>();

  readonly isExpanded = signal(false);

  readonly initials = computed(() => {
    const name = this.review().authorName;
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  });

  readonly isLong = computed(() => this.review().body.length > 200);

  readonly formattedDate = computed(() => {
    try {
      return new Date(this.review().date).toLocaleDateString('pt-PT', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch {
      return this.review().date;
    }
  });
}
