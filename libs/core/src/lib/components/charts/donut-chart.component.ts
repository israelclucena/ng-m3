import {
  Component,
  input,
  computed,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DonutChartSegment {
  label: string;
  value: number;
  color?: string;
}

/**
 * Pure SVG donut chart using Angular Signals.
 * Shows percentage breakdown with animated hover and center label.
 */
@Component({
  selector: 'iu-donut-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="iu-donut-chart" [style.width.px]="size()" [style.height.px]="size()">
      <div class="chart-title" *ngIf="title()">{{ title() }}</div>
      <div class="chart-wrapper">
        <svg
          [attr.width]="svgSize()"
          [attr.height]="svgSize()"
          [attr.viewBox]="'-1 -1 2 2'"
          class="donut-svg"
        >
          <!-- Segments -->
          @for (seg of computedSegments(); track seg.label) {
            <path
              [attr.d]="seg.path"
              [attr.fill]="seg.color"
              [class.segment-hover]="hoveredSegment() === seg.label"
              class="donut-segment"
              (mouseenter)="onSegmentHover(seg.label, seg.value, seg.percent)"
              (mouseleave)="onSegmentLeave()"
            />
          }
          <!-- Center hole -->
          <circle r="0.55" class="donut-hole" />
        </svg>

        <!-- Center label -->
        <div class="center-label">
          @if (hoveredSegment()) {
            <div class="center-value">{{ hoveredValue() }}%</div>
            <div class="center-text">{{ hoveredSegment() }}</div>
          } @else {
            <div class="center-value">{{ total() }}</div>
            <div class="center-text">{{ centerLabel() }}</div>
          }
        </div>
      </div>

      <!-- Legend -->
      @if (showLegend()) {
        <div class="donut-legend">
          @for (seg of computedSegments(); track seg.label) {
            <div
              class="legend-item"
              [class.legend-hover]="hoveredSegment() === seg.label"
              (mouseenter)="onSegmentHover(seg.label, seg.value, seg.percent)"
              (mouseleave)="onSegmentLeave()"
            >
              <span class="legend-dot" [style.background]="seg.color"></span>
              <span class="legend-label">{{ seg.label }}</span>
              <span class="legend-value">{{ seg.percent }}%</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .iu-donut-chart {
      display: flex;
      flex-direction: column;
      align-items: center;
      font-family: var(--md-sys-typescale-body-small-font, 'Roboto', sans-serif);
    }
    .chart-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      margin-bottom: 8px;
      align-self: flex-start;
    }
    .chart-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .donut-svg { display: block; }
    .donut-segment {
      cursor: pointer;
      transition: transform 0.15s ease, opacity 0.15s ease;
      transform-origin: center;
    }
    .donut-segment:hover, .segment-hover {
      opacity: 0.85;
      transform: scale(1.04);
    }
    .donut-hole {
      fill: var(--md-sys-color-surface, white);
    }
    .center-label {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }
    .center-value {
      font-size: 22px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
      line-height: 1;
    }
    .center-text {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant);
      margin-top: 2px;
      text-align: center;
    }
    .donut-legend {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 12px;
      padding: 0 8px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 4px;
      transition: background 0.1s;
    }
    .legend-item:hover, .legend-hover {
      background: var(--md-sys-color-surface-variant, #e7e0ec);
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
      flex: 1;
    }
    .legend-value {
      font-size: 12px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
    }
  `],
})
export class DonutChartComponent {
  // ── Inputs ──
  segments = input<DonutChartSegment[]>([]);
  title = input<string>('');
  size = input<number>(240);
  centerLabel = input<string>('Total');
  showLegend = input<boolean>(true);

  readonly DEFAULT_COLORS = [
    'var(--md-sys-color-primary, #6750A4)',
    'var(--md-sys-color-tertiary, #7D5260)',
    'var(--md-sys-color-secondary, #625B71)',
    '#00897B',
    '#F4511E',
    '#039BE5',
    '#FFB300',
  ];

  hoveredSegment = signal<string | null>(null);
  hoveredValue = signal<number>(0);

  svgSize = computed(() => this.size() * 0.65);
  total = computed(() => this.segments().reduce((s, d) => s + d.value, 0));

  computedSegments = computed(() => {
    const tot = this.total() || 1;
    let cumAngle = -Math.PI / 2; // Start at top
    return this.segments().map((seg, i) => {
      const fraction = seg.value / tot;
      const startAngle = cumAngle;
      const endAngle = cumAngle + fraction * 2 * Math.PI;
      cumAngle = endAngle;
      const path = this.describeArc(0, 0, 0.85, startAngle, endAngle);
      return {
        ...seg,
        color: seg.color ?? this.DEFAULT_COLORS[i % this.DEFAULT_COLORS.length],
        path,
        percent: Math.round(fraction * 100),
      };
    });
  });

  private describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
    const start = { x: cx + r * Math.cos(startAngle), y: cy + r * Math.sin(startAngle) };
    const end = { x: cx + r * Math.cos(endAngle), y: cy + r * Math.sin(endAngle) };
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return [
      `M ${cx} ${cy}`,
      `L ${start.x} ${start.y}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`,
      'Z',
    ].join(' ');
  }

  onSegmentHover(label: string, value: number, percent: number): void {
    this.hoveredSegment.set(label);
    this.hoveredValue.set(percent);
  }

  onSegmentLeave(): void {
    this.hoveredSegment.set(null);
  }
}
