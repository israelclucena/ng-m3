import { TestBed } from '@angular/core/testing';
import { PropertyTransactionCostService } from './property-transaction-cost.service';
import { PT_IS_IMOVEL, PT_IMT_JOVEM_LIMITE } from './imt.service';
import { PT_MV_QUOTA_RESIDENTE, PT_MV_QUOTA_NAO_RESIDENTE, PT_MV_TAXA_AUTONOMA } from './mais-valias-imobiliarias.service';

describe('PropertyTransactionCostService', () => {
  let service: PropertyTransactionCostService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PropertyTransactionCostService);
    service.reset();
  });

  it('seeds with €280k HPP residente sale and €150k @2010 acquisition', () => {
    expect(service).toBeTruthy();
    expect(service.precoVenda()).toBe(280_000);
    expect(service.buyerFinalidade()).toBe('hpp');
    expect(service.sellerResidencia()).toBe('residente');
  });

  it('IS is always 0.8% of preço venda', () => {
    expect(service.buyerIS()).toBeCloseTo(280_000 * PT_IS_IMOVEL, 2);
    service.setPrecoVenda(100_000);
    expect(service.buyerIS()).toBeCloseTo(100_000 * PT_IS_IMOVEL, 2);
  });

  it('IMT for €280k HPP applies first 4 brackets correctly', () => {
    expect(service.buyerIMT()).toBeGreaterThan(0);
    const breakdown = service.buyerBracketLines();
    const sum = breakdown.reduce((s, l) => s + l.colecta, 0);
    expect(sum).toBeCloseTo(service.buyerIMT(), 2);
    expect(breakdown[0].colecta).toBe(0);
  });

  it('jovem 1ª HPP under €316.772 → IMT isento (only IS + notário)', () => {
    service.setBuyerJovem(true);
    expect(service.buyerJovemIsento()).toBe(true);
    expect(service.buyerBracketLines().length).toBe(0);
    expect(service.buyerIMT()).toBe(0);
    expect(service.buyerCustoTotal()).toBeCloseTo(
      280_000 + service.buyerIS() + service.custoNotarioRegisto(),
      2,
    );
  });

  it('jovem flag is rejected when finalidade != HPP', () => {
    service.setBuyerFinalidade('outros');
    service.setBuyerJovem(true);
    expect(service.buyerJovem()).toBe(false);
    expect(service.buyerJovemIsento()).toBe(false);
  });

  it('jovem isenção disqualifies above €316.772 (PT_IMT_JOVEM_LIMITE)', () => {
    service.setBuyerJovem(true);
    service.setPrecoVenda(PT_IMT_JOVEM_LIMITE + 1);
    expect(service.buyerJovemIsento()).toBe(false);
    expect(service.buyerIMT()).toBeGreaterThan(0);
  });

  it('switching to "outros" finalidade clears jovem flag automatically', () => {
    service.setBuyerJovem(true);
    expect(service.buyerJovem()).toBe(true);
    service.setBuyerFinalidade('outros');
    expect(service.buyerJovem()).toBe(false);
  });

  it('não-residente buyer cannot use jovem isenção', () => {
    service.setBuyerResidencia('naoResidente');
    service.setBuyerJovem(true);
    expect(service.buyerJovem()).toBe(false);
  });

  it('outros-fins tabela has no exempt tranche → 1% on the first slice', () => {
    service.setBuyerFinalidade('outros');
    expect(service.buyerBracketLines()[0].taxa).toBe(0.01);
    expect(service.buyerBracketLines()[0].colecta).toBeGreaterThan(0);
  });

  it('seller mais-valia uses coeficiente correction on acquisition price', () => {
    service.setSellerAnoAquisicao(2010);
    expect(service.sellerCoeficiente()).toBe(1.30);
    expect(service.sellerValorAquisicaoCorrigido()).toBeCloseTo(150_000 * 1.30, 2);
  });

  it('residente seller is taxed on 50% of mais-valia', () => {
    expect(service.sellerQuotaTributavel()).toBe(PT_MV_QUOTA_RESIDENTE);
    expect(service.sellerMaisValiaTributavel()).toBeCloseTo(
      Math.max(0, service.sellerMaisValiaBruta()) * 0.5,
      2,
    );
  });

  it('não-residente seller is taxed on 100% of mais-valia', () => {
    service.setSellerResidencia('naoResidente');
    expect(service.sellerQuotaTributavel()).toBe(PT_MV_QUOTA_NAO_RESIDENTE);
    expect(service.sellerMaisValiaTributavel()).toBeCloseTo(
      Math.max(0, service.sellerMaisValiaBruta()) * 1.0,
      2,
    );
  });

  it('IRS Cat. G colecta is 28% of tributável', () => {
    expect(service.sellerColectaIRS()).toBeCloseTo(
      service.sellerMaisValiaTributavel() * PT_MV_TAXA_AUTONOMA,
      2,
    );
  });

  it('mais-valia bruta clamps tributable at 0 when negative (no gain → no tax)', () => {
    service.setSellerValorAquisicaoOriginal(400_000);
    expect(service.sellerMaisValiaBruta()).toBeLessThan(0);
    expect(service.sellerMaisValiaTributavel()).toBe(0);
    expect(service.sellerColectaIRS()).toBe(0);
  });

  it('fricaoTotal = buyerCustoTotal − sellerLiquidoRecebido', () => {
    expect(service.fricaoTotal()).toBeCloseTo(
      service.buyerCustoTotal() - service.sellerLiquidoRecebido(),
      2,
    );
  });

  it('fricaoSobrePreco scales friction to the negotiated price', () => {
    const expected = service.fricaoTotal() / service.precoVenda();
    expect(service.fricaoSobrePreco()).toBeCloseTo(expected, 4);
  });

  it('breakdown() aggregates buyer + seller + delta in a single computed', () => {
    const b = service.breakdown();
    expect(b.buyer.imt).toBeCloseTo(service.buyerIMT(), 2);
    expect(b.seller.colectaIRS).toBeCloseTo(service.sellerColectaIRS(), 2);
    expect(b.delta.fricaoTotal).toBeCloseTo(service.fricaoTotal(), 2);
    expect(b.buyer.jovemIsento).toBe(false);
  });

  it('setSellerAnoAquisicao clamps year to [1989, 2026]', () => {
    service.setSellerAnoAquisicao(1900);
    expect(service.sellerAnoAquisicao()).toBe(1989);
    service.setSellerAnoAquisicao(2100);
    expect(service.sellerAnoAquisicao()).toBe(2026);
    service.setSellerAnoAquisicao(Number.NaN);
    expect(service.sellerAnoAquisicao()).toBe(2026);
  });

  it('preçoVenda=0 → all values 0 and taxas efectivas 0 (no NaN)', () => {
    service.setPrecoVenda(0);
    expect(service.buyerIMT()).toBe(0);
    expect(service.buyerIS()).toBe(0);
    expect(service.buyerTaxaEfectiva()).toBe(0);
    expect(service.sellerTaxaEfectiva()).toBe(0);
    expect(service.fricaoSobrePreco()).toBe(0);
  });

  it('reset() restores all inputs to defaults', () => {
    service.setPrecoVenda(999_999);
    service.setBuyerFinalidade('outros');
    service.setBuyerResidencia('naoResidente');
    service.setCustoNotarioRegisto(2_000);
    service.setSellerAnoAquisicao(1995);
    service.setSellerResidencia('naoResidente');
    service.reset();
    expect(service.precoVenda()).toBe(280_000);
    expect(service.buyerFinalidade()).toBe('hpp');
    expect(service.buyerResidencia()).toBe('residente');
    expect(service.custoNotarioRegisto()).toBe(500);
    expect(service.sellerAnoAquisicao()).toBe(2010);
    expect(service.sellerResidencia()).toBe('residente');
  });
});
