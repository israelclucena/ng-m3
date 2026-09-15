import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { PaymentComponent } from './payment.component';

/**
 * `<iu-payment>` — Onda 9b, gated by `PAYMENT_V2`.
 *
 * The state machine is `idle → validating → ready → processing → success`, with
 * `error` (retry), and the terminal `expired`/`cancelled`. No money moves: the
 * default (root) gateway seam is an inert test-mode stub that approves instantly,
 * so `FullFlow` below drives the whole lifecycle without any keys or network.
 */
const meta: Meta<PaymentComponent> = {
  title: 'Core/Payment',
  component: PaymentComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ schemas: [CUSTOM_ELEMENTS_SCHEMA] })],
  parameters: { layout: 'centered' },
  argTypes: {
    intent: {
      control: 'select',
      options: ['checkout', 'deposit', 'refund'],
      description: 'Para que serve a superfície de pagamento',
    },
    amount:   { control: 'number', description: 'Montante (unidades maiores)' },
    currency: { control: 'text', description: 'ISO-4217 (3 letras maiúsculas)' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<PaymentComponent>;

const template = `
  <iu-payment [intent]="intent" [amount]="amount" [currency]="currency" [disabled]="disabled" style="width:360px" #p>
    <h3 slot="header" style="margin:0">Pagamento — {{ intent }}</h3>
    <div slot="summary">Total: <strong>{{ amount }} {{ currency }}</strong></div>
    <div slot="actions">
      <button type="button" (click)="p.validate()">Validar</button>
    </div>
  </iu-payment>
`;

// --- Default (checkout, valid) ---
export const Default: Story = {
  args: { intent: 'checkout', amount: 1200, currency: 'EUR', disabled: false },
  render: (args) => ({ props: args, template }),
};

// --- Deposit intent ---
export const Deposit: Story = {
  args: { intent: 'deposit', amount: 2400, currency: 'EUR', disabled: false },
  render: (args) => ({ props: args, template }),
};

// --- Invalid amount → error state on Validar ---
export const InvalidAmount: Story = {
  args: { intent: 'refund', amount: 0, currency: 'EUR', disabled: false },
  render: (args) => ({ props: args, template }),
};

/**
 * Drive the whole lifecycle by hand: **Validar** (`idle → ready`), **Pagar**
 * (`ready → processing → success`, via the inert test-mode stub), or drop into a
 * terminal state with **Cancelar**/**Expirar**. **Recomeçar** (`reset()`) returns
 * to `idle`. The live `state` label mirrors the machine; the component's own
 * error/terminal/success regions render inline. No money moves.
 */
const flowTemplate = `
  <iu-payment
    [intent]="intent" [amount]="amount" [currency]="currency" [disabled]="disabled"
    style="width:380px" #p
  >
    <h3 slot="header" style="margin:0 0 4px">Pagamento — {{ intent }}</h3>
    <div slot="summary">Total: <strong>{{ amount }} {{ currency }}</strong></div>
    <div slot="actions" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">
      <button type="button" (click)="p.validate()">Validar</button>
      <button type="button" (click)="p.submit()">Pagar</button>
      <button type="button" (click)="p.cancel()">Cancelar</button>
      <button type="button" (click)="p.expire()">Expirar</button>
      <button type="button" (click)="p.reset()">Recomeçar</button>
    </div>
    <p slot="summary" style="margin:8px 0 0;font:600 12px/1.4 system-ui;opacity:.7">
      state: <code>{{ p.state() }}</code>
    </p>
  </iu-payment>
`;

// --- Full lifecycle, driven by the action buttons ---
export const FullFlow: Story = {
  args: { intent: 'checkout', amount: 1200, currency: 'EUR', disabled: false },
  render: (args) => ({ props: args, template: flowTemplate }),
};

/**
 * Onda 9b (NG-06) `receipt` kind — a settled, printable post-payment receipt,
 * folded in from the former `<iu-payment-receipt>` wrapper. Presentational: it
 * seeds `success` and renders its own card chrome over an {@link Invoice}.
 */
const sampleInvoice = {
  invoiceRef: 'INV-2026-0042',
  issuedAt: '2026-09-12T10:00:00.000Z',
  dueDate: '2026-09-12T10:00:00.000Z',
  status: 'paid',
  paymentIntentId: 'pi_test_123',
  propertyTitle: 'T2 em Alfama',
  propertyAddress: 'Rua dos Remédios 10, Lisboa',
  tenantName: 'Maria João',
  landlordName: 'Carlos Sousa',
  bookingRef: 'BK-9001',
  checkIn: '2026-10-01',
  checkOut: '2026-10-31',
  lineItems: [
    { description: 'Renda (1 mês)', quantity: 1, unitPrice: 1200, total: 1200 },
    { description: 'Taxa de serviço', quantity: 1, unitPrice: 100, total: 100 },
  ],
  subtotal: 1300,
  taxRate: 0.23,
  taxAmount: 299,
  total: 1599,
  currency: 'EUR',
  pdfUrl: 'https://example.test/inv.pdf',
};

const receiptTemplate = `
  <iu-payment kind="receipt" [invoice]="invoice" style="display:block;width:640px"></iu-payment>
`;

// --- Receipt kind (paid) ---
export const Receipt: Story = {
  render: () => ({ props: { invoice: sampleInvoice }, template: receiptTemplate }),
};

// --- Receipt kind (pending status badge) ---
export const ReceiptPending: Story = {
  render: () => ({
    props: { invoice: { ...sampleInvoice, status: 'pending' } },
    template: receiptTemplate,
  }),
};

/**
 * Onda 9b (NG-06) `confirmation` kind — the post-payment booking confirmation
 * screen, folded in from the former `<iu-booking-confirmation>` wrapper.
 * Presentational: it seeds the lifecycle from the booking status and renders its
 * own card chrome over a {@link BookingConfirmationData}.
 */
const confirmedBooking = {
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

const confirmationTemplate = `
  <iu-payment kind="confirmation" [confirmation]="confirmation" style="display:block"></iu-payment>
`;

// --- Confirmation kind (confirmed) ---
export const Confirmation: Story = {
  render: () => ({ props: { confirmation: confirmedBooking }, template: confirmationTemplate }),
};

// --- Confirmation kind (failed) ---
export const ConfirmationFailed: Story = {
  render: () => ({
    props: {
      confirmation: {
        ...confirmedBooking,
        bookingRef: '',
        status: 'failed',
        message: 'O cartão foi recusado pela entidade emissora. Verifique os dados ou tente outro método.',
      },
    },
    template: confirmationTemplate,
  }),
};

/**
 * Onda 9b (NG-06) `summary` kind — the checkout collection form, folded in from
 * the former `<iu-payment-summary-card>` wrapper. Unlike the presentational
 * kinds this one *is the flow*: it renders the booking breakdown + method
 * selector and drives the component's own lifecycle machine on **Confirmar e
 * Pagar** (via the inert test-mode gateway stub). No money moves.
 */
const summaryData = {
  propertyTitle: 'Apartamento T2 no Chiado',
  propertyAddress: 'Rua do Alecrim 45, Lisboa',
  propertyImage: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=320',
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

const summaryTemplate = `
  <iu-payment kind="summary" [summary]="summary" style="display:block"></iu-payment>
`;

// --- Summary kind (checkout form) ---
export const Summary: Story = {
  render: () => ({ props: { summary: summaryData }, template: summaryTemplate }),
};

// --- Summary kind (no property image → placeholder) ---
export const SummaryNoImage: Story = {
  render: () => ({
    props: { summary: { ...summaryData, propertyImage: undefined } },
    template: summaryTemplate,
  }),
};

// --- Summary kind (short-stay deposit, no discount) ---
export const SummaryDeposit: Story = {
  render: () => ({
    props: {
      summary: {
        ...summaryData,
        months: 1,
        total: 1400,
        depositAmount: 1200,
        lineItems: [
          { label: 'Renda (1 mês)', amount: 1200, type: 'charge' },
          { label: 'Taxa de serviço', amount: 200, type: 'fee' },
        ],
      },
    },
    template: summaryTemplate,
  }),
};
