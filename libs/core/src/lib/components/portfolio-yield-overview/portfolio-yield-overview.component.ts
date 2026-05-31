/**
 * @fileoverview PortfolioYieldOverviewComponent — Sprint 045 (1/3)
 *
 * Dashboard consumer that turns the standalone Yield Calculator
 * (Sprint 040) into a portfolio-wide table view. For each property in
 * `PortfolioMockService`, computes gross & net yield using realistic
 * Lisbon/PT cost assumptions: IMI (vpt × concelho rate), maintenance
 * estimate (~0.5%/year), deductible expenses, and IRS Cat.F retention
 * (28% taxa autónoma or 30% englobamento approximation).
 *
 * Sortable columns, weighted aggregates, delta vs portfolio average.
 *
 * Feature flag: PORTFOLIO_YIELD_OVERVIEW
 *
 * @example
 * <iu-portfolio-yield-overview />
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DecimalPipe, PercentPipe } from '@angular/common';
import {
  PortfolioMockService,
  type PortfolioProperty,
} from '../../services/portfolio-mock.service';

type SortKey =
  | 'address'
  | 'type'
  | 'marketValue'
  | 'annualRent'
  | 'grossYield'
  | 'netYield'
  | 'deltaVsAvg';
type SortDir = 'asc' | 'desc';

interface YieldRow {
  property: PortfolioProperty;
  annualRent: number;
  annualCosts: number;
  netRentBeforeTax: number;
  taxRate: number;
  afterTax: number;
  grossYield: number;
  netYield: number;
  deltaVsAvg: number;
}

const MAINTENANCE_RATE = 0.005;
const ENGLOBAMENTO_AVG_RATE = 0.30;
const TAXA_AUTONOMA_RATE = 0.28;

@Component({
  selector: 'iu-portfolio-yield-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DecimalPipe, PercentPipe],
  template: `
    <section class="pyo-root">

      <header class="pyo-header">
        <div>
          <h2 class="pyo-title">Portfolio Yield Overview</h2>
          <p class="pyo-subtitle">
            Rentabilidade bruta e líquida por imóvel · {{ rows().length }} propriedades
          </p>
        </div>
      </header>

      <div class="pyo-summary">
        <div class="pyo-kpi">
          <span class="pyo-kpi-label">Valor total carteira</span>
          <span class="pyo-kpi-value">€{{ totalMarketValue() | number:'1.0-0' }}</span>
        </div>
        <div class="pyo-kpi">
          <span class="pyo-kpi-label">Renda anual total</span>
          <span class="pyo-kpi-value">€{{ totalAnnualRent() | number:'1.0-0' }}</span>
        </div>
        <div class="pyo-kpi">
          <span class="pyo-kpi-label">Yield bruto (média ponderada)</span>
          <span class="pyo-kpi-value">{{ weightedGrossYield() | percent:'1.2-2' }}</span>
        </div>
        <div class="pyo-kpi accent">
          <span class="pyo-kpi-label">Yield líquido (média ponderada)</span>
          <span class="pyo-kpi-value">{{ weightedNetYield() | percent:'1.2-2' }}</span>
        </div>
      </div>

      <div class="pyo-table-wrap">
        <table class="pyo-table" role="table">
          <thead>
            <tr>
              <th class="sortable" (click)="toggleSort('address')">
                Imóvel {{ sortIcon('address') }}
              </th>
              <th class="sortable" (click)="toggleSort('type')">
                Tipo {{ sortIcon('type') }}
              </th>
              <th class="num sortable" (click)="toggleSort('marketValue')">
                Valor {{ sortIcon('marketValue') }}
              </th>
              <th class="num sortable" (click)="toggleSort('annualRent')">
                Renda Anual {{ sortIcon('annualRent') }}
              </th>
              <th class="num sortable" (click)="toggleSort('grossYield')">
                Yield Bruto {{ sortIcon('grossYield') }}
              </th>
              <th class="num sortable" (click)="toggleSort('netYield')">
                Yield Líquido {{ sortIcon('netYield') }}
              </th>
              <th class="num sortable" (click)="toggleSort('deltaVsAvg')">
                Δ vs Média {{ sortIcon('deltaVsAvg') }}
              </th>
            </tr>
          </thead>
          <tbody>
            @for (row of sortedRows(); track row.property.id) {
              <tr>
                <td>
                  <div class="pyo-address">{{ row.property.address }}</div>
                  <div class="pyo-neighbourhood">{{ row.property.neighbourhood }}</div>
                </td>
                <td>
                  <span class="pyo-type-badge">{{ row.property.type }}</span>
                </td>
                <td class="num">€{{ row.property.marketValue | number:'1.0-0' }}</td>
                <td class="num">€{{ row.annualRent | number:'1.0-0' }}</td>
                <td class="num">{{ row.grossYield | percent:'1.2-2' }}</td>
                <td class="num"
                    [class.pyo-net-positive]="row.netYield >= weightedNetYield()"
                    [class.pyo-net-negative]="row.netYield < weightedNetYield()">
                  {{ row.netYield | percent:'1.2-2' }}
                </td>
                <td class="num"
                    [class.pyo-delta-positive]="row.deltaVsAvg >= 0"
                    [class.pyo-delta-negative]="row.deltaVsAvg < 0">
                  {{ row.deltaVsAvg > 0 ? '+' : '' }}{{ row.deltaVsAvg | percent:'1.2-2' }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <p class="pyo-footnote">
        Custos considerados no yield líquido: IMI (VPT × taxa concelho),
        manutenção estimada ({{ maintenanceRate | percent:'1.1-1' }}/ano),
        despesas dedutíveis declaradas, retenção IRS Cat.F
        (28% taxa autónoma · ~30% englobamento médio).
      </p>

    </section>
  `,
  styles: [`
    :host { display: block; }

    .pyo-root {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding: 1.5rem;
      background: var(--md-sys-color-surface, #fafafa);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      border-radius: 16px;
      font-family: var(--md-sys-typescale-body-medium-font, system-ui, sans-serif);
    }

    .pyo-header { display: flex; align-items: flex-start; justify-content: space-between; }
    .pyo-title {
      margin: 0; font-size: 1.5rem; font-weight: 500;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .pyo-subtitle {
      margin: .25rem 0 0; font-size: .875rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .pyo-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: .75rem;
    }
    .pyo-kpi {
      display: flex; flex-direction: column; gap: .25rem;
      padding: .875rem 1rem;
      background: var(--md-sys-color-surface-container, #f3edf7);
      border-radius: 12px;
    }
    .pyo-kpi.accent {
      background: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
    }
    .pyo-kpi-label {
      font-size: .75rem; text-transform: uppercase; letter-spacing: .05em;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .pyo-kpi.accent .pyo-kpi-label { color: inherit; opacity: .8; }
    .pyo-kpi-value { font-size: 1.25rem; font-weight: 500; }

    .pyo-table-wrap {
      overflow-x: auto;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 12px;
    }
    .pyo-table {
      width: 100%; border-collapse: collapse; font-size: .875rem;
    }
    .pyo-table th, .pyo-table td {
      padding: .75rem 1rem; text-align: left;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .pyo-table th {
      font-weight: 500; font-size: .75rem;
      text-transform: uppercase; letter-spacing: .05em;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      background: var(--md-sys-color-surface-container, #f3edf7);
      user-select: none;
    }
    .pyo-table th.sortable { cursor: pointer; }
    .pyo-table th.sortable:hover {
      background: var(--md-sys-color-surface-container-high, #ece6f0);
    }
    .pyo-table .num { text-align: right; font-variant-numeric: tabular-nums; }
    .pyo-table tbody tr:hover {
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
    }

    .pyo-address { font-weight: 500; }
    .pyo-neighbourhood {
      font-size: .75rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .pyo-type-badge {
      display: inline-block;
      padding: .125rem .5rem;
      background: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-on-secondary-container, #1d192b);
      border-radius: 999px;
      font-size: .75rem; font-weight: 500;
    }

    .pyo-net-positive { color: var(--md-sys-color-tertiary, #1f7a1f); font-weight: 500; }
    .pyo-net-negative { color: var(--md-sys-color-error, #b3261e); font-weight: 500; }
    .pyo-delta-positive { color: var(--md-sys-color-tertiary, #1f7a1f); }
    .pyo-delta-negative { color: var(--md-sys-color-error, #b3261e); }

    .pyo-footnote {
      margin: 0; padding: 0 .25rem;
      font-size: .75rem; line-height: 1.5;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
  `],
})
export class PortfolioYieldOverviewComponent {
  private readonly portfolio = inject(PortfolioMockService);

  readonly maintenanceRate = MAINTENANCE_RATE;

  readonly sortKey = signal<SortKey>('netYield');
  readonly sortDir = signal<SortDir>('desc');

  readonly rows = computed<YieldRow[]>(() => {
    const props = this.portfolio.properties();
    const partial = props.map((p) => this.computeRow(p));
    const totalValue = partial.reduce((acc, r) => acc + r.property.marketValue, 0);
    const totalAfterTax = partial.reduce((acc, r) => acc + r.afterTax, 0);
    const avgNetYield = totalValue > 0 ? totalAfterTax / totalValue : 0;
    return partial.map((r) => ({ ...r, deltaVsAvg: r.netYield - avgNetYield }));
  });

  readonly sortedRows = computed<YieldRow[]>(() => {
    const list = [...this.rows()];
    const key = this.sortKey();
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      const av = this.sortValue(a, key);
      const bv = this.sortValue(b, key);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return list;
  });

  readonly totalMarketValue = computed(() =>
    this.rows().reduce((acc, r) => acc + r.property.marketValue, 0),
  );

  readonly totalAnnualRent = computed(() =>
    this.rows().reduce((acc, r) => acc + r.annualRent, 0),
  );

  readonly weightedGrossYield = computed(() => {
    const value = this.totalMarketValue();
    return value > 0 ? this.totalAnnualRent() / value : 0;
  });

  readonly weightedNetYield = computed(() => {
    const value = this.totalMarketValue();
    const totalAfterTax = this.rows().reduce((acc, r) => acc + r.afterTax, 0);
    return value > 0 ? totalAfterTax / value : 0;
  });

  toggleSort(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set(key === 'address' || key === 'type' ? 'asc' : 'desc');
    }
  }

  sortIcon(key: SortKey): string {
    if (this.sortKey() !== key) return '';
    return this.sortDir() === 'asc' ? '▲' : '▼';
  }

  private computeRow(p: PortfolioProperty): YieldRow {
    const annualRent = p.lease.monthlyRent * 12;
    const imi = p.vpt * p.imiTaxRate;
    const maintenance = p.marketValue * MAINTENANCE_RATE;
    const annualCosts = imi + maintenance + p.annualDeductibleExpenses;
    const netRentBeforeTax = annualRent - annualCosts;
    const taxRate =
      p.irsRegime === 'taxaAutonoma28' ? TAXA_AUTONOMA_RATE : ENGLOBAMENTO_AVG_RATE;
    const taxableBase = Math.max(annualRent - p.annualDeductibleExpenses, 0);
    const tax = taxableBase * taxRate;
    const afterTax = netRentBeforeTax - tax;
    const grossYield = p.marketValue > 0 ? annualRent / p.marketValue : 0;
    const netYield = p.marketValue > 0 ? afterTax / p.marketValue : 0;
    return {
      property: p,
      annualRent,
      annualCosts,
      netRentBeforeTax,
      taxRate,
      afterTax,
      grossYield,
      netYield,
      deltaVsAvg: 0,
    };
  }

  private sortValue(row: YieldRow, key: SortKey): number | string {
    switch (key) {
      case 'address': return row.property.address;
      case 'type': return row.property.type;
      case 'marketValue': return row.property.marketValue;
      case 'annualRent': return row.annualRent;
      case 'grossYield': return row.grossYield;
      case 'netYield': return row.netYield;
      case 'deltaVsAvg': return row.deltaVsAvg;
    }
  }
}
