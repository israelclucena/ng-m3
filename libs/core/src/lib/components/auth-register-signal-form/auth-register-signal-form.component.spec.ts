import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthRegisterSignalFormComponent } from './auth-register-signal-form.component';
import { AuthRegisterComponent } from '../auth-register/auth-register.component';
import { AuthService, AuthResult, RegisterData } from '../../services/auth.service';

/**
 * Specs for {@link AuthRegisterSignalFormComponent} — the official-`form()` twin
 * of {@link AuthRegisterComponent}.
 *
 * The suite drives the **public contract only** (DOM inputs + the real
 * `[formField]` two-way binding + the outputs), never the protected field tree,
 * and closes with a **parity block** that runs the same inputs through *both*
 * components and asserts they hand `AuthService.register` an identical payload.
 */
describe('AuthRegisterSignalFormComponent', () => {
  let fixture: ComponentFixture<AuthRegisterSignalFormComponent>;
  let host: HTMLElement;
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
      imports: [AuthRegisterSignalFormComponent],
      providers: [{ provide: AuthService, useValue: mockAuth }],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthRegisterSignalFormComponent);
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

  function checkTerms(): void {
    const cb = host.querySelector<HTMLInputElement>('.iu-arsf__checkbox')!;
    cb.checked = true;
    cb.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    TestBed.tick();
  }

  function fillValid(): void {
    typeInto('#arsf-name', 'Israel Lucena');
    typeInto('#arsf-email', 'israel@example.com');
    typeInto('#arsf-password', 'MinhaPassword123!');
    typeInto('#arsf-confirm', 'MinhaPassword123!');
    checkTerms();
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
    Array.from(host.querySelectorAll('.iu-arsf__field-error')).map(
      (e) => e.textContent?.trim() ?? '',
    );

  // ── render ────────────────────────────────────────────────────────────────

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the brand, title and the form() badge', () => {
    expect(host.querySelector('.iu-arsf__brand')?.textContent).toContain('LisboaRent');
    expect(host.querySelector('.iu-arsf__title')?.textContent?.trim()).toBe('Criar conta');
    expect(host.querySelector('.iu-arsf__badge')?.textContent?.trim()).toBe('form()');
  });

  it('renders the four inputs + two role buttons', () => {
    expect(host.querySelector('#arsf-name')).toBeTruthy();
    expect(host.querySelector('#arsf-email')).toBeTruthy();
    expect(host.querySelector('#arsf-password')).toBeTruthy();
    expect(host.querySelector('#arsf-confirm')).toBeTruthy();
    expect(host.querySelectorAll('.iu-arsf__role-btn').length).toBe(2);
  });

  it('shows no field errors before any interaction', () => {
    expect(errorTexts().length).toBe(0);
  });

  it('mirrors the AuthService error banner', () => {
    mockAuth.authError.set('Falha no registo');
    fixture.detectChanges();
    const banner = host.querySelector('.iu-arsf__error-banner');
    expect(banner?.getAttribute('role')).toBe('alert');
    expect(banner?.textContent).toContain('Falha no registo');
  });

  // ── validation ──────────────────────────────────────────────────────────────

  it('surfaces every required error on submit of an empty form', async () => {
    await submit();
    const errors = errorTexts();
    expect(errors).toContain('Nome é obrigatório.');
    expect(errors).toContain('Email é obrigatório.');
    expect(errors).toContain('Password é obrigatória.');
    expect(errors).toContain('Confirme a password.');
  });

  it('rejects an invalid email', async () => {
    typeInto('#arsf-email', 'not-an-email');
    await submit();
    expect(errorTexts()).toContain('Email inválido.');
  });

  it('enforces the minimum password length', async () => {
    typeInto('#arsf-password', 'abc');
    await submit();
    expect(errorTexts()).toContain('Mínimo 8 caracteres.');
  });

  it('flags a confirm-password mismatch via the cross-field rule', async () => {
    typeInto('#arsf-password', 'MinhaPassword123!');
    typeInto('#arsf-confirm', 'DiferentePassword1!');
    await submit();
    expect(errorTexts()).toContain('As passwords não coincidem.');
    expect(mockAuth.register).not.toHaveBeenCalled();
  });

  // ── password strength ─────────────────────────────────────────────────────

  it('escalates the strength label as the password grows stronger', () => {
    typeInto('#arsf-password', 'abcdefgh'); // len≥8 only → score 1 → Fraca
    expect(host.querySelector('.iu-arsf__strength-label')?.textContent?.trim()).toBe('Fraca');
    typeInto('#arsf-password', 'Abcdef1!'); // upper+digit+symbol+len → score 4 → Forte
    expect(host.querySelector('.iu-arsf__strength-label')?.textContent?.trim()).toBe('Forte');
  });

  // ── submit gating ─────────────────────────────────────────────────────────

  it('does not call register while the form is invalid', async () => {
    await submit();
    expect(mockAuth.register).not.toHaveBeenCalled();
  });

  it('does not call register when terms are unaccepted', async () => {
    typeInto('#arsf-name', 'Israel Lucena');
    typeInto('#arsf-email', 'israel@example.com');
    typeInto('#arsf-password', 'MinhaPassword123!');
    typeInto('#arsf-confirm', 'MinhaPassword123!');
    // terms left unchecked
    await submit();
    expect(mockAuth.register).not.toHaveBeenCalled();
  });

  it('registers with normalized data and shows the success screen', async () => {
    const success: boolean[] = [];
    fixture.componentInstance.registerSuccess.subscribe(() => success.push(true));

    typeInto('#arsf-name', '  Israel Lucena  ');
    typeInto('#arsf-email', '  Israel@Example.COM ');
    typeInto('#arsf-password', 'MinhaPassword123!');
    typeInto('#arsf-confirm', 'MinhaPassword123!');
    checkTerms();
    // pick landlord role
    host.querySelectorAll<HTMLButtonElement>('.iu-arsf__role-btn')[1].click();
    fixture.detectChanges();

    await submit();

    expect(mockAuth.register).toHaveBeenCalledTimes(1);
    expect(mockAuth.register).toHaveBeenCalledWith({
      name: 'Israel Lucena',
      email: 'israel@example.com',
      password: 'MinhaPassword123!',
      role: 'landlord',
    });
    expect(success).toHaveLength(1);
    expect(host.querySelector('.iu-arsf__success')).toBeTruthy();
  });

  it('emits loginRequested from the footer link', () => {
    const req: boolean[] = [];
    fixture.componentInstance.loginRequested.subscribe(() => req.push(true));
    host.querySelector<HTMLButtonElement>('.iu-arsf__link-btn')!.click();
    expect(req).toHaveLength(1);
  });

  // ── PARITY: bespoke twin ⇄ official form() ────────────────────────────────

  describe('parity with the bespoke AuthRegisterComponent', () => {
    /**
     * Runs the same registration inputs through the bespoke component and asserts
     * its `register` payload equals the official twin's — the migration is only
     * safe if both hand the service byte-identical data.
     */
    it('hands AuthService.register the same payload for the same inputs', async () => {
      // official twin already registered above via `fillValid` + submit
      fillValid();
      await submit();
      const officialCall = mockAuth.register.mock.calls[0]?.[0];
      expect(officialCall).toBeDefined();

      // ── build the bespoke twin with its own fresh mock ──
      const bespokeAuth = {
        loading: signal(false),
        authError: signal<string | null>(null),
        register: jest.fn(async () => ({ success: true }) as AuthResult),
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
      bType('#ar-name', 'Israel Lucena');
      bType('#ar-email', 'israel@example.com');
      bType('#ar-password', 'MinhaPassword123!');
      bType('#ar-confirm', 'MinhaPassword123!');
      const bCb = bHost.querySelector<HTMLInputElement>('.iu-ar__checkbox')!;
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

      const bespokeCall = bespokeAuth.register.mock.calls[0]?.[0];
      expect(bespokeCall).toEqual(officialCall);
    });
  });
});

/**
 * Builds a bespoke AuthRegisterComponent in its own TestBed so the parity test can
 * compare it against the official twin without provider bleed. Returns its fixture.
 */
async function freshBespoke(mock: {
  loading: ReturnType<typeof signal<boolean>>;
  authError: ReturnType<typeof signal<string | null>>;
  register: jest.Mock<Promise<AuthResult>, [RegisterData]>;
}): Promise<ComponentFixture<AuthRegisterComponent>> {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [AuthRegisterComponent],
    providers: [{ provide: AuthService, useValue: mock }],
  }).compileComponents();
  const fix = TestBed.createComponent(AuthRegisterComponent);
  fix.detectChanges();
  return fix;
}
