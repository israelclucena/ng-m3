jest.mock('@material/web/radio/radio.js', () => ({}));

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RadioComponent } from './radio.component';

type MdRadioEl = HTMLElement & {
  checked?: boolean;
  disabled?: boolean;
  name?: string;
  value?: string;
};

describe('RadioComponent', () => {
  let fixture: ComponentFixture<RadioComponent>;
  let component: RadioComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RadioComponent] }).compileComponents();
    fixture = TestBed.createComponent(RadioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('has expected input defaults', () => {
    expect(component.checked()).toBe(false);
    expect(component.disabled()).toBe(false);
    expect(component.name()).toBe('');
    expect(component.value()).toBe('');
    expect(component.label()).toBe('');
    expect(component.ariaLabel()).toBe('');
  });

  it('renders md-radio inside label.iu-radio', () => {
    const label = fixture.nativeElement.querySelector('label.iu-radio') as HTMLElement;
    expect(label).toBeTruthy();
    const mdRadio = label.querySelector('md-radio');
    expect(mdRadio).toBeTruthy();
  });

  it('does not render label span when label() is empty', () => {
    const span = fixture.nativeElement.querySelector('.iu-radio__label');
    expect(span).toBeNull();
  });

  it('renders label span when label() is non-empty', () => {
    fixture.componentRef.setInput('label', 'Red');
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('.iu-radio__label') as HTMLElement;
    expect(span).toBeTruthy();
    expect(span.textContent?.trim()).toBe('Red');
  });

  it('md-radio defaults: checked=false, disabled=false', () => {
    const el = fixture.nativeElement.querySelector('md-radio') as MdRadioEl;
    expect(el.checked).toBe(false);
    expect(el.disabled).toBe(false);
  });

  it('sets md-radio checked property when [checked]=true', () => {
    fixture.componentRef.setInput('checked', true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-radio') as MdRadioEl;
    expect(el.checked).toBe(true);
  });

  it('sets md-radio disabled property when [disabled]=true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-radio') as MdRadioEl;
    expect(el.disabled).toBe(true);
  });

  it('binds name and value to md-radio', () => {
    fixture.componentRef.setInput('name', 'color');
    fixture.componentRef.setInput('value', 'red');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-radio') as MdRadioEl;
    const name = el.name ?? el.getAttribute('name');
    const value = el.value ?? el.getAttribute('value');
    expect(name).toBe('color');
    expect(value).toBe('red');
  });

  it('does not set aria-label attribute by default (empty string → null)', () => {
    const el = fixture.nativeElement.querySelector('md-radio') as HTMLElement;
    expect(el.getAttribute('aria-label')).toBeNull();
  });

  it('sets aria-label attribute when ariaLabel() is provided', () => {
    fixture.componentRef.setInput('ariaLabel', 'Select red');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-radio') as HTMLElement;
    expect(el.getAttribute('aria-label')).toBe('Select red');
  });

  it('change output emits the value() input when md-radio fires change', () => {
    const spy = jest.fn();
    component.change.subscribe(spy);
    fixture.componentRef.setInput('value', 'red');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-radio') as HTMLElement;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    expect(spy).toHaveBeenCalledWith('red');
  });

  it('onChange ignores event target and always emits value() input', () => {
    const spy = jest.fn();
    component.change.subscribe(spy);
    fixture.componentRef.setInput('value', 'blue');
    fixture.detectChanges();
    // Synthesize an event with a different target value — should be ignored.
    const fakeEvent = { target: { value: 'something-else' } } as unknown as Event;
    component.onChange(fakeEvent);
    expect(spy).toHaveBeenCalledWith('blue');
    expect(spy).not.toHaveBeenCalledWith('something-else');
  });
});
