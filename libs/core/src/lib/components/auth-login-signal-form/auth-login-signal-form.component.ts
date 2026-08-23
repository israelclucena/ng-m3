/**
 * @fileoverview AuthLoginSignalFormComponent — the auth-login form rebuilt on
 * Angular 22's **official** Signal Forms API (`@angular/forms/signals`).
 *
 * Third migration of a *real product form* off the bespoke `createSignalForm`
 * util onto the official `form()` API, completing the auth pair after
 * auth-register (#060). It is a faithful, additive, side-by-side twin of
 * {@link AuthLoginComponent}: identical markup, styles, outputs and `AuthService`
 * wiring — the **only** difference is the form engine.
 *
 * Migration map (bespoke `createSignalForm` → official `form()`):
 * | bespoke (AuthLoginComponent)                          | official (this)                                   |
 * | ----------------------------------------------------- | ------------------------------------------------- |
 * | `createSignalForm({ email: { validators: [...] } })`  | `form(model, (p) => { required(p.email); ... })`  |
 * | `form.fields.email.value()`                           | `f.email().value()`                               |
 * | `[value]` + `(input)="…setValue(…)"` + `(blur)="…touch()"` | `[formField]="f.email"` (two-way)            |
 * | `form.fields.email.showError()`                       | `f.email().touched() && f.email().invalid()`      |
 * | `form.valid()`                                        | `f().valid()`                                     |
 * | `form.submit()` (marks all touched)                   | `f().markAsTouched()` + `f().invalid()`           |
 *
 * The bespoke `AuthLoginComponent` remains the shipped default; this twin sits
 * behind `AUTH_LOGIN_SIGNAL_FORM` and replaces nothing. A parity spec asserts
 * both emit the same `LoginCredentials` for the same inputs.
 *
 * Feature flag: `AUTH_LOGIN_SIGNAL_FORM`
 *
 * @see libs/core/src/lib/components/auth-login/auth-login.component.ts — the bespoke twin
 * @see libs/core/src/lib/components/auth-register-signal-form/auth-register-signal-form.component.ts — auth-register twin (#060)
 *
 * Night Shift 2026-08-23 — Signal Forms migration #3 (real product form).
 */
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
import {
  FieldTree,
  FormField,
  disabled,
  email,
  form,
  minLength,
  required,
} from '@angular/forms/signals';
import { AuthService, LoginCredentials } from '../../services/auth.service';

// ─── Models ──────────────────────────────────────────────────────────────────

/**
 * The login form's single source of truth. `rememberMe` stays a standalone UI
 * signal (as in the bespoke twin) since it carries no text-based validators.
 */
export interface AuthLoginModel {
  email: string;
  password: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * AuthLoginSignalForm — login form for LisboaRent built on the official Angular 22
 * Signal Forms API.
 *
 * Feature-parity with {@link AuthLoginComponent}: email / password with validation,
 * show/hide toggle, "remember me" checkbox, loading state, error banner, and the
 * same `loginSuccess` / `registerRequested` / `forgotPassword` outputs driving the
 * same `AuthService`.
 *
 * @example
 * ```html
 * <iu-auth-login-signal-form
 *   (loginSuccess)="onLogin()"
 *   (registerRequested)="goToRegister()"
 * />
 * ```
 */
@Component({
  selector: 'iu-auth-login-signal-form',
  standalone: true,
  imports: [CommonModule, FormField],
  template: `
    <div class="iu-alsf">
      <!-- Logo / Brand -->
      <div class="iu-alsf__brand">
        <span class="material-symbols-outlined iu-alsf__brand-icon">home_work</span>
        <span class="iu-alsf__brand-name">LisboaRent</span>
        <span class="iu-alsf__badge">form()</span>
      </div>

      <h1 class="iu-alsf__title">Bem-vindo de volta</h1>
      <p class="iu-alsf__subtitle">Inicie sessão para aceder à sua conta</p>

      <!-- Auth error banner -->
      @if (authError()) {
        <div class="iu-alsf__error-banner" role="alert">
          <span class="material-symbols-outlined">error</span>
          {{ authError() }}
        </div>
      }

      <form class="iu-alsf__form" (submit)="onSubmit($event)" novalidate>

        <!-- Email -->
        <div class="iu-alsf__field">
          <label class="iu-alsf__label" for="alsf-email">Email</label>
          <div class="iu-alsf__input-wrap">
            <span class="material-symbols-outlined iu-alsf__input-icon">mail</span>
            <input
              id="alsf-email"
              class="iu-alsf__input"
              [class.iu-alsf__input--error]="showError(f.email)"
              type="email"
              placeholder="nome@exemplo.com"
              [formField]="f.email"
              autocomplete="email"
            />
          </div>
          @if (showError(f.email)) {
            <span class="iu-alsf__field-error">{{ firstError(f.email) }}</span>
          }
        </div>

        <!-- Password -->
        <div class="iu-alsf__field">
          <label class="iu-alsf__label" for="alsf-password">Password</label>
          <div class="iu-alsf__input-wrap">
            <span class="material-symbols-outlined iu-alsf__input-icon">lock</span>
            <input
              id="alsf-password"
              class="iu-alsf__input"
              [class.iu-alsf__input--error]="showError(f.password)"
              [type]="showPassword() ? 'text' : 'password'"
              placeholder="A sua password"
              [formField]="f.password"
              autocomplete="current-password"
            />
            <button
              type="button"
              class="iu-alsf__toggle-pw"
              (click)="showPassword.set(!showPassword())"
              [attr.aria-label]="showPassword() ? 'Esconder password' : 'Mostrar password'"
            >
              <span class="material-symbols-outlined">
                {{ showPassword() ? 'visibility_off' : 'visibility' }}
              </span>
            </button>
          </div>
          @if (showError(f.password)) {
            <span class="iu-alsf__field-error">{{ firstError(f.password) }}</span>
          }
        </div>

        <!-- Remember me + Forgot password -->
        <div class="iu-alsf__options">
          <label class="iu-alsf__remember">
            <input
              type="checkbox"
              class="iu-alsf__checkbox"
              [checked]="rememberMe()"
              (change)="rememberMe.set($any($event).target.checked)"
            />
            Lembrar-me
          </label>
          <button type="button" class="iu-alsf__link" (click)="forgotPassword.emit()">
            Esqueci a password
          </button>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          class="iu-alsf__submit"
          [disabled]="!canSubmit() || loading()"
        >
          @if (loading()) {
            <span class="iu-alsf__spinner"></span>
            A entrar...
          } @else {
            <span class="material-symbols-outlined">login</span>
            Entrar
          }
        </button>

      </form>

      <!-- Register link -->
      <p class="iu-alsf__footer">
        Não tem conta?
        <button type="button" class="iu-alsf__link" (click)="registerRequested.emit()">
          Registar agora
        </button>
      </p>
    </div>
  `,
  styles: [`
    .iu-alsf {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 32px;
      max-width: 440px;
      width: 100%;
      margin: 0 auto;
    }

    .iu-alsf__brand {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 32px;
      color: var(--md-sys-color-primary, #6750a4);
    }
    .iu-alsf__brand-icon { font-size: 40px; }
    .iu-alsf__brand-name { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; }
    .iu-alsf__badge {
      padding: 0.125rem 0.5rem;
      border-radius: 999px;
      font-family: ui-monospace, 'SF Mono', Menlo, monospace;
      font-size: 0.6875rem;
      background: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
    }

    .iu-alsf__title {
      font-size: 1.75rem; font-weight: 700; line-height: 1.2;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      margin: 0 0 8px;
      text-align: center;
    }
    .iu-alsf__subtitle {
      font-size: 0.9375rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin: 0 0 28px;
      text-align: center;
    }

    .iu-alsf__error-banner {
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

    .iu-alsf__form {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .iu-alsf__field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .iu-alsf__label {
      font-size: 0.875rem; font-weight: 600;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .iu-alsf__input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .iu-alsf__input-icon {
      position: absolute;
      left: 12px;
      font-size: 20px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      pointer-events: none;
    }

    .iu-alsf__input {
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
    .iu-alsf__input:focus { border-color: var(--md-sys-color-primary, #6750a4); box-shadow: 0 0 0 3px rgba(103,80,164,.15); }
    .iu-alsf__input--error { border-color: var(--md-sys-color-error, #b3261e); }
    .iu-alsf__input:disabled { opacity: 0.6; cursor: not-allowed; }

    .iu-alsf__toggle-pw {
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
    .iu-alsf__toggle-pw:hover { background: rgba(28,27,31,.08); }

    .iu-alsf__field-error {
      font-size: 0.75rem;
      color: var(--md-sys-color-error, #b3261e);
    }

    .iu-alsf__options {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .iu-alsf__remember {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.875rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      cursor: pointer;
    }
    .iu-alsf__checkbox { accent-color: var(--md-sys-color-primary, #6750a4); }

    .iu-alsf__link {
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
    .iu-alsf__link:hover { color: var(--md-sys-color-primary-container, #eaddff); }

    .iu-alsf__submit {
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
    .iu-alsf__submit:hover:not(:disabled) { box-shadow: 0 2px 8px rgba(103,80,164,.4); }
    .iu-alsf__submit:disabled { opacity: 0.56; cursor: not-allowed; }

    .iu-alsf__spinner {
      width: 18px; height: 18px;
      border: 2px solid rgba(255,255,255,.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: iu-alsf-spin 0.7s linear infinite;
    }
    @keyframes iu-alsf-spin { to { transform: rotate(360deg); } }

    .iu-alsf__footer {
      margin: 24px 0 0;
      font-size: 0.9rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      text-align: center;
    }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLoginSignalFormComponent {
  private readonly auth = inject(AuthService);

  // ── Outputs ────────────────────────────────────────────────────────────────

  /** Emitted after a successful login. */
  loginSuccess = output<void>();

  /** Emitted when the user clicks "Registar agora". */
  registerRequested = output<void>();

  /** Emitted when the user clicks "Esqueci a password". */
  forgotPassword = output<void>();

  // ── UI state (identical to the bespoke twin) ───────────────────────────────

  /** Whether to display password as plain text. */
  readonly showPassword = signal(false);

  /** Whether the "remember me" checkbox is checked. */
  readonly rememberMe = signal(false);

  /** True once a submit has been attempted (drives error visibility). */
  private readonly submitted = signal(false);

  // ── Official Signal Form ───────────────────────────────────────────────────

  /**
   * Single source of truth. `form()` wraps this signal directly and mutates it in
   * place through the `[formField]` directive — reading `model()` reflects live input.
   */
  private readonly model = signal<AuthLoginModel>({
    email: '',
    password: '',
  });

  /**
   * The official field tree. Every rule is declared inline in the schema. Field
   * `disabled()` while a login request is in flight — the official equivalent of
   * the bespoke `[disabled]="loading()"` (which `[formField]` forbids as a direct
   * binding since it owns the control's disabled state). Validators mirror the
   * bespoke twin byte-for-byte: password min length stays 6.
   */
  protected readonly f = form(this.model, (path) => {
    disabled(path.email, () => this.loading());
    disabled(path.password, () => this.loading());

    required(path.email, { message: 'Email é obrigatório.' });
    email(path.email, { message: 'Email inválido.' });

    required(path.password, { message: 'Password é obrigatória.' });
    minLength(path.password, 6, { message: 'Mínimo 6 caracteres.' });
  });

  // ── Proxied from service ───────────────────────────────────────────────────

  readonly loading = this.auth.loading;
  readonly authError = this.auth.authError;

  // ── Computed ───────────────────────────────────────────────────────────────

  /** True when the form is valid (no field errors). */
  readonly canSubmit = computed(() => this.f().valid());

  // ── Error-display helpers (mirror the bespoke showError/firstError) ─────────

  /**
   * Whether a field should surface its error — touched (or a submit attempted)
   * AND currently invalid.
   */
  protected showError(field: FieldTree<string>): boolean {
    const state = field();
    return (state.touched() || this.submitted()) && state.invalid();
  }

  /** First human-readable error message for a field, or empty string. */
  protected firstError(field: FieldTree<string>): string {
    return field().errors()[0]?.message ?? '';
  }

  // ── Methods ────────────────────────────────────────────────────────────────

  /** Submit handler — full validation, then AuthService (parity with bespoke). */
  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);
    this.f().markAsTouched();

    if (this.f().invalid()) return;

    const v = this.model();
    const creds: LoginCredentials = {
      email: v.email.trim(),
      password: v.password,
      rememberMe: this.rememberMe(),
    };

    const result = await this.auth.login(creds);
    if (result.success) {
      this.loginSuccess.emit();
    }
  }
}
