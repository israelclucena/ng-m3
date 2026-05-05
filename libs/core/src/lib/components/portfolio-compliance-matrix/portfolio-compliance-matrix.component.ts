/**
 * @fileoverview PortfolioComplianceMatrixComponent — Sprint 045 (3/3)
 *
 * Property × dimension compliance matrix surfacing legal & contractual
 * status per property:
 *   - Energy certificate (DL 118/2013, ADENE)
 *   - Insurance (multirriscos / RC) — uses Insurance.state from mock
 *   - Lease lifecycle (escalation due / ending)
 *
 * Cells colour-coded ok/warning/expired. Aggregate rows compute %
 * portfolio compliance per dimension and a count of priority actions
 * (renewals/validations) sorted by urgency. Surfaces de Sprint 042
 * (InsuranceTrackerService), Sprint 043 (InsuranceTrackerComponent),
 * Sprint 044 (EnergyCertificateChecker) numa vista matricial.
 *
 * Feature flag: PORTFOLIO_COMPLIANCE_MATRIX
 *
 * @example
 * <iu-portfolio-compliance-matrix />
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
  type ComplianceState,
  type PortfolioProperty,
} from '../../services/portfolio-mock.service';

type LeaseFlag = 'ok' | 'escalation_due' | 'ending';

interface ComplianceRow {
  property: PortfolioProperty;
  energy: ComplianceState;
  energyDaysToExpiry: number;
  insurance: ComplianceState;
  insuranceDaysToExpiry: number;
  lease: LeaseFlag;
  worst: ComplianceState;
}

interface ActionItem {
  propertyId: string;
  address: string;
  dimension: 'Energy' | 'Insurance' | 'Lease';
  severity: 'critical' | 'soon';
  message: string;
  daysUntil: number;
}

const TODAY_ISO = '2026-05-05';
const WARNING_WINDOW_DAYS = 60;

@Component({
  selector: 'iu-portfolio-compliance-matrix',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DecimalPipe, PercentPipe],
  template: `
    <section class="pcm-root">

      <header class="pcm-header">
        <div>
          <h2 class="pcm-title">Portfolio Compliance Matrix</h2>
          <p class="pcm-subtitle">
            Conformidade legal e contratual · {{ rows().length }} propriedades · janela de aviso {{ warningWindow }} dias
          </p>
        </div>
      </header>

      <div class="pcm-summary">
        <div class="pcm-kpi">
          <span class="pcm-kpi-label">Energia OK</span>
          <span class="pcm-kpi-value">
            {{ energyOk() }}/{{ rows().length }}
            <span class="pcm-kpi-pct">({{ energyOkRate() | percent:'1.0-0' }})</span>
          </span>
        </div>
        <div class="pcm-kpi">
          <span class="pcm-kpi-label">Seguros OK</span>
          <span class="pcm-kpi-value">
            {{ insuranceOk() }}/{{ rows().length }}
            <span class="pcm-kpi-pct">({{ insuranceOkRate() | percent:'1.0-0' }})</span>
          </span>
        </div>
        <div class="pcm-kpi">
          <span class="pcm-kpi-label">Contratos sem alerta</span>
          <span class="pcm-kpi-value">
            {{ leaseOk() }}/{{ rows().length }}
            <span class="pcm-kpi-pct">({{ leaseOkRate() | percent:'1.0-0' }})</span>
          </span>
        </div>
        <div class="pcm-kpi accent">
          <span class="pcm-kpi-label">Acções pendentes</span>
          <span class="pcm-kpi-value">{{ actions().length }}</span>
          <span class="pcm-kpi-sub">{{ criticalActions() }} críticas · {{ soonActions() }} <{{ warningWindow }}d</span>
        </div>
      </div>

      <div class="pcm-table-wrap">
        <table class="pcm-table" role="table">
          <thead>
            <tr>
              <th>Imóvel</th>
              <th class="cell">Cert. Energético</th>
              <th class="cell">Seguro</th>
              <th class="cell">Contrato</th>
              <th>Pior estado</th>
            </tr>
          </thead>
          <tbody>
            @for (r of rows(); track r.property.id) {
              <tr>
                <td>
                  <div class="pcm-address">{{ r.property.address }}</div>
                  <div class="pcm-neighbourhood">{{ r.property.neighbourhood }} · {{ r.property.type }}</div>
                </td>
                <td class="cell">
                  <span class="pcm-state" [attr.data-state]="r.energy">
                    {{ stateLabel(r.energy) }}
                    @if (r.energy !== 'expired') {
                      <span class="pcm-state-sub">
                        {{ r.energyDaysToExpiry > 0 ? r.energyDaysToExpiry + 'd' : 'expirado' }}
                      </span>
                    }
                  </span>
                  <div class="pcm-cell-detail">{{ r.property.energy.classe }} · até {{ r.property.energy.validUntil }}</div>
                </td>
                <td class="cell">
                  <span class="pcm-state" [attr.data-state]="r.insurance">
                    {{ stateLabel(r.insurance) }}
                    @if (r.insurance !== 'expired') {
                      <span class="pcm-state-sub">
                        {{ r.insuranceDaysToExpiry > 0 ? r.insuranceDaysToExpiry + 'd' : 'expirado' }}
                      </span>
                    }
                  </span>
                  <div class="pcm-cell-detail">{{ r.property.insurance.provider }} · até {{ r.property.insurance.validUntil }}</div>
                </td>
                <td class="cell">
                  <span class="pcm-state" [attr.data-state]="leaseStateColor(r.lease)">
                    {{ leaseLabel(r.lease) }}
                  </span>
                  <div class="pcm-cell-detail">renda €{{ r.property.lease.monthlyRent | number:'1.0-0' }}/mês · {{ r.property.lease.status }}</div>
                </td>
                <td>
                  <span class="pcm-state" [attr.data-state]="r.worst">
                    {{ stateLabel(r.worst) }}
                  </span>
                </td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr>
              <td><strong>% Compliance</strong></td>
              <td class="cell"><strong>{{ energyOkRate() | percent:'1.0-0' }}</strong></td>
              <td class="cell"><strong>{{ insuranceOkRate() | percent:'1.0-0' }}</strong></td>
              <td class="cell"><strong>{{ leaseOkRate() | percent:'1.0-0' }}</strong></td>
              <td><strong>{{ overallOkRate() | percent:'1.0-0' }}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div class="pcm-actions">
        <h3 class="pcm-section-title">Acções prioritárias</h3>
        @if (actions().length === 0) {
          <p class="pcm-empty">Sem acções pendentes — portfolio em conformidade.</p>
        } @else {
          <ul class="pcm-action-list">
            @for (a of actions(); track a.propertyId + a.dimension) {
              <li class="pcm-action-item" [attr.data-severity]="a.severity">
                <div class="pcm-action-head">
                  <span class="pcm-action-dim">{{ a.dimension }}</span>
                  <span class="pcm-action-sev" [attr.data-severity]="a.severity">
                    {{ a.severity === 'critical' ? 'Crítico' : 'Em ' + a.daysUntil + ' dias' }}
                  </span>
                </div>
                <div class="pcm-action-body">
                  <strong>{{ a.address }}</strong> — {{ a.message }}
                </div>
              </li>
            }
          </ul>
        }
      </div>

      <p class="pcm-footnote">
        Estados: <strong>OK</strong> válido > {{ warningWindow }}d · <strong>Aviso</strong> expira em ≤ {{ warningWindow }}d · <strong>Expirado</strong> sem cobertura.
        Energia ref. DL 118/2013 (multa 250–3740€ sem CE válido). Seguro multirriscos obrigatório em arrendamento (NRAU).
      </p>

    </section>
  `,
  styles: [`
    .pcm-root {
      display: flex; flex-direction: column; gap: 1.25rem;
      padding: 1.5rem;
      background: var(--md-sys-color-surface, #fafafa);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      border-radius: 16px;
      font-family: var(--md-sys-typescale-body-medium-font, system-ui, sans-serif);
    }

    .pcm-header { display: flex; align-items: flex-start; justify-content: space-between; }
    .pcm-title { margin: 0; font-size: 1.5rem; font-weight: 500; }
    .pcm-subtitle {
      margin: .25rem 0 0; font-size: .875rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .pcm-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: .75rem;
    }
    .pcm-kpi {
      display: flex; flex-direction: column; gap: .25rem;
      padding: .875rem 1rem;
      background: var(--md-sys-color-surface-container, #f3edf7);
      border-radius: 12px;
    }
    .pcm-kpi.accent {
      background: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
    }
    .pcm-kpi-label {
      font-size: .75rem; text-transform: uppercase; letter-spacing: .05em;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .pcm-kpi.accent .pcm-kpi-label { color: inherit; opacity: .8; }
    .pcm-kpi-value { font-size: 1.25rem; font-weight: 500; }
    .pcm-kpi-pct { font-size: .875rem; opacity: .75; margin-left: .25rem; }
    .pcm-kpi-sub { font-size: .75rem; opacity: .8; }

    .pcm-table-wrap {
      overflow-x: auto;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 12px;
    }
    .pcm-table { width: 100%; border-collapse: collapse; font-size: .875rem; }
    .pcm-table th, .pcm-table td {
      padding: .625rem .875rem; text-align: left;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .pcm-table th {
      font-weight: 500; font-size: .75rem;
      text-transform: uppercase; letter-spacing: .05em;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      background: var(--md-sys-color-surface-container, #f3edf7);
    }
    .pcm-table th.cell, .pcm-table td.cell { text-align: center; }
    .pcm-table tfoot td {
      background: var(--md-sys-color-surface-container, #f3edf7);
      border-top: 2px solid var(--md-sys-color-outline, #79747e);
    }

    .pcm-address { font-weight: 500; }
    .pcm-neighbourhood {
      font-size: .75rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .pcm-cell-detail {
      margin-top: .25rem; font-size: .6875rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .pcm-state {
      display: inline-flex; align-items: center; gap: .25rem;
      padding: .1875rem .625rem;
      border-radius: 999px;
      font-size: .75rem; font-weight: 500;
      background: #e6f4ea; color: #0f5132;
    }
    .pcm-state[data-state='warning'] { background: #fff4ce; color: #614500; }
    .pcm-state[data-state='expired'] { background: #fde7e9; color: #842029; }
    .pcm-state-sub {
      font-size: .6875rem; opacity: .75; font-weight: 400;
    }

    .pcm-section-title {
      margin: 0 0 .75rem; font-size: 1rem; font-weight: 500;
    }
    .pcm-empty {
      margin: 0; padding: 1rem;
      background: var(--md-sys-color-surface-container, #f3edf7);
      border-radius: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: .875rem;
    }
    .pcm-action-list {
      list-style: none; margin: 0; padding: 0;
      display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: .625rem;
    }
    .pcm-action-item {
      padding: .75rem .875rem;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 10px;
      border-left: 3px solid #614500;
    }
    .pcm-action-item[data-severity='critical'] { border-left-color: #842029; }
    .pcm-action-head {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: .375rem;
    }
    .pcm-action-dim {
      font-size: .6875rem; text-transform: uppercase; letter-spacing: .05em;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .pcm-action-sev {
      font-size: .6875rem; padding: .0625rem .5rem;
      border-radius: 999px; background: #fff4ce; color: #614500;
    }
    .pcm-action-sev[data-severity='critical'] { background: #fde7e9; color: #842029; }
    .pcm-action-body { font-size: .875rem; line-height: 1.4; }

    .pcm-footnote {
      margin: 0; padding: 0 .25rem;
      font-size: .75rem; line-height: 1.5;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
  `],
})
export class PortfolioComplianceMatrixComponent {
  private readonly portfolio = inject(PortfolioMockService);

  readonly warningWindow = WARNING_WINDOW_DAYS;

  readonly rows = computed<ComplianceRow[]>(() =>
    this.portfolio.properties().map((p) => this.computeRow(p)),
  );

  readonly energyOk = computed(() => this.rows().filter((r) => r.energy === 'ok').length);
  readonly insuranceOk = computed(() => this.rows().filter((r) => r.insurance === 'ok').length);
  readonly leaseOk = computed(() => this.rows().filter((r) => r.lease === 'ok').length);

  readonly energyOkRate = computed(() => this.safeRate(this.energyOk()));
  readonly insuranceOkRate = computed(() => this.safeRate(this.insuranceOk()));
  readonly leaseOkRate = computed(() => this.safeRate(this.leaseOk()));

  readonly overallOkRate = computed(() => {
    const total = this.rows().length;
    if (total === 0) return 0;
    return this.rows().filter((r) => r.worst === 'ok' && r.lease === 'ok').length / total;
  });

  readonly actions = computed<ActionItem[]>(() => {
    const list: ActionItem[] = [];
    for (const r of this.rows()) {
      if (r.energy === 'expired') {
        list.push({
          propertyId: r.property.id,
          address: r.property.address,
          dimension: 'Energy',
          severity: 'critical',
          message: `Certificado energético expirado (${r.property.energy.validUntil}). Renovar via técnico ADENE — multa 250–3740€.`,
          daysUntil: 0,
        });
      } else if (r.energy === 'warning') {
        list.push({
          propertyId: r.property.id,
          address: r.property.address,
          dimension: 'Energy',
          severity: 'soon',
          message: `Cert. energético expira em ${r.energyDaysToExpiry}d (${r.property.energy.validUntil}). Agendar perito ADENE.`,
          daysUntil: r.energyDaysToExpiry,
        });
      }
      if (r.insurance === 'expired') {
        list.push({
          propertyId: r.property.id,
          address: r.property.address,
          dimension: 'Insurance',
          severity: 'critical',
          message: `Apólice ${r.property.insurance.provider} expirada (${r.property.insurance.validUntil}). Sem cobertura — risco contratual.`,
          daysUntil: 0,
        });
      } else if (r.insurance === 'warning') {
        list.push({
          propertyId: r.property.id,
          address: r.property.address,
          dimension: 'Insurance',
          severity: 'soon',
          message: `Seguro ${r.property.insurance.provider} expira em ${r.insuranceDaysToExpiry}d (${r.property.insurance.validUntil}). Renovar.`,
          daysUntil: r.insuranceDaysToExpiry,
        });
      }
      if (r.lease === 'escalation_due') {
        list.push({
          propertyId: r.property.id,
          address: r.property.address,
          dimension: 'Lease',
          severity: 'soon',
          message: `Actualização anual de renda devida em ${r.property.lease.nextEscalationDue}. Aplicar coeficiente NRAU art. 24.º.`,
          daysUntil: this.daysBetween(TODAY_ISO, r.property.lease.nextEscalationDue),
        });
      } else if (r.lease === 'ending') {
        list.push({
          propertyId: r.property.id,
          address: r.property.address,
          dimension: 'Lease',
          severity: 'soon',
          message: `Contrato em fim de vigência. Decidir renovação ou cessação ≥120d antes de ${r.property.lease.nextEscalationDue}.`,
          daysUntil: this.daysBetween(TODAY_ISO, r.property.lease.nextEscalationDue),
        });
      }
    }
    return list.sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1;
      return a.daysUntil - b.daysUntil;
    });
  });

  readonly criticalActions = computed(() => this.actions().filter((a) => a.severity === 'critical').length);
  readonly soonActions = computed(() => this.actions().filter((a) => a.severity === 'soon').length);

  stateLabel(state: ComplianceState): string {
    switch (state) {
      case 'ok': return 'OK';
      case 'warning': return 'Aviso';
      case 'expired': return 'Expirado';
    }
  }

  leaseLabel(flag: LeaseFlag): string {
    switch (flag) {
      case 'ok': return 'OK';
      case 'escalation_due': return 'Actualizar';
      case 'ending': return 'Termina';
    }
  }

  leaseStateColor(flag: LeaseFlag): ComplianceState {
    return flag === 'ok' ? 'ok' : 'warning';
  }

  private safeRate(n: number): number {
    const total = this.rows().length;
    return total > 0 ? n / total : 0;
  }

  private computeRow(p: PortfolioProperty): ComplianceRow {
    const energyDays = this.daysBetween(TODAY_ISO, p.energy.validUntil);
    const insuranceDays = this.daysBetween(TODAY_ISO, p.insurance.validUntil);
    const lease: LeaseFlag =
      p.lease.status === 'escalation_due'
        ? 'escalation_due'
        : p.lease.status === 'ending'
          ? 'ending'
          : 'ok';
    const worst = this.worst([p.energy.state, p.insurance.state]);
    return {
      property: p,
      energy: p.energy.state,
      energyDaysToExpiry: energyDays,
      insurance: p.insurance.state,
      insuranceDaysToExpiry: insuranceDays,
      lease,
      worst,
    };
  }

  private worst(states: ComplianceState[]): ComplianceState {
    if (states.includes('expired')) return 'expired';
    if (states.includes('warning')) return 'warning';
    return 'ok';
  }

  private daysBetween(fromIso: string, toIso: string): number {
    const from = Date.parse(fromIso);
    const to = Date.parse(toIso);
    if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
    const ms = to - from;
    return Math.round(ms / (1000 * 60 * 60 * 24));
  }
}
