/**
 * @fileoverview PortfolioFiscalSummaryComponent — Sprint 045 (2/3)
 *
 * Dashboard consumer that aggregates per-property IRS Categoria F
 * outputs over the whole portfolio. For each property, computes:
 *   - Rendimento bruto anual (12 × monthlyRent)
 *   - Despesas dedutíveis = IMI (vpt × imiTaxRate) + manutenção
 *     estimada (~0.5% marketValue) + annualDeductibleExpenses
 *   - Rendimento líquido = bruto − despesas
 *   - IRS estimado no regime atual (taxa autónoma 28% ou
 *     englobamento ao escalão correspondente do líquido)
 *
 * Aggregates: total bruto, total dedutível, total líquido, IRS total,
 * taxa efectiva ponderada. Comparação side-by-side: cenário actual vs
 * "todas em englobamento" vs "todas em taxa autónoma" — recomendação
 * portfolio-wide.
 *
 * Surfaces calculators de Sprint 042 (TaxStatement), Sprint 043 (IMI),
 * Sprint 044 (IRSCategoriaF) numa única vista agregada.
 *
 * Feature flag: PORTFOLIO_FISCAL_SUMMARY
 *
 * @example
 * <iu-portfolio-fiscal-summary />
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { CommonModule, DecimalPipe, PercentPipe } from '@angular/common';
import {
  PortfolioMockService,
  type IRSRegime,
  type PortfolioProperty,
} from '../../services/portfolio-mock.service';
import {
  PT_IRS_ESCALOES_2026,
  PT_IRS_TAXA_AUTONOMA_CAT_F,
} from '../../services/irs-categoria-f.service';

interface FiscalRow {
  property: PortfolioProperty;
  rendimentoBruto: number;
  imi: number;
  manutencao: number;
  outrasDespesas: number;
  totalDespesas: number;
  rendimentoLiquido: number;
  regime: IRSRegime;
  irsTaxaAutonoma: number;
  irsEnglobamento: number;
  irsActual: number;
  taxaEfectivaActual: number;
}

interface RegimeScenario {
  regime: IRSRegime | 'mix';
  label: string;
  totalIRS: number;
  taxaEfectiva: number;
}

const MAINTENANCE_RATE = 0.005;

@Component({
  selector: 'iu-portfolio-fiscal-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DecimalPipe, PercentPipe],
  template: `
    <section class="pfs-root">

      <header class="pfs-header">
        <div>
          <h2 class="pfs-title">Portfolio Fiscal Summary</h2>
          <p class="pfs-subtitle">
            IRS Cat. F anual agregado · {{ rows().length }} propriedades · IRS escalões 2026
          </p>
        </div>
      </header>

      <div class="pfs-summary">
        <div class="pfs-kpi">
          <span class="pfs-kpi-label">Rendimento bruto anual</span>
          <span class="pfs-kpi-value">€{{ totalBruto() | number:'1.0-0' }}</span>
        </div>
        <div class="pfs-kpi">
          <span class="pfs-kpi-label">Despesas dedutíveis</span>
          <span class="pfs-kpi-value">€{{ totalDespesas() | number:'1.0-0' }}</span>
        </div>
        <div class="pfs-kpi">
          <span class="pfs-kpi-label">Rendimento líquido</span>
          <span class="pfs-kpi-value">€{{ totalLiquido() | number:'1.0-0' }}</span>
        </div>
        <div class="pfs-kpi accent">
          <span class="pfs-kpi-label">IRS total estimado</span>
          <span class="pfs-kpi-value">€{{ totalIRSActual() | number:'1.0-0' }}</span>
          <span class="pfs-kpi-sub">
            taxa efectiva {{ taxaEfectivaPonderada() | percent:'1.2-2' }}
          </span>
        </div>
      </div>

      <div class="pfs-scenarios">
        <h3 class="pfs-section-title">Comparação por cenário portfolio-wide</h3>
        <div class="pfs-scenario-grid">
          @for (s of scenarios(); track s.regime) {
            <div
              class="pfs-scenario-card"
              [class.recommended]="s.regime === recommendedRegime()"
              [class.current]="s.regime === 'mix'"
            >
              <header class="pfs-scenario-head">
                <span class="pfs-scenario-label">{{ s.label }}</span>
                @if (s.regime === recommendedRegime()) {
                  <span class="pfs-scenario-badge">Recomendado</span>
                } @else if (s.regime === 'mix') {
                  <span class="pfs-scenario-badge muted">Actual</span>
                }
              </header>
              <div class="pfs-scenario-body">
                <div class="pfs-scenario-line">
                  <span>IRS total</span>
                  <strong>€{{ s.totalIRS | number:'1.0-0' }}</strong>
                </div>
                <div class="pfs-scenario-line">
                  <span>Taxa efectiva</span>
                  <strong>{{ s.taxaEfectiva | percent:'1.2-2' }}</strong>
                </div>
                <div class="pfs-scenario-line delta">
                  <span>Δ vs actual</span>
                  <strong [class.pfs-delta-positive]="s.totalIRS < totalIRSActual()" [class.pfs-delta-negative]="s.totalIRS > totalIRSActual()">
                    {{ s.totalIRS === totalIRSActual() ? '—' : (s.totalIRS - totalIRSActual() | number:'1.0-0') }}
                    @if (s.totalIRS !== totalIRSActual()) { € }
                  </strong>
                </div>
              </div>
            </div>
          }
        </div>
        @if (recommendation()) {
          <p class="pfs-recommendation">
            <strong>Recomendação:</strong> {{ recommendation() }}
          </p>
        }
      </div>

      <div class="pfs-table-wrap">
        <table class="pfs-table" role="table">
          <thead>
            <tr>
              <th>Imóvel</th>
              <th class="num">Bruto</th>
              <th class="num">IMI</th>
              <th class="num">Manut.</th>
              <th class="num">Outras desp.</th>
              <th class="num">Líquido</th>
              <th>Regime</th>
              <th class="num">IRS estim.</th>
              <th class="num">Taxa efect.</th>
            </tr>
          </thead>
          <tbody>
            @for (r of rows(); track r.property.id) {
              <tr>
                <td>
                  <div class="pfs-address">{{ r.property.address }}</div>
                  <div class="pfs-neighbourhood">{{ r.property.neighbourhood }} · {{ r.property.type }}</div>
                </td>
                <td class="num">€{{ r.rendimentoBruto | number:'1.0-0' }}</td>
                <td class="num">€{{ r.imi | number:'1.0-0' }}</td>
                <td class="num">€{{ r.manutencao | number:'1.0-0' }}</td>
                <td class="num">€{{ r.outrasDespesas | number:'1.0-0' }}</td>
                <td class="num"><strong>€{{ r.rendimentoLiquido | number:'1.0-0' }}</strong></td>
                <td>
                  <span class="pfs-regime" [class.englobamento]="r.regime === 'englobamento'">
                    {{ r.regime === 'taxaAutonoma28' ? 'Autónoma 28%' : 'Englobamento' }}
                  </span>
                </td>
                <td class="num"><strong>€{{ r.irsActual | number:'1.0-0' }}</strong></td>
                <td class="num">{{ r.taxaEfectivaActual | percent:'1.2-2' }}</td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr>
              <td><strong>Totais</strong></td>
              <td class="num"><strong>€{{ totalBruto() | number:'1.0-0' }}</strong></td>
              <td class="num"><strong>€{{ totalIMI() | number:'1.0-0' }}</strong></td>
              <td class="num"><strong>€{{ totalManutencao() | number:'1.0-0' }}</strong></td>
              <td class="num"><strong>€{{ totalOutrasDespesas() | number:'1.0-0' }}</strong></td>
              <td class="num"><strong>€{{ totalLiquido() | number:'1.0-0' }}</strong></td>
              <td></td>
              <td class="num"><strong>€{{ totalIRSActual() | number:'1.0-0' }}</strong></td>
              <td class="num"><strong>{{ taxaEfectivaPonderada() | percent:'1.2-2' }}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p class="pfs-footnote">
        Despesas estimadas: IMI = VPT × taxa concelho · manutenção ≈ 0.5%/ano do valor de mercado · "outras despesas" = annualDeductibleExpenses do mock.
        IRS Cat. F: regime "taxa autónoma 28%" (CIRS art. 72.º) ou "englobamento" aplicado ao líquido na tabela progressiva 2026 (sem outros rendimentos). Não substitui simulação fiscal real.
      </p>

    </section>
  `,
  styles: [`
    .pfs-root {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding: 1.5rem;
      background: var(--md-sys-color-surface, #fafafa);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      border-radius: 16px;
      font-family: var(--md-sys-typescale-body-medium-font, system-ui, sans-serif);
    }

    .pfs-header { display: flex; align-items: flex-start; justify-content: space-between; }
    .pfs-title {
      margin: 0; font-size: 1.5rem; font-weight: 500;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .pfs-subtitle {
      margin: .25rem 0 0; font-size: .875rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .pfs-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: .75rem;
    }
    .pfs-kpi {
      display: flex; flex-direction: column; gap: .25rem;
      padding: .875rem 1rem;
      background: var(--md-sys-color-surface-container, #f3edf7);
      border-radius: 12px;
    }
    .pfs-kpi.accent {
      background: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
    }
    .pfs-kpi-label {
      font-size: .75rem; text-transform: uppercase; letter-spacing: .05em;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .pfs-kpi.accent .pfs-kpi-label { color: inherit; opacity: .8; }
    .pfs-kpi-value { font-size: 1.25rem; font-weight: 500; }
    .pfs-kpi-sub { font-size: .75rem; opacity: .8; }

    .pfs-section-title {
      margin: 0 0 .75rem; font-size: 1rem; font-weight: 500;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .pfs-scenario-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: .75rem;
    }
    .pfs-scenario-card {
      padding: 1rem;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 12px;
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      display: flex; flex-direction: column; gap: .5rem;
    }
    .pfs-scenario-card.recommended {
      border-color: var(--md-sys-color-primary, #6750a4);
      background: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
    }
    .pfs-scenario-card.current {
      background: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-on-secondary-container, #1d192b);
    }
    .pfs-scenario-card.recommended.current {
      background: var(--md-sys-color-primary-container, #eaddff);
    }

    .pfs-scenario-head {
      display: flex; align-items: center; justify-content: space-between;
      gap: .5rem;
    }
    .pfs-scenario-label { font-weight: 500; font-size: .9375rem; }
    .pfs-scenario-badge {
      font-size: .6875rem; padding: .125rem .5rem; border-radius: 999px;
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
    }
    .pfs-scenario-badge.muted {
      background: var(--md-sys-color-outline, #79747e);
    }
    .pfs-scenario-line {
      display: flex; justify-content: space-between; align-items: baseline;
      font-size: .875rem;
    }
    .pfs-scenario-line.delta { font-size: .8125rem; }
    .pfs-delta-positive { color: #1f7a1f; }
    .pfs-delta-negative { color: #b3261e; }

    .pfs-recommendation {
      margin: .75rem 0 0; padding: .75rem 1rem;
      background: var(--md-sys-color-surface-container, #f3edf7);
      border-left: 3px solid var(--md-sys-color-primary, #6750a4);
      border-radius: 8px;
      font-size: .875rem; line-height: 1.5;
    }

    .pfs-table-wrap {
      overflow-x: auto;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 12px;
    }
    .pfs-table {
      width: 100%; border-collapse: collapse; font-size: .875rem;
    }
    .pfs-table th, .pfs-table td {
      padding: .625rem .875rem; text-align: left;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .pfs-table th {
      font-weight: 500; font-size: .75rem;
      text-transform: uppercase; letter-spacing: .05em;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      background: var(--md-sys-color-surface-container, #f3edf7);
    }
    .pfs-table .num { text-align: right; font-variant-numeric: tabular-nums; }
    .pfs-table tbody tr:hover {
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
    }
    .pfs-table tfoot td {
      background: var(--md-sys-color-surface-container, #f3edf7);
      border-top: 2px solid var(--md-sys-color-outline, #79747e);
    }

    .pfs-address { font-weight: 500; }
    .pfs-neighbourhood {
      font-size: .75rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .pfs-regime {
      display: inline-block;
      padding: .125rem .5rem;
      background: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-on-secondary-container, #1d192b);
      border-radius: 999px;
      font-size: .75rem; font-weight: 500;
    }
    .pfs-regime.englobamento {
      background: var(--md-sys-color-tertiary-container, #ffd8e4);
      color: var(--md-sys-color-on-tertiary-container, #31111d);
    }

    .pfs-footnote {
      margin: 0; padding: 0 .25rem;
      font-size: .75rem; line-height: 1.5;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
  `],
})
export class PortfolioFiscalSummaryComponent {
  private readonly portfolio = inject(PortfolioMockService);

  readonly rows = computed<FiscalRow[]>(() =>
    this.portfolio.properties().map((p) => this.computeRow(p)),
  );

  readonly totalBruto = computed(() =>
    this.rows().reduce((acc, r) => acc + r.rendimentoBruto, 0),
  );
  readonly totalIMI = computed(() =>
    this.rows().reduce((acc, r) => acc + r.imi, 0),
  );
  readonly totalManutencao = computed(() =>
    this.rows().reduce((acc, r) => acc + r.manutencao, 0),
  );
  readonly totalOutrasDespesas = computed(() =>
    this.rows().reduce((acc, r) => acc + r.outrasDespesas, 0),
  );
  readonly totalDespesas = computed(() =>
    this.totalIMI() + this.totalManutencao() + this.totalOutrasDespesas(),
  );
  readonly totalLiquido = computed(() =>
    this.rows().reduce((acc, r) => acc + r.rendimentoLiquido, 0),
  );

  readonly totalIRSActual = computed(() =>
    this.rows().reduce((acc, r) => acc + r.irsActual, 0),
  );
  readonly totalIRSAllAutonoma = computed(() =>
    this.rows().reduce((acc, r) => acc + r.irsTaxaAutonoma, 0),
  );
  readonly totalIRSAllEnglobamento = computed(() =>
    this.rows().reduce((acc, r) => acc + r.irsEnglobamento, 0),
  );

  readonly taxaEfectivaPonderada = computed(() => {
    const liq = this.totalLiquido();
    return liq > 0 ? this.totalIRSActual() / liq : 0;
  });

  readonly scenarios = computed<RegimeScenario[]>(() => {
    const liq = this.totalLiquido();
    const safeRate = (irs: number) => (liq > 0 ? irs / liq : 0);
    return [
      {
        regime: 'mix',
        label: 'Configuração actual (mix)',
        totalIRS: this.totalIRSActual(),
        taxaEfectiva: safeRate(this.totalIRSActual()),
      },
      {
        regime: 'taxaAutonoma28',
        label: 'Todas em taxa autónoma 28%',
        totalIRS: this.totalIRSAllAutonoma(),
        taxaEfectiva: safeRate(this.totalIRSAllAutonoma()),
      },
      {
        regime: 'englobamento',
        label: 'Todas em englobamento',
        totalIRS: this.totalIRSAllEnglobamento(),
        taxaEfectiva: safeRate(this.totalIRSAllEnglobamento()),
      },
    ];
  });

  readonly recommendedRegime = computed<IRSRegime | 'mix'>(() => {
    const list = this.scenarios();
    return list.reduce((best, s) => (s.totalIRS < best.totalIRS ? s : best), list[0]).regime;
  });

  readonly recommendation = computed<string>(() => {
    const best = this.recommendedRegime();
    const actual = this.totalIRSActual();
    if (best === 'mix') {
      return 'A configuração actual já é a fiscalmente mais eficiente — manter regime per-property como está.';
    }
    const bestTotal =
      best === 'taxaAutonoma28' ? this.totalIRSAllAutonoma() : this.totalIRSAllEnglobamento();
    const saving = actual - bestTotal;
    if (saving <= 0) return '';
    const label = best === 'taxaAutonoma28' ? 'taxa autónoma 28%' : 'englobamento';
    return `Migrar todas as propriedades para ${label} pouparia ~€${Math.round(saving).toLocaleString('pt-PT')} de IRS anual face à configuração actual.`;
  });

  private computeRow(p: PortfolioProperty): FiscalRow {
    const rendimentoBruto = p.lease.monthlyRent * 12;
    const imi = p.vpt * p.imiTaxRate;
    const manutencao = p.marketValue * MAINTENANCE_RATE;
    const outrasDespesas = p.annualDeductibleExpenses;
    const totalDespesas = imi + manutencao + outrasDespesas;
    const rendimentoLiquido = Math.max(0, rendimentoBruto - totalDespesas);

    const irsTaxaAutonoma = rendimentoLiquido * PT_IRS_TAXA_AUTONOMA_CAT_F;
    const irsEnglobamento = applyProgressive(rendimentoLiquido, PT_IRS_ESCALOES_2026);
    const irsActual = p.irsRegime === 'taxaAutonoma28' ? irsTaxaAutonoma : irsEnglobamento;
    const taxaEfectivaActual = rendimentoLiquido > 0 ? irsActual / rendimentoLiquido : 0;

    return {
      property: p,
      rendimentoBruto,
      imi,
      manutencao,
      outrasDespesas,
      totalDespesas,
      rendimentoLiquido,
      regime: p.irsRegime,
      irsTaxaAutonoma,
      irsEnglobamento,
      irsActual,
      taxaEfectivaActual,
    };
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
