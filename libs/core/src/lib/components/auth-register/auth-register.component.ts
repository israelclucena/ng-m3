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
import { AuthService, RegisterData } from '../../services/auth.service';
import {
  createSignalForm,
  emailValidator,
  minLength,
  required,
} from '../../utils/signal-form';

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * AuthRegister — Standalone registration form component for LisboaRent.
 *
 * Features:
 * - Name, email, password, confirm-password fields with validation
 * - Role selector: Inquilino (tenant) or Proprietário (landlord)
 * - Password strength indicator
 * - Show/hide password toggle
 * - Success state after registration
 * - Links back to login
 *
 * Uses `createSignalForm()` for signal-based form state + validation (Sprint 026).
 * Note: `confirmVal` remains a standalone signal to support the cross-field
 * password-match validator, which reads `form.fields.password.value()`.
 *
 * Feature flag: `AUTH_MODULE`
 *
 * @example
 * ```html
 * <iu-auth-register
 *   (registerSuccess)="onRegistered()"
 *   (loginRequested)="goToLogin()"
 * />
 * ```
 */
@Component({
  selector: 'iu-auth-register',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="iu-ar">

      <!-- Brand -->
      <div class="iu-ar__brand">
        <span class="material-symbols-outlined iu-ar__brand-icon">home_work</span>
        <span class="iu-ar__brand-name">LisboaRent</span>
      </div>

      <h1 class="iu-ar__title">Criar conta</h1>
      <p class="iu-ar__subtitle">Junte-se à maior plataforma de arrendamento em Lisboa</p>

      <!-- Error banner -->
      @if (authError()) {
        <div class="iu-ar__error-banner" role="alert">
          <span class="material-symbols-outlined">error</span>
          {{ authError() }}
        </div>
      }

      <!-- Success state -->
      @if (isSuccess()) {
        <div class="iu-ar__success">
          <div class="iu-ar__success-icon">
            <span class="material-symbols-outlined">check_circle</span>
          </div>
          <h2 class="iu-ar__success-title">Conta criada!</h2>
          <p class="iu-ar__success-body">
            Bem-vindo, {{ form.fields.name.value() }}! A sua conta foi criada com sucesso.
          </p>
          <button class="iu-ar__submit" (click)="loginRequested.emit()">
            <span class="material-symbols-outlined">login</span>
            Ir para o início
          </button>
        </div>
      } @else {

        <form class="iu-ar__form" (submit)="$event.preventDefault(); onSubmit()">

          <!-- Role selector -->
          <div class="iu-ar__role-group" role="group" aria-label="Tipo de conta">
            <button
              type="button"
              class="iu-ar__role-btn"
              [class.iu-ar__role-btn--active]="role() === 'tenant'"
              (click)="role.set('tenant')"
            >
              <span class="material-symbols-outlined">person</span>
              Inquilino
            </button>
            <button
              type="button"
              class="iu-ar__role-btn"
              [class.iu-ar__role-btn--active]="role() === 'landlord'"
              (click)="role.set('landlord')"
            >
              <span class="material-symbols-outlined">apartment</span>
              Proprietário
            </button>
          </div>

          <!-- Name -->
          <div class="iu-ar__field">
            <label class="iu-ar__label" for="ar-name">Nome completo</label>
            <div class="iu-ar__input-wrap">
              <span class="material-symbols-outlined iu-ar__input-icon">person</span>
              <input
                id="ar-name"
                class="iu-ar__input"
                [class.iu-ar__input--error]="form.fields.name.showError()"
                type="text"
                placeholder="O seu nome completo"
                [value]="form.fields.name.value()"
                (input)="form.fields.name.setValue($any($event).target.value)"
                (blur)="form.fields.name.touch()"
                autocomplete="name"
                [disabled]="loading()"
              />
            </div>
            @if (form.fields.name.showError()) {
              <span class="iu-ar__field-error">{{ form.fields.name.firstError() }}</span>
            }
          </div>

          <!-- Email -->
          <div class="iu-ar__field">
            <label class="iu-ar__label" for="ar-email">Email</label>
            <div class="iu-ar__input-wrap">
              <span class="material-symbols-outlined iu-ar__input-icon">mail</span>
              <input
                id="ar-email"
                class="iu-ar__input"
                [class.iu-ar__input--error]="form.fields.email.showError()"
                type="email"
                placeholder="nome@exemplo.com"
                [value]="form.fields.email.value()"
                (input)="form.fields.email.setValue($any($event).target.value)"
                (blur)="form.fields.email.touch()"
                autocomplete="email"
                [disabled]="loading()"
              />
            </div>
            @if (form.fields.email.showError()) {
              <span class="iu-ar__field-error">{{ form.fields.email.firstError() }}</span>
            }
          </div>

          <!-- Password -->
          <div class="iu-ar__field">
            <label class="iu-ar__label" for="ar-password">Password</label>
            <div class="iu-ar__input-wrap">
              <span class="material-symbols-outlined iu-ar__input-icon">lock</span>
              <input
                id="ar-password"
                class="iu-ar__input"
                [class.iu-ar__input--error]="form.fields.password.showError()"
                [type]="showPassword() ? 'text' : 'password'"
                placeholder="Mínimo 8 caracteres"
                [value]="form.fields.password.value()"
                (input)="form.fields.password.setValue($any($event).target.value)"
                (blur)="form.fields.password.touch()"
                autocomplete="new-password"
                [disabled]="loading()"
              />
              <button
                type="button"
                class="iu-ar__toggle-pw"
                (click)="showPassword.set(!showPassword())"
                [attr.aria-label]="showPassword() ? 'Esconder password' : 'Mostrar password'"
              >
                <span class="material-symbols-outlined">
                  {{ showPassword() ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>

            <!-- Strength bar -->
            @if (form.fields.password.value()) {
              <div class="iu-ar__strength" [attr.aria-label]="'Força: ' + strengthLabel()">
                @for (bar of [0,1,2,3]; track bar) {
                  <div
                    class="iu-ar__strength-bar"
                    [class.iu-ar__strength-bar--active]="bar < passwordStrength()"
                    [style.background]="bar < passwordStrength() ? strengthColor() : undefined"
                  ></div>
                }
                <span class="iu-ar__strength-label" [style.color]="strengthColor()">
                  {{ strengthLabel() }}
                </span>
              </div>
            }

            @if (form.fields.password.showError()) {
              <span class="iu-ar__field-error">{{ form.fields.password.firstError() }}</span>
            }
          </div>

          <!-- Confirm Password — cross-field validation via standalone signal -->
          <div class="iu-ar__field">
            <label class="iu-ar__label" for="ar-confirm">Confirmar password</label>
            <div class="iu-ar__input-wrap">
              <span class="material-symbols-outlined iu-ar__input-icon">lock_reset</span>
              <input
                id="ar-confirm"
                class="iu-ar__input"
                [class.iu-ar__input--error]="confirmTouched() && confirmError()"
                [type]="showPassword() ? 'text' : 'password'"
                placeholder="Repetir password"
                [value]="confirmVal()"
                (input)="confirmVal.set($any($event).target.value)"
                (blur)="confirmTouched.set(true)"
                autocomplete="new-password"
                [disabled]="loading()"
              />
            </div>
            @if (confirmTouched() && confirmError()) {
              <span class="iu-ar__field-error">{{ confirmError() }}</span>
            }
          </div>

          <!-- Terms -->
          <label class="iu-ar__terms">
            <input
              type="checkbox"
              class="iu-ar__checkbox"
              [checked]="acceptedTerms()"
              (change)="acceptedTerms.set($any($event).target.checked)"
            />
            Aceito os
            <a href="#" class="iu-ar__link" (click)="$event.preventDefault()">Termos de Serviço</a>
            e a
            <a href="#" class="iu-ar__link" (click)="$event.preventDefault()">Política de Privacidade</a>
          </label>

          <!-- Submit -->
          <button type="submit" class="iu-ar__submit" [disabled]="!canSubmit() || loading()">
            @if (loading()) {
              <span class="iu-ar__spinner"></span>
              A criar conta...
            } @else {
              <span class="material-symbols-outlined">person_add</span>
              Criar conta
            }
          </button>

        </form>

        <!-- Login link -->
        <p class="iu-ar__footer">
          Já tem conta?
          <button type="button" class="iu-ar__link-btn" (click)="loginRequested.emit()">
            Entrar agora
          </button>
        </p>
      }

    </div>
  `,
  styles: [`
    .iu-ar {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 32px;
      max-width: 480px;
      width: 100%;
      margin: 0 auto;
    }

    .iu-ar__brand {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 28px;
      color: var(--md-sys-color-primary, #6750a4);
    }
    .iu-ar__brand-icon { font-size: 36px; }
    .iu-ar__brand-name { font-size: 1.375rem; font-weight: 700; letter-spacing: -0.02em; }

    .iu-ar__title {
      font-size: 1.625rem; font-weight: 700; line-height: 1.2;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      margin: 0 0 8px;
      text-align: center;
    }
    .iu-ar__subtitle {
      font-size: 0.9rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin: 0 0 24px;
      text-align: center;
    }

    .iu-ar__error-banner {
      display: flex; align-items: center; gap: 10px;
      width: 100%;
      padding: 12px 16px;
      border-radius: 12px;
      background: var(--md-sys-color-error-container, #f9dedc);
      color: var(--md-sys-color-on-error-container, #410e0b);
      font-size: 0.875rem;
      margin-bottom: 20px;
    }
    .iu-ar__error-banner .material-symbols-outlined { font-size: 20px; flex-shrink: 0; }

    .iu-ar__form {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Role selector */
    .iu-ar__role-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 4px;
    }

    .iu-ar__role-btn {
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
    .iu-ar__role-btn:hover { border-color: var(--md-sys-color-primary, #6750a4); background: rgba(103,80,164,.04); }
    .iu-ar__role-btn--active {
      border-color: var(--md-sys-color-primary, #6750a4);
      background: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
    }

    .iu-ar__field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .iu-ar__label {
      font-size: 0.875rem; font-weight: 600;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .iu-ar__input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .iu-ar__input-icon {
      position: absolute;
      left: 12px;
      font-size: 20px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      pointer-events: none;
    }

    .iu-ar__input {
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
    .iu-ar__input:focus { border-color: var(--md-sys-color-primary, #6750a4); box-shadow: 0 0 0 3px rgba(103,80,164,.15); }
    .iu-ar__input--error { border-color: var(--md-sys-color-error, #b3261e); }
    .iu-ar__input:disabled { opacity: 0.6; }

    .iu-ar__toggle-pw {
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
    .iu-ar__toggle-pw:hover { background: rgba(28,27,31,.08); }

    .iu-ar__field-error {
      font-size: 0.75rem;
      color: var(--md-sys-color-error, #b3261e);
    }

    /* Strength bar */
    .iu-ar__strength {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 2px;
    }

    .iu-ar__strength-bar {
      height: 4px;
      flex: 1;
      border-radius: 2px;
      background: var(--md-sys-color-outline-variant, #cac4d0);
      transition: background 300ms;
    }
    .iu-ar__strength-bar--active { background: currentColor; }

    .iu-ar__strength-label {
      font-size: 0.75rem; font-weight: 600;
      min-width: 60px; text-align: right;
      transition: color 300ms;
    }

    /* Terms */
    .iu-ar__terms {
      display: flex; align-items: flex-start; gap: 10px;
      font-size: 0.875rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      cursor: pointer;
      line-height: 1.5;
    }
    .iu-ar__checkbox { accent-color: var(--md-sys-color-primary, #6750a4); margin-top: 2px; flex-shrink: 0; }
    .iu-ar__link { color: var(--md-sys-color-primary, #6750a4); font-weight: 600; }

    .iu-ar__submit {
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
    .iu-ar__submit:hover:not(:disabled) { box-shadow: 0 2px 8px rgba(103,80,164,.4); }
    .iu-ar__submit:disabled { opacity: 0.56; cursor: not-allowed; }

    .iu-ar__spinner {
      width: 18px; height: 18px;
      border: 2px solid rgba(255,255,255,.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: iu-ar-spin 0.7s linear infinite;
    }
    @keyframes iu-ar-spin { to { transform: rotate(360deg); } }

    .iu-ar__footer {
      margin: 20px 0 0;
      font-size: 0.9rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      text-align: center;
    }
    .iu-ar__link-btn {
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
    .iu-ar__success {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      text-align: center;
      padding: 32px 0;
    }
    .iu-ar__success-icon {
      width: 88px; height: 88px;
      border-radius: 50%;
      background: var(--md-sys-color-primary-container, #eaddff);
      display: flex; align-items: center; justify-content: center;

      .material-symbols-outlined { font-size: 52px; color: var(--md-sys-color-on-primary-container, #21005d); }
    }
    .iu-ar__success-title { font-size: 1.5rem; font-weight: 700; margin: 0; color: var(--md-sys-color-on-surface, #1c1b1f); }
    .iu-ar__success-body { font-size: 0.9rem; color: var(--md-sys-color-on-surface-variant, #49454f); margin: 0; max-width: 360px; }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthRegisterComponent {
  private readonly auth = inject(AuthService);

  // ── Outputs ────────────────────────────────────────────────────────────────

  /** Emitted after a successful registration. */
  registerSuccess = output<void>();

  /** Emitted when the user clicks "Entrar agora". */
  loginRequested = output<void>();

  // ── UI state ───────────────────────────────────────────────────────────────

  /** Whether to display password as plain text. */
  readonly showPassword = signal(false);

  /** Whether registration succeeded (shows success screen). */
  readonly isSuccess = signal(false);

  /** User role selection — not part of the form validator chain. */
  readonly role = signal<'tenant' | 'landlord'>('tenant');

  /** Terms checkbox — standalone because it has no text-based validators. */
  readonly acceptedTerms = signal(false);

  // ── Signal form (name + email + password) ─────────────────────────────────
  /**
   * Core form fields managed by createSignalForm().
   * Replaces 8 manual signal/computed pairs from the old implementation.
   * Sprint 026 — Signal Forms Migration.
   */
  readonly form = createSignalForm({
    name:     { value: '', validators: [required('Nome é obrigatório.'), minLength(2, 'Mínimo 2 caracteres.')] },
    email:    { value: '', validators: [required('Email é obrigatório.'), emailValidator('Email inválido.')] },
    password: { value: '', validators: [required('Password é obrigatória.'), minLength(8, 'Mínimo 8 caracteres.')] },
  });

  // ── Confirm password — cross-field signal ──────────────────────────────────
  /**
   * Confirm-password is kept as a standalone signal pair because it needs to
   * read `form.fields.password.value()` — a cross-field dependency that the
   * single-field `SignalValidator` type cannot express cleanly.
   */
  readonly confirmVal = signal('');
  readonly confirmTouched = signal(false);

  /** Cross-field validation: confirm must match password. */
  readonly confirmError = computed(() => {
    const v = this.confirmVal();
    if (!v) return 'Confirme a password.';
    return v !== (this.form.fields.password.value() as string) ? 'As passwords não coincidem.' : '';
  });

  // ── Proxied from service ───────────────────────────────────────────────────

  readonly loading = this.auth.loading;
  readonly authError = this.auth.authError;

  // ── Password strength ──────────────────────────────────────────────────────

  /** 0–4 password strength score. */
  readonly passwordStrength = computed(() => {
    const p = this.form.fields.password.value() as string;
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

  /** True when all validations pass and terms are accepted. */
  readonly canSubmit = computed(() =>
    this.form.valid() &&
    !this.confirmError() &&
    this.acceptedTerms()
  );

  // ── Methods ────────────────────────────────────────────────────────────────

  /** Submit handler — triggers full validation then calls AuthService. */
  async onSubmit(): Promise<void> {
    // Mark all form fields as touched via the form utility
    const formValid = this.form.submit();
    // Mark confirm field touched manually (cross-field)
    this.confirmTouched.set(true);

    if (!formValid || this.confirmError() || !this.acceptedTerms()) return;

    const v = this.form.value();
    const data: RegisterData = {
      name:     (v['name'] as string).trim(),
      email:    (v['email'] as string).trim().toLowerCase(),
      password: v['password'] as string,
      role:     this.role(),
    };

    const result = await this.auth.register(data);
    if (result.success) {
      this.isSuccess.set(true);
      this.registerSuccess.emit();
    }
  }
}
