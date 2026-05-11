/**
 * @fileoverview PortfolioLifecycleWidgetComponent — Sprint 051
 *
 * Operational counterpart to PortfolioTaxLifecycleWidget (Sprint 049):
 * aggregates the *operational* lifecycle of the 8-property portfolio across
 * MoveIn / MoveOut / Inventory / Inspection dimensions. Closes the triangle
 * lifecycle × inventory × caução at portfolio scale.
 *
 * Per-property lifecycle stage is derived deterministically from the lease
 * status seeded in `PortfolioMockService` — no mutation of the singleton
 * checklist services (which model a single tenant transaction at a time).
 *
 * KPIs surfaced:
 *  - % move-in concluído across the portfolio
 *  - propriedades em move-out activo (NRAU art. 1098.º janela)
 *  - propriedades com delta de inventário detectado (wear / damage / loss)
 *  - dedução sugerida total (alimenta DepositReturnEstimator)
 *
 * Feature flag: PORTFOLIO_LIFECYCLE_WIDGET
 *
 * @example
 * <iu-portfolio-lifecycle />
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
  type PortfolioProperty,
} from '../../services/portfolio-mock.service';

export type LifecycleStage = 'move-in' | 'steady' | 'move-out';
export type InventoryDeltaSeverity = 'unchanged' | 'wear' | 'damage' | 'loss';

export interface LifecycleRow {
  property: PortfolioProperty;
  stage: LifecycleStage;
  moveInPct: number;            // 0..1 — checklist progress
  moveOutPct: number;           // 0..1 — only relevant when stage = 'move-out'
  inventoryItems: number;       // baseline itemised inventory count
  inventoryDeltaCount: number;  // items diverging from move-in baseline
  worstSeverity: InventoryDeltaSeverity;
  suggestedDeduction: number;   // EUR — feeds DepositReturnEstimator
}

const SEVERITY_ORDER: readonly InventoryDeltaSeverity[] = ['unchanged', 'wear', 'damage', 'loss'];

@Component({
  selector: 'iu-portfolio-lifecycle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DecimalPipe, PercentPipe],
  template: `
    <section class="pl-root">

      <header class="pl-header">
        <div>
          <h2 class="pl-title">Portfolio Operational Lifecycle</h2>
          <p class="pl-subtitle">
            Estado operacional agregado · {{ rows().length }} propriedades · move-in / inventário / move-out + caução
          </p>
        </div>
      </header>

      <div class="pl-summary">
        <div class="pl-kpi">
          <span class="pl-kpi-label">Move-in concluído</span>
          <span class="pl-kpi-value">{{ moveInCompletionPct() | percent:'1.0-0' }}</span>
          <span class="pl-kpi-sub">média ponderada da checklist activa</span>
        </div>
        <div class="pl-kpi" [class.pl-kpi-muted]="moveOutActiveCount() === 0">
          <span class="pl-kpi-label">Move-out activos</span>
          <span class="pl-kpi-value">{{ moveOutActiveCount() }}</span>
          <span class="pl-kpi-sub">
            @if (moveOutActiveCount() > 0) {
              janela NRAU 30-120 dias
            } @else {
              sem denúncias em curso
            }
          </span>
        </div>
        <div class="pl-kpi" [class.pl-kpi-muted]="inventoryDeltaCount() === 0">
          <span class="pl-kpi-label">Inventário · delta</span>
          <span class="pl-kpi-value">{{ inventoryDeltaCount() }}</span>
          <span class="pl-kpi-sub">propriedades com itens divergentes</span>
        </div>
        <div class="pl-kpi accent">
          <span class="pl-kpi-label">Dedução sugerida</span>
          <span class="pl-kpi-value">€{{ totalSuggestedDeduction() | number:'1.0-0' }}</span>
          <span class="pl-kpi-sub">soma das retenções estimadas (caução)</span>
        </div>
      </div>

      <div class="pl-table-wrap">
        <table class="pl-table" role="table">
          <thead>
            <tr>
              <th>Imóvel</th>
              <th>Stage</th>
              <th class="num">Move-in</th>
              <th class="num">Move-out</th>
              <th class="num">Inventário (Δ)</th>
              <th>Severidade</th>
              <th class="num">Dedução €</th>
            </tr>
          </thead>
          <tbody>
            @for (r of rows(); track r.property.id) {
              <tr>
                <td>
                  <div class="pl-address">{{ r.property.address }}</div>
                  <div class="pl-neighbourhood">{{ r.property.neighbourhood }} · {{ r.property.type }}</div>
                </td>
                <td>
                  <span class="pl-stage" [class]="'pl-stage-' + r.stage">
                    {{ stageLabel(r.stage) }}
                  </span>
                </td>
                <td class="num">{{ r.moveInPct | percent:'1.0-0' }}</td>
                <td class="num">
                  @if (r.stage === 'move-out') {
                    {{ r.moveOutPct | percent:'1.0-0' }}
                  } @else {
                    <span class="pl-dim">—</span>
                  }
                </td>
                <td class="num">
                  @if (r.inventoryDeltaCount > 0) {
                    {{ r.inventoryDeltaCount }} / {{ r.inventoryItems }}
                  } @else {
                    <span class="pl-dim">0 / {{ r.inventoryItems }}</span>
                  }
                </td>
                <td>
                  <span class="pl-sev" [class]="'pl-sev-' + r.worstSeverity">
                    {{ severityLabel(r.worstSeverity) }}
                  </span>
                </td>
                <td class="num">
                  @if (r.suggestedDeduction > 0) {
                    <strong>€{{ r.suggestedDeduction | number:'1.0-0' }}</strong>
                  } @else {
                    <span class="pl-dim">—</span>
                  }
                </td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr>
              <td><strong>Totais</strong></td>
              <td><strong>{{ moveOutActiveCount() }} move-out</strong></td>
              <td class="num"><strong>{{ moveInCompletionPct() | percent:'1.0-0' }}</strong></td>
              <td class="num"></td>
              <td class="num"><strong>{{ inventoryDeltaCount() }} props</strong></td>
              <td></td>
              <td class="num"><strong>€{{ totalSuggestedDeduction() | number:'1.0-0' }}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p class="pl-footnote">
        Estimativa indicativa. Stage derivado de <code>lease.status</code> do mock: <em>new</em> → move-in,
        <em>active/escalation_due</em> → steady, <em>ending</em> → move-out.
        Inventário baseline 15 itens (T2 PT) × propriedade, deltas seedados deterministicamente para mostrar
        cobertura de severidades. Dedução sugerida agrega <em>damage</em> + <em>loss</em> conforme padrão do
        <code>DepositReturnEstimator</code>; <em>wear</em> não conta. Não substitui inventário físico.
      </p>

    </section>
  `,
  styles: [`
    .pl-root {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding: 1.5rem;
      background: var(--md-sys-color-surface, #fafafa);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      border-radius: 16px;
      font-family: var(--md-sys-typescale-body-medium-font, system-ui, sans-serif);
    }

    .pl-header { display: flex; align-items: flex-start; justify-content: space-between; }
    .pl-title {
      margin: 0; font-size: 1.5rem; font-weight: 500;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .pl-subtitle {
      margin: .25rem 0 0; font-size: .875rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .pl-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: .75rem;
    }
    .pl-kpi {
      display: flex; flex-direction: column; gap: .25rem;
      padding: .875rem 1rem;
      background: var(--md-sys-color-surface-container, #f3edf7);
      border-radius: 12px;
    }
    .pl-kpi.accent {
      background: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
    }
    .pl-kpi-muted { opacity: .6; }
    .pl-kpi-label {
      font-size: .75rem; text-transform: uppercase; letter-spacing: .05em;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .pl-kpi.accent .pl-kpi-label { color: inherit; opacity: .8; }
    .pl-kpi-value { font-size: 1.25rem; font-weight: 500; }
    .pl-kpi-sub { font-size: .75rem; opacity: .8; }

    .pl-table-wrap {
      overflow-x: auto;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 12px;
    }
    .pl-table { width: 100%; border-collapse: collapse; font-size: .875rem; }
    .pl-table th, .pl-table td {
      padding: .625rem .875rem; text-align: left;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .pl-table th {
      font-weight: 500; font-size: .75rem;
      text-transform: uppercase; letter-spacing: .05em;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      background: var(--md-sys-color-surface-container, #f3edf7);
    }
    .pl-table .num { text-align: right; font-variant-numeric: tabular-nums; }
    .pl-table tbody tr:hover { background: var(--md-sys-color-surface-container-low, #f7f2fa); }
    .pl-table tfoot td {
      background: var(--md-sys-color-surface-container, #f3edf7);
      border-top: 2px solid var(--md-sys-color-outline, #79747e);
    }

    .pl-address { font-weight: 500; }
    .pl-neighbourhood {
      font-size: .75rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .pl-dim {
      color: var(--md-sys-color-on-surface-variant, #49454f);
      opacity: .6;
    }

    .pl-stage {
      display: inline-block;
      padding: .125rem .5rem;
      border-radius: 999px;
      font-size: .75rem;
      font-weight: 500;
      letter-spacing: .02em;
    }
    .pl-stage-move-in {
      background: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-on-secondary-container, #1d192b);
    }
    .pl-stage-steady {
      background: var(--md-sys-color-surface-container-high, #ece6f0);
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .pl-stage-move-out {
      background: var(--md-sys-color-tertiary-container, #ffd8e4);
      color: var(--md-sys-color-on-tertiary-container, #31111d);
    }

    .pl-sev {
      display: inline-block;
      padding: .125rem .5rem;
      border-radius: 999px;
      font-size: .75rem;
      font-weight: 500;
    }
    .pl-sev-unchanged {
      background: var(--md-sys-color-surface-container, #f3edf7);
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .pl-sev-wear {
      background: var(--md-sys-color-surface-container-high, #ece6f0);
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .pl-sev-damage {
      background: #ffe0b2;
      color: #6a3b00;
    }
    .pl-sev-loss {
      background: var(--md-sys-color-error-container, #f9dedc);
      color: var(--md-sys-color-on-error-container, #410e0b);
    }

    .pl-footnote {
      margin: 0; padding: 0 .25rem;
      font-size: .75rem; line-height: 1.5;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
  `],
})
export class PortfolioLifecycleWidgetComponent {
  private readonly portfolio = inject(PortfolioMockService);

  /** Per-property lifecycle row, derived deterministically from the mock seed. */
  readonly rows = computed<LifecycleRow[]>(() =>
    this.portfolio.properties().map((p) => buildRow(p)),
  );

  // ─── KPIs ───────────────────────────────────────────────────────────────

  /** Properties currently in active move-out (NRAU notice window). */
  readonly moveOutActiveCount = computed(() =>
    this.rows().filter(r => r.stage === 'move-out').length,
  );

  /** Properties with at least one inventory delta vs move-in baseline. */
  readonly inventoryDeltaCount = computed(() =>
    this.rows().filter(r => r.inventoryDeltaCount > 0).length,
  );

  /**
   * Mean move-in completion across properties currently in 'move-in' stage.
   * Steady/move-out properties are treated as 100% (move-in already done).
   */
  readonly moveInCompletionPct = computed(() => {
    const rows = this.rows();
    if (rows.length === 0) return 0;
    const sum = rows.reduce((acc, r) => acc + (r.stage === 'move-in' ? r.moveInPct : 1), 0);
    return sum / rows.length;
  });

  /** Suggested deduction total — feeds DepositReturnEstimator (caução side). */
  readonly totalSuggestedDeduction = computed(() =>
    this.rows().reduce((acc, r) => acc + r.suggestedDeduction, 0),
  );

  // ─── Template helpers ───────────────────────────────────────────────────

  stageLabel(s: LifecycleStage): string {
    if (s === 'move-in') return 'Move-in';
    if (s === 'move-out') return 'Move-out';
    return 'Steady';
  }

  severityLabel(s: InventoryDeltaSeverity): string {
    if (s === 'unchanged') return 'Sem delta';
    if (s === 'wear') return 'Desgaste';
    if (s === 'damage') return 'Estrago';
    return 'Perda';
  }
}

// ─── Pure helpers (no service mutation, deterministic per property) ─────────

function buildRow(p: PortfolioProperty): LifecycleRow {
  const stage = stageFromLease(p);
  const seed = hashId(p.id);

  // Move-in progress: full for steady/move-out; partial when newly leased.
  // Use the seed to spread new-leases across 30%/55%/80% completion buckets.
  const moveInPct = stage === 'move-in' ? [0.3, 0.55, 0.8][seed % 3] : 1;

  // Move-out progress (only meaningful when stage = 'move-out').
  const moveOutPct = stage === 'move-out' ? [0.4, 0.7][seed % 2] : 0;

  // Inventory baseline aligned with the PT T2 seed (15 items) used by
  // PropertyInventoryService. Slightly varies for T1/T3 to feel realistic.
  const inventoryItems = p.type === 'T3' ? 18 : p.type === 'T1' ? 12 : 15;

  // Deltas only matter near move-out (wear/damage manifest at end of lease).
  // Steady leases occasionally show wear from mid-term inspections.
  const { deltaCount, worst, deduction } = inventoryDelta(stage, seed, inventoryItems);

  return {
    property: p,
    stage,
    moveInPct,
    moveOutPct,
    inventoryItems,
    inventoryDeltaCount: deltaCount,
    worstSeverity: worst,
    suggestedDeduction: deduction,
  };
}

function stageFromLease(p: PortfolioProperty): LifecycleStage {
  switch (p.lease.status) {
    case 'new': return 'move-in';
    case 'ending': return 'move-out';
    default: return 'steady';
  }
}

function inventoryDelta(
  stage: LifecycleStage,
  seed: number,
  items: number,
): { deltaCount: number; worst: InventoryDeltaSeverity; deduction: number } {
  if (stage === 'move-in') {
    return { deltaCount: 0, worst: 'unchanged', deduction: 0 };
  }
  if (stage === 'steady') {
    // ~50% chance of mid-term wear visible during inspection.
    const has = seed % 2 === 0;
    return has
      ? { deltaCount: 1 + (seed % 2), worst: 'wear', deduction: 0 }
      : { deltaCount: 0, worst: 'unchanged', deduction: 0 };
  }
  // move-out: cycle through wear/damage/loss for KPI variety.
  const sevIdx = (seed % 3) + 1; // 1..3 → wear / damage / loss
  const worst = SEVERITY_ORDER[sevIdx];
  const deltaCount = Math.min(items, 2 + (seed % 4));
  // Suggested deduction: damage = €120/item, loss = €280/item, wear = €0.
  const perItem = worst === 'loss' ? 280 : worst === 'damage' ? 120 : 0;
  // Roughly half the delta items contribute to the worst-severity tally.
  const billable = Math.max(1, Math.floor(deltaCount / 2));
  return { deltaCount, worst, deduction: perItem * billable };
}

/** Tiny stable hash — seedable bucketing for deterministic mock variety. */
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}
