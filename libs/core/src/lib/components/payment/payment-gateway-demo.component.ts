/**
 * @fileoverview PaymentGatewayDemoComponent — Sprint 029, Onda 9b collapse (NG-05).
 *
 * Originally a bespoke harness for {@link PaymentService}. As the payment module
 * becomes a *deep* module the four sibling components collapse onto the single
 * `<iu-payment>`; this demo is now a thin wrapper that renders and drives the
 * unified component through the gateway seam. Kept only so existing app wiring
 * (`iu-payment-gateway-demo`) and the Features page keep working until NG-06
 * removes the wrappers and shrinks the barrel.
 *
 * Feature flag: PAYMENT_GATEWAY
 */
import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  PaymentComponent,
  IU_PAYMENT_GATEWAY,
  type PaymentAuthResult,
  type PaymentGateway,
} from './payment.component';

/**
 * A test-mode gateway whose verdict is flipped by the demo buttons. Never moves
 * real money — it just returns `succeeded`/`declined` synchronously so the demo
 * can exercise both branches of the `<iu-payment>` state machine.
 */
class DemoPaymentGateway implements PaymentGateway {
  /** Which verdict the next `authorize()` returns. Flipped by the demo buttons. */
  outcome: 'succeeded' | 'declined' = 'succeeded';

  async authorize(): Promise<PaymentAuthResult> {
    return this.outcome === 'succeeded'
      ? { outcome: 'succeeded' }
      : { outcome: 'declined', message: 'Cartão recusado (4000…0002).' };
  }
}

/**
 * `<iu-payment-gateway-demo>` — interactive demo of the unified payment surface.
 *
 * @deprecated Use `<iu-payment>` directly. This component is now a thin demo
 * wrapper kept for backwards compatibility until NG-06 removes the payment
 * wrappers and the barrel shrinks to ≤5 public symbols.
 */
@Component({
  selector: 'iu-payment-gateway-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PaymentComponent],
  providers: [{ provide: IU_PAYMENT_GATEWAY, useClass: DemoPaymentGateway }],
  template: `
    <div class="payment-demo">
      <h3 class="payment-demo__title">Payment Gateway Demo</h3>
      <iu-payment
        #p
        class="payment-demo__surface"
        intent="checkout"
        [amount]="1500"
        currency="EUR"
      >
        <h4 slot="header">Reserva — Apartamento T2, Bairro Alto</h4>
        <div slot="summary">Total: <strong>1500 EUR</strong></div>
      </iu-payment>

      <p class="payment-demo__status">
        Status: <strong>{{ p.state() }}</strong>
      </p>

      <div class="payment-demo__actions">
        <button (click)="testSuccess()" [disabled]="p.isBusy()">
          Test Success Payment
        </button>
        <button (click)="testDecline()" [disabled]="p.isBusy()">
          Test Declined Card
        </button>
        <button (click)="p.reset()" [disabled]="p.isBusy()">
          Reset
        </button>
      </div>
    </div>
  `,
  styles: [`
    .payment-demo { padding: 24px; font-family: var(--md-sys-typescale-body-large-font, system-ui); }
    .payment-demo__title { color: var(--md-sys-color-on-surface, #1c1b1f); margin-bottom: 16px; }
    .payment-demo__status { color: var(--md-sys-color-on-surface-variant, #49454f); margin-bottom: 12px; }
    .payment-demo__surface { display: block; margin-bottom: 16px; }
    .payment-demo__actions { display: flex; gap: 12px; flex-wrap: wrap; }
    button { padding: 10px 20px; border: none; border-radius: 20px; cursor: pointer;
             background: var(--md-sys-color-primary, #6750a4); color: var(--md-sys-color-on-primary, #fff);
             font-size: 14px; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class PaymentGatewayDemoComponent {
  /** The unified surface being demoed. */
  readonly pay = viewChild.required(PaymentComponent);

  /** Same instance the child `<iu-payment>` resolves — lets buttons flip the verdict. */
  private readonly gateway = inject(IU_PAYMENT_GATEWAY) as DemoPaymentGateway;

  /** Drive a full happy-path run through the unified component. */
  async testSuccess(): Promise<void> {
    this.gateway.outcome = 'succeeded';
    const p = this.pay();
    p.reset();
    if (p.validate()) await p.submit();
  }

  /** Drive a declined run (mirrors a 4000…0002 test card). */
  async testDecline(): Promise<void> {
    this.gateway.outcome = 'declined';
    const p = this.pay();
    p.reset();
    if (p.validate()) await p.submit();
  }
}
