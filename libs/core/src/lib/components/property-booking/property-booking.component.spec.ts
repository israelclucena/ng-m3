import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  PropertyBookingComponent,
  type BookingSubmitEvent,
} from './property-booking.component';
import type { PropertyData } from '../property-card/property-card.component';

/** Build a property fixture, overridable per test. */
function property(over: Partial<PropertyData> = {}): PropertyData {
  return {
    id: 'p1',
    title: 'T2 em Príncipe Real',
    location: 'Príncipe Real, Lisboa',
    priceMonthly: 1450,
    bedrooms: 2,
    bathrooms: 1,
    areaSqm: 78,
    type: 'apartment',
    badges: [],
    isFavourited: false,
    ...over,
  } as PropertyData;
}

describe('PropertyBookingComponent', () => {
  let fixture: ComponentFixture<PropertyBookingComponent>;
  let component: PropertyBookingComponent;

  function setup(p: PropertyData = property()): void {
    fixture.componentRef.setInput('property', p);
    fixture.detectChanges();
  }

  /** Fill the required fields with a valid name + email. */
  function fillValid(): void {
    component.form.fields.name.setValue('Israel Lucena');
    component.form.fields.email.setValue('israel@example.com');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyBookingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyBookingComponent);
    component = fixture.componentInstance;
  });

  // ── defaults ───────────────────────────────────────────────────────────────────

  it('defaults to the visit booking type and no success', () => {
    setup();
    expect(component.bookingType()).toBe('visit');
    expect(component.isSuccess()).toBe(false);
  });

  it('starts invalid because name + email are required', () => {
    setup();
    expect(component.form.invalid()).toBe(true);
  });

  // ── computed ───────────────────────────────────────────────────────────────────

  it('formats the monthly price in EUR', () => {
    setup(property({ priceMonthly: 1450 }));
    const formatted = component.formattedPrice();
    expect(formatted).toContain('450');
    expect(formatted).toMatch(/€|EUR/);
  });

  it('switches the message placeholder with the booking type', () => {
    setup();
    expect(component.messagePlaceholder()).toContain('visita');
    component.setBookingType('inquiry');
    expect(component.messagePlaceholder()).not.toContain('visita');
  });

  // ── booking type ───────────────────────────────────────────────────────────────

  it('setBookingType switches the tab and resets the form', () => {
    setup();
    component.form.fields.name.setValue('temp');
    component.setBookingType('inquiry');
    expect(component.bookingType()).toBe('inquiry');
    expect(component.form.fields.name.value()).toBe(''); // reset cleared it
  });

  // ── close ──────────────────────────────────────────────────────────────────────

  it('onClose emits the closed output', () => {
    setup();
    let closed = 0;
    component.closed.subscribe(() => closed++);
    component.onClose();
    expect(closed).toBe(1);
  });

  // ── submit: invalid ────────────────────────────────────────────────────────────

  it('does not emit or show success on an invalid submit', () => {
    setup();
    let emitted = 0;
    component.bookingSubmitted.subscribe(() => emitted++);

    component.onSubmit();

    expect(emitted).toBe(0);
    expect(component.isSuccess()).toBe(false);
  });

  // ── submit: valid visit ────────────────────────────────────────────────────────

  it('emits a visit booking and shows success when valid', () => {
    setup();
    fillValid();
    component.form.fields.phone.setValue('+351 912 345 678');
    component.form.fields.visitDate.setValue('2026-07-01');
    component.form.fields.visitTimeSlot.setValue('morning');

    let event: BookingSubmitEvent | null = null;
    component.bookingSubmitted.subscribe((e) => (event = e));

    component.onSubmit();

    expect(component.isSuccess()).toBe(true);
    expect(event!.form.name).toBe('Israel Lucena');
    expect(event!.form.email).toBe('israel@example.com');
    expect(event!.form.phone).toBe('+351 912 345 678');
    expect(event!.form.bookingType).toBe('visit');
    expect(event!.form.visitDate).toBe('2026-07-01');
    expect(event!.form.visitTimeSlot).toBe('morning');
    expect(event!.property.id).toBe('p1');
  });

  // ── submit: valid inquiry ──────────────────────────────────────────────────────

  it('emits an inquiry booking with the move-in date instead of visit fields', () => {
    setup();
    component.setBookingType('inquiry');
    fillValid();
    component.form.fields.moveInDate.setValue('2026-08-15');

    let event: BookingSubmitEvent | null = null;
    component.bookingSubmitted.subscribe((e) => (event = e));

    component.onSubmit();

    expect(event!.form.bookingType).toBe('inquiry');
    expect(event!.form.moveInDate).toBe('2026-08-15');
    expect(event!.form.visitDate).toBeUndefined();
    expect(event!.form.visitTimeSlot).toBeUndefined();
  });

  // ── submit: trimming & optional omission ───────────────────────────────────────

  it('trims values and omits empty optionals', () => {
    setup();
    component.form.fields.name.setValue('  Ana  ');
    component.form.fields.email.setValue('ana@example.com');
    // phone + message left blank

    let event: BookingSubmitEvent | null = null;
    component.bookingSubmitted.subscribe((e) => (event = e));

    component.onSubmit();

    expect(event!.form.name).toBe('Ana'); // trimmed at emit time
    expect(event!.form.email).toBe('ana@example.com');
    expect(event!.form.phone).toBeUndefined();
    expect(event!.form.message).toBeUndefined();
  });

  it('rejects an invalid email at the form level', () => {
    setup();
    component.form.fields.name.setValue('Ana');
    component.form.fields.email.setValue('not-an-email');
    expect(component.form.invalid()).toBe(true);

    let emitted = 0;
    component.bookingSubmitted.subscribe(() => emitted++);
    component.onSubmit();
    expect(emitted).toBe(0);
  });
});
