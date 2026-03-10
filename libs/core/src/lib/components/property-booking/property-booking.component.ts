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
import { PropertyData } from '../property-card/property-card.component';

// ─── Models ──────────────────────────────────────────────────────────────────

/**
 * Booking form data submitted by the user.
 * Feature flag: `PROPERTY_BOOKING`
 */
export interface BookingFormData {
  /** Full name of the enquirer */
  name: string;
  /** Contact email */
  email: string;
  /** Contact phone (optional) */
  phone?: string;
  /** Preferred move-in date (ISO string) */
  moveInDate?: string;
  /** Preferred visit date/time (ISO string) */
  visitDate?: string;
  /** Preferred visit time slot */
  visitTimeSlot?: 'morning' | 'afternoon' | 'evening';
  /** Booking type: visit request or general inquiry */
  bookingType: 'visit' | 'inquiry';
  /** Free-text message */
  message?: string;
}

/**
 * BookingSubmitEvent — emitted when the form is submitted successfully.
 */
export interface BookingSubmitEvent {
  property: PropertyData;
  form: BookingFormData;
}

// ─── Time slots ──────────────────────────────────────────────────────────────

const TIME_SLOTS = [
  { value: 'morning', label: '☀️ Manhã (9h–12h)' },
  { value: 'afternoon', label: '🌤️ Tarde (14h–17h)' },
  { value: 'evening', label: '🌙 Final do dia (17h–20h)' },
] as const;

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * PropertyBooking — Booking / inquiry panel for a LisboaRent property.
 *
 * Shows:
 * - Compact property summary (image, title, price)
 * - Tab selector: "Agendar Visita" vs "Enviar Mensagem"
 * - Form with name, email, phone, preferred dates, message
 * - Success confirmation state after submit
 *
 * Feature flag: `PROPERTY_BOOKING`
 *
 * @example
 * ```html
 * <iu-property-booking
 *   [property]="selectedProperty"
 *   (bookingSubmitted)="onBookingSubmit($event)"
 *   (closed)="onBookingClose()"
 * />
 * ```
 */
@Component({
  selector: 'iu-property-booking',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="iu-pb" role="dialog" aria-modal="true" [attr.aria-label]="'Reservar ' + property().title">

      <!-- ── Backdrop ──────────────────────────────────────────────── -->
      <div class="iu-pb__backdrop" (click)="onClose()"></div>

      <!-- ── Panel ─────────────────────────────────────────────────── -->
      <div class="iu-pb__panel" role="document">

        <!-- Header -->
        <div class="iu-pb__header">
          <span class="iu-pb__header-title">Contactar Proprietário</span>
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
          <form class="iu-pb__form" (submit)="$event.preventDefault(); onSubmit()">

            <!-- Name + Email row -->
            <div class="iu-pb__row">
              <div class="iu-pb__field">
                <label class="iu-pb__label" for="pb-name">Nome *</label>
                <input
                  id="pb-name"
                  class="iu-pb__input"
                  [class.iu-pb__input--error]="nameError()"
                  type="text"
                  placeholder="O seu nome completo"
                  [value]="nameVal()"
                  (input)="nameVal.set($any($event.target).value)"
                  autocomplete="name"
                />
                @if (nameError()) {
                  <span class="iu-pb__error">{{ nameError() }}</span>
                }
              </div>

              <div class="iu-pb__field">
                <label class="iu-pb__label" for="pb-email">Email *</label>
                <input
                  id="pb-email"
                  class="iu-pb__input"
                  [class.iu-pb__input--error]="emailError()"
                  type="email"
                  placeholder="nome@exemplo.com"
                  [value]="emailVal()"
                  (input)="emailVal.set($any($event.target).value)"
                  autocomplete="email"
                />
                @if (emailError()) {
                  <span class="iu-pb__error">{{ emailError() }}</span>
                }
              </div>
            </div>

            <!-- Phone -->
            <div class="iu-pb__field">
              <label class="iu-pb__label" for="pb-phone">Telefone</label>
              <input
                id="pb-phone"
                class="iu-pb__input"
                type="tel"
                placeholder="+351 9XX XXX XXX"
                [value]="phoneVal()"
                (input)="phoneVal.set($any($event.target).value)"
                autocomplete="tel"
              />
            </div>

            <!-- Visit-specific fields -->
            @if (bookingType() === 'visit') {
              <div class="iu-pb__row">
                <div class="iu-pb__field">
                  <label class="iu-pb__label" for="pb-visit-date">Data da Visita</label>
                  <input
                    id="pb-visit-date"
                    class="iu-pb__input"
                    type="date"
                    [min]="todayISO"
                    [value]="visitDateVal()"
                    (input)="visitDateVal.set($any($event.target).value)"
                  />
                </div>

                <div class="iu-pb__field">
                  <label class="iu-pb__label" for="pb-time-slot">Período</label>
                  <select
                    id="pb-time-slot"
                    class="iu-pb__select"
                    [value]="visitTimeSlotVal()"
                    (change)="visitTimeSlotVal.set($any($event.target).value)"
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
                <label class="iu-pb__label" for="pb-movein">Data de entrada pretendida</label>
                <input
                  id="pb-movein"
                  class="iu-pb__input"
                  type="date"
                  [min]="todayISO"
                  [value]="moveInDateVal()"
                  (input)="moveInDateVal.set($any($event.target).value)"
                />
              </div>
            }

            <!-- Message -->
            <div class="iu-pb__field">
              <label class="iu-pb__label" for="pb-message">Mensagem</label>
              <textarea
                id="pb-message"
                class="iu-pb__textarea"
                rows="4"
                [placeholder]="messagePlaceholder()"
                [value]="messageVal()"
                (input)="messageVal.set($any($event.target).value)"
              ></textarea>
              <span class="iu-pb__char-count">{{ messageVal().length }}/500</span>
            </div>

            <!-- Actions -->
            <div class="iu-pb__actions">
              <button type="button" class="iu-pb__btn iu-pb__btn--outlined" (click)="onClose()">
                Cancelar
              </button>
              <button
                type="submit"
                class="iu-pb__btn iu-pb__btn--filled"
                [disabled]="!isFormValid()"
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
    .iu-pb__input--error { border-color: var(--md-sys-color-error, #b3261e); }
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
export class PropertyBookingComponent {

  // ── Inputs ─────────────────────────────────────────────────────────────────

  /**
   * The property to book/inquire about. Required.
   * Feature flag: `PROPERTY_BOOKING`
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

  readonly nameVal = signal('');
  readonly emailVal = signal('');
  readonly phoneVal = signal('');
  readonly visitDateVal = signal('');
  readonly visitTimeSlotVal = signal('');
  readonly moveInDateVal = signal('');
  readonly messageVal = signal('');

  readonly timeSlots = TIME_SLOTS;
  readonly todayISO = new Date().toISOString().split('T')[0];

  // ── Computed ───────────────────────────────────────────────────────────────

  /** Formatted monthly price in EUR (pt-PT locale). */
  formattedPrice = computed(() =>
    new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(this.property().priceMonthly)
  );

  /** Validation error for name field; empty string when valid. */
  nameError = computed(() => {
    const v = this.nameVal();
    if (!v) return '';
    return v.trim().length < 2 ? 'Nome deve ter pelo menos 2 caracteres' : '';
  });

  /** Validation error for email field; empty string when valid. */
  emailError = computed(() => {
    const v = this.emailVal();
    if (!v) return '';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Email inválido';
  });

  /** True when the form can be submitted. */
  isFormValid = computed(() =>
    this.nameVal().trim().length >= 2 &&
    !this.nameError() &&
    this.emailVal().trim().length > 0 &&
    !this.emailError()
  );

  /** Context-aware placeholder text for the message textarea. */
  messagePlaceholder = computed(() =>
    this.bookingType() === 'visit'
      ? 'Alguma questão adicional sobre a visita? (opcional)'
      : 'Descreva o que procura, datas de interesse, ou qualquer questão...'
  );

  // ── Methods ────────────────────────────────────────────────────────────────

  /** Switch between visit scheduling and general inquiry. */
  setBookingType(type: 'visit' | 'inquiry'): void {
    this.bookingType.set(type);
  }

  /** Close/dismiss the booking panel. */
  onClose(): void {
    this.closed.emit();
  }

  /** Submit the booking form, show success state, emit event. */
  onSubmit(): void {
    if (!this.isFormValid()) return;

    const formData: BookingFormData = {
      name: this.nameVal().trim(),
      email: this.emailVal().trim(),
      phone: this.phoneVal().trim() || undefined,
      bookingType: this.bookingType(),
      message: this.messageVal().trim() || undefined,
      ...(this.bookingType() === 'visit'
        ? {
            visitDate: this.visitDateVal() || undefined,
            visitTimeSlot: (this.visitTimeSlotVal() as BookingFormData['visitTimeSlot']) || undefined,
          }
        : { moveInDate: this.moveInDateVal() || undefined }),
    };

    this.isSuccess.set(true);
    this.bookingSubmitted.emit({ property: this.property(), form: formData });
  }
}
