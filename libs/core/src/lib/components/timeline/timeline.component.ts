import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TimelineItem {
  /** Primary text */
  title: string;
  /** Secondary/body text */
  description?: string;
  /** Timestamp or date string */
  date?: string;
  /** Material Symbols icon name */
  icon?: string;
  /** Color accent: 'primary' | 'success' | 'warning' | 'error' | hex color */
  color?: string;
  /** Whether this is the active/current item */
  active?: boolean;
}

export type TimelineOrientation = 'vertical' | 'horizontal';
export type TimelineAlign = 'start' | 'alternate' | 'end';

/**
 * Timeline — Displays a chronological list of events with connectors.
 *
 * Supports vertical/horizontal orientation and left/right/alternate alignment.
 * Uses M3 design tokens. No external dependencies.
 *
 * @example
 * ```html
 * <iu-timeline
 *   [items]="events"
 *   orientation="vertical"
 *   align="alternate"
 * />
 * ```
 */
@Component({
  selector: 'iu-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="iu-timeline"
      [class.iu-timeline--vertical]="orientation() === 'vertical'"
      [class.iu-timeline--horizontal]="orientation() === 'horizontal'"
      [class]="'iu-timeline--' + orientation() + ' iu-timeline--align-' + align()"
      role="list"
    >
      @for (item of items(); track item.title; let i = $index; let last = $last) {
        <div
          class="iu-timeline__item"
          [class.iu-timeline__item--active]="item.active"
          [class.iu-timeline__item--last]="last"
          role="listitem"
        >
          <!-- Left/top content (alternate mode) -->
          @if (align() === 'alternate' && i % 2 !== 0 && orientation() === 'vertical') {
            <div class="iu-timeline__content iu-timeline__content--opposite">
              <ng-container [ngTemplateOutlet]="contentTpl" [ngTemplateOutletContext]="{item}" />
            </div>
          } @else {
            <div class="iu-timeline__content--spacer"></div>
          }

          <!-- Spine: connector + dot -->
          <div class="iu-timeline__spine">
            @if (!isFirst(i)) {
              <div class="iu-timeline__connector iu-timeline__connector--before"
                   [class.iu-timeline__connector--active]="item.active"></div>
            }
            <div
              class="iu-timeline__dot"
              [class.iu-timeline__dot--active]="item.active"
              [style.background-color]="resolveColor(item)"
            >
              @if (item.icon) {
                <span class="material-symbols-outlined">{{ item.icon }}</span>
              }
            </div>
            @if (!last) {
              <div class="iu-timeline__connector iu-timeline__connector--after"></div>
            }
          </div>

          <!-- Right/bottom content -->
          @if (align() !== 'alternate' || i % 2 === 0 || orientation() === 'horizontal') {
            <div class="iu-timeline__content">
              <ng-container [ngTemplateOutlet]="contentTpl" [ngTemplateOutletContext]="{item}" />
            </div>
          } @else {
            <div class="iu-timeline__content--spacer"></div>
          }
        </div>
      }
    </div>

    <ng-template #contentTpl let-item="item">
      <div class="iu-timeline__card" [class.iu-timeline__card--active]="item.active">
        @if (item.date) {
          <span class="iu-timeline__date">{{ item.date }}</span>
        }
        <h4 class="iu-timeline__title">{{ item.title }}</h4>
        @if (item.description) {
          <p class="iu-timeline__desc">{{ item.description }}</p>
        }
      </div>
    </ng-template>
  `,
  styles: [`
    :host { display: block; }

    .iu-timeline {
      display: flex;

      &--vertical {
        flex-direction: column;
      }

      &--horizontal {
        flex-direction: row;
        overflow-x: auto;
      }
    }

    /* ── Item ── */
    .iu-timeline__item {
      display: flex;
      flex: 1;

      .iu-timeline--vertical & {
        flex-direction: row;
        align-items: stretch;
        gap: 16px;
        min-height: 60px;
      }

      .iu-timeline--horizontal & {
        flex-direction: column;
        align-items: center;
        gap: 8px;
        min-width: 140px;
      }
    }

    /* ── Spine ── */
    .iu-timeline__spine {
      display: flex;
      align-items: center;
      flex-shrink: 0;

      .iu-timeline--vertical & {
        flex-direction: column;
        width: 32px;
      }

      .iu-timeline--horizontal & {
        flex-direction: row;
        height: 32px;
        width: 100%;
        justify-content: center;
      }
    }

    /* ── Dot ── */
    .iu-timeline__dot {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--md-sys-color-outline-variant, #cac4d0);
      color: var(--md-sys-color-on-primary, #fff);
      transition: background 0.2s, transform 0.2s;
      z-index: 1;

      .material-symbols-outlined { font-size: 16px; }

      &--active {
        background: var(--md-sys-color-primary, #6750a4) !important;
        box-shadow: 0 0 0 4px var(--md-sys-color-primary-container, #eaddff);
        transform: scale(1.1);
      }
    }

    /* ── Connector ── */
    .iu-timeline__connector {
      background: var(--md-sys-color-outline-variant, #cac4d0);
      flex: 1;

      .iu-timeline--vertical & {
        width: 2px;
        min-height: 16px;
      }

      .iu-timeline--horizontal & {
        height: 2px;
        min-width: 16px;
      }

      &--active {
        background: var(--md-sys-color-primary, #6750a4);
      }
    }

    /* ── Content ── */
    .iu-timeline__content {
      flex: 1;
      padding-bottom: 24px;

      .iu-timeline--horizontal & {
        padding-bottom: 0;
        text-align: center;
      }
    }

    .iu-timeline__content--spacer {
      flex: 1;
    }

    .iu-timeline__content--opposite {
      flex: 1;
      padding-bottom: 24px;
      text-align: right;
    }

    /* ── Card ── */
    .iu-timeline__card {
      padding: 12px 16px;
      border-radius: 12px;
      background: var(--md-sys-color-surface-container, #f3edf7);
      border: 1px solid transparent;
      transition: border-color 0.2s, background 0.2s;

      &--active {
        border-color: var(--md-sys-color-primary, #6750a4);
        background: var(--md-sys-color-primary-container, #eaddff);
      }

      .iu-timeline--horizontal & {
        text-align: center;
      }
    }

    .iu-timeline__date {
      display: block;
      font-size: 11px;
      font-weight: 500;
      color: var(--md-sys-color-primary, #6750a4);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 4px;
    }

    .iu-timeline__title {
      font-size: 14px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      margin: 0 0 4px;
    }

    .iu-timeline__desc {
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin: 0;
      line-height: 1.5;
    }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineComponent {
  /** Timeline items to display */
  items = input<TimelineItem[]>([]);
  /** Layout direction */
  orientation = input<TimelineOrientation>('vertical');
  /** Content alignment (vertical only) */
  align = input<TimelineAlign>('start');

  /** @internal */
  isFirst(index: number): boolean { return index === 0; }

  /** @internal — resolves color token or raw CSS value */
  resolveColor(item: TimelineItem): string | null {
    if (!item.color) return null;
    const map: Record<string, string> = {
      primary: 'var(--md-sys-color-primary, #6750a4)',
      success: '#4caf50',
      warning: '#ff9800',
      error: 'var(--md-sys-color-error, #b3261e)',
    };
    return map[item.color] ?? item.color;
  }
}
