import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CreditoHabitacaoSimulatorComponent } from './credito-habitacao-simulator.component';
import { CreditoHabitacaoService } from '../../services/credito-habitacao.service';
import type { AmortizationRow, MortgageIndexante } from '../../services/credito-habitacao.service';

describe('CreditoHabitacaoSimulatorComponent', () => {
  let fixture: ComponentFixture<CreditoHabitacaoSimulatorComponent>;
  let component: CreditoHabitacaoSimulatorComponent;

  const baseFirstRows: readonly AmortizationRow[] = [
    { mes: 1, capitalInicial: 200000, juros: 550, amortizacao: 250, capitalFinal: 199750, prestacao: 800 },
    { mes: 2, capitalInicial: 199750, juros: 549, amortizacao: 251, capitalFinal: 199499, prestacao: 800 },
    { mes: 3, capitalInicial: 199499, juros: 548, amortizacao: 252, capitalFinal: 199247, prestacao: 800 },
  ];

  const baseLastRows: readonly AmortizationRow[] = [
    { mes: 358, capitalInicial: 2400, juros: 6.6, amortizacao: 793.4, capitalFinal: 1606.6, prestacao: 800 },
    { mes: 359, capitalInicial: 1606.6, juros: 4.4, amortizacao: 795.6, capitalFinal: 811, prestacao: 800 },
    { mes: 360, capitalInicial: 811, juros: 2.2, amortizacao: 811, capitalFinal: 0, prestacao: 813.2 },
  ];

  const stub = {
    valorImovel: signal<number>(250000),
    entrada: signal<number>(50000),
    prazoAnos: signal<number>(30),
    indexante: signal<MortgageIndexante>('euribor6m'),
    spread: signal<number>(0.01),
    valorIndexanteOverride: signal<number | null>(null),
    tanFixa: signal<number>(0.035),
    seguroVidaMensal: signal<number>(25),
    seguroMultirriscosMensal: signal<number>(15),
    capitalFinanciado: signal<number>(200000),
    lvr: signal<number>(0.8),
    taxaAplicavel: signal<number>(0.033),
    meses: signal<number>(360),
    prestacaoMensal: signal<number>(800),
    prestacaoMensalTotal: signal<number>(840),
    totalPagoNoFinal: signal<number>(302400),
    totalJuros: signal<number>(88000),
    taeg: signal<number>(0.0345),
    tabelaPrimeirosMeses: signal<readonly AmortizationRow[]>(baseFirstRows),
    tabelaUltimosMeses: signal<readonly AmortizationRow[]>(baseLastRows),
    setValorImovel: jest.fn(function (this: void, v: number) {
      stub.valorImovel.set(v);
    }),
    setEntrada: jest.fn(function (this: void, v: number) {
      stub.entrada.set(v);
    }),
    setPrazoAnos: jest.fn(function (this: void, v: number) {
      stub.prazoAnos.set(v);
    }),
    setIndexante: jest.fn(function (this: void, v: MortgageIndexante) {
      stub.indexante.set(v);
    }),
    setSpread: jest.fn(function (this: void, v: number) {
      stub.spread.set(v);
    }),
    setValorIndexanteOverride: jest.fn(function (this: void, v: number | null) {
      stub.valorIndexanteOverride.set(v);
    }),
    setTanFixa: jest.fn(function (this: void, v: number) {
      stub.tanFixa.set(v);
    }),
    reset: jest.fn(),
  };

  beforeEach(async () => {
    stub.valorImovel.set(250000);
    stub.entrada.set(50000);
    stub.prazoAnos.set(30);
    stub.indexante.set('euribor6m');
    stub.spread.set(0.01);
    stub.valorIndexanteOverride.set(null);
    stub.tanFixa.set(0.035);
    stub.seguroVidaMensal.set(25);
    stub.seguroMultirriscosMensal.set(15);
    stub.capitalFinanciado.set(200000);
    stub.lvr.set(0.8);
    stub.taxaAplicavel.set(0.033);
    stub.meses.set(360);
    stub.prestacaoMensal.set(800);
    stub.prestacaoMensalTotal.set(840);
    stub.totalPagoNoFinal.set(302400);
    stub.totalJuros.set(88000);
    stub.taeg.set(0.0345);
    stub.tabelaPrimeirosMeses.set(baseFirstRows);
    stub.tabelaUltimosMeses.set(baseLastRows);
    stub.setValorImovel.mockClear();
    stub.setEntrada.mockClear();
    stub.setPrazoAnos.mockClear();
    stub.setIndexante.mockClear();
    stub.setSpread.mockClear();
    stub.setValorIndexanteOverride.mockClear();
    stub.setTanFixa.mockClear();
    stub.reset.mockClear();

    await TestBed.configureTestingModule({
      imports: [CreditoHabitacaoSimulatorComponent],
      providers: [
        { provide: CreditoHabitacaoService, useValue: stub as any },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreditoHabitacaoSimulatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the title and subtitle', () => {
    const title = fixture.nativeElement.querySelector('.ch-title') as HTMLElement;
    const subtitle = fixture.nativeElement.querySelector('.ch-subtitle') as HTMLElement;
    expect(title.textContent).toContain('Simulador Crédito Habitação');
    expect(subtitle.textContent).toContain('Prestação Price');
    expect(subtitle.textContent).toContain('TAEG');
    expect(subtitle.textContent).toContain('LTV');
  });

  it('reset button calls service.reset()', () => {
    const btn = fixture.nativeElement.querySelector('.ch-reset') as HTMLButtonElement;
    btn.click();
    expect(stub.reset).toHaveBeenCalledTimes(1);
  });

  it('valor imóvel input reflects svc.valorImovel() and typing calls setValorImovel', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.ch-input');
    const valorInput = inputs[0] as HTMLInputElement;
    expect(valorInput.value).toBe('250000');
    valorInput.value = '300000';
    valorInput.dispatchEvent(new Event('input'));
    expect(stub.setValorImovel).toHaveBeenCalledWith(300000);
  });

  it('entrada input reflects svc.entrada() and typing calls setEntrada', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.ch-input');
    const entradaInput = inputs[1] as HTMLInputElement;
    expect(entradaInput.value).toBe('50000');
    entradaInput.value = '60000';
    entradaInput.dispatchEvent(new Event('input'));
    expect(stub.setEntrada).toHaveBeenCalledWith(60000);
  });

  it('prazo input reflects svc.prazoAnos() and typing calls setPrazoAnos', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.ch-input');
    const prazoInput = inputs[2] as HTMLInputElement;
    expect(prazoInput.value).toBe('30');
    prazoInput.value = '25';
    prazoInput.dispatchEvent(new Event('input'));
    expect(stub.setPrazoAnos).toHaveBeenCalledWith(25);
  });

  it('indexante select changing calls setIndexante with new value', () => {
    const select = fixture.nativeElement.querySelector('select.ch-input') as HTMLSelectElement;
    expect(select).toBeTruthy();
    select.value = 'euribor12m';
    select.dispatchEvent(new Event('change'));
    expect(stub.setIndexante).toHaveBeenCalledWith('euribor12m');
  });

  it('renders one option for each indexante choice', () => {
    const options = fixture.nativeElement.querySelectorAll('select.ch-input option');
    const values = Array.from(options).map((o: any) => o.value);
    expect(values).toEqual(['euribor3m', 'euribor6m', 'euribor12m', 'taxaFixa']);
  });

  it('indexante helper shows euribor default when not taxaFixa', () => {
    const helpers = fixture.nativeElement.querySelectorAll('.ch-helper');
    const text = Array.from(helpers)
      .map((h: any) => h.textContent)
      .join(' ');
    expect(text).toContain('Default 2.30%');
    expect(text).toContain('refs Maio 2026');
  });

  it('indexante helper switches to "TAN fixa" message when taxaFixa selected', () => {
    stub.indexante.set('taxaFixa');
    fixture.detectChanges();
    const helpers = fixture.nativeElement.querySelectorAll('.ch-helper');
    const text = Array.from(helpers)
      .map((h: any) => h.textContent)
      .join(' ');
    expect(text).toContain('TAN fixa para todo o prazo');
  });

  it('shows spread and override inputs when indexante is variable', () => {
    const labels = Array.from(fixture.nativeElement.querySelectorAll('.ch-label'))
      .map((l: any) => l.textContent);
    expect(labels).toContain('Spread (%)');
    expect(labels).toContain('Override indexante (%)');
    expect(labels).not.toContain('TAN fixa (%)');
  });

  it('shows TAN fixa input (not spread/override) when indexante is taxaFixa', () => {
    stub.indexante.set('taxaFixa');
    fixture.detectChanges();
    const labels = Array.from(fixture.nativeElement.querySelectorAll('.ch-label'))
      .map((l: any) => l.textContent);
    expect(labels).toContain('TAN fixa (%)');
    expect(labels).not.toContain('Spread (%)');
    expect(labels).not.toContain('Override indexante (%)');
  });

  it('spread input shows spread as percentage and typing calls setSpread with decimal', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.ch-input');
    const spreadInput = inputs[3] as HTMLInputElement;
    expect(spreadInput.value).toBe('1.00');
    spreadInput.value = '1.5';
    spreadInput.dispatchEvent(new Event('input'));
    expect(stub.setSpread).toHaveBeenCalledWith(0.015);
  });

  it('override input is empty when valorIndexanteOverride is null', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.ch-input');
    const overrideInput = inputs[4] as HTMLInputElement;
    expect(overrideInput.value).toBe('');
  });

  it('override input shows percentage when valorIndexanteOverride is set', () => {
    stub.valorIndexanteOverride.set(0.024);
    fixture.detectChanges();
    const inputs = fixture.nativeElement.querySelectorAll('input.ch-input');
    const overrideInput = inputs[4] as HTMLInputElement;
    expect(overrideInput.value).toBe('2.40');
  });

  it('typing an override percentage calls setValorIndexanteOverride with decimal', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.ch-input');
    const overrideInput = inputs[4] as HTMLInputElement;
    overrideInput.value = '2.5';
    overrideInput.dispatchEvent(new Event('input'));
    expect(stub.setValorIndexanteOverride).toHaveBeenCalledWith(0.025);
  });

  it('clearing the override input calls setValorIndexanteOverride with null', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.ch-input');
    const overrideInput = inputs[4] as HTMLInputElement;
    overrideInput.value = '';
    overrideInput.dispatchEvent(new Event('input'));
    expect(stub.setValorIndexanteOverride).toHaveBeenCalledWith(null);
  });

  it('a non-numeric override is ignored (no setValorIndexanteOverride call)', () => {
    stub.setValorIndexanteOverride.mockClear();
    (component as any).setOverride({ target: { value: 'abc' } });
    expect(stub.setValorIndexanteOverride).not.toHaveBeenCalled();
  });

  it('TAN fixa input shows tanFixa as percentage and typing calls setTanFixa with decimal', () => {
    stub.indexante.set('taxaFixa');
    fixture.detectChanges();
    const inputs = fixture.nativeElement.querySelectorAll('input.ch-input');
    const tanInput = inputs[3] as HTMLInputElement;
    expect(tanInput.value).toBe('3.50');
    tanInput.value = '4';
    tanInput.dispatchEvent(new Event('input'));
    expect(stub.setTanFixa).toHaveBeenCalledWith(0.04);
  });

  it('seguro vida input reflects svc.seguroVidaMensal() and typing sets the signal', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.ch-input');
    const vidaInput = inputs[5] as HTMLInputElement;
    expect(vidaInput.value).toBe('25');
    vidaInput.value = '30';
    vidaInput.dispatchEvent(new Event('input'));
    expect(stub.seguroVidaMensal()).toBe(30);
  });

  it('seguro vida input clamps negative values to 0', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.ch-input');
    const vidaInput = inputs[5] as HTMLInputElement;
    vidaInput.value = '-10';
    vidaInput.dispatchEvent(new Event('input'));
    expect(stub.seguroVidaMensal()).toBe(0);
  });

  it('seguro multirriscos input reflects svc.seguroMultirriscosMensal() and typing sets the signal', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.ch-input');
    const mrInput = inputs[6] as HTMLInputElement;
    expect(mrInput.value).toBe('15');
    mrInput.value = '20';
    mrInput.dispatchEvent(new Event('input'));
    expect(stub.seguroMultirriscosMensal()).toBe(20);
  });

  it('seguro multirriscos input clamps negative values to 0', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.ch-input');
    const mrInput = inputs[6] as HTMLInputElement;
    mrInput.value = '-5';
    mrInput.dispatchEvent(new Event('input'));
    expect(stub.seguroMultirriscosMensal()).toBe(0);
  });

  it('renders the primary prestação output with formatted total and detail', () => {
    const primary = fixture.nativeElement.querySelector('.ch-out--primary') as HTMLElement;
    expect(primary).toBeTruthy();
    expect(primary.textContent).toContain('Prestação mensal');
    expect(primary.textContent).toContain('840.00');
    expect(primary.textContent).toContain('capital');
    expect(primary.textContent).toContain('800.00');
    expect(primary.textContent).toContain('seguros');
    expect(primary.textContent).toContain('40.00');
  });

  it('renders TAN aplicada with formatted percentage', () => {
    const outs = fixture.nativeElement.querySelectorAll('.ch-out');
    const tanOut = outs[1] as HTMLElement;
    expect(tanOut.textContent).toContain('TAN aplicada');
    expect(tanOut.textContent).toContain('3.300%');
  });

  it('renders TAEG estimada with formatted percentage', () => {
    const outs = fixture.nativeElement.querySelectorAll('.ch-out');
    const taegOut = outs[2] as HTMLElement;
    expect(taegOut.textContent).toContain('TAEG estimada');
    expect(taegOut.textContent).toContain('3.450%');
  });

  it('renders LTV with formatted percentage and capital financiado detail', () => {
    const outs = fixture.nativeElement.querySelectorAll('.ch-out');
    const ltvOut = outs[3] as HTMLElement;
    expect(ltvOut.textContent).toContain('LTV');
    expect(ltvOut.textContent).toContain('80.00%');
    expect(ltvOut.textContent).toContain('capital financiado');
    expect(ltvOut.textContent).toContain('200,000.00');
  });

  it('renders total pago no final and total juros', () => {
    const outs = fixture.nativeElement.querySelectorAll('.ch-out');
    const totalOut = outs[4] as HTMLElement;
    expect(totalOut.textContent).toContain('Total pago no fim');
    expect(totalOut.textContent).toContain('302,400.00');
    expect(totalOut.textContent).toContain('juros');
    expect(totalOut.textContent).toContain('88,000.00');
  });

  it('renders both schedule section titles', () => {
    const titles = Array.from(fixture.nativeElement.querySelectorAll('.ch-section-title'))
      .map((t: any) => t.textContent);
    expect(titles).toContain('Primeiros 12 meses');
    expect(titles).toContain('Últimos 12 meses');
  });

  it('renders one row in primeiros schedule per tabelaPrimeirosMeses entry', () => {
    const tables = fixture.nativeElement.querySelectorAll('table.ch-table');
    const rows = tables[0].querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
  });

  it('renders one row in últimos schedule per tabelaUltimosMeses entry', () => {
    const tables = fixture.nativeElement.querySelectorAll('table.ch-table');
    const rows = tables[1].querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
  });

  it('renders amortization row cells with month, capital inicial, juros, amortização, capital final', () => {
    const tables = fixture.nativeElement.querySelectorAll('table.ch-table');
    const firstRow = tables[0].querySelectorAll('tbody tr')[0] as HTMLTableRowElement;
    const cells = firstRow.querySelectorAll('td');
    expect(cells[0].textContent).toContain('1');
    expect(cells[1].textContent).toContain('200,000.00');
    expect(cells[2].textContent).toContain('550.00');
    expect(cells[3].textContent).toContain('250.00');
    expect(cells[4].textContent).toContain('199,750.00');
  });

  it('renders no rows when tabelaPrimeirosMeses is empty', () => {
    stub.tabelaPrimeirosMeses.set([]);
    fixture.detectChanges();
    const tables = fixture.nativeElement.querySelectorAll('table.ch-table');
    const rows = tables[0].querySelectorAll('tbody tr');
    expect(rows.length).toBe(0);
  });

  it('renders no rows when tabelaUltimosMeses is empty', () => {
    stub.tabelaUltimosMeses.set([]);
    fixture.detectChanges();
    const tables = fixture.nativeElement.querySelectorAll('table.ch-table');
    const rows = tables[1].querySelectorAll('tbody tr');
    expect(rows.length).toBe(0);
  });

  it('renders the regulatory footer text', () => {
    const footer = fixture.nativeElement.querySelector('.ch-footer') as HTMLElement;
    expect(footer).toBeTruthy();
    expect(footer.textContent).toContain('Simulação Price standard');
    expect(footer.textContent).toContain('Newton-Raphson');
    expect(footer.textContent).toContain('FINE');
  });
});
