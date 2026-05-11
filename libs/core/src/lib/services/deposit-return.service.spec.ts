import { TestBed } from '@angular/core/testing';
import { DepositReturnService } from './deposit-return.service';

describe('DepositReturnService', () => {
  let service: DepositReturnService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DepositReturnService);
    service.reset();
  });

  it('should be created', () => expect(service).toBeTruthy());

  it('default empty state: caução 0, sem itens, sem withholding', () => {
    expect(service.caucaoOriginal()).toBe(0);
    expect(service.damageItems().length).toBe(0);
    expect(service.withholdingPct()).toBe(0);
    expect(service.returnAmount()).toBe(0);
  });

  it('caução €1500, sem deduções → devolve total', () => {
    service.setCaucao(1500);
    expect(service.returnAmount()).toBe(1500);
    expect(service.returnPct()).toBe(100);
  });

  it('caução €1500 − cleaning €200 → devolve €1300', () => {
    service.setCaucao(1500);
    service.addItem({ label: 'Cleaning', cost: 200, category: 'cleaning' });
    expect(service.itemsTotal()).toBe(200);
    expect(service.returnAmount()).toBe(1300);
  });

  it('withholding 10% sobre €1000 = €100 admin → devolve €900', () => {
    service.setCaucao(1000);
    service.setWithholdingPct(10);
    expect(service.withholdingAmount()).toBe(100);
    expect(service.totalDeductions()).toBe(100);
    expect(service.returnAmount()).toBe(900);
  });

  it('byCategory agrega vários itens da mesma categoria', () => {
    service.setCaucao(2000);
    service.addItem({ label: 'Pintura', cost: 300, category: 'repairs' });
    service.addItem({ label: 'Pavimento', cost: 150, category: 'repairs' });
    service.addItem({ label: 'EDP em atraso', cost: 80, category: 'unpaid_utilities' });
    expect(service.byCategory().get('repairs')).toBe(450);
    expect(service.byCategory().get('unpaid_utilities')).toBe(80);
  });

  it('hasShortfall verdadeiro quando deduções > caução', () => {
    service.setCaucao(500);
    service.addItem({ label: 'Estragos graves', cost: 1500, category: 'repairs' });
    expect(service.hasShortfall()).toBe(true);
    expect(service.returnAmount()).toBe(0);
  });

  it('returnAmount nunca negativo', () => {
    service.setCaucao(100);
    service.addItem({ label: 'Caro', cost: 999, category: 'repairs' });
    expect(service.returnAmount()).toBe(0);
  });

  it('removeItem retira o item correcto', () => {
    service.setCaucao(1000);
    service.addItem({ label: 'A', cost: 100, category: 'cleaning' });
    service.addItem({ label: 'B', cost: 200, category: 'repairs' });
    const targetId = service.damageItems()[0].id;
    service.removeItem(targetId);
    expect(service.damageItems().length).toBe(1);
    expect(service.damageItems()[0].label).toBe('B');
  });

  it('withholdingPct é clampado 0..100 e rejeita NaN', () => {
    service.setWithholdingPct(-5);
    expect(service.withholdingPct()).toBe(0);
    service.setWithholdingPct(150);
    expect(service.withholdingPct()).toBe(100);
    service.setWithholdingPct(NaN);
    expect(service.withholdingPct()).toBe(0);
  });

  it('costs negativos coercidos a 0 (não inflam itemsTotal)', () => {
    service.setCaucao(1000);
    service.addItem({ label: 'Bug', cost: -50, category: 'other' });
    expect(service.itemsTotal()).toBe(0);
  });

  it('label vazio recebe placeholder "Sem descrição"', () => {
    service.addItem({ label: '   ', cost: 50, category: 'other' });
    expect(service.damageItems()[0].label).toBe('Sem descrição');
  });

  it('reset limpa items, caução e withholding', () => {
    service.setCaucao(1000);
    service.setWithholdingPct(20);
    service.addItem({ label: 'X', cost: 100, category: 'cleaning' });
    service.reset();
    expect(service.caucaoOriginal()).toBe(0);
    expect(service.withholdingPct()).toBe(0);
    expect(service.damageItems().length).toBe(0);
  });
});
