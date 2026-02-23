import {
  Component,
  input,
  computed,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface LineChartDataPoint {
  label: string;
  value: number;
}

export interface LineChartSeries {
  name: string;
  color?: string;
  data: LineChartDataPoint[];
}

/**
 * Pure SVG line chart component using Angular Signals.
 * Supports multiple series, tooltips, and M3 design tokens.
 */
@Component({
  selector: 'iu-line-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="iu-line-chart" [style.width.px]="width()" [style.height.px]="height()">
      <div class="chart-title" *ngIf="title()">{{ title() }}</div>
      <svg
        [attr.width]="svgWidth()"
        [attr.height]="svgHeight()"
        [attr.viewBox]="'0 0 ' + svgWidth() + ' ' + svgHeight()"
        class="chart-svg"
      >
        <!-- Grid lines -->
        <g class="grid-lines">
          @for (line of gridLines(); track $index) {
            <line
              [attr.x1]="padding.left"
              [attr.y1]="line.y"
              [attr.x2]="svgWidth() - padding.right"
              [attr.y2]="line.y"
              class="grid-line"
            />
          }
        </g>

        <!-- Y-axis labels -->
        <g class="y-labels">
          @for (line of gridLines(); track $index) {
            <text
              [attr.x]="padding.left - 8"
              [attr.y]="line.y + 4"
              class="axis-label"
              text-anchor="end"
            >{{ line.label }}</text>
          }
        </g>

        <!-- X-axis labels -->
        <g class="x-labels">
          @for (label of xLabels(); track $index) {
            <text
              [attr.x]="label.x"
              [attr.y]="svgHeight() - padding.bottom + 16"
              class="axis-label"
              text-anchor="middle"
            >{{ label.text }}</text>
          }
        </g>

        <!-- Series paths -->
        @for (series of computedSeries(); track series.name) {
          <!-- Area fill -->
          <path
            [attr.d]="series.areaPath"
            [attr.fill]="series.color"
            class="area-fill"
            opacity="0.12"
          />
          <!-- Line -->
          <path
            [attr.d]="series.linePath"
            [attr.stroke]="series.color"
            class="line-path"
            fill="none"
          />
          <!-- Data points -->
          @for (point of series.points; track $index) {
            <circle
              [attr.cx]="point.x"
              [attr.cy]="point.y"
              r="4"
              [attr.fill]="series.color"
              [attr.stroke]="series.color"
              class="data-point"
              (mouseenter)="onPointHover($event, series.name, point.label, point.value)"
              (mouseleave)="onPointLeave()"
            />
          }
        }

        <!-- Tooltip -->
        @if (tooltip().visible) {
          <g class="tooltip-group">
            <rect
              [attr.x]="tooltip().x + 8"
              [attr.y]="tooltip().y - 28"
              [attr.width]="tooltip().width"
              height="24"
              rx="4"
              class="tooltip-bg"
            />
            <text
              [attr.x]="tooltip().x + 8 + tooltip().width / 2"
              [attr.y]="tooltip().y - 11"
              class="tooltip-text"
              text-anchor="middle"
            >{{ tooltip().text }}</text>
          </g>
        }
      </svg>

      <!-- Legend -->
      @if (showLegend() && series().length > 1) {
        <div class="chart-legend">
          @for (s of series(); track s.name) {
            <div class="legend-item">
              <span class="legend-dot" [style.background]="getSeriesColor($index)"></span>
              <span class="legend-label">{{ s.name }}</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .iu-line-chart {
      display: flex;
      flex-direction: column;
      font-family: var(--md-sys-typescale-body-small-font, 'Roboto', sans-serif);
    }
    .chart-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      margin-bottom: 8px;
      padding-left: 4px;
    }
    .chart-svg { overflow: visible; }
    .grid-line {
      stroke: var(--md-sys-color-outline-variant, #ccc);
      stroke-width: 1;
      stroke-dasharray: 4 4;
    }
    .axis-label {
      fill: var(--md-sys-color-on-surface-variant, #666);
      font-size: 11px;
    }
    .line-path {
      stroke-width: 2.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .data-point {
      cursor: pointer;
      transition: r 0.15s ease;
      stroke-width: 2;
      fill: var(--md-sys-color-surface, white);
    }
    .data-point:hover { r: 6; }
    .tooltip-bg {
      fill: var(--md-sys-color-inverse-surface, #333);
      opacity: 0.9;
    }
    .tooltip-text {
      fill: var(--md-sys-color-inverse-on-surface, #fff);
      font-size: 11px;
      font-weight: 500;
    }
    .chart-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 8px;
      padding-left: 8px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .legend-label {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
    }
  `],
})
export class LineChartComponent {
  // ── Inputs ──
  series = input<LineChartSeries[]>([]);
  title = input<string>('');
  width = input<number>(480);
  height = input<number>(280);
  showLegend = input<boolean>(true);
  yMin = input<number | undefined>(undefined);
  yMax = input<number | undefined>(undefined);

  /** M3 color palette for series */
  readonly DEFAULT_COLORS = [
    'var(--md-sys-color-primary, #6750A4)',
    'var(--md-sys-color-tertiary, #7D5260)',
    'var(--md-sys-color-secondary, #625B71)',
    '#00897B',
    '#F4511E',
    '#039BE5',
  ];

  readonly padding = { top: 16, right: 24, bottom: 32, left: 48 };

  // ── Tooltip state ──
  tooltip = signal<{ visible: boolean; x: number; y: number; text: string; width: number }>({
    visible: false, x: 0, y: 0, text: '', width: 80,
  });

  // ── Computed dimensions ──
  svgWidth = computed(() => this.width());
  svgHeight = computed(() => this.showLegend() && this.series().length > 1
    ? this.height() - 32
    : this.height());

  plotWidth = computed(() => this.svgWidth() - this.padding.left - this.padding.right);
  plotHeight = computed(() => this.svgHeight() - this.padding.top - this.padding.bottom);

  // ── Data extents ──
  allValues = computed(() => this.series().flatMap(s => s.data.map(d => d.value)));
  dataMin = computed(() => this.yMin() ?? Math.min(...this.allValues(), 0));
  dataMax = computed(() => this.yMax() ?? Math.max(...this.allValues(), 1));

  // ── Grid lines (5 horizontal) ──
  gridLines = computed(() => {
    const count = 5;
    const range = this.dataMax() - this.dataMin();
    return Array.from({ length: count + 1 }, (_, i) => {
      const fraction = i / count;
      const value = this.dataMax() - fraction * range;
      const y = this.padding.top + fraction * this.plotHeight();
      return {
        y: Math.round(y),
        label: Number.isInteger(value) ? value.toString() : value.toFixed(1),
      };
    });
  });

  // ── X-axis labels ──
  xLabels = computed(() => {
    const first = this.series()[0];
    if (!first) return [];
    return first.data.map((d, i) => ({
      x: this.padding.left + (i / Math.max(first.data.length - 1, 1)) * this.plotWidth(),
      text: d.label,
    }));
  });

  // ── Computed series with SVG paths ──
  computedSeries = computed(() => {
    const range = this.dataMax() - this.dataMin() || 1;
    return this.series().map((s, si) => {
      const color = s.color ?? this.DEFAULT_COLORS[si % this.DEFAULT_COLORS.length];
      const n = s.data.length;
      const points = s.data.map((d, i) => ({
        x: this.padding.left + (i / Math.max(n - 1, 1)) * this.plotWidth(),
        y: this.padding.top + ((this.dataMax() - d.value) / range) * this.plotHeight(),
        label: d.label,
        value: d.value,
      }));

      const linePath = points.reduce((path, p, i) =>
        path + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`), '');

      const bottom = this.padding.top + this.plotHeight();
      const areaPath = points.reduce((path, p, i) =>
        path + (i === 0 ? `M ${p.x} ${bottom} L ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`),
        '') + ` L ${points[points.length - 1]?.x ?? 0} ${bottom} Z`;

      return { name: s.name, color, points, linePath, areaPath };
    });
  });

  /** Get color for series by index */
  getSeriesColor(index: number): string {
    return this.series()[index]?.color ?? this.DEFAULT_COLORS[index % this.DEFAULT_COLORS.length];
  }

  onPointHover(event: MouseEvent, seriesName: string, label: string, value: number): void {
    const el = event.target as SVGElement;
    const svgRect = el.closest('svg')!.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const x = rect.left - svgRect.left + (rect.width / 2);
    const y = rect.top - svgRect.top;
    const text = `${label}: ${value}`;
    const width = Math.max(text.length * 7.5, 60);
    this.tooltip.set({ visible: true, x, y, text, width });
  }

  onPointLeave(): void {
    this.tooltip.set({ visible: false, x: 0, y: 0, text: '', width: 80 });
  }
}
