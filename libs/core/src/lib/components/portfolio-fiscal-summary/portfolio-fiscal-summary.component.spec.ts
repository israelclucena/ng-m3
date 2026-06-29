import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PortfolioFiscalSummaryComponent } from './portfolio-fiscal-summary.component';
import { PortfolioMockService } from '../../services/portfolio-mock.service';
import {
  PT_IRS_ESCALOES_2026,
  PT_IRS_TAXA_AUTONOMA_CAT_F,
} from '../../services/irs-categoria-f.service';

const MAINTENANCE_RATE = 0.005;

/** Reference progressive IRS, mirrors the component's private helper. */
function progressive(amount: number): number {
  if (amount <= 0) return 0;
  let remaining = amount;
  let prevTop = 0;
  let total = 0;
  for (const b of PT_IRS_ESCALOES_2026) {
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

describe('PortfolioFiscalSummaryComponent', () => {
  let fixture: ComponentFixture<PortfolioFiscalSummaryComponent>;
  let component: PortfolioFiscalSummaryComponent;
  let portfolio: PortfolioMockService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioFiscalSummaryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PortfolioFiscalSummaryComponent);
    component = fixture.componentInstance;
    portfolio = TestBed.inject(PortfolioMockService);
    fixture.detectChanges();
  });

  // ── per-row derivation ──────────────────────────────────────────────────────

  it('builds one fiscal row per portfolio property', () => {
    expect(component.rows().length).toBe(portfolio.properties().length);
    expect(component.rows().length).toBe(8);
  });

  it('derives gross/IMI/maintenance/net for the first property', () => {
    const p = portfolio.properties()[0]; // pt-001
    const row = component.rows()[0];
    expect(row.rendimentoBruto).toBe(p.lease.monthlyRent * 12);
    expect(row.imi).toBeCloseTo(p.vpt * p.imiTaxRate, 6);
    expect(row.manutencao).toBeCloseTo(p.marketValue * MAINTENANCE_RATE, 6);
    expect(row.outrasDespesas).toBe(p.annualDeductibleExpenses);
    expect(row.totalDespesas).toBeCloseTo(
      row.imi + row.manutencao + row.outrasDespesas,
      6,
    );
    expect(row.rendimentoLiquido).toBeCloseTo(
      Math.max(0, row.rendimentoBruto - row.totalDespesas),
      6,
    );
  });

  it('computes both regimes per row, irsActual follows the property regime', () => {
    for (const row of component.rows()) {
      expect(row.irsTaxaAutonoma).toBeCloseTo(
        row.rendimentoLiquido * PT_IRS_TAXA_AUTONOMA_CAT_F,
        4,
      );
      expect(row.irsEnglobamento).toBeCloseTo(
        progressive(row.rendimentoLiquido),
        4,
      );
      const expected =
        row.regime === 'taxaAutonoma28'
          ? row.irsTaxaAutonoma
          : row.irsEnglobamento;
      expect(row.irsActual).toBeCloseTo(expected, 6);
    }
  });

  // ── aggregates ──────────────────────────────────────────────────────────────

  it('totals equal the sum of their per-row components', () => {
    const rows = component.rows();
    const sum = (sel: (r: (typeof rows)[number]) => number) =>
      rows.reduce((acc, r) => acc + sel(r), 0);

    expect(component.totalBruto()).toBeCloseTo(sum((r) => r.rendimentoBruto), 4);
    expect(component.totalIMI()).toBeCloseTo(sum((r) => r.imi), 4);
    expect(component.totalManutencao()).toBeCloseTo(sum((r) => r.manutencao), 4);
    expect(component.totalOutrasDespesas()).toBeCloseTo(
      sum((r) => r.outrasDespesas),
      4,
    );
    expect(component.totalLiquido()).toBeCloseTo(sum((r) => r.rendimentoLiquido), 4);
    expect(component.totalIRSActual()).toBeCloseTo(sum((r) => r.irsActual), 4);
  });

  it('totalBruto equals the sum of annual rents (149.520€ for the mock set)', () => {
    expect(component.totalBruto()).toBe(149_520);
  });

  it('totalDespesas equals IMI + maintenance + other', () => {
    expect(component.totalDespesas()).toBeCloseTo(
      component.totalIMI() +
        component.totalManutencao() +
        component.totalOutrasDespesas(),
      4,
    );
  });

  it('taxaEfectivaPonderada equals total IRS over total net income', () => {
    expect(component.taxaEfectivaPonderada()).toBeCloseTo(
      component.totalIRSActual() / component.totalLiquido(),
      6,
    );
  });

  // ── scenarios + recommendation ──────────────────────────────────────────────

  it('exposes the three portfolio-wide scenarios', () => {
    const regimes = component.scenarios().map((s) => s.regime);
    expect(regimes).toEqual(['mix', 'taxaAutonoma28', 'englobamento']);
  });

  it('mix scenario mirrors the actual configuration', () => {
    const mix = component.scenarios().find((s) => s.regime === 'mix')!;
    expect(mix.totalIRS).toBeCloseTo(component.totalIRSActual(), 6);
  });

  it('all-autónoma scenario equals 28% of total net income', () => {
    const auto = component
      .scenarios()
      .find((s) => s.regime === 'taxaAutonoma28')!;
    expect(auto.totalIRS).toBeCloseTo(
      component.totalLiquido() * PT_IRS_TAXA_AUTONOMA_CAT_F,
      4,
    );
  });

  it('recommendedRegime is the scenario with the lowest total IRS', () => {
    const min = component
      .scenarios()
      .reduce((best, s) => (s.totalIRS < best.totalIRS ? s : best));
    expect(component.recommendedRegime()).toBe(min.regime);
  });

  it('recommendation text matches the chosen regime', () => {
    const best = component.recommendedRegime();
    const text = component.recommendation();
    if (best === 'mix') {
      expect(text).toContain('já é');
    } else {
      expect(text).toContain('Migrar todas');
    }
  });

  // ── empty portfolio ─────────────────────────────────────────────────────────

  it('handles an empty portfolio without dividing by zero', () => {
    portfolio.properties.set([]);
    fixture.detectChanges();

    expect(component.rows()).toEqual([]);
    expect(component.totalBruto()).toBe(0);
    expect(component.totalLiquido()).toBe(0);
    expect(component.taxaEfectivaPonderada()).toBe(0);
    expect(component.scenarios().every((s) => s.totalIRS === 0)).toBe(true);
    // With all-zero scenarios the reducer keeps 'mix' as the best.
    expect(component.recommendedRegime()).toBe('mix');
    expect(component.recommendation()).toContain('já é');
  });

  // ── DOM smoke ───────────────────────────────────────────────────────────────

  it('renders the property count in the subtitle', () => {
    const subtitle: HTMLElement =
      fixture.nativeElement.querySelector('.pfs-subtitle');
    expect(subtitle.textContent).toContain('8 propriedades');
  });
});
