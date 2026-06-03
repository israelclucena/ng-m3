jest.mock('@material/web/checkbox/checkbox.js', () => ({}));

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CheckboxComponent } from './checkbox.component';

type MdCheckboxEl = HTMLElement & {
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
};

describe('CheckboxComponent', () => {
  let fixture: ComponentFixture<CheckboxComponent>;
  let component: CheckboxComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CheckboxComponent] }).compileComponents();
    fixture = TestBed.createComponent(CheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('has correct default input values', () => {
    expect(component.checked()).toBe(false);
    expect(component.indeterminate()).toBe(false);
    expect(component.disabled()).toBe(false);
    expect(component.label()).toBe('');
    expect(component.ariaLabel()).toBe('');
  });

  it('renders md-checkbox inside label.iu-checkbox', () => {
    const label = fixture.nativeElement.querySelector('label.iu-checkbox') as HTMLElement;
    expect(label).toBeTruthy();
    const md = label.querySelector('md-checkbox');
    expect(md).toBeTruthy();
  });

  it('does not render label span when label() is empty', () => {
    const span = fixture.nativeElement.querySelector('.iu-checkbox__label');
    expect(span).toBeNull();
  });

  it('renders label span with matching text when label() is non-empty', () => {
    fixture.componentRef.setInput('label', 'Accept terms');
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('.iu-checkbox__label') as HTMLElement;
    expect(span).toBeTruthy();
    expect(span.textContent?.trim()).toBe('Accept terms');
  });

  it('md-checkbox defaults: checked/indeterminate/disabled are falsy', () => {
    const el = fixture.nativeElement.querySelector('md-checkbox') as MdCheckboxEl;
    expect(el.checked).toBeFalsy();
    expect(el.indeterminate).toBeFalsy();
    expect(el.disabled).toBeFalsy();
  });

  it('binds checked input to md-checkbox.checked property', () => {
    fixture.componentRef.setInput('checked', true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-checkbox') as MdCheckboxEl;
    expect(el.checked).toBe(true);
  });

  it('binds indeterminate input to md-checkbox.indeterminate property', () => {
    fixture.componentRef.setInput('indeterminate', true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-checkbox') as MdCheckboxEl;
    expect(el.indeterminate).toBe(true);
  });

  it('binds disabled input to md-checkbox.disabled property', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-checkbox') as MdCheckboxEl;
    expect(el.disabled).toBe(true);
  });

  it('aria-label attribute is absent by default', () => {
    const el = fixture.nativeElement.querySelector('md-checkbox') as HTMLElement;
    expect(el.getAttribute('aria-label')).toBeNull();
  });

  it('aria-label attribute is set when ariaLabel input is provided', () => {
    fixture.componentRef.setInput('ariaLabel', 'Accept the terms');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-checkbox') as HTMLElement;
    expect(el.getAttribute('aria-label')).toBe('Accept the terms');
  });

  it('emits change output with target.checked=true when md-checkbox dispatches change', () => {
    const spy = jest.fn();
    component.change.subscribe(spy);
    const el = fixture.nativeElement.querySelector('md-checkbox') as MdCheckboxEl;
    Object.defineProperty(el, 'checked', { value: true, configurable: true });
    el.dispatchEvent(new Event('change', { bubbles: true }));
    expect(spy).toHaveBeenCalledWith(true);
  });

  it('emits change output with target.checked=false when md-checkbox dispatches change', () => {
    const spy = jest.fn();
    component.change.subscribe(spy);
    const el = fixture.nativeElement.querySelector('md-checkbox') as MdCheckboxEl;
    Object.defineProperty(el, 'checked', { value: false, configurable: true });
    el.dispatchEvent(new Event('change', { bubbles: true }));
    expect(spy).toHaveBeenCalledWith(false);
  });

  it('onChange handler emits target.checked value directly', () => {
    const spy = jest.fn();
    component.change.subscribe(spy);
    component.onChange({ target: { checked: true } } as unknown as Event);
    expect(spy).toHaveBeenCalledWith(true);
    component.onChange({ target: { checked: false } } as unknown as Event);
    expect(spy).toHaveBeenCalledWith(false);
  });
});
