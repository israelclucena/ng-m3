import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { IRSCategoriaFCalculatorComponent } from './irs-categoria-f-calculator.component';
import { IRSCategoriaFService } from '../../services/irs-categoria-f.service';
import type { IRSCatFRegime } from '../../services/irs-categoria-f.service';

describe('IRSCategoriaFCalculatorComponent', () => {
  let fixture: ComponentFixture<IRSCategoriaFCalculatorComponent>;
  let component: IRSCategoriaFCalculatorComponent;

  const baseComparacao = {
    taxaAutonoma: { colecta: 2800, taxaEfectiva: 0.28 },
    englobamento: { colecta: 1650, taxaEfectiva: 0.165 },
  };

  const stub = {
    rendimentoBrutoAnual: signal<number>(12000),
    despesasDedutiveis: signal<number>(2000),
    outrosRendimentosEnglobamento: signal<number>(0),
    regime: signal<IRSCatFRegime>('taxaAutonoma28'),
    rendimentoLiquido: signal<number>(10000),
    colectaTaxaAutonoma: signal<number>(2800),
    colectaEnglobamento: signal<number>(1650),
    melhorRegime: signal<IRSCatFRegime>('englobamento'),
    poupanca: signal<number>(1150),
    colectaActual: signal<number>(2800),
    taxaEfectiva: signal<number>(0.28),
    comparacao: signal<{
      taxaAutonoma: { colecta: number; taxaEfectiva: number };
      englobamento: { colecta: number; taxaEfectiva: number };
    }>(baseComparacao),
    setRendimentoBruto: jest.fn(function (this: void, v: number) {
      stub.rendimentoBrutoAnual.set(v);
    }),
    setDespesas: jest.fn(function (this: void, v: number) {
      stub.despesasDedutiveis.set(v);
    }),
    setOutrosRendimentos: jest.fn(function (this: void, v: number) {
      stub.outrosRendimentosEnglobamento.set(v);
    }),
    setRegime: jest.fn(function (this: void, r: IRSCatFRegime) {
      stub.regime.set(r);
    }),
    reset: jest.fn(),
  };

  beforeEach(async () => {
    stub.rendimentoBrutoAnual.set(12000);
    stub.despesasDedutiveis.set(2000);
    stub.outrosRendimentosEnglobamento.set(0);
    stub.regime.set('taxaAutonoma28');
    stub.rendimentoLiquido.set(10000);
    stub.colectaTaxaAutonoma.set(2800);
    stub.colectaEnglobamento.set(1650);
    stub.melhorRegime.set('englobamento');
    stub.poupanca.set(1150);
    stub.colectaActual.set(2800);
    stub.taxaEfectiva.set(0.28);
    stub.comparacao.set(baseComparacao);
    stub.setRendimentoBruto.mockClear();
    stub.setDespesas.mockClear();
    stub.setOutrosRendimentos.mockClear();
    stub.setRegime.mockClear();
    stub.reset.mockClear();

    await TestBed.configureTestingModule({
      imports: [IRSCategoriaFCalculatorComponent],
      providers: [
        { provide: IRSCategoriaFService, useValue: stub as any },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IRSCategoriaFCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the title and subtitle', () => {
    const title = fixture.nativeElement.querySelector('.irs-title') as HTMLElement;
    const subtitle = fixture.nativeElement.querySelector('.irs-subtitle') as HTMLElement;
    expect(title.textContent).toContain('Calculadora IRS Categoria F');
    expect(subtitle.textContent).toContain('Rendimentos prediais');
    expect(subtitle.textContent).toContain('28%');
  });

  it('reset button calls service.reset()', () => {
    const btn = fixture.nativeElement.querySelector('.irs-reset') as HTMLButtonElement;
    btn.click();
    expect(stub.reset).toHaveBeenCalledTimes(1);
  });

  it('renda bruta input reflects svc.rendimentoBrutoAnual()', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.irs-input');
    const rendaInput = inputs[0] as HTMLInputElement;
    expect(rendaInput.value).toBe('12000');
  });

  it('typing into renda input calls setRendimentoBruto with parsed number', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.irs-input');
    const rendaInput = inputs[0] as HTMLInputElement;
    rendaInput.value = '18000';
    rendaInput.dispatchEvent(new Event('input'));
    expect(stub.setRendimentoBruto).toHaveBeenCalledWith(18000);
  });

  it('renda input with negative value clamps to 0', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.irs-input');
    const rendaInput = inputs[0] as HTMLInputElement;
    rendaInput.value = '-500';
    rendaInput.dispatchEvent(new Event('input'));
    expect(stub.setRendimentoBruto).toHaveBeenCalledWith(0);
  });

  it('despesas input reflects svc.despesasDedutiveis() and typing calls setDespesas', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.irs-input');
    const despesasInput = inputs[1] as HTMLInputElement;
    expect(despesasInput.value).toBe('2000');
    despesasInput.value = '3500';
    despesasInput.dispatchEvent(new Event('input'));
    expect(stub.setDespesas).toHaveBeenCalledWith(3500);
  });

  it('despesas input with negative value clamps to 0', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.irs-input');
    const despesasInput = inputs[1] as HTMLInputElement;
    despesasInput.value = '-100';
    despesasInput.dispatchEvent(new Event('input'));
    expect(stub.setDespesas).toHaveBeenCalledWith(0);
  });

  it('outros rendimentos input reflects signal and typing calls setOutrosRendimentos', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.irs-input');
    const outrosInput = inputs[2] as HTMLInputElement;
    expect(outrosInput.value).toBe('0');
    outrosInput.value = '25000';
    outrosInput.dispatchEvent(new Event('input'));
    expect(stub.setOutrosRendimentos).toHaveBeenCalledWith(25000);
  });

  it('outros rendimentos input with negative value clamps to 0', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.irs-input');
    const outrosInput = inputs[2] as HTMLInputElement;
    outrosInput.value = '-50';
    outrosInput.dispatchEvent(new Event('input'));
    expect(stub.setOutrosRendimentos).toHaveBeenCalledWith(0);
  });

  it('regime radios reflect svc.regime() — taxaAutonoma28 checked by default', () => {
    const radios = fixture.nativeElement.querySelectorAll(
      'input[type="radio"][name="regime"]',
    );
    expect(radios.length).toBe(2);
    expect((radios[0] as HTMLInputElement).checked).toBe(true);
    expect((radios[1] as HTMLInputElement).checked).toBe(false);
  });

  it('regime radios reflect svc.regime() — englobamento when selected', () => {
    stub.regime.set('englobamento');
    fixture.detectChanges();
    const radios = fixture.nativeElement.querySelectorAll(
      'input[type="radio"][name="regime"]',
    );
    expect((radios[0] as HTMLInputElement).checked).toBe(false);
    expect((radios[1] as HTMLInputElement).checked).toBe(true);
  });

  it('clicking englobamento radio calls setRegime with "englobamento"', () => {
    const radios = fixture.nativeElement.querySelectorAll(
      'input[type="radio"][name="regime"]',
    );
    const englobamentoRadio = radios[1] as HTMLInputElement;
    englobamentoRadio.checked = true;
    englobamentoRadio.dispatchEvent(new Event('change'));
    expect(stub.setRegime).toHaveBeenCalledWith('englobamento');
  });

  it('clicking taxaAutonoma28 radio calls setRegime with "taxaAutonoma28"', () => {
    stub.regime.set('englobamento');
    fixture.detectChanges();
    const radios = fixture.nativeElement.querySelectorAll(
      'input[type="radio"][name="regime"]',
    );
    const autonomaRadio = radios[0] as HTMLInputElement;
    autonomaRadio.checked = true;
    autonomaRadio.dispatchEvent(new Event('change'));
    expect(stub.setRegime).toHaveBeenCalledWith('taxaAutonoma28');
  });

  it('renders the taxa autónoma label with 28%', () => {
    const radioLabel = fixture.nativeElement.querySelectorAll('.irs-radio')[0] as HTMLElement;
    expect(radioLabel.textContent).toContain('Taxa autónoma');
    expect(radioLabel.textContent).toContain('28%');
  });

  it('renders the primary output with colecta actual and taxa efectiva', () => {
    const primary = fixture.nativeElement.querySelector('.irs-out--primary') as HTMLElement;
    expect(primary).toBeTruthy();
    expect(primary.textContent).toContain('Imposto a pagar');
    expect(primary.textContent).toContain('2,800.00');
    expect(primary.textContent).toContain('28.00%');
    expect(primary.textContent).toContain('10,000.00');
  });

  it('renders the recomendação card with melhorRegime label and poupança', () => {
    const reco = fixture.nativeElement.querySelector('.irs-out--reco') as HTMLElement;
    expect(reco).toBeTruthy();
    expect(reco.textContent).toContain('Recomendação');
    expect(reco.textContent).toContain('Englobamento');
    expect(reco.textContent).toContain('1,150.00');
  });

  it('recomendação card does NOT have active class when current regime != melhor', () => {
    const reco = fixture.nativeElement.querySelector('.irs-out--reco') as HTMLElement;
    expect(reco.classList.contains('irs-out--reco-active')).toBe(false);
  });

  it('recomendação card has active class when current regime == melhor', () => {
    stub.regime.set('englobamento');
    fixture.detectChanges();
    const reco = fixture.nativeElement.querySelector('.irs-out--reco') as HTMLElement;
    expect(reco.classList.contains('irs-out--reco-active')).toBe(true);
  });

  it('recomendação shows "Taxa autónoma 28%" when melhorRegime is taxaAutonoma28', () => {
    stub.melhorRegime.set('taxaAutonoma28');
    fixture.detectChanges();
    const reco = fixture.nativeElement.querySelector('.irs-out--reco') as HTMLElement;
    expect(reco.textContent).toContain('Taxa autónoma 28%');
  });

  it('renders the comparison section title', () => {
    const sectionTitle = fixture.nativeElement.querySelector('.irs-section-title') as HTMLElement;
    expect(sectionTitle.textContent).toContain('Comparação');
  });

  it('renders exactly two comparison rows (autónoma + englobamento)', () => {
    const rows = fixture.nativeElement.querySelectorAll('.irs-table tbody tr');
    expect(rows.length).toBe(2);
  });

  it('comparison rows show colecta and taxa efectiva for both regimes', () => {
    const rows = fixture.nativeElement.querySelectorAll('.irs-table tbody tr');
    const autonomaRow = rows[0] as HTMLElement;
    const englobamentoRow = rows[1] as HTMLElement;
    expect(autonomaRow.textContent).toContain('Taxa autónoma 28%');
    expect(autonomaRow.textContent).toContain('2,800.00');
    expect(autonomaRow.textContent).toContain('28.00%');
    expect(englobamentoRow.textContent).toContain('Englobamento');
    expect(englobamentoRow.textContent).toContain('1,650.00');
    expect(englobamentoRow.textContent).toContain('16.50%');
  });

  it('marks the englobamento row as best when melhorRegime is englobamento', () => {
    const rows = fixture.nativeElement.querySelectorAll('.irs-table tbody tr');
    expect((rows[0] as HTMLElement).classList.contains('irs-row-best')).toBe(false);
    expect((rows[1] as HTMLElement).classList.contains('irs-row-best')).toBe(true);
  });

  it('marks the taxa autónoma row as best when melhorRegime is taxaAutonoma28', () => {
    stub.melhorRegime.set('taxaAutonoma28');
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.irs-table tbody tr');
    expect((rows[0] as HTMLElement).classList.contains('irs-row-best')).toBe(true);
    expect((rows[1] as HTMLElement).classList.contains('irs-row-best')).toBe(false);
  });

  it('renders the regulatory footer text', () => {
    const footer = fixture.nativeElement.querySelector('.irs-footer') as HTMLElement;
    expect(footer).toBeTruthy();
    expect(footer.textContent).toContain('escalões IRS 2026');
    expect(footer.textContent).toContain('AT');
  });
});
