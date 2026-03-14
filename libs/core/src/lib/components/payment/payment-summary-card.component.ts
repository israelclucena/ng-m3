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
  BookingPaymentSummary,
  PaymentFormData,
  PaymentMethod,
  PaymentMethodType,
  PaymentSubmitEvent,
} from './payment.types';

/**
 * `iu-payment-summary-card` — Checkout card showing booking breakdown and payment method selection.
 *
 * Feature flag: `PAYMENT_MODULE`
 *
 * @example
 * ```html
 * <iu-payment-summary-card
 *   [summary]="bookingSummary"
 *   (paymentSubmit)="onPaymentSubmit($event)"
 * />
 * ```
 */
@Component({
  selector: 'iu-payment-summary-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="iu-payment-card">

      <!-- ── Property Summary ── -->
      <div class="iu-payment-card__property">
        @if (summary().propertyImage) {
          <img
            class="iu-payment-card__property-img"
            [src]="summary().propertyImage"
            [alt]="summary().propertyTitle"
          />
        } @else {
          <div class="iu-payment-card__property-img iu-payment-card__property-img--placeholder">
            <span class="material-symbols-outlined">apartment</span>
          </div>
        }
        <div class="iu-payment-card__property-info">
          <h3 class="iu-payment-card__property-title">{{ summary().propertyTitle }}</h3>
          <p class="iu-payment-card__property-address">
            <span class="material-symbols-outlined" aria-hidden="true">location_on</span>
            {{ summary().propertyAddress }}
          </p>
          <p class="iu-payment-card__property-dates">
            <span class="material-symbols-outlined" aria-hidden="true">calendar_today</span>
            Entrada: {{ summary().checkIn | date:'dd MMM yyyy' }}
            @if (summary().months) {
              · {{ summary().months }} {{ summary().months === 1 ? 'mês' : 'meses' }}
            }
          </p>
        </div>
      </div>

      <!-- ── Line Items ── -->
      <div class="iu-payment-card__breakdown">
        <h4 class="iu-payment-card__section-label">Resumo do pagamento</h4>
        @for (item of summary().lineItems; track item.label) {
          <div class="iu-payment-card__line" [class]="'iu-payment-card__line--' + item.type">
            <span class="iu-payment-card__line-label">{{ item.label }}</span>
            <span class="iu-payment-card__line-amount">
              {{ item.type === 'discount' ? '-' : '' }}{{ item.amount | currency:summary().currency:'symbol':'1.0-0' }}
            </span>
          </div>
        }
        <div class="iu-payment-card__total">
          <span>Total</span>
          <span class="iu-payment-card__total-amount">
            {{ summary().total | currency:summary().currency:'symbol':'1.0-0' }}
          </span>
        </div>
        <p class="iu-payment-card__deposit-note">
          <span class="material-symbols-outlined" aria-hidden="true">info</span>
          Depósito de garantia: {{ summary().depositAmount | currency:summary().currency:'symbol':'1.0-0' }}
          (reembolsável)
        </p>
      </div>

      <!-- ── Payment Method ── -->
      <div class="iu-payment-card__methods">
        <h4 class="iu-payment-card__section-label">Método de pagamento</h4>
        <div class="iu-payment-card__method-list">
          @for (method of paymentMethods; track method.id) {
            <button
              class="iu-payment-card__method-btn"
              [class.iu-payment-card__method-btn--active]="selectedMethod() === method.id"
              (click)="selectMethod(method.id)"
              type="button"
              [attr.aria-pressed]="selectedMethod() === method.id"
            >
              <span class="material-symbols-outlined" aria-hidden="true">{{ method.icon }}</span>
              <span class="iu-payment-card__method-label">{{ method.label }}</span>
            </button>
          }
        </div>

        <!-- Card Fields -->
        @if (selectedMethod() === 'card') {
          <div class="iu-payment-card__card-fields">
            <div class="iu-payment-card__field">
              <label class="iu-payment-card__label">Nome no cartão</label>
              <input
                class="iu-payment-card__input"
                type="text"
                placeholder="Ex: Maria João Silva"
                [value]="cardHolder()"
                (input)="cardHolder.set($any($event.target).value)"
                autocomplete="cc-name"
              />
            </div>
            <div class="iu-payment-card__field">
              <label class="iu-payment-card__label">Número do cartão</label>
              <input
                class="iu-payment-card__input"
                type="text"
                placeholder="•••• •••• •••• ••••"
                [value]="cardNumber()"
                (input)="cardNumber.set($any($event.target).value)"
                maxlength="19"
                autocomplete="cc-number"
              />
            </div>
            <div class="iu-payment-card__field">
              <label class="iu-payment-card__label">Validade</label>
              <input
                class="iu-payment-card__input iu-payment-card__input--half"
                type="text"
                placeholder="MM/AA"
                [value]="cardExpiry()"
                (input)="cardExpiry.set($any($event.target).value)"
                maxlength="5"
                autocomplete="cc-exp"
              />
            </div>
          </div>
        }

        <!-- MBWay field -->
        @if (selectedMethod() === 'mbway') {
          <div class="iu-payment-card__card-fields">
            <div class="iu-payment-card__field">
              <label class="iu-payment-card__label">Número de telemóvel (MBWay)</label>
              <input
                class="iu-payment-card__input"
                type="tel"
                placeholder="+351 9XX XXX XXX"
                [value]="mbwayPhone()"
                (input)="mbwayPhone.set($any($event.target).value)"
                autocomplete="tel"
              />
            </div>
          </div>
        }

        <!-- Bank transfer info -->
        @if (selectedMethod() === 'bank_transfer') {
          <div class="iu-payment-card__bank-info">
            <p class="iu-payment-card__bank-detail">
              <strong>IBAN:</strong> PT50 0001 0000 0012 3456 7890 2
            </p>
            <p class="iu-payment-card__bank-detail">
              <strong>Referência:</strong> LR-{{ summary().propertyTitle.slice(0,4).toUpperCase() }}-2026
            </p>
            <p class="iu-payment-card__bank-note">
              A reserva será confirmada após receção da transferência (1–2 dias úteis).
            </p>
          </div>
        }
      </div>

      <!-- ── Terms ── -->
      <label class="iu-payment-card__terms">
        <input
          type="checkbox"
          [checked]="termsAccepted()"
          (change)="termsAccepted.set($any($event.target).checked)"
        />
        <span>
          Aceito os
          <a href="#" class="iu-payment-card__terms-link">Termos e Condições</a>
          e a
          <a href="#" class="iu-payment-card__terms-link">Política de Privacidade</a>
          da LisboaRent.
        </span>
      </label>

      <!-- ── Submit ── -->
      <button
        class="iu-payment-card__submit"
        [disabled]="!canSubmit()"
        (click)="onSubmit()"
        type="button"
      >
        <span class="material-symbols-outlined" aria-hidden="true">lock</span>
        Confirmar e Pagar {{ summary().total | currency:summary().currency:'symbol':'1.0-0' }}
      </button>

      <p class="iu-payment-card__secure-note">
        <span class="material-symbols-outlined" aria-hidden="true">verified_user</span>
        Pagamento seguro e encriptado — LisboaRent não armazena dados de cartão.
      </p>

    </div>
  `,
  styles: [`
    .iu-payment-card {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 24px;
      background: var(--md-sys-color-surface-container-low);
      border-radius: 16px;
      max-width: 520px;
      font-family: var(--md-sys-typescale-body-medium-font, inherit);
    }

    /* ── Property ── */
    .iu-payment-card__property {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }
    .iu-payment-card__property-img {
      width: 80px;
      height: 64px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .iu-payment-card__property-img--placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--md-sys-color-surface-variant);
      color: var(--md-sys-color-on-surface-variant);
    }
    .iu-payment-card__property-info { flex: 1; }
    .iu-payment-card__property-title {
      margin: 0 0 4px;
      font-size: 16px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
    }
    .iu-payment-card__property-address,
    .iu-payment-card__property-dates {
      display: flex;
      align-items: center;
      gap: 4px;
      margin: 2px 0;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant);
    }
    .iu-payment-card__property-address .material-symbols-outlined,
    .iu-payment-card__property-dates .material-symbols-outlined {
      font-size: 14px;
    }

    /* ── Breakdown ── */
    .iu-payment-card__breakdown {
      border-top: 1px solid var(--md-sys-color-outline-variant);
      padding-top: 16px;
    }
    .iu-payment-card__section-label {
      margin: 0 0 12px;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--md-sys-color-on-surface-variant);
    }
    .iu-payment-card__line {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      margin-bottom: 8px;
      color: var(--md-sys-color-on-surface);
    }
    .iu-payment-card__line--discount .iu-payment-card__line-amount {
      color: var(--md-sys-color-tertiary, #38a169);
    }
    .iu-payment-card__line--deposit {
      font-style: italic;
      color: var(--md-sys-color-on-surface-variant);
    }
    .iu-payment-card__total {
      display: flex;
      justify-content: space-between;
      padding-top: 12px;
      margin-top: 4px;
      border-top: 1px solid var(--md-sys-color-outline-variant);
      font-weight: 700;
      font-size: 17px;
      color: var(--md-sys-color-on-surface);
    }
    .iu-payment-card__total-amount { color: var(--md-sys-color-primary); }
    .iu-payment-card__deposit-note {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
    }
    .iu-payment-card__deposit-note .material-symbols-outlined { font-size: 14px; }

    /* ── Methods ── */
    .iu-payment-card__methods { border-top: 1px solid var(--md-sys-color-outline-variant); padding-top: 16px; }
    .iu-payment-card__method-list {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }
    .iu-payment-card__method-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 10px 14px;
      border: 1.5px solid var(--md-sys-color-outline-variant);
      border-radius: 12px;
      background: var(--md-sys-color-surface);
      cursor: pointer;
      font-size: 12px;
      color: var(--md-sys-color-on-surface);
      transition: border-color 0.18s, background 0.18s;
    }
    .iu-payment-card__method-btn .material-symbols-outlined { font-size: 22px; }
    .iu-payment-card__method-btn--active {
      border-color: var(--md-sys-color-primary);
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
    }
    .iu-payment-card__method-label { font-weight: 500; }

    /* ── Card/MBWay fields ── */
    .iu-payment-card__card-fields { display: flex; flex-direction: column; gap: 12px; }
    .iu-payment-card__field { display: flex; flex-direction: column; gap: 4px; }
    .iu-payment-card__label { font-size: 12px; font-weight: 500; color: var(--md-sys-color-on-surface-variant); }
    .iu-payment-card__input {
      padding: 10px 12px;
      border: 1.5px solid var(--md-sys-color-outline);
      border-radius: 8px;
      background: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface);
      font-size: 14px;
      outline: none;
      transition: border-color 0.18s;
    }
    .iu-payment-card__input:focus { border-color: var(--md-sys-color-primary); }
    .iu-payment-card__input--half { max-width: 120px; }

    /* ── Bank info ── */
    .iu-payment-card__bank-info {
      background: var(--md-sys-color-surface-container);
      border-radius: 8px;
      padding: 12px 16px;
    }
    .iu-payment-card__bank-detail { margin: 4px 0; font-size: 13px; color: var(--md-sys-color-on-surface); }
    .iu-payment-card__bank-note { margin-top: 8px; font-size: 12px; color: var(--md-sys-color-on-surface-variant); }

    /* ── Terms ── */
    .iu-payment-card__terms {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant);
      cursor: pointer;
    }
    .iu-payment-card__terms input[type="checkbox"] { margin-top: 2px; accent-color: var(--md-sys-color-primary); }
    .iu-payment-card__terms-link { color: var(--md-sys-color-primary); text-decoration: underline; }

    /* ── Submit ── */
    .iu-payment-card__submit {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 14px 24px;
      border: none;
      border-radius: 100px;
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
    }
    .iu-payment-card__submit:disabled { opacity: 0.45; cursor: not-allowed; }
    .iu-payment-card__submit:not(:disabled):hover { opacity: 0.92; }
    .iu-payment-card__submit:not(:disabled):active { transform: scale(0.98); }
    .iu-payment-card__submit .material-symbols-outlined { font-size: 20px; }

    /* ── Secure note ── */
    .iu-payment-card__secure-note {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant);
      text-align: center;
    }
    .iu-payment-card__secure-note .material-symbols-outlined { font-size: 14px; }
  `],
})
export class PaymentSummaryCardComponent {

  /** The full booking + payment breakdown to display. */
  readonly summary = input.required<BookingPaymentSummary>();

  /** Emitted when the user confirms and submits payment. */
  readonly paymentSubmit = output<PaymentSubmitEvent>();

  // ── Internal state ────────────────────────────────────────────────────────
  readonly selectedMethod = signal<PaymentMethodType>('card');
  readonly cardHolder = signal('');
  readonly cardNumber = signal('');
  readonly cardExpiry = signal('');
  readonly mbwayPhone = signal('');
  readonly termsAccepted = signal(false);

  /** Available payment methods */
  readonly paymentMethods: PaymentMethod[] = [
    { id: 'card', label: 'Cartão', icon: 'credit_card', description: 'Visa, MC, Amex' },
    { id: 'mbway', label: 'MBWay', icon: 'smartphone', description: 'Pagamento por telemóvel' },
    { id: 'bank_transfer', label: 'Transferência', icon: 'account_balance', description: 'SEPA / MB' },
    { id: 'paypal', label: 'PayPal', icon: 'account_balance_wallet', description: 'Conta PayPal' },
  ];

  /**
   * Whether the form is valid enough to submit.
   * Validates required fields per payment method.
   */
  readonly canSubmit = computed(() => {
    if (!this.termsAccepted()) return false;
    const m = this.selectedMethod();
    if (m === 'card') return this.cardHolder().trim().length > 0 && this.cardNumber().trim().length > 0;
    if (m === 'mbway') return this.mbwayPhone().trim().length > 0;
    return true; // bank_transfer and paypal have no inline validation
  });

  /** Selects a payment method. */
  selectMethod(method: PaymentMethodType): void {
    this.selectedMethod.set(method);
  }

  /** Builds and emits the payment submit event. */
  onSubmit(): void {
    if (!this.canSubmit()) return;
    const form: PaymentFormData = {
      method: this.selectedMethod(),
      cardHolder: this.cardHolder() || undefined,
      cardNumber: this.cardNumber() || undefined,
      cardExpiry: this.cardExpiry() || undefined,
      mbwayPhone: this.mbwayPhone() || undefined,
      termsAccepted: true,
    };
    this.paymentSubmit.emit({
      summary: this.summary(),
      form,
      timestamp: new Date().toISOString(),
    });
  }
}
