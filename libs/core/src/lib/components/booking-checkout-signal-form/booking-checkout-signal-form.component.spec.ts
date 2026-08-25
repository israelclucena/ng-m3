import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookingCheckoutSignalFormComponent } from './booking-checkout-signal-form.component';
import { BookingCheckoutComponent } from '../booking-checkout/booking-checkout.component';
import type { PropertyData } from '../property-card/property-card.component';
import type { PaymentFormData } from '../payment/payment.types';

/** Build a property fixture, overridable per test. */
function property(over: Partial<PropertyData> = {}): PropertyData {
  return {
    id: 'p1',
    title: 'T2 em Príncipe Real',
    location: 'Príncipe Real, Lisboa',
    priceMonthly: 100,
    bedrooms: 2,
    bathrooms: 1,
    areaSqm: 78,
    type: 'apartment',
    badges: [],
    ...over,
  } as PropertyData;
}

/** A 3-night range: 2026-07-01 → 2026-07-04. */
function range(): { start: Date; end: Date } {
  return { start: new Date('2026-07-01T00:00:00Z'), end: new Date('2026-07-04T00:00:00Z') };
}

/**
 * Specs for {@link BookingCheckoutSignalFormComponent} — the official-`form()`
 * twin of {@link BookingCheckoutComponent} whose only difference is the Payment
 * step's form engine.
 *
 * The suite drives the migrated surface (card/MBWay inputs) through the **real
 * DOM bindings** (`[value]`/`(input)`), never the protected field tree, and
 * closes with a **parity block** that runs the same inputs through *both*
 * components and asserts they build a byte-identical {@link PaymentFormData}.
 */
describe('BookingCheckoutSignalFormComponent', () => {
  let fixture: ComponentFixture<BookingCheckoutSignalFormComponent>;
  let component: BookingCheckoutSignalFormComponent;
  let host: HTMLElement;

  function setup(p: PropertyData = property(), r = range()): void {
    fixture.componentRef.setInput('property', p);
    fixture.componentRef.setInput('selectedRange', r);
    fixture.detectChanges();
  }

  /** Type into an input and propagate it through the explicit `(input)` binding. */
  function typeInto(selector: string, value: string): void {
    const el = host.querySelector<HTMLInputElement>(selector);
    if (!el) throw new Error(`control not found: ${selector}`);
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    TestBed.tick();
  }

  /** Advance to the payment step and (re)render its body. */
  function goToPaymentStep(): void {
    component.goToPayment();
    fixture.detectChanges();
    TestBed.tick();
  }

  /** Fill the card form via the DOM with values that pass validation. */
  function fillValidCardViaDom(): void {
    typeInto('#cardHolder', 'Israel Lucena');
    typeInto('#cardNumber', '0000000000000000'); // formatted → 19 chars, passes pattern
    typeInto('#cardExpiry', '1227');             // formatted → '12/27'
    typeInto('#cardCvv', '123');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingCheckoutSignalFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingCheckoutSignalFormComponent);
    component = fixture.componentInstance;
    host = fixture.nativeElement as HTMLElement;
  });

  // ── defaults ───────────────────────────────────────────────────────────────

  it('creates', () => {
    setup();
    expect(component).toBeTruthy();
  });

  it('renders the form() badge in the header', () => {
    setup();
    expect(host.querySelector('.iu-checkout__badge')?.textContent?.trim()).toBe('form()');
  });

  it('starts on the review step with card selected and no confirmation', () => {
    setup();
    expect(component.step()).toBe('review');
    expect(component.selectedMethod()).toBe('card');
    expect(component.confirmation()).toBeNull();
  });

  it('derives the step title from the active step', () => {
    setup();
    expect(component.stepTitle()).toBe('Revisão da Reserva');
    component.goToPayment();
    expect(component.stepTitle()).toBe('Pagamento Seguro');
  });

  // ── pricing ──────────────────────────────────────────────────────────────────

  it('computes nights from the selected range', () => {
    setup();
    expect(component.nights()).toBe(3);
  });

  it('builds the price breakdown: base, cleaning and deposit', () => {
    setup(property({ priceMonthly: 100 }), range());
    const items = component.lineItems();
    expect(items.find((i) => i.type === 'charge')!.amount).toBe(300);
    expect(items.find((i) => i.type === 'fee')!.amount).toBe(24);
    expect(component.depositAmount()).toBe(200);
  });

  it('sums all line items into the total', () => {
    setup(property({ priceMonthly: 100 }), range());
    expect(component.totalAmount()).toBe(300 + 24 + 200);
  });

  // ── step helpers ─────────────────────────────────────────────────────────────

  it('marks earlier steps done relative to the current one', () => {
    setup();
    component.goToPayment();
    expect(component.isStepDone('review')).toBe(true);
    expect(component.isStepDone('payment')).toBe(false);
  });

  // ── navigation ───────────────────────────────────────────────────────────────

  it('navigates between review and payment', () => {
    setup();
    component.goToPayment();
    expect(component.step()).toBe('payment');
    component.onBack();
    expect(component.step()).toBe('review');
  });

  it('onCancel emits the cancelled output', () => {
    setup();
    let cancelled = 0;
    component.cancelled.subscribe(() => cancelled++);
    component.onCancel();
    expect(cancelled).toBe(1);
  });

  // ── submit guards ────────────────────────────────────────────────────────────

  it('blocks submit and flags the terms error when terms are not accepted', () => {
    setup();
    goToPaymentStep();
    component.onSubmitPayment();
    expect(component.showTermsError()).toBe(true);
    expect(component.isSubmitting()).toBe(false);
    expect(component.step()).toBe('payment');
  });

  it('does not submit an invalid card form even with terms accepted', () => {
    setup();
    goToPaymentStep();
    component.termsAccepted.set(true);
    component.selectMethod('card');
    component.onSubmitPayment(); // card fields blank → invalid
    expect(component.isSubmitting()).toBe(false);
    expect(component.step()).toBe('payment');
  });

  it('surfaces the card required errors in the DOM on an empty submit', () => {
    setup();
    goToPaymentStep();
    component.termsAccepted.set(true);
    component.onSubmitPayment();
    fixture.detectChanges();
    const errors = Array.from(host.querySelectorAll('.iu-checkout__error')).map(
      (e) => e.textContent?.trim() ?? '',
    );
    expect(errors).toContain('Nome obrigatório');
    expect(errors).toContain('Número obrigatório');
  });

  // ── submit success (async) ─────────────────────────────────────────────────────

  it('finalises a valid card payment (DOM-filled) as confirmed after the async delay', () => {
    jest.useFakeTimers();
    try {
      setup();
      goToPaymentStep();
      component.termsAccepted.set(true);
      component.selectMethod('card');
      fixture.detectChanges();
      fillValidCardViaDom();

      component.onSubmitPayment();
      expect(component.isSubmitting()).toBe(true);

      jest.advanceTimersByTime(1000);

      expect(component.isSubmitting()).toBe(false);
      expect(component.step()).toBe('confirmation');
      expect(component.confirmation()!.status).toBe('confirmed');
      expect(component.confirmation()!.bookingRef).toMatch(/^LR-/);
      const pd = component.lastPaymentData()!;
      expect(pd.method).toBe('card');
      expect(pd.cardHolder).toBe('Israel Lucena');
      expect(pd.cardNumber).toBe('0000 0000 0000 0000');
      expect(pd.cardExpiry).toBe('12/27');
      expect(pd.mbwayPhone).toBeUndefined();
    } finally {
      jest.useRealTimers();
    }
  });

  it('finalises a valid MBWay payment (DOM-filled) as confirmed', () => {
    jest.useFakeTimers();
    try {
      setup();
      goToPaymentStep();
      component.termsAccepted.set(true);
      component.selectMethod('mbway');
      fixture.detectChanges();
      typeInto('#mbwayPhone', '912345678');

      component.onSubmitPayment();
      jest.advanceTimersByTime(1000);

      expect(component.step()).toBe('confirmation');
      expect(component.confirmation()!.status).toBe('confirmed');
      const pd = component.lastPaymentData()!;
      expect(pd.method).toBe('mbway');
      expect(pd.mbwayPhone).toBe('912345678');
      expect(pd.cardHolder).toBeUndefined();
    } finally {
      jest.useRealTimers();
    }
  });

  it('marks a bank transfer payment as pending', () => {
    jest.useFakeTimers();
    try {
      setup();
      goToPaymentStep();
      component.termsAccepted.set(true);
      component.selectMethod('bank_transfer');

      component.onSubmitPayment();
      jest.advanceTimersByTime(1000);

      expect(component.step()).toBe('confirmation');
      expect(component.confirmation()!.status).toBe('pending');
    } finally {
      jest.useRealTimers();
    }
  });

  // ── confirmation derived ───────────────────────────────────────────────────────

  it('derives confirmation icon/title/subtitle from the status', () => {
    setup();
    component.confirmation.set({
      bookingRef: 'LR-ABC123',
      status: 'confirmed',
      propertyTitle: 'T2',
      propertyAddress: 'Lisboa',
      checkIn: '2026-07-01',
      landlordName: 'Proprietário',
      total: 500,
      currency: 'EUR',
    });
    expect(component.confirmationIcon()).toBe('check_circle');
    expect(component.confirmationTitle()).toContain('Confirmada');
    expect(component.confirmationSubtitle()).not.toBe('');
  });

  // ── formatters ─────────────────────────────────────────────────────────────────

  it('formats the card number into groups of four', () => {
    setup();
    expect(component.formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111');
  });

  it('formats the expiry as MM/AA', () => {
    setup();
    expect(component.formatExpiry('1227')).toBe('12/27');
    expect(component.formatExpiry('1')).toBe('1');
  });

  it('selectMethod updates the selected payment method', () => {
    setup();
    component.selectMethod('mbway');
    expect(component.selectedMethod()).toBe('mbway');
  });

  // ── PARITY: bespoke twin ⇄ official form() ────────────────────────────────

  describe('parity with the bespoke BookingCheckoutComponent', () => {
    /**
     * Runs the same card-payment inputs through the bespoke component and asserts
     * its built `PaymentFormData` equals the official twin's — the migration is
     * only safe if both hand `checkoutComplete` byte-identical data.
     */
    it('builds the same PaymentFormData for the same card inputs', async () => {
      jest.useFakeTimers();
      let officialPd: PaymentFormData | null = null;
      let bespokePd: PaymentFormData | null = null;
      try {
        // ── official twin (already built in beforeEach) ──
        setup();
        goToPaymentStep();
        component.termsAccepted.set(true);
        component.selectMethod('card');
        fixture.detectChanges();
        fillValidCardViaDom();
        component.onSubmitPayment();
        jest.advanceTimersByTime(1000);
        officialPd = component.lastPaymentData();
        expect(officialPd).toBeTruthy();

        // ── bespoke twin in its own TestBed ──
        TestBed.resetTestingModule();
        await TestBed.configureTestingModule({
          imports: [BookingCheckoutComponent],
        }).compileComponents();
        const bFix = TestBed.createComponent(BookingCheckoutComponent);
        bFix.componentRef.setInput('property', property());
        bFix.componentRef.setInput('selectedRange', range());
        bFix.detectChanges();
        const bComp = bFix.componentInstance;
        const bHost = bFix.nativeElement as HTMLElement;

        bComp.goToPayment();
        bFix.detectChanges();
        bComp.termsAccepted.set(true);
        bComp.selectMethod('card');
        bFix.detectChanges();

        const bType = (sel: string, val: string) => {
          const el = bHost.querySelector<HTMLInputElement>(sel)!;
          el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          bFix.detectChanges();
        };
        bType('#cardHolder', 'Israel Lucena');
        bType('#cardNumber', '0000000000000000');
        bType('#cardExpiry', '1227');
        bType('#cardCvv', '123');

        bComp.onSubmitPayment();
        jest.advanceTimersByTime(1000);
        bespokePd = bComp.lastPaymentData();
        expect(bespokePd).toBeTruthy();
      } finally {
        jest.useRealTimers();
      }

      expect(officialPd).toEqual(bespokePd);
    });
  });
});
