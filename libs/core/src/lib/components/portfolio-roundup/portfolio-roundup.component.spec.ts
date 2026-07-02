import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  PortfolioRoundupComponent,
  type RoundupDetailKey,
} from './portfolio-roundup.component';
import {
  PortfolioMockService,
  type PortfolioProperty,
} from '../../services/portfolio-mock.service';
import {
  PT_IRS_ESCALOES_2026,
  PT_IRS_TAXA_AUTONOMA_CAT_F,
} from '../../services/irs-categoria-f.service';

const MAINTENANCE_RATE = 0.005;

/** Mirror of the component's private progressive-bracket helper. */
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

/** Mirror of the component's private per-property net yield. */
function netYield(p: PortfolioProperty): number {
  const annualRent = p.lease.monthlyRent * 12;
  const imi = p.vpt * p.imiTaxRate;
  const maintenance = p.marketValue * MAINTENANCE_RATE;
  const taxRate = p.irsRegime === 'taxaAutonoma28' ? PT_IRS_TAXA_AUTONOMA_CAT_F : 0.3;
  const taxableBase = Math.max(annualRent - p.annualDeductibleExpenses, 0);
  const tax = taxableBase * taxRate;
  const afterTax = annualRent - imi - maintenance - p.annualDeductibleExpenses - tax;
  return p.marketValue > 0 ? afterTax / p.marketValue : 0;
}

/** Mirror of the component's private fiscal row. */
function fiscalRow(p: PortfolioProperty) {
  const bruto = p.lease.monthlyRent * 12;
  const imi = p.vpt * p.imiTaxRate;
  const manut = p.marketValue * MAINTENANCE_RATE;
  const liquido = Math.max(0, bruto - imi - manut - p.annualDeductibleExpenses);
  const irsAutonoma = liquido * PT_IRS_TAXA_AUTONOMA_CAT_F;
  const irsEnglobamento = progressive(liquido, PT_IRS_ESCALOES_2026);
  const irsActual = p.irsRegime === 'taxaAutonoma28' ? irsAutonoma : irsEnglobamento;
  return { liquido, irsActual, irsAutonoma, irsEnglobamento };
}

describe('PortfolioRoundupComponent', () => {
  let fixture: ComponentFixture<PortfolioRoundupComponent>;
  let component: PortfolioRoundupComponent;
  let portfolio: PortfolioMockService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioRoundupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PortfolioRoundupComponent);
    component = fixture.componentInstance;
    portfolio = TestBed.inject(PortfolioMockService);
    fixture.detectChanges();
  });

  it('counts the portfolio properties', () => {
    expect(component.count()).toBe(portfolio.properties().length);
    expect(component.count()).toBe(8);
  });

  // ── yield ───────────────────────────────────────────────────────────────────

  it('computes value-weighted gross yield', () => {
    const props = portfolio.properties();
    const totalValue = props.reduce((a, p) => a + p.marketValue, 0);
    const totalRent = props.reduce((a, p) => a + p.lease.monthlyRent * 12, 0);
    expect(component.weightedGrossYield()).toBeCloseTo(totalRent / totalValue, 8);
  });

  it('computes value-weighted net yield mirroring the after-tax model', () => {
    const props = portfolio.properties();
    const totalValue = props.reduce((a, p) => a + p.marketValue, 0);
    const weighted = props.reduce((a, p) => a + netYield(p) * p.marketValue, 0);
    expect(component.weightedNetYield()).toBeCloseTo(weighted / totalValue, 8);
  });

  it('picks best and worst performer by net yield', () => {
    const props = portfolio.properties();
    const yields = props.map((p) => ({ id: p.id, y: netYield(p) }));
    const best = yields.reduce((b, e) => (e.y > b.y ? e : b));
    const worstEntry = yields.reduce((w, e) => (e.y < w.y ? e : w));
    expect(component.bestPerformer()!.property.id).toBe(best.id);
    expect(component.worstPerformer()!.property.id).toBe(worstEntry.id);
    expect(component.bestPerformer()!.netYield).toBeGreaterThanOrEqual(
      component.worstPerformer()!.netYield,
    );
  });

  // ── fiscal ──────────────────────────────────────────────────────────────────

  it('sums the actual IRS across the portfolio by each property regime', () => {
    const total = portfolio.properties().reduce((a, p) => a + fiscalRow(p).irsActual, 0);
    expect(component.totalIRSActual()).toBeCloseTo(total, 4);
  });

  it('computes the portfolio effective tax rate as IRS / net income', () => {
    const rows = portfolio.properties().map(fiscalRow);
    const totalIRS = rows.reduce((a, r) => a + r.irsActual, 0);
    const totalLiq = rows.reduce((a, r) => a + r.liquido, 0);
    expect(component.taxaEfectivaPonderada()).toBeCloseTo(totalIRS / totalLiq, 8);
  });

  it('recommends the cheapest regime and quantifies the potential saving', () => {
    const rows = portfolio.properties().map(fiscalRow);
    const totalAuto = rows.reduce((a, r) => a + r.irsAutonoma, 0);
    const totalEng = rows.reduce((a, r) => a + r.irsEnglobamento, 0);
    const actual = rows.reduce((a, r) => a + r.irsActual, 0);
    const best = Math.min(totalAuto, totalEng, actual);

    if (best === actual) {
      expect(component.recommendedRegimeLabel()).toBe('Mix actual (óptimo)');
    } else if (totalAuto < totalEng) {
      expect(component.recommendedRegimeLabel()).toBe('Todas autónoma 28%');
    } else {
      expect(component.recommendedRegimeLabel()).toBe('Todas englobamento');
    }
    expect(component.potentialSaving()).toBeCloseTo(Math.max(0, actual - best), 4);
    expect(component.potentialSaving()).toBeGreaterThanOrEqual(0);
  });

  // ── compliance ────────────────────────────────────────────────────────────────

  it('computes the fully-compliant share of the portfolio', () => {
    const props = portfolio.properties();
    const compliant = props.filter(
      (p) =>
        p.energy.state === 'ok' &&
        p.insurance.state === 'ok' &&
        p.lease.status !== 'escalation_due' &&
        p.lease.status !== 'ending',
    ).length;
    expect(component.overallComplianceRate()).toBeCloseTo(compliant / props.length, 8);
  });

  it('counts pending and critical actions from the mock states', () => {
    const props = portfolio.properties();
    let pending = 0;
    let critical = 0;
    for (const p of props) {
      if (p.energy.state !== 'ok') pending++;
      if (p.insurance.state !== 'ok') pending++;
      if (p.lease.status === 'escalation_due' || p.lease.status === 'ending') pending++;
      if (p.energy.state === 'expired') critical++;
      if (p.insurance.state === 'expired') critical++;
    }
    expect(component.pendingActions()).toBe(pending);
    expect(component.criticalActions()).toBe(critical);
  });

  it('derives the compliance tone from critical → warning → ok precedence', () => {
    const expected =
      component.criticalActions() > 0
        ? 'critical'
        : component.pendingActions() > 0
          ? 'warning'
          : 'ok';
    expect(component.complianceTone()).toBe(expected);
  });

  // ── output ────────────────────────────────────────────────────────────────────

  it('emits the detail key on emit()', () => {
    const received: RoundupDetailKey[] = [];
    component.detail.subscribe((k) => received.push(k));
    component.emit('yield');
    component.emit('fiscal');
    component.emit('compliance');
    expect(received).toEqual(['yield', 'fiscal', 'compliance']);
  });

  // ── empty portfolio ───────────────────────────────────────────────────────────

  it('handles an empty portfolio without dividing by zero', () => {
    portfolio.properties.set([]);
    fixture.detectChanges();
    expect(component.count()).toBe(0);
    expect(component.weightedGrossYield()).toBe(0);
    expect(component.weightedNetYield()).toBe(0);
    expect(component.bestPerformer()).toBeNull();
    expect(component.worstPerformer()).toBeNull();
    expect(component.totalIRSActual()).toBe(0);
    expect(component.taxaEfectivaPonderada()).toBe(0);
    expect(component.overallComplianceRate()).toBe(0);
    expect(component.pendingActions()).toBe(0);
    expect(component.complianceTone()).toBe('ok');
  });

  // ── DOM smoke ─────────────────────────────────────────────────────────────────

  it('renders the property count in the subtitle', () => {
    const subtitle: HTMLElement = fixture.nativeElement.querySelector('.pru-subtitle');
    expect(subtitle.textContent).toContain('8 propriedades');
  });

  it('renders the three roundup cards when the portfolio is non-empty', () => {
    const cards = fixture.nativeElement.querySelectorAll('.pru-card');
    expect(cards.length).toBe(3);
    expect(fixture.nativeElement.querySelector('.pru-empty')).toBeNull();
  });

  it('shows the empty-state block only when there are no properties', () => {
    portfolio.properties.set([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pru-empty')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.pru-grid')).toBeNull();
  });

  it('emits the yield detail key when the first CTA is clicked', () => {
    let received: RoundupDetailKey | null = null;
    component.detail.subscribe((k) => (received = k));
    const cta: HTMLButtonElement = fixture.nativeElement.querySelector('.pru-yield .pru-cta');
    cta.click();
    expect(received).toBe('yield');
  });
});
