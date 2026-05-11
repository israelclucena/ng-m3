import { TestBed } from '@angular/core/testing';
import {
  MaisValiasImobiliariasService,
  PT_MV_TAXA_AUTONOMA,
  PT_MV_QUOTA_RESIDENTE,
  PT_MV_QUOTA_NAO_RESIDENTE,
  PT_MV_COEFICIENTES_2025,
} from './mais-valias-imobiliarias.service';

describe('MaisValiasImobiliariasService', () => {
  let service: MaisValiasImobiliariasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaisValiasImobiliariasService);
    service.reset();
  });

  it('should be created', () => expect(service).toBeTruthy());

  it('default seed: residente, regime taxa autónoma 28%', () => {
    expect(service.residencia()).toBe('residente');
    expect(service.regime()).toBe('taxaAutonoma28');
    expect(service.quotaTributavel()).toBe(PT_MV_QUOTA_RESIDENTE);
  });

  it('residente tributa 50% da mais-valia (CIRS art. 43.º)', () => {
    expect(service.quotaTributavel()).toBe(0.5);
  });

  it('não-residente tributa 100% da mais-valia', () => {
    service.setResidencia('naoResidente');
    expect(service.quotaTributavel()).toBe(PT_MV_QUOTA_NAO_RESIDENTE);
    expect(service.quotaTributavel()).toBe(1.0);
  });

  it('coeficiente 2010 = 1.30 → valor aquisição corrigido = €150k × 1.30 = €195k', () => {
    expect(service.coeficiente()).toBe(1.30);
    expect(service.valorAquisicaoCorrigido()).toBe(195_000);
  });

  it('coeficiente desconhecido fallback para 1.0', () => {
    service.setAnoAquisicao(2026);
    expect(service.coeficiente()).toBe(1);
  });

  it('mais-valia bruta = realização − aquisição corrigida − encargos − valorização', () => {
    // 280k − 195k (150k × 1.30) − 8k − 15k = 62k
    expect(service.maisValiaBruta()).toBe(62_000);
  });

  it('residente: tributável = 50% × bruta', () => {
    // 62k × 0.5 = 31k
    expect(service.maisValiaTributavel()).toBe(31_000);
  });

  it('colecta taxa autónoma = 28% × tributável', () => {
    // 31k × 0.28 = 8680
    expect(service.colectaTaxaAutonoma()).toBe(31_000 * PT_MV_TAXA_AUTONOMA);
  });

  it('mais-valia negativa (perda) → tributável = 0, colecta = 0', () => {
    service.setValorRealizacao(100_000);
    service.setValorAquisicao(200_000);
    service.setEncargos(0);
    service.setValorizacao(0);
    expect(service.maisValiaBruta()).toBeLessThan(0);
    expect(service.maisValiaTributavel()).toBe(0);
    expect(service.colectaTaxaAutonoma()).toBe(0);
  });

  it('não-residente força regime taxa autónoma e ignora englobamento', () => {
    service.setResidencia('naoResidente');
    expect(service.regime()).toBe('taxaAutonoma28');
    // colecta englobamento devolve a mesma da taxa autónoma
    expect(service.colectaEnglobamento()).toBe(service.colectaTaxaAutonoma());
    // setRegime no-op
    service.setRegime('englobamento');
    expect(service.regime()).toBe('taxaAutonoma28');
  });

  it('ano aquisição é clampado a 1989..2026', () => {
    service.setAnoAquisicao(1980);
    expect(service.anoAquisicao()).toBe(1989);
    service.setAnoAquisicao(2050);
    expect(service.anoAquisicao()).toBe(2026);
  });

  it('liquidoAposImposto = realização − colectaActual', () => {
    expect(service.liquidoAposImposto()).toBe(280_000 - service.colectaActual());
  });

  it('comparacao expõe os dois regimes para residentes', () => {
    const c = service.comparacao();
    expect(c.taxaAutonoma.colecta).toBe(service.colectaTaxaAutonoma());
    expect(c.englobamento.colecta).toBe(service.colectaEnglobamento());
  });

  it('coeficientes 2025 cobrem 1989-2026', () => {
    expect(PT_MV_COEFICIENTES_2025[1989]).toBeGreaterThan(PT_MV_COEFICIENTES_2025[2024]);
    expect(PT_MV_COEFICIENTES_2025[2024]).toBe(1.0);
  });

  it('reset restaura seed default', () => {
    service.setValorRealizacao(999_999);
    service.setResidencia('naoResidente');
    service.reset();
    expect(service.valorRealizacao()).toBe(280_000);
    expect(service.residencia()).toBe('residente');
    expect(service.regime()).toBe('taxaAutonoma28');
  });
});
