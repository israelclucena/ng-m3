import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ButtonComponent, ButtonVariant, ButtonSize } from './button.component';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;
  let nativeButton: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    nativeButton = fixture.debugElement.query(By.css('button')).nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --- Defaults ---
  it('should have default variant "primary"', () => {
    expect(component.variant()).toBe('primary');
    expect(nativeButton.classList).toContain('iu-button--primary');
  });

  it('should have default size "md"', () => {
    expect(component.size()).toBe('md');
    expect(nativeButton.classList).toContain('iu-button--md');
  });

  it('should not be disabled by default', () => {
    expect(component.disabled()).toBe(false);
    expect(nativeButton.disabled).toBe(false);
  });

  it('should not be loading by default', () => {
    expect(component.loading()).toBe(false);
  });

  // --- Variants ---
  const variants: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger'];
  variants.forEach((variant) => {
    it(`should apply variant class for "${variant}"`, () => {
      fixture.componentRef.setInput('variant', variant);
      fixture.detectChanges();
      expect(nativeButton.classList).toContain(`iu-button--${variant}`);
    });
  });

  // --- Sizes ---
  const sizes: ButtonSize[] = ['sm', 'md', 'lg'];
  sizes.forEach((size) => {
    it(`should apply size class for "${size}"`, () => {
      fixture.componentRef.setInput('size', size);
      fixture.detectChanges();
      expect(nativeButton.classList).toContain(`iu-button--${size}`);
    });
  });

  // --- Disabled ---
  it('should be disabled when disabled=true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(nativeButton.disabled).toBe(true);
    expect(nativeButton.getAttribute('aria-disabled')).toBe('true');
    expect(nativeButton.classList).toContain('iu-button--disabled');
  });

  it('should not emit click event when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const clickSpy = jest.fn();
    component.clicked.subscribe(clickSpy);

    nativeButton.click();
    expect(clickSpy).not.toHaveBeenCalled();
  });

  // --- Loading ---
  it('should show spinner and hide label when loading', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const spinner = fixture.debugElement.query(By.css('mat-spinner'));
    const label = fixture.debugElement.query(By.css('.iu-button__label'));

    expect(spinner).toBeTruthy();
    expect(label.nativeElement.classList).toContain('iu-button__label--hidden');
  });

  it('should be disabled when loading=true (isDisabled computed)', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(component.isDisabled()).toBe(true);
    expect(nativeButton.disabled).toBe(true);
  });

  it('should not emit click when loading', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const clickSpy = jest.fn();
    component.clicked.subscribe(clickSpy);

    nativeButton.click();
    expect(clickSpy).not.toHaveBeenCalled();
  });

  // --- Click ---
  it('should emit clicked event on click', () => {
    const clickSpy = jest.fn();
    component.clicked.subscribe(clickSpy);

    nativeButton.click();
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledWith(expect.any(MouseEvent));
  });

  // --- ARIA ---
  it('should set aria-label when provided', () => {
    fixture.componentRef.setInput('ariaLabel', 'Confirmar ação');
    fixture.detectChanges();
    expect(nativeButton.getAttribute('aria-label')).toBe('Confirmar ação');
  });

  it('should not set aria-label attribute when not provided', () => {
    expect(nativeButton.getAttribute('aria-label')).toBeNull();
  });

  it('should set aria-busy when loading', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(nativeButton.getAttribute('aria-busy')).toBe('true');
  });

  // --- Full width ---
  it('should apply full-width class when fullWidth=true', () => {
    fixture.componentRef.setInput('fullWidth', true);
    fixture.detectChanges();
    expect(nativeButton.classList).toContain('iu-button--full-width');
  });

  // --- Type ---
  it('should use type="button" by default', () => {
    expect(nativeButton.type).toBe('button');
  });

  it('should pass type="submit" to native button', () => {
    fixture.componentRef.setInput('type', 'submit');
    fixture.detectChanges();
    expect(nativeButton.type).toBe('submit');
  });

  // --- Spinner diameter ---
  it('should compute correct spinner diameter per size', () => {
    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();
    expect(component.spinnerDiameter()).toBe(14);

    fixture.componentRef.setInput('size', 'md');
    fixture.detectChanges();
    expect(component.spinnerDiameter()).toBe(18);

    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();
    expect(component.spinnerDiameter()).toBe(22);
  });
});
