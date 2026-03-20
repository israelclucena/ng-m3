import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, LoginCredentials } from '../../services/auth.service';
import {
  createSignalForm,
  emailValidator,
  minLength,
  required,
} from '../../utils/signal-form';

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * AuthLogin — Standalone login form component for LisboaRent.
 *
 * Features:
 * - Email + password fields with client-side validation
 * - "Remember me" toggle
 * - Loading state during auth
 * - Error display from AuthService
 * - "Register" and "Forgot password" links
 *
 * Uses `createSignalForm()` for signal-based form state + validation (Sprint 026).
 * Replaces 6 manual signal/computed pairs from the previous implementation.
 *
 * Feature flag: `AUTH_MODULE`
 *
 * @example
 * ```html
 * <iu-auth-login
 *   (loginSuccess)="onLogin()"
 *   (registerRequested)="goToRegister()"
 * />
 * ```
 */
@Component({
  selector: 'iu-auth-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="iu-al">
      <!-- Logo / Brand -->
      <div class="iu-al__brand">
        <span class="material-symbols-outlined iu-al__brand-icon">home_work</span>
        <span class="iu-al__brand-name">LisboaRent</span>
      </div>

      <h1 class="iu-al__title">Bem-vindo de volta</h1>
      <p class="iu-al__subtitle">Inicie sessão para aceder à sua conta</p>

      <!-- Auth error banner -->
      @if (authError()) {
        <div class="iu-al__error-banner" role="alert">
          <span class="material-symbols-outlined">error</span>
          {{ authError() }}
        </div>
      }

      <form class="iu-al__form" (submit)="$event.preventDefault(); onSubmit()">

        <!-- Email -->
        <div class="iu-al__field">
          <label class="iu-al__label" for="al-email">Email</label>
          <div class="iu-al__input-wrap">
            <span class="material-symbols-outlined iu-al__input-icon">mail</span>
            <input
              id="al-email"
              class="iu-al__input"
              [class.iu-al__input--error]="form.fields.email.showError()"
              type="email"
              placeholder="nome@exemplo.com"
              [value]="form.fields.email.value()"
              (input)="form.fields.email.setValue($any($event.target).value)"
              (blur)="form.fields.email.touch()"
              autocomplete="email"
              [disabled]="loading()"
            />
          </div>
          @if (form.fields.email.showError()) {
            <span class="iu-al__field-error">{{ form.fields.email.firstError() }}</span>
          }
        </div>

        <!-- Password -->
        <div class="iu-al__field">
          <label class="iu-al__label" for="al-password">Password</label>
          <div class="iu-al__input-wrap">
            <span class="material-symbols-outlined iu-al__input-icon">lock</span>
            <input
              id="al-password"
              class="iu-al__input"
              [class.iu-al__input--error]="form.fields.password.showError()"
              [type]="showPassword() ? 'text' : 'password'"
              placeholder="A sua password"
              [value]="form.fields.password.value()"
              (input)="form.fields.password.setValue($any($event.target).value)"
              (blur)="form.fields.password.touch()"
              autocomplete="current-password"
              [disabled]="loading()"
            />
            <button
              type="button"
              class="iu-al__toggle-pw"
              (click)="showPassword.set(!showPassword())"
              [attr.aria-label]="showPassword() ? 'Esconder password' : 'Mostrar password'"
            >
              <span class="material-symbols-outlined">
                {{ showPassword() ? 'visibility_off' : 'visibility' }}
              </span>
            </button>
          </div>
          @if (form.fields.password.showError()) {
            <span class="iu-al__field-error">{{ form.fields.password.firstError() }}</span>
          }
        </div>

        <!-- Remember me + Forgot password -->
        <div class="iu-al__options">
          <label class="iu-al__remember">
            <input
              type="checkbox"
              class="iu-al__checkbox"
              [checked]="rememberMe()"
              (change)="rememberMe.set($any($event.target).checked)"
            />
            Lembrar-me
          </label>
          <button type="button" class="iu-al__link" (click)="forgotPassword.emit()">
            Esqueci a password
          </button>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          class="iu-al__submit"
          [disabled]="!canSubmit() || loading()"
        >
          @if (loading()) {
            <span class="iu-al__spinner"></span>
            A entrar...
          } @else {
            <span class="material-symbols-outlined">login</span>
            Entrar
          }
        </button>

      </form>

      <!-- Register link -->
      <p class="iu-al__footer">
        Não tem conta?
        <button type="button" class="iu-al__link" (click)="registerRequested.emit()">
          Registar agora
        </button>
      </p>
    </div>
  `,
  styles: [`
    .iu-al {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 32px;
      max-width: 440px;
      width: 100%;
      margin: 0 auto;
    }

    .iu-al__brand {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 32px;
      color: var(--md-sys-color-primary, #6750a4);
    }
    .iu-al__brand-icon { font-size: 40px; }
    .iu-al__brand-name { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; }

    .iu-al__title {
      font-size: 1.75rem; font-weight: 700; line-height: 1.2;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      margin: 0 0 8px;
      text-align: center;
    }
    .iu-al__subtitle {
      font-size: 0.9375rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin: 0 0 28px;
      text-align: center;
    }

    .iu-al__error-banner {
      display: flex; align-items: center; gap: 10px;
      width: 100%;
      padding: 12px 16px;
      border-radius: 12px;
      background: var(--md-sys-color-error-container, #f9dedc);
      color: var(--md-sys-color-on-error-container, #410e0b);
      font-size: 0.875rem;
      margin-bottom: 20px;

      .material-symbols-outlined { font-size: 20px; flex-shrink: 0; }
    }

    .iu-al__form {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .iu-al__field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .iu-al__label {
      font-size: 0.875rem; font-weight: 600;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .iu-al__input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .iu-al__input-icon {
      position: absolute;
      left: 12px;
      font-size: 20px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      pointer-events: none;
    }

    .iu-al__input {
      width: 100%;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      border-radius: 12px;
      padding: 12px 12px 12px 42px;
      font-size: 0.9375rem;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      background: var(--md-sys-color-surface, #fffbfe);
      outline: none;
      transition: border-color 150ms;
      font-family: inherit;
      box-sizing: border-box;
    }
    .iu-al__input:focus { border-color: var(--md-sys-color-primary, #6750a4); box-shadow: 0 0 0 3px rgba(103,80,164,.15); }
    .iu-al__input--error { border-color: var(--md-sys-color-error, #b3261e); }
    .iu-al__input:disabled { opacity: 0.6; cursor: not-allowed; }

    .iu-al__toggle-pw {
      position: absolute;
      right: 8px;
      background: transparent;
      border: none;
      border-radius: 50%;
      width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      cursor: pointer;

      .material-symbols-outlined { font-size: 20px; }
    }
    .iu-al__toggle-pw:hover { background: rgba(28,27,31,.08); }

    .iu-al__field-error {
      font-size: 0.75rem;
      color: var(--md-sys-color-error, #b3261e);
    }

    .iu-al__options {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .iu-al__remember {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.875rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      cursor: pointer;
    }
    .iu-al__checkbox { accent-color: var(--md-sys-color-primary, #6750a4); }

    .iu-al__link {
      background: transparent;
      border: none;
      padding: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--md-sys-color-primary, #6750a4);
      cursor: pointer;
      text-decoration: underline;
      font-family: inherit;
    }
    .iu-al__link:hover { color: var(--md-sys-color-primary-container, #eaddff); }

    .iu-al__submit {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      width: 100%;
      padding: 14px 24px;
      border-radius: 100px;
      border: none;
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
      font-size: 1rem; font-weight: 600;
      cursor: pointer;
      transition: box-shadow 150ms;
      font-family: inherit;

      .material-symbols-outlined { font-size: 20px; }
    }
    .iu-al__submit:hover:not(:disabled) { box-shadow: 0 2px 8px rgba(103,80,164,.4); }
    .iu-al__submit:disabled { opacity: 0.56; cursor: not-allowed; }

    .iu-al__spinner {
      width: 18px; height: 18px;
      border: 2px solid rgba(255,255,255,.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: iu-al-spin 0.7s linear infinite;
    }
    @keyframes iu-al-spin { to { transform: rotate(360deg); } }

    .iu-al__footer {
      margin: 24px 0 0;
      font-size: 0.9rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      text-align: center;
    }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLoginComponent {
  private readonly auth = inject(AuthService);

  // ── Outputs ────────────────────────────────────────────────────────────────

  /** Emitted after a successful login. */
  loginSuccess = output<void>();

  /** Emitted when the user clicks "Registar agora". */
  registerRequested = output<void>();

  /** Emitted when the user clicks "Esqueci a password". */
  forgotPassword = output<void>();

  // ── UI state ───────────────────────────────────────────────────────────────

  /** Whether to display password as plain text. */
  readonly showPassword = signal(false);

  /** Whether the "remember me" checkbox is checked. */
  readonly rememberMe = signal(false);

  // ── Signal form ────────────────────────────────────────────────────────────
  /**
   * Signal-based form using createSignalForm().
   * Replaces 6 manual signal/computed pairs from the Sprint 015 implementation.
   * Sprint 026 — Signal Forms Migration.
   */
  readonly form = createSignalForm({
    email:    { value: '', validators: [required('Email é obrigatório.'), emailValidator('Email inválido.')] },
    password: { value: '', validators: [required('Password é obrigatória.'), minLength(6, 'Mínimo 6 caracteres.')] },
  });

  // ── Proxied from service ───────────────────────────────────────────────────

  readonly loading = this.auth.loading;
  readonly authError = this.auth.authError;

  // ── Computed ───────────────────────────────────────────────────────────────

  /** True when the form is valid (no field errors). */
  readonly canSubmit = computed(() => this.form.valid());

  // ── Methods ────────────────────────────────────────────────────────────────

  /** Submit handler — marks all fields touched, then calls AuthService. */
  async onSubmit(): Promise<void> {
    if (!this.form.submit()) return; // marks all fields touched, returns false if invalid

    const v = this.form.value();
    const creds: LoginCredentials = {
      email:      (v['email'] as string).trim(),
      password:   v['password'] as string,
      rememberMe: this.rememberMe(),
    };

    const result = await this.auth.login(creds);
    if (result.success) {
      this.loginSuccess.emit();
    }
  }
}
