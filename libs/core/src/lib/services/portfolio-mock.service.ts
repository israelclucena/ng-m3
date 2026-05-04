/**
 * @fileoverview PortfolioMockService — Sprint 045
 *
 * Signal-based mock dataset of 8 Lisbon properties for the Dashboard
 * consumer trilogy (PortfolioYieldOverview, PortfolioFiscalSummary,
 * PortfolioComplianceMatrix).
 *
 * Diversity engineered to exercise downstream calculators across all
 * realistic states: tax regime mix (autónoma 28% vs englobamento),
 * energy certificate validity (current / expiring / expired),
 * insurance status (active / expiring / expired), lease lifecycle
 * (new / mid-term / escalation due), neighbourhood spread (centro,
 * cintura, costa).
 *
 * Feature flag: PORTFOLIO_MOCK_DATA
 *
 * @example
 * ```ts
 * const portfolio = inject(PortfolioMockService);
 * portfolio.properties();        // PortfolioProperty[] (8 items)
 * portfolio.totalValue();        // sum of marketValue
 * portfolio.totalGrossYield();   // weighted by value
 * portfolio.byNeighbourhood('Bairro Alto');
 * ```
 */
import { Injectable, computed, signal } from '@angular/core';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PropertyType = 'T0' | 'T1' | 'T2' | 'T3';
export type EnergyClass = 'A+' | 'A' | 'B' | 'B-' | 'C' | 'D' | 'E' | 'F';
export type IRSRegime = 'taxaAutonoma28' | 'englobamento';
export type LeaseStatus = 'new' | 'active' | 'escalation_due' | 'ending';
export type ComplianceState = 'ok' | 'warning' | 'expired';

export interface EnergyCertificate {
  classe: EnergyClass;
  emittedAt: string;       // ISO date
  validUntil: string;      // ISO date
  state: ComplianceState;
}

export interface Insurance {
  provider: string;
  validUntil: string;      // ISO date
  state: ComplianceState;
}

export interface Lease {
  status: LeaseStatus;
  startedAt: string;       // ISO date
  monthlyRent: number;     // EUR
  lastEscalationYear: number;
  nextEscalationDue: string; // ISO date
}

export interface PortfolioProperty {
  id: string;
  address: string;
  neighbourhood: string;
  type: PropertyType;
  areaM2: number;
  marketValue: number;            // EUR (current)
  acquisitionValue: number;       // EUR (paid)
  acquisitionYear: number;
  vpt: number;                    // Valor Patrimonial Tributário (IMI base)
  imiTaxRate: number;             // 0.003-0.0045 PT range
  irsRegime: IRSRegime;
  annualDeductibleExpenses: number;
  energy: EnergyCertificate;
  insurance: Insurance;
  lease: Lease;
}

// ─── Mock dataset ─────────────────────────────────────────────────────────────

const MOCK_PROPERTIES: PortfolioProperty[] = [
  {
    id: 'pt-001',
    address: 'Rua da Atalaia 12, 3º Esq',
    neighbourhood: 'Bairro Alto',
    type: 'T1',
    areaM2: 58,
    marketValue: 380_000,
    acquisitionValue: 295_000,
    acquisitionYear: 2019,
    vpt: 142_500,
    imiTaxRate: 0.0035,
    irsRegime: 'taxaAutonoma28',
    annualDeductibleExpenses: 2_400,
    energy: {
      classe: 'C',
      emittedAt: '2022-03-14',
      validUntil: '2032-03-14',
      state: 'ok',
    },
    insurance: {
      provider: 'Tranquilidade',
      validUntil: '2026-09-30',
      state: 'ok',
    },
    lease: {
      status: 'active',
      startedAt: '2024-06-01',
      monthlyRent: 1_350,
      lastEscalationYear: 2025,
      nextEscalationDue: '2026-06-01',
    },
  },
  {
    id: 'pt-002',
    address: 'Av. de Roma 45, 5º D',
    neighbourhood: 'Alvalade',
    type: 'T2',
    areaM2: 92,
    marketValue: 470_000,
    acquisitionValue: 410_000,
    acquisitionYear: 2021,
    vpt: 198_000,
    imiTaxRate: 0.0035,
    irsRegime: 'englobamento',
    annualDeductibleExpenses: 3_800,
    energy: {
      classe: 'B-',
      emittedAt: '2014-08-22',
      validUntil: '2024-08-22',
      state: 'expired',
    },
    insurance: {
      provider: 'Fidelidade',
      validUntil: '2026-05-22',
      state: 'warning',
    },
    lease: {
      status: 'escalation_due',
      startedAt: '2023-04-15',
      monthlyRent: 1_580,
      lastEscalationYear: 2025,
      nextEscalationDue: '2026-04-15',
    },
  },
  {
    id: 'pt-003',
    address: 'Rua D. Pedro V 88, 2º',
    neighbourhood: 'Príncipe Real',
    type: 'T2',
    areaM2: 78,
    marketValue: 525_000,
    acquisitionValue: 460_000,
    acquisitionYear: 2020,
    vpt: 215_000,
    imiTaxRate: 0.0035,
    irsRegime: 'taxaAutonoma28',
    annualDeductibleExpenses: 4_100,
    energy: {
      classe: 'A',
      emittedAt: '2023-11-08',
      validUntil: '2033-11-08',
      state: 'ok',
    },
    insurance: {
      provider: 'Allianz',
      validUntil: '2027-01-15',
      state: 'ok',
    },
    lease: {
      status: 'active',
      startedAt: '2025-01-15',
      monthlyRent: 1_850,
      lastEscalationYear: 2025,
      nextEscalationDue: '2027-01-15',
    },
  },
  {
    id: 'pt-004',
    address: 'Av. Marginal 1234, 4º C',
    neighbourhood: 'Cascais',
    type: 'T3',
    areaM2: 142,
    marketValue: 720_000,
    acquisitionValue: 580_000,
    acquisitionYear: 2018,
    vpt: 285_000,
    imiTaxRate: 0.004,
    irsRegime: 'englobamento',
    annualDeductibleExpenses: 6_200,
    energy: {
      classe: 'B',
      emittedAt: '2020-05-10',
      validUntil: '2030-05-10',
      state: 'ok',
    },
    insurance: {
      provider: 'Tranquilidade',
      validUntil: '2026-06-30',
      state: 'warning',
    },
    lease: {
      status: 'new',
      startedAt: '2026-04-01',
      monthlyRent: 2_400,
      lastEscalationYear: 2026,
      nextEscalationDue: '2027-04-01',
    },
  },
  {
    id: 'pt-005',
    address: 'Rua Vieira Portuense 18, R/C',
    neighbourhood: 'Belém',
    type: 'T1',
    areaM2: 52,
    marketValue: 320_000,
    acquisitionValue: 260_000,
    acquisitionYear: 2022,
    vpt: 128_000,
    imiTaxRate: 0.0035,
    irsRegime: 'taxaAutonoma28',
    annualDeductibleExpenses: 1_800,
    energy: {
      classe: 'D',
      emittedAt: '2018-02-20',
      validUntil: '2026-08-20',
      state: 'warning',
    },
    insurance: {
      provider: 'Liberty',
      validUntil: '2025-12-31',
      state: 'expired',
    },
    lease: {
      status: 'ending',
      startedAt: '2023-09-01',
      monthlyRent: 1_180,
      lastEscalationYear: 2025,
      nextEscalationDue: '2026-09-01',
    },
  },
  {
    id: 'pt-006',
    address: 'Av. de Berlim 70, 7º A',
    neighbourhood: 'Olivais',
    type: 'T2',
    areaM2: 88,
    marketValue: 295_000,
    acquisitionValue: 220_000,
    acquisitionYear: 2017,
    vpt: 112_000,
    imiTaxRate: 0.0045,
    irsRegime: 'taxaAutonoma28',
    annualDeductibleExpenses: 2_100,
    energy: {
      classe: 'E',
      emittedAt: '2015-06-12',
      validUntil: '2025-06-12',
      state: 'expired',
    },
    insurance: {
      provider: 'Generali',
      validUntil: '2027-03-15',
      state: 'ok',
    },
    lease: {
      status: 'active',
      startedAt: '2024-01-10',
      monthlyRent: 1_050,
      lastEscalationYear: 2025,
      nextEscalationDue: '2026-01-10',
    },
  },
  {
    id: 'pt-007',
    address: 'Rua Coelho da Rocha 23, 3º',
    neighbourhood: 'Lapa',
    type: 'T0',
    areaM2: 38,
    marketValue: 245_000,
    acquisitionValue: 195_000,
    acquisitionYear: 2023,
    vpt: 98_000,
    imiTaxRate: 0.0035,
    irsRegime: 'englobamento',
    annualDeductibleExpenses: 1_200,
    energy: {
      classe: 'A+',
      emittedAt: '2024-09-01',
      validUntil: '2034-09-01',
      state: 'ok',
    },
    insurance: {
      provider: 'Fidelidade',
      validUntil: '2026-11-20',
      state: 'ok',
    },
    lease: {
      status: 'new',
      startedAt: '2026-03-01',
      monthlyRent: 950,
      lastEscalationYear: 2026,
      nextEscalationDue: '2027-03-01',
    },
  },
  {
    id: 'pt-008',
    address: 'Calçada da Estrela 64, 2º Dt',
    neighbourhood: 'Estrela',
    type: 'T3',
    areaM2: 128,
    marketValue: 615_000,
    acquisitionValue: 510_000,
    acquisitionYear: 2019,
    vpt: 248_000,
    imiTaxRate: 0.0035,
    irsRegime: 'englobamento',
    annualDeductibleExpenses: 5_400,
    energy: {
      classe: 'C',
      emittedAt: '2021-04-18',
      validUntil: '2031-04-18',
      state: 'ok',
    },
    insurance: {
      provider: 'Tranquilidade',
      validUntil: '2026-05-15',
      state: 'warning',
    },
    lease: {
      status: 'escalation_due',
      startedAt: '2022-05-15',
      monthlyRent: 2_100,
      lastEscalationYear: 2025,
      nextEscalationDue: '2026-05-15',
    },
  },
];

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class PortfolioMockService {
  readonly properties = signal<PortfolioProperty[]>([...MOCK_PROPERTIES]);

  readonly count = computed(() => this.properties().length);

  readonly totalMarketValue = computed(() =>
    this.properties().reduce((acc, p) => acc + p.marketValue, 0),
  );

  readonly totalAcquisitionValue = computed(() =>
    this.properties().reduce((acc, p) => acc + p.acquisitionValue, 0),
  );

  readonly totalAnnualRent = computed(() =>
    this.properties().reduce((acc, p) => acc + p.lease.monthlyRent * 12, 0),
  );

  readonly totalGrossYield = computed(() => {
    const value = this.totalMarketValue();
    return value > 0 ? this.totalAnnualRent() / value : 0;
  });

  readonly complianceCounts = computed(() => {
    const props = this.properties();
    return {
      energyOk: props.filter((p) => p.energy.state === 'ok').length,
      energyWarning: props.filter((p) => p.energy.state === 'warning').length,
      energyExpired: props.filter((p) => p.energy.state === 'expired').length,
      insuranceOk: props.filter((p) => p.insurance.state === 'ok').length,
      insuranceWarning: props.filter((p) => p.insurance.state === 'warning').length,
      insuranceExpired: props.filter((p) => p.insurance.state === 'expired').length,
      leasesEscalationDue: props.filter(
        (p) => p.lease.status === 'escalation_due',
      ).length,
    };
  });

  byId(id: string): PortfolioProperty | undefined {
    return this.properties().find((p) => p.id === id);
  }

  byNeighbourhood(neighbourhood: string): PortfolioProperty[] {
    return this.properties().filter(
      (p) => p.neighbourhood.toLowerCase() === neighbourhood.toLowerCase(),
    );
  }

  byRegime(regime: IRSRegime): PortfolioProperty[] {
    return this.properties().filter((p) => p.irsRegime === regime);
  }
}
