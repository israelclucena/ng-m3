import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthRegisterComponent } from './auth-register.component';
import { AuthService, AuthResult, RegisterData } from '../../services/auth.service';

describe('AuthRegisterComponent', () => {
  let fixture: ComponentFixture<AuthRegisterComponent>;
  let component: AuthRegisterComponent;
  let mockAuth: {
    loading: ReturnType<typeof signal<boolean>>;
    authError: ReturnType<typeof signal<string | null>>;
    register: jest.Mock<Promise<AuthResult>, [RegisterData]>;
  };

  beforeEach(async () => {
    mockAuth = {
      loading: signal(false),
      authError: signal<string | null>(null),
      register: jest.fn(async () => ({ success: true })),
    };

    await TestBed.configureTestingModule({
      imports: [AuthRegisterComponent],
      providers: [{ provide: AuthService, useValue: mockAuth }],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the brand block with logo icon and name', () => {
    const brand = fixture.nativeElement.querySelector('.iu-ar__brand') as HTMLElement;
    expect(brand).toBeTruthy();
    expect(brand.textContent).toContain('home_work');
    expect(brand.textContent).toContain('LisboaRent');
  });

  it('renders the title and subtitle in Portuguese', () => {
    const title = fixture.nativeElement.querySelector('.iu-ar__title') as HTMLElement;
    const subtitle = fixture.nativeElement.querySelector('.iu-ar__subtitle') as HTMLElement;
    expect(title.textContent?.trim()).toBe('Criar conta');
    expect(subtitle.textContent).toContain('Junte-se');
  });

  it('does not render the error banner when authError is null', () => {
    expect(fixture.nativeElement.querySelector('.iu-ar__error-banner')).toBeNull();
  });

  it('renders the error banner when authError signal is set', () => {
    mockAuth.authError.set('Falha no registo');
    fixture.detectChanges();
    const banner = fixture.nativeElement.querySelector('.iu-ar__error-banner') as HTMLElement;
    expect(banner).toBeTruthy();
    expect(banner.getAttribute('role')).toBe('alert');
    expect(banner.textContent).toContain('Falha no registo');
  });

  it('renders two role buttons (Inquilino + Proprietário)', () => {
    const roleBtns = fixture.nativeElement.querySelectorAll('.iu-ar__role-btn');
    expect(roleBtns.length).toBe(2);
    expect(roleBtns[0].textContent).toContain('Inquilino');
    expect(roleBtns[1].textContent).toContain('Proprietário');
  });

  it('defaults the role to "tenant" and marks the Inquilino button active', () => {
    expect(component.role()).toBe('tenant');
    const roleBtns = fixture.nativeElement.querySelectorAll('.iu-ar__role-btn');
    expect(roleBtns[0].classList.contains('iu-ar__role-btn--active')).toBe(true);
    expect(roleBtns[1].classList.contains('iu-ar__role-btn--active')).toBe(false);
  });

  it('switches role to "landlord" when the Proprietário button is clicked', () => {
    const roleBtns = fixture.nativeElement.querySelectorAll('.iu-ar__role-btn');
    (roleBtns[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.role()).toBe('landlord');
    expect(roleBtns[1].classList.contains('iu-ar__role-btn--active')).toBe(true);
  });

  it('renders all four field labels in Portuguese', () => {
    const labels = fixture.nativeElement.querySelectorAll('.iu-ar__label');
    expect(labels.length).toBe(4);
    expect(labels[0].textContent?.trim()).toBe('Nome completo');
    expect(labels[1].textContent?.trim()).toBe('Email');
    expect(labels[2].textContent?.trim()).toBe('Password');
    expect(labels[3].textContent?.trim()).toBe('Confirmar password');
  });

  it('renders the password input as type="password" by default', () => {
    const pwInput = fixture.nativeElement.querySelector('#ar-password') as HTMLInputElement;
    expect(pwInput.type).toBe('password');
  });

  it('toggles password visibility when the toggle button is clicked', () => {
    const toggle = fixture.nativeElement.querySelector('.iu-ar__toggle-pw') as HTMLButtonElement;
    expect(component.showPassword()).toBe(false);
    toggle.click();
    fixture.detectChanges();
    expect(component.showPassword()).toBe(true);
    const pwInput = fixture.nativeElement.querySelector('#ar-password') as HTMLInputElement;
    const confirmInput = fixture.nativeElement.querySelector('#ar-confirm') as HTMLInputElement;
    expect(pwInput.type).toBe('text');
    expect(confirmInput.type).toBe('text');
  });

  it('updates the toggle button aria-label based on showPassword state', () => {
    const toggle = fixture.nativeElement.querySelector('.iu-ar__toggle-pw') as HTMLButtonElement;
    expect(toggle.getAttribute('aria-label')).toBe('Mostrar password');
    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-label')).toBe('Esconder password');
  });

  it('updates the name form field via the input event', () => {
    const input = fixture.nativeElement.querySelector('#ar-name') as HTMLInputElement;
    input.value = 'Ana Silva';
    input.dispatchEvent(new Event('input'));
    expect(component.form.fields['name'].value()).toBe('Ana Silva');
  });

  it('updates the email form field via the input event', () => {
    const input = fixture.nativeElement.querySelector('#ar-email') as HTMLInputElement;
    input.value = 'user@example.com';
    input.dispatchEvent(new Event('input'));
    expect(component.form.fields['email'].value()).toBe('user@example.com');
  });

  it('updates the password form field via the input event', () => {
    const input = fixture.nativeElement.querySelector('#ar-password') as HTMLInputElement;
    input.value = 'Secret123';
    input.dispatchEvent(new Event('input'));
    expect(component.form.fields['password'].value()).toBe('Secret123');
  });

  it('updates the confirmVal signal via the confirm input event', () => {
    const input = fixture.nativeElement.querySelector('#ar-confirm') as HTMLInputElement;
    input.value = 'Secret123';
    input.dispatchEvent(new Event('input'));
    expect(component.confirmVal()).toBe('Secret123');
  });

  it('toggles acceptedTerms when the checkbox is changed', () => {
    const checkbox = fixture.nativeElement.querySelector('.iu-ar__checkbox') as HTMLInputElement;
    expect(component.acceptedTerms()).toBe(false);
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(component.acceptedTerms()).toBe(true);
  });

  it('does not show field errors until the field is touched', () => {
    expect(fixture.nativeElement.querySelector('.iu-ar__field-error')).toBeNull();
  });

  it('shows the name error after the name field is blurred while empty', () => {
    const input = fixture.nativeElement.querySelector('#ar-name') as HTMLInputElement;
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    const errors = fixture.nativeElement.querySelectorAll('.iu-ar__field-error');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].textContent).toContain('Nome é obrigatório.');
  });

  it('shows the email-invalid error after typing an invalid email and blurring', () => {
    const input = fixture.nativeElement.querySelector('#ar-email') as HTMLInputElement;
    input.value = 'not-an-email';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    const errors = fixture.nativeElement.querySelectorAll('.iu-ar__field-error');
    expect(Array.from(errors).some(e => e.textContent?.includes('Email inválido.'))).toBe(true);
  });

  it('shows the password min-length error when password is too short and blurred', () => {
    const input = fixture.nativeElement.querySelector('#ar-password') as HTMLInputElement;
    input.value = 'abc';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    const errors = fixture.nativeElement.querySelectorAll('.iu-ar__field-error');
    expect(Array.from(errors).some(e => e.textContent?.includes('Mínimo 8 caracteres.'))).toBe(true);
  });

  it('applies the error modifier class on the email input when its error is showing', () => {
    const input = fixture.nativeElement.querySelector('#ar-email') as HTMLInputElement;
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(input.classList.contains('iu-ar__input--error')).toBe(true);
  });

  it('does not render the strength bar when password is empty', () => {
    expect(fixture.nativeElement.querySelector('.iu-ar__strength')).toBeNull();
  });

  it('renders the strength bar with 4 segments when a password is typed', () => {
    component.form.fields['password'].setValue('a');
    fixture.detectChanges();
    const bars = fixture.nativeElement.querySelectorAll('.iu-ar__strength-bar');
    expect(bars.length).toBe(4);
  });

  it('computes passwordStrength=0 for empty password and "Muito fraca" label', () => {
    expect(component.passwordStrength()).toBe(0);
    expect(component.strengthLabel()).toBe('Muito fraca');
  });

  it('computes passwordStrength based on length, uppercase, digits, and symbols', () => {
    component.form.fields['password'].setValue('abcdefgh'); // length only
    expect(component.passwordStrength()).toBe(1);
    component.form.fields['password'].setValue('Abcdefgh'); // length + upper
    expect(component.passwordStrength()).toBe(2);
    component.form.fields['password'].setValue('Abcdefg1'); // length + upper + digit
    expect(component.passwordStrength()).toBe(3);
    component.form.fields['password'].setValue('Abcdefg1!'); // all four
    expect(component.passwordStrength()).toBe(4);
  });

  it('maps strength levels to the correct Portuguese label', () => {
    component.form.fields['password'].setValue('abcdefgh');
    expect(component.strengthLabel()).toBe('Fraca');
    component.form.fields['password'].setValue('Abcdefgh');
    expect(component.strengthLabel()).toBe('Razoável');
    component.form.fields['password'].setValue('Abcdefg1');
    expect(component.strengthLabel()).toBe('Boa');
    component.form.fields['password'].setValue('Abcdefg1!');
    expect(component.strengthLabel()).toBe('Forte');
  });

  it('maps strength levels to colours (weak=red, mid=orange, strong=green)', () => {
    component.form.fields['password'].setValue('a');
    expect(component.strengthColor()).toBe('#b3261e');
    component.form.fields['password'].setValue('Abcdefgh');
    expect(component.strengthColor()).toBe('#e65100');
    component.form.fields['password'].setValue('Abcdefg1');
    expect(component.strengthColor()).toBe('#2e7d32');
    component.form.fields['password'].setValue('Abcdefg1!');
    expect(component.strengthColor()).toBe('#1b5e20');
  });

  it('shows the confirm-password error when confirm is empty and touched', () => {
    component.confirmTouched.set(true);
    fixture.detectChanges();
    const errors = fixture.nativeElement.querySelectorAll('.iu-ar__field-error');
    expect(Array.from(errors).some(e => e.textContent?.includes('Confirme a password.'))).toBe(true);
  });

  it('shows the password-mismatch error when confirm differs from password', () => {
    component.form.fields['password'].setValue('Secret123');
    component.confirmVal.set('Different1');
    component.confirmTouched.set(true);
    fixture.detectChanges();
    expect(component.confirmError()).toBe('As passwords não coincidem.');
    const errors = fixture.nativeElement.querySelectorAll('.iu-ar__field-error');
    expect(Array.from(errors).some(e => e.textContent?.includes('As passwords não coincidem.'))).toBe(true);
  });

  it('returns no confirm error when confirm matches password', () => {
    component.form.fields['password'].setValue('Secret123');
    component.confirmVal.set('Secret123');
    expect(component.confirmError()).toBe('');
  });

  it('disables the submit button while the form is invalid', () => {
    const submit = fixture.nativeElement.querySelector('.iu-ar__submit') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
  });

  it('enables the submit button when all fields are valid, terms accepted, and passwords match', () => {
    component.form.fields['name'].setValue('Ana Silva');
    component.form.fields['email'].setValue('ana@example.com');
    component.form.fields['password'].setValue('Secret123');
    component.confirmVal.set('Secret123');
    component.acceptedTerms.set(true);
    fixture.detectChanges();
    const submit = fixture.nativeElement.querySelector('.iu-ar__submit') as HTMLButtonElement;
    expect(submit.disabled).toBe(false);
  });

  it('keeps the submit button disabled when terms are not accepted', () => {
    component.form.fields['name'].setValue('Ana Silva');
    component.form.fields['email'].setValue('ana@example.com');
    component.form.fields['password'].setValue('Secret123');
    component.confirmVal.set('Secret123');
    component.acceptedTerms.set(false);
    fixture.detectChanges();
    const submit = fixture.nativeElement.querySelector('.iu-ar__submit') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
  });

  it('disables all inputs and the submit when loading() is true', () => {
    mockAuth.loading.set(true);
    fixture.detectChanges();
    const name = fixture.nativeElement.querySelector('#ar-name') as HTMLInputElement;
    const email = fixture.nativeElement.querySelector('#ar-email') as HTMLInputElement;
    const pw = fixture.nativeElement.querySelector('#ar-password') as HTMLInputElement;
    const confirm = fixture.nativeElement.querySelector('#ar-confirm') as HTMLInputElement;
    const submit = fixture.nativeElement.querySelector('.iu-ar__submit') as HTMLButtonElement;
    expect(name.disabled).toBe(true);
    expect(email.disabled).toBe(true);
    expect(pw.disabled).toBe(true);
    expect(confirm.disabled).toBe(true);
    expect(submit.disabled).toBe(true);
  });

  it('renders the spinner and "A criar conta..." label while loading', () => {
    mockAuth.loading.set(true);
    fixture.detectChanges();
    const submit = fixture.nativeElement.querySelector('.iu-ar__submit') as HTMLElement;
    expect(submit.querySelector('.iu-ar__spinner')).toBeTruthy();
    expect(submit.textContent).toContain('A criar conta...');
  });

  it('renders the "Criar conta" label with person_add icon when not loading', () => {
    const submit = fixture.nativeElement.querySelector('.iu-ar__submit') as HTMLElement;
    expect(submit.textContent).toContain('Criar conta');
    expect(submit.textContent).toContain('person_add');
    expect(submit.querySelector('.iu-ar__spinner')).toBeNull();
  });

  it('renders the footer prompt about already having an account', () => {
    const footer = fixture.nativeElement.querySelector('.iu-ar__footer') as HTMLElement;
    expect(footer.textContent).toContain('Já tem conta?');
    expect(footer.textContent).toContain('Entrar agora');
  });

  it('emits loginRequested when the "Entrar agora" link is clicked', () => {
    const spy = jest.fn();
    component.loginRequested.subscribe(spy);
    const link = fixture.nativeElement.querySelector('.iu-ar__link-btn') as HTMLButtonElement;
    link.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('does not call auth.register when onSubmit is invoked with invalid form', async () => {
    await component.onSubmit();
    expect(mockAuth.register).not.toHaveBeenCalled();
  });

  it('marks all fields touched and shows errors after a failed submit', async () => {
    await component.onSubmit();
    fixture.detectChanges();
    const errors = fixture.nativeElement.querySelectorAll('.iu-ar__field-error');
    // 3 form fields (name/email/password) + 1 confirm = 4 errors visible
    expect(errors.length).toBeGreaterThanOrEqual(4);
  });

  it('does not call auth.register when terms are not accepted even with valid form', async () => {
    component.form.fields['name'].setValue('Ana');
    component.form.fields['email'].setValue('ana@example.com');
    component.form.fields['password'].setValue('Secret123');
    component.confirmVal.set('Secret123');
    component.acceptedTerms.set(false);
    await component.onSubmit();
    expect(mockAuth.register).not.toHaveBeenCalled();
  });

  it('calls auth.register with lowercased email and current role when valid', async () => {
    component.form.fields['name'].setValue('Ana Silva');
    component.form.fields['email'].setValue('Ana@example.com');
    component.form.fields['password'].setValue('Secret123');
    component.confirmVal.set('Secret123');
    component.acceptedTerms.set(true);
    component.role.set('landlord');
    await component.onSubmit();
    expect(mockAuth.register).toHaveBeenCalledWith({
      name: 'Ana Silva',
      email: 'ana@example.com',
      password: 'Secret123',
      role: 'landlord',
    });
  });

  it('emits registerSuccess and sets isSuccess when register resolves successfully', async () => {
    const spy = jest.fn();
    component.registerSuccess.subscribe(spy);
    component.form.fields['name'].setValue('Ana');
    component.form.fields['email'].setValue('ana@example.com');
    component.form.fields['password'].setValue('Secret123');
    component.confirmVal.set('Secret123');
    component.acceptedTerms.set(true);
    await component.onSubmit();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(component.isSuccess()).toBe(true);
  });

  it('does not emit registerSuccess and stays on form when register fails', async () => {
    mockAuth.register.mockResolvedValueOnce({ success: false, error: 'taken' });
    const spy = jest.fn();
    component.registerSuccess.subscribe(spy);
    component.form.fields['name'].setValue('Ana');
    component.form.fields['email'].setValue('ana@example.com');
    component.form.fields['password'].setValue('Secret123');
    component.confirmVal.set('Secret123');
    component.acceptedTerms.set(true);
    await component.onSubmit();
    expect(spy).not.toHaveBeenCalled();
    expect(component.isSuccess()).toBe(false);
  });

  it('renders the success state with greeting and hides the form when isSuccess is true', () => {
    component.form.fields['name'].setValue('Ana');
    component.isSuccess.set(true);
    fixture.detectChanges();
    const success = fixture.nativeElement.querySelector('.iu-ar__success') as HTMLElement;
    expect(success).toBeTruthy();
    expect(success.textContent).toContain('Conta criada!');
    expect(success.textContent).toContain('Bem-vindo, Ana!');
    // form hidden
    expect(fixture.nativeElement.querySelector('.iu-ar__form')).toBeNull();
  });

  it('emits loginRequested when the success-state "Ir para o início" button is clicked', () => {
    component.isSuccess.set(true);
    fixture.detectChanges();
    const spy = jest.fn();
    component.loginRequested.subscribe(spy);
    const btn = fixture.nativeElement.querySelector('.iu-ar__success .iu-ar__submit') as HTMLButtonElement;
    btn.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('prevents default on the form submit event', () => {
    const form = fixture.nativeElement.querySelector('.iu-ar__form') as HTMLFormElement;
    const evt = new Event('submit', { cancelable: true });
    form.dispatchEvent(evt);
    expect(evt.defaultPrevented).toBe(true);
  });
});
