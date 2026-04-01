import type { Meta, StoryObj } from '@storybook/angular';
import { DocumentVaultComponent } from '@israel-ui/core';

const meta: Meta<DocumentVaultComponent> = {
  title: 'LisboaRent/DocumentVault',
  component: DocumentVaultComponent,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<DocumentVaultComponent>;

/** Full vault with seed data — sidebar navigation, category counts, storage indicator */
export const Default: Story = {
  args: {},
};

/** Tenant vault pre-loaded for tenant-001 — leases, receipts, ID, inspection, photos */
export const TenantVault: Story = {
  args: { ownerId: 'tenant-001' },
};

/** Landlord vault — contracts, leases across properties */
export const LandlordVault: Story = {
  args: { ownerId: 'landlord-001' },
};
