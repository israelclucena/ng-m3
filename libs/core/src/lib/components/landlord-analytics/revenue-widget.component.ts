import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RevenueSummary } from './landlord-analytics.types';

/**
 * `iu-revenue-widget` — Revenue & profit summary widget with sparkline trend.
 *
 * Displays total revenue, expenses, net profit, and YoY growth percentage.
 * Includes an SVG sparkline of monthly net profit.
 * Feature flag: `LANDLORD_ANALYTICS`
 *
 * @example
 * ```html
 * <iu-revenue-widget [summary]="revenueSummary" />
 * ```
 */
@Component({
  selector: 'iu-revenue-widget',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="iu-rev-widget">

      <!-- ── Title ── -->
      <div class="iu-rev-widget__header">
        <h3 class="iu-rev-widget__title">Receitas & Lucro</h3>
        <span
          class="iu-rev-widget__growth"
          [class.iu-rev-widget__growth--positive]="summary().growthPercent >= 0"
          [class.iu-rev-widget__growth--negative]="summary().growthPercent < 0"
        >
          <span class="material-symbols-outlined">
            {{ summary().growthPercent >= 0 ? 'trending_up' : 'trending_down' }}
          </span>
          {{ summary().growthPercent >= 0 ? '+' : '' }}{{ summary().growthPercent }}%
        </span>
      </div>

      <!-- ── KPI Cards ── -->
      <div class="iu-rev-widget__kpis">
        <div class="iu-rev-widget__kpi iu-rev-widget__kpi--revenue">
          <span class="iu-rev-widget__kpi-label">Receita Total</span>
          <span class="iu-rev-widget__kpi-value">
            {{ summary().totalRevenue | currency:summary().currency:'symbol':'1.0-0' }}
          </span>
        </div>
        <div class="iu-rev-widget__kpi iu-rev-widget__kpi--expenses">
          <span class="iu-rev-widget__kpi-label">Despesas</span>
          <span class="iu-rev-widget__kpi-value">
            {{ summary().totalExpenses | currency:summary().currency:'symbol':'1.0-0' }}
          </span>
        </div>
        <div class="iu-rev-widget__kpi iu-rev-widget__kpi--net">
          <span class="iu-rev-widget__kpi-label">Lucro Líquido</span>
          <span class="iu-rev-widget__kpi-value">
            {{ summary().netProfit | currency:summary().currency:'symbol':'1.0-0' }}
          </span>
        </div>
      </div>

      <!-- ── Sparkline ── -->
      <div class="iu-rev-widget__sparkline-wrap" role="img" [attr.aria-label]="sparklineLabel()">
        <svg class="iu-rev-widget__sparkline" viewBox="0 0 300 60" preserveAspectRatio="none">
          <!-- Fill area -->
          <path
            [attr.d]="sparklineFill()"
            fill="var(--md-sys-color-primary)"
            opacity="0.12"
          />
          <!-- Line -->
          <path
            [attr.d]="sparklinePath()"
            fill="none"
            stroke="var(--md-sys-color-primary)"
            stroke-width="2"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
          <!-- Dots -->
          @for (dot of sparklineDots(); track dot.x) {
            <circle
              [attr.cx]="dot.x"
              [attr.cy]="dot.y"
              r="3"
              fill="var(--md-sys-color-primary)"
            >
              <title>{{ dot.month }}: {{ dot.net | currency:'EUR':'symbol':'1.0-0' }}</title>
            </circle>
          }
        </svg>

        <!-- Month labels -->
        <div class="iu-rev-widget__sparkline-labels">
          @for (d of summary().data; track d.month) {
            <span>{{ d.month }}</span>
          }
        </div>
      </div>

      <!-- ── Margin bar ── -->
      <div class="iu-rev-widget__margin">
        <div class="iu-rev-widget__margin-label">
          <span>Margem de lucro</span>
          <strong>{{ profitMargin() }}%</strong>
        </div>
        <div class="iu-rev-widget__margin-bar">
          <div
            class="iu-rev-widget__margin-fill"
            [style.width.%]="profitMargin()"
          ></div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .iu-rev-widget {
      padding: 20px;
      background: var(--md-sys-color-surface-container-low);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      font-family: var(--md-sys-typescale-body-medium-font, sans-serif);
    }

    /* ── Header ── */
    .iu-rev-widget__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .iu-rev-widget__title {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
    }
    .iu-rev-widget__growth {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 100px;
    }
    .iu-rev-widget__growth .material-symbols-outlined { font-size: 16px; }
    .iu-rev-widget__growth--positive {
      background: color-mix(in srgb, var(--md-sys-color-tertiary, #2d8a50) 12%, transparent);
      color: var(--md-sys-color-tertiary, #2d8a50);
    }
    .iu-rev-widget__growth--negative {
      background: color-mix(in srgb, var(--md-sys-color-error) 12%, transparent);
      color: var(--md-sys-color-error);
    }

    /* ── KPIs ── */
    .iu-rev-widget__kpis {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .iu-rev-widget__kpi {
      padding: 12px;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .iu-rev-widget__kpi--revenue { background: var(--md-sys-color-primary-container); }
    .iu-rev-widget__kpi--expenses { background: var(--md-sys-color-error-container); }
    .iu-rev-widget__kpi--net { background: color-mix(in srgb, var(--md-sys-color-tertiary, #2d8a50) 15%, var(--md-sys-color-surface)); }
    .iu-rev-widget__kpi-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--md-sys-color-on-surface-variant);
    }
    .iu-rev-widget__kpi-value {
      font-size: 15px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface);
    }
    .iu-rev-widget__kpi--net .iu-rev-widget__kpi-value {
      color: var(--md-sys-color-tertiary, #2d8a50);
    }

    /* ── Sparkline ── */
    .iu-rev-widget__sparkline-wrap { }
    .iu-rev-widget__sparkline {
      width: 100%;
      height: 60px;
      display: block;
    }
    .iu-rev-widget__sparkline-labels {
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: var(--md-sys-color-on-surface-variant);
      margin-top: 4px;
    }

    /* ── Margin ── */
    .iu-rev-widget__margin { }
    .iu-rev-widget__margin-label {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
      margin-bottom: 6px;
    }
    .iu-rev-widget__margin-label strong { color: var(--md-sys-color-on-surface); }
    .iu-rev-widget__margin-bar {
      height: 6px;
      background: var(--md-sys-color-surface-variant);
      border-radius: 3px;
      overflow: hidden;
    }
    .iu-rev-widget__margin-fill {
      height: 100%;
      background: var(--md-sys-color-primary);
      border-radius: 3px;
      transition: width 0.6s ease;
    }
  `],
})
export class RevenueWidgetComponent {

  /** Revenue summary data. */
  readonly summary = input.required<RevenueSummary>();

  /** Computed profit margin percentage. */
  readonly profitMargin = computed(() => {
    const s = this.summary();
    if (s.totalRevenue === 0) return 0;
    return Math.round((s.netProfit / s.totalRevenue) * 100);
  });

  /** Computed sparkline SVG path (the line). */
  readonly sparklinePath = computed(() => {
    const pts = this._sparklinePoints();
    if (!pts.length) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  });

  /** Computed SVG fill area path. */
  readonly sparklineFill = computed(() => {
    const pts = this._sparklinePoints();
    if (!pts.length) return '';
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const last = pts[pts.length - 1];
    const first = pts[0];
    return `${line} L${last.x},58 L${first.x},58 Z`;
  });

  /** Computed dots for sparkline. */
  readonly sparklineDots = computed(() =>
    this._sparklinePoints().map((p, i) => ({
      ...p,
      month: this.summary().data[i].month,
      net: this.summary().data[i].net,
    }))
  );

  /** Accessible label for the sparkline. */
  readonly sparklineLabel = computed(() =>
    `Gráfico de lucro líquido mensal. Total: ${this.summary().netProfit}€.`
  );

  private _sparklinePoints(): { x: number; y: number }[] {
    const data = this.summary().data;
    if (!data.length) return [];
    const nets = data.map(d => d.net);
    const min = Math.min(...nets);
    const max = Math.max(...nets);
    const range = max - min || 1;
    const W = 300;
    const H = 50; // drawable height (top 5px padding)
    return data.map((d, i) => ({
      x: (i / (data.length - 1)) * W,
      y: 5 + H - ((d.net - min) / range) * H,
    }));
  }
}
