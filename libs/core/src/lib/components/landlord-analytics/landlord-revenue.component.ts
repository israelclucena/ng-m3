/**
 * @fileoverview LandlordRevenueComponent — Sprint 030
 *
 * Full-featured landlord revenue dashboard widget.
 * Shows KPIs (MRR, ARR, net profit, occupancy), a 12-month bar chart,
 * and top properties leaderboard. Signal-based, OnPush.
 *
 * Feature flag: LANDLORD_REVENUE
 *
 * @example
 * ```html
 * <iu-landlord-revenue [landlordId]="'user-123'" />
 * ```
 */
import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed,
  inject,
  OnInit,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RevenueAnalyticsService } from '../../services/revenue-analytics.service';

@Component({
  selector: 'iu-landlord-revenue',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  styles: [`
    :host {
      display: block;
      font-family: var(--md-sys-typescale-body-large-font, system-ui);
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .revenue { display: flex; flex-direction: column; gap: 20px; }

    /* ── Loading ─────────────────────────────────── */
    .revenue__loading {
      display: flex; align-items: center; justify-content: center;
      gap: 12px; padding: 48px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: 14px;
    }
    .revenue__spinner {
      width: 24px; height: 24px;
      border: 3px solid var(--md-sys-color-outline-variant, #cac4d0);
      border-top-color: var(--md-sys-color-primary, #6750a4);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── KPI cards ───────────────────────────────── */
    .revenue__kpis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
    }
    .kpi-card {
      background: var(--md-sys-color-surface-variant, #f4eff4);
      border-radius: 16px;
      padding: 20px 16px;
      display: flex; flex-direction: column; gap: 6px;
    }
    .kpi-card--primary {
      background: var(--md-sys-color-primary-container, #eaddff);
    }
    .kpi-card--tertiary {
      background: var(--md-sys-color-tertiary-container, #d4edda);
    }
    .kpi-card__label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .kpi-card__value {
      font-size: 22px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .kpi-card__sub {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .kpi-card__trend {
      font-size: 12px; font-weight: 600;
      display: inline-flex; align-items: center; gap: 3px;
    }
    .kpi-card__trend--up { color: #2e7d32; }
    .kpi-card__trend--down { color: var(--md-sys-color-error, #b3261e); }
    .kpi-card__trend--flat { color: var(--md-sys-color-on-surface-variant, #49454f); }

    /* ── Chart ───────────────────────────────────── */
    .revenue__chart-card {
      background: var(--md-sys-color-surface-container, #f3edf7);
      border-radius: 16px;
      padding: 24px;
    }
    .revenue__chart-title {
      font-size: 16px; font-weight: 600;
      margin: 0 0 20px;
    }
    .chart-bars {
      display: flex;
      align-items: flex-end;
      gap: 6px;
      height: 120px;
    }
    .chart-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      height: 100%;
      justify-content: flex-end;
    }
    .chart-bar {
      width: 100%;
      border-radius: 4px 4px 0 0;
      min-height: 4px;
      transition: opacity 0.2s;
    }
    .chart-bar:hover { opacity: 0.8; }
    .chart-bar--revenue { background: var(--md-sys-color-primary, #6750a4); }
    .chart-bar--expense { background: var(--md-sys-color-error-container, #f9dedc); width: 60%; }
    .chart-label {
      font-size: 9px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      text-align: center;
    }
    .chart-legend {
      display: flex; gap: 16px; margin-top: 12px;
      font-size: 12px; color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .chart-legend__dot {
      width: 10px; height: 10px; border-radius: 2px; display: inline-block; margin-right: 4px;
    }
    .chart-legend__dot--revenue { background: var(--md-sys-color-primary, #6750a4); }
    .chart-legend__dot--expense { background: var(--md-sys-color-error-container, #f9dedc); }

    /* ── Properties leaderboard ──────────────────── */
    .revenue__props-card {
      background: var(--md-sys-color-surface-container, #f3edf7);
      border-radius: 16px;
      padding: 24px;
    }
    .revenue__props-title { font-size: 16px; font-weight: 600; margin: 0 0 16px; }
    .prop-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .prop-row:last-child { border-bottom: none; }
    .prop-row__rank {
      width: 28px; height: 28px; border-radius: 50%;
      background: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
      font-size: 12px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .prop-row__info { flex: 1; min-width: 0; }
    .prop-row__title { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .prop-row__meta { font-size: 12px; color: var(--md-sys-color-on-surface-variant, #49454f); }
    .prop-row__stats { text-align: right; flex-shrink: 0; }
    .prop-row__revenue { font-size: 14px; font-weight: 700; }
    .prop-row__occupancy { font-size: 11px; color: var(--md-sys-color-on-surface-variant, #49454f); }
    .prop-row__trend { font-size: 14px; margin-left: 8px; }

    /* ── Empty ───────────────────────────────────── */
    .revenue__empty {
      text-align: center; padding: 48px; color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .revenue__empty-icon { font-size: 48px; margin-bottom: 12px; }
  `],
  template: `
    <div class="revenue">

      @if (analytics.loading()) {
        <div class="revenue__loading">
          <div class="revenue__spinner"></div>
          A carregar analytics…
        </div>
      } @else if (!analytics.kpis()) {
        <div class="revenue__empty">
          <div class="revenue__empty-icon">📊</div>
          <p>Sem dados de receita disponíveis.</p>
        </div>
      } @else {

        <!-- KPI Cards -->
        <div class="revenue__kpis">
          <div class="kpi-card kpi-card--primary">
            <div class="kpi-card__label">MRR</div>
            <div class="kpi-card__value">{{ fmt(analytics.kpis()!.mrr) }}</div>
            <div class="kpi-card__trend" [class]="mrrTrendClass()">
              {{ mrrTrendIcon() }} {{ analytics.kpis()!.growthMoM }}% vs mês anterior
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-card__label">ARR Projectado</div>
            <div class="kpi-card__value">{{ fmt(analytics.kpis()!.arrProjected) }}</div>
            <div class="kpi-card__sub">Com base no MRR actual</div>
          </div>
          <div class="kpi-card kpi-card--tertiary">
            <div class="kpi-card__label">Lucro Líq. (12m)</div>
            <div class="kpi-card__value">{{ fmt(analytics.kpis()!.netProfitTtm) }}</div>
            <div class="kpi-card__sub">Receitas - Despesas</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-card__label">Reservas (12m)</div>
            <div class="kpi-card__value">{{ analytics.kpis()!.totalBookingsTtm }}</div>
            <div class="kpi-card__sub">Total de reservas</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-card__label">Ocupação Média</div>
            <div class="kpi-card__value">{{ analytics.kpis()!.avgOccupancyRate }}%</div>
            <div class="kpi-card__sub">Últimos 12 meses</div>
          </div>
        </div>

        <!-- Monthly bar chart -->
        <div class="revenue__chart-card">
          <h3 class="revenue__chart-title">Receita vs Despesas — 2026</h3>
          <div class="chart-bars">
            @for (m of analytics.monthlyData(); track m.month) {
              <div class="chart-col">
                <div
                  class="chart-bar chart-bar--expense"
                  [style.height.px]="barHeight(m.expenses)"
                  [title]="m.month + ' — Despesas: ' + fmt(m.expenses)">
                </div>
                <div
                  class="chart-bar chart-bar--revenue"
                  [style.height.px]="barHeight(m.revenue)"
                  [title]="m.month + ' — Receita: ' + fmt(m.revenue)">
                </div>
                <span class="chart-label">{{ m.month }}</span>
              </div>
            }
          </div>
          <div class="chart-legend">
            <span><span class="chart-legend__dot chart-legend__dot--revenue"></span>Receita</span>
            <span><span class="chart-legend__dot chart-legend__dot--expense"></span>Despesas</span>
          </div>
        </div>

        <!-- Top properties -->
        @if (analytics.topProperties().length) {
          <div class="revenue__props-card">
            <h3 class="revenue__props-title">Top Propriedades por Receita</h3>
            @for (prop of analytics.topProperties(); track prop.propertyId; let i = $index) {
              <div class="prop-row">
                <div class="prop-row__rank">{{ i + 1 }}</div>
                <div class="prop-row__info">
                  <div class="prop-row__title">{{ prop.propertyTitle }}</div>
                  <div class="prop-row__meta">{{ prop.totalBookings }} reservas · {{ fmt(prop.monthlyRent) }}/mês</div>
                </div>
                <div class="prop-row__stats">
                  <div class="prop-row__revenue">{{ fmt(prop.totalRevenue) }}</div>
                  <div class="prop-row__occupancy">{{ prop.occupancyRate }}% ocupado</div>
                </div>
                <span class="prop-row__trend" [title]="'Tendência: ' + prop.trend">
                  {{ prop.trend === 'up' ? '↑' : prop.trend === 'down' ? '↓' : '→' }}
                </span>
              </div>
            }
          </div>
        }

      }
    </div>
  `,
})
export class LandlordRevenueComponent implements OnInit {
  readonly analytics = inject(RevenueAnalyticsService);

  /** Landlord identifier used for data fetching */
  readonly landlordId = input<string>('default');

  /** Whether to auto-load on init */
  readonly autoLoad = input<boolean>(true);

  private readonly _maxRevenue = computed(() => {
    const data = this.analytics.monthlyData();
    return data.length ? Math.max(...data.map(m => m.revenue), 1) : 1;
  });

  readonly mrrTrendClass = computed(() => {
    const g = this.analytics.kpis()?.growthMoM ?? 0;
    return `kpi-card__trend kpi-card__trend--${g > 0 ? 'up' : g < 0 ? 'down' : 'flat'}`;
  });

  readonly mrrTrendIcon = computed(() => {
    const g = this.analytics.kpis()?.growthMoM ?? 0;
    return g > 0 ? '▲' : g < 0 ? '▼' : '—';
  });

  constructor() {
    effect(() => {
      if (this.autoLoad()) {
        void this.analytics.load(this.landlordId());
      }
    });
  }

  ngOnInit(): void {
    // effect() handles the load — nothing to do here
  }

  /**
   * Calculate pixel height for a bar (capped at 100px).
   */
  barHeight(value: number): number {
    return Math.round((value / this._maxRevenue()) * 100);
  }

  /**
   * Format a monetary amount.
   */
  fmt(amount: number): string {
    return this.analytics.formatAmount(amount);
  }
}
