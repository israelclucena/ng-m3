import { TestBed } from '@angular/core/testing';
import {
  IMICalculatorService,
  PT_IMI_TAXAS_MUNICIPAIS,
  PT_IMI_TAXA_DEFAULT,
} from './imi-calculator.service';

describe('IMICalculatorService', () => {
  let service: IMICalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IMICalculatorService);
    service.reset();
  });

  it('is created with sensible defaults', () => {
    expect(service).toBeTruthy();
    expect(service.vpt()).toBe(150_000);
    expect(service.concelho()).toBe('Lisboa');
    expect(service.usoProprio()).toBe(true);
  });

  it('applies Lisboa municipal rate (0.3%) to €150k VPT → €450/year', () => {
    expect(service.taxaAplicavel()).toBe(PT_IMI_TAXAS_MUNICIPAIS['Lisboa']);
    expect(service.imiAnualBruto()).toBe(450);
  });

  it('falls back to default rate (0.4%) for unknown concelho', () => {
    service.setConcelho('Bragança');
    expect(service.taxaAplicavel()).toBe(PT_IMI_TAXA_DEFAULT);
    expect(service.imiAnualBruto()).toBe(600);
  });

  it('manual rate override takes precedence over concelho table', () => {
    service.setTaxaOverride(0.005);
    expect(service.taxaAplicavel()).toBe(0.005);
    expect(service.imiAnualBruto()).toBe(750);
  });

  it('ignores invalid (≤0 or non-finite) overrides and falls back to concelho rate', () => {
    service.setTaxaOverride(0);
    expect(service.taxaAplicavel()).toBe(PT_IMI_TAXAS_MUNICIPAIS['Lisboa']);
    service.setTaxaOverride(Number.NaN);
    expect(service.taxaAplicavel()).toBe(PT_IMI_TAXAS_MUNICIPAIS['Lisboa']);
  });

  it('rebate scales 0/20/40/70 with dependants and zeroes out when not uso próprio', () => {
    service.agregadoFamiliar.set(0);
    expect(service.isencaoEstimada()).toBe(0);
    service.agregadoFamiliar.set(1);
    expect(service.isencaoEstimada()).toBe(20);
    service.agregadoFamiliar.set(2);
    expect(service.isencaoEstimada()).toBe(40);
    service.agregadoFamiliar.set(5);
    expect(service.isencaoEstimada()).toBe(70);
    service.usoProprio.set(false);
    expect(service.isencaoEstimada()).toBe(0);
  });

  it('clamps imiAnual at 0 when rebate exceeds bruto', () => {
    service.setVpt(2_000);
    service.agregadoFamiliar.set(3);
    expect(service.imiAnualBruto()).toBe(6);
    expect(service.isencaoEstimada()).toBe(70);
    expect(service.imiAnual()).toBe(0);
  });

  it('splits into 1 installment when annual ≤ €100 (Maio only)', () => {
    service.setVpt(20_000);
    expect(service.imiAnual()).toBe(60);
    expect(service.numeroPrestacoes()).toBe(1);
    const cal = service.prestacoesCalendario();
    expect(cal).toEqual([{ numero: 1, mes: 'Maio', valor: 60 }]);
  });

  it('splits into 2 installments when ≤ €500 (Maio + Novembro)', () => {
    service.setVpt(100_000);
    expect(service.imiAnual()).toBe(300);
    expect(service.numeroPrestacoes()).toBe(2);
    const cal = service.prestacoesCalendario();
    expect(cal.length).toBe(2);
    expect(cal[0]).toEqual({ numero: 1, mes: 'Maio', valor: 150 });
    expect(cal[1]).toEqual({ numero: 2, mes: 'Novembro', valor: 150 });
  });

  it('splits into 3 installments when > €500 with the last absorbing the remainder', () => {
    service.setTaxaOverride(0.005);
    service.setVpt(200_001);
    expect(service.imiAnual()).toBeCloseTo(1000.005, 2);
    expect(service.numeroPrestacoes()).toBe(3);
    const cal = service.prestacoesCalendario();
    expect(cal.length).toBe(3);
    const sum = cal.reduce((s, p) => s + p.valor, 0);
    expect(sum).toBeCloseTo(service.imiAnual(), 2);
    expect(cal.map((p) => p.mes)).toEqual(['Maio', 'Agosto', 'Novembro']);
  });

  it('setVpt rejects negative or non-finite values, clamping to 0', () => {
    service.setVpt(-100);
    expect(service.vpt()).toBe(0);
    service.setVpt(Number.NaN);
    expect(service.vpt()).toBe(0);
    expect(service.imiAnualBruto()).toBe(0);
  });

  it('reset() restores all inputs to defaults', () => {
    service.setVpt(999_999);
    service.setConcelho('Porto');
    service.setTaxaOverride(0.01);
    service.usoProprio.set(false);
    service.agregadoFamiliar.set(3);
    service.reset();
    expect(service.vpt()).toBe(150_000);
    expect(service.concelho()).toBe('Lisboa');
    expect(service.taxaMunicipalOverride()).toBe(null);
    expect(service.usoProprio()).toBe(true);
    expect(service.agregadoFamiliar()).toBe(0);
  });
});
