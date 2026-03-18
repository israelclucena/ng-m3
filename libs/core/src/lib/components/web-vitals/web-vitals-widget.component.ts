/**
 * @fileoverview WebVitalsWidget — Core Web Vitals dashboard panel.
 *
 * Displays LCP, CLS, INP and TTFB metrics with M3 colour-coded rating badges.
 * Uses `WebVitalsService` internally (provided at root).
 *
 * Rating colours:
 *   🟢 good            → md-sys-color-tertiary-container
 *   🟡 needs-improvement → warning amber
 *   🔴 poor            → md-sys-color-error-container
 *   ⚪ pending         → md-sys-color-surface-variant
 *
 * Feature flag: `WEB_VITALS`
 *
 * @example
 * ```html
 * <iu-web-vitals-widget />
 * ```
 */
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  WebVitalsService,
  VitalMetric,
  VitalRating,
} from '../../services/web-vitals.service';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VitalTile {
  metric: VitalMetric;
  description: string;
  icon: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * WebVitalsWidget — compact panel showing Core Web Vitals ratings.
 * Feature flag: `WEB_VITALS`
 */
@Component({
  selector: 'iu-web-vitals-widget',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="iu-wv-widget">
      <!-- Header -->
      <div class="iu-wv-widget__header">
        <span class="material-symbols-outlined iu-wv-widget__header-icon" aria-hidden="true">speed</span>
        <h3 class="iu-wv-widget__title">{{ title() }}</h3>
        <span
          class="iu-wv-widget__overall"
          [attr.data-rating]="summary().overallRating"
          [title]="'Overall: ' + summary().overallRating"
        >
          {{ ratingLabel(summary().overallRating) }}
        </span>
      </div>

      <!-- Metric tiles -->
      <div class="iu-wv-widget__grid">
        @for (tile of tiles(); track tile.metric.name) {
          <div
            class="iu-wv-tile"
            [attr.data-rating]="tile.metric.rating"
            [title]="tile.description"
          >
            <div class="iu-wv-tile__top">
              <span class="material-symbols-outlined iu-wv-tile__icon" aria-hidden="true">{{ tile.icon }}</span>
              <span class="iu-wv-tile__name">{{ tile.metric.name }}</span>
              <span class="iu-wv-tile__badge" [attr.data-rating]="tile.metric.rating">
                {{ ratingEmoji(tile.metric.rating) }}
              </span>
            </div>
            <div class="iu-wv-tile__value">
              {{ tile.metric.displayValue }}
              @if (tile.metric.unit) {
                <span class="iu-wv-tile__unit">{{ tile.metric.unit }}</span>
              }
            </div>
            <div class="iu-wv-tile__desc">{{ tile.description }}</div>
            <div class="iu-wv-tile__threshold">
              Good: {{ goodThreshold(tile.metric.name) }}
            </div>
          </div>
        }
      </div>

      <!-- Legend -->
      <div class="iu-wv-widget__legend">
        @for (entry of LEGEND; track entry.rating) {
          <span class="iu-wv-legend-item" [attr.data-rating]="entry.rating">
            {{ entry.emoji }} {{ entry.label }}
          </span>
        }
      </div>
    </div>
  `,
  styles: [`
    /* ── Widget shell ── */
    .iu-wv-widget {
      background: var(--md-sys-color-surface-container, #f3eff4);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      font-family: var(--md-sys-typescale-body-medium-font, Roboto, sans-serif);
    }

    /* ── Header ── */
    .iu-wv-widget__header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .iu-wv-widget__header-icon {
      font-size: 22px;
      color: var(--md-sys-color-primary, #6750a4);
    }

    .iu-wv-widget__title {
      margin: 0;
      font-family: var(--md-sys-typescale-title-medium-font, Roboto, sans-serif);
      font-size: var(--md-sys-typescale-title-medium-size, 1rem);
      font-weight: 500;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      flex: 1;
    }

    .iu-wv-widget__overall {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 2px 10px;
      border-radius: 12px;
      text-transform: capitalize;
    }

    /* ── Metric grid ── */
    .iu-wv-widget__grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
    }

    /* ── Metric tile ── */
    .iu-wv-tile {
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      transition: transform 0.15s;
    }

    .iu-wv-tile:hover {
      transform: translateY(-2px);
    }

    .iu-wv-tile__top {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .iu-wv-tile__icon {
      font-size: 16px;
    }

    .iu-wv-tile__name {
      font-family: var(--md-sys-typescale-label-large-font, Roboto, sans-serif);
      font-size: var(--md-sys-typescale-label-large-size, 0.875rem);
      font-weight: 600;
      flex: 1;
    }

    .iu-wv-tile__badge {
      font-size: 14px;
    }

    .iu-wv-tile__value {
      font-family: var(--md-sys-typescale-display-small-font, Roboto, sans-serif);
      font-size: 1.75rem;
      font-weight: 700;
      line-height: 1;
      margin: 4px 0 2px;
    }

    .iu-wv-tile__unit {
      font-size: 0.875rem;
      font-weight: 400;
    }

    .iu-wv-tile__desc {
      font-size: 0.6875rem;
      opacity: 0.8;
    }

    .iu-wv-tile__threshold {
      font-size: 0.625rem;
      opacity: 0.6;
      margin-top: 2px;
    }

    /* ── Rating colours ── */
    [data-rating="good"] {
      background: var(--md-sys-color-tertiary-container, #ffd8e4);
      color: var(--md-sys-color-on-tertiary-container, #31111d);
    }

    /* Override tertiary for good → use a green tone */
    .iu-wv-tile[data-rating="good"] {
      background: #d4edda;
      color: #155724;
    }

    .iu-wv-tile[data-rating="needs-improvement"] {
      background: #fff3cd;
      color: #856404;
    }

    .iu-wv-tile[data-rating="poor"] {
      background: var(--md-sys-color-error-container, #f9dedc);
      color: var(--md-sys-color-on-error-container, #410e0b);
    }

    .iu-wv-tile[data-rating="pending"] {
      background: var(--md-sys-color-surface-variant, #e7e0ec);
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .iu-wv-widget__overall[data-rating="good"]             { background: #d4edda; color: #155724; }
    .iu-wv-widget__overall[data-rating="needs-improvement"]{ background: #fff3cd; color: #856404; }
    .iu-wv-widget__overall[data-rating="poor"]             { background: var(--md-sys-color-error-container, #f9dedc); color: var(--md-sys-color-on-error-container, #410e0b); }
    .iu-wv-widget__overall[data-rating="pending"]          { background: var(--md-sys-color-surface-variant, #e7e0ec); color: var(--md-sys-color-on-surface-variant, #49454f); }

    /* ── Legend ── */
    .iu-wv-widget__legend {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .iu-wv-legend-item {
      font-size: 0.6875rem;
      padding: 2px 8px;
      border-radius: 8px;
    }

    .iu-wv-legend-item[data-rating="good"]              { background: #d4edda; color: #155724; }
    .iu-wv-legend-item[data-rating="needs-improvement"] { background: #fff3cd; color: #856404; }
    .iu-wv-legend-item[data-rating="poor"]              { background: var(--md-sys-color-error-container, #f9dedc); color: var(--md-sys-color-on-error-container, #410e0b); }
    .iu-wv-legend-item[data-rating="pending"]           { background: var(--md-sys-color-surface-variant, #e7e0ec); color: var(--md-sys-color-on-surface-variant, #49454f); }
  `],
})
export class WebVitalsWidgetComponent {
  private readonly _vitals = inject(WebVitalsService);

  /** Panel title */
  title = input<string>('Core Web Vitals');

  /** Expose summary signal */
  readonly summary = this._vitals.summary;

  /** Legend entries */
  readonly LEGEND = [
    { rating: 'good' as VitalRating,               emoji: '🟢', label: 'Good' },
    { rating: 'needs-improvement' as VitalRating,  emoji: '🟡', label: 'Needs improvement' },
    { rating: 'poor' as VitalRating,               emoji: '🔴', label: 'Poor' },
    { rating: 'pending' as VitalRating,            emoji: '⚪', label: 'Pending' },
  ];

  /** Tiles derived from summary */
  readonly tiles = computed<VitalTile[]>(() => {
    const s = this.summary();
    return [
      { metric: s.lcp,  description: 'Largest Contentful Paint',    icon: 'image' },
      { metric: s.cls,  description: 'Cumulative Layout Shift',      icon: 'swap_vert' },
      { metric: s.inp,  description: 'Interaction to Next Paint',    icon: 'touch_app' },
      { metric: s.ttfb, description: 'Time to First Byte',           icon: 'timer' },
    ];
  });

  /** Human label for rating */
  ratingLabel(r: VitalRating): string {
    const map: Record<VitalRating, string> = {
      'good': 'Good',
      'needs-improvement': 'Needs work',
      'poor': 'Poor',
      'pending': 'Measuring…',
    };
    return map[r];
  }

  /** Emoji for rating */
  ratingEmoji(r: VitalRating): string {
    const map: Record<VitalRating, string> = {
      'good': '🟢',
      'needs-improvement': '🟡',
      'poor': '🔴',
      'pending': '⚪',
    };
    return map[r];
  }

  /** Good threshold label per metric */
  goodThreshold(name: VitalMetric['name']): string {
    const map: Record<VitalMetric['name'], string> = {
      LCP:  '<2.5s',
      CLS:  '<0.1',
      INP:  '<200ms',
      TTFB: '<800ms',
      FID:  '<100ms',
    };
    return map[name];
  }
}
