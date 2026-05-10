import { TestBed } from '@angular/core/testing';
import {
  AIMIService,
  PT_AIMI_DEDUCAO_SINGULAR,
  PT_AIMI_DEDUCAO_CONJUNTO,
  PT_AIMI_TAXA_SOCIEDADE,
} from './aimi.service';

describe('AIMIService', () => {
  let service: AIMIService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AIMIService);
    service.reset();
  });

  it('should be created', () => expect(service).toBeTruthy());

  it('default seed sums to €980k VPT', () => {
    expect(service.vptTotal()).toBe(980_000);
  });

  it('singular deduction is €600k → no AIMI for €500k portfolio', () => {
    service.setPropriedades([{ id: 'a', label: 'Casa', vpt: 500_000 }]);
    expect(service.deducao()).toBe(PT_AIMI_DEDUCAO_SINGULAR);
    expect(service.baseTributavel()).toBe(0);
    expect(service.colecta()).toBe(0);
    expect(service.sujeitoAImposto()).toBe(false);
  });

  it('singular @ €1.2M VPT → base = €600k, colecta = 0.7% × €600k = €4200', () => {
    service.setPropriedades([{ id: 'a', label: 'Lisboa', vpt: 1_200_000 }]);
    service.setTitular('singular');
    expect(service.baseTributavel()).toBe(600_000);
    // Falls entirely within first bracket (up to €1M after deduction).
    expect(service.colecta()).toBe(4200);
  });

  it('conjunto deduction is €1.2M (double of singular)', () => {
    service.setTitular('conjunto');
    expect(service.deducao()).toBe(PT_AIMI_DEDUCAO_CONJUNTO);
    // Default seed €980k < €1.2M → not subject.
    expect(service.colecta()).toBe(0);
  });

  it('progressive brackets: singular @ €2.5M base → 1M×0.7% + 1M×1.0% + 0.5M×1.5%', () => {
    service.setPropriedades([{ id: 'a', label: 'Estoril', vpt: 3_100_000 }]);
    service.setTitular('singular');
    // base = €3.1M − €600k = €2.5M
    expect(service.baseTributavel()).toBe(2_500_000);
    // 1_000_000 * 0.007 = 7000
    // 1_000_000 * 0.010 = 10000
    //   500_000 * 0.015 = 7500
    // total = 24500
    expect(service.colecta()).toBe(24500);
    expect(service.breakdown().length).toBe(3);
  });

  it('sociedade applies flat 0.4% over total VPT (no deduction)', () => {
    service.setPropriedades([{ id: 'a', label: 'Sede', vpt: 800_000 }]);
    service.setTitular('sociedade');
    expect(service.deducao()).toBe(0);
    expect(service.colecta()).toBe(800_000 * PT_AIMI_TAXA_SOCIEDADE);
    expect(service.breakdown().length).toBe(1);
  });

  it('setVptDe updates a single property without re-seeding the rest', () => {
    const initial = service.vptTotal();
    service.setVptDe('p1', 500_000);
    // p1 was 320k → +180k
    expect(service.vptTotal()).toBe(initial + 180_000);
  });

  it('negative VPT inputs are coerced to 0', () => {
    service.setPropriedades([{ id: 'a', label: 'Bug', vpt: -100_000 }]);
    expect(service.vptTotal()).toBe(0);
  });

  it('reset restores default 3-property seed', () => {
    service.setPropriedades([]);
    expect(service.vptTotal()).toBe(0);
    service.reset();
    expect(service.vptTotal()).toBe(980_000);
    expect(service.titular()).toBe('singular');
  });

  it('taxaEfectiva is colecta divided by VPT total', () => {
    service.setPropriedades([{ id: 'a', label: 'Lisboa', vpt: 1_200_000 }]);
    service.setTitular('singular');
    // 4200 / 1_200_000 = 0.0035
    expect(service.taxaEfectiva()).toBe(0.0035);
  });
});
