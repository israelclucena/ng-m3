jest.mock('@material/web/select/outlined-select.js', () => ({}));
jest.mock('@material/web/select/filled-select.js', () => ({}));
jest.mock('@material/web/select/select-option.js', () => ({}));

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectComponent } from './select.component';

type MdSelectEl = HTMLElement & {
  label?: string;
  disabled?: boolean;
  required?: boolean;
  errorText?: string;
  supportingText?: string;
  error?: boolean;
};

describe('SelectComponent', () => {
  let fixture: ComponentFixture<SelectComponent>;
  let component: SelectComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SelectComponent] }).compileComponents();
    fixture = TestBed.createComponent(SelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('has expected input defaults', () => {
    expect(component.variant()).toBe('outlined');
    expect(component.label()).toBe('');
    expect(component.disabled()).toBe(false);
    expect(component.required()).toBe(false);
    expect(component.errorText()).toBe('');
    expect(component.supportingText()).toBe('');
  });

  it('renders md-outlined-select by default (variant=outlined)', () => {
    const outlined = fixture.nativeElement.querySelector('md-outlined-select');
    const filled = fixture.nativeElement.querySelector('md-filled-select');
    expect(outlined).toBeTruthy();
    expect(filled).toBeNull();
  });

  it('renders md-filled-select when variant=filled', () => {
    const freshFixture = TestBed.createComponent(SelectComponent);
    freshFixture.componentRef.setInput('variant', 'filled');
    freshFixture.detectChanges();
    const outlined = freshFixture.nativeElement.querySelector('md-outlined-select');
    const filled = freshFixture.nativeElement.querySelector('md-filled-select');
    expect(filled).toBeTruthy();
    expect(outlined).toBeNull();
  });

  it('hostClass() reflects variant, disabled, and errorText state', () => {
    expect(component.hostClass()).toBe('iu-select iu-select--outlined');

    fixture.componentRef.setInput('disabled', true);
    fixture.componentRef.setInput('errorText', 'Bad value');
    fixture.detectChanges();
    expect(component.hostClass()).toBe(
      'iu-select iu-select--outlined iu-select--disabled iu-select--error',
    );
  });

  it('binds label, disabled, required, errorText, supportingText to md-outlined-select', () => {
    fixture.componentRef.setInput('label', 'Country');
    fixture.componentRef.setInput('disabled', true);
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('errorText', 'Required');
    fixture.componentRef.setInput('supportingText', 'Pick one');
    fixture.detectChanges();

    const el = fixture.nativeElement.querySelector('md-outlined-select') as MdSelectEl;
    expect(el.label).toBe('Country');
    expect(el.disabled).toBe(true);
    expect(el.required).toBe(true);
    expect(el.errorText).toBe('Required');
    expect(el.supportingText).toBe('Pick one');
  });

  it('[error] property is true when errorText() is non-empty, false otherwise', () => {
    const elBefore = fixture.nativeElement.querySelector('md-outlined-select') as MdSelectEl;
    expect(elBefore.error).toBe(false);

    fixture.componentRef.setInput('errorText', 'Oops');
    fixture.detectChanges();
    const elAfter = fixture.nativeElement.querySelector('md-outlined-select') as MdSelectEl;
    expect(elAfter.error).toBe(true);
  });

  it('applies hostClass() to the rendered md-outlined-select via [class]', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-outlined-select') as HTMLElement;
    expect(el.classList.contains('iu-select')).toBe(true);
    expect(el.classList.contains('iu-select--outlined')).toBe(true);
    expect(el.classList.contains('iu-select--disabled')).toBe(true);
  });

  it('change output emits the native event when md-outlined-select fires change', () => {
    const spy = jest.fn();
    component.change.subscribe(spy);
    const el = fixture.nativeElement.querySelector('md-outlined-select') as HTMLElement;
    const evt = new Event('change', { bubbles: true });
    el.dispatchEvent(evt);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(evt);
  });

  it('input output emits the native event when md-outlined-select fires input', () => {
    const spy = jest.fn();
    component.input.subscribe(spy);
    const el = fixture.nativeElement.querySelector('md-outlined-select') as HTMLElement;
    const evt = new Event('input', { bubbles: true });
    el.dispatchEvent(evt);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(evt);
  });

  it('onChange() handler emits the event passed in directly', () => {
    const spy = jest.fn();
    component.change.subscribe(spy);
    const evt = new Event('change');
    component.onChange(evt);
    expect(spy).toHaveBeenCalledWith(evt);
  });

  it('onInput() handler emits the event passed in directly', () => {
    const spy = jest.fn();
    component.input.subscribe(spy);
    const evt = new Event('input');
    component.onInput(evt);
    expect(spy).toHaveBeenCalledWith(evt);
  });

  it('filled variant binds inputs and emits outputs correctly', () => {
    const freshFixture = TestBed.createComponent(SelectComponent);
    freshFixture.componentRef.setInput('variant', 'filled');
    freshFixture.componentRef.setInput('label', 'City');
    freshFixture.componentRef.setInput('errorText', 'Pick');
    freshFixture.detectChanges();

    const el = freshFixture.nativeElement.querySelector('md-filled-select') as MdSelectEl;
    expect(el.label).toBe('City');
    expect(el.errorText).toBe('Pick');
    expect(el.error).toBe(true);
    expect(el.classList.contains('iu-select--filled')).toBe(true);

    const spy = jest.fn();
    freshFixture.componentInstance.change.subscribe(spy);
    const evt = new Event('change', { bubbles: true });
    el.dispatchEvent(evt);
    expect(spy).toHaveBeenCalledWith(evt);
  });
});
