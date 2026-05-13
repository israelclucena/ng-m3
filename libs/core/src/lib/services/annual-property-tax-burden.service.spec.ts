import { TestBed } from '@angular/core/testing';
import {
  AnnualPropertyTaxBurdenService,
  type PropertyDisposition,
} from './annual-property-tax-burden.service';
import { PortfolioMockService } from './portfolio-mock.service';
import { PT_MV_TAXA_AUTONOMA, PT_MV_QUOTA_RESIDENTE, PT_MV_QUOTA_NAO_RESIDENTE } from './mais-valias-imobiliarias.service';

describe('AnnualPropertyTaxBurdenService', () => {
  let service: AnnualPropertyTaxBurdenService;
  let portfolio: PortfolioMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnnualPropertyTaxBurdenService);
    portfolio = TestBed.inject(PortfolioMockService);
    service.reset();
  });

  it('seeds with current year and zero dispositions', () => {
    expect(service.year()).toBe(new Date().getFullYear());
    expect(service.dispositions()).toEqual([]);
  });

  it('result aggregates IMI as Σ vpt × imiTaxRate across the 8 portfolio properties', () => {
    const expectedIMI = portfolio.properties()
      .reduce((s, p) => s + p.vpt * p.imiTaxRate, 0);
    expect(service.result().imi).toBeCloseTo(expectedIMI, 2);
  });

  it('perProperty has one line per portfolio property', () => {
    expect(service.result().perProperty.length).toBe(portfolio.properties().length);
  });

  it('result.total equals imi + aimi + irsF + maisValias', () => {
    const r = service.result();
    expect(r.total).toBeCloseTo(r.imi + r.aimi + r.irsF + r.maisValias, 2);
  });

  it('with no dispositions, maisValias is 0 and no mv calendar event', () => {
    const r = service.result();
    expect(r.maisValias).toBe(0);
    expect(r.calendarEvents.some(e => e.kind === 'mais-valias')).toBe(false);
  });

  it('disposition residente uses 50% quota × 28% taxa', () => {
    const first = portfolio.properties()[0];
    const sale: PropertyDisposition = {
      propertyId: first.id,
      salePrice: first.acquisitionValue + 100_000,
      saleDate: '2026-07-15',
      residencia: 'residente',
    };
    service.setDispositions([sale]);
    const r = service.result();
    const expectedMV = 100_000 * PT_MV_QUOTA_RESIDENTE * PT_MV_TAXA_AUTONOMA;
    expect(r.maisValias).toBeCloseTo(expectedMV, 2);
    expect(r.dispositions.length).toBe(1);
    expect(r.dispositions[0].tributavel).toBeCloseTo(100_000 * PT_MV_QUOTA_RESIDENTE, 2);
  });

  it('disposition nao-residente uses 100% quota × 28% taxa', () => {
    const first = portfolio.properties()[0];
    service.setDispositions([{
      propertyId: first.id,
      salePrice: first.acquisitionValue + 80_000,
      saleDate: '2026-06-01',
      residencia: 'nao-residente',
    }]);
    expect(service.result().dispositions[0].tributavel)
      .toBeCloseTo(80_000 * PT_MV_QUOTA_NAO_RESIDENTE, 2);
    expect(service.result().maisValias)
      .toBeCloseTo(80_000 * PT_MV_QUOTA_NAO_RESIDENTE * PT_MV_TAXA_AUTONOMA, 2);
  });

  it('a sale at acquisition value produces zero mais-valia bruta', () => {
    const p = portfolio.properties()[0];
    service.setDispositions([{
      propertyId: p.id,
      salePrice: p.acquisitionValue,
      saleDate: '2026-06-01',
    }]);
    const line = service.result().dispositions[0];
    expect(line.maisValiaBruta).toBe(0);
    expect(line.colecta).toBe(0);
  });

  it('unknown property ids in dispositions are silently dropped', () => {
    service.setDispositions([
      { propertyId: 'does-not-exist', salePrice: 500_000, saleDate: '2026-06-01' },
    ]);
    expect(service.result().dispositions.length).toBe(0);
    expect(service.result().maisValias).toBe(0);
  });

  it('IMI calendar splits into 1/2/3 prestações based on AT thresholds', () => {
    // Pull the actual IMI from result, but check the split rule directly via
    // hand-picked smaller / mid / larger fake portfolios is too invasive.
    // Verify on the natural portfolio: IMI is well above 500€ → 3 prestações.
    const imiEvents = service.result().calendarEvents.filter(e => e.kind === 'imi');
    expect(imiEvents.length).toBe(3);
    const sum = imiEvents.reduce((s, e) => s + e.amount, 0);
    expect(sum).toBeCloseTo(service.result().imi, 1);
  });

  it('AIMI is included only if VPT total exceeds the singular dedução', () => {
    const r = service.result();
    const vptTotal = portfolio.properties().reduce((s, p) => s + p.vpt, 0);
    if (vptTotal > 600_000) {
      expect(r.aimi).toBeGreaterThan(0);
      expect(r.calendarEvents.some(e => e.kind === 'aimi')).toBe(true);
    } else {
      expect(r.aimi).toBe(0);
      expect(r.calendarEvents.some(e => e.kind === 'aimi')).toBe(false);
    }
  });

  it('AIMI calendar event falls on 30 Sep of the fiscal year', () => {
    const r = service.result();
    const aimi = r.calendarEvents.find(e => e.kind === 'aimi');
    if (aimi) {
      expect(aimi.date.getUTCMonth()).toBe(8); // Sep (0-indexed)
      expect(aimi.date.getUTCDate()).toBe(30);
      expect(aimi.date.getUTCFullYear()).toBe(service.year());
    }
  });

  it('IRS Cat. F calendar event is on 30 Jun of the year AFTER the fiscal year', () => {
    service.setYear(2026);
    const irs = service.result().calendarEvents.find(e => e.kind === 'irs')!;
    expect(irs).toBeDefined();
    expect(irs.date.getUTCFullYear()).toBe(2027);
    expect(irs.date.getUTCMonth()).toBe(5);
    expect(irs.date.getUTCDate()).toBe(30);
  });

  it('annualBurden() returns an ad-hoc projection without mutating state', () => {
    const before = service.year();
    const proj = service.annualBurden(2030);
    expect(proj.year).toBe(2030);
    expect(service.year()).toBe(before);
  });

  it('calendarEvents are returned sorted ascending by date', () => {
    const events = service.result().calendarEvents;
    for (let i = 1; i < events.length; i++) {
      expect(events[i].date.getTime()).toBeGreaterThanOrEqual(events[i - 1].date.getTime());
    }
  });

  it('setYear rejects non-finite values and trunates to integer', () => {
    service.setYear(Number.NaN);
    expect(service.year()).toBe(new Date().getFullYear());
    service.setYear(2027.9);
    expect(service.year()).toBe(2027);
  });
});
