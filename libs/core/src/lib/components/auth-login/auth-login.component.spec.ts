import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthLoginComponent } from './auth-login.component';
import { AuthService, AuthResult, LoginCredentials } from '../../services/auth.service';

describe('AuthLoginComponent', () => {
  let fixture: ComponentFixture<AuthLoginComponent>;
  let component: AuthLoginComponent;
  let mockAuth: {
    loading: ReturnType<typeof signal<boolean>>;
    authError: ReturnType<typeof signal<string | null>>;
    login: jest.Mock<Promise<AuthResult>, [LoginCredentials]>;
  };

  beforeEach(async () => {
    mockAuth = {
      loading: signal(false),
      authError: signal<string | null>(null),
      login: jest.fn(async () => ({ success: true })),
    };

    await TestBed.configureTestingModule({
      imports: [AuthLoginComponent],
      providers: [{ provide: AuthService, useValue: mockAuth }],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the brand block with logo icon and name', () => {
    const brand = fixture.nativeElement.querySelector('.iu-al__brand') as HTMLElement;
    expect(brand).toBeTruthy();
    expect(brand.textContent).toContain('home_work');
    expect(brand.textContent).toContain('LisboaRent');
  });

  it('renders the title and subtitle in Portuguese', () => {
    const title = fixture.nativeElement.querySelector('.iu-al__title') as HTMLElement;
    const subtitle = fixture.nativeElement.querySelector('.iu-al__subtitle') as HTMLElement;
    expect(title.textContent?.trim()).toBe('Bem-vindo de volta');
    expect(subtitle.textContent?.trim()).toBe('Inicie sessão para aceder à sua conta');
  });

  it('does not render the error banner when authError is null', () => {
    expect(fixture.nativeElement.querySelector('.iu-al__error-banner')).toBeNull();
  });

  it('renders the error banner when authError signal is set', () => {
    mockAuth.authError.set('Credenciais inválidas');
    fixture.detectChanges();
    const banner = fixture.nativeElement.querySelector('.iu-al__error-banner') as HTMLElement;
    expect(banner).toBeTruthy();
    expect(banner.getAttribute('role')).toBe('alert');
    expect(banner.textContent).toContain('Credenciais inválidas');
  });

  it('renders email and password fields with proper labels', () => {
    const labels = fixture.nativeElement.querySelectorAll('.iu-al__label');
    expect(labels.length).toBe(2);
    expect(labels[0].textContent?.trim()).toBe('Email');
    expect(labels[1].textContent?.trim()).toBe('Password');
  });

  it('renders the password input as type="password" by default', () => {
    const pwInput = fixture.nativeElement.querySelector('#al-password') as HTMLInputElement;
    expect(pwInput.type).toBe('password');
  });

  it('toggles password visibility when the toggle button is clicked', () => {
    const toggle = fixture.nativeElement.querySelector('.iu-al__toggle-pw') as HTMLButtonElement;
    expect(component.showPassword()).toBe(false);
    toggle.click();
    fixture.detectChanges();
    expect(component.showPassword()).toBe(true);
    const pwInput = fixture.nativeElement.querySelector('#al-password') as HTMLInputElement;
    expect(pwInput.type).toBe('text');
  });

  it('updates the toggle button aria-label based on showPassword state', () => {
    const toggle = fixture.nativeElement.querySelector('.iu-al__toggle-pw') as HTMLButtonElement;
    expect(toggle.getAttribute('aria-label')).toBe('Mostrar password');
    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-label')).toBe('Esconder password');
  });

  it('toggles the "remember me" signal when the checkbox is changed', () => {
    const checkbox = fixture.nativeElement.querySelector('.iu-al__checkbox') as HTMLInputElement;
    expect(component.rememberMe()).toBe(false);
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(component.rememberMe()).toBe(true);
  });

  it('updates the email form field via the input event', () => {
    const emailInput = fixture.nativeElement.querySelector('#al-email') as HTMLInputElement;
    emailInput.value = 'user@example.com';
    emailInput.dispatchEvent(new Event('input'));
    expect(component.form.fields['email'].value()).toBe('user@example.com');
  });

  it('updates the password form field via the input event', () => {
    const pwInput = fixture.nativeElement.querySelector('#al-password') as HTMLInputElement;
    pwInput.value = 'secret123';
    pwInput.dispatchEvent(new Event('input'));
    expect(component.form.fields['password'].value()).toBe('secret123');
  });

  it('does not show field errors until the field is touched', () => {
    expect(fixture.nativeElement.querySelector('.iu-al__field-error')).toBeNull();
  });

  it('shows the email field error after the email field is blurred while empty', () => {
    const emailInput = fixture.nativeElement.querySelector('#al-email') as HTMLInputElement;
    emailInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    const errors = fixture.nativeElement.querySelectorAll('.iu-al__field-error');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].textContent).toContain('Email é obrigatório.');
  });

  it('shows the password field error after the password field is blurred while empty', () => {
    const pwInput = fixture.nativeElement.querySelector('#al-password') as HTMLInputElement;
    pwInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    const errors = fixture.nativeElement.querySelectorAll('.iu-al__field-error');
    expect(errors[errors.length - 1].textContent).toContain('Password é obrigatória.');
  });

  it('applies the error modifier class on the email input when its error is showing', () => {
    const emailInput = fixture.nativeElement.querySelector('#al-email') as HTMLInputElement;
    emailInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(emailInput.classList.contains('iu-al__input--error')).toBe(true);
  });

  it('disables the submit button while the form is invalid', () => {
    const submit = fixture.nativeElement.querySelector('.iu-al__submit') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
  });

  it('enables the submit button when the form is valid', () => {
    component.form.fields['email'].setValue('user@example.com');
    component.form.fields['password'].setValue('secret123');
    fixture.detectChanges();
    const submit = fixture.nativeElement.querySelector('.iu-al__submit') as HTMLButtonElement;
    expect(submit.disabled).toBe(false);
  });

  it('disables the inputs and submit when loading() is true', () => {
    mockAuth.loading.set(true);
    fixture.detectChanges();
    const emailInput = fixture.nativeElement.querySelector('#al-email') as HTMLInputElement;
    const pwInput = fixture.nativeElement.querySelector('#al-password') as HTMLInputElement;
    const submit = fixture.nativeElement.querySelector('.iu-al__submit') as HTMLButtonElement;
    expect(emailInput.disabled).toBe(true);
    expect(pwInput.disabled).toBe(true);
    expect(submit.disabled).toBe(true);
  });

  it('renders the spinner and "A entrar..." label while loading', () => {
    mockAuth.loading.set(true);
    fixture.detectChanges();
    const submit = fixture.nativeElement.querySelector('.iu-al__submit') as HTMLElement;
    expect(submit.querySelector('.iu-al__spinner')).toBeTruthy();
    expect(submit.textContent).toContain('A entrar...');
  });

  it('renders the "Entrar" label with login icon when not loading', () => {
    const submit = fixture.nativeElement.querySelector('.iu-al__submit') as HTMLElement;
    expect(submit.textContent).toContain('Entrar');
    expect(submit.textContent).toContain('login');
    expect(submit.querySelector('.iu-al__spinner')).toBeNull();
  });

  it('emits forgotPassword when the "Esqueci a password" link is clicked', () => {
    const spy = jest.fn();
    component.forgotPassword.subscribe(spy);
    const links = fixture.nativeElement.querySelectorAll('.iu-al__link');
    (links[0] as HTMLButtonElement).click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('emits registerRequested when the "Registar agora" link is clicked', () => {
    const spy = jest.fn();
    component.registerRequested.subscribe(spy);
    const links = fixture.nativeElement.querySelectorAll('.iu-al__link');
    (links[links.length - 1] as HTMLButtonElement).click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('renders the footer prompt about not having an account', () => {
    const footer = fixture.nativeElement.querySelector('.iu-al__footer') as HTMLElement;
    expect(footer.textContent).toContain('Não tem conta?');
    expect(footer.textContent).toContain('Registar agora');
  });

  it('does not call auth.login when onSubmit is invoked with invalid form', async () => {
    await component.onSubmit();
    expect(mockAuth.login).not.toHaveBeenCalled();
  });

  it('calls auth.login with the credential payload when form is valid', async () => {
    component.form.fields['email'].setValue('user@example.com');
    component.form.fields['password'].setValue('secret123');
    component.rememberMe.set(true);
    await component.onSubmit();
    expect(mockAuth.login).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret123',
      rememberMe: true,
    });
  });

  it('emits loginSuccess when auth.login resolves successfully', async () => {
    const spy = jest.fn();
    component.loginSuccess.subscribe(spy);
    component.form.fields['email'].setValue('user@example.com');
    component.form.fields['password'].setValue('secret123');
    await component.onSubmit();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('does not emit loginSuccess when auth.login resolves with failure', async () => {
    mockAuth.login.mockResolvedValueOnce({ success: false, error: 'bad creds' });
    const spy = jest.fn();
    component.loginSuccess.subscribe(spy);
    component.form.fields['email'].setValue('user@example.com');
    component.form.fields['password'].setValue('secret123');
    await component.onSubmit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('passes rememberMe=false by default in the credentials payload', async () => {
    component.form.fields['email'].setValue('user@example.com');
    component.form.fields['password'].setValue('secret123');
    await component.onSubmit();
    expect(mockAuth.login).toHaveBeenCalledWith(
      expect.objectContaining({ rememberMe: false }),
    );
  });

  it('marks the form as submitted (touching all fields) when onSubmit fails validation', async () => {
    await component.onSubmit();
    fixture.detectChanges();
    const errors = fixture.nativeElement.querySelectorAll('.iu-al__field-error');
    expect(errors.length).toBe(2);
  });

  it('prevents default on the form submit event', () => {
    const form = fixture.nativeElement.querySelector('.iu-al__form') as HTMLFormElement;
    const evt = new Event('submit', { cancelable: true });
    form.dispatchEvent(evt);
    expect(evt.defaultPrevented).toBe(true);
  });

  it('reflects updated authError text when the service signal changes', () => {
    mockAuth.authError.set('Erro inicial');
    fixture.detectChanges();
    let banner = fixture.nativeElement.querySelector('.iu-al__error-banner') as HTMLElement;
    expect(banner.textContent).toContain('Erro inicial');

    mockAuth.authError.set('Outro erro');
    fixture.detectChanges();
    banner = fixture.nativeElement.querySelector('.iu-al__error-banner') as HTMLElement;
    expect(banner.textContent).toContain('Outro erro');
  });

  it('shows the email-invalid error after typing an invalid email and blurring', () => {
    const emailInput = fixture.nativeElement.querySelector('#al-email') as HTMLInputElement;
    emailInput.value = 'not-an-email';
    emailInput.dispatchEvent(new Event('input'));
    emailInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    const errors = fixture.nativeElement.querySelectorAll('.iu-al__field-error');
    expect(errors[0].textContent).toContain('Email inválido.');
  });

  it('shows the password min-length error when password is too short and blurred', () => {
    const pwInput = fixture.nativeElement.querySelector('#al-password') as HTMLInputElement;
    pwInput.value = 'abc';
    pwInput.dispatchEvent(new Event('input'));
    pwInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    const errors = fixture.nativeElement.querySelectorAll('.iu-al__field-error');
    expect(errors[errors.length - 1].textContent).toContain('Mínimo 6 caracteres.');
  });
});
