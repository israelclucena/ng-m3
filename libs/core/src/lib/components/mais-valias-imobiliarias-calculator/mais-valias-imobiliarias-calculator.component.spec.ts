import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MaisValiasImobiliariasCalculatorComponent } from './mais-valias-imobiliarias-calculator.component';
import { MaisValiasImobiliariasService } from '../../services/mais-valias-imobiliarias.service';
import type {
  MVRegime,
  MVResidencia,
  MVComparacaoLinha,
} from '../../services/mais-valias-imobiliarias.service';

describe('MaisValiasImobiliariasCalculatorComponent', () => {
  let fixture: ComponentFixture<MaisValiasImobiliariasCalculatorComponent>;
  let component: MaisValiasImobiliariasCalculatorComponent;

  const baseComparacao: {
    readonly taxaAutonoma: MVComparacaoLinha;
    readonly englobamento: MVComparacaoLinha;
  } = {
    taxaAutonoma: { colecta: 14000, taxaEfectiva: 0.28 },
    englobamento: { colecta: 12000, taxaEfectiva: 0.24 },
  };

  const stub = {
    valorRealizacao: signal<number>(280_000),
    valorAquisicao: signal<number>(150_000),
    anoAquisicao: signal<number>(2010),
    encargosAquisicao: signal<number>(8_000),
    despesasValorizacao: signal<number>(15_000),
    residencia: signal<MVResidencia>('residente'),
    outrosRendimentosEnglobamento: signal<number>(20_000),
    regime: signal<MVRegime>('taxaAutonoma28'),
    coeficiente: signal<number>(1.3),
    valorAquisicaoCorrigido: signal<number>(195_000),
    maisValiaBruta: signal<number>(62_000),
    quotaTributavel: signal<number>(0.5),
    maisValiaTributavel: signal<number>(31_000),
    colectaActual: signal<number>(8_680),
    liquidoAposImposto: signal<number>(271_320),
    taxaEfectiva: signal<number>(0.28),
    melhorRegime: signal<MVRegime>('englobamento'),
    poupanca: signal<number>(2_000),
    comparacao: signal<{
      readonly taxaAutonoma: MVComparacaoLinha;
      readonly englobamento: MVComparacaoLinha;
    }>(baseComparacao),
    setValorRealizacao: jest.fn(function (this: void, v: number) {
      stub.valorRealizacao.set(v);
    }),
    setValorAquisicao: jest.fn(function (this: void, v: number) {
      stub.valorAquisicao.set(v);
    }),
    setAnoAquisicao: jest.fn(function (this: void, v: number) {
      stub.anoAquisicao.set(v);
    }),
    setEncargos: jest.fn(function (this: void, v: number) {
      stub.encargosAquisicao.set(v);
    }),
    setValorizacao: jest.fn(function (this: void, v: number) {
      stub.despesasValorizacao.set(v);
    }),
    setOutrosRendimentos: jest.fn(function (this: void, v: number) {
      stub.outrosRendimentosEnglobamento.set(v);
    }),
    setResidencia: jest.fn(function (this: void, r: MVResidencia) {
      stub.residencia.set(r);
    }),
    setRegime: jest.fn(function (this: void, r: MVRegime) {
      stub.regime.set(r);
    }),
    reset: jest.fn(),
  };

  beforeEach(async () => {
    stub.valorRealizacao.set(280_000);
    stub.valorAquisicao.set(150_000);
    stub.anoAquisicao.set(2010);
    stub.encargosAquisicao.set(8_000);
    stub.despesasValorizacao.set(15_000);
    stub.residencia.set('residente');
    stub.outrosRendimentosEnglobamento.set(20_000);
    stub.regime.set('taxaAutonoma28');
    stub.coeficiente.set(1.3);
    stub.valorAquisicaoCorrigido.set(195_000);
    stub.maisValiaBruta.set(62_000);
    stub.quotaTributavel.set(0.5);
    stub.maisValiaTributavel.set(31_000);
    stub.colectaActual.set(8_680);
    stub.liquidoAposImposto.set(271_320);
    stub.taxaEfectiva.set(0.28);
    stub.melhorRegime.set('englobamento');
    stub.poupanca.set(2_000);
    stub.comparacao.set(baseComparacao);
    stub.setValorRealizacao.mockClear();
    stub.setValorAquisicao.mockClear();
    stub.setAnoAquisicao.mockClear();
    stub.setEncargos.mockClear();
    stub.setValorizacao.mockClear();
    stub.setOutrosRendimentos.mockClear();
    stub.setResidencia.mockClear();
    stub.setRegime.mockClear();
    stub.reset.mockClear();

    await TestBed.configureTestingModule({
      imports: [MaisValiasImobiliariasCalculatorComponent],
      providers: [
        { provide: MaisValiasImobiliariasService, useValue: stub as any },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MaisValiasImobiliariasCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the title and subtitle', () => {
    const title = fixture.nativeElement.querySelector('.mv-title') as HTMLElement;
    const subtitle = fixture.nativeElement.querySelector('.mv-subtitle') as HTMLElement;
    expect(title.textContent).toContain('Calculadora Mais-Valias Imobiliárias');
    expect(subtitle.textContent).toContain('IRS Categoria G');
    expect(subtitle.textContent).toContain('taxa autónoma 28%');
  });

  it('reset button calls service.reset()', () => {
    const btn = fixture.nativeElement.querySelector('.mv-reset') as HTMLButtonElement;
    btn.click();
    expect(stub.reset).toHaveBeenCalledTimes(1);
  });

  it('valor de realização input reflects svc.valorRealizacao()', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.mv-input');
    const realizacaoInput = inputs[0] as HTMLInputElement;
    expect(realizacaoInput.value).toBe('280000');
  });

  it('typing into realização input calls setValorRealizacao with parsed number', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.mv-input');
    const realizacaoInput = inputs[0] as HTMLInputElement;
    realizacaoInput.value = '300000';
    realizacaoInput.dispatchEvent(new Event('input'));
    expect(stub.setValorRealizacao).toHaveBeenCalledWith(300000);
  });

  it('valor de aquisição input reflects svc.valorAquisicao() and typing calls setValorAquisicao', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.mv-input');
    const aquisicaoInput = inputs[1] as HTMLInputElement;
    expect(aquisicaoInput.value).toBe('150000');
    aquisicaoInput.value = '170000';
    aquisicaoInput.dispatchEvent(new Event('input'));
    expect(stub.setValorAquisicao).toHaveBeenCalledWith(170000);
  });

  it('ano de aquisição input reflects svc.anoAquisicao() and typing calls setAnoAquisicao', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.mv-input');
    const anoInput = inputs[2] as HTMLInputElement;
    expect(anoInput.value).toBe('2010');
    anoInput.value = '2015';
    anoInput.dispatchEvent(new Event('input'));
    expect(stub.setAnoAquisicao).toHaveBeenCalledWith(2015);
  });

  it('ano helper text shows max year and coeficiente formatted', () => {
    const helpers = fixture.nativeElement.querySelectorAll('.mv-helper');
    const text = Array.from(helpers)
      .map((h: any) => h.textContent)
      .join(' ');
    expect(text).toContain('1989 a 2026');
    expect(text).toContain('1.30');
  });

  it('encargos input reflects svc.encargosAquisicao() and typing calls setEncargos', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.mv-input');
    const encargosInput = inputs[3] as HTMLInputElement;
    expect(encargosInput.value).toBe('8000');
    encargosInput.value = '9500';
    encargosInput.dispatchEvent(new Event('input'));
    expect(stub.setEncargos).toHaveBeenCalledWith(9500);
  });

  it('valorização input reflects svc.despesasValorizacao() and typing calls setValorizacao', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.mv-input');
    const valorizacaoInput = inputs[4] as HTMLInputElement;
    expect(valorizacaoInput.value).toBe('15000');
    valorizacaoInput.value = '18000';
    valorizacaoInput.dispatchEvent(new Event('input'));
    expect(stub.setValorizacao).toHaveBeenCalledWith(18000);
  });

  it('residência radios reflect svc.residencia() with residente checked by default', () => {
    const radios = fixture.nativeElement.querySelectorAll('input[name="residencia"]');
    expect(radios.length).toBe(2);
    expect((radios[0] as HTMLInputElement).checked).toBe(true);
    expect((radios[1] as HTMLInputElement).checked).toBe(false);
  });

  it('clicking não-residente radio calls setResidencia with naoResidente', () => {
    const radios = fixture.nativeElement.querySelectorAll('input[name="residencia"]');
    const naoResidente = radios[1] as HTMLInputElement;
    naoResidente.checked = true;
    naoResidente.dispatchEvent(new Event('change'));
    expect(stub.setResidencia).toHaveBeenCalledWith('naoResidente');
  });

  it('clicking residente radio calls setResidencia with residente', () => {
    const radios = fixture.nativeElement.querySelectorAll('input[name="residencia"]');
    const residente = radios[0] as HTMLInputElement;
    residente.checked = true;
    residente.dispatchEvent(new Event('change'));
    expect(stub.setResidencia).toHaveBeenCalledWith('residente');
  });

  it('outros rendimentos input renders when residente and reflects svc value', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.mv-input');
    expect(inputs.length).toBe(6);
    const outrosInput = inputs[5] as HTMLInputElement;
    expect(outrosInput.value).toBe('20000');
  });

  it('typing into outros rendimentos calls setOutrosRendimentos', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.mv-input');
    const outrosInput = inputs[5] as HTMLInputElement;
    outrosInput.value = '25000';
    outrosInput.dispatchEvent(new Event('input'));
    expect(stub.setOutrosRendimentos).toHaveBeenCalledWith(25000);
  });

  it('regime radios render when residente and reflect svc.regime()', () => {
    const radios = fixture.nativeElement.querySelectorAll('input[name="regime"]');
    expect(radios.length).toBe(2);
    expect((radios[0] as HTMLInputElement).checked).toBe(true);
    expect((radios[1] as HTMLInputElement).checked).toBe(false);
  });

  it('regime radio label shows taxa autonoma 28%', () => {
    const fieldsets = fixture.nativeElement.querySelectorAll('fieldset.mv-regime');
    const regimeFieldset = fieldsets[1] as HTMLElement;
    expect(regimeFieldset.textContent).toContain('Taxa autónoma 28%');
    expect(regimeFieldset.textContent).toContain('Englobamento');
  });

  it('clicking englobamento radio calls setRegime with englobamento', () => {
    const radios = fixture.nativeElement.querySelectorAll('input[name="regime"]');
    const englobamento = radios[1] as HTMLInputElement;
    englobamento.checked = true;
    englobamento.dispatchEvent(new Event('change'));
    expect(stub.setRegime).toHaveBeenCalledWith('englobamento');
  });

  it('hides outros rendimentos, regime fieldset and compare table when não-residente', () => {
    stub.residencia.set('naoResidente');
    fixture.detectChanges();
    const inputs = fixture.nativeElement.querySelectorAll('input.mv-input');
    expect(inputs.length).toBe(5);
    const regimeRadios = fixture.nativeElement.querySelectorAll('input[name="regime"]');
    expect(regimeRadios.length).toBe(0);
    const table = fixture.nativeElement.querySelector('.mv-table');
    expect(table).toBeNull();
    const reco = fixture.nativeElement.querySelector('.mv-out--reco');
    expect(reco).toBeNull();
  });

  it('renders the aquisição corrigida breakdown with formatted value and coeficiente', () => {
    const outs = fixture.nativeElement.querySelectorAll('.mv-out--breakdown');
    expect(outs.length).toBe(3);
    const aquisicaoCorrigida = outs[0] as HTMLElement;
    expect(aquisicaoCorrigida.textContent).toContain('Aquisição corrigida');
    expect(aquisicaoCorrigida.textContent).toContain('195,000.00');
    expect(aquisicaoCorrigida.textContent).toContain('1.30');
  });

  it('renders the mais-valia bruta breakdown with formatted value', () => {
    const outs = fixture.nativeElement.querySelectorAll('.mv-out--breakdown');
    const brutaOut = outs[1] as HTMLElement;
    expect(brutaOut.textContent).toContain('Mais-valia bruta');
    expect(brutaOut.textContent).toContain('62,000.00');
  });

  it('applies mv-negative class when maisValiaBruta is negative', () => {
    stub.maisValiaBruta.set(-1000);
    fixture.detectChanges();
    const outs = fixture.nativeElement.querySelectorAll('.mv-out--breakdown');
    const brutaOut = outs[1] as HTMLElement;
    const valueSpan = brutaOut.querySelector('.mv-out-value-sm') as HTMLElement;
    expect(valueSpan.classList.contains('mv-negative')).toBe(true);
  });

  it('renders the mais-valia tributável breakdown with quota label', () => {
    const outs = fixture.nativeElement.querySelectorAll('.mv-out--breakdown');
    const tribOut = outs[2] as HTMLElement;
    expect(tribOut.textContent).toContain('Mais-valia tributável');
    expect(tribOut.textContent).toContain('31,000.00');
    expect(tribOut.textContent).toContain('50% tributável');
  });

  it('quota label shows 100% for não-residente', () => {
    stub.residencia.set('naoResidente');
    stub.quotaTributavel.set(1);
    fixture.detectChanges();
    const outs = fixture.nativeElement.querySelectorAll('.mv-out--breakdown');
    const tribOut = outs[2] as HTMLElement;
    expect(tribOut.textContent).toContain('100% tributável');
  });

  it('renders the primary imposto output with formatted value and taxa efectiva', () => {
    const primary = fixture.nativeElement.querySelector('.mv-out--primary') as HTMLElement;
    expect(primary).toBeTruthy();
    expect(primary.textContent).toContain('Imposto a pagar');
    expect(primary.textContent).toContain('8,680.00');
    expect(primary.textContent).toContain('28.00%');
    expect(primary.textContent).toContain('271,320.00');
  });

  it('renders the recomendação output when residente with melhor regime label', () => {
    const reco = fixture.nativeElement.querySelector('.mv-out--reco') as HTMLElement;
    expect(reco).toBeTruthy();
    expect(reco.textContent).toContain('Recomendação');
    expect(reco.textContent).toContain('Englobamento');
    expect(reco.textContent).toContain('2,000.00');
  });

  it('recomendação shows Taxa autónoma 28% when melhorRegime is taxaAutonoma28', () => {
    stub.melhorRegime.set('taxaAutonoma28');
    fixture.detectChanges();
    const reco = fixture.nativeElement.querySelector('.mv-out--reco') as HTMLElement;
    expect(reco.textContent).toContain('Taxa autónoma 28%');
  });

  it('renders the comparação table with two rows when residente', () => {
    const rows = fixture.nativeElement.querySelectorAll('.mv-table tbody tr');
    expect(rows.length).toBe(2);
  });

  it('comparação table shows colecta and taxa efectiva for each regime', () => {
    const rows = fixture.nativeElement.querySelectorAll('.mv-table tbody tr');
    const taxaAutonomaRow = rows[0] as HTMLElement;
    const englobamentoRow = rows[1] as HTMLElement;
    expect(taxaAutonomaRow.textContent).toContain('Taxa autónoma 28%');
    expect(taxaAutonomaRow.textContent).toContain('14,000.00');
    expect(taxaAutonomaRow.textContent).toContain('28.00%');
    expect(englobamentoRow.textContent).toContain('Englobamento');
    expect(englobamentoRow.textContent).toContain('12,000.00');
    expect(englobamentoRow.textContent).toContain('24.00%');
  });

  it('applies mv-row-best class to the englobamento row when it is the melhor regime', () => {
    const rows = fixture.nativeElement.querySelectorAll('.mv-table tbody tr');
    expect((rows[0] as HTMLElement).classList.contains('mv-row-best')).toBe(false);
    expect((rows[1] as HTMLElement).classList.contains('mv-row-best')).toBe(true);
  });

  it('applies mv-row-best to taxa autónoma row when it is the melhor regime', () => {
    stub.melhorRegime.set('taxaAutonoma28');
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.mv-table tbody tr');
    expect((rows[0] as HTMLElement).classList.contains('mv-row-best')).toBe(true);
    expect((rows[1] as HTMLElement).classList.contains('mv-row-best')).toBe(false);
  });

  it('renders the regulatory footer text', () => {
    const footer = fixture.nativeElement.querySelector('.mv-footer') as HTMLElement;
    expect(footer).toBeTruthy();
    expect(footer.textContent).toContain('Portaria 314/2024');
    expect(footer.textContent).toContain('contabilista');
  });
});
