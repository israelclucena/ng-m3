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
