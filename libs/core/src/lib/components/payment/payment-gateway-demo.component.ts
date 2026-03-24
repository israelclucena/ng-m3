/**
 * @fileoverview PaymentGatewayDemoComponent — Sprint 029
 * A testable UI demo for PaymentService (mock Stripe gateway).
 * Feature flag: PAYMENT_GATEWAY
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'iu-payment-gateway-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="payment-demo">
      <h3 class="payment-demo__title">Payment Gateway Demo</h3>
      <p class="payment-demo__status">
        Status: <strong>{{ payment.status() }}</strong>
      </p>
      @if (payment.lastResult()) {
        <div class="payment-demo__result" [class.success]="payment.isSuccess()" [class.failed]="payment.isFailed()">
          @if (payment.isSuccess()) {
            <span>✅ Payment confirmed: {{ payment.lastResult()?.paymentIntentId }}</span>
          } @else {
            <span>❌ {{ payment.lastResult()?.error }}</span>
          }
        </div>
      }
      <div class="payment-demo__actions">
        <button (click)="testSuccess()" [disabled]="payment.isProcessing()">
          Test Success Payment
        </button>
        <button (click)="testDecline()" [disabled]="payment.isProcessing()">
          Test Declined Card
        </button>
        <button (click)="payment.reset()" [disabled]="payment.isProcessing()">
          Reset
        </button>
      </div>
    </div>
  `,
  styles: [`
    .payment-demo { padding: 24px; font-family: var(--md-sys-typescale-body-large-font, system-ui); }
    .payment-demo__title { color: var(--md-sys-color-on-surface, #1c1b1f); margin-bottom: 16px; }
    .payment-demo__status { color: var(--md-sys-color-on-surface-variant, #49454f); margin-bottom: 12px; }
    .payment-demo__result { padding: 12px; border-radius: 8px; margin-bottom: 16px; }
    .payment-demo__result.success { background: var(--md-sys-color-tertiary-container, #d4edda); }
    .payment-demo__result.failed { background: var(--md-sys-color-error-container, #f9dedc); }
    .payment-demo__actions { display: flex; gap: 12px; flex-wrap: wrap; }
    button { padding: 10px 20px; border: none; border-radius: 20px; cursor: pointer;
             background: var(--md-sys-color-primary, #6750a4); color: var(--md-sys-color-on-primary, #fff);
             font-size: 14px; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class PaymentGatewayDemoComponent {
  readonly payment = inject(PaymentService);

  async testSuccess(): Promise<void> {
    this.payment.reset();
    await this.payment.processPayment({
      amount: 150000,
      currency: 'EUR',
      bookingRef: 'LR-TEST01',
      propertyTitle: 'Apartamento T2 — Bairro Alto',
      propertyAddress: 'Rua do Norte, 42, Lisboa',
      checkIn: '2026-04-01',
      landlordName: 'João Silva',
      landlordPhone: '+351 912 345 678',
      formData: { method: 'card', cardHolder: 'Test User', cardNumber: '4242424242424242', cardExpiry: '12/28', termsAccepted: true },
    });
  }

  async testDecline(): Promise<void> {
    this.payment.reset();
    await this.payment.processPayment({
      amount: 150000,
      currency: 'EUR',
      bookingRef: 'LR-TEST02',
      propertyTitle: 'Apartamento T2 — Bairro Alto',
      propertyAddress: 'Rua do Norte, 42, Lisboa',
      checkIn: '2026-04-01',
      landlordName: 'João Silva',
      formData: { method: 'card', cardHolder: 'Test Decline', cardNumber: '4000000000000002', cardExpiry: '12/28', termsAccepted: true },
    });
  }
}
