/**
 * @fileoverview PortfolioRoundupComponent — Sprint 045 (extra)
 *
 * Compact dashboard widget summarizing the three Sprint 045 trilogy
 * outputs in a single row of 3 cards:
 *   - Yield: weighted gross/net yield + best/worst performer
 *   - Fiscal: IRS estimado total + taxa efectiva + recommended regime
 *   - Compliance: % global compliant + #pending priority actions
 *
 * Each card emits a `(detail)` event with its `'yield' | 'fiscal' | 'compliance'`
 * key so the host (dashboard route) can navigate to the full-screen
 * trilogy component on CTA click.
 *
 * Empty state when the portfolio has no properties.
 *
 * Feature flag: PORTFOLIO_ROUNDUP
 *
 * @example
 * <iu-portfolio-roundup (detail)="goTo($event)" />
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
} from '@angular/core';
import { CommonModule, DecimalPipe, PercentPipe } from '@angular/common';
import {
  PortfolioMockService,
  type PortfolioProperty,
} from '../../services/portfolio-mock.service';
import {
  PT_IRS_ESCALOES_2026,
  PT_IRS_TAXA_AUTONOMA_CAT_F,
} from '../../services/irs-categoria-f.service';

export type RoundupDetailKey = 'yield' | 'fiscal' | 'compliance';

const MAINTENANCE_RATE = 0.005;
const TODAY_ISO = '2026-05-05';

interface YieldEntry {
  property: PortfolioProperty;
  netYield: number;
}

@Component({
  selector: 'iu-portfolio-roundup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DecimalPipe, PercentPipe],
  template: `
    <section class="pru-root">
      <header class="pru-header">
        <div>
          <h2 class="pru-title">Portfolio Roundup</h2>
          <p class="pru-subtitle">
            Sprint 045 trilogy summary · {{ count() }} {{ count() === 1 ? 'propriedade' : 'propriedades' }}
          </p>
        </div>
      </header>

      @if (count() === 0) {
        <div class="pru-empty">
          <strong>Sem propriedades</strong>
          <span>Adicione propriedades para ver o resumo do portfolio.</span>
        </div>
      } @else {
        <div class="pru-grid">

          <article class="pru-card pru-yield">
            <header class="pru-card-head">
              <span class="pru-card-tag">Yield</span>
              <span class="pru-card-title">Rentabilidade</span>
            </header>
            <div class="pru-card-body">
              <div class="pru-kpi-row">
                <div class="pru-kpi">
                  <span class="pru-kpi-label">Bruto</span>
                  <strong>{{ weightedGrossYield() | percent:'1.2-2' }}</strong>
                </div>
                <div class="pru-kpi accent">
                  <span class="pru-kpi-label">Líquido</span>
                  <strong>{{ weightedNetYield() | percent:'1.2-2' }}</strong>
                </div>
              </div>
              @if (bestPerformer(); as best) {
                <div class="pru-line">
                  <span class="pru-line-label">Top:</span>
                  <span class="pru-line-value">{{ best.property.address }}</span>
                  <span class="pru-line-pct positive">{{ best.netYield | percent:'1.2-2' }}</span>
                </div>
              }
              @if (worstPerformer(); as worst) {
                <div class="pru-line">
                  <span class="pru-line-label">Pior:</span>
                  <span class="pru-line-value">{{ worst.property.address }}</span>
                  <span class="pru-line-pct" [class.negative]="worst.netYield < 0">{{ worst.netYield | percent:'1.2-2' }}</span>
                </div>
              }
            </div>
            <footer class="pru-card-foot">
              <button type="button" class="pru-cta" (click)="emit('yield')">Ver detalhe →</button>
            </footer>
          </article>

          <article class="pru-card pru-fiscal">
            <header class="pru-card-head">
              <span class="pru-card-tag">Fiscal</span>
              <span class="pru-card-title">IRS Cat. F</span>
            </header>
            <div class="pru-card-body">
              <div class="pru-kpi-row">
                <div class="pru-kpi accent">
                  <span class="pru-kpi-label">IRS estimado</span>
                  <strong>€{{ totalIRSActual() | number:'1.0-0' }}</strong>
                </div>
                <div class="pru-kpi">
                  <span class="pru-kpi-label">Taxa efect.</span>
                  <strong>{{ taxaEfectivaPonderada() | percent:'1.2-2' }}</strong>
                </div>
              </div>
              <div class="pru-line">
                <span class="pru-line-label">Recomendado:</span>
                <span class="pru-line-value">{{ recommendedRegimeLabel() }}</span>
                @if (potentialSaving() > 0) {
                  <span class="pru-line-pct positive">−€{{ potentialSaving() | number:'1.0-0' }}</span>
                }
              </div>
            </div>
            <footer class="pru-card-foot">
              <button type="button" class="pru-cta" (click)="emit('fiscal')">Ver detalhe →</button>
            </footer>
          </article>

          <article class="pru-card pru-compliance" [attr.data-state]="complianceTone()">
            <header class="pru-card-head">
              <span class="pru-card-tag">Compliance</span>
              <span class="pru-card-title">Conformidade</span>
            </header>
            <div class="pru-card-body">
              <div class="pru-kpi-row">
                <div class="pru-kpi accent">
                  <span class="pru-kpi-label">% Conforme</span>
                  <strong>{{ overallComplianceRate() | percent:'1.0-0' }}</strong>
                </div>
                <div class="pru-kpi">
                  <span class="pru-kpi-label">Acções</span>
                  <strong>{{ pendingActions() }}</strong>
                </div>
              </div>
              <div class="pru-line">
                <span class="pru-line-label">Críticas:</span>
                <span class="pru-line-value">{{ criticalActions() }}</span>
                @if (criticalActions() > 0) {
                  <span class="pru-line-pct negative">⚠ atenção</span>
                } @else {
                  <span class="pru-line-pct positive">✓</span>
                }
              </div>
            </div>
            <footer class="pru-card-foot">
              <button type="button" class="pru-cta" (click)="emit('compliance')">Ver detalhe →</button>
            </footer>
          </article>

        </div>
      }
    </section>
  `,
  styles: [`
    .pru-root {
      display: flex; flex-direction: column; gap: 1rem;
      padding: 1.25rem;
      background: var(--md-sys-color-surface, #fafafa);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      border-radius: 16px;
      font-family: var(--md-sys-typescale-body-medium-font, system-ui, sans-serif);
    }
    .pru-header { display: flex; align-items: flex-start; justify-content: space-between; }
    .pru-title { margin: 0; font-size: 1.25rem; font-weight: 500; }
    .pru-subtitle {
      margin: .25rem 0 0; font-size: .8125rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .pru-empty {
      padding: 2rem 1rem;
      background: var(--md-sys-color-surface-container, #f3edf7);
      border-radius: 12px;
      text-align: center;
      display: flex; flex-direction: column; gap: .5rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .pru-empty strong { color: var(--md-sys-color-on-surface, #1c1b1f); }

    .pru-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: .875rem;
    }
    .pru-card {
      display: flex; flex-direction: column; gap: .75rem;
      padding: 1rem;
      background: var(--md-sys-color-surface-container, #f3edf7);
      border-radius: 14px;
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .pru-yield { border-top: 4px solid var(--md-sys-color-primary, #6750a4); }
    .pru-fiscal { border-top: 4px solid var(--md-sys-color-tertiary, #7d5260); }
    .pru-compliance { border-top: 4px solid #1f7a1f; }
    .pru-compliance[data-state='warning'] { border-top-color: #b07a00; }
    .pru-compliance[data-state='critical'] { border-top-color: #b3261e; }

    .pru-card-head {
      display: flex; flex-direction: column; gap: .25rem;
    }
    .pru-card-tag {
      font-size: .6875rem; text-transform: uppercase; letter-spacing: .08em;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-weight: 500;
    }
    .pru-card-title {
      font-size: 1rem; font-weight: 500;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .pru-card-body {
      display: flex; flex-direction: column; gap: .625rem;
    }

    .pru-kpi-row {
      display: grid; grid-template-columns: 1fr 1fr; gap: .5rem;
    }
    .pru-kpi {
      display: flex; flex-direction: column; gap: .125rem;
      padding: .5rem .75rem;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 8px;
    }
    .pru-kpi.accent {
      background: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
    }
    .pru-kpi-label {
      font-size: .6875rem; text-transform: uppercase; letter-spacing: .04em;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .pru-kpi.accent .pru-kpi-label { color: inherit; opacity: .8; }
    .pru-kpi strong { font-size: 1.0625rem; font-weight: 500; }

    .pru-line {
      display: flex; align-items: baseline; gap: .5rem;
      font-size: .8125rem;
    }
    .pru-line-label {
      color: var(--md-sys-color-on-surface-variant, #49454f);
      flex-shrink: 0;
    }
    .pru-line-value {
      flex: 1; min-width: 0;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .pru-line-pct {
      flex-shrink: 0; font-weight: 500;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .pru-line-pct.positive { color: #1f7a1f; }
    .pru-line-pct.negative { color: #b3261e; }

    .pru-card-foot {
      margin-top: auto;
      padding-top: .5rem;
      border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .pru-cta {
      width: 100%;
      padding: .5rem .75rem;
      background: transparent;
      border: 0;
      border-radius: 8px;
      color: var(--md-sys-color-primary, #6750a4);
      font-size: .8125rem; font-weight: 500;
      text-align: left;
      cursor: pointer;
    }
    .pru-cta:hover {
      background: var(--md-sys-color-surface-container-high, #ece6f0);
    }
    .pru-cta:focus-visible {
      outline: 2px solid var(--md-sys-color-primary, #6750a4);
      outline-offset: 2px;
    }
  `],
})
export class PortfolioRoundupComponent {
  private readonly portfolio = inject(PortfolioMockService);

  readonly detail = output<RoundupDetailKey>();

  readonly count = computed(() => this.portfolio.properties().length);

  // ── Yield ─────────────────────────────────────────────────────────────────
  private readonly yieldEntries = computed<YieldEntry[]>(() =>
    this.portfolio.properties().map((p) => {
      const annualRent = p.lease.monthlyRent * 12;
      const imi = p.vpt * p.imiTaxRate;
      const maintenance = p.marketValue * MAINTENANCE_RATE;
      const taxRate = p.irsRegime === 'taxaAutonoma28' ? PT_IRS_TAXA_AUTONOMA_CAT_F : 0.30;
      const taxableBase = Math.max(annualRent - p.annualDeductibleExpenses, 0);
      const tax = taxableBase * taxRate;
      const afterTax = annualRent - imi - maintenance - p.annualDeductibleExpenses - tax;
      const netYield = p.marketValue > 0 ? afterTax / p.marketValue : 0;
      return { property: p, netYield };
    }),
  );

  readonly weightedGrossYield = computed(() => {
    const props = this.portfolio.properties();
    const totalValue = props.reduce((acc, p) => acc + p.marketValue, 0);
    const totalRent = props.reduce((acc, p) => acc + p.lease.monthlyRent * 12, 0);
    return totalValue > 0 ? totalRent / totalValue : 0;
  });

  readonly weightedNetYield = computed(() => {
    const entries = this.yieldEntries();
    const totalValue = entries.reduce((acc, e) => acc + e.property.marketValue, 0);
    if (totalValue === 0) return 0;
    const weighted = entries.reduce(
      (acc, e) => acc + e.netYield * e.property.marketValue,
      0,
    );
    return weighted / totalValue;
  });

  readonly bestPerformer = computed<YieldEntry | null>(() => {
    const list = this.yieldEntries();
    return list.length ? list.reduce((b, e) => (e.netYield > b.netYield ? e : b)) : null;
  });

  readonly worstPerformer = computed<YieldEntry | null>(() => {
    const list = this.yieldEntries();
    return list.length ? list.reduce((w, e) => (e.netYield < w.netYield ? e : w)) : null;
  });

  // ── Fiscal ────────────────────────────────────────────────────────────────
  private readonly fiscalRows = computed(() =>
    this.portfolio.properties().map((p) => {
      const bruto = p.lease.monthlyRent * 12;
      const imi = p.vpt * p.imiTaxRate;
      const manut = p.marketValue * MAINTENANCE_RATE;
      const liquido = Math.max(0, bruto - imi - manut - p.annualDeductibleExpenses);
      const irsAutonoma = liquido * PT_IRS_TAXA_AUTONOMA_CAT_F;
      const irsEnglobamento = applyProgressive(liquido, PT_IRS_ESCALOES_2026);
      const irsActual = p.irsRegime === 'taxaAutonoma28' ? irsAutonoma : irsEnglobamento;
      return { liquido, irsActual, irsAutonoma, irsEnglobamento };
    }),
  );

  readonly totalIRSActual = computed(() =>
    this.fiscalRows().reduce((acc, r) => acc + r.irsActual, 0),
  );

  readonly totalLiquido = computed(() =>
    this.fiscalRows().reduce((acc, r) => acc + r.liquido, 0),
  );

  readonly taxaEfectivaPonderada = computed(() => {
    const liq = this.totalLiquido();
    return liq > 0 ? this.totalIRSActual() / liq : 0;
  });

  readonly recommendedRegimeLabel = computed(() => {
    const totalAuto = this.fiscalRows().reduce((acc, r) => acc + r.irsAutonoma, 0);
    const totalEng = this.fiscalRows().reduce((acc, r) => acc + r.irsEnglobamento, 0);
    const actual = this.totalIRSActual();
    const best = Math.min(totalAuto, totalEng, actual);
    if (best === actual) return 'Mix actual (óptimo)';
    return totalAuto < totalEng ? 'Todas autónoma 28%' : 'Todas englobamento';
  });

  readonly potentialSaving = computed(() => {
    const totalAuto = this.fiscalRows().reduce((acc, r) => acc + r.irsAutonoma, 0);
    const totalEng = this.fiscalRows().reduce((acc, r) => acc + r.irsEnglobamento, 0);
    const actual = this.totalIRSActual();
    return Math.max(0, actual - Math.min(totalAuto, totalEng));
  });

  // ── Compliance ────────────────────────────────────────────────────────────
  readonly overallComplianceRate = computed(() => {
    const props = this.portfolio.properties();
    if (props.length === 0) return 0;
    return (
      props.filter(
        (p) =>
          p.energy.state === 'ok' &&
          p.insurance.state === 'ok' &&
          p.lease.status !== 'escalation_due' &&
          p.lease.status !== 'ending',
      ).length / props.length
    );
  });

  readonly pendingActions = computed(() => {
    let n = 0;
    for (const p of this.portfolio.properties()) {
      if (p.energy.state !== 'ok') n++;
      if (p.insurance.state !== 'ok') n++;
      if (p.lease.status === 'escalation_due' || p.lease.status === 'ending') n++;
    }
    return n;
  });

  readonly criticalActions = computed(() => {
    let n = 0;
    for (const p of this.portfolio.properties()) {
      if (p.energy.state === 'expired') n++;
      if (p.insurance.state === 'expired') n++;
    }
    return n;
  });

  readonly complianceTone = computed<'ok' | 'warning' | 'critical'>(() => {
    if (this.criticalActions() > 0) return 'critical';
    if (this.pendingActions() > 0) return 'warning';
    return 'ok';
  });

  emit(key: RoundupDetailKey): void {
    this.detail.emit(key);
  }
}

function applyProgressive(
  amount: number,
  brackets: readonly { upTo: number; taxa: number }[],
): number {
  if (amount <= 0) return 0;
  let remaining = amount;
  let prevTop = 0;
  let total = 0;
  for (const b of brackets) {
    const slice = Math.min(remaining, b.upTo - prevTop);
    if (slice > 0) {
      total += slice * b.taxa;
      remaining -= slice;
    }
    prevTop = b.upTo;
    if (remaining <= 0) break;
  }
  return total;
}

// Today reference kept for potential future date-window logic
export const PORTFOLIO_ROUNDUP_TODAY = TODAY_ISO;
