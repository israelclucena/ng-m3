import { TestBed } from '@angular/core/testing';
import { RevenueAnalyticsService } from './revenue-analytics.service';

describe('RevenueAnalyticsService', () => {
  let service: RevenueAnalyticsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RevenueAnalyticsService);
  });

  it('should be created', () => expect(service).toBeTruthy());

  it('starts with no analytics, not loading', () => {
    expect(service.analytics()).toBeNull();
    expect(service.loading()).toBe(false);
  });

  it('derived KPI/data/topProperties are null/empty before load', () => {
    expect(service.kpis()).toBeNull();
    expect(service.monthlyData()).toEqual([]);
    expect(service.topProperties()).toEqual([]);
    expect(service.bestMonth()).toBeNull();
    expect(service.currentMonth()).toBeNull();
    expect(service.previousMonth()).toBeNull();
  });

  it('load() flips loading to true synchronously, then back to false on completion', async () => {
    const promise = service.load();
    expect(service.loading()).toBe(true);
    await promise;
    expect(service.loading()).toBe(false);
  });

  it('load() populates analytics with kpis, monthlyData and topProperties', async () => {
    await service.load();
    const a = service.analytics();
    expect(a).not.toBeNull();
    expect(a!.kpis).toBeDefined();
    expect(a!.monthlyData).toHaveLength(12);
    expect(a!.topProperties).toHaveLength(3);
    expect(typeof a!.lastUpdated).toBe('string');
  });

  it('kpis aggregates monthly data correctly (totals + currency)', async () => {
    await service.load();
    const kpis = service.kpis()!;
    expect(kpis.currency).toBe('EUR');

    const monthly = service.monthlyData();
    const expectedRevenue = monthly.reduce((s, m) => s + m.revenue, 0);
    const expectedExpenses = monthly.reduce((s, m) => s + m.expenses, 0);
    const expectedBookings = monthly.reduce((s, m) => s + m.bookings, 0);

    expect(kpis.totalRevenueTtm).toBe(expectedRevenue);
    expect(kpis.totalExpensesTtm).toBe(expectedExpenses);
    expect(kpis.netProfitTtm).toBe(expectedRevenue - expectedExpenses);
    expect(kpis.totalBookingsTtm).toBe(expectedBookings);
  });

  it('mrr equals last month revenue and ARR = mrr * 12', async () => {
    await service.load();
    const monthly = service.monthlyData();
    const kpis = service.kpis()!;
    expect(kpis.mrr).toBe(monthly[monthly.length - 1].revenue);
    expect(kpis.arrProjected).toBe(kpis.mrr * 12);
  });

  it('growthMoM is computed from last two monthly revenue values', async () => {
    await service.load();
    const monthly = service.monthlyData();
    const last = monthly[monthly.length - 1].revenue;
    const prev = monthly[monthly.length - 2].revenue;
    const expected = +(((last - prev) / prev) * 100).toFixed(1);
    expect(service.kpis()!.growthMoM).toBe(expected);
  });

  it('avgOccupancyRate is the rounded mean of monthly occupancyRate', async () => {
    await service.load();
    const monthly = service.monthlyData();
    const expectedAvg = Math.round(
      monthly.reduce((s, m) => s + m.occupancyRate, 0) / monthly.length
    );
    expect(service.kpis()!.avgOccupancyRate).toBe(expectedAvg);
  });

  it('bestMonth returns the month with the highest net profit', async () => {
    await service.load();
    const monthly = service.monthlyData();
    const expectedBest = monthly.reduce((best, m) => (m.net > best.net ? m : best));
    expect(service.bestMonth()).toEqual(expectedBest);
  });

  it('currentMonth equals last entry of monthlyData', async () => {
    await service.load();
    const monthly = service.monthlyData();
    expect(service.currentMonth()).toEqual(monthly[monthly.length - 1]);
  });

  it('previousMonth equals second-to-last entry of monthlyData', async () => {
    await service.load();
    const monthly = service.monthlyData();
    expect(service.previousMonth()).toEqual(monthly[monthly.length - 2]);
  });

  it('topProperties returns at least one property with a known trend value', async () => {
    await service.load();
    const tops = service.topProperties();
    expect(tops.length).toBeGreaterThan(0);
    for (const p of tops) {
      expect(['up', 'down', 'flat']).toContain(p.trend);
      expect(p.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(p.occupancyRate).toBeGreaterThanOrEqual(0);
      expect(p.occupancyRate).toBeLessThanOrEqual(100);
    }
  });

  it('formatAmount returns a pt-PT currency string defaulting to EUR', () => {
    const formatted = service.formatAmount(1500);
    expect(formatted).toMatch(/1.?500/);
    expect(formatted).toContain('€');
  });

  it('formatAmount respects a custom currency argument', () => {
    const formatted = service.formatAmount(1500, 'USD');
    expect(formatted).toMatch(/US\$|\$/);
  });

  it('formatAmount drops fractional digits', () => {
    const formatted = service.formatAmount(1234.56);
    expect(formatted).not.toContain(',56');
    expect(formatted).not.toContain('.56');
  });

  it('reset() clears analytics back to null and unloading', async () => {
    await service.load();
    expect(service.analytics()).not.toBeNull();
    service.reset();
    expect(service.analytics()).toBeNull();
    expect(service.loading()).toBe(false);
    expect(service.kpis()).toBeNull();
  });

  it('reset() leaves derived month signals at their empty/null state', async () => {
    await service.load();
    service.reset();
    expect(service.monthlyData()).toEqual([]);
    expect(service.bestMonth()).toBeNull();
    expect(service.currentMonth()).toBeNull();
    expect(service.previousMonth()).toBeNull();
  });

  it('load() can be re-invoked and produces fresh analytics', async () => {
    await service.load('landlord-a');
    const first = service.analytics()!.lastUpdated;
    await new Promise(r => setTimeout(r, 5));
    await service.load('landlord-b');
    const second = service.analytics()!.lastUpdated;
    expect(second >= first).toBe(true);
  });
});
