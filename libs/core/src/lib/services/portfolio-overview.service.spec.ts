import { TestBed } from '@angular/core/testing';
import { PortfolioOverviewService, type PropertyStatus } from './portfolio-overview.service';

describe('PortfolioOverviewService', () => {
  let service: PortfolioOverviewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PortfolioOverviewService);
  });

  it('seeds with 5 mock properties spanning occupied / maintenance / listed statuses', () => {
    const props = service.properties();
    expect(props.length).toBe(5);
    const statuses = props.map(p => p.status).sort();
    // Mock fixture: 3 occupied, 1 maintenance, 1 listed (no vacant entries).
    expect(statuses).toEqual(['listed', 'maintenance', 'occupied', 'occupied', 'occupied']);
  });

  it('seeds 6 monthly snapshots covering Oct→Mar', () => {
    const data = service.monthlyData();
    expect(data.length).toBe(6);
    expect(data[0].month).toBe('Oct');
    expect(data[data.length - 1].month).toBe('Mar');
  });

  describe('kpis', () => {
    it('counts properties per status from the mock fixture', () => {
      const k = service.kpis();
      expect(k.totalProperties).toBe(5);
      expect(k.occupied).toBe(3);
      expect(k.vacant).toBe(0);
      expect(k.maintenance).toBe(1);
    });

    it('totalMRR sums monthlyRent only across occupied properties', () => {
      // Occupied rents: 1200 + 1800 + 1400 = 4400. Listed/maintenance excluded.
      expect(service.kpis().totalMRR).toBe(4400);
    });

    it('avgOccupancyRate averages only properties with occupancyRate > 0', () => {
      // Three occupied properties with rates 92, 88, 100 → avg ≈ 93.33 → rounded 93.
      expect(service.kpis().avgOccupancyRate).toBe(93);
    });

    it('pendingActions sums across every property regardless of status', () => {
      // 1 + 2 + 3 + 4 + 0 = 10
      expect(service.kpis().pendingActions).toBe(10);
    });

    it('reports EUR as the portfolio currency', () => {
      expect(service.kpis().currency).toBe('EUR');
    });
  });

  describe('mrrGrowth', () => {
    it('returns rounded percent delta between the last two monthly snapshots', () => {
      // Feb 5450 → Mar 6000 → +10.09% → rounded 10.
      expect(service.mrrGrowth()).toBe(10);
    });
  });

  describe('statusColor / statusLabel', () => {
    const cases: PropertyStatus[] = ['occupied', 'vacant', 'maintenance', 'listed'];

    it.each(cases)('returns a hex colour for status %s', status => {
      const c = service.statusColor(status);
      expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('returns a Title-Case label for each status', () => {
      expect(service.statusLabel('occupied')).toBe('Occupied');
      expect(service.statusLabel('vacant')).toBe('Vacant');
      expect(service.statusLabel('maintenance')).toBe('Maintenance');
      expect(service.statusLabel('listed')).toBe('Listed');
    });
  });
});
