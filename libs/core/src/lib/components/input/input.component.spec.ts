import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputComponent } from './input.component';

describe('InputComponent', () => {
  let fixture: ComponentFixture<InputComponent>;
  let component: InputComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --- Defaults ---
  it('defaults variant to outlined and type to text', () => {
    expect(component.variant()).toBe('outlined');
    expect(component.type()).toBe('text');
  });

  it('defaults flags to false', () => {
    expect(component.disabled()).toBe(false);
    expect(component.required()).toBe(false);
    expect(component.fullWidth()).toBe(false);
  });

  it('defaults value to empty string', () => {
    expect(component.value()).toBe('');
  });

  // --- Computeds ---
  it('hasError reflects errorMessage', () => {
    expect(component.hasError()).toBe(false);
    fixture.componentRef.setInput('errorMessage', 'Campo obrigatório');
    fixture.detectChanges();
    expect(component.hasError()).toBe(true);
  });

  it('hasPrefix reflects prefixIcon', () => {
    expect(component.hasPrefix()).toBe(false);
    fixture.componentRef.setInput('prefixIcon', 'search');
    fixture.detectChanges();
    expect(component.hasPrefix()).toBe(true);
  });

  it('hasSuffix true when suffixIcon set OR type=password', () => {
    expect(component.hasSuffix()).toBe(false);
    fixture.componentRef.setInput('suffixIcon', 'close');
    fixture.detectChanges();
    expect(component.hasSuffix()).toBe(true);

    fixture.componentRef.setInput('suffixIcon', '');
    fixture.componentRef.setInput('type', 'password');
    fixture.detectChanges();
    expect(component.hasSuffix()).toBe(true);
  });

  it('hostClass includes base token and full-width modifier', () => {
    expect(component.hostClass()).toContain('iu-input');
    fixture.componentRef.setInput('fullWidth', true);
    fixture.detectChanges();
    expect(component.hostClass()).toContain('iu-input--full-width');
  });

  // --- Password toggle ---
  it('togglePassword flips showPassword signal', () => {
    expect(component.showPassword()).toBe(false);
    component.togglePassword();
    expect(component.showPassword()).toBe(true);
    component.togglePassword();
    expect(component.showPassword()).toBe(false);
  });

  it('effectiveType swaps password→text when revealed', () => {
    fixture.componentRef.setInput('type', 'password');
    fixture.detectChanges();
    expect(component.effectiveType()).toBe('password');
    component.togglePassword();
    expect(component.effectiveType()).toBe('text');
  });

  it('passwordIcon swaps based on visibility state', () => {
    fixture.componentRef.setInput('type', 'password');
    fixture.detectChanges();
    expect(component.passwordIcon()).toBe('visibility');
    component.togglePassword();
    expect(component.passwordIcon()).toBe('visibility_off');
  });

  // --- Handlers ---
  it('onInput updates the value model', () => {
    const target = { value: 'olá' } as HTMLInputElement;
    component.onInput({ target } as unknown as Event);
    expect(component.value()).toBe('olá');
  });

  it('onKeydown emits entered only on Enter', () => {
    const spy = jest.fn();
    component.entered.subscribe(spy);

    component.onKeydown({ key: 'a' } as KeyboardEvent);
    expect(spy).not.toHaveBeenCalled();

    const ev = { key: 'Enter' } as KeyboardEvent;
    component.onKeydown(ev);
    expect(spy).toHaveBeenCalledWith(ev);
  });

  it('onFocus emits focused', () => {
    const spy = jest.fn();
    component.focused.subscribe(spy);
    const ev = new FocusEvent('focus');
    component.onFocus(ev);
    expect(spy).toHaveBeenCalledWith(ev);
  });

  it('onBlur emits blurred', () => {
    const spy = jest.fn();
    component.blurred.subscribe(spy);
    const ev = new FocusEvent('blur');
    component.onBlur(ev);
    expect(spy).toHaveBeenCalledWith(ev);
  });
});
