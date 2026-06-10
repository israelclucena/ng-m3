import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { IMTCalculatorComponent } from './imt-calculator.component';
import { IMTService } from '../../services/imt.service';
import type {
  IMTBreakdownLinha,
  IMTFinalidade,
  IMTResidencia,
} from '../../services/imt.service';

describe('IMTCalculatorComponent', () => {
  let fixture: ComponentFixture<IMTCalculatorComponent>;
  let component: IMTCalculatorComponent;

  const baseBreakdown: IMTBreakdownLinha[] = [
    { escalao: 'Até €101.917', base: 101917, taxa: 0, colecta: 0 },
    { escalao: '€101.917–€139.412', base: 37495, taxa: 0.02, colecta: 749.9 },
    { escalao: '€139.412–€190.086', base: 140588, taxa: 0.05, colecta: 7029.4 },
  ];

  const stub = {
    valorAquisicao: signal<number>(280_000),
    finalidade: signal<IMTFinalidade>('hpp'),
    residencia: signal<IMTResidencia>('residente'),
    jovemPrimeiraHabitacao: signal<boolean>(false),
    elegivelJovem: signal<boolean>(false),
    breakdown: signal<readonly IMTBreakdownLinha[]>(baseBreakdown),
    imt: signal<number>(7779.3),
    is: signal<number>(2240),
    total: signal<number>(10019.3),
    taxaEfectiva: signal<number>(0.0358),
    regimeCaption: signal<string>(
      'Habitação Própria Permanente · tabela escalonada com isenção até €101.917',
    ),
    setValorAquisicao: jest.fn(function (this: void, v: number) {
      stub.valorAquisicao.set(v);
    }),
    setFinalidade: jest.fn(function (this: void, f: IMTFinalidade) {
      stub.finalidade.set(f);
    }),
    setResidencia: jest.fn(function (this: void, r: IMTResidencia) {
      stub.residencia.set(r);
    }),
    setJovem: jest.fn(function (this: void, b: boolean) {
      stub.jovemPrimeiraHabitacao.set(b);
    }),
    reset: jest.fn(),
  };

  beforeEach(async () => {
    stub.valorAquisicao.set(280_000);
    stub.finalidade.set('hpp');
    stub.residencia.set('residente');
    stub.jovemPrimeiraHabitacao.set(false);
    stub.elegivelJovem.set(false);
    stub.breakdown.set(baseBreakdown);
    stub.imt.set(7779.3);
    stub.is.set(2240);
    stub.total.set(10019.3);
    stub.taxaEfectiva.set(0.0358);
    stub.regimeCaption.set(
      'Habitação Própria Permanente · tabela escalonada com isenção até €101.917',
    );
    stub.setValorAquisicao.mockClear();
    stub.setFinalidade.mockClear();
    stub.setResidencia.mockClear();
    stub.setJovem.mockClear();
    stub.reset.mockClear();

    await TestBed.configureTestingModule({
      imports: [IMTCalculatorComponent],
      providers: [
        { provide: IMTService, useValue: stub as any },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IMTCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the title', () => {
    const title = fixture.nativeElement.querySelector('.imt-title') as HTMLElement;
    expect(title).toBeTruthy();
    expect(title.textContent).toContain('Calculadora IMT');
  });

  it('renders the subtitle with regulatory context', () => {
    const subtitle = fixture.nativeElement.querySelector('.imt-subtitle') as HTMLElement;
    expect(subtitle).toBeTruthy();
    expect(subtitle.textContent).toContain('Imposto Municipal sobre Transmissões');
    expect(subtitle.textContent).toContain('2026');
  });

  it('reset button click calls service.reset', () => {
    const btn = fixture.nativeElement.querySelector('.imt-reset') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    btn.click();
    expect(stub.reset).toHaveBeenCalledTimes(1);
  });

  it('valor input reflects service.valorAquisicao signal', () => {
    const input = fixture.nativeElement.querySelector('.imt-input') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.value).toBe('280000');
  });

  it('typing into valor input calls service.setValorAquisicao with parsed number', () => {
    const input = fixture.nativeElement.querySelector('.imt-input') as HTMLInputElement;
    input.value = '350000';
    input.dispatchEvent(new Event('input'));
    expect(stub.setValorAquisicao).toHaveBeenCalledWith(350000);
  });

  it('finalidade radios reflect current signal value', () => {
    const radios = fixture.nativeElement.querySelectorAll(
      'input[type="radio"][name="finalidade"]',
    ) as NodeListOf<HTMLInputElement>;
    expect(radios.length).toBe(3);
    expect(radios[0].checked).toBe(true);
    expect(radios[1].checked).toBe(false);
    expect(radios[2].checked).toBe(false);
  });

  it('changing finalidade to outros calls setFinalidade("outros")', () => {
    const radios = fixture.nativeElement.querySelectorAll(
      'input[type="radio"][name="finalidade"]',
    ) as NodeListOf<HTMLInputElement>;
    radios[1].dispatchEvent(new Event('change'));
    expect(stub.setFinalidade).toHaveBeenCalledWith('outros');
  });

  it('changing finalidade to rural calls setFinalidade("rural")', () => {
    const radios = fixture.nativeElement.querySelectorAll(
      'input[type="radio"][name="finalidade"]',
    ) as NodeListOf<HTMLInputElement>;
    radios[2].dispatchEvent(new Event('change'));
    expect(stub.setFinalidade).toHaveBeenCalledWith('rural');
  });

  it('residencia radios reflect current signal value', () => {
    const radios = fixture.nativeElement.querySelectorAll(
      'input[type="radio"][name="residencia"]',
    ) as NodeListOf<HTMLInputElement>;
    expect(radios.length).toBe(2);
    expect(radios[0].checked).toBe(true);
    expect(radios[1].checked).toBe(false);
  });

  it('changing residencia to naoResidente calls setResidencia', () => {
    const radios = fixture.nativeElement.querySelectorAll(
      'input[type="radio"][name="residencia"]',
    ) as NodeListOf<HTMLInputElement>;
    radios[1].dispatchEvent(new Event('change'));
    expect(stub.setResidencia).toHaveBeenCalledWith('naoResidente');
  });

  it('renders jovem checkbox when finalidade is hpp and residencia is residente', () => {
    const checkbox = fixture.nativeElement.querySelector(
      '.imt-checkbox input[type="checkbox"]',
    ) as HTMLInputElement;
    expect(checkbox).toBeTruthy();
  });

  it('does NOT render jovem checkbox when finalidade is not hpp', () => {
    stub.finalidade.set('outros');
    fixture.detectChanges();
    const checkbox = fixture.nativeElement.querySelector('.imt-checkbox');
    expect(checkbox).toBeNull();
  });

  it('does NOT render jovem checkbox when residencia is naoResidente', () => {
    stub.residencia.set('naoResidente');
    fixture.detectChanges();
    const checkbox = fixture.nativeElement.querySelector('.imt-checkbox');
    expect(checkbox).toBeNull();
  });

  it('toggling jovem checkbox calls setJovem with checked state', () => {
    const checkbox = fixture.nativeElement.querySelector(
      '.imt-checkbox input[type="checkbox"]',
    ) as HTMLInputElement;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    expect(stub.setJovem).toHaveBeenCalledWith(true);
  });

  it('renders regime caption from service', () => {
    const outs = fixture.nativeElement.querySelectorAll('.imt-out');
    expect(outs[0].textContent).toContain('Regime activo');
    expect(outs[0].textContent).toContain('Habitação Própria Permanente');
  });

  it('renders IMT value with euro sign', () => {
    const outs = fixture.nativeElement.querySelectorAll('.imt-out');
    expect(outs[1].textContent).toContain('IMT');
    expect(outs[1].textContent).toContain('7,779.30');
    expect(outs[1].textContent).toContain('€');
  });

  it('IMT detail shows tabela escalonada when not elegivelJovem', () => {
    const outs = fixture.nativeElement.querySelectorAll('.imt-out');
    expect(outs[1].textContent).toContain('Tabela escalonada por tranches');
  });

  it('IMT detail shows isenção jovens active when elegivelJovem is true', () => {
    stub.elegivelJovem.set(true);
    fixture.detectChanges();
    const outs = fixture.nativeElement.querySelectorAll('.imt-out');
    expect(outs[1].textContent).toContain('Isenção jovens activa');
  });

  it('renders Imposto de Selo value with 0.8% caption', () => {
    const outs = fixture.nativeElement.querySelectorAll('.imt-out');
    expect(outs[2].textContent).toContain('Imposto de Selo');
    expect(outs[2].textContent).toContain('2,240.00');
    expect(outs[2].textContent).toContain('0.8%');
  });

  it('renders Total a pagar with primary modifier class', () => {
    const primary = fixture.nativeElement.querySelector('.imt-out--primary') as HTMLElement;
    expect(primary).toBeTruthy();
    expect(primary.textContent).toContain('Total a pagar na compra');
    expect(primary.textContent).toContain('10,019.30');
  });

  it('renders taxa efectiva percentage in total detail', () => {
    const primary = fixture.nativeElement.querySelector('.imt-out--primary') as HTMLElement;
    expect(primary.textContent).toContain('3.58%');
  });

  it('renders breakdown table with one row per linha', () => {
    const rows = fixture.nativeElement.querySelectorAll('.imt-table tbody tr');
    expect(rows.length).toBe(3);
  });

  it('breakdown table renders escalao label, base, taxa and colecta', () => {
    const rows = fixture.nativeElement.querySelectorAll('.imt-table tbody tr');
    const cells = (rows[1] as HTMLElement).querySelectorAll('td');
    expect(cells[0].textContent).toContain('€101.917–€139.412');
    expect(cells[1].textContent).toContain('37,495.00');
    expect(cells[2].textContent).toContain('2.00%');
    expect(cells[3].textContent).toContain('749.90');
  });

  it('does NOT render breakdown section when breakdown is empty', () => {
    stub.breakdown.set([]);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('.imt-breakdown-section');
    expect(section).toBeNull();
  });

  it('renders the footer with regulatory caveat', () => {
    const footer = fixture.nativeElement.querySelector('.imt-footer') as HTMLElement;
    expect(footer).toBeTruthy();
    expect(footer.textContent).toContain('Estimativa indicativa');
    expect(footer.textContent).toContain('notário');
  });
});
