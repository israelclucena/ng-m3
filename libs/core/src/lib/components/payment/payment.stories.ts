import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentSummaryCardComponent } from './payment-summary-card.component';
import { BookingConfirmationComponent } from './booking-confirmation.component';
import type { BookingPaymentSummary, BookingConfirmationData } from './payment.types';

// ─── Shared mock data ─────────────────────────────────────────────────────────

const mockSummary: BookingPaymentSummary = {
  propertyTitle: 'Apartamento T2 no Chiado',
  propertyAddress: 'Rua do Alecrim 45, Lisboa',
  checkIn: '2026-04-01',
  months: 6,
  currency: 'EUR',
  depositAmount: 1200,
  total: 8200,
  lineItems: [
    { label: 'Renda mensal × 6 meses', amount: 7200, type: 'charge' },
    { label: 'Taxa de serviço LisboaRent', amount: 200, type: 'fee' },
    { label: 'Depósito de garantia (1 mês)', amount: 1200, type: 'deposit' },
    { label: 'Desconto de longa-duração (5%)', amount: 400, type: 'discount' },
  ],
};

const mockConfirmed: BookingConfirmationData = {
  bookingRef: 'LR-2026-CH045-7F3',
  status: 'confirmed',
  propertyTitle: 'Apartamento T2 no Chiado',
  propertyAddress: 'Rua do Alecrim 45, Lisboa',
  checkIn: '2026-04-01',
  landlordName: 'António Ferreira',
  landlordPhone: '+351 912 345 678',
  total: 8200,
  currency: 'EUR',
};

const mockPending: BookingConfirmationData = {
  ...mockConfirmed,
  bookingRef: 'LR-2026-CH045-7F4',
  status: 'pending',
  message: 'A sua transferência bancária está a ser verificada. Receberá uma notificação em 1–2 dias úteis.',
};

const mockFailed: BookingConfirmationData = {
  ...mockConfirmed,
  bookingRef: '',
  status: 'failed',
  message: 'O cartão foi recusado pela entidade emissora. Verifique os dados ou tente outro método de pagamento.',
};

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'LisboaRent/PaymentFlow',
  decorators: [
    applicationConfig({ providers: [provideAnimations()] }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**Payment/Checkout Flow** — Closes the booking loop for LisboaRent.

Three components:
- \`PaymentSummaryCardComponent\` (\`iu-payment-summary-card\`) — checkout form with line-item breakdown and payment method selector (card, MBWay, bank transfer, PayPal).
- \`BookingConfirmationComponent\` (\`iu-booking-confirmation\`) — post-payment confirmation with status (confirmed/pending/failed/cancelled), booking ref, and next steps.

Feature flag: \`PAYMENT_MODULE\`
        `.trim(),
      },
    },
  },
};

export default meta;

// ─── Story 1: Checkout Card ───────────────────────────────────────────────────

@Component({
  selector: 'story-payment-checkout',
  standalone: true,
  imports: [CommonModule, PaymentSummaryCardComponent],
  template: `
    <div style="padding: 24px; background: var(--md-sys-color-surface, #f8f9fa);">
      <h3 style="margin: 0 0 20px; font-family: sans-serif;">Checkout — Confirmar Reserva</h3>
      <iu-payment-summary-card
        [summary]="summary"
        (paymentSubmit)="onSubmit($event)"
      />
      @if (log()) {
        <pre style="margin-top:16px; padding:12px; background:#1e1e1e; color:#9cdcfe; border-radius:8px; font-size:12px; overflow:auto;">{{ log() }}</pre>
      }
    </div>
  `,
})
class CheckoutStoryComponent {
  readonly summary = mockSummary;
  readonly log = signal('');
  onSubmit(e: unknown): void {
    this.log.set(JSON.stringify(e, null, 2));
  }
}

export const Checkout: StoryObj = {
  render: () => ({ component: CheckoutStoryComponent } as Parameters<NonNullable<StoryObj["render"]>>[0]),
  name: 'Checkout Card',
};

// ─── Story 2: Confirmation — Confirmed ───────────────────────────────────────

@Component({
  selector: 'story-booking-confirmed',
  standalone: true,
  imports: [CommonModule, BookingConfirmationComponent],
  template: `
    <div style="padding: 24px; background: var(--md-sys-color-surface, #f8f9fa);">
      <iu-booking-confirmation
        [data]="data"
        (contactLandlord)="log.set('contactLandlord emitted')"
        (backToSearch)="log.set('backToSearch emitted')"
      />
      @if (log()) {
        <pre style="margin-top:12px; padding:8px; background:#1e1e1e; color:#9cdcfe; border-radius:6px; font-size:12px;">{{ log() }}</pre>
      }
    </div>
  `,
})
class ConfirmedStoryComponent {
  readonly data = mockConfirmed;
  readonly log = signal('');
}

export const ConfirmationSuccess: StoryObj = {
  render: () => ({ component: ConfirmedStoryComponent }) as any,
  name: 'Confirmation — Confirmed',
};

// ─── Story 3: Confirmation — Pending / Failed ────────────────────────────────

@Component({
  selector: 'story-booking-states',
  standalone: true,
  imports: [CommonModule, BookingConfirmationComponent],
  template: `
    <div style="padding:24px; display:flex; gap:24px; flex-wrap:wrap; background: var(--md-sys-color-surface, #f8f9fa);">
      <div>
        <p style="font-family:sans-serif; margin:0 0 12px; font-size:13px; color:#555;">Pending</p>
        <iu-booking-confirmation [data]="pending" />
      </div>
      <div>
        <p style="font-family:sans-serif; margin:0 0 12px; font-size:13px; color:#555;">Failed</p>
        <iu-booking-confirmation [data]="failed" />
      </div>
    </div>
  `,
})
class StatesStoryComponent {
  readonly pending = mockPending;
  readonly failed = mockFailed;
}

export const ConfirmationStates: StoryObj = {
  render: () => ({ component: StatesStoryComponent }) as any,
  name: 'Confirmation — Pending & Failed',
};
