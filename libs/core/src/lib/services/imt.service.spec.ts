import { TestBed } from '@angular/core/testing';
import {
  IMTService,
  PT_IMT_HPP_2026,
  PT_IMT_OUTROS_2026,
  PT_IMT_TAXA_RURAL,
  PT_IMT_JOVEM_LIMITE,
  PT_IS_IMOVEL,
} from './imt.service';

describe('IMTService', () => {
  let service: IMTService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IMTService);
    service.reset();
  });

  it('should be created', () => expect(service).toBeTruthy());

  it('default seed: HPP residente €280k → IMT > 0 + IS = €2240', () => {
    expect(service.valorAquisicao()).toBe(280_000);
    expect(service.finalidade()).toBe('hpp');
    expect(service.is()).toBe(280_000 * PT_IS_IMOVEL);
    expect(service.imt()).toBeGreaterThan(0);
  });

  it('HPP @ €100k → primeira tranche isenta → IMT = 0', () => {
    service.setValorAquisicao(100_000);
    expect(service.imt()).toBe(0);
    expect(service.is()).toBe(800);
    expect(service.total()).toBe(800);
  });

  it('Outros @ €100k → 1% sobre todo o valor (sem isenção) = €1000', () => {
    service.setValorAquisicao(100_000);
    service.setFinalidade('outros');
    expect(service.imt()).toBe(1000);
  });

  it('isenção jovem aplicada quando HPP + residente + ≤ €316.772', () => {
    service.setValorAquisicao(PT_IMT_JOVEM_LIMITE);
    service.setJovem(true);
    expect(service.elegivelJovem()).toBe(true);
    expect(service.imt()).toBe(0);
    expect(service.breakdown().length).toBe(0);
    // IS continua devido (round2 → 2534.18)
    expect(service.is()).toBeCloseTo(PT_IMT_JOVEM_LIMITE * PT_IS_IMOVEL, 1);
  });

  it('isenção jovem rejeitada acima do limite €316.772', () => {
    service.setValorAquisicao(PT_IMT_JOVEM_LIMITE + 1);
    service.setJovem(true);
    expect(service.elegivelJovem()).toBe(false);
    expect(service.imt()).toBeGreaterThan(0);
  });

  it('setFinalidade outros → revoga estatuto jovem automaticamente', () => {
    service.setJovem(true);
    expect(service.jovemPrimeiraHabitacao()).toBe(true);
    service.setFinalidade('outros');
    expect(service.jovemPrimeiraHabitacao()).toBe(false);
  });

  it('setResidencia naoResidente → revoga estatuto jovem', () => {
    service.setJovem(true);
    service.setResidencia('naoResidente');
    expect(service.jovemPrimeiraHabitacao()).toBe(false);
  });

  it('rural → taxa fixa 5% sobre valor total', () => {
    service.setValorAquisicao(50_000);
    service.setFinalidade('rural');
    expect(service.tabela().length).toBe(1);
    expect(service.imt()).toBe(50_000 * PT_IMT_TAXA_RURAL);
  });

  it('breakdown HPP @ €200k acumula tranches isenta + 2% + 5%', () => {
    service.setValorAquisicao(200_000);
    const lines = service.breakdown();
    // 3 escalões consumidos (0%, 2%, 5%)
    expect(lines.length).toBeGreaterThanOrEqual(3);
    expect(lines[0].taxa).toBe(0);
    expect(lines[1].taxa).toBe(0.02);
    expect(lines[2].taxa).toBe(0.05);
  });

  it('IS é sempre 0.8% sobre valor de aquisição', () => {
    service.setValorAquisicao(500_000);
    expect(service.is()).toBe(4000);
  });

  it('valor negativo é coercido para 0', () => {
    service.setValorAquisicao(-50_000);
    expect(service.valorAquisicao()).toBe(0);
    expect(service.imt()).toBe(0);
    expect(service.is()).toBe(0);
  });

  it('reset restaura defaults (€280k HPP residente sem jovem)', () => {
    service.setValorAquisicao(1_000_000);
    service.setFinalidade('outros');
    service.reset();
    expect(service.valorAquisicao()).toBe(280_000);
    expect(service.finalidade()).toBe('hpp');
    expect(service.residencia()).toBe('residente');
    expect(service.jovemPrimeiraHabitacao()).toBe(false);
  });

  it('tabelas HPP e Outros têm 6 escalões cada', () => {
    expect(PT_IMT_HPP_2026.length).toBe(6);
    expect(PT_IMT_OUTROS_2026.length).toBe(6);
  });
});
