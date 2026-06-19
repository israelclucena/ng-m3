import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewingSchedulerComponent } from './viewing-scheduler.component';
import { ViewingSchedulerService } from '../../services/viewing-scheduler.service';

describe('ViewingSchedulerComponent', () => {
  let fixture: ComponentFixture<ViewingSchedulerComponent>;
  let component: ViewingSchedulerComponent;
  let service: ViewingSchedulerService;

  const cards = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.vs-card'));
  const kpiNums = (): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.vs-kpi-num')).map(
      (e) => (e as HTMLElement).textContent!.trim(),
    );
  const filterBtns = (): HTMLButtonElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.vs-filter-btn'));
  const actionBtns = (): HTMLButtonElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.vs-btn'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewingSchedulerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewingSchedulerComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(ViewingSchedulerService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the title', () => {
    expect(fixture.nativeElement.querySelector('.vs-title').textContent).toContain('Viewing Scheduler');
  });

  it('should default the filter to "all" on init', () => {
    expect(service.filter()).toBe('all');
  });

  // ── KPIs ─────────────────────────────────────────────────────────────────

  it('should compute KPIs from the mock data', () => {
    const k = service.kpis();
    // mock: 2 pending (v002, v003), 1 confirmed (v001), 1 completed (v004), 1 cancelled (v005)
    expect(k.pending).toBe(2);
    expect(k.confirmed).toBe(1);
    expect(k.completed).toBe(1);
    expect(k.cancelled).toBe(1);
    expect(k.total).toBe(5);
  });

  it('should render KPI values in the strip', () => {
    expect(kpiNums()).toEqual(['2', '1', '1', '5']);
  });

  // ── Filtering ──────────────────────────────────────────────────────────────

  it('should render one card per viewing when showing all', () => {
    expect(cards().length).toBe(5);
  });

  it('should filter the list by status', () => {
    service.setFilter('pending');
    fixture.detectChanges();
    expect(service.filtered().length).toBe(2);
    expect(cards().length).toBe(2);
  });

  it('should show the empty state when no viewing matches', () => {
    service.setFilter('no_show');
    fixture.detectChanges();
    expect(cards().length).toBe(0);
    expect(fixture.nativeElement.querySelector('.vs-empty')).toBeTruthy();
  });

  it('should switch filter via the filter buttons', () => {
    const confirmedBtn = filterBtns().find(b => b.textContent!.trim() === 'Confirmed')!;
    confirmedBtn.click();
    fixture.detectChanges();
    expect(service.filter()).toBe('confirmed');
    expect(cards().length).toBe(1);
  });

  // ── Status transitions ───────────────────────────────────────────────────────

  it('should confirm a pending viewing', () => {
    service.confirm('v002');
    expect(service.viewings().find(v => v.id === 'v002')!.status).toBe('confirmed');
  });

  it('should complete a viewing', () => {
    service.complete('v001');
    expect(service.viewings().find(v => v.id === 'v001')!.status).toBe('completed');
  });

  it('should cancel a viewing', () => {
    service.cancel('v002');
    expect(service.viewings().find(v => v.id === 'v002')!.status).toBe('cancelled');
  });

  it('should mark a viewing as no-show', () => {
    service.markNoShow('v001');
    expect(service.viewings().find(v => v.id === 'v001')!.status).toBe('no_show');
  });

  it('should sort upcoming viewings by date+time', () => {
    const ids = service.upcoming().map(v => v.id);
    // pending/confirmed only: v001 (04-05), v002 (04-06), v003 (04-07)
    expect(ids).toEqual(['v001', 'v002', 'v003']);
  });

  // ── Mode-driven actions ──────────────────────────────────────────────────────

  it('should expose confirm action for pending viewings in landlord mode', () => {
    component.mode = 'landlord';
    service.setFilter('pending');
    fixture.detectChanges();
    const labels = actionBtns().map(b => b.textContent!.trim());
    expect(labels.some(l => l.includes('Confirm'))).toBe(true);
  });

  it('should only expose cancel in tenant mode', () => {
    component.mode = 'tenant';
    service.setFilter('pending');
    fixture.detectChanges();
    const labels = actionBtns().map(b => b.textContent!.trim());
    expect(labels.every(l => l.includes('Cancel'))).toBe(true);
    expect(labels.some(l => l.includes('Confirm'))).toBe(false);
  });

  // ── Label / colour helpers ────────────────────────────────────────────────────

  it('should map status to a human label', () => {
    expect(component.statusLabel('no_show')).toBe('No Show');
    expect(component.statusLabel('confirmed')).toBe('Confirmed');
    expect(component.statusLabel('unknown')).toBe('unknown');
  });

  it('should map status to a colour with a fallback', () => {
    expect(component.statusColor('confirmed')).toBe('#1976D2');
    expect(component.statusColor('bogus')).toBe('#9e9e9e');
  });

  // ── request() ────────────────────────────────────────────────────────────────

  it('should add a pending viewing via request()', () => {
    const before = service.viewings().length;
    const slot = service.request({
      propertyId: 'prop-x',
      propertyAddress: 'Rua X',
      tenantId: 'tenant-x',
      tenantName: 'New Tenant',
      tenantEmail: 'x@email.com',
      date: '2026-05-01',
      time: '10:00',
    });
    expect(service.viewings().length).toBe(before + 1);
    expect(slot.status).toBe('pending');
    expect(slot.durationMin).toBe(45); // default
    expect(slot.type).toBe('in_person'); // default
  });
});
