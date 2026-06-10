import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AIMICalculatorComponent } from './aimi-calculator.component';
import {
  AIMIService,
  type AIMIPropriedade,
  type AIMITitular,
  type AIMIBreakdownLinha,
} from '../../services/aimi.service';

describe('AIMICalculatorComponent', () => {
  let fixture: ComponentFixture<AIMICalculatorComponent>;
  let component: AIMICalculatorComponent;

  const baseProps: readonly AIMIPropriedade[] = [
    { id: 'p1', label: 'T2 Lisboa Avenidas', vpt: 320_000 },
    { id: 'p2', label: 'T3 Cascais', vpt: 480_000 },
    { id: 'p3', label: 'Loja Marvila', vpt: 180_000 },
  ];

  const baseBreakdown: readonly AIMIBreakdownLinha[] = [
    { escalao: 'Até €1M', base: 380_000, taxa: 0.007, colecta: 2660 },
  ];

  const stub = {
    propriedades: signal<readonly AIMIPropriedade[]>(baseProps),
    titular: signal<AIMITitular>('singular'),
    vptTotal: signal<number>(980_000),
    deducao: signal<number>(600_000),
    baseTributavel: signal<number>(380_000),
    breakdown: signal<readonly AIMIBreakdownLinha[]>(baseBreakdown),
    colecta: signal<number>(2660),
    taxaEfectiva: signal<number>(0.0027),
    sujeitoAImposto: signal<boolean>(true),
    setTitular: jest.fn(function (this: void, t: AIMITitular) {
      stub.titular.set(t);
    }),
    setVptDe: jest.fn(),
    setPropriedades: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(async () => {
    stub.propriedades.set(baseProps);
    stub.titular.set('singular');
    stub.vptTotal.set(980_000);
    stub.deducao.set(600_000);
    stub.baseTributavel.set(380_000);
    stub.breakdown.set(baseBreakdown);
    stub.colecta.set(2660);
    stub.taxaEfectiva.set(0.0027);
    stub.sujeitoAImposto.set(true);
    stub.setTitular.mockClear();
    stub.setVptDe.mockClear();
    stub.setPropriedades.mockClear();
    stub.reset.mockClear();

    await TestBed.configureTestingModule({
      imports: [AIMICalculatorComponent],
      providers: [{ provide: AIMIService, useValue: stub as any }],
    }).compileComponents();

    fixture = TestBed.createComponent(AIMICalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the title', () => {
    const title = fixture.nativeElement.querySelector('.aimi-title') as HTMLElement;
    expect(title).toBeTruthy();
    expect(title.textContent).toContain('Calculadora AIMI');
  });

  it('renders the subtitle', () => {
    const subtitle = fixture.nativeElement.querySelector('.aimi-subtitle') as HTMLElement;
    expect(subtitle).toBeTruthy();
    expect(subtitle.textContent).toContain('Adicional ao IMI');
    expect(subtitle.textContent).toContain('2026');
  });

  it('renders three regime radio options with deducao captions', () => {
    const radios = fixture.nativeElement.querySelectorAll('.aimi-radio');
    expect(radios.length).toBe(3);
    expect((radios[0] as HTMLElement).textContent).toContain('Singular');
    expect((radios[0] as HTMLElement).textContent).toContain('600k €');
    expect((radios[1] as HTMLElement).textContent).toContain('Casal');
    expect((radios[1] as HTMLElement).textContent).toContain('1.2M €');
    expect((radios[2] as HTMLElement).textContent).toContain('Sociedade');
    expect((radios[2] as HTMLElement).textContent).toContain('0.4%');
  });

  it('marks the singular radio checked when titular is singular', () => {
    const inputs = fixture.nativeElement.querySelectorAll(
      'input[type="radio"]',
    ) as NodeListOf<HTMLInputElement>;
    expect(inputs[0].checked).toBe(true);
    expect(inputs[1].checked).toBe(false);
    expect(inputs[2].checked).toBe(false);
  });

  it('marks the sociedade radio checked when titular changes', () => {
    stub.titular.set('sociedade');
    fixture.detectChanges();
    const inputs = fixture.nativeElement.querySelectorAll(
      'input[type="radio"]',
    ) as NodeListOf<HTMLInputElement>;
    expect(inputs[0].checked).toBe(false);
    expect(inputs[2].checked).toBe(true);
  });

  it('changing a radio fires setTitular with the chosen regime', () => {
    const inputs = fixture.nativeElement.querySelectorAll(
      'input[type="radio"]',
    ) as NodeListOf<HTMLInputElement>;
    inputs[1].dispatchEvent(new Event('change'));
    expect(stub.setTitular).toHaveBeenCalledWith('conjunto');
  });

  it('renders one .aimi-prop-row per propriedade', () => {
    const rows = fixture.nativeElement.querySelectorAll('.aimi-prop-row');
    expect(rows.length).toBe(3);
  });

  it('each prop row shows label and input bound to vpt', () => {
    const rows = fixture.nativeElement.querySelectorAll('.aimi-prop-row');
    const firstName = (rows[0] as HTMLElement).querySelector(
      '.aimi-prop-name',
    ) as HTMLElement;
    const firstInput = (rows[0] as HTMLElement).querySelector(
      '.aimi-prop-input',
    ) as HTMLInputElement;
    expect(firstName.textContent).toContain('T2 Lisboa Avenidas');
    expect(firstInput.value).toBe('320000');
  });

  it('typing into a prop input calls svc.setVptDe with id and parsed number', () => {
    const rows = fixture.nativeElement.querySelectorAll('.aimi-prop-row');
    const input = (rows[1] as HTMLElement).querySelector(
      '.aimi-prop-input',
    ) as HTMLInputElement;
    input.value = '500000';
    input.dispatchEvent(new Event('input'));
    expect(stub.setVptDe).toHaveBeenCalledWith('p2', 500000);
  });

  it('renders VPT total with formatted value', () => {
    const total = fixture.nativeElement.querySelector(
      '.aimi-prop-total-value',
    ) as HTMLElement;
    expect(total).toBeTruthy();
    expect(total.textContent).toContain('980,000');
  });

  it('renders Deducao, Base Tributavel and AIMI a pagar outputs', () => {
    const outs = fixture.nativeElement.querySelectorAll('.aimi-out');
    const labels = Array.from(outs).map(
      (o) => (o as HTMLElement).querySelector('.aimi-out-label')?.textContent ?? '',
    );
    expect(labels.some((l) => l.includes('Dedução aplicável'))).toBe(true);
    expect(labels.some((l) => l.includes('Base tributável'))).toBe(true);
    expect(labels.some((l) => l.includes('AIMI a pagar'))).toBe(true);
  });

  it('AIMI a pagar primary output shows colecta and effective tax rate', () => {
    const primary = fixture.nativeElement.querySelector(
      '.aimi-out--primary',
    ) as HTMLElement;
    expect(primary).toBeTruthy();
    expect(primary.textContent).toContain('AIMI a pagar');
    expect(primary.textContent).toContain('2,660');
    expect(primary.textContent).toContain('0.27%');
  });

  it('does NOT render the "Não sujeito" info block when sujeitoAImposto is true', () => {
    const info = fixture.nativeElement.querySelector('.aimi-out--info');
    expect(info).toBeNull();
  });

  it('renders the "Não sujeito" info block when sujeitoAImposto is false', () => {
    stub.sujeitoAImposto.set(false);
    fixture.detectChanges();
    const info = fixture.nativeElement.querySelector('.aimi-out--info') as HTMLElement;
    expect(info).toBeTruthy();
    expect(info.textContent).toContain('Não sujeito');
  });

  it('renders the breakdown section with one row per breakdown line', () => {
    const section = fixture.nativeElement.querySelector('.aimi-breakdown-section');
    expect(section).toBeTruthy();
    const rows = fixture.nativeElement.querySelectorAll('.aimi-table tbody tr');
    expect(rows.length).toBe(1);
    expect((rows[0] as HTMLElement).textContent).toContain('Até €1M');
    expect((rows[0] as HTMLElement).textContent).toContain('0.70%');
    expect((rows[0] as HTMLElement).textContent).toContain('2,660');
  });

  it('does NOT render breakdown section when sujeitoAImposto is false', () => {
    stub.sujeitoAImposto.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.aimi-breakdown-section')).toBeNull();
  });

  it('reset button click calls svc.reset()', () => {
    const btn = fixture.nativeElement.querySelector('.aimi-reset') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    btn.click();
    expect(stub.reset).toHaveBeenCalled();
  });

  it('renders the footer with regulatory disclaimer', () => {
    const footer = fixture.nativeElement.querySelector('.aimi-footer') as HTMLElement;
    expect(footer).toBeTruthy();
    expect(footer.textContent).toContain('Estimativa indicativa');
  });

  it('reflects propriedades changes from the service signal', () => {
    stub.propriedades.set([
      { id: 'pX', label: 'Moradia Sintra', vpt: 750_000 },
    ]);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.aimi-prop-row');
    expect(rows.length).toBe(1);
    const name = (rows[0] as HTMLElement).querySelector(
      '.aimi-prop-name',
    ) as HTMLElement;
    expect(name.textContent).toContain('Moradia Sintra');
  });
});
