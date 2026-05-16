import { TestBed } from '@angular/core/testing';
import {
  RentReceiptService,
  isValidNIF,
  type RentReceiptInput,
} from './rent-receipt.service';

function baseInput(overrides: Partial<RentReceiptInput> = {}): RentReceiptInput {
  return {
    nifSenhorio: '123456789',
    nomeSenhorio: 'Senhorio A',
    nifInquilino: '987654321',
    nomeInquilino: 'Inquilino B',
    mesReferencia: '2026-05',
    valorMensal: 800,
    retencaoIRSPct: 25,
    moradaImovel: 'Rua de Teste, 1',
    ...overrides,
  };
}

describe('RentReceiptService', () => {
  let service: RentReceiptService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RentReceiptService);
  });

  it('starts empty', () => {
    expect(service.receipts().length).toBe(0);
    expect(service.count()).toBe(0);
    expect(service.totalGross()).toBe(0);
    expect(service.totalWithheld()).toBe(0);
  });

  it('generate adds a receipt with computed withholding and net value', () => {
    const r = service.generate(baseInput({ valorMensal: 800, retencaoIRSPct: 25 }));
    expect(r.valorRetido).toBe(200);
    expect(r.valorLiquido).toBe(600);
    expect(r.retencaoIRSPct).toBe(25);
    expect(service.count()).toBe(1);
    expect(service.receipts()[0]).toEqual(r);
  });

  it('inserts new receipts at the head (most-recent-first)', () => {
    const r1 = service.generate(baseInput({ mesReferencia: '2026-04' }));
    const r2 = service.generate(baseInput({ mesReferencia: '2026-05' }));
    expect(service.receipts()[0].id).toBe(r2.id);
    expect(service.receipts()[1].id).toBe(r1.id);
  });

  it('assigns unique ids and monotonically growing series numbers', () => {
    const r1 = service.generate(baseInput());
    const r2 = service.generate(baseInput());
    expect(r1.id).not.toBe(r2.id);
    expect(r1.numeroSerie).not.toBe(r2.numeroSerie);
    // Format: YYYY/NNNNN
    expect(r1.numeroSerie).toMatch(/^\d{4}\/\d{5}$/);
    expect(r2.numeroSerie).toMatch(/^\d{4}\/\d{5}$/);
  });

  it('clamps retencaoIRSPct to [0, 100] and falls back to 25 when not finite', () => {
    const neg = service.generate(baseInput({ retencaoIRSPct: -5 }));
    expect(neg.retencaoIRSPct).toBe(0);
    expect(neg.valorRetido).toBe(0);

    const huge = service.generate(baseInput({ retencaoIRSPct: 500 }));
    expect(huge.retencaoIRSPct).toBe(100);
    expect(huge.valorLiquido).toBe(0);

    const nan = service.generate(baseInput({ retencaoIRSPct: Number.NaN }));
    expect(nan.retencaoIRSPct).toBe(25);
  });

  it('coerces negative or NaN valorMensal to 0', () => {
    const neg = service.generate(baseInput({ valorMensal: -100 }));
    expect(neg.valorMensal).toBe(0);
    expect(neg.valorRetido).toBe(0);
    expect(neg.valorLiquido).toBe(0);

    const nan = service.generate(baseInput({ valorMensal: Number.NaN }));
    expect(nan.valorMensal).toBe(0);
  });

  it('rounds withholding and net value to 2 decimal places', () => {
    const r = service.generate(baseInput({ valorMensal: 833.33, retencaoIRSPct: 25 }));
    // 833.33 * 0.25 = 208.3325 → 208.33
    expect(r.valorRetido).toBe(208.33);
    // 833.33 - 208.33 = 625.00
    expect(r.valorLiquido).toBe(625);
  });

  it('trims string fields when generating', () => {
    const r = service.generate(baseInput({
      nifSenhorio: '  123456789  ',
      nomeSenhorio: '  Maria  ',
      nifInquilino: '  987654321  ',
      nomeInquilino: '  João  ',
      moradaImovel: '  Rua A, 1  ',
    }));
    expect(r.nifSenhorio).toBe('123456789');
    expect(r.nomeSenhorio).toBe('Maria');
    expect(r.nifInquilino).toBe('987654321');
    expect(r.nomeInquilino).toBe('João');
    expect(r.moradaImovel).toBe('Rua A, 1');
  });

  it('totalGross and totalWithheld aggregate across all archived receipts', () => {
    service.generate(baseInput({ valorMensal: 500, retencaoIRSPct: 25 }));   // retido 125
    service.generate(baseInput({ valorMensal: 800, retencaoIRSPct: 25 }));   // retido 200
    service.generate(baseInput({ valorMensal: 1200, retencaoIRSPct: 10 }));  // retido 120
    expect(service.totalGross()).toBe(2500);
    expect(service.totalWithheld()).toBe(445);
  });

  it('remove drops a receipt by id and is a no-op for unknown ids', () => {
    const r1 = service.generate(baseInput());
    const r2 = service.generate(baseInput());
    expect(service.count()).toBe(2);
    service.remove(r1.id);
    expect(service.count()).toBe(1);
    expect(service.receipts()[0].id).toBe(r2.id);

    const snapshot = service.receipts();
    service.remove('does-not-exist');
    expect(service.receipts()).toEqual(snapshot);
  });

  it('clear wipes the in-session archive', () => {
    service.generate(baseInput());
    service.generate(baseInput());
    expect(service.count()).toBe(2);
    service.clear();
    expect(service.count()).toBe(0);
    expect(service.receipts()).toEqual([]);
  });

  it('emittedAt is a recent epoch ms timestamp', () => {
    const before = Date.now();
    const r = service.generate(baseInput());
    const after = Date.now();
    expect(r.emittedAt).toBeGreaterThanOrEqual(before);
    expect(r.emittedAt).toBeLessThanOrEqual(after);
  });
});

describe('isValidNIF', () => {
  it('rejects strings that are not exactly 9 digits', () => {
    expect(isValidNIF('')).toBe(false);
    expect(isValidNIF('12345678')).toBe(false);   // 8 digits
    expect(isValidNIF('1234567890')).toBe(false); // 10 digits
    expect(isValidNIF('12345678A')).toBe(false);  // non-digit
    expect(isValidNIF('  123456789  ')).toBe(false);
  });

  it('accepts a valid checksum NIF and rejects an invalid one', () => {
    // Build a valid NIF: pick first 8 digits and compute the checksum.
    const base = '12345678';
    const digits = base.split('').map(Number);
    const checksum = digits.reduce((acc, d, idx) => acc + d * (9 - idx), 0);
    const mod = checksum % 11;
    const expected = mod < 2 ? 0 : 11 - mod;
    const valid = base + expected;
    expect(isValidNIF(valid)).toBe(true);

    // Flip the check digit to a different value → invalid.
    const invalidCheck = (expected + 1) % 10;
    expect(isValidNIF(base + invalidCheck)).toBe(false);
  });
});
