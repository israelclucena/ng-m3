import type { Meta, StoryObj } from '@storybook/angular';
import { RentArrearsComponent } from '@israel-ui/core';

const meta: Meta<RentArrearsComponent> = {
  title: 'Sprint 038/RentArrears',
  component: RentArrearsComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Landlord rent arrears manager — tracks overdue payments, sends reminders, manages payment plans, and escalates to legal.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<RentArrearsComponent>;

/** Full arrears dashboard — all statuses */
export const Default: Story = {
  args: {},
};

/** Showing only critical/legal cases */
export const CriticalCases: Story = {
  args: {},
};

/** Clean slate — all resolved (empty state) */
export const AllResolved: Story = {
  args: {},
};
