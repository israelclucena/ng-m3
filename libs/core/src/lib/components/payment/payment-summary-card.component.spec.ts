import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaymentSummaryCardComponent } from './payment-summary-card.component';
import type {
  BookingPaymentSummary,
  PaymentSubmitEvent,
} from './payment.types';

describe('PaymentSummaryCardComponent', () => {
  let fixture: ComponentFixture<PaymentSummaryCardComponent>;
  let component: PaymentSummaryCardComponent;

  const makeSummary = (
    overrides: Partial<BookingPaymentSummary> = {},
  ): BookingPaymentSummary => ({
    propertyTitle: 'Apartamento T2 na Graça',
    propertyAddress: 'Rua da Voz do Operário 12, Lisboa',
    propertyImage: 'https://example.com/apt.jpg',
    checkIn: '2026-07-01',
    checkOut: '2026-12-31',
    months: 6,
    lineItems: [
      { label: 'Renda mensal', amount: 1200, type: 'charge' },
      { label: 'Desconto de fidelização', amount: 100, type: 'discount' },
      { label: 'Taxa de serviço', amount: 80, type: 'fee' },
    ],
    total: 1180,
    currency: 'EUR',
    depositAmount: 1200,
    ...overrides,
  });

  async function setup(
    summary: BookingPaymentSummary = makeSummary(),
  ): Promise<void> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [PaymentSummaryCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentSummaryCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('summary', summary);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await setup();
  });

  // ── Create ──────────────────────────────────────────────────────────────
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Property summary ────────────────────────────────────────────────────
  it('renders the property title and address', () => {
    const title = fixture.nativeElement.querySelector(
      '.iu-payment-card__property-title',
    ) as HTMLElement;
    const address = fixture.nativeElement.querySelector(
      '.iu-payment-card__property-address',
    ) as HTMLElement;
    expect(title.textContent).toContain('Apartamento T2 na Graça');
    expect(address.textContent).toContain('Rua da Voz do Operário 12, Lisboa');
  });

  it('renders the property image when propertyImage is set', () => {
    const img = fixture.nativeElement.querySelector(
      'img.iu-payment-card__property-img',
    ) as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/apt.jpg');
    expect(
      fixture.nativeElement.querySelector(
        '.iu-payment-card__property-img--placeholder',
      ),
    ).toBeFalsy();
  });

  it('renders a placeholder when no propertyImage is provided', async () => {
    await setup(makeSummary({ propertyImage: undefined }));
    expect(
      fixture.nativeElement.querySelector('img.iu-payment-card__property-img'),
    ).toBeFalsy();
    expect(
      fixture.nativeElement.querySelector(
        '.iu-payment-card__property-img--placeholder',
      ),
    ).toBeTruthy();
  });

  // ── Line items ──────────────────────────────────────────────────────────
  it('renders one line per lineItem in the summary', () => {
    const lines = fixture.nativeElement.querySelectorAll(
      '.iu-payment-card__line',
    );
    expect(lines.length).toBe(3);
  });

  it('renders line item labels', () => {
    const lines = fixture.nativeElement.querySelectorAll(
      '.iu-payment-card__line',
    );
    expect((lines[0] as HTMLElement).textContent).toContain('Renda mensal');
    expect((lines[1] as HTMLElement).textContent).toContain(
      'Desconto de fidelização',
    );
    expect((lines[2] as HTMLElement).textContent).toContain('Taxa de serviço');
  });

  it('applies a type modifier class to each line', () => {
    const lines = fixture.nativeElement.querySelectorAll(
      '.iu-payment-card__line',
    );
    expect(
      (lines[0] as HTMLElement).classList.contains(
        'iu-payment-card__line--charge',
      ),
    ).toBe(true);
    expect(
      (lines[1] as HTMLElement).classList.contains(
        'iu-payment-card__line--discount',
      ),
    ).toBe(true);
  });

  it('renders the total amount', () => {
    const total = fixture.nativeElement.querySelector(
      '.iu-payment-card__total',
    ) as HTMLElement;
    expect(total.textContent).toContain('Total');
    const totalAmount = fixture.nativeElement.querySelector(
      '.iu-payment-card__total-amount',
    ) as HTMLElement;
    expect(totalAmount.textContent).toContain('1,180');
  });

  it('renders the refundable deposit note', () => {
    const note = fixture.nativeElement.querySelector(
      '.iu-payment-card__deposit-note',
    ) as HTMLElement;
    expect(note.textContent).toContain('Depósito de garantia');
    expect(note.textContent).toContain('reembolsável');
    expect(note.textContent).toContain('1,200');
  });

  // ── Payment methods ─────────────────────────────────────────────────────
  it('renders four payment method buttons', () => {
    const btns = fixture.nativeElement.querySelectorAll(
      '.iu-payment-card__method-btn',
    );
    expect(btns.length).toBe(4);
  });

  it('defaults to the card method being active', () => {
    expect(component.selectedMethod()).toBe('card');
    const btns = fixture.nativeElement.querySelectorAll(
      '.iu-payment-card__method-btn',
    );
    expect(
      (btns[0] as HTMLElement).classList.contains(
        'iu-payment-card__method-btn--active',
      ),
    ).toBe(true);
    expect((btns[0] as HTMLElement).getAttribute('aria-pressed')).toBe('true');
  });

  it('selectMethod sets the active class and aria-pressed on the chosen button', () => {
    const btns = fixture.nativeElement.querySelectorAll(
      '.iu-payment-card__method-btn',
    );
    // index 1 is mbway
    (btns[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.selectedMethod()).toBe('mbway');
    expect(
      (btns[1] as HTMLElement).classList.contains(
        'iu-payment-card__method-btn--active',
      ),
    ).toBe(true);
    expect((btns[1] as HTMLElement).getAttribute('aria-pressed')).toBe('true');
    expect(
      (btns[0] as HTMLElement).classList.contains(
        'iu-payment-card__method-btn--active',
      ),
    ).toBe(false);
    expect((btns[0] as HTMLElement).getAttribute('aria-pressed')).toBe('false');
  });

  // ── Conditional method fields ───────────────────────────────────────────
  it('shows card fields only when method is card', () => {
    expect(
      fixture.nativeElement.querySelector('.iu-payment-card__card-fields'),
    ).toBeTruthy();
    component.selectMethod('mbway');
    fixture.detectChanges();
    // mbway also uses __card-fields wrapper but card-specific cc-name input gone
    expect(
      fixture.nativeElement.querySelector('input[autocomplete="cc-name"]'),
    ).toBeFalsy();
  });

  it('shows the mbway phone field only when method is mbway', () => {
    expect(
      fixture.nativeElement.querySelector('input[autocomplete="tel"]'),
    ).toBeFalsy();
    component.selectMethod('mbway');
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('input[autocomplete="tel"]'),
    ).toBeTruthy();
  });

  it('shows bank info only when method is bank_transfer', () => {
    expect(
      fixture.nativeElement.querySelector('.iu-payment-card__bank-info'),
    ).toBeFalsy();
    component.selectMethod('bank_transfer');
    fixture.detectChanges();
    const bank = fixture.nativeElement.querySelector(
      '.iu-payment-card__bank-info',
    ) as HTMLElement;
    expect(bank).toBeTruthy();
    expect(bank.textContent).toContain('IBAN');
  });

  it('shows no method-specific fields for paypal', () => {
    component.selectMethod('paypal');
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.iu-payment-card__card-fields'),
    ).toBeFalsy();
    expect(
      fixture.nativeElement.querySelector('.iu-payment-card__bank-info'),
    ).toBeFalsy();
  });

  // ── canSubmit logic ─────────────────────────────────────────────────────
  it('canSubmit is false without accepting terms', () => {
    component.cardHolder.set('Maria João');
    component.cardNumber.set('4111111111111111');
    fixture.detectChanges();
    expect(component.canSubmit()).toBe(false);
  });

  it('canSubmit (card) needs holder, number and terms', () => {
    component.termsAccepted.set(true);
    fixture.detectChanges();
    expect(component.canSubmit()).toBe(false);

    component.cardHolder.set('Maria João');
    fixture.detectChanges();
    expect(component.canSubmit()).toBe(false);

    component.cardNumber.set('4111111111111111');
    fixture.detectChanges();
    expect(component.canSubmit()).toBe(true);
  });

  it('canSubmit (mbway) needs phone and terms', () => {
    component.selectMethod('mbway');
    component.termsAccepted.set(true);
    fixture.detectChanges();
    expect(component.canSubmit()).toBe(false);

    component.mbwayPhone.set('+351912345678');
    fixture.detectChanges();
    expect(component.canSubmit()).toBe(true);
  });

  it('canSubmit (bank_transfer) needs only terms', () => {
    component.selectMethod('bank_transfer');
    fixture.detectChanges();
    expect(component.canSubmit()).toBe(false);

    component.termsAccepted.set(true);
    fixture.detectChanges();
    expect(component.canSubmit()).toBe(true);
  });

  it('canSubmit (paypal) needs only terms', () => {
    component.selectMethod('paypal');
    fixture.detectChanges();
    expect(component.canSubmit()).toBe(false);

    component.termsAccepted.set(true);
    fixture.detectChanges();
    expect(component.canSubmit()).toBe(true);
  });

  it('treats whitespace-only card fields as empty', () => {
    component.termsAccepted.set(true);
    component.cardHolder.set('   ');
    component.cardNumber.set('   ');
    fixture.detectChanges();
    expect(component.canSubmit()).toBe(false);
  });

  // ── Submit button disabled state ────────────────────────────────────────
  it('submit button disabled mirrors canSubmit()', () => {
    const btn = fixture.nativeElement.querySelector(
      '.iu-payment-card__submit',
    ) as HTMLButtonElement;
    expect(component.canSubmit()).toBe(false);
    expect(btn.disabled).toBe(true);

    component.termsAccepted.set(true);
    component.cardHolder.set('Maria João');
    component.cardNumber.set('4111111111111111');
    fixture.detectChanges();
    expect(component.canSubmit()).toBe(true);
    expect(btn.disabled).toBe(false);
  });

  // ── onSubmit emissions ──────────────────────────────────────────────────
  it('onSubmit emits paymentSubmit with the correct form payload', () => {
    let emitted: PaymentSubmitEvent | undefined;
    component.paymentSubmit.subscribe((e) => (emitted = e));

    component.termsAccepted.set(true);
    component.cardHolder.set('Maria João');
    component.cardNumber.set('4111111111111111');
    component.cardExpiry.set('12/28');
    fixture.detectChanges();

    component.onSubmit();

    expect(emitted).toBeTruthy();
    expect(emitted!.form.method).toBe('card');
    expect(emitted!.form.cardHolder).toBe('Maria João');
    expect(emitted!.form.cardNumber).toBe('4111111111111111');
    expect(emitted!.form.cardExpiry).toBe('12/28');
    expect(emitted!.form.termsAccepted).toBe(true);
    expect(emitted!.summary.propertyTitle).toBe('Apartamento T2 na Graça');
    expect(typeof emitted!.timestamp).toBe('string');
  });

  it('onSubmit emits the selected method (mbway) in the payload', () => {
    const spy = jest.fn();
    component.paymentSubmit.subscribe(spy);

    component.selectMethod('mbway');
    component.termsAccepted.set(true);
    component.mbwayPhone.set('+351912345678');
    fixture.detectChanges();

    component.onSubmit();

    expect(spy).toHaveBeenCalledTimes(1);
    const payload = spy.mock.calls[0][0] as PaymentSubmitEvent;
    expect(payload.form.method).toBe('mbway');
    expect(payload.form.mbwayPhone).toBe('+351912345678');
  });

  it('onSubmit does nothing when canSubmit is false', () => {
    const spy = jest.fn();
    component.paymentSubmit.subscribe(spy);
    expect(component.canSubmit()).toBe(false);
    component.onSubmit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('clicking the submit button emits when the form is valid', () => {
    const spy = jest.fn();
    component.paymentSubmit.subscribe(spy);

    component.termsAccepted.set(true);
    component.cardHolder.set('Maria João');
    component.cardNumber.set('4111111111111111');
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector(
      '.iu-payment-card__submit',
    ) as HTMLButtonElement;
    btn.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
