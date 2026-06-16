import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PropertyTransactionCostCalculatorComponent } from './property-transaction-cost-calculator.component';
import { PropertyTransactionCostService } from '../../services/property-transaction-cost.service';

describe('PropertyTransactionCostCalculatorComponent', () => {
  let fixture: ComponentFixture<PropertyTransactionCostCalculatorComponent>;
  let component: PropertyTransactionCostCalculatorComponent;
  let service: PropertyTransactionCostService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyTransactionCostCalculatorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyTransactionCostCalculatorComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(PropertyTransactionCostService);
    service.reset();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render header and both party columns', () => {
    const title = fixture.nativeElement.querySelector('.ptcc-title');
    expect(title.textContent).toContain('Property Transaction Cost');
    expect(fixture.nativeElement.querySelector('.ptcc-col--buyer')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.ptcc-col--seller')).toBeTruthy();
  });

  // ── Buyer side ─────────────────────────────────────────────────────────────

  it('should compute imposto de selo at 0,8% of the price', () => {
    // 280000 * 0.008
    expect(service.buyerIS()).toBeCloseTo(2240, 2);
  });

  it('should build the buyer total cost from price + taxes + notário', () => {
    const expected =
      service.precoVenda() + service.buyerTotalImpostos() + service.custoNotarioRegisto();
    expect(service.buyerCustoTotal()).toBeCloseTo(expected, 2);
    expect(service.buyerTotalImpostos()).toBeCloseTo(
      service.buyerIMT() + service.buyerIS(),
      2,
    );
  });

  it('should expose an effective buyer rate as friction over price', () => {
    expect(service.buyerTaxaEfectiva()).toBeGreaterThan(0);
    expect(service.buyerTaxaEfectiva()).toBeLessThan(1);
  });

  // ── Young-buyer exemption ──────────────────────────────────────────────────

  it('should zero out IMT when the young-buyer exemption applies', () => {
    expect(component.jovemAvailable()).toBe(true);
    service.setBuyerJovem(true);
    expect(service.buyerJovemIsento()).toBe(true);
    expect(service.buyerIMT()).toBe(0);
  });

  it('should refuse the exemption for non-HPP purchases', () => {
    service.setBuyerFinalidade('outros');
    expect(component.jovemAvailable()).toBe(false);
    service.setBuyerJovem(true);
    expect(service.buyerJovem()).toBe(false);
    expect(service.buyerJovemIsento()).toBe(false);
  });

  it('should drop the exemption when residence switches to non-resident', () => {
    service.setBuyerJovem(true);
    service.setBuyerResidencia('naoResidente');
    expect(service.buyerJovem()).toBe(false);
  });

  // ── Seller side ────────────────────────────────────────────────────────────

  it('should tax only half the gain for residents', () => {
    expect(service.sellerQuotaTributavel()).toBe(0.5);
    expect(service.sellerMaisValiaTributavel()).toBeCloseTo(
      Math.max(0, service.sellerMaisValiaBruta()) * 0.5,
      2,
    );
  });

  it('should tax the full gain for non-residents', () => {
    service.setSellerResidencia('naoResidente');
    expect(service.sellerQuotaTributavel()).toBe(1);
  });

  it('should leave the seller net = price minus IRS colecta', () => {
    expect(service.sellerLiquidoRecebido()).toBeCloseTo(
      service.precoVenda() - service.sellerColectaIRS(),
      2,
    );
  });

  // ── Delta ──────────────────────────────────────────────────────────────────

  it('should define friction as buyer cost minus seller net', () => {
    expect(service.fricaoTotal()).toBeCloseTo(
      service.buyerCustoTotal() - service.sellerLiquidoRecebido(),
      2,
    );
    expect(service.fricaoTotal()).toBeGreaterThan(0);
  });

  it('should expose an aggregated breakdown consistent with the computeds', () => {
    const b = service.breakdown();
    expect(b.buyer.custoTotal).toBeCloseTo(service.buyerCustoTotal(), 2);
    expect(b.seller.liquidoRecebido).toBeCloseTo(service.sellerLiquidoRecebido(), 2);
    expect(b.delta.fricaoTotal).toBeCloseTo(service.fricaoTotal(), 2);
  });

  // ── Edge cases + setters ───────────────────────────────────────────────────

  it('should collapse to zero taxes at a zero price', () => {
    service.setPrecoVenda(0);
    expect(service.buyerIS()).toBe(0);
    expect(service.buyerIMT()).toBe(0);
    expect(service.buyerTaxaEfectiva()).toBe(0);
    expect(service.sellerTaxaEfectiva()).toBe(0);
  });

  it('should sanitise a negative price to zero', () => {
    service.setPrecoVenda(-1000);
    expect(service.precoVenda()).toBe(0);
  });

  it('should clamp the acquisition year into the legal range', () => {
    service.setSellerAnoAquisicao(1500);
    expect(service.sellerAnoAquisicao()).toBe(1989);
    service.setSellerAnoAquisicao(2099);
    expect(service.sellerAnoAquisicao()).toBe(2026);
  });

  it('should restore defaults on reset', () => {
    service.setPrecoVenda(999999);
    service.setBuyerFinalidade('outros');
    service.reset();
    expect(service.precoVenda()).toBe(280000);
    expect(service.buyerFinalidade()).toBe('hpp');
    expect(service.buyerResidencia()).toBe('residente');
  });
});
