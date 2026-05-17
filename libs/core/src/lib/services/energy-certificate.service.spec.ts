import { TestBed } from '@angular/core/testing';
import {
  EnergyCertificateService,
  PT_CE_FINE_MAX_EUR,
  PT_CE_FINE_MIN_EUR,
  PT_ENERGY_CLASS_UPPER_KWH,
  type EnergyClass,
} from './energy-certificate.service';

describe('EnergyCertificateService', () => {
  let service: EnergyCertificateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnergyCertificateService);
  });

  it('seeds with sensible defaults for habitacao', () => {
    expect(service.numeroCertificado()).toBe('CE-2024-1234567');
    expect(service.classe()).toBe('C');
    expect(service.dataEmissao()).toBe('2024-06-15');
    expect(service.validadeAnos()).toBe(10);
    expect(service.tipoImovel()).toBe('habitacao');
    expect(service.areaM2()).toBe(80);
  });

  it('dataExpiracao = dataEmissao + validadeAnos', () => {
    service.setDataEmissao('2024-06-15');
    service.setValidadeAnos(10);
    expect(service.dataExpiracao()).toBe('2034-06-15');
  });

  it('valido is true on the issue date and false the day after expiry', () => {
    service.setDataEmissao('2024-06-15');
    service.setValidadeAnos(10);
    service.setHoje('2024-06-15');
    expect(service.valido()).toBe(true);
    expect(service.diasParaExpirar()).toBeGreaterThan(0);

    service.setHoje('2034-06-16');
    expect(service.valido()).toBe(false);
    expect(service.diasParaExpirar()).toBeLessThan(0);
  });

  it('obrigatorioParaListing is always true (DL 118/2013)', () => {
    expect(service.obrigatorioParaListing()).toBe(true);
    service.setTipoImovel('comercio');
    expect(service.obrigatorioParaListing()).toBe(true);
  });

  it('economiaPotencialKwhAno is zero for class A+ and A', () => {
    service.setClasse('A+');
    expect(service.economiaPotencialKwhAno()).toBe(0);
    service.setClasse('A');
    expect(service.economiaPotencialKwhAno()).toBe(0);
  });

  it('economiaPotencialKwhAno applies (currentUpper - A_ref) * area for finite classes', () => {
    service.setAreaM2(80);
    service.setClasse('C');
    // (200 - 50) * 80 = 12 000
    expect(service.economiaPotencialKwhAno()).toBe(12000);

    service.setClasse('B-');
    // (150 - 50) * 80 = 8 000
    expect(service.economiaPotencialKwhAno()).toBe(8000);
  });

  it('economiaPotencialKwhAno falls back to a finite estimate for class F', () => {
    service.setClasse('F');
    service.setAreaM2(80);
    // 80 * (350 - 50) = 24 000
    expect(service.economiaPotencialKwhAno()).toBe(24000);
    expect(Number.isFinite(PT_ENERGY_CLASS_UPPER_KWH.F)).toBe(false);
  });

  it('setTipoImovel adjusts validadeAnos to legal default per type', () => {
    service.setTipoImovel('comercio');
    expect(service.validadeAnos()).toBe(6);

    service.setTipoImovel('servico');
    expect(service.validadeAnos()).toBe(6);

    service.setTipoImovel('habitacao');
    expect(service.validadeAnos()).toBe(10);
  });

  it('setValidadeAnos falls back to 10 when value is invalid', () => {
    service.setValidadeAnos(NaN as unknown as number);
    expect(service.validadeAnos()).toBe(10);

    service.setValidadeAnos(-3);
    expect(service.validadeAnos()).toBe(10);
  });

  it('setAreaM2 clamps invalid or negative values to 0', () => {
    service.setAreaM2(-50);
    expect(service.areaM2()).toBe(0);

    service.setAreaM2(NaN as unknown as number);
    expect(service.areaM2()).toBe(0);
  });

  it('recomendacaoMelhoria flags expired certs with the fine range', () => {
    service.setDataEmissao('2010-01-01');
    service.setValidadeAnos(5);
    service.setHoje('2026-05-17');
    expect(service.valido()).toBe(false);
    expect(service.recomendacaoMelhoria()).toMatch(/expirado/i);
    expect(service.recomendacaoMelhoria()).toMatch(/250.*3740/);
  });

  it('recomendacaoMelhoria branches by class for a valid certificate', () => {
    service.setDataEmissao('2024-06-15');
    service.setValidadeAnos(10);
    service.setHoje('2026-05-17');

    const expectations: Array<[EnergyClass, RegExp]> = [
      ['A+', /excelente/i],
      ['A', /excelente/i],
      ['B', /boa efici/i],
      ['B-', /boa efici/i],
      ['C', /mediana/i],
      ['D', /financiamento/i],
      ['E', /reabilita/i],
      ['F', /reabilita/i],
    ];

    for (const [cls, pattern] of expectations) {
      service.setClasse(cls);
      expect(service.recomendacaoMelhoria()).toMatch(pattern);
    }
  });

  it('multaSemCertificado exposes the legal fine range', () => {
    const m = service.multaSemCertificado();
    expect(m.min).toBe(PT_CE_FINE_MIN_EUR);
    expect(m.max).toBe(PT_CE_FINE_MAX_EUR);
    expect(m.min).toBe(250);
    expect(m.max).toBe(3740);
  });

  it('setters update the underlying signals', () => {
    service.setNumero('CE-2026-9999999');
    expect(service.numeroCertificado()).toBe('CE-2026-9999999');

    service.setClasse('A+');
    expect(service.classe()).toBe('A+');

    service.setDataEmissao('2025-01-01');
    expect(service.dataEmissao()).toBe('2025-01-01');

    service.setHoje('2027-01-01');
    expect(service.hoje()).toBe('2027-01-01');
  });

  it('reset restores all defaults including hoje and areaM2', () => {
    service.setClasse('F');
    service.setAreaM2(500);
    service.setTipoImovel('servico');
    service.setHoje('2030-01-01');

    service.reset();

    expect(service.classe()).toBe('C');
    expect(service.areaM2()).toBe(80);
    expect(service.tipoImovel()).toBe('habitacao');
    expect(service.validadeAnos()).toBe(10);
  });
});
