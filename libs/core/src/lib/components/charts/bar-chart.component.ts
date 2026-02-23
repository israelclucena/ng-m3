import {
  Component,
  input,
  computed,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BarChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

/**
 * Pure SVG vertical bar chart using Angular Signals.
 * Supports individual bar colors, hover tooltips, and M3 tokens.
 */
@Component({
  selector: 'iu-bar-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="iu-bar-chart" [style.width.px]="width()" [style.height.px]="height()">
      <div class="chart-title" *ngIf="title()">{{ title() }}</div>
      <svg
        [attr.width]="svgWidth()"
        [attr.height]="svgHeight()"
        [attr.viewBox]="'0 0 ' + svgWidth() + ' ' + svgHeight()"
        class="chart-svg"
      >
        <!-- Grid lines -->
        @for (line of gridLines(); track $index) {
          <line
            [attr.x1]="padding.left"
            [attr.y1]="line.y"
            [attr.x2]="svgWidth() - padding.right"
            [attr.y2]="line.y"
            class="grid-line"
          />
          <text
            [attr.x]="padding.left - 8"
            [attr.y]="line.y + 4"
            class="axis-label"
            text-anchor="end"
          >{{ line.label }}</text>
        }

        <!-- Bars -->
        @for (bar of computedBars(); track bar.label) {
          <g class="bar-group">
            <!-- Background bar (track) -->
            <rect
              [attr.x]="bar.x"
              [attr.y]="padding.top"
              [attr.width]="bar.width"
              [attr.height]="plotHeight()"
              class="bar-track"
              rx="4"
            />
            <!-- Value bar -->
            <rect
              [attr.x]="bar.x"
              [attr.y]="bar.y"
              [attr.width]="bar.width"
              [attr.height]="bar.barHeight"
              [attr.fill]="bar.color"
              class="bar-rect"
              rx="4"
              (mouseenter)="onBarHover($event, bar.label, bar.value)"
              (mouseleave)="onBarLeave()"
            />
            <!-- X label -->
            <text
              [attr.x]="bar.x + bar.width / 2"
              [attr.y]="svgHeight() - padding.bottom + 16"
              class="axis-label"
              text-anchor="middle"
            >{{ bar.label }}</text>
          </g>
        }

        <!-- Tooltip -->
        @if (tooltip().visible) {
          <g class="tooltip-group">
            <rect
              [attr.x]="tooltip().x - tooltip().width / 2"
              [attr.y]="tooltip().y - 32"
              [attr.width]="tooltip().width"
              height="24"
              rx="4"
              class="tooltip-bg"
            />
            <text
              [attr.x]="tooltip().x"
              [attr.y]="tooltip().y - 15"
              class="tooltip-text"
              text-anchor="middle"
            >{{ tooltip().text }}</text>
          </g>
        }
      </svg>
    </div>
  `,
  styles: [`
    .iu-bar-chart {
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
    .bar-track {
      fill: var(--md-sys-color-surface-variant, #e7e0ec);
      opacity: 0.4;
    }
    .bar-rect {
      cursor: pointer;
      transition: opacity 0.15s ease;
      opacity: 0.85;
    }
    .bar-rect:hover { opacity: 1; }
    .tooltip-bg {
      fill: var(--md-sys-color-inverse-surface, #333);
      opacity: 0.9;
    }
    .tooltip-text {
      fill: var(--md-sys-color-inverse-on-surface, #fff);
      font-size: 11px;
      font-weight: 500;
    }
  `],
})
export class BarChartComponent {
  // ── Inputs ──
  data = input<BarChartDataPoint[]>([]);
  title = input<string>('');
  width = input<number>(480);
  height = input<number>(280);
  barColor = input<string>('var(--md-sys-color-primary, #6750A4)');
  yMin = input<number>(0);
  yMax = input<number | undefined>(undefined);
  barGap = input<number>(8);

  readonly padding = { top: 16, right: 24, bottom: 32, left: 48 };

  tooltip = signal<{ visible: boolean; x: number; y: number; text: string; width: number }>({
    visible: false, x: 0, y: 0, text: '', width: 80,
  });

  svgWidth = computed(() => this.width());
  svgHeight = computed(() => this.height());
  plotWidth = computed(() => this.svgWidth() - this.padding.left - this.padding.right);
  plotHeight = computed(() => this.svgHeight() - this.padding.top - this.padding.bottom);

  dataMax = computed(() => this.yMax() ?? Math.max(...this.data().map(d => d.value), 1));

  gridLines = computed(() => {
    const count = 4;
    return Array.from({ length: count + 1 }, (_, i) => {
      const fraction = i / count;
      const value = this.dataMax() * (1 - fraction);
      const y = this.padding.top + fraction * this.plotHeight();
      return {
        y: Math.round(y),
        label: Number.isInteger(value) ? value.toString() : value.toFixed(1),
      };
    });
  });

  computedBars = computed(() => {
    const n = this.data().length;
    if (n === 0) return [];
    const gap = this.barGap();
    const barWidth = (this.plotWidth() - gap * (n - 1)) / n;
    const range = this.dataMax() - this.yMin() || 1;

    return this.data().map((d, i) => {
      const barHeight = Math.max(((d.value - this.yMin()) / range) * this.plotHeight(), 2);
      return {
        x: this.padding.left + i * (barWidth + gap),
        y: this.padding.top + this.plotHeight() - barHeight,
        width: barWidth,
        barHeight,
        label: d.label,
        value: d.value,
        color: d.color ?? this.barColor(),
      };
    });
  });

  onBarHover(event: MouseEvent, label: string, value: number): void {
    const el = event.target as SVGElement;
    const svgRect = el.closest('svg')!.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const x = rect.left - svgRect.left + rect.width / 2;
    const y = rect.top - svgRect.top;
    const text = `${label}: ${value}`;
    const width = Math.max(text.length * 7.5, 60);
    this.tooltip.set({ visible: true, x, y, text, width });
  }

  onBarLeave(): void {
    this.tooltip.set({ visible: false, x: 0, y: 0, text: '', width: 80 });
  }
}
