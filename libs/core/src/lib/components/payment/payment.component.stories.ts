import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { PaymentComponent } from './payment.component';

/**
 * `<iu-payment>` — Onda 9b, gated by `PAYMENT_V2`.
 * This slice (NG-05 · fatia 1) proves the `idle → validating → ready | error`
 * state machine + amount/currency validation. No money moves.
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
