import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PortfolioOverviewComponent } from './portfolio-overview.component';
import { PortfolioOverviewService } from '../../services/portfolio-overview.service';

describe('PortfolioOverviewComponent', () => {
  let fixture: ComponentFixture<PortfolioOverviewComponent>;
  let component: PortfolioOverviewComponent;
  let service: PortfolioOverviewService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioOverviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PortfolioOverviewComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(PortfolioOverviewService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the header title and subtitle', () => {
    const title = fixture.nativeElement.querySelector('.po-title');
    const subtitle = fixture.nativeElement.querySelector('.po-subtitle');
    expect(title.textContent).toContain('Portfolio Overview');
    expect(subtitle.textContent).toContain('rental portfolio at a glance');
  });

  // ── KPIs ─────────────────────────────────────────────────────────────────────

  it('should compute portfolio KPIs from the mock data', () => {
    const k = service.kpis();
    expect(k.totalProperties).toBe(5);
    expect(k.occupied).toBe(3);
    expect(k.vacant).toBe(0);
    expect(k.maintenance).toBe(1);
    expect(k.totalMRR).toBe(4400); // 1200 + 1800 + 1400
    expect(k.avgOccupancyRate).toBe(93); // round((92 + 88 + 100) / 3)
    expect(k.pendingActions).toBe(10); // 1 + 2 + 3 + 4 + 0
  });

  it('should render KPI values in the strip', () => {
    const values = Array.from(
      fixture.nativeElement.querySelectorAll('.po-kpi-value'),
    ).map((e: any) => e.textContent.trim());
    expect(values[0]).toContain('4,400'); // Monthly Revenue
    expect(values[1]).toBe('93%');
    expect(values[2]).toBe('5');
    expect(values[3]).toBe('10');
  });

  it('should compute positive MRR growth and render the badge', () => {
    expect(service.mrrGrowth()).toBe(10); // round((6000 - 5450) / 5450 * 100)
    const badge = fixture.nativeElement.querySelector('.po-mrr-growth');
    expect(badge).toBeTruthy();
    expect(badge.classList).toContain('positive');
    expect(badge.textContent).toContain('▲');
    expect(badge.textContent).toContain('10');
  });

  // ── Status pills ─────────────────────────────────────────────────────────────

  it('should render occupancy status pills', () => {
    const occupied = fixture.nativeElement.querySelector('.po-status-pill.occupied');
    const vacant = fixture.nativeElement.querySelector('.po-status-pill.vacant');
    const maintenance = fixture.nativeElement.querySelector('.po-status-pill.maintenance');
    expect(occupied.textContent).toContain('3 Occupied');
    expect(vacant.textContent).toContain('0 Vacant');
    expect(maintenance.textContent).toContain('1 Maintenance');
  });

  // ── Chart ──────────────────────────────────────────────────────────────────

  it('should compute the max MRR for chart scaling', () => {
    expect(component.maxMRR()).toBe(6000);
  });

  it('should render one chart bar per monthly snapshot', () => {
    const bars = fixture.nativeElement.querySelectorAll('.po-bar-col');
    expect(bars.length).toBe(service.monthlyData().length);
    expect(bars.length).toBe(6);
  });

  // ── Property cards ───────────────────────────────────────────────────────────

  it('should render one card per property', () => {
    const cards = fixture.nativeElement.querySelectorAll('.po-prop-card');
    expect(cards.length).toBe(5);
  });

  it('should show rent and occupancy bar for occupied properties', () => {
    const rents = fixture.nativeElement.querySelectorAll('.po-prop-rent');
    const occBars = fixture.nativeElement.querySelectorAll('.po-occupancy-fill');
    expect(rents.length).toBe(3); // occupied properties
    expect(occBars.length).toBe(3);
  });

  it('should render pending-action badges with correct pluralization', () => {
    const badges = Array.from(
      fixture.nativeElement.querySelectorAll('.po-pending-badge'),
    ).map((e: any) => e.textContent.trim());
    // 4 properties have pendingActions > 0
    expect(badges.length).toBe(4);
    expect(badges.some((t) => t.includes('1 pending action') && !t.includes('actions'))).toBe(true);
    expect(badges.some((t) => t.includes('2 pending actions'))).toBe(true);
  });

  // ── Helper methods ───────────────────────────────────────────────────────────

  it('should map status colours', () => {
    expect(service.statusColor('occupied')).toBe('#388E3C');
    expect(service.statusColor('maintenance')).toBe('#E65100');
  });

  it('should map status labels', () => {
    expect(service.statusLabel('occupied')).toBe('Occupied');
    expect(service.statusLabel('listed')).toBe('Listed');
  });
});
