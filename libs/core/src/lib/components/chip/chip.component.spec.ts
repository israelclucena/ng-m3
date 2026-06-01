import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChipComponent, ChipVariant } from './chip.component';

describe('ChipComponent', () => {
  let fixture: ComponentFixture<ChipComponent>;
  let component: ChipComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ChipComponent] }).compileComponents();
    fixture = TestBed.createComponent(ChipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --- Defaults ---
  it('defaults variant to assist and other inputs to falsy/empty', () => {
    expect(component.variant()).toBe('assist');
    expect(component.label()).toBe('');
    expect(component.elevated()).toBe(false);
    expect(component.disabled()).toBe(false);
    expect(component.selected()).toBe(false);
    expect(component.removable()).toBe(false);
    expect(component.icon()).toBe('');
    expect(component.ariaLabel()).toBe('');
  });

  // --- hasIcon computed ---
  it('hasIcon is false when icon input is empty', () => {
    expect(component.hasIcon()).toBe(false);
  });

  it('hasIcon is true when icon input is set', () => {
    fixture.componentRef.setInput('icon', 'star');
    fixture.detectChanges();
    expect(component.hasIcon()).toBe(true);
  });

  // --- hostClass composition ---
  it('hostClass includes base and variant tokens by default', () => {
    expect(component.hostClass()).toContain('iu-chip');
    expect(component.hostClass()).toContain('iu-chip--assist');
  });

  const variants: ChipVariant[] = ['assist', 'filter', 'input', 'suggestion'];
  variants.forEach((variant) => {
    it(`hostClass includes variant token "${variant}"`, () => {
      fixture.componentRef.setInput('variant', variant);
      fixture.detectChanges();
      expect(component.hostClass()).toContain(`iu-chip--${variant}`);
    });
  });

  it('hostClass adds elevated modifier when elevated=true', () => {
    fixture.componentRef.setInput('elevated', true);
    fixture.detectChanges();
    expect(component.hostClass()).toContain('iu-chip--elevated');
  });

  it('hostClass adds disabled modifier when disabled=true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(component.hostClass()).toContain('iu-chip--disabled');
  });

  it('hostClass adds selected modifier when selected=true', () => {
    fixture.componentRef.setInput('selected', true);
    fixture.detectChanges();
    expect(component.hostClass()).toContain('iu-chip--selected');
  });

  it('hostClass omits modifier tokens when their inputs are false', () => {
    const cls = component.hostClass();
    expect(cls).not.toContain('iu-chip--elevated');
    expect(cls).not.toContain('iu-chip--disabled');
    expect(cls).not.toContain('iu-chip--selected');
  });

  // --- Event handlers ---
  it('onClick emits chipClick when not disabled', () => {
    const spy = jest.fn();
    component.chipClick.subscribe(spy);
    component.onClick();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('onClick does NOT emit chipClick when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const spy = jest.fn();
    component.chipClick.subscribe(spy);
    component.onClick();
    expect(spy).not.toHaveBeenCalled();
  });

  it('onRemoved emits removed event', () => {
    const spy = jest.fn();
    component.removed.subscribe(spy);
    component.onRemoved();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('onSelected emits selectedChange with target.selected value (true)', () => {
    const spy = jest.fn();
    component.selectedChange.subscribe(spy);
    const target = document.createElement('div') as HTMLElement & { selected?: boolean };
    target.selected = true;
    const event = { target } as unknown as Event;
    component.onSelected(event);
    expect(spy).toHaveBeenCalledWith(true);
  });

  it('onSelected emits false when target.selected is undefined', () => {
    const spy = jest.fn();
    component.selectedChange.subscribe(spy);
    const target = document.createElement('div');
    const event = { target } as unknown as Event;
    component.onSelected(event);
    expect(spy).toHaveBeenCalledWith(false);
  });
});
