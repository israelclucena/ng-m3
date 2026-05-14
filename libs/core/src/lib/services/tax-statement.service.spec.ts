import { TestBed } from '@angular/core/testing';
import { TaxStatementService } from './tax-statement.service';
import type { RentReceipt } from './rent-receipt.service';

describe('TaxStatementService', () => {
  let service: TaxStatementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaxStatementService);
    service.reset();
    service.setYear(2025);
    service.setPropertyId('');
  });

  it('seeds with empty rent entries, no expenses, and last calendar year as default', () => {
    const fresh = TestBed.inject(TaxStatementService);
    fresh.reset();
    expect(fresh.rentEntries()).toEqual([]);
    expect(fresh.deductibleExpenses()).toEqual([]);
    expect(fresh.totalGrossIncome()).toBe(0);
    expect(fresh.totalDeductions()).toBe(0);
  });

  it('setYear clamps to [1990, currentYear + 1] and ignores non-finite input', () => {
    const cap = new Date().getFullYear() + 1;
    service.setYear(1500);
    expect(service.year()).toBe(1990);
    service.setYear(cap + 5);
    expect(service.year()).toBe(cap);
    service.setYear(Number.NaN);
    expect(service.year()).toBe(cap);
  });

  it('setPropertyId trims whitespace before storing', () => {
    service.setPropertyId('  prop-123  ');
    expect(service.propertyId()).toBe('prop-123');
  });

  it('totalGrossIncome sums positive grossAmount and ignores negatives', () => {
    service.addRentEntry({ month: '2025-01', grossAmount: 1000, withholding: 250 });
    service.addRentEntry({ month: '2025-02', grossAmount: 1200, withholding: 300 });
    service.addRentEntry({ month: '2025-03', grossAmount: -50, withholding: 0 });
    expect(service.totalGrossIncome()).toBe(2200);
  });

  it('withholdingsTotal sums positive withholdings only', () => {
    service.addRentEntry({ month: '2025-01', grossAmount: 1000, withholding: 250 });
    service.addRentEntry({ month: '2025-02', grossAmount: 1000, withholding: -10 });
    expect(service.withholdingsTotal()).toBe(250);
  });

  it('totalDeductions sums all categories together', () => {
    service.addExpense({ category: 'imi', description: 'IMI 1ª prestação', amount: 200, date: '2025-05-31' });
    service.addExpense({ category: 'condominio', description: 'Cond. anual', amount: 480, date: '2025-12-01' });
    service.addExpense({ category: 'seguro_multirriscos', description: 'Seguro', amount: 180, date: '2025-09-15' });
    expect(service.totalDeductions()).toBe(860);
  });

  it('netIncome = gross − deductions, floored at zero', () => {
    service.addRentEntry({ month: '2025-01', grossAmount: 1000, withholding: 0 });
    service.addExpense({ category: 'outros', description: 'big repair', amount: 5000, date: '2025-06-10' });
    expect(service.netIncome()).toBe(0);
  });

  it('effectiveRate is withholdings / gross × 100 (rounded to 2dp), 0 when no gross', () => {
    expect(service.effectiveRate()).toBe(0);
    service.addRentEntry({ month: '2025-01', grossAmount: 1000, withholding: 250 });
    expect(service.effectiveRate()).toBeCloseTo(25, 2);
  });

  it('byCategory subtotals expenses per category', () => {
    service.addExpense({ category: 'imi', description: 'p1', amount: 200, date: '2025-05-31' });
    service.addExpense({ category: 'imi', description: 'p2', amount: 200, date: '2025-08-31' });
    service.addExpense({ category: 'conservacao', description: 'paint', amount: 350, date: '2025-07-12' });
    const map = service.byCategory();
    expect(map.get('imi')).toBe(400);
    expect(map.get('conservacao')).toBe(350);
    expect(map.get('condominio')).toBeUndefined();
  });

  it('removeRentEntry and removeExpense delete by id', () => {
    service.addRentEntry({ month: '2025-01', grossAmount: 1000, withholding: 250 });
    service.addExpense({ category: 'imi', description: 'p1', amount: 200, date: '2025-05-31' });
    const rentId = service.rentEntries()[0].id;
    const expId = service.deductibleExpenses()[0].id;
    service.removeRentEntry(rentId);
    service.removeExpense(expId);
    expect(service.rentEntries()).toEqual([]);
    expect(service.deductibleExpenses()).toEqual([]);
  });

  it('importFromReceipts only ingests receipts matching the current year prefix', () => {
    service.setYear(2025);
    const receipts: RentReceipt[] = [
      {
        id: 'r1', numeroSerie: '2025/00001', emittedAt: 0,
        nifSenhorio: '', nomeSenhorio: '', nifInquilino: '', nomeInquilino: '',
        mesReferencia: '2025-01', moradaImovel: '',
        valorMensal: 1000, retencaoIRSPct: 25, valorRetido: 250, valorLiquido: 750,
      },
      {
        id: 'r2', numeroSerie: '2024/00099', emittedAt: 0,
        nifSenhorio: '', nomeSenhorio: '', nifInquilino: '', nomeInquilino: '',
        mesReferencia: '2024-12', moradaImovel: '',
        valorMensal: 1000, retencaoIRSPct: 25, valorRetido: 250, valorLiquido: 750,
      },
    ];
    service.importFromReceipts(receipts);
    expect(service.rentEntries().length).toBe(1);
    expect(service.rentEntries()[0].month).toBe('2025-01');
    expect(service.totalGrossIncome()).toBe(1000);
    expect(service.withholdingsTotal()).toBe(250);
  });

  it('reset clears entries + expenses but preserves year and propertyId', () => {
    service.setYear(2024);
    service.setPropertyId('prop-7');
    service.addRentEntry({ month: '2024-01', grossAmount: 800, withholding: 200 });
    service.addExpense({ category: 'imi', description: 'p1', amount: 200, date: '2024-05-31' });
    service.reset();
    expect(service.rentEntries()).toEqual([]);
    expect(service.deductibleExpenses()).toEqual([]);
    expect(service.year()).toBe(2024);
    expect(service.propertyId()).toBe('prop-7');
  });
});
