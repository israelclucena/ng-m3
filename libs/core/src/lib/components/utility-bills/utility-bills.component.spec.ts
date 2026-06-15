import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UtilityBillsComponent } from './utility-bills.component';
import { UtilityBillsService } from '../../services/utility-bills.service';

describe('UtilityBillsComponent', () => {
  let fixture: ComponentFixture<UtilityBillsComponent>;
  let component: UtilityBillsComponent;
  let service: UtilityBillsService;

  const cards = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.ub-card'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UtilityBillsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UtilityBillsComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(UtilityBillsService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the header title and subtitle', () => {
    const title = fixture.nativeElement.querySelector('.ub-title');
    const subtitle = fixture.nativeElement.querySelector('.ub-subtitle');
    expect(title.textContent).toContain('Utility Bills');
    expect(subtitle.textContent).toContain('Track and manage utility costs');
  });

  // ── KPIs ─────────────────────────────────────────────────────────────────────

  it('should compute KPIs from the mock data', () => {
    const k = service.kpis();
    // pending (56.80) + overdue (34.20)
    expect(k.totalDue).toBeCloseTo(91.0, 2);
    // paid: 87.40 + 39.99 + 18.00
    expect(k.totalPaid).toBeCloseTo(145.39, 2);
    expect(k.overdue).toBe(1);
    expect(k.disputed).toBe(1);
  });

  it('should render KPI values in the strip', () => {
    const values = Array.from(
      fixture.nativeElement.querySelectorAll('.ub-kpi-value'),
    ).map((e: any) => e.textContent.trim());
    expect(values[0]).toContain('91.00');
    expect(values[1]).toContain('145.39');
    expect(values[2]).toBe('1'); // overdue count
    expect(values[3]).toBe('1'); // disputed count
  });

  // ── List + filters ─────────────────────────────────────────────────────────

  it('should render all bills initially', () => {
    expect(cards().length).toBe(service.bills().length);
    expect(cards().length).toBe(6);
  });

  it('should filter by status', () => {
    service.setFilterStatus('paid');
    fixture.detectChanges();
    expect(component.svc.filtered().every((b) => b.status === 'paid')).toBe(true);
    expect(cards().length).toBe(3);
  });

  it('should filter by type', () => {
    service.setFilterType('electricity');
    fixture.detectChanges();
    expect(component.svc.filtered().every((b) => b.type === 'electricity')).toBe(true);
    expect(cards().length).toBe(2);
  });

  it('should combine status and type filters', () => {
    service.setFilterStatus('paid');
    service.setFilterType('electricity');
    fixture.detectChanges();
    // ub001 is paid electricity
    expect(cards().length).toBe(1);
  });

  it('should show the empty state when no bills match', () => {
    service.setFilterStatus('paid');
    service.setFilterType('gas'); // the only gas bill is pending
    fixture.detectChanges();
    expect(cards().length).toBe(0);
    expect(fixture.nativeElement.querySelector('.ub-empty')).toBeTruthy();
  });

  it('should mark active chip for the selected status', () => {
    service.setFilterStatus('overdue');
    fixture.detectChanges();
    const activeChips = Array.from(
      fixture.nativeElement.querySelectorAll('.ub-chip.active'),
    ).map((e: any) => e.textContent.trim());
    expect(activeChips).toContain('Overdue');
  });

  // ── Actions ──────────────────────────────────────────────────────────────────

  it('should mark a bill as paid and update KPIs', () => {
    const overdue = service.bills().find((b) => b.status === 'overdue')!;
    const paidBefore = service.kpis().totalPaid;
    service.markPaid(overdue.id);
    fixture.detectChanges();
    const updated = service.bills().find((b) => b.id === overdue.id)!;
    expect(updated.status).toBe('paid');
    expect(updated.paidDate).toBeTruthy();
    expect(service.kpis().totalPaid).toBeCloseTo(paidBefore + overdue.amount, 2);
    expect(service.kpis().overdue).toBe(0);
  });

  it('should dispute a bill with notes', () => {
    const pending = service.bills().find((b) => b.status === 'pending')!;
    service.disputeBill(pending.id, 'Disputed — under review');
    fixture.detectChanges();
    const updated = service.bills().find((b) => b.id === pending.id)!;
    expect(updated.status).toBe('disputed');
    expect(updated.notes).toBe('Disputed — under review');
  });

  // ── Rendering details ───────────────────────────────────────────────────────

  it('should highlight overdue cards', () => {
    expect(fixture.nativeElement.querySelector('.ub-card.overdue-card')).toBeTruthy();
  });

  it('should show split-cost note for split bills', () => {
    service.setFilterType('gas'); // ub003 is split 40%
    fixture.detectChanges();
    const note = fixture.nativeElement.querySelector('.ub-split-note');
    expect(note.textContent).toContain('Landlord 40%');
    expect(note.textContent).toContain('Tenant 60%');
  });

  // ── Label/helper methods ────────────────────────────────────────────────────

  it('should map status labels', () => {
    expect(component.statusLabel('overdue')).toBe('Overdue');
    expect(component.statusLabel('disputed')).toBe('Disputed');
  });

  it('should map type labels', () => {
    expect(component.typeLabel('electricity')).toBe('Electricity');
    expect(component.typeLabel('waste')).toBe('Waste');
  });
});
