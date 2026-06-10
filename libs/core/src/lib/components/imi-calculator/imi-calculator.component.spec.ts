import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { IMICalculatorComponent } from './imi-calculator.component';
import { IMICalculatorService } from '../../services/imi-calculator.service';
import type { IMIPrestacao } from '../../services/imi-calculator.service';

describe('IMICalculatorComponent', () => {
  let fixture: ComponentFixture<IMICalculatorComponent>;
  let component: IMICalculatorComponent;

  const baseCalendar: readonly IMIPrestacao[] = [
    { numero: 1, mes: 'Maio', valor: 200 },
    { numero: 2, mes: 'Agosto', valor: 200 },
    { numero: 3, mes: 'Novembro', valor: 200 },
  ];

  const stub = {
    vpt: signal<number>(150000),
    concelho: signal<string>('Lisboa'),
    taxaMunicipalOverride: signal<number | null>(null),
    usoProprio: signal<boolean>(true),
    agregadoFamiliar: signal<number>(0),
    taxaAplicavel: signal<number>(0.003),
    imiAnualBruto: signal<number>(450),
    isencaoEstimada: signal<number>(0),
    imiAnual: signal<number>(600),
    numeroPrestacoes: signal<1 | 2 | 3>(3),
    imiPorPrestacao: signal<number>(200),
    prestacoesCalendario: signal<readonly IMIPrestacao[]>(baseCalendar),
    setVpt: jest.fn(function (this: void, v: number) {
      stub.vpt.set(v);
    }),
    setConcelho: jest.fn(function (this: void, c: string) {
      stub.concelho.set(c);
    }),
    setTaxaOverride: jest.fn(function (this: void, t: number | null) {
      stub.taxaMunicipalOverride.set(t);
    }),
    reset: jest.fn(),
  };

  beforeEach(async () => {
    stub.vpt.set(150000);
    stub.concelho.set('Lisboa');
    stub.taxaMunicipalOverride.set(null);
    stub.usoProprio.set(true);
    stub.agregadoFamiliar.set(0);
    stub.taxaAplicavel.set(0.003);
    stub.imiAnualBruto.set(450);
    stub.isencaoEstimada.set(0);
    stub.imiAnual.set(600);
    stub.numeroPrestacoes.set(3);
    stub.imiPorPrestacao.set(200);
    stub.prestacoesCalendario.set(baseCalendar);
    stub.setVpt.mockClear();
    stub.setConcelho.mockClear();
    stub.setTaxaOverride.mockClear();
    stub.reset.mockClear();

    await TestBed.configureTestingModule({
      imports: [IMICalculatorComponent],
      providers: [
        { provide: IMICalculatorService, useValue: stub as any },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IMICalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the title and subtitle', () => {
    const title = fixture.nativeElement.querySelector('.imi-title') as HTMLElement;
    const subtitle = fixture.nativeElement.querySelector('.imi-subtitle') as HTMLElement;
    expect(title.textContent).toContain('Calculadora IMI');
    expect(subtitle.textContent).toContain('Imposto Municipal');
  });

  it('reset button calls service.reset()', () => {
    const btn = fixture.nativeElement.querySelector('.imi-reset') as HTMLButtonElement;
    btn.click();
    expect(stub.reset).toHaveBeenCalledTimes(1);
  });

  it('VPT input value reflects svc.vpt()', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.imi-input');
    const vptInput = inputs[0] as HTMLInputElement;
    expect(vptInput.value).toBe('150000');
  });

  it('typing into VPT input calls service.setVpt with parsed number', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.imi-input');
    const vptInput = inputs[0] as HTMLInputElement;
    vptInput.value = '200000';
    vptInput.dispatchEvent(new Event('input'));
    expect(stub.setVpt).toHaveBeenCalledWith(200000);
  });

  it('VPT input with negative value clamps to 0 via setVpt', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.imi-input');
    const vptInput = inputs[0] as HTMLInputElement;
    vptInput.value = '-100';
    vptInput.dispatchEvent(new Event('input'));
    expect(stub.setVpt).toHaveBeenCalledWith(0);
  });

  it('concelho select reflects svc.concelho() and calls setConcelho on change', () => {
    const select = fixture.nativeElement.querySelector('select.imi-input') as HTMLSelectElement;
    expect(select).toBeTruthy();
    select.value = 'Porto';
    select.dispatchEvent(new Event('change'));
    expect(stub.setConcelho).toHaveBeenCalledWith('Porto');
  });

  it('renders an option for each concelho including "Outro"', () => {
    const options = fixture.nativeElement.querySelectorAll('select.imi-input option');
    const values = Array.from(options).map((o: any) => o.value);
    expect(values).toContain('Lisboa');
    expect(values).toContain('Outro');
  });

  it('taxa helper text shows formatted percentage', () => {
    const helpers = fixture.nativeElement.querySelectorAll('.imi-helper');
    const text = Array.from(helpers)
      .map((h: any) => h.textContent)
      .join(' ');
    expect(text).toContain('0.300%');
  });

  it('override input is empty when taxaMunicipalOverride is null', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.imi-input');
    const overrideInput = inputs[1] as HTMLInputElement;
    expect(overrideInput.value).toBe('');
  });

  it('override input shows percentage when taxaMunicipalOverride has a value', () => {
    stub.taxaMunicipalOverride.set(0.0035);
    fixture.detectChanges();
    const inputs = fixture.nativeElement.querySelectorAll('input.imi-input');
    const overrideInput = inputs[1] as HTMLInputElement;
    expect(overrideInput.value).toBe('0.350');
  });

  it('typing an override percentage calls setTaxaOverride with decimal', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.imi-input');
    const overrideInput = inputs[1] as HTMLInputElement;
    overrideInput.value = '0.5';
    overrideInput.dispatchEvent(new Event('input'));
    expect(stub.setTaxaOverride).toHaveBeenCalledWith(0.005);
  });

  it('clearing the override input calls setTaxaOverride with null', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.imi-input');
    const overrideInput = inputs[1] as HTMLInputElement;
    overrideInput.value = '';
    overrideInput.dispatchEvent(new Event('input'));
    expect(stub.setTaxaOverride).toHaveBeenCalledWith(null);
  });

  it('a non-numeric override is ignored (no setTaxaOverride call)', () => {
    stub.setTaxaOverride.mockClear();
    (component as any).setOverride({ target: { value: 'abc' } });
    expect(stub.setTaxaOverride).not.toHaveBeenCalled();
  });

  it('uso próprio checkbox reflects svc.usoProprio() and toggling updates the signal', () => {
    const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));
    expect(stub.usoProprio()).toBe(false);
  });

  it('agregado familiar input reflects svc.agregadoFamiliar() and typing sets the signal', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input.imi-input');
    const agregadoInput = inputs[2] as HTMLInputElement;
    expect(agregadoInput.value).toBe('0');
    agregadoInput.value = '2';
    agregadoInput.dispatchEvent(new Event('input'));
    expect(stub.agregadoFamiliar()).toBe(2);
  });

  it('renders the primary IMI anual output with formatted value', () => {
    const primary = fixture.nativeElement.querySelector('.imi-out--primary') as HTMLElement;
    expect(primary).toBeTruthy();
    expect(primary.textContent).toContain('IMI anual');
    expect(primary.textContent).toContain('600.00');
    expect(primary.textContent).toContain('3 prestação(ões)');
  });

  it('renders the bruto and dedução secondary outputs', () => {
    const outs = fixture.nativeElement.querySelectorAll('.imi-out');
    expect(outs.length).toBe(3);
    expect((outs[1] as HTMLElement).textContent).toContain('Bruto');
    expect((outs[1] as HTMLElement).textContent).toContain('450.00');
    expect((outs[2] as HTMLElement).textContent).toContain('Dedução agregado');
    expect((outs[2] as HTMLElement).textContent).toContain('0.00');
  });

  it('renders one instalment row per prestacoesCalendario entry', () => {
    const items = fixture.nativeElement.querySelectorAll('.imi-instalment');
    expect(items.length).toBe(3);
  });

  it('renders instalment number, month and value', () => {
    const items = fixture.nativeElement.querySelectorAll('.imi-instalment');
    const first = items[0] as HTMLElement;
    expect((first.querySelector('.imi-instalment-num') as HTMLElement).textContent).toContain('1');
    expect((first.querySelector('.imi-instalment-month') as HTMLElement).textContent).toContain('Maio');
    expect((first.querySelector('.imi-instalment-value') as HTMLElement).textContent).toContain('200.00');
    expect((first.querySelector('.imi-instalment-rule') as HTMLElement).textContent).toContain('prestação 1 de 3');
  });

  it('renders no instalment rows when prestacoesCalendario is empty', () => {
    stub.prestacoesCalendario.set([]);
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.imi-instalment');
    expect(items.length).toBe(0);
  });

  it('renders the section title for the payment calendar', () => {
    const sectionTitle = fixture.nativeElement.querySelector('.imi-section-title') as HTMLElement;
    expect(sectionTitle.textContent).toContain('Calendário de pagamento');
  });

  it('renders the regulatory footer text', () => {
    const footer = fixture.nativeElement.querySelector('.imi-footer') as HTMLElement;
    expect(footer).toBeTruthy();
    expect(footer.textContent).toContain('Regra AT 2026');
    expect(footer.textContent).toContain('Maio');
    expect(footer.textContent).toContain('Novembro');
  });
});
