import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { PaymentGatewayDemoComponent } from './payment-gateway-demo.component';
import { PaymentService, PaymentResult, PaymentStatus } from '../../services/payment.service';

describe('PaymentGatewayDemoComponent', () => {
  let fixture: ComponentFixture<PaymentGatewayDemoComponent>;
  let component: PaymentGatewayDemoComponent;
  let mockPayment: {
    status: ReturnType<typeof signal<PaymentStatus>>;
    lastResult: ReturnType<typeof signal<PaymentResult | null>>;
    isProcessing: ReturnType<typeof signal<boolean>>;
    isSuccess: ReturnType<typeof signal<boolean>>;
    isFailed: ReturnType<typeof signal<boolean>>;
    reset: jest.Mock;
    processPayment: jest.Mock;
  };

  beforeEach(async () => {
    mockPayment = {
      status: signal<PaymentStatus>('idle'),
      lastResult: signal<PaymentResult | null>(null),
      isProcessing: signal(false),
      isSuccess: signal(false),
      isFailed: signal(false),
      reset: jest.fn(),
      processPayment: jest.fn().mockResolvedValue({ success: true, paymentIntentId: 'pi_xyz' }),
    };

    await TestBed.configureTestingModule({
      imports: [PaymentGatewayDemoComponent],
      providers: [{ provide: PaymentService, useValue: mockPayment }],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentGatewayDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes the injected PaymentService as payment', () => {
    expect(component.payment).toBe(mockPayment as unknown as PaymentService);
  });

  it('renders the demo title', () => {
    const title = fixture.nativeElement.querySelector('.payment-demo__title') as HTMLElement;
    expect(title).toBeTruthy();
    expect(title.textContent?.trim()).toBe('Payment Gateway Demo');
  });

  it('renders the current status from the service', () => {
    const status = fixture.nativeElement.querySelector('.payment-demo__status strong') as HTMLElement;
    expect(status.textContent?.trim()).toBe('idle');
    mockPayment.status.set('processing');
    fixture.detectChanges();
    expect(status.textContent?.trim()).toBe('processing');
  });

  it('does not render the result block when lastResult is null', () => {
    expect(fixture.nativeElement.querySelector('.payment-demo__result')).toBeNull();
  });

  it('renders the success result block with paymentIntentId', () => {
    mockPayment.lastResult.set({ success: true, paymentIntentId: 'pi_abc123' });
    mockPayment.isSuccess.set(true);
    fixture.detectChanges();
    const result = fixture.nativeElement.querySelector('.payment-demo__result') as HTMLElement;
    expect(result).toBeTruthy();
    expect(result.classList.contains('success')).toBe(true);
    expect(result.classList.contains('failed')).toBe(false);
    expect(result.textContent).toContain('pi_abc123');
  });

  it('renders the failure result block with error message', () => {
    mockPayment.lastResult.set({ success: false, error: 'Card declined' });
    mockPayment.isFailed.set(true);
    fixture.detectChanges();
    const result = fixture.nativeElement.querySelector('.payment-demo__result') as HTMLElement;
    expect(result).toBeTruthy();
    expect(result.classList.contains('failed')).toBe(true);
    expect(result.classList.contains('success')).toBe(false);
    expect(result.textContent).toContain('Card declined');
  });

  it('renders three action buttons', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.payment-demo__actions button');
    expect(buttons.length).toBe(3);
    expect((buttons[0] as HTMLElement).textContent?.trim()).toBe('Test Success Payment');
    expect((buttons[1] as HTMLElement).textContent?.trim()).toBe('Test Declined Card');
    expect((buttons[2] as HTMLElement).textContent?.trim()).toBe('Reset');
  });

  it('disables all action buttons while payment is processing', () => {
    mockPayment.isProcessing.set(true);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.payment-demo__actions button');
    buttons.forEach((btn: HTMLButtonElement) => expect(btn.disabled).toBe(true));
  });

  it('enables all action buttons when not processing', () => {
    mockPayment.isProcessing.set(false);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.payment-demo__actions button');
    buttons.forEach((btn: HTMLButtonElement) => expect(btn.disabled).toBe(false));
  });

  it('testSuccess() resets the service and calls processPayment with a 4242 card', async () => {
    await component.testSuccess();
    expect(mockPayment.reset).toHaveBeenCalledTimes(1);
    expect(mockPayment.processPayment).toHaveBeenCalledTimes(1);
    const opts = mockPayment.processPayment.mock.calls[0][0];
    expect(opts.amount).toBe(150000);
    expect(opts.currency).toBe('EUR');
    expect(opts.bookingRef).toBe('LR-TEST01');
    expect(opts.formData.cardNumber).toBe('4242424242424242');
    expect(opts.formData.termsAccepted).toBe(true);
    expect(opts.landlordPhone).toBe('+351 912 345 678');
  });

  it('testDecline() resets the service and calls processPayment with a 4000 card', async () => {
    await component.testDecline();
    expect(mockPayment.reset).toHaveBeenCalledTimes(1);
    expect(mockPayment.processPayment).toHaveBeenCalledTimes(1);
    const opts = mockPayment.processPayment.mock.calls[0][0];
    expect(opts.bookingRef).toBe('LR-TEST02');
    expect(opts.formData.cardNumber).toBe('4000000000000002');
    expect(opts.formData.cardHolder).toBe('Test Decline');
    // testDecline does NOT set landlordPhone
    expect(opts.landlordPhone).toBeUndefined();
  });

  it('clicking the success button invokes testSuccess()', () => {
    const spy = jest.spyOn(component, 'testSuccess').mockResolvedValue();
    const btn = fixture.nativeElement.querySelectorAll('.payment-demo__actions button')[0] as HTMLButtonElement;
    btn.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('clicking the decline button invokes testDecline()', () => {
    const spy = jest.spyOn(component, 'testDecline').mockResolvedValue();
    const btn = fixture.nativeElement.querySelectorAll('.payment-demo__actions button')[1] as HTMLButtonElement;
    btn.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('clicking the reset button invokes payment.reset()', () => {
    const btn = fixture.nativeElement.querySelectorAll('.payment-demo__actions button')[2] as HTMLButtonElement;
    btn.click();
    expect(mockPayment.reset).toHaveBeenCalledTimes(1);
  });
});
