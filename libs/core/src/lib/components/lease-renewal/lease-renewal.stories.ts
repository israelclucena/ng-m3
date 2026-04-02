import type { Meta, StoryObj } from '@storybook/angular';
import { LeaseRenewalComponent } from '@israel-ui/core';

const meta: Meta<LeaseRenewalComponent> = {
  title: 'Sprint 038/LeaseRenewal',
  component: LeaseRenewalComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Lease renewal manager — shows expiring leases, renewal offers, and tenant responses.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<LeaseRenewalComponent>;

/** Landlord view — full portfolio renewal management */
export const Default: Story = {
  args: { mode: 'landlord' },
};

/** Tenant view — personal lease renewal status */
export const TenantMode: Story = {
  args: { mode: 'tenant', tenantId: 'tenant-001' },
};

/** Landlord view showing accepted renewals */
export const AcceptedRenewals: Story = {
  args: { mode: 'landlord' },
};
