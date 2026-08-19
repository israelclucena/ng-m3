import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  SignalFormsListingComponent,
  type SignalFormsListing,
} from './signal-forms-listing.component';

/**
 * Specs for {@link SignalFormsListingComponent}. Drives the public contract only —
 * DOM inputs + the `submitted` output — so the tests exercise the real
 * `[formField]` two-way binding and, crucially, the **cross-field** validators
 * (`deposit` vs `priceMonthly`, `bedrooms` vs `type`) and the custom date guard.
 */
describe('SignalFormsListingComponent', () => {
  let fixture: ComponentFixture<SignalFormsListingComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignalFormsListingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SignalFormsListingComponent);
    host = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  /** Set a control's value and propagate it through the `[formField]` directive. */
  function setValue(selector: string, value: string, event = 'input'): void {
    const el = host.querySelector<HTMLInputElement | HTMLSelectElement>(selector);
    if (!el) throw new Error(`control not found: ${selector}`);
    el.value = value;
    el.dispatchEvent(new Event(event, { bubbles: true }));
    fixture.detectChanges();
    TestBed.tick();
  }

  /** Fill every field with a valid, internally-consistent payload. */
  function fillValid(): void {
    setValue('input[type="text"]', 'Apartamento T2 renovado');
    setValue('select', 'apartment');
    setValue('input[placeholder="65"]', '65');
    setValue('input[placeholder="1200"]', '1200');
    setValue('input[placeholder="2400"]', '2400'); // 2× rent — inside 1×–3×
    setValue('input[placeholder="2"]', '2');
    setValue('input[type="date"]', '2999-01-01');
  }

  function submit(): void {
    host.querySelector('form')!.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    TestBed.tick();
  }

  function errorTexts(): (string | undefined)[] {
    return Array.from(host.querySelectorAll('.sfl__error')).map((e) =>
      e.textContent?.trim(),
    );
  }

  // ── render ──────────────────────────────────────────────────────────────────

  it('renders the listing controls (title, type, numbers, date)', () => {
    expect(host.querySelector('input[type="text"]')).toBeTruthy();
    expect(host.querySelector('select')).toBeTruthy();
    expect(host.querySelector('input[type="date"]')).toBeTruthy();
    expect(host.querySelectorAll('input[type="number"]').length).toBe(4);
  });

  it('shows no error messages before any interaction', () => {
    expect(host.querySelectorAll('.sfl__error').length).toBe(0);
  });

  // ── required / limit validators ─────────────────────────────────────────────

  it('surfaces required errors on submit of an empty form', () => {
    submit();
    const errors = errorTexts();
    // String fields fire `required`; numeric fields default to 0, so their `min`
    // limit fires instead of `required` (0 is a present value, not empty).
    expect(errors).toContain('Indique um título.');
    expect(errors).toContain('Escolha o tipo de imóvel.');
    expect(errors).toContain('Indique a data.');
    expect(errors).toContain('Renda mínima €100.');
    expect(errors).toContain('Área mínima 10 m².');
  });

  it('enforces the minimum rent', () => {
    setValue('input[placeholder="1200"]', '50');
    submit();
    expect(errorTexts()).toContain('Renda mínima €100.');
  });

  it('enforces the minimum title length', () => {
    setValue('input[type="text"]', 'Curto');
    submit();
    expect(errorTexts()).toContain('Mínimo 8 caracteres.');
  });

  // ── cross-field: deposit vs rent ────────────────────────────────────────────

  it('rejects a deposit above 3× the monthly rent (cross-field)', () => {
    setValue('input[placeholder="1200"]', '1000');
    setValue('input[placeholder="2400"]', '5000');
    submit();
    expect(errorTexts()).toContain('Caução máxima 3 meses (€3000).');
  });

  it('rejects a deposit below 1× the monthly rent (cross-field)', () => {
    setValue('input[placeholder="1200"]', '1000');
    setValue('input[placeholder="2400"]', '500');
    submit();
    expect(errorTexts()).toContain('Caução mínima 1 mês (€1000).');
  });

  it('accepts a deposit inside the 1×–3× band', () => {
    setValue('input[placeholder="1200"]', '1000');
    setValue('input[placeholder="2400"]', '2000'); // 2×
    submit();
    expect(errorTexts()).not.toContain('Caução máxima 3 meses (€3000).');
    expect(errorTexts()).not.toContain('Caução mínima 1 mês (€1000).');
  });

  // ── cross-field: studio has no bedrooms ─────────────────────────────────────

  it('rejects bedrooms > 0 for a studio (cross-field)', () => {
    setValue('select', 'studio');
    setValue('input[placeholder="2"]', '2');
    submit();
    expect(errorTexts()).toContain('Um estúdio tem 0 quartos separados.');
  });

  // ── custom rule: future date ────────────────────────────────────────────────

  it('rejects an availability date in the past (custom validator)', () => {
    setValue('input[type="date"]', '2020-01-01');
    submit();
    expect(errorTexts()).toContain('A data deve ser hoje ou futura.');
  });

  // ── submit ──────────────────────────────────────────────────────────────────

  it('does not emit while the form is invalid', () => {
    const emitted: SignalFormsListing[] = [];
    fixture.componentRef.instance.submitted$.subscribe((v) => emitted.push(v));
    submit();
    expect(emitted).toHaveLength(0);
  });

  it('emits the payload when a valid, consistent form is submitted', () => {
    const emitted: SignalFormsListing[] = [];
    fixture.componentRef.instance.submitted$.subscribe((v) => emitted.push(v));

    fillValid();
    submit();

    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toEqual({
      title: 'Apartamento T2 renovado',
      type: 'apartment',
      priceMonthly: 1200,
      deposit: 2400,
      bedrooms: 2,
      areaSqm: 65,
      availableFrom: '2999-01-01',
      petsAllowed: false,
    });
  });

  it('clears validation errors once valid values are provided', () => {
    submit();
    expect(host.querySelectorAll('.sfl__error').length).toBeGreaterThan(0);

    fillValid();

    expect(host.querySelectorAll('.sfl__error').length).toBe(0);
  });
});
