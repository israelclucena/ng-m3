import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RentPaymentPortalComponent } from './rent-payment-portal.component';
import { RentPaymentPortalService } from '../../services/rent-payment-portal.service';

describe('RentPaymentPortalComponent', () => {
  let fixture: ComponentFixture<RentPaymentPortalComponent>;
  let component: RentPaymentPortalComponent;
  let svc: RentPaymentPortalService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RentPaymentPortalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RentPaymentPortalComponent);
    component = fixture.componentInstance;
    svc = TestBed.inject(RentPaymentPortalService);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('defaults to tenant mode', () => {
    expect(component.mode).toBe('tenant');
  });

  // ── overdue detection (seed has exactly one overdue: rp-005) ──────────────────────

  it('detects overdue payments from the seed data', () => {
    expect((component as any).hasOverdue()).toBe(true);
    expect((component as any).overdueCount()).toBe(1);
  });

  it('reports no overdue once the overdue entry is settled', () => {
    svc.makePayment('rp-005', 850); // fully pay the only overdue record
    expect((component as any).hasOverdue()).toBe(false);
    expect((component as any).overdueCount()).toBe(0);
  });

  // ── rowClass ─────────────────────────────────────────────────────────────────────

  it('builds a status-specific row class', () => {
    expect((component as any).rowClass('paid')).toBe('rpp-table-row rpp-row--paid');
    expect((component as any).rowClass('overdue')).toBe('rpp-table-row rpp-row--overdue');
  });

  // ── onPay / onReceipt ────────────────────────────────────────────────────────────

  it('delegates a payment to the service with the full amount', () => {
    const spy = jest.spyOn(svc, 'makePayment');
    const payment = svc.payments().find((p) => p.id === 'rp-004')!;
    (component as any).onPay(payment);
    expect(spy).toHaveBeenCalledWith('rp-004', payment.amount);
  });

  it('opens a receipt without throwing', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const payment = svc.payments().find((p) => p.id === 'rp-001')!;
    expect(() => (component as any).onReceipt(payment)).not.toThrow();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  // ── ngOnInit loading (async via setTimeout → fake timers) ─────────────────────────

  describe('ngOnInit loading', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('loads tenant payments when mode=tenant and tenantId is set', () => {
      const spy = jest.spyOn(svc, 'loadForTenant');
      component.mode = 'tenant';
      component.tenantId = 'tenant-002';
      component.ngOnInit();
      jest.advanceTimersByTime(300);
      expect(spy).toHaveBeenCalledWith('tenant-002');
      expect(svc.payments().every((p) => p.tenantId === 'tenant-002')).toBe(true);
    });

    it('loads landlord payments when mode=landlord and landlordId is set', () => {
      const spy = jest.spyOn(svc, 'loadForLandlord');
      component.mode = 'landlord';
      component.landlordId = 'landlord-001';
      component.ngOnInit();
      jest.advanceTimersByTime(300);
      expect(spy).toHaveBeenCalledWith('landlord-001');
      expect(svc.payments().every((p) => p.landlordId === 'landlord-001')).toBe(true);
    });

    it('does not load anything when no id is provided', () => {
      const tenant = jest.spyOn(svc, 'loadForTenant');
      const landlord = jest.spyOn(svc, 'loadForLandlord');
      component.mode = 'tenant';
      component.ngOnInit();
      expect(tenant).not.toHaveBeenCalled();
      expect(landlord).not.toHaveBeenCalled();
    });
  });
});
