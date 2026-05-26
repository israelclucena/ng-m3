import { TestBed } from '@angular/core/testing';
import { PortfolioMockService } from './portfolio-mock.service';

describe('PortfolioMockService', () => {
  let service: PortfolioMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PortfolioMockService);
  });

  it('should be created', () => expect(service).toBeTruthy());

  it('exposes 8 seed properties with unique ids', () => {
    const props = service.properties();
    expect(props).toHaveLength(8);
    expect(service.count()).toBe(8);
    const ids = props.map((p) => p.id);
    expect(new Set(ids).size).toBe(8);
  });

  it('every property has the required schema fields', () => {
    for (const p of service.properties()) {
      expect(typeof p.id).toBe('string');
      expect(typeof p.address).toBe('string');
      expect(typeof p.neighbourhood).toBe('string');
      expect(['T0', 'T1', 'T2', 'T3']).toContain(p.type);
      expect(p.areaM2).toBeGreaterThan(0);
      expect(p.marketValue).toBeGreaterThan(0);
      expect(p.acquisitionValue).toBeGreaterThan(0);
      expect(['taxaAutonoma28', 'englobamento']).toContain(p.irsRegime);
      expect(p.energy).toBeDefined();
      expect(p.insurance).toBeDefined();
      expect(p.lease).toBeDefined();
      expect(p.lease.monthlyRent).toBeGreaterThan(0);
    }
  });

  it('totalMarketValue equals the sum of all marketValue entries', () => {
    const expected = service.properties().reduce((s, p) => s + p.marketValue, 0);
    expect(service.totalMarketValue()).toBe(expected);
  });

  it('totalAcquisitionValue equals the sum of all acquisitionValue entries', () => {
    const expected = service
      .properties()
      .reduce((s, p) => s + p.acquisitionValue, 0);
    expect(service.totalAcquisitionValue()).toBe(expected);
  });

  it('totalAnnualRent equals sum of monthlyRent * 12', () => {
    const expected = service
      .properties()
      .reduce((s, p) => s + p.lease.monthlyRent * 12, 0);
    expect(service.totalAnnualRent()).toBe(expected);
  });

  it('totalGrossYield equals totalAnnualRent / totalMarketValue', () => {
    const expected = service.totalAnnualRent() / service.totalMarketValue();
    expect(service.totalGrossYield()).toBeCloseTo(expected, 10);
    expect(service.totalGrossYield()).toBeGreaterThan(0);
    expect(service.totalGrossYield()).toBeLessThan(0.2);
  });

  it('totalGrossYield is 0 when properties signal is emptied', () => {
    service.properties.set([]);
    expect(service.totalGrossYield()).toBe(0);
    expect(service.count()).toBe(0);
    expect(service.totalMarketValue()).toBe(0);
  });

  it('complianceCounts sums to the property count per category', () => {
    const counts = service.complianceCounts();
    const n = service.count();
    expect(counts.energyOk + counts.energyWarning + counts.energyExpired).toBe(n);
    expect(
      counts.insuranceOk + counts.insuranceWarning + counts.insuranceExpired,
    ).toBe(n);
    expect(counts.leasesEscalationDue).toBeGreaterThanOrEqual(0);
    expect(counts.leasesEscalationDue).toBeLessThanOrEqual(n);
  });

  it('seed dataset includes the diversity required by downstream calculators', () => {
    const counts = service.complianceCounts();
    expect(counts.energyExpired).toBeGreaterThan(0);
    expect(counts.energyWarning).toBeGreaterThan(0);
    expect(counts.insuranceExpired).toBeGreaterThan(0);
    expect(counts.insuranceWarning).toBeGreaterThan(0);
    expect(counts.leasesEscalationDue).toBeGreaterThan(0);
    expect(service.byRegime('taxaAutonoma28').length).toBeGreaterThan(0);
    expect(service.byRegime('englobamento').length).toBeGreaterThan(0);
  });

  it('byId returns the matching property or undefined', () => {
    expect(service.byId('pt-001')?.neighbourhood).toBe('Bairro Alto');
    expect(service.byId('does-not-exist')).toBeUndefined();
  });

  it('byNeighbourhood is case-insensitive', () => {
    const lower = service.byNeighbourhood('bairro alto');
    const upper = service.byNeighbourhood('BAIRRO ALTO');
    expect(lower.length).toBeGreaterThan(0);
    expect(upper).toEqual(lower);
    expect(service.byNeighbourhood('Nonexistent')).toEqual([]);
  });

  it('byRegime filters by IRS regime exactly', () => {
    const autonoma = service.byRegime('taxaAutonoma28');
    const englobamento = service.byRegime('englobamento');
    expect(autonoma.length + englobamento.length).toBe(service.count());
    expect(autonoma.every((p) => p.irsRegime === 'taxaAutonoma28')).toBe(true);
    expect(englobamento.every((p) => p.irsRegime === 'englobamento')).toBe(true);
  });
});
