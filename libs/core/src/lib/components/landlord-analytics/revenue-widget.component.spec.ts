import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RevenueWidgetComponent } from './revenue-widget.component';
import { RevenueSummary } from './landlord-analytics.types';

/** Build a revenue summary with sensible defaults, overridable per test. */
function summary(over: Partial<RevenueSummary> = {}): RevenueSummary {
  return {
    currency: 'EUR',
    totalRevenue: 10000,
    totalExpenses: 4000,
    netProfit: 6000,
    growthPercent: 12,
    data: [
      { month: 'Jan', revenue: 3000, expenses: 1000, net: 2000 },
      { month: 'Fev', revenue: 3500, expenses: 1500, net: 2000 },
      { month: 'Mar', revenue: 3500, expenses: 1500, net: 2000 },
    ],
    ...over,
  };
}

describe('RevenueWidgetComponent', () => {
  let fixture: ComponentFixture<RevenueWidgetComponent>;
  let component: RevenueWidgetComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevenueWidgetComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RevenueWidgetComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('summary', summary());
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // ── profitMargin ───────────────────────────────────────────────────────────────

  it('computes profit margin as a rounded percentage of revenue', () => {
    fixture.componentRef.setInput('summary', summary({ totalRevenue: 10000, netProfit: 6000 }));
    expect(component.profitMargin()).toBe(60);
  });

  it('rounds the profit margin to the nearest integer', () => {
    fixture.componentRef.setInput('summary', summary({ totalRevenue: 3000, netProfit: 1000 }));
    expect(component.profitMargin()).toBe(33); // 33.33… → 33
  });

  it('returns a zero margin when revenue is zero (no division by zero)', () => {
    fixture.componentRef.setInput('summary', summary({ totalRevenue: 0, netProfit: 0 }));
    expect(component.profitMargin()).toBe(0);
  });

  // ── sparklinePath / sparklineFill ──────────────────────────────────────────────

  it('builds an SVG line path starting with a move and using line commands', () => {
    fixture.componentRef.setInput('summary', summary());
    const path = component.sparklinePath();
    expect(path.startsWith('M')).toBe(true);
    expect(path).toContain('L');
  });

  it('closes the fill area path with a Z command', () => {
    fixture.componentRef.setInput('summary', summary());
    expect(component.sparklineFill().endsWith('Z')).toBe(true);
  });

  it('returns empty path strings when there is no data', () => {
    fixture.componentRef.setInput('summary', summary({ data: [] }));
    expect(component.sparklinePath()).toBe('');
    expect(component.sparklineFill()).toBe('');
  });

  // ── sparklineDots ──────────────────────────────────────────────────────────────

  it('maps one dot per data point carrying its month and net value', () => {
    fixture.componentRef.setInput('summary', summary());
    const dots = component.sparklineDots();
    expect(dots.length).toBe(3);
    expect(dots[0].month).toBe('Jan');
    expect(dots[0].net).toBe(2000);
    expect(typeof dots[0].x).toBe('number');
    expect(typeof dots[0].y).toBe('number');
  });

  it('spans the sparkline width from the first to the last point', () => {
    fixture.componentRef.setInput('summary', summary());
    const dots = component.sparklineDots();
    expect(dots[0].x).toBe(0);
    expect(dots[dots.length - 1].x).toBe(300);
  });

  // ── sparklineLabel ─────────────────────────────────────────────────────────────

  it('produces an accessible label including the net profit', () => {
    fixture.componentRef.setInput('summary', summary({ netProfit: 6000 }));
    const label = component.sparklineLabel();
    expect(label).toContain('6000');
    expect(label.toLowerCase()).toContain('lucro');
  });
});
