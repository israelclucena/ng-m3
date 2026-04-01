import type { Meta, StoryObj } from '@storybook/angular';
import { RentPaymentPortalComponent } from '@israel-ui/core';

const meta: Meta<RentPaymentPortalComponent> = {
  title: 'LisboaRent/RentPaymentPortal',
  component: RentPaymentPortalComponent,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    mode: { control: 'radio', options: ['tenant', 'landlord'] },
  },
};

export default meta;
type Story = StoryObj<RentPaymentPortalComponent>;

/** Default tenant view with seed data — includes KPI strip, overdue alert, payment table */
export const Default: Story = {
  args: { mode: 'tenant' },
};

/** Tenant view pre-loaded for tenant-001: 3 paid + 1 pending April */
export const TenantView: Story = {
  args: { mode: 'tenant', tenantId: 'tenant-001' },
};

/** Landlord view showing all payments across properties */
export const LandlordView: Story = {
  args: { mode: 'landlord', landlordId: 'landlord-001' },
};
