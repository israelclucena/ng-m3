import { TestBed } from '@angular/core/testing';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;
  beforeEach(() => { TestBed.configureTestingModule({}); service = TestBed.inject(PaymentService); });

  it('should be created', () => expect(service).toBeTruthy());
  it('status starts idle', () => expect(service.status()).toBe('idle'));
  it('isProcessing false when idle', () => expect(service.isProcessing()).toBeFalsy());
  it('createPaymentIntent returns valid intent', () => {
    const intent = service.createPaymentIntent(15000, 'EUR', { bookingRef: 'LR-ABC' });
    expect(intent.id).toMatch(/^pi_mock_/);
    expect(intent.amount).toBe(15000);
    expect(intent.currency).toBe('EUR');
  });
  it('validatePaymentForm returns errors when terms not accepted', () => {
    const errors = service.validatePaymentForm({ method: 'bank_transfer', termsAccepted: false });
    expect(errors.length).toBeGreaterThan(0);
  });
  it('getMethodLabel returns correct label', () => {
    expect(service.getMethodLabel('mbway')).toBe('MB WAY');
    expect(service.getMethodLabel('card')).toBe('Cartão de Débito/Crédito');
  });
  it('reset sets status to idle', () => {
    service.status.set('success');
    service.reset();
    expect(service.status()).toBe('idle');
  });
});
