import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  SignalFormsPocComponent,
  type SignalFormsInquiry,
} from './signal-forms-poc.component';

/**
 * Specs for {@link SignalFormsPocComponent}. Drives the public contract only —
 * DOM inputs + the `submitted` output — rather than the protected Signal Forms
 * field tree, so the tests exercise the real `[formField]` two-way binding.
 */
describe('SignalFormsPocComponent', () => {
  let fixture: ComponentFixture<SignalFormsPocComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignalFormsPocComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SignalFormsPocComponent);
    host = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  /** Type a value into a control and propagate it through the `[formField]` directive. */
  function typeInto(selector: string, value: string): void {
    const el = host.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
    if (!el) throw new Error(`control not found: ${selector}`);
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    TestBed.tick();
  }

  /** Fill every field with a valid payload. */
  function fillValid(): void {
    typeInto('input[type="text"]', 'Israel Lucena');
    typeInto('input[type="email"]', 'israel@example.com');
    typeInto('textarea', 'Tenho interesse no T2 em Príncipe Real.');
  }

  function submit(): void {
    host.querySelector('form')!.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    TestBed.tick();
  }

  // ── render ──────────────────────────────────────────────────────────────────

  it('renders the three inquiry controls', () => {
    expect(host.querySelector('input[type="text"]')).toBeTruthy();
    expect(host.querySelector('input[type="email"]')).toBeTruthy();
    expect(host.querySelector('textarea')).toBeTruthy();
  });

  it('shows no error messages before any interaction', () => {
    expect(host.querySelectorAll('.sfp__error').length).toBe(0);
  });

  // ── validation ────────────────────────────────────────────────────────────────

  it('surfaces required errors on submit of an empty form', () => {
    submit();
    const errors = Array.from(host.querySelectorAll('.sfp__error')).map(
      (e) => e.textContent?.trim(),
    );
    expect(errors).toContain('Indique o seu nome.');
    expect(errors).toContain('Indique o seu email.');
    expect(errors).toContain('Escreva a sua mensagem.');
  });

  it('rejects an invalid email with the email validator message', () => {
    typeInto('input[type="text"]', 'Israel');
    typeInto('input[type="email"]', 'not-an-email');
    typeInto('textarea', 'Olá');
    submit();
    const errors = Array.from(host.querySelectorAll('.sfp__error')).map(
      (e) => e.textContent?.trim(),
    );
    expect(errors).toContain('Email inválido.');
  });

  it('enforces the minimum name length', () => {
    typeInto('input[type="text"]', 'A');
    submit();
    const errors = Array.from(host.querySelectorAll('.sfp__error')).map(
      (e) => e.textContent?.trim(),
    );
    expect(errors).toContain('Mínimo 2 caracteres.');
  });

  // ── submit ────────────────────────────────────────────────────────────────────

  it('does not emit while the form is invalid', () => {
    const emitted: SignalFormsInquiry[] = [];
    fixture.componentRef.instance.submitted$.subscribe((v) => emitted.push(v));
    submit();
    expect(emitted).toHaveLength(0);
  });

  it('emits the payload when a valid form is submitted', () => {
    const emitted: SignalFormsInquiry[] = [];
    fixture.componentRef.instance.submitted$.subscribe((v) => emitted.push(v));

    fillValid();
    submit();

    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toEqual({
      name: 'Israel Lucena',
      email: 'israel@example.com',
      message: 'Tenho interesse no T2 em Príncipe Real.',
    });
  });

  it('clears validation errors once valid values are provided', () => {
    submit();
    expect(host.querySelectorAll('.sfp__error').length).toBeGreaterThan(0);

    fillValid();

    expect(host.querySelectorAll('.sfp__error').length).toBe(0);
  });
});
