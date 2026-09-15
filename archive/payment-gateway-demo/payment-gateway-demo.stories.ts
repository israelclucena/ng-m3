import type { Meta, StoryObj } from '@storybook/angular';
import { PaymentGatewayDemoComponent } from './payment-gateway-demo.component';

const meta: Meta<PaymentGatewayDemoComponent> = {
  title: 'Sprint 029/PaymentGatewayDemo',
  component: PaymentGatewayDemoComponent,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<PaymentGatewayDemoComponent>;

export const Default: Story = {};

export const ReadyToTest: Story = {
  name: 'Ready To Test',
};

export const Idle: Story = {
  name: 'Idle State',
};
