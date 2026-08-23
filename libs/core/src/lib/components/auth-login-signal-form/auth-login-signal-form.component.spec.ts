import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthLoginSignalFormComponent } from './auth-login-signal-form.component';
import { AuthLoginComponent } from '../auth-login/auth-login.component';
import { AuthService, AuthResult, LoginCredentials } from '../../services/auth.service';

/**
 * Specs for {@link AuthLoginSignalFormComponent} — the official-`form()` twin of
 * {@link AuthLoginComponent}.
 *
 * The suite drives the **public contract only** (DOM inputs + the real
 * `[formField]` two-way binding + the outputs), never the protected field tree,
 * and closes with a **parity block** that runs the same inputs through *both*
 * components and asserts they hand `AuthService.login` an identical payload.
 */
describe('AuthLoginSignalFormComponent', () => {
  let fixture: ComponentFixture<AuthLoginSignalFormComponent>;
  let host: HTMLElement;
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
      imports: [AuthLoginSignalFormComponent],
      providers: [{ provide: AuthService, useValue: mockAuth }],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthLoginSignalFormComponent);
    host = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  /** Type a value into a control and propagate it through `[formField]`. */
  function typeInto(selector: string, value: string): void {
    const el = host.querySelector<HTMLInputElement>(selector);
    if (!el) throw new Error(`control not found: ${selector}`);
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    TestBed.tick();
  }

  function checkRemember(): void {
    const cb = host.querySelector<HTMLInputElement>('.iu-alsf__checkbox')!;
    cb.checked = true;
    cb.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    TestBed.tick();
  }

  function fillValid(): void {
    typeInto('#alsf-email', 'israel@example.com');
    typeInto('#alsf-password', 'MinhaPassword123!');
  }

  async function submit(): Promise<void> {
    host.querySelector('form')!.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
    TestBed.tick();
  }

  const errorTexts = (): string[] =>
    Array.from(host.querySelectorAll('.iu-alsf__field-error')).map(
      (e) => e.textContent?.trim() ?? '',
    );

  // ── render ────────────────────────────────────────────────────────────────

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the brand, title and the form() badge', () => {
    expect(host.querySelector('.iu-alsf__brand')?.textContent).toContain('LisboaRent');
    expect(host.querySelector('.iu-alsf__title')?.textContent?.trim()).toBe('Bem-vindo de volta');
    expect(host.querySelector('.iu-alsf__badge')?.textContent?.trim()).toBe('form()');
  });

  it('renders the two inputs + remember checkbox', () => {
    expect(host.querySelector('#alsf-email')).toBeTruthy();
    expect(host.querySelector('#alsf-password')).toBeTruthy();
    expect(host.querySelector('.iu-alsf__checkbox')).toBeTruthy();
  });

  it('shows no field errors before any interaction', () => {
    expect(errorTexts().length).toBe(0);
  });

  it('mirrors the AuthService error banner', () => {
    mockAuth.authError.set('Credenciais inválidas');
    fixture.detectChanges();
    const banner = host.querySelector('.iu-alsf__error-banner');
    expect(banner?.getAttribute('role')).toBe('alert');
    expect(banner?.textContent).toContain('Credenciais inválidas');
  });

  // ── validation ──────────────────────────────────────────────────────────────

  it('surfaces both required errors on submit of an empty form', async () => {
    await submit();
    const errors = errorTexts();
    expect(errors).toContain('Email é obrigatório.');
    expect(errors).toContain('Password é obrigatória.');
    expect(mockAuth.login).not.toHaveBeenCalled();
  });

  it('rejects an invalid email', async () => {
    typeInto('#alsf-email', 'not-an-email');
    typeInto('#alsf-password', 'MinhaPassword123!');
    await submit();
    expect(errorTexts()).toContain('Email inválido.');
    expect(mockAuth.login).not.toHaveBeenCalled();
  });

  it('enforces the minimum password length (6)', async () => {
    typeInto('#alsf-email', 'israel@example.com');
    typeInto('#alsf-password', 'abc');
    await submit();
    expect(errorTexts()).toContain('Mínimo 6 caracteres.');
    expect(mockAuth.login).not.toHaveBeenCalled();
  });

  // ── password visibility toggle ────────────────────────────────────────────

  it('toggles the password field between password and text', () => {
    const input = host.querySelector<HTMLInputElement>('#alsf-password')!;
    const toggle = host.querySelector<HTMLButtonElement>('.iu-alsf__toggle-pw')!;
    expect(input.type).toBe('password');
    toggle.click();
    fixture.detectChanges();
    expect(input.type).toBe('text');
    toggle.click();
    fixture.detectChanges();
    expect(input.type).toBe('password');
  });

  // ── submit ─────────────────────────────────────────────────────────────────

  it('logs in with trimmed email + rememberMe and emits loginSuccess', async () => {
    const success: boolean[] = [];
    fixture.componentInstance.loginSuccess.subscribe(() => success.push(true));

    typeInto('#alsf-email', '  Israel@Example.com  ');
    typeInto('#alsf-password', 'MinhaPassword123!');
    checkRemember();

    await submit();

    expect(mockAuth.login).toHaveBeenCalledTimes(1);
    expect(mockAuth.login).toHaveBeenCalledWith({
      email: 'Israel@Example.com',
      password: 'MinhaPassword123!',
      rememberMe: true,
    });
    expect(success).toHaveLength(1);
  });

  it('defaults rememberMe to false when the checkbox is untouched', async () => {
    fillValid();
    await submit();
    expect(mockAuth.login).toHaveBeenCalledWith(
      expect.objectContaining({ rememberMe: false }),
    );
  });

  it('emits registerRequested from the footer link', () => {
    const req: boolean[] = [];
    fixture.componentInstance.registerRequested.subscribe(() => req.push(true));
    host.querySelectorAll<HTMLButtonElement>('.iu-alsf__link')[1].click();
    expect(req).toHaveLength(1);
  });

  it('emits forgotPassword from the options link', () => {
    const req: boolean[] = [];
    fixture.componentInstance.forgotPassword.subscribe(() => req.push(true));
    host.querySelectorAll<HTMLButtonElement>('.iu-alsf__link')[0].click();
    expect(req).toHaveLength(1);
  });

  // ── PARITY: bespoke twin ⇄ official form() ────────────────────────────────

  describe('parity with the bespoke AuthLoginComponent', () => {
    /**
     * Runs the same login inputs through the bespoke component and asserts its
     * `login` payload equals the official twin's — the migration is only safe if
     * both hand the service byte-identical data.
     */
    it('hands AuthService.login the same payload for the same inputs', async () => {
      // official twin
      typeInto('#alsf-email', '  Israel@Example.com  ');
      typeInto('#alsf-password', 'MinhaPassword123!');
      checkRemember();
      await submit();
      const officialCall = mockAuth.login.mock.calls[0]?.[0];
      expect(officialCall).toBeDefined();

      // ── build the bespoke twin with its own fresh mock ──
      const bespokeAuth = {
        loading: signal(false),
        authError: signal<string | null>(null),
        login: jest.fn(async () => ({ success: true }) as AuthResult),
      };
      const bespokeFix = await freshBespoke(bespokeAuth);
      const bHost = bespokeFix.nativeElement as HTMLElement;

      const bType = (sel: string, val: string) => {
        const el = bHost.querySelector<HTMLInputElement>(sel)!;
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        bespokeFix.detectChanges();
        TestBed.tick();
      };
      bType('#al-email', '  Israel@Example.com  ');
      bType('#al-password', 'MinhaPassword123!');
      const bCb = bHost.querySelector<HTMLInputElement>('.iu-al__checkbox')!;
      bCb.checked = true;
      bCb.dispatchEvent(new Event('change', { bubbles: true }));
      bespokeFix.detectChanges();
      TestBed.tick();

      bHost.querySelector('form')!.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      await Promise.resolve();
      await Promise.resolve();
      bespokeFix.detectChanges();

      const bespokeCall = bespokeAuth.login.mock.calls[0]?.[0];
      expect(bespokeCall).toEqual(officialCall);
    });
  });
});

/**
 * Builds a bespoke AuthLoginComponent in its own TestBed so the parity test can
 * compare it against the official twin without provider bleed. Returns its fixture.
 */
async function freshBespoke(mock: {
  loading: ReturnType<typeof signal<boolean>>;
  authError: ReturnType<typeof signal<string | null>>;
  login: jest.Mock<Promise<AuthResult>, [LoginCredentials]>;
}): Promise<ComponentFixture<AuthLoginComponent>> {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [AuthLoginComponent],
    providers: [{ provide: AuthService, useValue: mock }],
  }).compileComponents();
  const fix = TestBed.createComponent(AuthLoginComponent);
  fix.detectChanges();
  return fix;
}
