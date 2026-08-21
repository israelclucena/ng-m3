/**
 * @fileoverview AuthRegisterSignalFormComponent — the auth-register form rebuilt
 * on Angular 22's **official** Signal Forms API (`@angular/forms/signals`).
 *
 * This is the first migration of a *real product form* off the bespoke
 * `createSignalForm` util onto the official `form()` API — the graduation step
 * after four synthetic PoCs de-risked every surface (scalars #056, cross-field
 * #057, dynamic arrays #058, async #059). It is a faithful, additive, side-by-side
 * twin of {@link AuthRegisterComponent}: identical markup, styles, outputs and
 * `AuthService` wiring — the **only** difference is the form engine.
 *
 * Migration map (bespoke `createSignalForm` → official `form()`):
 * | bespoke (AuthRegisterComponent)                       | official (this)                                   |
 * | ----------------------------------------------------- | ------------------------------------------------- |
 * | `createSignalForm({ name: { validators: [...] } })`   | `form(model, (p) => { required(p.name); ... })`   |
 * | `form.fields.name.value()`                            | `f.name().value()`                                |
 * | `(input)="…setValue($event…)"` + `[value]`            | `[formField]="f.name"` (two-way)                  |
 * | `form.fields.name.showError()`                        | `f.name().touched() && f.name().invalid()`        |
 * | confirm-password as a *standalone* signal + `computed` | `confirmPassword` **in the model**, cross-field   |
 * |                                                       | `validate(p.confirmPassword, ({valueOf}) => …)`   |
 * | `form.valid()`                                        | `f().valid()`                                     |
 * | `form.submit()` (marks all touched)                   | `f().markAsTouched()` + `f().valid()`             |
 *
 * The bespoke `AuthRegisterComponent` remains the shipped default; this twin sits
 * behind `AUTH_REGISTER_SIGNAL_FORM` and replaces nothing. A parity spec asserts
 * both emit the same `RegisterData` for the same inputs.
 *
 * Feature flag: `AUTH_REGISTER_SIGNAL_FORM`
 *
 * @see libs/core/src/lib/components/auth-register/auth-register.component.ts — the bespoke twin
 * @see libs/core/src/lib/components/signal-forms-poc/signal-forms-poc.component.ts — scalar PoC
 * @see libs/core/src/lib/components/signal-forms-listing/signal-forms-listing.component.ts — cross-field PoC
 *
 * Night Shift 2026-08-21 — Signal Forms migration #1 (real product form).
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
  validate,
} from '@angular/forms/signals';
import { AuthService, RegisterData } from '../../services/auth.service';

// ─── Models ──────────────────────────────────────────────────────────────────

/**
 * The registration form's single source of truth. Unlike the bespoke twin —
 * which keeps `confirmPassword` as a standalone signal because its single-field
 * validator type can't express cross-field rules — the official API models it as
 * a first-class field and validates it against `password` via `valueOf`.
 */
export interface AuthRegisterModel {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * AuthRegisterSignalForm — registration form for LisboaRent built on the official
 * Angular 22 Signal Forms API.
 *
 * Feature-parity with {@link AuthRegisterComponent}: name / email / password /
 * confirm-password with validation, tenant/landlord role selector, live password
 * strength meter, show/hide toggle, terms acceptance, success screen, and the
 * same `registerSuccess` / `loginRequested` outputs driving the same `AuthService`.
 *
 * @example
 * ```html
 * <iu-auth-register-signal-form
 *   (registerSuccess)="onRegistered()"
 *   (loginRequested)="goToLogin()"
 * />
 * ```
 */
@Component({
  selector: 'iu-auth-register-signal-form',
  standalone: true,
  imports: [CommonModule, FormField],
  template: `
    <div class="iu-arsf">

      <!-- Brand -->
      <div class="iu-arsf__brand">
        <span class="material-symbols-outlined iu-arsf__brand-icon">home_work</span>
        <span class="iu-arsf__brand-name">LisboaRent</span>
        <span class="iu-arsf__badge">form()</span>
      </div>

      <h1 class="iu-arsf__title">Criar conta</h1>
      <p class="iu-arsf__subtitle">Junte-se à maior plataforma de arrendamento em Lisboa</p>

      <!-- Error banner -->
      @if (authError()) {
        <div class="iu-arsf__error-banner" role="alert">
          <span class="material-symbols-outlined">error</span>
          {{ authError() }}
        </div>
      }

      <!-- Success state -->
      @if (isSuccess()) {
        <div class="iu-arsf__success">
          <div class="iu-arsf__success-icon">
            <span class="material-symbols-outlined">check_circle</span>
          </div>
          <h2 class="iu-arsf__success-title">Conta criada!</h2>
          <p class="iu-arsf__success-body">
            Bem-vindo, {{ f.name().value() }}! A sua conta foi criada com sucesso.
          </p>
          <button class="iu-arsf__submit" (click)="loginRequested.emit()">
            <span class="material-symbols-outlined">login</span>
            Ir para o início
          </button>
        </div>
      } @else {

        <form class="iu-arsf__form" (submit)="onSubmit($event)" novalidate>

          <!-- Role selector -->
          <div class="iu-arsf__role-group" role="group" aria-label="Tipo de conta">
            <button
              type="button"
              class="iu-arsf__role-btn"
              [class.iu-arsf__role-btn--active]="role() === 'tenant'"
              (click)="role.set('tenant')"
            >
              <span class="material-symbols-outlined">person</span>
              Inquilino
            </button>
            <button
              type="button"
              class="iu-arsf__role-btn"
              [class.iu-arsf__role-btn--active]="role() === 'landlord'"
              (click)="role.set('landlord')"
            >
              <span class="material-symbols-outlined">apartment</span>
              Proprietário
            </button>
          </div>

          <!-- Name -->
          <div class="iu-arsf__field">
            <label class="iu-arsf__label" for="arsf-name">Nome completo</label>
            <div class="iu-arsf__input-wrap">
              <span class="material-symbols-outlined iu-arsf__input-icon">person</span>
              <input
                id="arsf-name"
                class="iu-arsf__input"
                [class.iu-arsf__input--error]="showError(f.name)"
                type="text"
                placeholder="O seu nome completo"
                [formField]="f.name"
                autocomplete="name"
              />
            </div>
            @if (showError(f.name)) {
              <span class="iu-arsf__field-error">{{ firstError(f.name) }}</span>
            }
          </div>

          <!-- Email -->
          <div class="iu-arsf__field">
            <label class="iu-arsf__label" for="arsf-email">Email</label>
            <div class="iu-arsf__input-wrap">
              <span class="material-symbols-outlined iu-arsf__input-icon">mail</span>
              <input
                id="arsf-email"
                class="iu-arsf__input"
                [class.iu-arsf__input--error]="showError(f.email)"
                type="email"
                placeholder="nome@exemplo.com"
                [formField]="f.email"
                autocomplete="email"
              />
            </div>
            @if (showError(f.email)) {
              <span class="iu-arsf__field-error">{{ firstError(f.email) }}</span>
            }
          </div>

          <!-- Password -->
          <div class="iu-arsf__field">
            <label class="iu-arsf__label" for="arsf-password">Password</label>
            <div class="iu-arsf__input-wrap">
              <span class="material-symbols-outlined iu-arsf__input-icon">lock</span>
              <input
                id="arsf-password"
                class="iu-arsf__input"
                [class.iu-arsf__input--error]="showError(f.password)"
                [type]="showPassword() ? 'text' : 'password'"
                placeholder="Mínimo 8 caracteres"
                [formField]="f.password"
                autocomplete="new-password"
              />
              <button
                type="button"
                class="iu-arsf__toggle-pw"
                (click)="showPassword.set(!showPassword())"
                [attr.aria-label]="showPassword() ? 'Esconder password' : 'Mostrar password'"
              >
                <span class="material-symbols-outlined">
                  {{ showPassword() ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>

            <!-- Strength bar -->
            @if (f.password().value()) {
              <div class="iu-arsf__strength" [attr.aria-label]="'Força: ' + strengthLabel()">
                @for (bar of [0,1,2,3]; track bar) {
                  <div
                    class="iu-arsf__strength-bar"
                    [class.iu-arsf__strength-bar--active]="bar < passwordStrength()"
                    [style.background]="bar < passwordStrength() ? strengthColor() : undefined"
                  ></div>
                }
                <span class="iu-arsf__strength-label" [style.color]="strengthColor()">
                  {{ strengthLabel() }}
                </span>
              </div>
            }

            @if (showError(f.password)) {
              <span class="iu-arsf__field-error">{{ firstError(f.password) }}</span>
            }
          </div>

          <!-- Confirm Password — cross-field validation via validate() + valueOf -->
          <div class="iu-arsf__field">
            <label class="iu-arsf__label" for="arsf-confirm">Confirmar password</label>
            <div class="iu-arsf__input-wrap">
              <span class="material-symbols-outlined iu-arsf__input-icon">lock_reset</span>
              <input
                id="arsf-confirm"
                class="iu-arsf__input"
                [class.iu-arsf__input--error]="showError(f.confirmPassword)"
                [type]="showPassword() ? 'text' : 'password'"
                placeholder="Repetir password"
                [formField]="f.confirmPassword"
                autocomplete="new-password"
              />
            </div>
            @if (showError(f.confirmPassword)) {
              <span class="iu-arsf__field-error">{{ firstError(f.confirmPassword) }}</span>
            }
          </div>

          <!-- Terms -->
          <label class="iu-arsf__terms">
            <input
              type="checkbox"
              class="iu-arsf__checkbox"
              [checked]="acceptedTerms()"
              (change)="acceptedTerms.set($any($event).target.checked)"
            />
            Aceito os
            <a href="#" class="iu-arsf__link" (click)="$event.preventDefault()">Termos de Serviço</a>
            e a
            <a href="#" class="iu-arsf__link" (click)="$event.preventDefault()">Política de Privacidade</a>
          </label>

          <!-- Submit -->
          <button type="submit" class="iu-arsf__submit" [disabled]="!canSubmit() || loading()">
            @if (loading()) {
              <span class="iu-arsf__spinner"></span>
              A criar conta...
            } @else {
              <span class="material-symbols-outlined">person_add</span>
              Criar conta
            }
          </button>

        </form>

        <!-- Login link -->
        <p class="iu-arsf__footer">
          Já tem conta?
          <button type="button" class="iu-arsf__link-btn" (click)="loginRequested.emit()">
            Entrar agora
          </button>
        </p>
      }

    </div>
  `,
  styles: [`
    .iu-arsf {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 32px;
      max-width: 480px;
      width: 100%;
      margin: 0 auto;
    }

    .iu-arsf__brand {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 28px;
      color: var(--md-sys-color-primary, #6750a4);
    }
    .iu-arsf__brand-icon { font-size: 36px; }
    .iu-arsf__brand-name { font-size: 1.375rem; font-weight: 700; letter-spacing: -0.02em; }
    .iu-arsf__badge {
      padding: 0.125rem 0.5rem;
      border-radius: 999px;
      font-family: ui-monospace, 'SF Mono', Menlo, monospace;
      font-size: 0.6875rem;
      background: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
    }

    .iu-arsf__title {
      font-size: 1.625rem; font-weight: 700; line-height: 1.2;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      margin: 0 0 8px;
      text-align: center;
    }
    .iu-arsf__subtitle {
      font-size: 0.9rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin: 0 0 24px;
      text-align: center;
    }

    .iu-arsf__error-banner {
      display: flex; align-items: center; gap: 10px;
      width: 100%;
      padding: 12px 16px;
      border-radius: 12px;
      background: var(--md-sys-color-error-container, #f9dedc);
      color: var(--md-sys-color-on-error-container, #410e0b);
      font-size: 0.875rem;
      margin-bottom: 20px;
    }
    .iu-arsf__error-banner .material-symbols-outlined { font-size: 20px; flex-shrink: 0; }

    .iu-arsf__form {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Role selector */
    .iu-arsf__role-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 4px;
    }

    .iu-arsf__role-btn {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 16px 12px;
      border: 2px solid var(--md-sys-color-outline-variant, #cac4d0);
      border-radius: 16px;
      background: var(--md-sys-color-surface, #fffbfe);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: 0.875rem; font-weight: 600;
      cursor: pointer;
      transition: border-color 150ms, background 150ms;
      font-family: inherit;

      .material-symbols-outlined { font-size: 28px; }
    }
    .iu-arsf__role-btn:hover { border-color: var(--md-sys-color-primary, #6750a4); background: rgba(103,80,164,.04); }
    .iu-arsf__role-btn--active {
      border-color: var(--md-sys-color-primary, #6750a4);
      background: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
    }

    .iu-arsf__field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .iu-arsf__label {
      font-size: 0.875rem; font-weight: 600;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .iu-arsf__input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .iu-arsf__input-icon {
      position: absolute;
      left: 12px;
      font-size: 20px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      pointer-events: none;
    }

    .iu-arsf__input {
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
    .iu-arsf__input:focus { border-color: var(--md-sys-color-primary, #6750a4); box-shadow: 0 0 0 3px rgba(103,80,164,.15); }
    .iu-arsf__input--error { border-color: var(--md-sys-color-error, #b3261e); }
    .iu-arsf__input:disabled { opacity: 0.6; }

    .iu-arsf__toggle-pw {
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
    .iu-arsf__toggle-pw:hover { background: rgba(28,27,31,.08); }

    .iu-arsf__field-error {
      font-size: 0.75rem;
      color: var(--md-sys-color-error, #b3261e);
    }

    /* Strength bar */
    .iu-arsf__strength {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 2px;
    }

    .iu-arsf__strength-bar {
      height: 4px;
      flex: 1;
      border-radius: 2px;
      background: var(--md-sys-color-outline-variant, #cac4d0);
      transition: background 300ms;
    }
    .iu-arsf__strength-bar--active { background: currentColor; }

    .iu-arsf__strength-label {
      font-size: 0.75rem; font-weight: 600;
      min-width: 60px; text-align: right;
      transition: color 300ms;
    }

    /* Terms */
    .iu-arsf__terms {
      display: flex; align-items: flex-start; gap: 10px;
      font-size: 0.875rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      cursor: pointer;
      line-height: 1.5;
    }
    .iu-arsf__checkbox { accent-color: var(--md-sys-color-primary, #6750a4); margin-top: 2px; flex-shrink: 0; }
    .iu-arsf__link { color: var(--md-sys-color-primary, #6750a4); font-weight: 600; }

    .iu-arsf__submit {
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
    .iu-arsf__submit:hover:not(:disabled) { box-shadow: 0 2px 8px rgba(103,80,164,.4); }
    .iu-arsf__submit:disabled { opacity: 0.56; cursor: not-allowed; }

    .iu-arsf__spinner {
      width: 18px; height: 18px;
      border: 2px solid rgba(255,255,255,.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: iu-arsf-spin 0.7s linear infinite;
    }
    @keyframes iu-arsf-spin { to { transform: rotate(360deg); } }

    .iu-arsf__footer {
      margin: 20px 0 0;
      font-size: 0.9rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      text-align: center;
    }
    .iu-arsf__link-btn {
      background: transparent;
      border: none;
      padding: 0;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--md-sys-color-primary, #6750a4);
      cursor: pointer;
      text-decoration: underline;
      font-family: inherit;
    }

    /* Success state */
    .iu-arsf__success {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      text-align: center;
      padding: 32px 0;
    }
    .iu-arsf__success-icon {
      width: 88px; height: 88px;
      border-radius: 50%;
      background: var(--md-sys-color-primary-container, #eaddff);
      display: flex; align-items: center; justify-content: center;

      .material-symbols-outlined { font-size: 52px; color: var(--md-sys-color-on-primary-container, #21005d); }
    }
    .iu-arsf__success-title { font-size: 1.5rem; font-weight: 700; margin: 0; color: var(--md-sys-color-on-surface, #1c1b1f); }
    .iu-arsf__success-body { font-size: 0.9rem; color: var(--md-sys-color-on-surface-variant, #49454f); margin: 0; max-width: 360px; }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthRegisterSignalFormComponent {
  private readonly auth = inject(AuthService);

  // ── Outputs ────────────────────────────────────────────────────────────────

  /** Emitted after a successful registration. */
  registerSuccess = output<void>();

  /** Emitted when the user clicks "Entrar agora". */
  loginRequested = output<void>();

  // ── UI state (identical to the bespoke twin) ───────────────────────────────

  /** Whether to display password as plain text. */
  readonly showPassword = signal(false);

  /** Whether registration succeeded (shows success screen). */
  readonly isSuccess = signal(false);

  /** User role selection — not part of the form validator chain. */
  readonly role = signal<'tenant' | 'landlord'>('tenant');

  /** Terms checkbox — standalone because it has no text-based validators. */
  readonly acceptedTerms = signal(false);

  /** True once a submit has been attempted (drives error visibility). */
  private readonly submitted = signal(false);

  // ── Official Signal Form ───────────────────────────────────────────────────

  /**
   * Single source of truth. `form()` wraps this signal directly and mutates it in
   * place through the `[formField]` directive — reading `model()` reflects live input.
   */
  private readonly model = signal<AuthRegisterModel>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  /**
   * The official field tree. Every rule is declared inline in the schema; the
   * confirm-password rule reaches across to `password` via `valueOf` — the clean
   * cross-field expression the bespoke single-field validator type couldn't offer.
   */
  protected readonly f = form(this.model, (path) => {
    // Lock every field while a registration request is in flight — the official
    // equivalent of the bespoke `[disabled]="loading()"` (which `[formField]`
    // forbids as a direct binding since it owns the control's disabled state).
    disabled(path.name, () => this.loading());
    disabled(path.email, () => this.loading());
    disabled(path.password, () => this.loading());
    disabled(path.confirmPassword, () => this.loading());

    required(path.name, { message: 'Nome é obrigatório.' });
    minLength(path.name, 2, { message: 'Mínimo 2 caracteres.' });

    required(path.email, { message: 'Email é obrigatório.' });
    email(path.email, { message: 'Email inválido.' });

    required(path.password, { message: 'Password é obrigatória.' });
    minLength(path.password, 8, { message: 'Mínimo 8 caracteres.' });

    // Cross-field: confirm must be non-empty and match password.
    validate(path.confirmPassword, ({ value, valueOf }) => {
      const confirm = value();
      if (!confirm) return { kind: 'required', message: 'Confirme a password.' };
      if (confirm !== valueOf(path.password)) {
        return { kind: 'mismatch', message: 'As passwords não coincidem.' };
      }
      return null;
    });
  });

  // ── Proxied from service ───────────────────────────────────────────────────

  readonly loading = this.auth.loading;
  readonly authError = this.auth.authError;

  // ── Password strength (identical logic to the bespoke twin) ────────────────

  /** 0–4 password strength score. */
  readonly passwordStrength = computed(() => {
    const p = this.f.password().value();
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  });

  /** Human-readable strength label in Portuguese. */
  readonly strengthLabel = computed(() => {
    const s = this.passwordStrength();
    if (s === 0) return 'Muito fraca';
    if (s === 1) return 'Fraca';
    if (s === 2) return 'Razoável';
    if (s === 3) return 'Boa';
    return 'Forte';
  });

  /** Colour associated with current strength level. */
  readonly strengthColor = computed(() => {
    const s = this.passwordStrength();
    if (s <= 1) return '#b3261e';
    if (s === 2) return '#e65100';
    if (s === 3) return '#2e7d32';
    return '#1b5e20';
  });

  /** True when the whole form is valid and terms are accepted. */
  readonly canSubmit = computed(() => this.f().valid() && this.acceptedTerms());

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

    if (this.f().invalid() || !this.acceptedTerms()) return;

    const v = this.model();
    const data: RegisterData = {
      name: v.name.trim(),
      email: v.email.trim().toLowerCase(),
      password: v.password,
      role: this.role(),
    };

    const result = await this.auth.register(data);
    if (result.success) {
      this.isSuccess.set(true);
      this.registerSuccess.emit();
    }
  }
}
