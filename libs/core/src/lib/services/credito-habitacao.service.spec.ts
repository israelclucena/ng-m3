import { TestBed } from '@angular/core/testing';
import { CreditoHabitacaoService, PT_EURIBOR_DEFAULTS } from './credito-habitacao.service';

describe('CreditoHabitacaoService', () => {
  let service: CreditoHabitacaoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CreditoHabitacaoService);
    service.reset();
  });

  it('seeds with €250k - €50k = €200k financed and LTV 80%', () => {
    expect(service).toBeTruthy();
    expect(service.capitalFinanciado()).toBe(200_000);
    expect(service.lvr()).toBe(0.8);
  });

  it('Euribor 6M default + 1% spread sets effective TAN at 3.3%', () => {
    expect(service.taxaAplicavel()).toBeCloseTo(PT_EURIBOR_DEFAULTS.euribor6m + 0.01, 4);
  });

  it('taxa fixa ignores Euribor + spread and uses tanFixa directly', () => {
    service.setIndexante('taxaFixa');
    service.setTanFixa(0.04);
    expect(service.taxaAplicavel()).toBe(0.04);
  });

  it('indexante override beats Euribor defaults', () => {
    service.setValorIndexanteOverride(0.03);
    expect(service.taxaAplicavel()).toBeCloseTo(0.04, 4);
  });

  it('zero-rate loan reduces Price formula to capital/n', () => {
    service.setIndexante('taxaFixa');
    service.setTanFixa(0);
    expect(service.prestacaoMensal()).toBe(Math.round((200_000 / 360) * 100) / 100);
  });

  it('Price formula for €200k @ 3.3% / 30y is approx €875/month', () => {
    expect(service.prestacaoMensal()).toBeGreaterThan(850);
    expect(service.prestacaoMensal()).toBeLessThan(900);
  });

  it('prestacaoMensalTotal includes both insurance premiums', () => {
    const base = service.prestacaoMensal();
    expect(service.prestacaoMensalTotal()).toBeCloseTo(base + 25 + 15, 2);
  });

  it('totalJuros > 0 for typical mortgage; ≈ totalPago − capital − seguros', () => {
    expect(service.totalJuros()).toBeGreaterThan(0);
    const semSeguros = service.totalPagoNoFinal() - (25 + 15) * service.meses();
    expect(semSeguros - service.capitalFinanciado()).toBeCloseTo(service.totalJuros(), 0);
  });

  it('TAEG > TAN when seguros are present (real cost > nominal rate)', () => {
    expect(service.taeg()).toBeGreaterThan(service.taxaAplicavel());
  });

  it('TAEG ≈ TAN when seguros are zero', () => {
    service.seguroVidaMensal.set(0);
    service.seguroMultirriscosMensal.set(0);
    expect(service.taeg()).toBeCloseTo(service.taxaAplicavel(), 3);
  });

  it('amortization rows: first 12 months returned, juros decreasing monotonically', () => {
    const first = service.tabelaPrimeirosMeses();
    expect(first.length).toBe(12);
    expect(first[0].mes).toBe(1);
    for (let i = 1; i < first.length; i++) {
      expect(first[i].juros).toBeLessThanOrEqual(first[i - 1].juros);
    }
  });

  it('last 12 rows end with capitalFinal at 0 (loan fully amortized)', () => {
    const last = service.tabelaUltimosMeses();
    expect(last.length).toBe(12);
    expect(last[last.length - 1].mes).toBe(service.meses());
    expect(last[last.length - 1].capitalFinal).toBe(0);
  });

  it('capitalFinanciado clamps at 0 when entrada ≥ valor', () => {
    service.setEntrada(300_000);
    expect(service.capitalFinanciado()).toBe(0);
    expect(service.prestacaoMensal()).toBe(0);
    expect(service.lvr()).toBe(0);
  });

  it('setters reject negative / non-finite values', () => {
    service.setValorImovel(-1);
    expect(service.valorImovel()).toBe(0);
    service.setEntrada(Number.NaN);
    expect(service.entrada()).toBe(0);
    service.setPrazoAnos(0);
    expect(service.prazoAnos()).toBe(1);
    service.setSpread(-0.05);
    expect(service.spread()).toBe(0);
  });

  it('reset() restores all inputs', () => {
    service.setValorImovel(999_999);
    service.setEntrada(123);
    service.setPrazoAnos(10);
    service.setIndexante('taxaFixa');
    service.setSpread(0.05);
    service.setTanFixa(0.07);
    service.reset();
    expect(service.valorImovel()).toBe(250_000);
    expect(service.entrada()).toBe(50_000);
    expect(service.prazoAnos()).toBe(30);
    expect(service.indexante()).toBe('euribor6m');
    expect(service.spread()).toBe(0.01);
    expect(service.tanFixa()).toBe(0.035);
  });
});
