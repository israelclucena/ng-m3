import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent, ButtonVariant, ButtonSize } from './button.component';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --- Defaults ---
  it('defaults variant to primary', () => {
    expect(component.variant()).toBe('primary');
  });

  it('defaults size to md', () => {
    expect(component.size()).toBe('md');
  });

  it('defaults disabled, loading, softDisabled, fullWidth, trailingIcon to false', () => {
    expect(component.disabled()).toBe(false);
    expect(component.loading()).toBe(false);
    expect(component.softDisabled()).toBe(false);
    expect(component.fullWidth()).toBe(false);
    expect(component.trailingIcon()).toBe(false);
  });

  it('defaults type to button', () => {
    expect(component.type()).toBe('button');
  });

  // --- hostClass tokens ---
  it('hostClass includes base, variant, size tokens', () => {
    fixture.componentRef.setInput('variant', 'primary');
    fixture.componentRef.setInput('size', 'md');
    fixture.detectChanges();
    expect(component.hostClass()).toContain('iu-btn');
    expect(component.hostClass()).toContain('iu-btn--primary');
    expect(component.hostClass()).toContain('iu-btn--md');
  });

  const variants: ButtonVariant[] = ['primary', 'secondary', 'outlined', 'elevated', 'text', 'danger', 'selected', 'ghost'];
  variants.forEach((variant) => {
    it(`hostClass includes variant token "${variant}"`, () => {
      fixture.componentRef.setInput('variant', variant);
      fixture.detectChanges();
      expect(component.hostClass()).toContain(`iu-btn--${variant}`);
    });
  });

  const sizes: ButtonSize[] = ['sm', 'md', 'lg'];
  sizes.forEach((size) => {
    it(`hostClass includes size token "${size}"`, () => {
      fixture.componentRef.setInput('size', size);
      fixture.detectChanges();
      expect(component.hostClass()).toContain(`iu-btn--${size}`);
    });
  });

  it('hostClass adds full-width modifier when fullWidth=true', () => {
    fixture.componentRef.setInput('fullWidth', true);
    fixture.detectChanges();
    expect(component.hostClass()).toContain('iu-btn--full-width');
  });

  it('hostClass adds loading modifier when loading=true', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(component.hostClass()).toContain('iu-btn--loading');
  });

  it('hostClass adds disabled modifier when disabled=true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(component.hostClass()).toContain('iu-btn--disabled');
  });

  it('hostClass adds soft-disabled when softDisabled or loading', () => {
    fixture.componentRef.setInput('softDisabled', true);
    fixture.detectChanges();
    expect(component.hostClass()).toContain('iu-btn--soft-disabled');

    fixture.componentRef.setInput('softDisabled', false);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(component.hostClass()).toContain('iu-btn--soft-disabled');
  });

  // --- Computeds ---
  it('isDisabled mirrors disabled input', () => {
    expect(component.isDisabled()).toBe(false);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(component.isDisabled()).toBe(true);
  });

  it('isSoftDisabled is true when softDisabled OR loading', () => {
    expect(component.isSoftDisabled()).toBe(false);

    fixture.componentRef.setInput('softDisabled', true);
    fixture.detectChanges();
    expect(component.isSoftDisabled()).toBe(true);

    fixture.componentRef.setInput('softDisabled', false);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(component.isSoftDisabled()).toBe(true);
  });

  it('hasIcon reflects icon input presence', () => {
    expect(component.hasIcon()).toBe(false);
    fixture.componentRef.setInput('icon', 'upload');
    fixture.detectChanges();
    expect(component.hasIcon()).toBe(true);
  });

  // --- Click handler ---
  it('emits clicked when enabled', () => {
    const spy = jest.fn();
    component.clicked.subscribe(spy);
    component.onClick(new MouseEvent('click'));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('does not emit clicked when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const spy = jest.fn();
    component.clicked.subscribe(spy);
    component.onClick(new MouseEvent('click'));
    expect(spy).not.toHaveBeenCalled();
  });

  it('does not emit clicked when softDisabled', () => {
    fixture.componentRef.setInput('softDisabled', true);
    fixture.detectChanges();
    const spy = jest.fn();
    component.clicked.subscribe(spy);
    component.onClick(new MouseEvent('click'));
    expect(spy).not.toHaveBeenCalled();
  });

  it('does not emit clicked when loading', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    const spy = jest.fn();
    component.clicked.subscribe(spy);
    component.onClick(new MouseEvent('click'));
    expect(spy).not.toHaveBeenCalled();
  });
});
