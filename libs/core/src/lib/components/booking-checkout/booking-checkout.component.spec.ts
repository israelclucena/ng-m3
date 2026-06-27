import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookingCheckoutComponent } from './booking-checkout.component';
import type { PropertyData } from '../property-card/property-card.component';

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

describe('BookingCheckoutComponent', () => {
  let fixture: ComponentFixture<BookingCheckoutComponent>;
  let component: BookingCheckoutComponent;

  function setup(p: PropertyData = property(), r = range()): void {
    fixture.componentRef.setInput('property', p);
    fixture.componentRef.setInput('selectedRange', r);
    fixture.detectChanges();
  }

  /** Fill the card form with values that pass validation. */
  function fillValidCard(): void {
    component.paymentForm.fields['cardHolder'].setValue('Israel Lucena');
    component.paymentForm.fields['cardNumber'].setValue('0000 0000 0000 0000'); // 19 chars
    component.paymentForm.fields['cardExpiry'].setValue('12/27');
    component.paymentForm.fields['cardCvv'].setValue('123');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingCheckoutComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingCheckoutComponent);
    component = fixture.componentInstance;
  });

  // ── defaults ───────────────────────────────────────────────────────────────────

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

  // ── pricing ────────────────────────────────────────────────────────────────────

  it('computes nights from the selected range', () => {
    setup();
    expect(component.nights()).toBe(3);
  });

  it('builds the price breakdown: base, cleaning and deposit', () => {
    setup(property({ priceMonthly: 100 }), range());
    const items = component.lineItems();
    // base = 100 * 3 nights = 300
    expect(items.find((i) => i.type === 'charge')!.amount).toBe(300);
    // cleaning = round(300 * 0.08) = 24
    expect(items.find((i) => i.type === 'fee')!.amount).toBe(24);
    // deposit = round(100 * 2) = 200
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

  // ── navigation ─────────────────────────────────────────────────────────────────

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
    component.goToPayment();
    component.onSubmitPayment();
    expect(component.showTermsError()).toBe(true);
    expect(component.isSubmitting()).toBe(false);
    expect(component.step()).toBe('payment');
  });

  it('does not submit an invalid card form even with terms accepted', () => {
    setup();
    component.goToPayment();
    component.termsAccepted.set(true);
    component.selectMethod('card');
    component.onSubmitPayment(); // card fields blank → invalid
    expect(component.isSubmitting()).toBe(false);
    expect(component.step()).toBe('payment');
  });

  // ── submit success (async) ─────────────────────────────────────────────────────

  it('finalises a valid card payment as confirmed after the async delay', () => {
    jest.useFakeTimers();
    try {
      setup();
      component.goToPayment();
      component.termsAccepted.set(true);
      component.selectMethod('card');
      fillValidCard();

      component.onSubmitPayment();
      expect(component.isSubmitting()).toBe(true);

      jest.advanceTimersByTime(1000);

      expect(component.isSubmitting()).toBe(false);
      expect(component.step()).toBe('confirmation');
      expect(component.confirmation()!.status).toBe('confirmed');
      expect(component.confirmation()!.bookingRef).toMatch(/^LR-/);
      expect(component.lastPaymentData()!.method).toBe('card');
    } finally {
      jest.useRealTimers();
    }
  });

  it('marks a bank transfer payment as pending', () => {
    jest.useFakeTimers();
    try {
      setup();
      component.goToPayment();
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
});
