import { TestBed } from '@angular/core/testing';
import {
  IRSCategoriaFService,
  PT_IRS_TAXA_AUTONOMA_CAT_F,
  PT_IRS_ESCALOES_2026,
} from './irs-categoria-f.service';

describe('IRSCategoriaFService', () => {
  let service: IRSCategoriaFService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IRSCategoriaFService);
    service.reset();
  });

  it('seeds with €12k bruta − €2k despesas → €10k líquido', () => {
    expect(service).toBeTruthy();
    expect(service.rendimentoLiquido()).toBe(10_000);
  });

  it('taxa autónoma 28% applied to líquido', () => {
    expect(PT_IRS_TAXA_AUTONOMA_CAT_F).toBe(0.28);
    expect(service.colectaTaxaAutonoma()).toBe(2_800);
  });

  it('rendimentoLiquido clamps at 0 when despesas exceed bruta', () => {
    service.setRendimentoBruto(5_000);
    service.setDespesas(8_000);
    expect(service.rendimentoLiquido()).toBe(0);
    expect(service.colectaTaxaAutonoma()).toBe(0);
    expect(service.colectaEnglobamento()).toBe(0);
  });

  it('englobamento on €10k líquido (no other income) uses 1st two brackets', () => {
    const expected =
      PT_IRS_ESCALOES_2026[0].upTo * PT_IRS_ESCALOES_2026[0].taxa +
      (10_000 - PT_IRS_ESCALOES_2026[0].upTo) * PT_IRS_ESCALOES_2026[1].taxa;
    expect(service.colectaEnglobamento()).toBeCloseTo(expected, 2);
    expect(service.melhorRegime()).toBe('englobamento');
  });

  it('high other-income stacks Cat. F into top bracket (48%)', () => {
    service.setOutrosRendimentos(100_000);
    service.setRendimentoBruto(20_000);
    service.setDespesas(0);
    expect(service.colectaEnglobamento()).toBeCloseTo(20_000 * 0.48, 2);
    expect(service.melhorRegime()).toBe('taxaAutonoma28');
  });

  it('poupança equals absolute difference between regimes', () => {
    const expected = Math.abs(service.colectaTaxaAutonoma() - service.colectaEnglobamento());
    expect(service.poupanca()).toBeCloseTo(expected, 2);
  });

  it('regime selection drives colectaActual + taxaEfectiva', () => {
    service.setRegime('taxaAutonoma28');
    expect(service.colectaActual()).toBe(service.colectaTaxaAutonoma());
    expect(service.taxaEfectiva()).toBeCloseTo(0.28, 4);
    service.setRegime('englobamento');
    expect(service.colectaActual()).toBe(service.colectaEnglobamento());
  });

  it('taxaEfectiva is 0 when líquido is 0 (no division by zero)', () => {
    service.setRendimentoBruto(0);
    service.setDespesas(0);
    expect(service.rendimentoLiquido()).toBe(0);
    expect(service.taxaEfectiva()).toBe(0);
    expect(service.comparacao().taxaAutonoma.taxaEfectiva).toBe(0);
    expect(service.comparacao().englobamento.taxaEfectiva).toBe(0);
  });

  it('input setters reject negative / non-finite values', () => {
    service.setRendimentoBruto(-5);
    expect(service.rendimentoBrutoAnual()).toBe(0);
    service.setDespesas(Number.NaN);
    expect(service.despesasDedutiveis()).toBe(0);
    service.setOutrosRendimentos(-100);
    expect(service.outrosRendimentosEnglobamento()).toBe(0);
  });

  it('comparacao() returns both regimes with rates expressed as decimals', () => {
    const c = service.comparacao();
    expect(c.taxaAutonoma.colecta).toBeCloseTo(service.colectaTaxaAutonoma(), 2);
    expect(c.englobamento.colecta).toBeCloseTo(service.colectaEnglobamento(), 2);
    expect(c.taxaAutonoma.taxaEfectiva).toBeCloseTo(0.28, 4);
  });

  it('reset() restores all inputs to defaults', () => {
    service.setRendimentoBruto(99_999);
    service.setDespesas(50_000);
    service.setOutrosRendimentos(70_000);
    service.setRegime('englobamento');
    service.agregadoFamiliar.set(4);
    service.reset();
    expect(service.rendimentoBrutoAnual()).toBe(12_000);
    expect(service.despesasDedutiveis()).toBe(2_000);
    expect(service.outrosRendimentosEnglobamento()).toBe(0);
    expect(service.regime()).toBe('taxaAutonoma28');
    expect(service.agregadoFamiliar()).toBe(0);
  });
});
