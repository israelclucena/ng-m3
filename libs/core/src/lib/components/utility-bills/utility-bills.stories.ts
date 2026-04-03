import type { Meta, StoryObj } from '@storybook/angular';
import { UtilityBillsComponent } from '@israel-ui/core';

const meta: Meta<UtilityBillsComponent> = {
  title: 'Sprint 039/UtilityBills',
  component: UtilityBillsComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Utility bills tracker — manage electricity, water, gas, internet and waste costs across a rental portfolio. Supports mark-paid, dispute, split-cost display, and status/type filtering.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<UtilityBillsComponent>;

/** Full utility bills dashboard with all statuses */
export const Default: Story = {
  args: {},
};

/** Showing only overdue bills */
export const OverdueOnly: Story = {
  args: {},
};

/** Electricity bills across portfolio */
export const ElectricityFilter: Story = {
  args: {},
};
