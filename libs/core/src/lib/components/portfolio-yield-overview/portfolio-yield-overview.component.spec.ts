import { TestBed } from '@angular/core/testing';
import { PortfolioYieldOverviewComponent } from './portfolio-yield-overview.component';
import {
  PortfolioMockService,
  type PortfolioProperty,
} from '../../services/portfolio-mock.service';

/** Build a portfolio property, overridable per test. */
function prop(over: Partial<PortfolioProperty> = {}): PortfolioProperty {
  return {
    id: 'pt-x',
    address: 'Rua Teste 1',
    neighbourhood: 'Centro',
    type: 'T2',
    areaM2: 80,
    marketValue: 400_000,
    acquisitionValue: 300_000,
    acquisitionYear: 2020,
    vpt: 160_000,
    imiTaxRate: 0.0035,
    irsRegime: 'taxaAutonoma28',
    annualDeductibleExpenses: 2_000,
    energy: { classe: 'B', emittedAt: '2022-01-01', validUntil: '2032-01-01', state: 'ok' },
    insurance: { provider: 'Test', validUntil: '2027-01-01', state: 'ok' },
    lease: {
      status: 'active',
      startedAt: '2024-01-01',
      monthlyRent: 1_500,
      lastEscalationYear: 2025,
      nextEscalationDue: '2026-01-01',
    },
    ...over,
  };
}

describe('PortfolioYieldOverviewComponent', () => {
  let component: PortfolioYieldOverviewComponent;
  let svc: PortfolioMockService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioYieldOverviewComponent],
    }).compileComponents();

    svc = TestBed.inject(PortfolioMockService);
    const fixture = TestBed.createComponent(PortfolioYieldOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── rows / aggregates ────────────────────────────────────────────────────────

  it('builds one yield row per portfolio property', () => {
    expect(component.rows().length).toBe(svc.properties().length);
  });

  it('computes gross yield as annual rent over market value', () => {
    svc.properties.set([prop({ marketValue: 400_000, lease: { ...prop().lease, monthlyRent: 1_000 } })]);
    // 1000 * 12 / 400000 = 0.03
    expect(component.rows()[0].grossYield).toBeCloseTo(0.03, 5);
  });

  it('sums total market value and total annual rent across rows', () => {
    svc.properties.set([
      prop({ marketValue: 300_000, lease: { ...prop().lease, monthlyRent: 1_000 } }),
      prop({ id: 'pt-y', marketValue: 200_000, lease: { ...prop().lease, monthlyRent: 500 } }),
    ]);
    expect(component.totalMarketValue()).toBe(500_000);
    expect(component.totalAnnualRent()).toBe((1_000 + 500) * 12);
  });

  it('computes weighted gross yield from portfolio totals', () => {
    svc.properties.set([
      prop({ marketValue: 300_000, lease: { ...prop().lease, monthlyRent: 1_000 } }),
      prop({ id: 'pt-y', marketValue: 100_000, lease: { ...prop().lease, monthlyRent: 500 } }),
    ]);
    // total rent (12000 + 6000) / total value 400000 = 0.045
    expect(component.weightedGrossYield()).toBeCloseTo(0.045, 5);
  });

  // ── division-by-zero guards ──────────────────────────────────────────────────

  it('guards weighted yields against an empty portfolio', () => {
    svc.properties.set([]);
    expect(component.rows()).toEqual([]);
    expect(component.weightedGrossYield()).toBe(0);
    expect(component.weightedNetYield()).toBe(0);
  });

  it('guards per-row yields when a property has zero market value', () => {
    svc.properties.set([prop({ marketValue: 0 })]);
    expect(component.rows()[0].grossYield).toBe(0);
    expect(component.rows()[0].netYield).toBe(0);
  });

  // ── deltaVsAvg ───────────────────────────────────────────────────────────────

  it('expresses each row net yield as a delta against the weighted average', () => {
    const row = component.rows()[0];
    expect(row.deltaVsAvg).toBeCloseTo(row.netYield - component.weightedNetYield(), 6);
  });

  // ── sorting ──────────────────────────────────────────────────────────────────

  it('defaults to sorting by net yield descending', () => {
    const sorted = component.sortedRows();
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].netYield).toBeGreaterThanOrEqual(sorted[i].netYield);
    }
  });

  it('flips direction when toggling the active sort key', () => {
    expect(component.sortKey()).toBe('netYield');
    expect(component.sortDir()).toBe('desc');
    component.toggleSort('netYield');
    expect(component.sortDir()).toBe('asc');
  });

  it('switches key with a sensible default direction (text asc, numeric desc)', () => {
    component.toggleSort('address');
    expect(component.sortKey()).toBe('address');
    expect(component.sortDir()).toBe('asc');

    component.toggleSort('marketValue');
    expect(component.sortKey()).toBe('marketValue');
    expect(component.sortDir()).toBe('desc');
  });

  it('sorts ascending by market value when requested', () => {
    component.toggleSort('marketValue'); // desc
    component.toggleSort('marketValue'); // asc
    const values = component.sortedRows().map(r => r.property.marketValue);
    const ascending = [...values].sort((a, b) => a - b);
    expect(values).toEqual(ascending);
  });

  // ── sortIcon ─────────────────────────────────────────────────────────────────

  it('shows a direction arrow only for the active column', () => {
    expect(component.sortIcon('netYield')).toBe('▼');
    expect(component.sortIcon('address')).toBe('');
    component.toggleSort('netYield');
    expect(component.sortIcon('netYield')).toBe('▲');
  });
});
