/**
 * @fileoverview BookingCheckoutComponent — Sprint 028
 *
 * Multi-step checkout flow for LisboaRent bookings.
 * Orchestrates three steps as a signal-based state machine:
 *
 *   1. **Review** — shows booking summary (dates, property, price breakdown)
 *   2. **Payment** — collects payment method + card/MBWay details via createSignalForm()
 *   3. **Confirmation** — renders iu-booking-confirmation with the final status
 *
 * Bridges `PropertyAvailabilityComponent` (Sprint 027) → `PaymentSummaryCard`
 * (Sprint 020) → `BookingConfirmation` (Sprint 020) in a single orchestrator.
 *
 * Feature flag: BOOKING_CONFIRMATION_FLOW
 *
 * @example
 * ```html
 * <iu-booking-checkout
 *   [property]="selectedProperty()"
 *   [selectedRange]="selectedDates()"
 *   (checkoutComplete)="onCheckoutDone($event)"
 *   (cancelled)="onCancel()"
 * />
 * ```
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
import { PropertyData } from '../property-card/property-card.component';
import { DateRange } from '../date-picker/date-picker.component';
import {
  BookingConfirmationData,
  BookingPaymentSummary,
  PaymentFormData,
  PaymentLineItem,
  PaymentMethodType,
  PaymentSubmitEvent,
} from '../payment/payment.types';
import {
  createSignalForm,
  required,
  minLength,
  pattern as patternValidator,
} from '../../utils/signal-form';

// ─── Checkout Step ────────────────────────────────────────────────────────────

/** The three phases of the checkout flow */
export type CheckoutStep = 'review' | 'payment' | 'confirmation';

// ─── Events ───────────────────────────────────────────────────────────────────

/** Emitted when the full checkout flow completes (success or failure) */
export interface CheckoutCompleteEvent {
  step: 'confirmation';
  confirmation: BookingConfirmationData;
  paymentData: PaymentFormData;
}

// ─── Payment methods ──────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { id: 'card' as PaymentMethodType,          label: 'Cartão de Débito/Crédito', icon: 'credit_card',    description: 'Visa, Mastercard, American Express' },
  { id: 'mbway' as PaymentMethodType,         label: 'MB WAY',                   icon: 'smartphone',     description: 'Pague com o número de telemóvel' },
  { id: 'bank_transfer' as PaymentMethodType, label: 'Transferência Bancária',   icon: 'account_balance', description: 'IBAN PT50 — processamento em 1–2 dias úteis' },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function generateRef(): string {
  return 'LR-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

function nightsBetween(start: Date, end: Date): number {
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000));
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * BookingCheckoutComponent — orchestrates the full booking checkout flow.
 *
 * Steps:
 * - **review**: Displays property summary, date range, price breakdown, and a "Proceed to Payment" CTA.
 * - **payment**: Collects payment method + credentials via signal-based form. Validates inline.
 * - **confirmation**: Shows BookingConfirmationData (success / pending / failed).
 *
 * All state is managed via Angular Signals — no RxJS, no NgModules.
 * Feature flag: `BOOKING_CONFIRMATION_FLOW`
 */
@Component({
  selector: 'iu-booking-checkout',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="iu-checkout" role="dialog" aria-modal="true" aria-label="Checkout">

      <!-- ══ Backdrop ══════════════════════════════════════════════════════ -->
      <div class="iu-checkout__backdrop" (click)="onCancel()"></div>

      <!-- ══ Panel ═════════════════════════════════════════════════════════ -->
      <div class="iu-checkout__panel" role="document">

        <!-- ── Header ─────────────────────────────────────────────────── -->
        <div class="iu-checkout__header">
          @if (step() !== 'confirmation') {
            <button class="iu-checkout__back"
                    (click)="onBack()"
                    [disabled]="step() === 'review'"
                    aria-label="Voltar">
              <span class="material-symbols-outlined">arrow_back</span>
            </button>
          }
          <h2 class="iu-checkout__title">{{ stepTitle() }}</h2>
          @if (step() !== 'confirmation') {
            <button class="iu-checkout__close" (click)="onCancel()" aria-label="Fechar">
              <span class="material-symbols-outlined">close</span>
            </button>
          }
        </div>

        <!-- ── Step Indicator ─────────────────────────────────────────── -->
        @if (step() !== 'confirmation') {
          <div class="iu-checkout__steps" role="list" aria-label="Passos do checkout">
            @for (s of STEPS; track s.key) {
              <div class="iu-checkout__step"
                   role="listitem"
                   [class.iu-checkout__step--active]="s.key === step()"
                   [class.iu-checkout__step--done]="isStepDone(s.key)">
                <div class="iu-checkout__step-dot">
                  @if (isStepDone(s.key)) {
                    <span class="material-symbols-outlined">check</span>
                  } @else {
                    {{ s.index }}
                  }
                </div>
                <span class="iu-checkout__step-label">{{ s.label }}</span>
              </div>
            }
          </div>
        }

        <!-- ════════════════════════════════════════════════════════════════
             STEP 1: REVIEW
        ════════════════════════════════════════════════════════════════════ -->
        @if (step() === 'review') {
          <div class="iu-checkout__body iu-checkout__body--review">

            <!-- Property card -->
            <div class="iu-checkout__property">
              @if (property().imageUrl) {
                <img class="iu-checkout__property-img"
                     [src]="property().imageUrl"
                     [alt]="property().title" />
              } @else {
                <div class="iu-checkout__property-img iu-checkout__property-img--placeholder">
                  <span class="material-symbols-outlined">apartment</span>
                </div>
              }
              <div class="iu-checkout__property-info">
                <h3 class="iu-checkout__property-title">{{ property().title }}</h3>
                <p class="iu-checkout__property-location">
                  <span class="material-symbols-outlined" aria-hidden="true">location_on</span>
                  {{ property().location }}
                </p>
              </div>
            </div>

            <!-- Date range -->
            <div class="iu-checkout__dates-row">
              <div class="iu-checkout__date-cell">
                <span class="iu-checkout__date-label">Check-in</span>
                <span class="iu-checkout__date-value">{{ checkInLabel() }}</span>
              </div>
              <span class="material-symbols-outlined iu-checkout__arrow">arrow_forward</span>
              <div class="iu-checkout__date-cell">
                <span class="iu-checkout__date-label">Check-out</span>
                <span class="iu-checkout__date-value">{{ checkOutLabel() }}</span>
              </div>
              <div class="iu-checkout__date-cell iu-checkout__date-cell--nights">
                <span class="iu-checkout__date-label">Noites</span>
                <span class="iu-checkout__date-value">{{ nights() }}</span>
              </div>
            </div>

            <!-- Price breakdown -->
            <div class="iu-checkout__breakdown">
              <h4 class="iu-checkout__breakdown-title">Resumo do Pagamento</h4>
              @for (item of lineItems(); track item.label) {
                <div class="iu-checkout__breakdown-row"
                     [class.iu-checkout__breakdown-row--discount]="item.type === 'discount'">
                  <span>{{ item.label }}</span>
                  <span>
                    @if (item.type === 'discount') { − }
                    {{ item.amount | currency:'EUR':'symbol':'1.0-0' }}
                  </span>
                </div>
              }
              <div class="iu-checkout__breakdown-row iu-checkout__breakdown-row--total">
                <span>Total</span>
                <span>{{ totalAmount() | currency:'EUR':'symbol':'1.0-0' }}</span>
              </div>
              <div class="iu-checkout__breakdown-row iu-checkout__breakdown-row--deposit">
                <span>Caução (incluída)</span>
                <span>{{ depositAmount() | currency:'EUR':'symbol':'1.0-0' }}</span>
              </div>
            </div>

            <!-- CTA -->
            <div class="iu-checkout__actions">
              <button class="iu-checkout__btn iu-checkout__btn--primary"
                      (click)="goToPayment()">
                <span class="material-symbols-outlined">lock</span>
                Continuar para Pagamento
              </button>
              <button class="iu-checkout__btn iu-checkout__btn--ghost"
                      (click)="onCancel()">
                Cancelar
              </button>
            </div>
          </div>
        }

        <!-- ════════════════════════════════════════════════════════════════
             STEP 2: PAYMENT
        ════════════════════════════════════════════════════════════════════ -->
        @if (step() === 'payment') {
          <div class="iu-checkout__body iu-checkout__body--payment">

            <!-- Order total reminder -->
            <div class="iu-checkout__total-bar">
              <span>{{ property().title }}</span>
              <strong>{{ totalAmount() | currency:'EUR':'symbol':'1.0-0' }}</strong>
            </div>

            <!-- Payment method selector -->
            <div class="iu-checkout__methods" role="radiogroup" aria-label="Método de pagamento">
              @for (m of PAYMENT_METHODS; track m.id) {
                <label class="iu-checkout__method"
                       [class.iu-checkout__method--selected]="selectedMethod() === m.id">
                  <input type="radio"
                         name="method"
                         [value]="m.id"
                         [checked]="selectedMethod() === m.id"
                         (change)="selectMethod(m.id)"
                         class="iu-checkout__method-radio" />
                  <span class="material-symbols-outlined iu-checkout__method-icon">{{ m.icon }}</span>
                  <div class="iu-checkout__method-info">
                    <span class="iu-checkout__method-label">{{ m.label }}</span>
                    <span class="iu-checkout__method-desc">{{ m.description }}</span>
                  </div>
                  @if (selectedMethod() === m.id) {
                    <span class="material-symbols-outlined iu-checkout__method-check">check_circle</span>
                  }
                </label>
              }
            </div>

            <!-- Card form -->
            @if (selectedMethod() === 'card') {
              <div class="iu-checkout__card-form">
                <div class="iu-checkout__field">
                  <label class="iu-checkout__label" for="cardHolder">Nome no Cartão</label>
                  <input id="cardHolder"
                         class="iu-checkout__input"
                         [class.iu-checkout__input--error]="paymentForm.fields['cardHolder'].showError()"
                         [value]="paymentForm.fields['cardHolder'].value()"
                         (input)="paymentForm.fields['cardHolder'].setValue($any($event.target).value)"
                         (blur)="paymentForm.fields['cardHolder'].touch()"
                         placeholder="NOME SOBRENOME"
                         autocomplete="cc-name" />
                  @if (paymentForm.fields['cardHolder'].showError()) {
                    <span class="iu-checkout__error">{{ paymentForm.fields['cardHolder'].firstError() }}</span>
                  }
                </div>

                <div class="iu-checkout__field">
                  <label class="iu-checkout__label" for="cardNumber">Número do Cartão</label>
                  <input id="cardNumber"
                         class="iu-checkout__input"
                         [class.iu-checkout__input--error]="paymentForm.fields['cardNumber'].showError()"
                         [value]="paymentForm.fields['cardNumber'].value()"
                         (input)="paymentForm.fields['cardNumber'].setValue(formatCardNumber($any($event.target).value))"
                         (blur)="paymentForm.fields['cardNumber'].touch()"
                         placeholder="0000 0000 0000 0000"
                         maxlength="19"
                         autocomplete="cc-number" />
                  @if (paymentForm.fields['cardNumber'].showError()) {
                    <span class="iu-checkout__error">{{ paymentForm.fields['cardNumber'].firstError() }}</span>
                  }
                </div>

                <div class="iu-checkout__field-row">
                  <div class="iu-checkout__field">
                    <label class="iu-checkout__label" for="cardExpiry">Validade</label>
                    <input id="cardExpiry"
                           class="iu-checkout__input"
                           [class.iu-checkout__input--error]="paymentForm.fields['cardExpiry'].showError()"
                           [value]="paymentForm.fields['cardExpiry'].value()"
                           (input)="paymentForm.fields['cardExpiry'].setValue(formatExpiry($any($event.target).value))"
                           (blur)="paymentForm.fields['cardExpiry'].touch()"
                           placeholder="MM/AA"
                           maxlength="5"
                           autocomplete="cc-exp" />
                    @if (paymentForm.fields['cardExpiry'].showError()) {
                      <span class="iu-checkout__error">{{ paymentForm.fields['cardExpiry'].firstError() }}</span>
                    }
                  </div>

                  <div class="iu-checkout__field">
                    <label class="iu-checkout__label" for="cardCvv">CVV</label>
                    <input id="cardCvv"
                           class="iu-checkout__input"
                           [class.iu-checkout__input--error]="paymentForm.fields['cardCvv'].showError()"
                           [value]="paymentForm.fields['cardCvv'].value()"
                           (input)="paymentForm.fields['cardCvv'].setValue($any($event.target).value)"
                           (blur)="paymentForm.fields['cardCvv'].touch()"
                           placeholder="123"
                           maxlength="4"
                           autocomplete="cc-csc" />
                    @if (paymentForm.fields['cardCvv'].showError()) {
                      <span class="iu-checkout__error">{{ paymentForm.fields['cardCvv'].firstError() }}</span>
                    }
                  </div>
                </div>
              </div>
            }

            <!-- MBWay form -->
            @if (selectedMethod() === 'mbway') {
              <div class="iu-checkout__mbway-form">
                <div class="iu-checkout__field">
                  <label class="iu-checkout__label" for="mbwayPhone">Número de Telemóvel</label>
                  <div class="iu-checkout__phone-wrap">
                    <span class="iu-checkout__phone-prefix">🇵🇹 +351</span>
                    <input id="mbwayPhone"
                           class="iu-checkout__input"
                           [class.iu-checkout__input--error]="paymentForm.fields['mbwayPhone'].showError()"
                           [value]="paymentForm.fields['mbwayPhone'].value()"
                           (input)="paymentForm.fields['mbwayPhone'].setValue($any($event.target).value)"
                           (blur)="paymentForm.fields['mbwayPhone'].touch()"
                           placeholder="9XX XXX XXX"
                           maxlength="9"
                           autocomplete="tel-national" />
                  </div>
                  @if (paymentForm.fields['mbwayPhone'].showError()) {
                    <span class="iu-checkout__error">{{ paymentForm.fields['mbwayPhone'].firstError() }}</span>
                  }
                  <p class="iu-checkout__hint">
                    Receberá uma notificação MB WAY para aprovar o pagamento.
                  </p>
                </div>
              </div>
            }

            <!-- Bank transfer info -->
            @if (selectedMethod() === 'bank_transfer') {
              <div class="iu-checkout__bank-info">
                <p class="iu-checkout__bank-notice">
                  <span class="material-symbols-outlined">info</span>
                  Após confirmar, receberá por email os dados IBAN e referência de pagamento.
                  A reserva fica em estado <strong>Pendente</strong> até confirmação da transferência.
                </p>
              </div>
            }

            <!-- Terms -->
            <label class="iu-checkout__terms">
              <input type="checkbox"
                     class="iu-checkout__checkbox"
                     [checked]="termsAccepted()"
                     (change)="termsAccepted.set($any($event.target).checked)" />
              <span>
                Aceito os
                <a href="/terms" target="_blank" class="iu-checkout__link">Termos e Condições</a>
                e a
                <a href="/privacy" target="_blank" class="iu-checkout__link">Política de Privacidade</a>
                da LisboaRent.
              </span>
            </label>
            @if (showTermsError()) {
              <span class="iu-checkout__error">Deve aceitar os termos para continuar.</span>
            }

            <!-- Actions -->
            <div class="iu-checkout__actions">
              <button class="iu-checkout__btn iu-checkout__btn--primary"
                      [disabled]="isSubmitting()"
                      (click)="onSubmitPayment()">
                @if (isSubmitting()) {
                  <span class="iu-checkout__spinner" aria-hidden="true"></span>
                  A processar…
                } @else {
                  <span class="material-symbols-outlined">lock</span>
                  Pagar {{ totalAmount() | currency:'EUR':'symbol':'1.0-0' }}
                }
              </button>
              <button class="iu-checkout__btn iu-checkout__btn--ghost"
                      [disabled]="isSubmitting()"
                      (click)="goToReview()">
                Voltar
              </button>
            </div>
          </div>
        }

        <!-- ════════════════════════════════════════════════════════════════
             STEP 3: CONFIRMATION
        ════════════════════════════════════════════════════════════════════ -->
        @if (step() === 'confirmation' && confirmation()) {
          <div class="iu-checkout__body iu-checkout__body--confirmation">

            <!-- Status icon + title -->
            <div class="iu-checkout__conf-header"
                 [class.iu-checkout__conf-header--confirmed]="confirmation()!.status === 'confirmed'"
                 [class.iu-checkout__conf-header--pending]="confirmation()!.status === 'pending'"
                 [class.iu-checkout__conf-header--failed]="confirmation()!.status === 'failed'">
              <div class="iu-checkout__conf-icon">
                <span class="material-symbols-outlined">{{ confirmationIcon() }}</span>
              </div>
              <h2 class="iu-checkout__conf-title">{{ confirmationTitle() }}</h2>
              <p class="iu-checkout__conf-subtitle">{{ confirmationSubtitle() }}</p>
            </div>

            @if (confirmation()!.status !== 'failed') {
              <!-- Booking ref -->
              <div class="iu-checkout__ref-box">
                <span class="iu-checkout__ref-label">Referência da Reserva</span>
                <span class="iu-checkout__ref-code">{{ confirmation()!.bookingRef }}</span>
              </div>

              <!-- Details -->
              <div class="iu-checkout__conf-details">
                <div class="iu-checkout__conf-row">
                  <span class="material-symbols-outlined">apartment</span>
                  <div>
                    <strong>{{ confirmation()!.propertyTitle }}</strong>
                    <p>{{ confirmation()!.propertyAddress }}</p>
                  </div>
                </div>
                <div class="iu-checkout__conf-row">
                  <span class="material-symbols-outlined">calendar_today</span>
                  <div>
                    <strong>Data de Entrada</strong>
                    <p>{{ confirmation()!.checkIn | date:'fullDate' }}</p>
                  </div>
                </div>
                <div class="iu-checkout__conf-row">
                  <span class="material-symbols-outlined">person</span>
                  <div>
                    <strong>Proprietário</strong>
                    <p>{{ confirmation()!.landlordName }}</p>
                  </div>
                </div>
                <div class="iu-checkout__conf-total">
                  <span>Total Pago</span>
                  <strong>
                    {{ confirmation()!.total | currency:confirmation()!.currency:'symbol':'1.0-0' }}
                  </strong>
                </div>
              </div>
            }

            @if (confirmation()!.message) {
              <div class="iu-checkout__conf-message">
                <span class="material-symbols-outlined">info</span>
                <p>{{ confirmation()!.message }}</p>
              </div>
            }

            <!-- Actions -->
            <div class="iu-checkout__actions iu-checkout__actions--conf">
              @if (confirmation()!.status !== 'failed') {
                <button class="iu-checkout__btn iu-checkout__btn--primary"
                        (click)="checkoutComplete.emit({ step: 'confirmation', confirmation: confirmation()!, paymentData: lastPaymentData()! })">
                  Ver as Minhas Reservas
                </button>
              } @else {
                <button class="iu-checkout__btn iu-checkout__btn--primary"
                        (click)="goToPayment()">
                  Tentar Novamente
                </button>
              }
              <button class="iu-checkout__btn iu-checkout__btn--ghost"
                      (click)="cancelled.emit()">
                Fechar
              </button>
            </div>
          </div>
        }

      </div><!-- /panel -->
    </div><!-- /checkout -->
  `,
  styles: [`
    /* ── Checkout Container ──────────────────────────────────────────────── */
    .iu-checkout {
      position: fixed;
      inset: 0;
      z-index: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .iu-checkout__backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,.48);
      backdrop-filter: blur(2px);
    }

    .iu-checkout__panel {
      position: relative;
      z-index: 1;
      background: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface);
      border-radius: 28px;
      width: min(580px, calc(100vw - 32px));
      max-height: min(90vh, 800px);
      overflow-y: auto;
      box-shadow: var(--md-sys-elevation-level3, 0 8px 32px rgba(0,0,0,.3));
      display: flex;
      flex-direction: column;
    }

    /* ── Header ──────────────────────────────────────────────────────────── */
    .iu-checkout__header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 20px 24px 12px;
      position: sticky;
      top: 0;
      background: var(--md-sys-color-surface);
      z-index: 2;
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }

    .iu-checkout__title {
      flex: 1;
      margin: 0;
      font: var(--md-sys-typescale-title-large-font, 600 20px/28px 'Google Sans', sans-serif);
      color: var(--md-sys-color-on-surface);
    }

    .iu-checkout__back,
    .iu-checkout__close {
      background: none;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      color: var(--md-sys-color-on-surface-variant);
      transition: background .15s;
    }
    .iu-checkout__back:hover,
    .iu-checkout__close:hover { background: var(--md-sys-color-surface-variant); }
    .iu-checkout__back:disabled { opacity: .3; pointer-events: none; }

    /* ── Step Indicator ──────────────────────────────────────────────────── */
    .iu-checkout__steps {
      display: flex;
      justify-content: center;
      gap: 40px;
      padding: 16px 24px 8px;
    }

    .iu-checkout__step {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-direction: column;
      color: var(--md-sys-color-outline);
      font-size: 12px;
    }

    .iu-checkout__step--active {
      color: var(--md-sys-color-primary);
      font-weight: 600;
    }

    .iu-checkout__step--done {
      color: var(--md-sys-color-tertiary, var(--md-sys-color-primary));
    }

    .iu-checkout__step-dot {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--md-sys-color-surface-variant);
      border: 2px solid currentColor;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
    }

    .iu-checkout__step--active .iu-checkout__step-dot {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      border-color: var(--md-sys-color-primary);
    }

    .iu-checkout__step--done .iu-checkout__step-dot {
      background: var(--md-sys-color-tertiary, var(--md-sys-color-primary));
      color: var(--md-sys-color-on-tertiary, var(--md-sys-color-on-primary));
      border-color: transparent;
    }

    .iu-checkout__step-label { font-size: 11px; white-space: nowrap; }

    /* ── Body ────────────────────────────────────────────────────────────── */
    .iu-checkout__body {
      padding: 20px 24px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* ── Property card ───────────────────────────────────────────────────── */
    .iu-checkout__property {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 12px;
      background: var(--md-sys-color-surface-container);
      border-radius: 12px;
    }

    .iu-checkout__property-img {
      width: 72px;
      height: 72px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .iu-checkout__property-img--placeholder {
      background: var(--md-sys-color-surface-variant);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--md-sys-color-on-surface-variant);
    }

    .iu-checkout__property-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .iu-checkout__property-title {
      margin: 0;
      font: var(--md-sys-typescale-title-medium-font, 600 16px/24px 'Google Sans', sans-serif);
    }

    .iu-checkout__property-location {
      margin: 0;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant);
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .iu-checkout__property-location .material-symbols-outlined {
      font-size: 14px;
    }

    /* ── Dates row ───────────────────────────────────────────────────────── */
    .iu-checkout__dates-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--md-sys-color-primary-container);
      border-radius: 12px;
      color: var(--md-sys-color-on-primary-container);
    }

    .iu-checkout__date-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
    }

    .iu-checkout__date-cell--nights {
      flex: 0 0 auto;
      text-align: center;
      align-items: center;
    }

    .iu-checkout__date-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: .5px;
      opacity: .7;
    }

    .iu-checkout__date-value {
      font-weight: 700;
      font-size: 14px;
    }

    .iu-checkout__arrow { opacity: .5; font-size: 18px; }

    /* ── Price breakdown ─────────────────────────────────────────────────── */
    .iu-checkout__breakdown {
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 12px;
      overflow: hidden;
    }

    .iu-checkout__breakdown-title {
      margin: 0;
      padding: 12px 16px;
      font-size: 13px;
      font-weight: 600;
      background: var(--md-sys-color-surface-container);
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }

    .iu-checkout__breakdown-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 16px;
      font-size: 14px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }
    .iu-checkout__breakdown-row:last-child { border-bottom: none; }

    .iu-checkout__breakdown-row--discount { color: var(--md-sys-color-tertiary); }

    .iu-checkout__breakdown-row--total {
      font-weight: 700;
      font-size: 16px;
      background: var(--md-sys-color-surface-container);
    }

    .iu-checkout__breakdown-row--deposit {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
    }

    /* ── Total bar (payment step) ────────────────────────────────────────── */
    .iu-checkout__total-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      border-radius: 10px;
      font-size: 14px;
    }

    /* ── Payment methods ─────────────────────────────────────────────────── */
    .iu-checkout__methods {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .iu-checkout__method {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border: 2px solid var(--md-sys-color-outline-variant);
      border-radius: 12px;
      cursor: pointer;
      transition: border-color .15s, background .15s;
    }

    .iu-checkout__method--selected {
      border-color: var(--md-sys-color-primary);
      background: var(--md-sys-color-primary-container);
    }

    .iu-checkout__method-radio { display: none; }

    .iu-checkout__method-icon {
      font-size: 22px;
      color: var(--md-sys-color-on-surface-variant);
    }

    .iu-checkout__method--selected .iu-checkout__method-icon {
      color: var(--md-sys-color-primary);
    }

    .iu-checkout__method-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .iu-checkout__method-label { font-weight: 600; font-size: 14px; }
    .iu-checkout__method-desc  { font-size: 12px; color: var(--md-sys-color-on-surface-variant); }

    .iu-checkout__method-check {
      color: var(--md-sys-color-primary);
      font-size: 20px;
    }

    /* ── Card form ───────────────────────────────────────────────────────── */
    .iu-checkout__card-form,
    .iu-checkout__mbway-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 16px;
      background: var(--md-sys-color-surface-container);
      border-radius: 12px;
      border: 1px solid var(--md-sys-color-outline-variant);
    }

    .iu-checkout__field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .iu-checkout__field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .iu-checkout__label {
      font-size: 12px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface-variant);
      text-transform: uppercase;
      letter-spacing: .5px;
    }

    .iu-checkout__input {
      padding: 10px 12px;
      border: 1.5px solid var(--md-sys-color-outline);
      border-radius: 8px;
      background: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface);
      font-size: 15px;
      transition: border-color .15s;
      outline: none;
      font-family: 'Roboto Mono', monospace;
    }

    .iu-checkout__input:focus {
      border-color: var(--md-sys-color-primary);
    }

    .iu-checkout__input--error {
      border-color: var(--md-sys-color-error);
    }

    .iu-checkout__error {
      font-size: 12px;
      color: var(--md-sys-color-error);
    }

    .iu-checkout__hint {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
      margin: 4px 0 0;
    }

    /* ── Phone wrap ──────────────────────────────────────────────────────── */
    .iu-checkout__phone-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .iu-checkout__phone-prefix {
      font-size: 14px;
      white-space: nowrap;
      color: var(--md-sys-color-on-surface-variant);
    }

    .iu-checkout__phone-wrap .iu-checkout__input { flex: 1; }

    /* ── Bank info ───────────────────────────────────────────────────────── */
    .iu-checkout__bank-info {
      padding: 14px;
      background: var(--md-sys-color-secondary-container);
      border-radius: 10px;
      color: var(--md-sys-color-on-secondary-container);
    }

    .iu-checkout__bank-notice {
      margin: 0;
      display: flex;
      gap: 8px;
      font-size: 13px;
      align-items: flex-start;
    }

    /* ── Terms ───────────────────────────────────────────────────────────── */
    .iu-checkout__terms {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant);
      cursor: pointer;
    }

    .iu-checkout__checkbox { flex-shrink: 0; margin-top: 2px; }

    .iu-checkout__link {
      color: var(--md-sys-color-primary);
      text-decoration: underline;
    }

    /* ── Actions ─────────────────────────────────────────────────────────── */
    .iu-checkout__actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-top: 8px;
    }

    .iu-checkout__actions--conf {
      flex-direction: row;
      flex-wrap: wrap;
    }

    .iu-checkout__btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 24px;
      border-radius: 100px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: opacity .15s;
    }

    .iu-checkout__btn:disabled { opacity: .5; pointer-events: none; }

    .iu-checkout__btn--primary {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
    }

    .iu-checkout__btn--ghost {
      background: transparent;
      color: var(--md-sys-color-on-surface-variant);
      border: 1.5px solid var(--md-sys-color-outline-variant);
    }

    .iu-checkout__spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,.4);
      border-top-color: white;
      border-radius: 50%;
      animation: iu-spin .6s linear infinite;
    }

    @keyframes iu-spin { to { transform: rotate(360deg); } }

    /* ── Confirmation ────────────────────────────────────────────────────── */
    .iu-checkout__conf-header {
      text-align: center;
      padding: 24px 16px 16px;
      border-radius: 16px;
      background: var(--md-sys-color-surface-container);
    }

    .iu-checkout__conf-header--confirmed { background: var(--md-sys-color-tertiary-container, #d3f2de); }
    .iu-checkout__conf-header--pending   { background: var(--md-sys-color-secondary-container); }
    .iu-checkout__conf-header--failed    { background: var(--md-sys-color-error-container); }

    .iu-checkout__conf-icon .material-symbols-outlined {
      font-size: 56px;
    }

    .iu-checkout__conf-header--confirmed .iu-checkout__conf-icon .material-symbols-outlined {
      color: var(--md-sys-color-tertiary, #1b7a3f);
    }
    .iu-checkout__conf-header--pending .iu-checkout__conf-icon .material-symbols-outlined {
      color: var(--md-sys-color-on-secondary-container);
    }
    .iu-checkout__conf-header--failed .iu-checkout__conf-icon .material-symbols-outlined {
      color: var(--md-sys-color-on-error-container);
    }

    .iu-checkout__conf-title {
      margin: 8px 0 4px;
      font-size: 22px;
      font-weight: 700;
    }

    .iu-checkout__conf-subtitle {
      margin: 0;
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant);
    }

    .iu-checkout__ref-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 14px;
      background: var(--md-sys-color-surface-container);
      border-radius: 12px;
      text-align: center;
    }

    .iu-checkout__ref-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: .5px;
      color: var(--md-sys-color-on-surface-variant);
    }

    .iu-checkout__ref-code {
      font-family: 'Roboto Mono', monospace;
      font-size: 24px;
      font-weight: 700;
      color: var(--md-sys-color-primary);
      letter-spacing: 2px;
    }

    .iu-checkout__conf-details {
      display: flex;
      flex-direction: column;
      gap: 0;
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 12px;
      overflow: hidden;
    }

    .iu-checkout__conf-row {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 12px 16px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }
    .iu-checkout__conf-row:last-of-type { border-bottom: none; }
    .iu-checkout__conf-row p { margin: 0; font-size: 13px; color: var(--md-sys-color-on-surface-variant); }
    .iu-checkout__conf-row strong { font-size: 14px; }

    .iu-checkout__conf-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      background: var(--md-sys-color-surface-container);
      font-size: 16px;
    }

    .iu-checkout__conf-total strong { font-size: 20px; color: var(--md-sys-color-primary); }

    .iu-checkout__conf-message {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      padding: 12px;
      background: var(--md-sys-color-secondary-container);
      border-radius: 10px;
      font-size: 13px;
      color: var(--md-sys-color-on-secondary-container);
    }

    .iu-checkout__conf-message p { margin: 0; }

    /* ── Responsive ──────────────────────────────────────────────────────── */
    @media (max-width: 480px) {
      .iu-checkout__panel { border-radius: 20px 20px 0 0; max-height: 95vh; }
      .iu-checkout__field-row { grid-template-columns: 1fr; }
      .iu-checkout__actions--conf { flex-direction: column; }
    }
  `],
})
export class BookingCheckoutComponent {

  // ── Inputs ──────────────────────────────────────────────────────────────

  /** Property being booked */
  readonly property = input.required<PropertyData>();

  /** Date range selected in PropertyAvailabilityComponent */
  readonly selectedRange = input.required<{ start: Date; end: Date }>();

  /** Landlord name shown on confirmation screen */
  readonly landlordName = input<string>('Proprietário LisboaRent');

  /** Landlord phone (optional) */
  readonly landlordPhone = input<string | undefined>(undefined);

  // ── Outputs ─────────────────────────────────────────────────────────────

  /** Emitted when the full flow completes */
  readonly checkoutComplete = output<CheckoutCompleteEvent>();

  /** Emitted when the user cancels or closes */
  readonly cancelled = output<void>();

  // ── Step state ─────────────────────────────────────────────────────────

  readonly step = signal<CheckoutStep>('review');

  readonly STEPS = [
    { key: 'review'       as CheckoutStep, index: 1, label: 'Revisão'    },
    { key: 'payment'      as CheckoutStep, index: 2, label: 'Pagamento'  },
    { key: 'confirmation' as CheckoutStep, index: 3, label: 'Confirmação'},
  ];

  readonly PAYMENT_METHODS = PAYMENT_METHODS;

  /** True when step has been passed */
  isStepDone(key: CheckoutStep): boolean {
    const order: CheckoutStep[] = ['review', 'payment', 'confirmation'];
    return order.indexOf(key) < order.indexOf(this.step());
  }

  // ── Derived ─────────────────────────────────────────────────────────────

  readonly stepTitle = computed(() => {
    switch (this.step()) {
      case 'review':       return 'Revisão da Reserva';
      case 'payment':      return 'Pagamento Seguro';
      case 'confirmation': return 'Reserva Processada';
    }
  });

  readonly nights = computed(() =>
    nightsBetween(this.selectedRange().start, this.selectedRange().end)
  );

  readonly checkInLabel  = computed(() => formatDate(this.selectedRange().start));
  readonly checkOutLabel = computed(() => formatDate(this.selectedRange().end));

  readonly lineItems = computed<PaymentLineItem[]>(() => {
    const price    = this.property().priceMonthly ?? 0;
    const nights   = this.nights();
    const base     = price * nights;
    const cleaning = Math.round(base * 0.08);
    const deposit  = Math.round(price * 2);
    return [
      { label: `${price.toLocaleString('pt-PT')} €/noite × ${nights} noites`, amount: base,     type: 'charge'  },
      { label: 'Taxa de limpeza',                                               amount: cleaning, type: 'fee'     },
      { label: 'Caução (reembolsável)',                                          amount: deposit,  type: 'deposit' },
    ];
  });

  readonly totalAmount = computed(() =>
    this.lineItems().reduce((s, i) => s + (i.type === 'discount' ? -i.amount : i.amount), 0)
  );

  readonly depositAmount = computed(() => {
    const p = this.lineItems().find(i => i.type === 'deposit');
    return p?.amount ?? 0;
  });

  // ── Payment form ────────────────────────────────────────────────────────

  readonly selectedMethod = signal<PaymentMethodType>('card');

  readonly termsAccepted  = signal(false);
  readonly showTermsError = signal(false);
  readonly isSubmitting   = signal(false);

  readonly paymentForm = createSignalForm({
    cardHolder: { value: '', validators: [required('Nome obrigatório'), minLength(3, 'Mínimo 3 caracteres')] },
    cardNumber: { value: '', validators: [required('Número obrigatório'), patternValidator(/^[\d\s]{19}$/, 'Número inválido (16 dígitos)')] },
    cardExpiry: { value: '', validators: [required('Validade obrigatória'), patternValidator(/^\d{2}\/\d{2}$/, 'Formato MM/AA')] },
    cardCvv:    { value: '', validators: [required('CVV obrigatório'),     patternValidator(/^\d{3,4}$/, '3–4 dígitos')] },
    mbwayPhone: { value: '', validators: [required('Telemóvel obrigatório'), patternValidator(/^9\d{8}$/, 'Número PT inválido')] },
  });

  // ── Confirmation ────────────────────────────────────────────────────────

  readonly confirmation     = signal<BookingConfirmationData | null>(null);
  readonly lastPaymentData  = signal<PaymentFormData | null>(null);

  readonly confirmationIcon = computed(() => {
    switch (this.confirmation()?.status) {
      case 'confirmed': return 'check_circle';
      case 'pending':   return 'schedule';
      case 'failed':    return 'cancel';
      default:          return 'info';
    }
  });

  readonly confirmationTitle = computed(() => {
    switch (this.confirmation()?.status) {
      case 'confirmed': return 'Reserva Confirmada! 🎉';
      case 'pending':   return 'Reserva em Análise';
      case 'failed':    return 'Pagamento Recusado';
      default:          return 'Estado Desconhecido';
    }
  });

  readonly confirmationSubtitle = computed(() => {
    switch (this.confirmation()?.status) {
      case 'confirmed': return 'O proprietário foi notificado. Boa estadia!';
      case 'pending':   return 'Aguardamos confirmação da transferência bancária.';
      case 'failed':    return 'Verifique os dados e tente novamente.';
      default:          return '';
    }
  });

  // ── Navigation ──────────────────────────────────────────────────────────

  goToReview()   { this.step.set('review'); }
  goToPayment()  { this.step.set('payment'); }

  onBack(): void {
    if (this.step() === 'payment') this.goToReview();
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  // ── Submit payment ──────────────────────────────────────────────────────

  onSubmitPayment(): void {
    if (!this.termsAccepted()) {
      this.showTermsError.set(true);
      return;
    }
    this.showTermsError.set(false);

    // Validate form fields only for card/mbway
    if (this.selectedMethod() === 'card') {
      const valid = this.paymentForm.submit();
      if (!valid) return;
    } else if (this.selectedMethod() === 'mbway') {
      const phone = this.paymentForm.fields['mbwayPhone'];
      phone.touch();
      if (phone.firstError()) return;
    }

    this.isSubmitting.set(true);

    // Simulate async payment processing (300–800 ms)
    const delay = 400 + Math.random() * 400;
    setTimeout(() => this.finalisePayment(), delay);
  }

  private finalisePayment(): void {
    const p = this.property();
    const method = this.selectedMethod();

    const fieldVal = (key: string): string =>
      this.paymentForm.fields[key as keyof typeof this.paymentForm.fields].value() as string;

    const paymentData: PaymentFormData = {
      method,
      termsAccepted: this.termsAccepted(),
      cardHolder:  method === 'card'  ? fieldVal('cardHolder') : undefined,
      cardNumber:  method === 'card'  ? fieldVal('cardNumber') : undefined,
      cardExpiry:  method === 'card'  ? fieldVal('cardExpiry') : undefined,
      mbwayPhone:  method === 'mbway' ? fieldVal('mbwayPhone') : undefined,
    };

    const status = method === 'bank_transfer' ? 'pending' : 'confirmed';

    const confirmationData: BookingConfirmationData = {
      bookingRef:      generateRef(),
      status,
      propertyTitle:   p.title,
      propertyAddress: p.location,
      checkIn:         this.selectedRange().start.toISOString(),
      landlordName:    this.landlordName(),
      landlordPhone:   this.landlordPhone(),
      total:           this.totalAmount(),
      currency:        'EUR',
      message:         status === 'pending'
        ? 'Enviaremos os dados IBAN por email em breve.'
        : 'Receberá confirmação por email. Boa estadia em Lisboa! 🏡',
    };

    this.lastPaymentData.set(paymentData);
    this.confirmation.set(confirmationData);
    this.isSubmitting.set(false);
    this.step.set('confirmation');
  }

  // ── Formatters ──────────────────────────────────────────────────────────

  /**
   * Formats card number input as "XXXX XXXX XXXX XXXX".
   */
  formatCardNumber(raw: string): string {
    return raw.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  }

  /**
   * Formats card expiry as "MM/AA".
   */
  formatExpiry(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? digits.slice(0, 2) + '/' + digits.slice(2) : digits;
  }

  selectMethod(m: PaymentMethodType): void {
    this.selectedMethod.set(m);
  }
}
