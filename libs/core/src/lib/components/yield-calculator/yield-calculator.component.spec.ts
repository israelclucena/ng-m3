import { ComponentFixture, TestBed } from '@angular/core/testing';
import { YieldCalculatorComponent } from './yield-calculator.component';

describe('YieldCalculatorComponent', () => {
  let fixture: ComponentFixture<YieldCalculatorComponent>;
  let component: YieldCalculatorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YieldCalculatorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(YieldCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render header title and subtitle', () => {
    const title = fixture.nativeElement.querySelector('.yc-title');
    const subtitle = fixture.nativeElement.querySelector('.yc-subtitle');
    expect(title.textContent).toContain('Rentabilidade do Imóvel');
    expect(subtitle.textContent).toContain('yield bruto');
  });

  // ── Default computeds ──────────────────────────────────────────────────────

  it('should expose the documented defaults', () => {
    expect(component.purchasePrice()).toBe(300000);
    expect(component.monthlyRent()).toBe(1100);
    expect(component.monthlyCosts()).toBe(120);
    expect(component.taxRatePct()).toBe(28);
  });

  it('should compute annual rent and costs', () => {
    expect(component.annualRent()).toBe(13200);
    expect(component.annualCosts()).toBe(1440);
  });

  it('should compute gross yield from annual rent over price', () => {
    // 13200 / 300000 * 100
    expect(component.grossYield()).toBeCloseTo(4.4, 4);
  });

  it('should compute net annual after costs and IRS', () => {
    // (13200 - 1440) * (1 - 0.28) = 11760 * 0.72
    expect(component.netAnnual()).toBeCloseTo(8467.2, 2);
    expect(component.netMonthly()).toBeCloseTo(705.6, 2);
  });

  it('should compute net yield', () => {
    // 8467.2 / 300000 * 100
    expect(component.netYield()).toBeCloseTo(2.8224, 4);
  });

  it('should compute payback years', () => {
    // 300000 / 8467.2
    expect(component.paybackYears()).toBeCloseTo(35.43, 2);
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────

  it('should guard against a zero purchase price', () => {
    component.purchasePrice.set(0);
    expect(component.grossYield()).toBe(0);
    expect(component.netYield()).toBe(0);
    expect(component.paybackYears()).toBe(0);
  });

  it('should return a non-positive payback as zero when net annual is negative', () => {
    // costs exceeding rent → negative taxable net → no payback
    component.monthlyCosts.set(2000);
    expect(component.netAnnual()).toBeLessThan(0);
    expect(component.paybackYears()).toBe(0);
  });

  // ── Input sanitisation via DOM events ──────────────────────────────────────

  it('should read a numeric value from the price input', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.yc-input');
    input.value = '450000';
    input.dispatchEvent(new Event('input'));
    expect(component.purchasePrice()).toBe(450000);
  });

  it('should clamp a negative input back to zero', () => {
    const ev = { target: { value: '-50' } } as unknown as Event;
    component.setCosts(ev);
    expect(component.monthlyCosts()).toBe(0);
  });

  // ── Presets ────────────────────────────────────────────────────────────────

  it('should load the Lisboa preset', () => {
    component.loadLisboa();
    expect(component.purchasePrice()).toBe(614000);
    expect(component.monthlyRent()).toBe(1600);
    expect(component.monthlyCosts()).toBe(220);
    // (19200 - 2640) * 0.72
    expect(component.netAnnual()).toBeCloseTo(11923.2, 2);
  });

  it('should load the Porto preset', () => {
    component.loadPorto();
    expect(component.purchasePrice()).toBe(300000);
    expect(component.monthlyRent()).toBe(1100);
    expect(component.monthlyCosts()).toBe(140);
  });

  it('should restore defaults on reset', () => {
    component.loadLisboa();
    component.reset();
    expect(component.purchasePrice()).toBe(300000);
    expect(component.monthlyRent()).toBe(1100);
    expect(component.monthlyCosts()).toBe(120);
    expect(component.taxRatePct()).toBe(28);
  });
});
