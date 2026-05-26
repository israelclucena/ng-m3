import { TestBed } from '@angular/core/testing';
import { TenantDashboardService } from './tenant-dashboard.service';

describe('TenantDashboardService', () => {
  let service: TenantDashboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TenantDashboardService);
  });

  it('should be created', () => expect(service).toBeTruthy());

  it('starts with no dashboard, not loading, no error', () => {
    expect(service.dashboard()).toBeNull();
    expect(service.isLoading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('derived collections are empty before load', () => {
    expect(service.kpis()).toBeNull();
    expect(service.payments()).toEqual([]);
    expect(service.bookings()).toEqual([]);
    expect(service.favourites()).toEqual([]);
    expect(service.spendingHistory()).toEqual([]);
    expect(service.paidCount()).toBe(0);
    expect(service.totalPaidTtm()).toBe(0);
    expect(service.activeRental()).toBeNull();
    expect(service.nextBooking()).toBeNull();
  });

  it('load() flips isLoading true synchronously then false on completion', async () => {
    const promise = service.load();
    expect(service.isLoading()).toBe(true);
    await promise;
    expect(service.isLoading()).toBe(false);
  });

  it('load() populates dashboard with all sections and a lastUpdated string', async () => {
    await service.load();
    const d = service.dashboard();
    expect(d).not.toBeNull();
    expect(d!.kpis).toBeDefined();
    expect(d!.payments.length).toBeGreaterThan(0);
    expect(d!.bookings.length).toBeGreaterThan(0);
    expect(d!.favourites.length).toBeGreaterThan(0);
    expect(d!.spendingHistory).toHaveLength(12);
    expect(typeof d!.lastUpdated).toBe('string');
  });

  it('payments has 12 entries with exactly one pending (most recent)', async () => {
    await service.load();
    const payments = service.payments();
    expect(payments).toHaveLength(12);
    const pending = payments.filter((p) => p.status === 'pending');
    expect(pending).toHaveLength(1);
    expect(pending[0].id).toBe('pay-1');
  });

  it('paidCount matches the number of paid payments (11 of 12)', async () => {
    await service.load();
    expect(service.paidCount()).toBe(11);
  });

  it('totalPaidTtm sums only paid payments', async () => {
    await service.load();
    const expected = service
      .payments()
      .filter((p) => p.status === 'paid')
      .reduce((s, p) => s + p.amount, 0);
    expect(service.totalPaidTtm()).toBe(expected);
    expect(service.kpis()!.totalPaidTtm).toBe(expected);
  });

  it('avgMonthlySpend equals round(totalPaidTtm / 11)', async () => {
    await service.load();
    const kpis = service.kpis()!;
    expect(kpis.avgMonthlySpend).toBe(Math.round(kpis.totalPaidTtm / 11));
  });

  it('activeRental returns the single active booking', async () => {
    await service.load();
    const active = service.activeRental();
    expect(active).not.toBeNull();
    expect(active!.status).toBe('active');
  });

  it('nextBooking returns the upcoming booking with daysUntilStart set', async () => {
    await service.load();
    const next = service.nextBooking();
    expect(next).not.toBeNull();
    expect(next!.status).toBe('upcoming');
    expect(next!.daysUntilStart).toBeGreaterThan(0);
  });

  it('kpis exposes a fixed snapshot (currency, counts, peak month)', async () => {
    await service.load();
    const kpis = service.kpis()!;
    expect(kpis.currency).toBe('EUR');
    expect(kpis.activeBookings).toBe(1);
    expect(kpis.completedRentals).toBe(2);
    expect(kpis.savedFavourites).toBe(4);
    expect(kpis.peakMonth).toBe('Set 2025');
  });

  it('spendingHistory entries satisfy total = rent + fees', async () => {
    await service.load();
    for (const point of service.spendingHistory()) {
      expect(point.total).toBe(point.rent + point.fees);
    }
  });

  it('favourites contains both available and unavailable properties', async () => {
    await service.load();
    const favs = service.favourites();
    expect(favs.some((f) => f.available)).toBe(true);
    expect(favs.some((f) => !f.available)).toBe(true);
  });

  it('formatAmount returns a pt-PT EUR currency string', () => {
    const formatted = service.formatAmount(1250);
    expect(formatted).toMatch(/1.?250/);
    expect(formatted).toContain('€');
  });

  it('formatAmount drops fractional digits', () => {
    const formatted = service.formatAmount(1234.56);
    expect(formatted).not.toContain(',56');
    expect(formatted).not.toContain('.56');
  });

  it('load() can be re-invoked with a tenantId and refreshes lastUpdated', async () => {
    await service.load('tenant-a');
    const first = service.dashboard()!.lastUpdated;
    await new Promise((r) => setTimeout(r, 5));
    await service.load('tenant-b');
    const second = service.dashboard()!.lastUpdated;
    expect(second >= first).toBe(true);
  });

  it('clears error to null on successful load', async () => {
    await service.load();
    expect(service.error()).toBeNull();
  });
});
