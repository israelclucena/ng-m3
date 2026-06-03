jest.mock('@material/web/switch/switch.js', () => ({}));

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SwitchComponent } from './switch.component';

type MdSwitchEl = HTMLElement & {
  selected?: boolean;
  disabled?: boolean;
  icons?: boolean;
};

describe('SwitchComponent', () => {
  let fixture: ComponentFixture<SwitchComponent>;
  let component: SwitchComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SwitchComponent] }).compileComponents();
    fixture = TestBed.createComponent(SwitchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should have default inputs', () => {
    expect(component.selected()).toBe(false);
    expect(component.disabled()).toBe(false);
    expect(component.icons()).toBe(false);
    expect(component.label()).toBe('');
    expect(component.ariaLabel()).toBe('');
  });

  it('should render md-switch inside label.iu-switch', () => {
    const label = fixture.nativeElement.querySelector('label.iu-switch');
    expect(label).toBeTruthy();
    const mdSwitch = label.querySelector('md-switch');
    expect(mdSwitch).toBeTruthy();
  });

  it('should NOT render label span when label() is empty', () => {
    const span = fixture.nativeElement.querySelector('.iu-switch__label');
    expect(span).toBeNull();
  });

  it('should render label span BEFORE md-switch when label() is non-empty', () => {
    fixture.componentRef.setInput('label', 'Dark mode');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('label.iu-switch');
    const span = label.querySelector('.iu-switch__label');
    expect(span).toBeTruthy();
    expect(span.textContent.trim()).toBe('Dark mode');
    // Verify span comes BEFORE md-switch in the DOM
    const children = Array.from(label.children) as HTMLElement[];
    const spanIdx = children.indexOf(span);
    const switchIdx = children.findIndex((c) => c.tagName.toLowerCase() === 'md-switch');
    expect(spanIdx).toBeLessThan(switchIdx);
  });

  it('should set md-switch default properties (selected=false, disabled=false, icons=false)', () => {
    const el = fixture.nativeElement.querySelector('md-switch') as MdSwitchEl;
    expect(el.selected).toBeFalsy();
    expect(el.disabled).toBeFalsy();
    expect(el.icons).toBeFalsy();
  });

  it('should reflect selected/disabled/icons inputs onto md-switch properties', () => {
    fixture.componentRef.setInput('selected', true);
    fixture.componentRef.setInput('disabled', true);
    fixture.componentRef.setInput('icons', true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-switch') as MdSwitchEl;
    expect(el.selected).toBe(true);
    expect(el.disabled).toBe(true);
    expect(el.icons).toBe(true);
  });

  it('should NOT set aria-label attribute by default', () => {
    const el = fixture.nativeElement.querySelector('md-switch') as HTMLElement;
    expect(el.getAttribute('aria-label')).toBeNull();
  });

  it('should set aria-label attribute when ariaLabel input is provided', () => {
    fixture.componentRef.setInput('ariaLabel', 'Toggle notifications');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-switch') as HTMLElement;
    expect(el.getAttribute('aria-label')).toBe('Toggle notifications');
  });

  it('should emit change output with target.selected when md-switch dispatches change event', () => {
    const spy = jest.fn();
    component.change.subscribe(spy);
    const el = fixture.nativeElement.querySelector('md-switch') as MdSwitchEl;
    Object.defineProperty(el, 'selected', { value: true, configurable: true });
    el.dispatchEvent(new Event('change', { bubbles: true }));
    expect(spy).toHaveBeenCalledWith(true);
  });

  it('onChange handler should emit target.selected directly', () => {
    const spy = jest.fn();
    component.change.subscribe(spy);
    component.onChange({ target: { selected: false } } as unknown as Event);
    expect(spy).toHaveBeenCalledWith(false);
    component.onChange({ target: { selected: true } } as unknown as Event);
    expect(spy).toHaveBeenCalledWith(true);
  });
});
