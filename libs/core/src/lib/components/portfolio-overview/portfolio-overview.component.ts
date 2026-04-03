import {
  Component, ChangeDetectionStrategy, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioOverviewService } from '../../services/portfolio-overview.service';
import type { PortfolioProperty } from '../../services/portfolio-overview.service';

/**
 * PortfolioOverviewComponent — high-level landlord portfolio dashboard.
 *
 * Shows total MRR, occupancy rate, vacancy/maintenance counts, property-level
 * status cards with pending actions, and a mini MRR trend chart.
 *
 * @example
 * <iu-portfolio-overview />
 */
@Component({
  selector: 'iu-portfolio-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="po-root">

      <!-- Header -->
      <div class="po-header">
        <div>
          <h2 class="po-title">Portfolio Overview</h2>
          <p class="po-subtitle">Your rental portfolio at a glance</p>
        </div>
        @if (svc.mrrGrowth() !== 0) {
          <div class="po-mrr-growth" [class.positive]="svc.mrrGrowth() > 0">
            {{ svc.mrrGrowth() > 0 ? '▲' : '▼' }} {{ svc.mrrGrowth() | number:'1.0-0' }}% MRR
          </div>
        }
      </div>

      <!-- KPI Strip -->
      <div class="po-kpis">
        <div class="po-kpi primary">
          <span class="po-kpi-value">€{{ svc.kpis().totalMRR | number:'1.0-0' }}</span>
          <span class="po-kpi-label">Monthly Revenue</span>
        </div>
        <div class="po-kpi">
          <span class="po-kpi-value">{{ svc.kpis().avgOccupancyRate }}%</span>
          <span class="po-kpi-label">Avg Occupancy</span>
        </div>
        <div class="po-kpi">
          <span class="po-kpi-value">{{ svc.kpis().totalProperties }}</span>
          <span class="po-kpi-label">Total Properties</span>
        </div>
        <div class="po-kpi" [class.alert]="svc.kpis().pendingActions > 0">
          <span class="po-kpi-value">{{ svc.kpis().pendingActions }}</span>
          <span class="po-kpi-label">Pending Actions</span>
        </div>
      </div>

      <!-- Status Breakdown -->
      <div class="po-status-row">
        <div class="po-status-pill occupied">
          <span class="po-status-dot"></span>
          {{ svc.kpis().occupied }} Occupied
        </div>
        <div class="po-status-pill vacant">
          <span class="po-status-dot"></span>
          {{ svc.kpis().vacant }} Vacant
        </div>
        <div class="po-status-pill maintenance">
          <span class="po-status-dot"></span>
          {{ svc.kpis().maintenance }} Maintenance
        </div>
      </div>

      <!-- MRR Trend Chart -->
      <div class="po-section">
        <h3 class="po-section-title">MRR Trend</h3>
        <div class="po-chart">
          @for (snap of svc.monthlyData(); track snap.month) {
            <div class="po-bar-col">
              <div class="po-bar-wrap">
                <div
                  class="po-bar"
                  [style.height.%]="(snap.mrr / maxMRR()) * 100"
                  [title]="'€' + snap.mrr"
                ></div>
              </div>
              <div class="po-bar-label">{{ snap.month }}</div>
              <div class="po-bar-value">€{{ snap.mrr | number:'1.0-0' }}</div>
            </div>
          }
        </div>
      </div>

      <!-- Property Cards -->
      <div class="po-section">
        <h3 class="po-section-title">Properties</h3>
        <div class="po-props">
          @for (prop of svc.properties(); track prop.id) {
            <div class="po-prop-card">
              <div class="po-prop-top">
                <div class="po-prop-info">
                  <div class="po-prop-type">{{ prop.type }}</div>
                  <div class="po-prop-address">{{ prop.address }}</div>
                </div>
                <div class="po-prop-right">
                  <span
                    class="po-prop-status"
                    [style.background]="svc.statusColor(prop.status) + '22'"
                    [style.color]="svc.statusColor(prop.status)"
                  >{{ svc.statusLabel(prop.status) }}</span>
                  @if (prop.status === 'occupied') {
                    <div class="po-prop-rent">€{{ prop.monthlyRent | number:'1.0-0' }}/mo</div>
                  }
                </div>
              </div>

              @if (prop.status === 'occupied') {
                <div class="po-occupancy-row">
                  <span class="po-occupancy-label">Occupancy</span>
                  <div class="po-occupancy-bar">
                    <div class="po-occupancy-fill" [style.width.%]="prop.occupancyRate"></div>
                  </div>
                  <span class="po-occupancy-pct">{{ prop.occupancyRate }}%</span>
                </div>
              }

              <div class="po-prop-meta">
                <span class="po-last-event">{{ prop.lastEvent }}</span>
                <span class="po-last-date">{{ prop.lastEventDate }}</span>
              </div>

              @if (prop.pendingActions > 0) {
                <div class="po-pending-badge">
                  {{ prop.pendingActions }} pending action{{ prop.pendingActions > 1 ? 's' : '' }}
                </div>
              }
            </div>
          }
        </div>
      </div>

    </div>
  `,
  styles: [`
    .po-root {
      padding: 24px;
      font-family: var(--md-sys-typescale-body-large-font, sans-serif);
      background: var(--md-sys-color-background, #fafafa);
      min-height: 100vh;
    }

    /* Header */
    .po-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }
    .po-title {
      font-size: 22px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      margin: 0 0 4px;
    }
    .po-subtitle {
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin: 0;
    }
    .po-mrr-growth {
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      background: #FFEBEE;
      color: #C62828;
    }
    .po-mrr-growth.positive {
      background: #E8F5E9;
      color: #2E7D32;
    }

    /* KPIs */
    .po-kpis {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }
    .po-kpi {
      background: var(--md-sys-color-surface-container, #fff);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      box-shadow: var(--md-sys-elevation-level1, 0 1px 3px rgba(0,0,0,.12));
    }
    .po-kpi.primary {
      background: var(--md-sys-color-primary-container, #eaddff);
    }
    .po-kpi.alert .po-kpi-value { color: #E65100; }
    .po-kpi-value {
      font-size: 26px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .po-kpi-label {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    /* Status Row */
    .po-status-row {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .po-status-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
    }
    .po-status-pill.occupied  { background: #E8F5E9; color: #2E7D32; }
    .po-status-pill.vacant    { background: #E3F2FD; color: #1565C0; }
    .po-status-pill.maintenance { background: #FFF3E0; color: #E65100; }
    .po-status-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: currentColor;
    }

    /* Chart */
    .po-section { margin-bottom: 32px; }
    .po-section-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      margin: 0 0 16px;
    }
    .po-chart {
      display: flex;
      align-items: flex-end;
      gap: 12px;
      background: var(--md-sys-color-surface-container, #fff);
      border-radius: 16px;
      padding: 20px;
      box-shadow: var(--md-sys-elevation-level1, 0 1px 3px rgba(0,0,0,.12));
      height: 160px;
    }
    .po-bar-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
    }
    .po-bar-wrap {
      flex: 1;
      width: 100%;
      display: flex;
      align-items: flex-end;
    }
    .po-bar {
      width: 100%;
      background: var(--md-sys-color-primary, #6750a4);
      border-radius: 6px 6px 0 0;
      min-height: 4px;
      transition: height 0.3s ease;
    }
    .po-bar-label {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin-top: 4px;
    }
    .po-bar-value {
      font-size: 10px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    /* Property Cards */
    .po-props {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }
    .po-prop-card {
      background: var(--md-sys-color-surface-container, #fff);
      border-radius: 16px;
      padding: 20px;
      box-shadow: var(--md-sys-elevation-level1, 0 1px 3px rgba(0,0,0,.12));
    }
    .po-prop-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .po-prop-type {
      font-size: 14px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .po-prop-address {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin-top: 2px;
    }
    .po-prop-right { text-align: right; }
    .po-prop-status {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }
    .po-prop-rent {
      font-size: 14px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      margin-top: 4px;
    }
    .po-occupancy-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .po-occupancy-label {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      width: 60px;
      flex-shrink: 0;
    }
    .po-occupancy-bar {
      flex: 1;
      height: 6px;
      background: var(--md-sys-color-surface-container-highest, #e6e0e9);
      border-radius: 3px;
      overflow: hidden;
    }
    .po-occupancy-fill {
      height: 100%;
      background: var(--md-sys-color-primary, #6750a4);
      border-radius: 3px;
      transition: width 0.3s ease;
    }
    .po-occupancy-pct {
      font-size: 11px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      width: 32px;
      text-align: right;
    }
    .po-prop-meta {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin-bottom: 8px;
    }
    .po-last-event { font-style: italic; }
    .po-pending-badge {
      display: inline-block;
      background: #FFF3E0;
      color: #E65100;
      border-radius: 12px;
      padding: 3px 10px;
      font-size: 11px;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .po-kpis { grid-template-columns: repeat(2, 1fr); }
    }
  `],
})
export class PortfolioOverviewComponent {
  readonly svc = inject(PortfolioOverviewService);

  maxMRR(): number {
    const data = this.svc.monthlyData();
    return data.length > 0 ? Math.max(...data.map(d => d.mrr)) : 1;
  }
}
