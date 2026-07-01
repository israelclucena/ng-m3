import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PortfolioTaxLifecycleWidgetComponent } from './portfolio-tax-lifecycle.component';
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
  PT_IMT_OUTROS_2026,
  PT_IS_IMOVEL,
} from '../../services/imt.service';
import {
  PT_MV_QUOTA_RESIDENTE,
  PT_MV_TAXA_AUTONOMA,
} from '../../services/mais-valias-imobiliarias.service';

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

/** Mirror of the component's private irsCatF helper. */
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

describe('PortfolioTaxLifecycleWidgetComponent', () => {
  let fixture: ComponentFixture<PortfolioTaxLifecycleWidgetComponent>;
  let component: PortfolioTaxLifecycleWidgetComponent;
  let portfolio: PortfolioMockService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioTaxLifecycleWidgetComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PortfolioTaxLifecycleWidgetComponent);
    component = fixture.componentInstance;
    portfolio = TestBed.inject(PortfolioMockService);
    fixture.detectChanges();
  });

  // ── aggregates ──────────────────────────────────────────────────────────────

  it('builds one burden row per portfolio property', () => {
    expect(component.rows().length).toBe(portfolio.properties().length);
    expect(component.rows().length).toBe(8);
  });

  it('vptTotal is the sum of every property VPT', () => {
    const ref = portfolio.properties().reduce((acc, p) => acc + p.vpt, 0);
    expect(component.vptTotal()).toBe(ref);
  });

  it('exposes the singular AIMI dedução constant and triggers above it', () => {
    expect(component.aimiDeducao).toBe(PT_AIMI_DEDUCAO_SINGULAR);
    expect(component.aimiTriggered()).toBe(component.vptTotal() > PT_AIMI_DEDUCAO_SINGULAR);
  });

  it('aimiColecta is the progressive tax over the VPT excess (0 when not triggered)', () => {
    const expected = component.aimiTriggered()
      ? progressive(component.vptTotal() - PT_AIMI_DEDUCAO_SINGULAR, PT_AIMI_TAXAS_2026)
      : 0;
    expect(component.aimiColecta()).toBeCloseTo(expected, 4);
  });

  it('per-row IMI equals vpt × imiTaxRate', () => {
    const props = portfolio.properties();
    component.rows().forEach((r, i) => {
      expect(r.imi).toBeCloseTo(props[i].vpt * props[i].imiTaxRate, 6);
    });
  });

  it('per-row IRS matches the Cat. F derivation for its regime', () => {
    component.rows().forEach((r) => {
      expect(r.irs).toBeCloseTo(irsCatF(r.property), 4);
    });
  });

  it('AIMI share is prorata by VPT and sums back to the portfolio colecta', () => {
    const shareSum = component.rows().reduce((acc, r) => acc + r.aimiShare, 0);
    expect(shareSum).toBeCloseTo(component.aimiColecta(), 4);
    if (!component.aimiTriggered()) {
      for (const r of component.rows()) expect(r.aimiShare).toBe(0);
    }
  });

  it('per-row totalAnnual is imi + aimiShare + irs', () => {
    for (const r of component.rows()) {
      expect(r.totalAnnual).toBeCloseTo(r.imi + r.aimiShare + r.irs, 6);
    }
  });

  it('totals equal the sum over rows', () => {
    const rows = component.rows();
    expect(component.totalIMI()).toBeCloseTo(rows.reduce((a, r) => a + r.imi, 0), 4);
    expect(component.totalIRS()).toBeCloseTo(rows.reduce((a, r) => a + r.irs, 0), 4);
    expect(component.totalAnnual()).toBeCloseTo(
      component.totalIMI() + component.aimiColecta() + component.totalIRS(),
      4,
    );
  });

  it('taxOnRentRatio is total annual over gross annual rent', () => {
    const rent = portfolio.properties().reduce((a, p) => a + p.lease.monthlyRent * 12, 0);
    expect(component.taxOnRentRatio()).toBeCloseTo(component.totalAnnual() / rent, 6);
  });

  it('portfolioBurdenRatio is total annual over total market value', () => {
    expect(component.portfolioBurdenRatio()).toBeCloseTo(
      component.totalAnnual() / portfolio.totalMarketValue(),
      6,
    );
  });

  // ── projected events ──────────────────────────────────────────────────────────

  it('has no projections by default', () => {
    expect(component.saleProjection()).toBeNull();
    expect(component.purchaseProjection()).toBeNull();
  });

  it('projects a sale into a mais-valias estimate', () => {
    const prop = portfolio.properties()[0];
    const salePrice = prop.acquisitionValue + 200_000;
    fixture.componentRef.setInput('projectedSale', { propertyId: prop.id, salePrice });
    fixture.detectChanges();

    const sp = component.saleProjection()!;
    const maisValiaBruta = Math.max(0, salePrice - prop.acquisitionValue);
    const tributavel = maisValiaBruta * PT_MV_QUOTA_RESIDENTE;
    const colecta = tributavel * PT_MV_TAXA_AUTONOMA;
    expect(sp.address).toBe(prop.address);
    expect(sp.maisValiaBruta).toBeCloseTo(maisValiaBruta, 4);
    expect(sp.tributavel).toBeCloseTo(tributavel, 4);
    expect(sp.colecta).toBeCloseTo(colecta, 4);
    expect(sp.liquido).toBeCloseTo(salePrice - colecta, 4);
  });

  it('returns null sale projection for an unknown property id', () => {
    fixture.componentRef.setInput('projectedSale', { propertyId: 'nope', salePrice: 1 });
    fixture.detectChanges();
    expect(component.saleProjection()).toBeNull();
  });

  it('projects a purchase into IMT + IS (defaults to "outros")', () => {
    const value = 320_000;
    fixture.componentRef.setInput('projectedPurchase', { value });
    fixture.detectChanges();

    const pp = component.purchaseProjection()!;
    const imt = progressive(value, PT_IMT_OUTROS_2026);
    const is = value * PT_IS_IMOVEL;
    expect(pp.finalidade).toBe('outros');
    expect(pp.finalidadeLabel).toBe('Outros fins');
    expect(pp.imt).toBeCloseTo(imt, 4);
    expect(pp.is).toBeCloseTo(is, 4);
    expect(pp.totalImpostos).toBeCloseTo(imt + is, 4);
    expect(pp.taxaEfectiva).toBeCloseTo((imt + is) / value, 6);
  });

  // ── empty portfolio ─────────────────────────────────────────────────────────

  it('handles an empty portfolio without dividing by zero', () => {
    portfolio.properties.set([]);
    fixture.detectChanges();
    expect(component.rows()).toEqual([]);
    expect(component.vptTotal()).toBe(0);
    expect(component.aimiTriggered()).toBe(false);
    expect(component.aimiColecta()).toBe(0);
    expect(component.totalAnnual()).toBe(0);
    expect(component.taxOnRentRatio()).toBe(0);
    expect(component.portfolioBurdenRatio()).toBe(0);
  });

  // ── DOM smoke ─────────────────────────────────────────────────────────────────

  it('renders the property count in the subtitle', () => {
    const subtitle: HTMLElement = fixture.nativeElement.querySelector('.ptl-subtitle');
    expect(subtitle.textContent).toContain('8 propriedades');
  });

  it('renders one table body row per property', () => {
    const rows = fixture.nativeElement.querySelectorAll('.ptl-table tbody tr');
    expect(rows.length).toBe(component.rows().length);
  });

  it('renders the projected-events panel only when an input is set', () => {
    expect(fixture.nativeElement.querySelector('.ptl-events')).toBeNull();
    fixture.componentRef.setInput('projectedPurchase', { value: 250_000 });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ptl-events')).not.toBeNull();
  });
});
