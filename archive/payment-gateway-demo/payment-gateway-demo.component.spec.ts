import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaymentGatewayDemoComponent } from './payment-gateway-demo.component';
import { PaymentComponent } from './payment.component';

/**
 * Post-collapse (NG-05) the demo is a thin `@deprecated` wrapper: it renders the
 * unified `<iu-payment>` and drives it through its own gateway seam. These specs
 * assert the wrapper wiring — the lifecycle itself is covered exhaustively by
 * `payment.component.spec.ts`.
 */
describe('PaymentGatewayDemoComponent', () => {
  let fixture: ComponentFixture<PaymentGatewayDemoComponent>;
  let component: PaymentGatewayDemoComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentGatewayDemoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentGatewayDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the demo title', () => {
    const title = fixture.nativeElement.querySelector('.payment-demo__title') as HTMLElement;
    expect(title).toBeTruthy();
    expect(title.textContent?.trim()).toBe('Payment Gateway Demo');
  });

  it('renders the unified <iu-payment> surface', () => {
    expect(fixture.nativeElement.querySelector('iu-payment')).toBeTruthy();
    expect(component.pay()).toBeInstanceOf(PaymentComponent);
  });

  it('starts in the idle state', () => {
    const status = fixture.nativeElement.querySelector('.payment-demo__status strong') as HTMLElement;
    expect(status.textContent?.trim()).toBe('idle');
    expect(component.pay().state()).toBe('idle');
  });

  it('renders three action buttons', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.payment-demo__actions button');
    expect(buttons.length).toBe(3);
    expect((buttons[0] as HTMLElement).textContent?.trim()).toBe('Test Success Payment');
    expect((buttons[1] as HTMLElement).textContent?.trim()).toBe('Test Declined Card');
    expect((buttons[2] as HTMLElement).textContent?.trim()).toBe('Reset');
  });

  it('testSuccess() drives the surface to the success state', async () => {
    await component.testSuccess();
    fixture.detectChanges();
    expect(component.pay().state()).toBe('success');
    const status = fixture.nativeElement.querySelector('.payment-demo__status strong') as HTMLElement;
    expect(status.textContent?.trim()).toBe('success');
  });

  it('testDecline() drives the surface to the error state with a declined code', async () => {
    await component.testDecline();
    fixture.detectChanges();
    expect(component.pay().state()).toBe('error');
    expect(component.pay().error()?.code).toBe('gateway_declined');
  });

  it('Reset returns the surface to idle after a run', async () => {
    await component.testSuccess();
    fixture.detectChanges();
    expect(component.pay().state()).toBe('success');

    const reset = fixture.nativeElement.querySelectorAll('.payment-demo__actions button')[2] as HTMLButtonElement;
    reset.click();
    fixture.detectChanges();
    expect(component.pay().state()).toBe('idle');
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
});
