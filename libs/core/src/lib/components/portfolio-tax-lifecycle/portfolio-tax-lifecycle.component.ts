/**
 * @fileoverview PortfolioTaxLifecycleWidgetComponent — Sprint 049
 *
 * Meta-consumer that aggregates ALL recurring annual tax burden across the
 * portfolio (IMI municipal + AIMI wealth tax + IRS Cat. F retention) and
 * optionally projects lifecycle events (sale → mais-valias / purchase → IMT).
 *
 * Closes the wiring gap left by Sprint 048: 8 PT real-estate calculators
 * exist standalone, but only 4 are dashboard-wired (yield/fiscal/compliance/
 * roundup, Sprint 045). This widget is the second meta-trilogy piece —
 * fiscal-burden-centred view, complementing PortfolioFiscalSummary's
 * regime-comparison view.
 *
 * Math is done locally using exported constants (`PT_AIMI_TAXAS_2026`,
 * `PT_AIMI_DEDUCAO_SINGULAR`, `PT_IRS_ESCALOES_2026`,
 * `PT_IRS_TAXA_AUTONOMA_CAT_F`, `PT_IMT_HPP_2026`, `PT_IMT_OUTROS_2026`,
 * `PT_IS_IMOVEL`, `PT_MV_TAXA_AUTONOMA`, `PT_MV_QUOTA_RESIDENTE`) so we
 * do NOT mutate the singleton calculator services that other consumers
 * may depend on.
 *
 * Feature flag: PORTFOLIO_TAX_LIFECYCLE_WIDGET
 *
 * @example
 * <iu-portfolio-tax-lifecycle />
 *
 * @example
 * <iu-portfolio-tax-lifecycle
 *   [projectedSale]="{ propertyId: 'pt-004', salePrice: 850000 }"
 *   [projectedPurchase]="{ value: 320000, finalidade: 'hpp' }" />
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { CommonModule, DecimalPipe, PercentPipe } from '@angular/common';
import {
  PortfolioMockService,
  type PortfolioProperty,
} from '../../services/portfolio-mock.service';
import {
  PT_AIMI_DEDUCAO_SINGULAR,
  PT_AIMI_TAXAS_2026,
} from '../../services/aimi.service';
import {
  PT_IRS_ESCALOES_2026,
  PT_IRS_TAXA_AUTONOMA_CAT_F,
} from '../../services/irs-categoria-f.service';
import {
  PT_IMT_HPP_2026,
  PT_IMT_OUTROS_2026,
  PT_IS_IMOVEL,
  type IMTFinalidade,
} from '../../services/imt.service';
import {
  PT_MV_QUOTA_RESIDENTE,
  PT_MV_TAXA_AUTONOMA,
} from '../../services/mais-valias-imobiliarias.service';

interface PropertyBurden {
  property: PortfolioProperty;
  imi: number;
  aimiShare: number;
  irs: number;
  totalAnnual: number;
  burdenRatio: number; // total / marketValue
}

export interface ProjectedSaleInput {
  propertyId: string;
  salePrice: number;
}

export interface ProjectedPurchaseInput {
  value: number;
  finalidade?: IMTFinalidade;
}

const MAINTENANCE_RATE = 0.005;

@Component({
  selector: 'iu-portfolio-tax-lifecycle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DecimalPipe, PercentPipe],
  template: `
    <section class="ptl-root">

      <header class="ptl-header">
        <div>
          <h2 class="ptl-title">Portfolio Tax Lifecycle</h2>
          <p class="ptl-subtitle">
            Carga fiscal anual agregada · {{ rows().length }} propriedades · IMI + AIMI + IRS Cat. F (2026)
          </p>
        </div>
      </header>

      <div class="ptl-summary">
        <div class="ptl-kpi">
          <span class="ptl-kpi-label">IMI anual</span>
          <span class="ptl-kpi-value">€{{ totalIMI() | number:'1.0-0' }}</span>
        </div>
        <div class="ptl-kpi" [class.ptl-kpi-muted]="!aimiTriggered()">
          <span class="ptl-kpi-label">AIMI</span>
          <span class="ptl-kpi-value">€{{ aimiColecta() | number:'1.0-0' }}</span>
          <span class="ptl-kpi-sub">
            @if (aimiTriggered()) {
              VPT total €{{ vptTotal() | number:'1.0-0' }} > €{{ aimiDeducao | number:'1.0-0' }}
            } @else {
              VPT total €{{ vptTotal() | number:'1.0-0' }} ≤ €{{ aimiDeducao | number:'1.0-0' }} · não devido
            }
          </span>
        </div>
        <div class="ptl-kpi">
          <span class="ptl-kpi-label">IRS Cat. F</span>
          <span class="ptl-kpi-value">€{{ totalIRS() | number:'1.0-0' }}</span>
        </div>
        <div class="ptl-kpi accent">
          <span class="ptl-kpi-label">Total anual</span>
          <span class="ptl-kpi-value">€{{ totalAnnual() | number:'1.0-0' }}</span>
          <span class="ptl-kpi-sub">
            {{ taxOnRentRatio() | percent:'1.1-1' }} da renda anual bruta
          </span>
        </div>
      </div>

      <div class="ptl-table-wrap">
        <table class="ptl-table" role="table">
          <thead>
            <tr>
              <th>Imóvel</th>
              <th class="num">VPT</th>
              <th class="num">IMI</th>
              <th class="num">AIMI share</th>
              <th class="num">IRS</th>
              <th class="num">Total anual</th>
              <th class="num">% mkt value</th>
            </tr>
          </thead>
          <tbody>
            @for (r of rows(); track r.property.id) {
              <tr>
                <td>
                  <div class="ptl-address">{{ r.property.address }}</div>
                  <div class="ptl-neighbourhood">{{ r.property.neighbourhood }} · {{ r.property.type }}</div>
                </td>
                <td class="num">€{{ r.property.vpt | number:'1.0-0' }}</td>
                <td class="num">€{{ r.imi | number:'1.0-0' }}</td>
                <td class="num">
                  @if (r.aimiShare > 0) {
                    €{{ r.aimiShare | number:'1.0-0' }}
                  } @else {
                    <span class="ptl-dim">—</span>
                  }
                </td>
                <td class="num">€{{ r.irs | number:'1.0-0' }}</td>
                <td class="num"><strong>€{{ r.totalAnnual | number:'1.0-0' }}</strong></td>
                <td class="num">{{ r.burdenRatio | percent:'1.2-2' }}</td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr>
              <td><strong>Totais</strong></td>
              <td class="num"><strong>€{{ vptTotal() | number:'1.0-0' }}</strong></td>
              <td class="num"><strong>€{{ totalIMI() | number:'1.0-0' }}</strong></td>
              <td class="num"><strong>€{{ aimiColecta() | number:'1.0-0' }}</strong></td>
              <td class="num"><strong>€{{ totalIRS() | number:'1.0-0' }}</strong></td>
              <td class="num"><strong>€{{ totalAnnual() | number:'1.0-0' }}</strong></td>
              <td class="num"><strong>{{ portfolioBurdenRatio() | percent:'1.2-2' }}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>

      @if (saleProjection() || purchaseProjection()) {
        <div class="ptl-events">
          <h3 class="ptl-section-title">Eventos projectados (one-shot)</h3>
          <div class="ptl-event-grid">
            @if (saleProjection(); as sp) {
              <article class="ptl-event-card sale">
                <header class="ptl-event-head">
                  <span class="ptl-event-tag">Venda projectada</span>
                  <span class="ptl-event-title">{{ sp.address }}</span>
                </header>
                <ul class="ptl-event-body">
                  <li><span>Preço venda</span><strong>€{{ sp.salePrice | number:'1.0-0' }}</strong></li>
                  <li><span>Mais-valia bruta</span><strong>€{{ sp.maisValiaBruta | number:'1.0-0' }}</strong></li>
                  <li><span>Tributável (50% residente)</span><strong>€{{ sp.tributavel | number:'1.0-0' }}</strong></li>
                  <li><span>IRS Cat. G (28%)</span><strong>€{{ sp.colecta | number:'1.0-0' }}</strong></li>
                  <li><span>Líquido</span><strong>€{{ sp.liquido | number:'1.0-0' }}</strong></li>
                </ul>
              </article>
            }
            @if (purchaseProjection(); as pp) {
              <article class="ptl-event-card purchase">
                <header class="ptl-event-head">
                  <span class="ptl-event-tag">Compra projectada</span>
                  <span class="ptl-event-title">€{{ pp.value | number:'1.0-0' }} ({{ pp.finalidadeLabel }})</span>
                </header>
                <ul class="ptl-event-body">
                  <li><span>IMT</span><strong>€{{ pp.imt | number:'1.0-0' }}</strong></li>
                  <li><span>Imposto Selo (0.8%)</span><strong>€{{ pp.is | number:'1.0-0' }}</strong></li>
                  <li><span>Total impostos</span><strong>€{{ pp.totalImpostos | number:'1.0-0' }}</strong></li>
                  <li><span>% sobre valor</span><strong>{{ pp.taxaEfectiva | percent:'1.2-2' }}</strong></li>
                </ul>
              </article>
            }
          </div>
        </div>
      }

      <p class="ptl-footnote">
        Estimativa indicativa. IRS Cat. F: regime per-property do mock (autónoma 28% ou englobamento) aplicado ao líquido (renda − IMI − manutenção 0.5% − despesas dedutíveis). AIMI: dedução €600k singular sobre VPT total, progressivo 0.7%/1.0%/1.5%; share por propriedade prorata pelo VPT excedente. Mais-valias: residente 50%, taxa autónoma 28%; encargos não modelados aqui. IMT: tabelas 2026, sem isenção jovens. Não substitui simulação fiscal.
      </p>

    </section>
  `,
  styles: [`
    .ptl-root {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding: 1.5rem;
      background: var(--md-sys-color-surface, #fafafa);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      border-radius: 16px;
      font-family: var(--md-sys-typescale-body-medium-font, system-ui, sans-serif);
    }

    .ptl-header { display: flex; align-items: flex-start; justify-content: space-between; }
    .ptl-title {
      margin: 0; font-size: 1.5rem; font-weight: 500;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .ptl-subtitle {
      margin: .25rem 0 0; font-size: .875rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .ptl-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: .75rem;
    }
    .ptl-kpi {
      display: flex; flex-direction: column; gap: .25rem;
      padding: .875rem 1rem;
      background: var(--md-sys-color-surface-container, #f3edf7);
      border-radius: 12px;
    }
    .ptl-kpi.accent {
      background: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
    }
    .ptl-kpi-muted {
      opacity: .6;
    }
    .ptl-kpi-label {
      font-size: .75rem; text-transform: uppercase; letter-spacing: .05em;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .ptl-kpi.accent .ptl-kpi-label { color: inherit; opacity: .8; }
    .ptl-kpi-value { font-size: 1.25rem; font-weight: 500; }
    .ptl-kpi-sub { font-size: .75rem; opacity: .8; }

    .ptl-section-title {
      margin: 0 0 .75rem; font-size: 1rem; font-weight: 500;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .ptl-table-wrap {
      overflow-x: auto;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 12px;
    }
    .ptl-table {
      width: 100%; border-collapse: collapse; font-size: .875rem;
    }
    .ptl-table th, .ptl-table td {
      padding: .625rem .875rem; text-align: left;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .ptl-table th {
      font-weight: 500; font-size: .75rem;
      text-transform: uppercase; letter-spacing: .05em;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      background: var(--md-sys-color-surface-container, #f3edf7);
    }
    .ptl-table .num { text-align: right; font-variant-numeric: tabular-nums; }
    .ptl-table tbody tr:hover {
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
    }
    .ptl-table tfoot td {
      background: var(--md-sys-color-surface-container, #f3edf7);
      border-top: 2px solid var(--md-sys-color-outline, #79747e);
    }

    .ptl-address { font-weight: 500; }
    .ptl-neighbourhood {
      font-size: .75rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .ptl-dim {
      color: var(--md-sys-color-on-surface-variant, #49454f);
      opacity: .6;
    }

    .ptl-events { display: flex; flex-direction: column; gap: .75rem; }
    .ptl-event-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: .75rem;
    }
    .ptl-event-card {
      padding: 1rem;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 12px;
      border-left: 3px solid var(--md-sys-color-outline, #79747e);
      display: flex; flex-direction: column; gap: .5rem;
    }
    .ptl-event-card.sale {
      border-left-color: var(--md-sys-color-tertiary, #7d5260);
    }
    .ptl-event-card.purchase {
      border-left-color: var(--md-sys-color-primary, #6750a4);
    }
    .ptl-event-head { display: flex; flex-direction: column; gap: .125rem; }
    .ptl-event-tag {
      font-size: .6875rem; text-transform: uppercase; letter-spacing: .05em;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .ptl-event-title { font-weight: 500; font-size: .9375rem; }
    .ptl-event-body {
      list-style: none; margin: 0; padding: 0;
      display: flex; flex-direction: column; gap: .25rem;
    }
    .ptl-event-body li {
      display: flex; justify-content: space-between; align-items: baseline;
      font-size: .875rem;
    }

    .ptl-footnote {
      margin: 0; padding: 0 .25rem;
      font-size: .75rem; line-height: 1.5;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
  `],
})
export class PortfolioTaxLifecycleWidgetComponent {
  private readonly portfolio = inject(PortfolioMockService);

  /** Optional projected sale event (one-shot mais-valias estimate). */
  readonly projectedSale = input<ProjectedSaleInput | null>(null);

  /** Optional projected purchase event (one-shot IMT + IS estimate). */
  readonly projectedPurchase = input<ProjectedPurchaseInput | null>(null);

  // ─── Recurring annual aggregates ─────────────────────────────────────────

  readonly vptTotal = computed(() =>
    this.portfolio.properties().reduce((acc, p) => acc + p.vpt, 0),
  );

  readonly aimiDeducao = PT_AIMI_DEDUCAO_SINGULAR;

  /** True iff total VPT exceeds the singular dedução (AIMI applies). */
  readonly aimiTriggered = computed(() => this.vptTotal() > this.aimiDeducao);

  /** AIMI portfolio collecta computed progressively on (vptTotal − dedução). */
  readonly aimiColecta = computed(() => {
    if (!this.aimiTriggered()) return 0;
    return progressive(this.vptTotal() - this.aimiDeducao, PT_AIMI_TAXAS_2026);
  });

  /** Per-property burden rows. AIMI share is prorata over VPT excess. */
  readonly rows = computed<PropertyBurden[]>(() => {
    const props = this.portfolio.properties();
    const vptSum = this.vptTotal();
    const totalExcess = Math.max(0, vptSum - this.aimiDeducao);
    const aimi = this.aimiColecta();
    return props.map((p) => {
      const imi = p.vpt * p.imiTaxRate;
      const aimiShare = totalExcess > 0
        ? aimi * (Math.max(0, p.vpt) / vptSum)
        : 0;
      const irs = irsCatF(p);
      const totalAnnual = imi + aimiShare + irs;
      const burdenRatio = p.marketValue > 0 ? totalAnnual / p.marketValue : 0;
      return { property: p, imi, aimiShare, irs, totalAnnual, burdenRatio };
    });
  });

  readonly totalIMI = computed(() =>
    this.rows().reduce((acc, r) => acc + r.imi, 0),
  );

  readonly totalIRS = computed(() =>
    this.rows().reduce((acc, r) => acc + r.irs, 0),
  );

  readonly totalAnnual = computed(() =>
    this.totalIMI() + this.aimiColecta() + this.totalIRS(),
  );

  readonly totalAnnualRent = computed(() =>
    this.portfolio.properties().reduce((acc, p) => acc + p.lease.monthlyRent * 12, 0),
  );

  readonly taxOnRentRatio = computed(() => {
    const rent = this.totalAnnualRent();
    return rent > 0 ? this.totalAnnual() / rent : 0;
  });

  readonly portfolioBurdenRatio = computed(() => {
    const market = this.portfolio.totalMarketValue();
    return market > 0 ? this.totalAnnual() / market : 0;
  });

  // ─── Optional projected events ───────────────────────────────────────────

  readonly saleProjection = computed(() => {
    const s = this.projectedSale();
    if (!s) return null;
    const prop = this.portfolio.byId(s.propertyId);
    if (!prop) return null;
    const maisValiaBruta = Math.max(0, s.salePrice - prop.acquisitionValue);
    const tributavel = maisValiaBruta * PT_MV_QUOTA_RESIDENTE;
    const colecta = tributavel * PT_MV_TAXA_AUTONOMA;
    const liquido = s.salePrice - colecta;
    return {
      address: prop.address,
      salePrice: s.salePrice,
      maisValiaBruta,
      tributavel,
      colecta,
      liquido,
    };
  });

  readonly purchaseProjection = computed(() => {
    const p = this.projectedPurchase();
    if (!p) return null;
    const finalidade: IMTFinalidade = p.finalidade ?? 'outros';
    const table = finalidade === 'hpp' ? PT_IMT_HPP_2026 : PT_IMT_OUTROS_2026;
    const imt = progressive(p.value, table);
    const is = p.value * PT_IS_IMOVEL;
    const totalImpostos = imt + is;
    return {
      value: p.value,
      finalidade,
      finalidadeLabel: finalidade === 'hpp' ? 'HPP' : 'Outros fins',
      imt,
      is,
      totalImpostos,
      taxaEfectiva: p.value > 0 ? totalImpostos / p.value : 0,
    };
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function progressive(
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

function irsCatF(p: PortfolioProperty): number {
  const rendimentoBruto = p.lease.monthlyRent * 12;
  const imi = p.vpt * p.imiTaxRate;
  const manutencao = p.marketValue * MAINTENANCE_RATE;
  const liquido = Math.max(0, rendimentoBruto - imi - manutencao - p.annualDeductibleExpenses);
  if (p.irsRegime === 'taxaAutonoma28') {
    return liquido * PT_IRS_TAXA_AUTONOMA_CAT_F;
  }
  return progressive(liquido, PT_IRS_ESCALOES_2026);
}
