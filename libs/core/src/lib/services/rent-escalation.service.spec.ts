import { TestBed } from '@angular/core/testing';
import { RentEscalationService, PT_RENT_ESCALATION_COEFICIENTS } from './rent-escalation.service';

describe('RentEscalationService', () => {
  let service: RentEscalationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RentEscalationService);
    service.reset();
  });

  it('seeds with €800 / 2024 → 2026 by default', () => {
    expect(service.rendaActual()).toBe(800);
    expect(service.anoInicio()).toBe(2024);
    expect(service.anoAlvo()).toBe(2026);
  });

  it('returns the built-in Portaria coefficient when no override is set', () => {
    expect(service.coeficienteFor(2025)).toBe(PT_RENT_ESCALATION_COEFICIENTS[2025]);
    expect(service.coeficienteFor(2026)).toBe(PT_RENT_ESCALATION_COEFICIENTS[2026]);
  });

  it('falls back to 1.0 for unknown years', () => {
    expect(service.coeficienteFor(1999)).toBe(1.0);
    expect(service.coeficienteFor(2099)).toBe(1.0);
  });

  it('compounds yearly coefficients across the range (2024 → 2026)', () => {
    // 800 × 1.0228 (2025) × 1.0216 (2026)
    const expected2025 = 800 * PT_RENT_ESCALATION_COEFICIENTS[2025];
    const expected2026 = expected2025 * PT_RENT_ESCALATION_COEFICIENTS[2026];
    const rows = service.historicoEscalation();
    expect(rows.length).toBe(2);
    expect(rows[0].rendaFim).toBeCloseTo(Math.round(expected2025 * 100) / 100, 2);
    expect(rows[1].rendaFim).toBeCloseTo(Math.round(expected2026 * 100) / 100, 2);
    expect(service.rendaAtualizada()).toBeCloseTo(Math.round(expected2026 * 100) / 100, 2);
  });

  it('reports per-year aumento (EUR delta) per row', () => {
    const rows = service.historicoEscalation();
    expect(rows[0].aumentoEur).toBeCloseTo(rows[0].rendaFim - rows[0].rendaInicio, 2);
    expect(rows[1].rendaInicio).toBe(rows[0].rendaFim);
  });

  it('produces empty history when anoAlvo ≤ anoInicio', () => {
    service.setAnos(2026, 2026);
    expect(service.historicoEscalation()).toEqual([]);
    expect(service.rendaAtualizada()).toBe(service.rendaActual());
    expect(service.aumentoTotal()).toBe(0);
    expect(service.aumentoPct()).toBe(0);
  });

  it('applyCoeficienteOverride wins over the built-in coefficient', () => {
    service.applyCoeficienteOverride(2025, 1.10);
    expect(service.coeficienteFor(2025)).toBe(1.10);
    const rows = service.historicoEscalation();
    expect(rows[0].coeficiente).toBe(1.10);
    expect(rows[0].rendaFim).toBeCloseTo(800 * 1.10, 2);
  });

  it('rejects non-positive or non-finite override values', () => {
    service.applyCoeficienteOverride(2025, 0);
    service.applyCoeficienteOverride(2025, -1);
    service.applyCoeficienteOverride(2025, Number.NaN);
    expect(service.coeficienteFor(2025)).toBe(PT_RENT_ESCALATION_COEFICIENTS[2025]);
  });

  it('aumentoPct is total increase relative to starting rent', () => {
    service.setRenda(1000);
    service.setAnos(2024, 2026);
    const pctExpected = ((service.rendaAtualizada() - 1000) / 1000) * 100;
    expect(service.aumentoPct()).toBeCloseTo(Math.round(pctExpected * 100) / 100, 2);
  });

  it('setRenda clamps negative or non-finite values to 0', () => {
    service.setRenda(-50);
    expect(service.rendaActual()).toBe(0);
    service.setRenda(Number.NaN);
    expect(service.rendaActual()).toBe(0);
  });

  it('reset() restores defaults and clears overrides', () => {
    service.setRenda(1500);
    service.setAnos(2020, 2026);
    service.applyCoeficienteOverride(2025, 1.05);
    service.reset();
    expect(service.rendaActual()).toBe(800);
    expect(service.anoInicio()).toBe(2024);
    expect(service.anoAlvo()).toBe(2026);
    expect(service.coeficienteFor(2025)).toBe(PT_RENT_ESCALATION_COEFICIENTS[2025]);
  });
});
