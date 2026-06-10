import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, computed } from '@angular/core';
import { DepositReturnEstimatorComponent } from './deposit-return-estimator.component';
import {
  DepositReturnService,
  DamageCategory,
  DamageItem,
} from '../../services/deposit-return.service';

describe('DepositReturnEstimatorComponent', () => {
  let fixture: ComponentFixture<DepositReturnEstimatorComponent>;
  let component: DepositReturnEstimatorComponent;

  const makeItem = (
    id: string,
    label: string,
    cost: number,
    category: DamageCategory,
  ): DamageItem => ({ id, label, cost, category });

  const itemsSignal = signal<DamageItem[]>([]);

  const stub = {
    caucaoOriginal: signal<number>(1000),
    withholdingPct: signal<number>(0),
    damageItems: itemsSignal,
    itemsTotal: computed(() =>
      itemsSignal().reduce((acc, it) => acc + (it.cost > 0 ? it.cost : 0), 0),
    ),
    withholdingAmount: computed(() => {
      const pct = stub.withholdingPct();
      if (pct <= 0) return 0;
      return (stub.caucaoOriginal() * pct) / 100;
    }),
    totalDeductions: computed(() => stub.itemsTotal() + stub.withholdingAmount()),
    returnAmount: computed(() => {
      const refund = stub.caucaoOriginal() - stub.totalDeductions();
      return refund > 0 ? refund : 0;
    }),
    returnPct: computed(() => {
      const cau = stub.caucaoOriginal();
      if (cau <= 0) return 0;
      return Math.round((stub.returnAmount() / cau) * 100);
    }),
    byCategory: computed(() => {
      const map = new Map<DamageCategory, number>();
      for (const it of itemsSignal()) {
        const prev = map.get(it.category) ?? 0;
        map.set(it.category, prev + (it.cost > 0 ? it.cost : 0));
      }
      return map;
    }),
    hasShortfall: computed(() => stub.totalDeductions() > stub.caucaoOriginal()),
    addItem: jest.fn(function (this: void, input: { label: string; cost: number; category: DamageCategory }) {
      itemsSignal.update(list => [
        ...list,
        { id: `damage-${list.length + 1}`, label: input.label, cost: input.cost, category: input.category },
      ]);
    }),
    removeItem: jest.fn(function (this: void, id: string) {
      itemsSignal.update(list => list.filter(it => it.id !== id));
    }),
    setCaucao: jest.fn(function (this: void, value: number) {
      stub.caucaoOriginal.set(value);
    }),
    setWithholdingPct: jest.fn(function (this: void, value: number) {
      stub.withholdingPct.set(value);
    }),
    reset: jest.fn(function (this: void) {
      itemsSignal.set([]);
      stub.caucaoOriginal.set(0);
      stub.withholdingPct.set(0);
    }),
  };

  beforeEach(async () => {
    stub.caucaoOriginal.set(1000);
    stub.withholdingPct.set(0);
    itemsSignal.set([]);
    stub.addItem.mockClear();
    stub.removeItem.mockClear();
    stub.setCaucao.mockClear();
    stub.setWithholdingPct.mockClear();
    stub.reset.mockClear();

    await TestBed.configureTestingModule({
      imports: [DepositReturnEstimatorComponent],
      providers: [
        { provide: DepositReturnService, useValue: stub as any },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DepositReturnEstimatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the title', () => {
    const title = fixture.nativeElement.querySelector('.dre-title') as HTMLElement;
    expect(title).toBeTruthy();
    expect(title.textContent).toContain('Devolução de Caução');
  });

  it('renders the subtitle with the NRAU reference', () => {
    const subtitle = fixture.nativeElement.querySelector('.dre-subtitle') as HTMLElement;
    expect(subtitle).toBeTruthy();
    expect(subtitle.textContent).toContain('NRAU art. 13');
  });

  it('caução input value equals service.caucaoOriginal()', () => {
    const inputs = fixture.nativeElement.querySelectorAll('.dre-top .dre-input') as NodeListOf<HTMLInputElement>;
    expect(inputs[0].value).toBe('1000');
  });

  it('typing in the caução input calls service.setCaucao with the parsed number', () => {
    const inputs = fixture.nativeElement.querySelectorAll('.dre-top .dre-input') as NodeListOf<HTMLInputElement>;
    inputs[0].value = '1500';
    inputs[0].dispatchEvent(new Event('input'));
    expect(stub.setCaucao).toHaveBeenCalledWith(1500);
  });

  it('withholding input value equals service.withholdingPct()', () => {
    stub.withholdingPct.set(10);
    fixture.detectChanges();
    const inputs = fixture.nativeElement.querySelectorAll('.dre-top .dre-input') as NodeListOf<HTMLInputElement>;
    expect(inputs[1].value).toBe('10');
  });

  it('typing in the withholding input calls service.setWithholdingPct', () => {
    const inputs = fixture.nativeElement.querySelectorAll('.dre-top .dre-input') as NodeListOf<HTMLInputElement>;
    inputs[1].value = '15';
    inputs[1].dispatchEvent(new Event('input'));
    expect(stub.setWithholdingPct).toHaveBeenCalledWith(15);
  });

  it('renders the add-deduction section title', () => {
    const titles = fixture.nativeElement.querySelectorAll('.dre-section-title') as NodeListOf<HTMLElement>;
    expect(titles[0].textContent).toContain('Adicionar dedução');
  });

  it('add button is disabled when draft is empty', () => {
    const btn = fixture.nativeElement.querySelector('.dre-add-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('add button becomes enabled when label and cost are valid, and addItem fires with the draft', () => {
    const addInputs = fixture.nativeElement.querySelectorAll('.dre-add .dre-input') as NodeListOf<HTMLInputElement>;
    const labelInput = addInputs[0];
    const costInput = addInputs[1];

    labelInput.value = 'pintura sala';
    labelInput.dispatchEvent(new Event('input'));
    costInput.value = '120';
    costInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.dre-add-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);

    btn.click();
    expect(stub.addItem).toHaveBeenCalledWith({
      label: 'pintura sala',
      cost: 120,
      category: 'cleaning',
    });
  });

  it('changing the category select updates the draft category used by addItem', () => {
    const addInputs = fixture.nativeElement.querySelectorAll('.dre-add .dre-input') as NodeListOf<HTMLInputElement>;
    const labelInput = addInputs[0];
    const costInput = addInputs[1];
    const select = fixture.nativeElement.querySelector('.dre-add select.dre-input') as HTMLSelectElement;

    labelInput.value = 'reparação porta';
    labelInput.dispatchEvent(new Event('input'));
    costInput.value = '80';
    costInput.dispatchEvent(new Event('input'));
    select.value = 'repairs';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.dre-add-btn') as HTMLButtonElement;
    btn.click();

    expect(stub.addItem).toHaveBeenCalledWith({
      label: 'reparação porta',
      cost: 80,
      category: 'repairs',
    });
  });

  it('non-numeric cost is coerced to 0 and keeps the add button disabled', () => {
    const addInputs = fixture.nativeElement.querySelectorAll('.dre-add .dre-input') as NodeListOf<HTMLInputElement>;
    const labelInput = addInputs[0];
    const costInput = addInputs[1];

    labelInput.value = 'algo';
    labelInput.dispatchEvent(new Event('input'));
    costInput.value = 'abc';
    costInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.dre-add-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('renders the empty-state message when there are no items', () => {
    const empty = fixture.nativeElement.querySelector('.dre-empty') as HTMLElement;
    expect(empty).toBeTruthy();
    expect(empty.textContent).toContain('Sem deduções');
  });

  it('renders one .dre-item per damageItem and hides empty-state', () => {
    itemsSignal.set([
      makeItem('d1', 'Limpeza profunda', 80, 'cleaning'),
      makeItem('d2', 'Reparação torneira', 45, 'repairs'),
    ]);
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('.dre-item');
    expect(items.length).toBe(2);
    expect(fixture.nativeElement.querySelector('.dre-empty')).toBeNull();
  });

  it('renders item label, category label and cost', () => {
    itemsSignal.set([makeItem('d1', 'Limpeza profunda', 80, 'cleaning')]);
    fixture.detectChanges();

    const item = fixture.nativeElement.querySelector('.dre-item') as HTMLElement;
    expect((item.querySelector('.dre-item-label') as HTMLElement).textContent).toContain('Limpeza profunda');
    expect((item.querySelector('.dre-item-cat') as HTMLElement).textContent).toContain('Limpeza');
    expect((item.querySelector('.dre-item-cost') as HTMLElement).textContent).toContain('80');
  });

  it('clicking the remove button calls service.removeItem with the item id', () => {
    itemsSignal.set([makeItem('d1', 'Limpeza profunda', 80, 'cleaning')]);
    fixture.detectChanges();

    const removeBtn = fixture.nativeElement.querySelector('.dre-item-remove') as HTMLButtonElement;
    removeBtn.click();
    expect(stub.removeItem).toHaveBeenCalledWith('d1');
  });

  it('renders the items count badge matching damageItems().length', () => {
    itemsSignal.set([
      makeItem('d1', 'a', 10, 'cleaning'),
      makeItem('d2', 'b', 20, 'repairs'),
      makeItem('d3', 'c', 30, 'other'),
    ]);
    fixture.detectChanges();

    const count = fixture.nativeElement.querySelector('.dre-section-count') as HTMLElement;
    expect(count.textContent).toContain('3');
  });

  it('summary shows the caução original amount', () => {
    const summary = fixture.nativeElement.querySelector('.dre-summary') as HTMLElement;
    expect(summary.textContent).toContain('Caução original');
    expect(summary.textContent).toContain('1,000');
  });

  it('summary shows the return amount equal to caução when there are no deductions', () => {
    const totalRow = fixture.nativeElement.querySelector('.dre-sum-row--total') as HTMLElement;
    expect(totalRow.textContent).toContain('Devolver ao inquilino');
    expect(totalRow.textContent).toContain('1,000');
  });

  it('hides the withholding row when withholdingPct is 0', () => {
    const rows = fixture.nativeElement.querySelectorAll('.dre-sum-row');
    const text = Array.from(rows).map(r => (r as HTMLElement).textContent ?? '').join('|');
    expect(text).not.toContain('Retenção');
  });

  it('shows the withholding row with percentage when withholdingPct > 0', () => {
    stub.withholdingPct.set(10);
    fixture.detectChanges();
    const summary = fixture.nativeElement.querySelector('.dre-summary') as HTMLElement;
    expect(summary.textContent).toContain('Retenção 10%');
    expect(summary.textContent).toContain('100');
  });

  it('does NOT apply the shortfall class when deductions fit inside the caução', () => {
    const summary = fixture.nativeElement.querySelector('.dre-summary') as HTMLElement;
    expect(summary.classList.contains('dre-summary--shortfall')).toBe(false);
    expect(summary.textContent).toContain('Devolução conforme art. 13');
  });

  it('applies the shortfall class and message when deductions exceed the caução', () => {
    itemsSignal.set([makeItem('d1', 'Reparação enorme', 1500, 'repairs')]);
    fixture.detectChanges();
    const summary = fixture.nativeElement.querySelector('.dre-summary') as HTMLElement;
    expect(summary.classList.contains('dre-summary--shortfall')).toBe(true);
    const short = summary.querySelector('.dre-shortfall') as HTMLElement;
    expect(short).toBeTruthy();
    expect(short.textContent).toContain('Deduções excedem caução');
  });

  it('does NOT render the breakdown section when byCategory is empty', () => {
    expect(fixture.nativeElement.querySelector('.dre-breakdown')).toBeNull();
  });

  it('renders the breakdown section with one cell per used category', () => {
    itemsSignal.set([
      makeItem('d1', 'limpeza', 50, 'cleaning'),
      makeItem('d2', 'reparação', 100, 'repairs'),
    ]);
    fixture.detectChanges();

    const cells = fixture.nativeElement.querySelectorAll('.dre-breakdown-cell');
    expect(cells.length).toBe(2);
    const all = (fixture.nativeElement.querySelector('.dre-breakdown') as HTMLElement).textContent ?? '';
    expect(all).toContain('Limpeza');
    expect(all).toContain('Reparações');
  });

  it('reset button click calls service.reset', () => {
    const reset = fixture.nativeElement.querySelector('.dre-reset') as HTMLButtonElement;
    reset.click();
    expect(stub.reset).toHaveBeenCalled();
  });
});
