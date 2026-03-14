import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { OccupancySummary } from './landlord-analytics.types';

/**
 * `iu-occupancy-chart` — Bar chart showing monthly occupancy rate for a property.
 *
 * Pure SVG, no external chart libraries. M3 colour tokens throughout.
 * Feature flag: `LANDLORD_ANALYTICS`
 *
 * @example
 * ```html
 * <iu-occupancy-chart [summary]="occupancySummary" />
 * ```
 */
@Component({
  selector: 'iu-occupancy-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="iu-occ-chart">
      <div class="iu-occ-chart__header">
        <div>
          <h3 class="iu-occ-chart__title">Taxa de Ocupação</h3>
          <p class="iu-occ-chart__subtitle">{{ summary().propertyTitle }}</p>
        </div>
        <div class="iu-occ-chart__avg-badge">
          <span class="iu-occ-chart__avg-value">{{ summary().yearlyAverage }}%</span>
          <span class="iu-occ-chart__avg-label">média anual</span>
        </div>
      </div>

      <!-- SVG bar chart -->
      <div class="iu-occ-chart__chart-wrap" role="img" [attr.aria-label]="chartAriaLabel()">
        <svg
          class="iu-occ-chart__svg"
          viewBox="0 0 540 160"
          preserveAspectRatio="none"
        >
          <!-- Grid lines -->
          @for (pct of [0, 25, 50, 75, 100]; track pct) {
            <line
              [attr.x1]="40"
              [attr.y1]="gridY(pct)"
              [attr.x2]="532"
              [attr.y2]="gridY(pct)"
              stroke="var(--md-sys-color-outline-variant, #ccc)"
              stroke-width="0.5"
              stroke-dasharray="3,3"
            />
            <text
              [attr.x]="36"
              [attr.y]="gridY(pct) + 4"
              text-anchor="end"
              font-size="9"
              fill="var(--md-sys-color-on-surface-variant, #666)"
            >{{ pct }}%</text>
          }

          <!-- Bars -->
          @for (bar of bars(); track bar.month; let i = $index) {
            <rect
              [attr.x]="bar.x"
              [attr.y]="bar.y"
              [attr.width]="bar.w"
              [attr.height]="bar.h"
              [attr.fill]="bar.occupied ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-variant)'"
              rx="3"
              class="iu-occ-chart__bar"
            >
              <title>{{ bar.month }}: {{ bar.rate }}%</title>
            </rect>

            <!-- Month label -->
            <text
              [attr.x]="bar.x + bar.w / 2"
              y="156"
              text-anchor="middle"
              font-size="9"
              fill="var(--md-sys-color-on-surface-variant, #666)"
            >{{ bar.month }}</text>

            <!-- Rate label above bar -->
            @if (bar.h > 12) {
              <text
                [attr.x]="bar.x + bar.w / 2"
                [attr.y]="bar.y - 3"
                text-anchor="middle"
                font-size="8"
                fill="var(--md-sys-color-on-surface-variant, #666)"
              >{{ bar.rate }}%</text>
            }
          }
        </svg>
      </div>

      <!-- Legend -->
      <div class="iu-occ-chart__legend">
        <span class="iu-occ-chart__legend-item iu-occ-chart__legend-item--occupied">Ocupado</span>
        <span class="iu-occ-chart__legend-item iu-occ-chart__legend-item--vacant">Vago</span>
      </div>
    </div>
  `,
  styles: [`
    .iu-occ-chart {
      padding: 20px;
      background: var(--md-sys-color-surface-container-low);
      border-radius: 16px;
      font-family: var(--md-sys-typescale-body-medium-font, sans-serif);
    }
    .iu-occ-chart__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }
    .iu-occ-chart__title {
      margin: 0 0 2px;
      font-size: 15px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
    }
    .iu-occ-chart__subtitle {
      margin: 0;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
    }
    .iu-occ-chart__avg-badge {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .iu-occ-chart__avg-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--md-sys-color-primary);
    }
    .iu-occ-chart__avg-label {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant);
    }
    .iu-occ-chart__chart-wrap {
      width: 100%;
      overflow: hidden;
    }
    .iu-occ-chart__svg {
      width: 100%;
      height: 160px;
      display: block;
    }
    .iu-occ-chart__bar {
      transition: opacity 0.15s;
      cursor: pointer;
    }
    .iu-occ-chart__bar:hover { opacity: 0.75; }
    .iu-occ-chart__legend {
      display: flex;
      gap: 16px;
      justify-content: flex-end;
      margin-top: 8px;
    }
    .iu-occ-chart__legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant);
    }
    .iu-occ-chart__legend-item::before {
      content: '';
      width: 10px;
      height: 10px;
      border-radius: 2px;
    }
    .iu-occ-chart__legend-item--occupied::before { background: var(--md-sys-color-primary); }
    .iu-occ-chart__legend-item--vacant::before { background: var(--md-sys-color-surface-variant); border: 1px solid var(--md-sys-color-outline-variant); }
  `],
})
export class OccupancyChartComponent {

  /** Occupancy data to display. */
  readonly summary = input.required<OccupancySummary>();

  // Chart layout constants
  private readonly CHART_LEFT = 42;
  private readonly CHART_RIGHT = 532;
  private readonly CHART_TOP = 6;
  private readonly CHART_BOTTOM = 145;
  private readonly CHART_HEIGHT = this.CHART_BOTTOM - this.CHART_TOP;

  /** Y coordinate for a percentage grid line. */
  gridY(pct: number): number {
    return this.CHART_BOTTOM - (pct / 100) * this.CHART_HEIGHT;
  }

  /** Computed bar definitions. */
  readonly bars = computed(() => {
    const data = this.summary().data;
    const n = data.length;
    const totalWidth = this.CHART_RIGHT - this.CHART_LEFT;
    const barW = Math.max(8, (totalWidth / n) * 0.65);
    const gap = totalWidth / n;

    return data.map((d, i) => {
      const h = Math.max(2, (d.occupancyRate / 100) * this.CHART_HEIGHT);
      return {
        month: d.month,
        rate: d.occupancyRate,
        occupied: d.occupied,
        x: this.CHART_LEFT + i * gap + (gap - barW) / 2,
        y: this.CHART_BOTTOM - h,
        w: barW,
        h,
      };
    });
  });

  /** Accessible aria label for the chart. */
  readonly chartAriaLabel = computed(() => {
    const avg = this.summary().yearlyAverage;
    return `Gráfico de ocupação — ${this.summary().propertyTitle}. Média anual: ${avg}%.`;
  });
}
