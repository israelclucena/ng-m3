import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilderComponent } from './form-builder.component';
import type { FormField, FormSubmitEvent } from './form-field.model';

/** A small, representative field schema reused across tests. */
const FIELDS: FormField[] = [
  { key: 'name', type: 'text', label: 'Nome', validation: { required: true, minLength: 2 } },
  { key: 'email', type: 'email', label: 'Email', validation: { required: true } },
  { key: 'age', type: 'number', label: 'Idade', validation: { min: 18, max: 120 } },
  { key: 'terms', type: 'checkbox', label: 'Aceito os termos', validation: { required: true } },
  { key: 'bio', type: 'textarea', label: 'Bio', defaultValue: 'olá' },
];

describe('FormBuilderComponent', () => {
  let fixture: ComponentFixture<FormBuilderComponent>;
  let component: FormBuilderComponent;

  /** Configure the component with a field schema and run ngOnInit. */
  function setup(fields: FormField[] = FIELDS): void {
    fixture.componentRef.setInput('fields', fields);
    fixture.detectChanges(); // triggers ngOnInit
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormBuilderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormBuilderComponent);
    component = fixture.componentInstance;
  });

  // ── default seeding ────────────────────────────────────────────────────────────

  it('seeds default values from the schema on init', () => {
    setup();
    expect(component.getValue('bio')).toBe('olá');
    expect(component.getValue('name')).toBe('');
    expect(component.getValue('terms')).toBe(false); // checkbox defaults to false
  });

  it('seeds an explicit defaultValue over the empty-string fallback', () => {
    setup([{ key: 'role', type: 'select', label: 'Cargo', defaultValue: 'admin' }]);
    expect(component.getValue('role')).toBe('admin');
  });

  // ── validation: required ───────────────────────────────────────────────────────

  it('marks required fields invalid when empty', () => {
    setup();
    expect(component.isValid()).toBe(false);
  });

  it('clears the required error once a value is provided', () => {
    setup([{ key: 'name', type: 'text', label: 'Nome', validation: { required: true } }]);
    expect(component.isValid()).toBe(false);
    component.setValue('name', 'Israel');
    expect(component.isValid()).toBe(true);
  });

  it('treats a required checkbox as invalid until checked', () => {
    setup([{ key: 'terms', type: 'checkbox', label: 'Termos', validation: { required: true } }]);
    expect(component.isValid()).toBe(false);
    component.setValue('terms', true);
    expect(component.isValid()).toBe(true);
  });

  // ── validation: by type ────────────────────────────────────────────────────────

  it('validates email format', () => {
    setup([{ key: 'email', type: 'email', label: 'Email', validation: { email: true } }]);
    component.setValue('email', 'not-an-email');
    expect(component.getError('email')).toBe('Email inválido');
    component.setValue('email', 'a@b.com');
    expect(component.getError('email')).toBe('');
  });

  it('enforces minLength and maxLength', () => {
    setup([{ key: 'pin', type: 'text', label: 'PIN', validation: { minLength: 4, maxLength: 6 } }]);
    component.setValue('pin', '12');
    expect(component.getError('pin')).toBe('Mínimo 4 caracteres');
    component.setValue('pin', '1234567');
    expect(component.getError('pin')).toBe('Máximo 6 caracteres');
    component.setValue('pin', '12345');
    expect(component.getError('pin')).toBe('');
  });

  it('enforces numeric min and max', () => {
    setup([{ key: 'age', type: 'number', label: 'Idade', validation: { min: 18, max: 120 } }]);
    component.setValue('age', '10');
    expect(component.getError('age')).toBe('Valor mínimo: 18');
    component.setValue('age', '200');
    expect(component.getError('age')).toBe('Valor máximo: 120');
    component.setValue('age', '30');
    expect(component.getError('age')).toBe('');
  });

  it('enforces a regex pattern', () => {
    setup([{ key: 'code', type: 'text', label: 'Código', validation: { pattern: '^[A-Z]{3}$' } }]);
    component.setValue('code', 'ab');
    expect(component.getError('code')).toBe('Formato inválido');
    component.setValue('code', 'ABC');
    expect(component.getError('code')).toBe('');
  });

  it('runs a custom validator', () => {
    setup([
      {
        key: 'slug',
        type: 'text',
        label: 'Slug',
        validation: { custom: (v) => (String(v) === 'taken' ? 'Já existe' : null) },
      },
    ]);
    component.setValue('slug', 'taken');
    expect(component.getError('slug')).toBe('Já existe');
    component.setValue('slug', 'free');
    expect(component.getError('slug')).toBe('');
  });

  it('skips format checks for empty optional fields', () => {
    setup([{ key: 'email', type: 'email', label: 'Email' }]);
    expect(component.getError('email')).toBe('');
    expect(component.isValid()).toBe(true);
  });

  // ── touched / error visibility ─────────────────────────────────────────────────

  it('hides errors until a field is touched or the form is submitted', () => {
    setup([{ key: 'name', type: 'text', label: 'Nome', validation: { required: true } }]);
    expect(component.hasError('name')).toBe(false); // invalid but untouched
    component.touch('name');
    expect(component.hasError('name')).toBe(true);
  });

  it('surfaces all errors after submit even without touching', () => {
    setup();
    component.submit();
    expect(component.hasError('name')).toBe(true);
    expect(component.hasError('email')).toBe(true);
  });

  // ── submit ─────────────────────────────────────────────────────────────────────

  it('emits values + isValid=false on an invalid submit', () => {
    setup();
    let event: FormSubmitEvent | null = null;
    component.submitted_event.subscribe((e) => (event = e));

    component.submit();

    expect(component.submitted()).toBe(true);
    expect(event!.isValid).toBe(false);
    expect(event!.values).toHaveProperty('name', '');
  });

  it('emits isValid=true once every field passes', () => {
    setup();
    component.setValue('name', 'Israel');
    component.setValue('email', 'israel@example.com');
    component.setValue('age', '30');
    component.setValue('terms', true);

    let event: FormSubmitEvent | null = null;
    component.submitted_event.subscribe((e) => (event = e));
    component.submit();

    expect(event!.isValid).toBe(true);
    expect(event!.values['name']).toBe('Israel');
  });

  // ── reset ──────────────────────────────────────────────────────────────────────

  it('reset() restores defaults and clears submitted/errors', () => {
    setup();
    component.setValue('name', 'X');
    component.touch('name');
    component.submit();
    expect(component.submitted()).toBe(true);

    component.reset();

    expect(component.submitted()).toBe(false);
    expect(component.getValue('name')).toBe('');
    expect(component.getValue('bio')).toBe('olá'); // back to default
    expect(component.hasError('name')).toBe(false);
  });

  // ── input handlers ─────────────────────────────────────────────────────────────

  it('onInput / onSelectChange / onCheckboxChange write through to state', () => {
    setup();
    component.onInput('name', { target: { value: 'Ana' } } as unknown as Event);
    expect(component.getValue('name')).toBe('Ana');

    component.onSelectChange('bio', { target: { value: 'sel' } } as unknown as Event);
    expect(component.getValue('bio')).toBe('sel');

    component.onCheckboxChange('terms', { target: { checked: true } } as unknown as Event);
    expect(component.getValue('terms')).toBe(true);
  });
});
