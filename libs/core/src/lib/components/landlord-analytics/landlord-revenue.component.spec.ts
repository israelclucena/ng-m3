import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { LandlordRevenueComponent } from './landlord-revenue.component';
import {
  RevenueAnalyticsService,
  MonthlyRevenue,
  RevenueKPIs,
} from '../../services/revenue-analytics.service';

/** Build a monthly revenue point, overridable per test. */
function month(over: Partial<MonthlyRevenue> = {}): MonthlyRevenue {
  return {
    month: 'Jan',
    year: 2026,
    revenue: 1000,
    expenses: 400,
    net: 600,
    bookings: 3,
    occupancyRate: 90,
    ...over,
  };
}

/** Build a KPI snapshot, overridable per test. */
function kpis(over: Partial<RevenueKPIs> = {}): RevenueKPIs {
  return {
    mrr: 4000,
    arrProjected: 48000,
    totalRevenueTtm: 40000,
    totalExpensesTtm: 10000,
    netProfitTtm: 30000,
    totalBookingsTtm: 40,
    avgOccupancyRate: 85,
    growthMoM: 10,
    currency: 'EUR',
    ...over,
  };
}

describe('LandlordRevenueComponent', () => {
  let fixture: ComponentFixture<LandlordRevenueComponent>;
  let component: LandlordRevenueComponent;
  let mockSvc: {
    loading: ReturnType<typeof signal<boolean>>;
    kpis: ReturnType<typeof signal<RevenueKPIs | null>>;
    monthlyData: ReturnType<typeof signal<MonthlyRevenue[]>>;
    topProperties: ReturnType<typeof signal<unknown[]>>;
    formatAmount: jest.Mock;
    load: jest.Mock;
  };

  beforeEach(async () => {
    mockSvc = {
      loading: signal(false),
      kpis: signal<RevenueKPIs | null>(null),
      monthlyData: signal<MonthlyRevenue[]>([]),
      topProperties: signal<unknown[]>([]),
      formatAmount: jest.fn((amount: number) => `€${amount}`),
      load: jest.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [LandlordRevenueComponent],
      providers: [{ provide: RevenueAnalyticsService, useValue: mockSvc }],
    }).compileComponents();

    fixture = TestBed.createComponent(LandlordRevenueComponent);
    component = fixture.componentInstance;
    // Disable the auto-load effect — tests drive the mock service directly.
    fixture.componentRef.setInput('autoLoad', false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not auto-load when autoLoad is disabled', () => {
    expect(mockSvc.load).not.toHaveBeenCalled();
  });

  // ── barHeight ────────────────────────────────────────────────────────────────

  it('scales a bar to a fraction of the tallest revenue month (capped at 100px)', () => {
    mockSvc.monthlyData.set([month({ revenue: 1000 }), month({ revenue: 2000 })]);
    expect(component.barHeight(2000)).toBe(100); // tallest → full height
    expect(component.barHeight(1000)).toBe(50);  // half of tallest
  });

  it('guards against division by zero when there is no monthly data', () => {
    mockSvc.monthlyData.set([]);
    expect(component.barHeight(0)).toBe(0);
  });

  // ── mrrTrendClass / mrrTrendIcon ─────────────────────────────────────────────

  it('marks positive month-over-month growth as an up trend', () => {
    mockSvc.kpis.set(kpis({ growthMoM: 12 }));
    expect(component.mrrTrendClass()).toContain('--up');
    expect(component.mrrTrendIcon()).toBe('▲');
  });

  it('marks negative growth as a down trend', () => {
    mockSvc.kpis.set(kpis({ growthMoM: -5 }));
    expect(component.mrrTrendClass()).toContain('--down');
    expect(component.mrrTrendIcon()).toBe('▼');
  });

  it('marks flat growth as a flat trend', () => {
    mockSvc.kpis.set(kpis({ growthMoM: 0 }));
    expect(component.mrrTrendClass()).toContain('--flat');
    expect(component.mrrTrendIcon()).toBe('—');
  });

  it('defaults to a flat trend when KPIs are not yet loaded', () => {
    mockSvc.kpis.set(null);
    expect(component.mrrTrendClass()).toContain('--flat');
    expect(component.mrrTrendIcon()).toBe('—');
  });

  // ── fmt ──────────────────────────────────────────────────────────────────────

  it('delegates currency formatting to the analytics service', () => {
    expect(component.fmt(1500)).toBe('€1500');
    expect(mockSvc.formatAmount).toHaveBeenCalledWith(1500);
  });
});
