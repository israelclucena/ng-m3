import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RentArrearsComponent } from './rent-arrears.component';
import { RentArrearsService, type ArrearsRecord } from '../../services/rent-arrears.service';

describe('RentArrearsComponent', () => {
  let fixture: ComponentFixture<RentArrearsComponent>;
  let component: RentArrearsComponent;
  let service: RentArrearsService;

  const cards = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.ra-card'));
  const filterBtns = (): HTMLButtonElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.ra-filter-btn'));
  const kpiNums = (): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.ra-kpi-num')).map(
      (e) => (e as HTMLElement).textContent!.trim(),
    );
  const empty = (): HTMLElement | null =>
    fixture.nativeElement.querySelector('.ra-empty');
  const record = (id: string): ArrearsRecord =>
    service.records().find((r) => r.id === id)!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RentArrearsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RentArrearsComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(RentArrearsService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Header + KPIs ──────────────────────────────────────────────────────────

  it('should render the title', () => {
    const title = fixture.nativeElement.querySelector('.ra-title');
    expect(title.textContent).toContain('Rent Arrears');
  });

  it('should compute portfolio KPIs from the mock data', () => {
    const k = service.kpis();
    // 1800 + 1600 + 475 + 5400 = 9275 outstanding across 4 non-resolved tenants
    expect(k.totalOutstanding).toBe(9275);
    expect(k.totalTenants).toBe(4);
    expect(k.avgDaysOverdue).toBe(61);
    expect(k.critical).toBe(2);
  });

  it('should render KPI values in the strip', () => {
    const nums = kpiNums();
    expect(nums).toContain('4');
    expect(nums).toContain('61d');
  });

  // ── List rendering ─────────────────────────────────────────────────────────

  it('should render one card per record by default', () => {
    expect(cards().length).toBe(service.records().length);
    expect(empty()).toBeNull();
  });

  it('should apply a severity class to each card', () => {
    expect(fixture.nativeElement.querySelector('.ra-card-critical')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.ra-card-high')).toBeTruthy();
  });

  // ── Severity classification ────────────────────────────────────────────────

  it('should classify severity by status and days overdue', () => {
    expect(service.severity(record('ar004'))).toBe('critical'); // legal
    expect(service.severity(record('ar002'))).toBe('high');     // 62d
    expect(service.severity(record('ar001'))).toBe('medium');   // 45d
    expect(service.severity(record('ar003'))).toBe('low');      // 18d
  });

  // ── Filtering ──────────────────────────────────────────────────────────────

  it('should render a button per filter option', () => {
    expect(filterBtns().length).toBe(component.filters.length);
  });

  it('should filter records when a filter button is clicked', () => {
    const legalBtn = filterBtns().find((b) => b.textContent!.trim() === 'Legal')!;
    legalBtn.click();
    fixture.detectChanges();
    expect(service.filter()).toBe('legal');
    expect(cards().length).toBe(1);
  });

  it('should show the empty state when a filter matches nothing', () => {
    service.setFilter('resolved');
    fixture.detectChanges();
    expect(cards().length).toBe(0);
    expect(empty()).toBeTruthy();
  });

  it('should mark the active filter button', () => {
    service.setFilter('overdue');
    fixture.detectChanges();
    const active = fixture.nativeElement.querySelector('.ra-filter-active');
    expect(active.textContent.trim()).toBe('Overdue');
  });

  // ── Actions wired to the service ───────────────────────────────────────────

  it('should send a reminder and bump the reminder count', () => {
    const before = record('ar003').reminderCount;
    service.sendReminder('ar003');
    fixture.detectChanges();
    const after = record('ar003');
    expect(after.status).toBe('reminder_sent');
    expect(after.reminderCount).toBe(before + 1);
  });

  it('should escalate a record to legal', () => {
    service.escalateToLegal('ar001');
    expect(record('ar001').status).toBe('legal');
  });

  it('should mark a record resolved and zero its outstanding amount', () => {
    service.markResolved('ar001');
    const r = record('ar001');
    expect(r.status).toBe('resolved');
    expect(r.amountOutstanding).toBe(0);
    expect(r.amountPaid).toBe(r.amountDue);
  });

  // ── Payment plan form ──────────────────────────────────────────────────────

  it('should open the payment plan form with a suggested instalment', () => {
    const r = record('ar003'); // outstanding 475
    component.openPlanForm(r);
    expect(component.planFormId()).toBe('ar003');
    expect(component.planAmount()).toBe(Math.ceil(475 / 4));
  });

  it('should activate a payment plan on submit and close the form', () => {
    const r = record('ar003');
    component.openPlanForm(r);
    component.submitPlan(r);
    expect(component.planFormId()).toBeNull();
    const updated = record('ar003');
    expect(updated.paymentPlanActive).toBe(true);
    expect(updated.status).toBe('payment_plan');
  });

  it('should not activate a plan when the amount is zero', () => {
    const r = record('ar003');
    component.planAmount.set(0);
    component.submitPlan(r);
    expect(record('ar003').paymentPlanActive).toBe(false);
  });

  // ── Pure helpers ───────────────────────────────────────────────────────────

  it('should build two-letter uppercase initials from a name', () => {
    expect(component.initials('Carlos Mendes')).toBe('CM');
    expect(component.initials('rita oliveira')).toBe('RO');
  });

  it('should map status codes to readable labels', () => {
    expect(component.statusLabel('reminder_sent')).toBe('Reminder Sent');
    expect(component.statusLabel('legal')).toBe('Legal');
  });

  it('should fall back to the raw status for an unknown code', () => {
    expect(component.statusLabel('unknown')).toBe('unknown');
  });
});
