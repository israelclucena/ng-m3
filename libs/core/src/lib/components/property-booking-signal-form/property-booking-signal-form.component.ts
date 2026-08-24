/**
 * @fileoverview PropertyBookingSignalFormComponent — the property booking/inquiry
 * panel rebuilt on Angular 22's **official** Signal Forms API (`@angular/forms/signals`).
 *
 * Sixth migration of a *real product form* off the bespoke `createSignalForm`
 * util onto the official `form()` API (after auth-register #060, tenant-application
 * #061, auth-login #062, maintenance-request #063, lease-agreement #064). It is a
 * faithful, additive, side-by-side twin of {@link PropertyBookingComponent}: identical
 * markup, styles, the `property` input, the `bookingSubmitted`/`closed` outputs and
 * the same emitted `BookingSubmitEvent` — the **only** difference is the form engine.
 *
 * This twin proves the one surface every earlier twin sidestepped: a **two-mode
 * conditional form**. A `bookingType` tab ('visit' | 'inquiry') swaps which optional
 * fields render, and switching tabs calls `f().reset()` (the official FieldState
 * reset, clearing values + touched) — exactly as the bespoke `form.reset()`. All
 * controls bind through the same `[formField]` two-way directive: text/email inputs,
 * a `<select>` time-slot, `<input type="date">` fields, and a `maxLength(500)`
 * `<textarea>`.
 *
 * Migration map (bespoke `createSignalForm` → official `form()`):
 * | bespoke (PropertyBookingComponent)                    | official (this)                                   |
 * | ----------------------------------------------------- | ------------------------------------------------- |
 * | `createSignalForm({ name: { validators:[...] } })`    | `form(model, (p) => { required(p.name); ... })`   |
 * | `[value]` + `(input)` + `(blur)="…touch()"`           | `[formField]="f.name"` (two-way)                  |
 * | `form.fields.name.showError()`                        | `f.name().touched() && f.name().invalid()`        |
 * | `form.reset()` (on tab switch)                        | `f().reset()`                                     |
 * | `form.invalid()` / `form.submit()`                    | `f().invalid()` / `f().markAsTouched()`           |
 *
 * The `[min]="todayISO"` native picker hint the bespoke put on its date inputs is
 * dropped here: native `min` on a `[formField]` node throws NG8022, and it was only
 * a UI hint (never a validator), so the submitted-payload contract is unchanged.
 *
 * The bespoke component remains the shipped default; this twin sits behind
 * `PROPERTY_BOOKING_SIGNAL_FORM` and replaces nothing. A parity spec asserts both
 * emit an identical `BookingSubmitEvent.form` for the same inputs.
 *
 * Feature flag: `PROPERTY_BOOKING_SIGNAL_FORM`
 *
 * @see libs/core/src/lib/components/property-booking/property-booking.component.ts — the bespoke twin
 * @see libs/core/src/lib/components/lease-agreement-signal-form/lease-agreement-signal-form.component.ts — date/number [formField]
 *
 * Night Shift 2026-08-24 — Signal Forms migration #6 (real product form).
 */
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FieldTree,
  FormField,
  email,
  form,
  maxLength,
  minLength,
  required,
} from '@angular/forms/signals';
import { PropertyData } from '../property-card/property-card.component';
import {
  BookingFormData,
  BookingSubmitEvent,
} from '../property-booking/property-booking.component';

// ─── Models ──────────────────────────────────────────────────────────────────

/**
 * The booking form's single source of truth. Every field is a non-optional string
 * (empty-string sentinels) so `[formField]` owns each control directly; the optional
 * shape of {@link BookingFormData} is reconstructed at submit time via trims +
 * `|| undefined`, exactly as the bespoke twin does.
 */
export interface PropertyBookingModel {
  name: string;
  email: string;
  phone: string;
  visitDate: string;
  visitTimeSlot: '' | 'morning' | 'afternoon' | 'evening';
  moveInDate: string;
  message: string;
}

// ─── Time slots ──────────────────────────────────────────────────────────────

const TIME_SLOTS = [
  { value: 'morning', label: '☀️ Manhã (9h–12h)' },
  { value: 'afternoon', label: '🌤️ Tarde (14h–17h)' },
  { value: 'evening', label: '🌙 Final do dia (17h–20h)' },
] as const;

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * `iu-property-booking-signal-form`
 *
 * Feature-parity with {@link PropertyBookingComponent}: property summary, visit /
 * inquiry tabs, name/email/phone + conditional date/time-slot fields, a 500-char
 * message textarea, submit gating, and the success screen — driving the same
 * `bookingSubmitted`/`closed` outputs, built on the official Signal Forms API.
 *
 * Feature flag: `PROPERTY_BOOKING_SIGNAL_FORM`
 *
 * @example
 * ```html
 * <iu-property-booking-signal-form
 *   [property]="selectedProperty"
 *   (bookingSubmitted)="onBookingSubmit($event)"
 *   (closed)="onBookingClose()" />
 * ```
 */
@Component({
  selector: 'iu-property-booking-signal-form',
  standalone: true,
  imports: [CommonModule, FormField],
  template: `
    <div class="iu-pb" role="dialog" aria-modal="true" [attr.aria-label]="'Reservar ' + property().title">

      <!-- ── Backdrop ──────────────────────────────────────────────── -->
      <div
        class="iu-pb__backdrop"
        role="button"
        tabindex="0"
        aria-label="Fechar"
        (click)="onClose()"
        (keydown.enter)="onClose()"
        (keydown.space)="onClose(); $event.preventDefault()"
      ></div>

      <!-- ── Panel ─────────────────────────────────────────────────── -->
      <div class="iu-pb__panel" role="document">

        <!-- Header -->
        <div class="iu-pb__header">
          <span class="iu-pb__header-title">Contactar Proprietário</span>
          <span class="iu-pb__badge">form()</span>
          <button class="iu-pb__close" (click)="onClose()" aria-label="Fechar">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Property Summary -->
        <div class="iu-pb__summary">
          @if (property().imageUrl) {
            <img class="iu-pb__thumb" [src]="property().imageUrl" [alt]="property().title" />
          } @else {
            <div class="iu-pb__thumb iu-pb__thumb--placeholder">
              <span class="material-symbols-outlined">apartment</span>
            </div>
          }
          <div class="iu-pb__summary-info">
            <span class="iu-pb__summary-title">{{ property().title }}</span>
            <span class="iu-pb__summary-location">
              <span class="material-symbols-outlined">location_on</span>
              {{ property().location }}
            </span>
            <span class="iu-pb__summary-price">{{ formattedPrice() }}/mês</span>
          </div>
        </div>

        <!-- Success state -->
        @if (isSuccess()) {
          <div class="iu-pb__success">
            <div class="iu-pb__success-icon">
              <span class="material-symbols-outlined">check_circle</span>
            </div>
            <h3 class="iu-pb__success-title">
              {{ bookingType() === 'visit' ? 'Pedido de visita enviado!' : 'Mensagem enviada!' }}
            </h3>
            <p class="iu-pb__success-body">
              Entraremos em contacto brevemente para confirmar.
            </p>
            <button class="iu-pb__btn iu-pb__btn--filled" (click)="onClose()">Fechar</button>
          </div>
        } @else {

          <!-- Booking Type Tabs -->
          <div class="iu-pb__tabs" role="tablist">
            <button
              class="iu-pb__tab"
              [class.iu-pb__tab--active]="bookingType() === 'visit'"
              role="tab"
              [attr.aria-selected]="bookingType() === 'visit'"
              (click)="setBookingType('visit')"
            >
              <span class="material-symbols-outlined">calendar_month</span>
              Agendar Visita
            </button>
            <button
              class="iu-pb__tab"
              [class.iu-pb__tab--active]="bookingType() === 'inquiry'"
              role="tab"
              [attr.aria-selected]="bookingType() === 'inquiry'"
              (click)="setBookingType('inquiry')"
            >
              <span class="material-symbols-outlined">mail</span>
              Enviar Mensagem
            </button>
          </div>

          <!-- Form -->
          <form class="iu-pb__form" (submit)="$event.preventDefault(); onSubmit()" novalidate>

            <!-- Name + Email row -->
            <div class="iu-pb__row">
              <div class="iu-pb__field">
                <label class="iu-pb__label" for="pbs-name">Nome *</label>
                <input
                  id="pbs-name"
                  class="iu-pb__input"
                  [class.iu-pb__input--error]="showError(f.name)"
                  type="text"
                  placeholder="O seu nome completo"
                  [formField]="f.name"
                  autocomplete="name"
                />
                @if (showError(f.name)) {
                  <span class="iu-pb__error">{{ firstError(f.name) }}</span>
                }
              </div>

              <div class="iu-pb__field">
                <label class="iu-pb__label" for="pbs-email">Email *</label>
                <input
                  id="pbs-email"
                  class="iu-pb__input"
                  [class.iu-pb__input--error]="showError(f.email)"
                  type="email"
                  placeholder="nome@exemplo.com"
                  [formField]="f.email"
                  autocomplete="email"
                />
                @if (showError(f.email)) {
                  <span class="iu-pb__error">{{ firstError(f.email) }}</span>
                }
              </div>
            </div>

            <!-- Phone -->
            <div class="iu-pb__field">
              <label class="iu-pb__label" for="pbs-phone">Telefone</label>
              <input
                id="pbs-phone"
                class="iu-pb__input"
                type="tel"
                placeholder="+351 9XX XXX XXX"
                [formField]="f.phone"
                autocomplete="tel"
              />
            </div>

            <!-- Visit-specific fields -->
            @if (bookingType() === 'visit') {
              <div class="iu-pb__row">
                <div class="iu-pb__field">
                  <label class="iu-pb__label" for="pbs-visit-date">Data da Visita</label>
                  <input
                    id="pbs-visit-date"
                    class="iu-pb__input"
                    type="date"
                    [formField]="f.visitDate"
                  />
                </div>

                <div class="iu-pb__field">
                  <label class="iu-pb__label" for="pbs-time-slot">Período</label>
                  <select
                    id="pbs-time-slot"
                    class="iu-pb__select"
                    [formField]="f.visitTimeSlot"
                  >
                    <option value="">-- Escolher período --</option>
                    @for (slot of timeSlots; track slot.value) {
                      <option [value]="slot.value">{{ slot.label }}</option>
                    }
                  </select>
                </div>
              </div>
            }

            <!-- Move-in date (inquiry) -->
            @if (bookingType() === 'inquiry') {
              <div class="iu-pb__field">
                <label class="iu-pb__label" for="pbs-movein">Data de entrada pretendida</label>
                <input
                  id="pbs-movein"
                  class="iu-pb__input"
                  type="date"
                  [formField]="f.moveInDate"
                />
              </div>
            }

            <!-- Message -->
            <div class="iu-pb__field">
              <label class="iu-pb__label" for="pbs-message">Mensagem</label>
              <textarea
                id="pbs-message"
                class="iu-pb__textarea"
                rows="4"
                [placeholder]="messagePlaceholder()"
                [formField]="f.message"
                [class.iu-pb__textarea--error]="showError(f.message)"
              ></textarea>
              <span class="iu-pb__char-count">{{ f.message().value().length }}/500</span>
              @if (showError(f.message)) {
                <span class="iu-pb__error">{{ firstError(f.message) }}</span>
              }
            </div>

            <!-- Actions -->
            <div class="iu-pb__actions">
              <button type="button" class="iu-pb__btn iu-pb__btn--outlined" (click)="onClose()">
                Cancelar
              </button>
              <button
                type="submit"
                class="iu-pb__btn iu-pb__btn--filled"
                [disabled]="f().invalid()"
              >
                <span class="material-symbols-outlined">send</span>
                {{ bookingType() === 'visit' ? 'Solicitar Visita' : 'Enviar Mensagem' }}
              </button>
            </div>

          </form>
        }

      </div>
    </div>
  `,
  styles: [`
    .iu-pb {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }

    .iu-pb__backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.48);
      backdrop-filter: blur(2px);
    }

    .iu-pb__panel {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 680px;
      max-height: 92vh;
      overflow-y: auto;
      background: var(--md-sys-color-surface-container-low, #f7f2f9);
      border-radius: 28px 28px 0 0;
      padding: 0 0 24px;
      box-shadow: var(--md-sys-elevation-5, 0 8px 32px rgba(0,0,0,.24));
    }

    @media (min-width: 720px) {
      .iu-pb__panel {
        border-radius: 28px;
        margin: auto;
        max-height: 88vh;
      }
    }

    .iu-pb__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px 12px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }

    .iu-pb__header-title {
      font-size: 1.375rem;
      font-weight: 600;
      line-height: 1.3;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .iu-pb__badge {
      margin-left: auto;
      margin-right: 8px;
      align-self: center;
      padding: 0.125rem 0.5rem;
      border-radius: 999px;
      font-family: ui-monospace, 'SF Mono', Menlo, monospace;
      font-size: 0.6875rem;
      background: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
    }

    .iu-pb__close {
      background: transparent;
      border: none;
      border-radius: 50%;
      width: 40px; height: 40px;
      display: flex; align-items: center; justify-content: center;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      cursor: pointer;
      transition: background 150ms;
    }
    .iu-pb__close:hover { background: rgba(73,69,79,0.12); }

    .iu-pb__summary {
      display: flex;
      gap: 16px;
      align-items: center;
      padding: 16px 24px;
      background: var(--md-sys-color-surface-container, #ece6f0);
      margin: 16px;
      border-radius: 16px;
    }

    .iu-pb__thumb {
      width: 80px; height: 64px;
      border-radius: 12px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .iu-pb__thumb--placeholder {
      display: flex; align-items: center; justify-content: center;
      background: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
    }
    .iu-pb__thumb--placeholder .material-symbols-outlined { font-size: 32px; }

    .iu-pb__summary-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .iu-pb__summary-title {
      font-size: 1rem; font-weight: 500;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }

    .iu-pb__summary-location {
      display: flex; align-items: center; gap: 4px;
      font-size: 0.75rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .iu-pb__summary-location .material-symbols-outlined { font-size: 14px; }

    .iu-pb__summary-price {
      font-size: 0.875rem; font-weight: 600;
      color: var(--md-sys-color-primary, #6750a4);
    }

    .iu-pb__tabs {
      display: flex;
      padding: 0 24px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }

    .iu-pb__tab {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 20px;
      background: transparent;
      border: none;
      border-bottom: 3px solid transparent;
      font-size: 0.875rem; font-weight: 600;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      cursor: pointer;
      transition: color 150ms, border-color 150ms;
    }
    .iu-pb__tab .material-symbols-outlined { font-size: 18px; }
    .iu-pb__tab:hover { color: var(--md-sys-color-on-surface, #1c1b1f); background: rgba(28,27,31,.04); }
    .iu-pb__tab--active {
      color: var(--md-sys-color-primary, #6750a4);
      border-bottom-color: var(--md-sys-color-primary, #6750a4);
    }

    .iu-pb__form {
      padding: 20px 24px 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .iu-pb__row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    @media (max-width: 560px) { .iu-pb__row { grid-template-columns: 1fr; } }

    .iu-pb__field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .iu-pb__label {
      font-size: 0.75rem; font-weight: 500;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .iu-pb__input,
    .iu-pb__select,
    .iu-pb__textarea {
      border: 1px solid var(--md-sys-color-outline, #79747e);
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 0.875rem;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      background: var(--md-sys-color-surface, #fffbfe);
      outline: none;
      transition: border-color 150ms;
      font-family: inherit;
    }
    .iu-pb__input:focus,
    .iu-pb__select:focus,
    .iu-pb__textarea:focus {
      border-color: var(--md-sys-color-primary, #6750a4);
      box-shadow: 0 0 0 3px rgba(103,80,164,.15);
    }
    .iu-pb__input--error,
    .iu-pb__textarea--error { border-color: var(--md-sys-color-error, #b3261e); }
    .iu-pb__select { cursor: pointer; }
    .iu-pb__textarea { resize: vertical; min-height: 88px; }

    .iu-pb__error {
      font-size: 0.75rem;
      color: var(--md-sys-color-error, #b3261e);
    }

    .iu-pb__char-count {
      font-size: 0.75rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      text-align: right;
    }

    .iu-pb__actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 4px;
    }

    .iu-pb__btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 24px;
      border-radius: 100px;
      font-size: 0.875rem; font-weight: 600;
      cursor: pointer;
      transition: background 150ms, box-shadow 150ms;
      border: none;
      font-family: inherit;
    }
    .iu-pb__btn .material-symbols-outlined { font-size: 18px; }
    .iu-pb__btn--filled {
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
    }
    .iu-pb__btn--filled:hover:not(:disabled) {
      box-shadow: 0 2px 6px rgba(103,80,164,.38);
    }
    .iu-pb__btn--filled:disabled {
      background: rgba(28,27,31,.12);
      color: rgba(28,27,31,.38);
      cursor: not-allowed;
    }
    .iu-pb__btn--outlined {
      background: transparent;
      color: var(--md-sys-color-primary, #6750a4);
      border: 1px solid var(--md-sys-color-outline, #79747e);
    }
    .iu-pb__btn--outlined:hover { background: rgba(103,80,164,.06); }

    .iu-pb__success {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 24px 24px;
      gap: 16px;
      text-align: center;
    }

    .iu-pb__success-icon {
      width: 80px; height: 80px;
      border-radius: 50%;
      background: var(--md-sys-color-primary-container, #eaddff);
      display: flex; align-items: center; justify-content: center;
    }
    .iu-pb__success-icon .material-symbols-outlined {
      font-size: 48px;
      color: var(--md-sys-color-on-primary-container, #21005d);
    }

    .iu-pb__success-title {
      font-size: 1.5rem; font-weight: 600; line-height: 1.3;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      margin: 0;
    }

    .iu-pb__success-body {
      font-size: 1rem; line-height: 1.5;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin: 0;
      max-width: 400px;
    }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyBookingSignalFormComponent {

  // ── Inputs ─────────────────────────────────────────────────────────────────

  /**
   * The property to book/inquire about. Required.
   * Feature flag: `PROPERTY_BOOKING_SIGNAL_FORM`
   */
  property = input.required<PropertyData>();

  // ── Outputs ────────────────────────────────────────────────────────────────

  /** Emitted when the booking/inquiry form is submitted. */
  bookingSubmitted = output<BookingSubmitEvent>();

  /** Emitted when the panel is closed (cancel or after success). */
  closed = output<void>();

  // ── State ──────────────────────────────────────────────────────────────────

  readonly bookingType = signal<'visit' | 'inquiry'>('visit');
  readonly isSuccess = signal(false);

  /** True once a submit has been attempted (drives error visibility, like the bespoke touch-on-submit). */
  private readonly submittedAttempt = signal(false);

  readonly timeSlots = TIME_SLOTS;

  // ── Official Signal Form ───────────────────────────────────────────────────

  /** The pristine model, reused to reset on tab switch (mirrors the bespoke `form.reset()`). */
  private static readonly EMPTY_MODEL: PropertyBookingModel = {
    name: '',
    email: '',
    phone: '',
    visitDate: '',
    visitTimeSlot: '',
    moveInDate: '',
    message: '',
  };

  /** Single source of truth; `form()` wraps and mutates it via `[formField]`. */
  private readonly model = signal<PropertyBookingModel>({
    ...PropertyBookingSignalFormComponent.EMPTY_MODEL,
  });

  /**
   * Field tree with every rule declared inline. Messages mirror the bespoke twin's
   * `createSignalForm` validators byte-for-byte so both surfaces read identically.
   * phone/visitDate/visitTimeSlot/moveInDate carry no rules (optional in both twins).
   */
  protected readonly f = form(this.model, (path) => {
    required(path.name, { message: 'Nome é obrigatório.' });
    minLength(path.name, 2, { message: 'Nome deve ter pelo menos 2 caracteres.' });

    required(path.email, { message: 'Email é obrigatório.' });
    email(path.email, { message: 'Email inválido.' });

    maxLength(path.message, 500, { message: 'Mensagem não pode exceder 500 caracteres.' });
  });

  // ── Computed ───────────────────────────────────────────────────────────────

  /** Formatted monthly price in EUR (pt-PT locale). */
  formattedPrice = computed(() =>
    new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(this.property().priceMonthly)
  );

  /** Context-aware placeholder text for the message textarea. */
  messagePlaceholder = computed(() =>
    this.bookingType() === 'visit'
      ? 'Alguma questão adicional sobre a visita? (opcional)'
      : 'Descreva o que procura, datas de interesse, ou qualquer questão...'
  );

  // ── Error-display helpers (mirror the bespoke showError/firstError) ─────────

  /** Whether a field should surface its error — touched (or submitted) AND invalid. */
  protected showError<T>(field: FieldTree<T>): boolean {
    const state = field();
    return (state.touched() || this.submittedAttempt()) && state.invalid();
  }

  /** First human-readable error message for a field, or empty string. */
  protected firstError<T>(field: FieldTree<T>): string {
    return field().errors()[0]?.message ?? '';
  }

  // ── Methods ────────────────────────────────────────────────────────────────

  /** Switch between visit scheduling and general inquiry, resetting the form. */
  setBookingType(type: 'visit' | 'inquiry'): void {
    this.bookingType.set(type);
    // Clear the source-of-truth values, then reset the field tree's touched/dirty
    // flags — together they mirror the bespoke `form.reset()`.
    this.model.set({ ...PropertyBookingSignalFormComponent.EMPTY_MODEL });
    this.f().reset();
    this.submittedAttempt.set(false);
  }

  /** Close/dismiss the booking panel. */
  onClose(): void {
    this.closed.emit();
  }

  /**
   * Submit the booking form. Marks all fields touched + validates; on success builds
   * the {@link BookingFormData}, shows the success state and emits `bookingSubmitted`.
   */
  onSubmit(): void {
    this.submittedAttempt.set(true);
    this.f().markAsTouched();
    if (this.f().invalid()) return;

    const v = this.model();
    const formData: BookingFormData = {
      name:        v.name.trim(),
      email:       v.email.trim(),
      phone:       v.phone.trim() || undefined,
      bookingType: this.bookingType(),
      message:     v.message.trim() || undefined,
      ...(this.bookingType() === 'visit'
        ? {
            visitDate:     v.visitDate || undefined,
            visitTimeSlot: (v.visitTimeSlot as BookingFormData['visitTimeSlot']) || undefined,
          }
        : { moveInDate: v.moveInDate || undefined }),
    };

    this.isSuccess.set(true);
    this.bookingSubmitted.emit({ property: this.property(), form: formData });
  }
}
