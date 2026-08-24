import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PropertyBookingSignalFormComponent } from './property-booking-signal-form.component';
import {
  PropertyBookingComponent,
  type BookingSubmitEvent,
} from '../property-booking/property-booking.component';
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

/**
 * Specs for {@link PropertyBookingSignalFormComponent} — the official-`form()` twin
 * of {@link PropertyBookingComponent}.
 *
 * The suite drives the **public contract only** (DOM tabs + inputs/select/textarea
 * via the real `[formField]` two-way binding + the `bookingSubmitted` output), never
 * the protected field tree, and closes with a **parity block** that runs the same
 * inputs through *both* components and asserts they emit an identical
 * `BookingSubmitEvent.form`.
 */
describe('PropertyBookingSignalFormComponent', () => {
  let fixture: ComponentFixture<PropertyBookingSignalFormComponent>;
  let host: HTMLElement;

  function setup(p: PropertyData = property()): void {
    fixture.componentRef.setInput('property', p);
    fixture.detectChanges();
  }

  /** Type into an input/textarea and propagate it through `[formField]` (commits on `input`). */
  function typeInto(selector: string, value: string): void {
    const el = host.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
    if (!el) throw new Error(`control not found: ${selector}`);
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    TestBed.tick();
  }

  /** Set a `<select>` value and propagate it through `[formField]` (commits on `input`). */
  function selectValue(selector: string, value: string): void {
    const el = host.querySelector<HTMLSelectElement>(selector);
    if (!el) throw new Error(`select not found: ${selector}`);
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    TestBed.tick();
  }

  /** Click a tab button by its text ('visit' → first, 'inquiry' → last). */
  function clickTab(kind: 'visit' | 'inquiry'): void {
    const sel = kind === 'visit' ? '.iu-pb__tab' : '.iu-pb__tab:last-child';
    host.querySelector<HTMLButtonElement>(sel)!.click();
    fixture.detectChanges();
    TestBed.tick();
  }

  function submitForm(): void {
    host.querySelector('form')!.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    TestBed.tick();
  }

  const errorTexts = (): string[] =>
    Array.from(host.querySelectorAll('.iu-pb__error')).map(
      (e) => e.textContent?.trim() ?? '',
    );

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyBookingSignalFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyBookingSignalFormComponent);
    host = fixture.nativeElement as HTMLElement;
    setup();
  });

  // ── render / defaults ───────────────────────────────────────────────────────

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the header, the form() badge and defaults to the visit tab', () => {
    expect(host.querySelector('.iu-pb__header-title')?.textContent?.trim()).toBe('Contactar Proprietário');
    expect(host.querySelector('.iu-pb__badge')?.textContent?.trim()).toBe('form()');
    expect(host.querySelector('.iu-pb__tab--active')?.textContent?.trim()).toContain('Agendar Visita');
    expect(fixture.componentInstance.isSuccess()).toBe(false);
  });

  it('formats the monthly price in EUR', () => {
    const price = host.querySelector('.iu-pb__summary-price')?.textContent ?? '';
    expect(price).toContain('450');
    expect(price).toMatch(/€|EUR/);
  });

  it('shows visit-specific fields on the visit tab, move-in field on inquiry', () => {
    expect(host.querySelector('#pbs-visit-date')).toBeTruthy();
    expect(host.querySelector('#pbs-time-slot')).toBeTruthy();
    expect(host.querySelector('#pbs-movein')).toBeFalsy();
    clickTab('inquiry');
    expect(host.querySelector('#pbs-movein')).toBeTruthy();
    expect(host.querySelector('#pbs-visit-date')).toBeFalsy();
  });

  // ── submit gating ─────────────────────────────────────────────────────────

  it('disables the submit button until name + email are valid', () => {
    const submitBtn = () => host.querySelector<HTMLButtonElement>('.iu-pb__btn--filled')!;
    expect(submitBtn().disabled).toBe(true);
    typeInto('#pbs-name', 'Israel Lucena');
    typeInto('#pbs-email', 'israel@example.com');
    expect(submitBtn().disabled).toBe(false);
  });

  it('surfaces the required errors on submit of an empty form', () => {
    submitForm();
    const errors = errorTexts();
    expect(errors).toContain('Nome é obrigatório.');
    expect(errors).toContain('Email é obrigatório.');
    expect(fixture.componentInstance.isSuccess()).toBe(false);
  });

  it('rejects an invalid email and does not submit', () => {
    let emitted = 0;
    fixture.componentInstance.bookingSubmitted.subscribe(() => emitted++);
    typeInto('#pbs-name', 'Ana');
    typeInto('#pbs-email', 'not-an-email');
    submitForm();
    expect(emitted).toBe(0);
    expect(errorTexts()).toContain('Email inválido.');
  });

  // ── tab switch resets the form ──────────────────────────────────────────────

  it('resets the form when switching booking type', () => {
    typeInto('#pbs-name', 'temp');
    clickTab('inquiry');
    expect(fixture.componentInstance.bookingType()).toBe('inquiry');
    expect(host.querySelector<HTMLInputElement>('#pbs-name')?.value).toBe('');
  });

  // ── submit flow (synchronous) ───────────────────────────────────────────────

  it('emits a visit booking and shows success when valid', () => {
    let event: BookingSubmitEvent | null = null;
    fixture.componentInstance.bookingSubmitted.subscribe((e) => (event = e));

    typeInto('#pbs-name', 'Israel Lucena');
    typeInto('#pbs-email', 'israel@example.com');
    typeInto('#pbs-phone', '+351 912 345 678');
    typeInto('#pbs-visit-date', '2026-07-01');
    selectValue('#pbs-time-slot', 'morning');
    submitForm();

    expect(fixture.componentInstance.isSuccess()).toBe(true);
    expect(event!.form.name).toBe('Israel Lucena');
    expect(event!.form.email).toBe('israel@example.com');
    expect(event!.form.phone).toBe('+351 912 345 678');
    expect(event!.form.bookingType).toBe('visit');
    expect(event!.form.visitDate).toBe('2026-07-01');
    expect(event!.form.visitTimeSlot).toBe('morning');
    expect(event!.property.id).toBe('p1');
    expect(host.querySelector('.iu-pb__success')).toBeTruthy();
  });

  it('emits an inquiry booking with the move-in date instead of visit fields', () => {
    clickTab('inquiry');
    let event: BookingSubmitEvent | null = null;
    fixture.componentInstance.bookingSubmitted.subscribe((e) => (event = e));

    typeInto('#pbs-name', 'Ana Ferreira');
    typeInto('#pbs-email', 'ana@example.com');
    typeInto('#pbs-movein', '2026-08-15');
    submitForm();

    expect(event!.form.bookingType).toBe('inquiry');
    expect(event!.form.moveInDate).toBe('2026-08-15');
    expect(event!.form.visitDate).toBeUndefined();
    expect(event!.form.visitTimeSlot).toBeUndefined();
  });

  it('trims values and omits empty optionals', () => {
    let event: BookingSubmitEvent | null = null;
    fixture.componentInstance.bookingSubmitted.subscribe((e) => (event = e));

    typeInto('#pbs-name', '  Ana  ');
    typeInto('#pbs-email', 'ana@example.com');
    // phone + message left blank
    submitForm();

    expect(event!.form.name).toBe('Ana'); // trimmed at emit time
    expect(event!.form.email).toBe('ana@example.com');
    expect(event!.form.phone).toBeUndefined();
    expect(event!.form.message).toBeUndefined();
  });

  it('onClose emits the closed output', () => {
    let closed = 0;
    fixture.componentInstance.closed.subscribe(() => closed++);
    host.querySelector<HTMLButtonElement>('.iu-pb__close')!.click();
    expect(closed).toBe(1);
  });

  // ── PARITY: bespoke twin ⇄ official form() ────────────────────────────────

  describe('parity with the bespoke PropertyBookingComponent', () => {
    /**
     * Runs the same visit-booking inputs through the bespoke component and asserts
     * its emitted `BookingSubmitEvent.form` equals the official twin's — the
     * migration is only safe if both emit byte-identical data.
     */
    it('emits the same BookingSubmitEvent.form for the same inputs', async () => {
      // ── official twin (already built in beforeEach) ──
      let officialForm: BookingSubmitEvent['form'] | null = null;
      fixture.componentInstance.bookingSubmitted.subscribe((e) => (officialForm = e.form));
      typeInto('#pbs-name', 'Israel Lucena');
      typeInto('#pbs-email', 'israel@example.com');
      typeInto('#pbs-phone', '+351 912 345 678');
      typeInto('#pbs-visit-date', '2026-07-01');
      selectValue('#pbs-time-slot', 'morning');
      typeInto('#pbs-message', 'Gostaria de ver o apartamento ao fim da tarde.');
      submitForm();
      expect(officialForm).toBeTruthy();

      // ── bespoke twin in its own TestBed ──
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [PropertyBookingComponent],
      }).compileComponents();
      const bespokeFix = TestBed.createComponent(PropertyBookingComponent);
      bespokeFix.componentRef.setInput('property', property());
      bespokeFix.detectChanges();

      let bespokeForm: BookingSubmitEvent['form'] | null = null;
      bespokeFix.componentInstance.bookingSubmitted.subscribe((e) => (bespokeForm = e.form));

      const bHost = bespokeFix.nativeElement as HTMLElement;
      const bType = (sel: string, val: string) => {
        const el = bHost.querySelector<HTMLInputElement | HTMLTextAreaElement>(sel)!;
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        bespokeFix.detectChanges();
      };
      const bSelect = (sel: string, val: string) => {
        const el = bHost.querySelector<HTMLSelectElement>(sel)!;
        el.value = val;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        bespokeFix.detectChanges();
      };
      bType('#pb-name', 'Israel Lucena');
      bType('#pb-email', 'israel@example.com');
      bType('#pb-phone', '+351 912 345 678');
      bType('#pb-visit-date', '2026-07-01');
      bSelect('#pb-time-slot', 'morning');
      bType('#pb-message', 'Gostaria de ver o apartamento ao fim da tarde.');
      bHost.querySelector('form')!.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      bespokeFix.detectChanges();

      expect(bespokeForm).toEqual(officialForm);
    });
  });
});
