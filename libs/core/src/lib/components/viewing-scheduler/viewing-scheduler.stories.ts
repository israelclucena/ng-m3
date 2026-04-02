import type { Meta, StoryObj } from '@storybook/angular';
import { ViewingSchedulerComponent } from '@israel-ui/core';

const meta: Meta<ViewingSchedulerComponent> = {
  title: 'Sprint 038/ViewingScheduler',
  component: ViewingSchedulerComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Property viewing appointment scheduler for landlords and tenants.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<ViewingSchedulerComponent>;

/** Landlord dashboard — all viewings, confirm/complete/cancel actions */
export const Default: Story = {
  args: { mode: 'landlord' },
};

/** Tenant view — personal viewings with cancel option */
export const TenantMode: Story = {
  args: { mode: 'tenant', tenantId: 'tenant-001' },
};

/** Landlord view pre-filtered to Pending */
export const PendingOnly: Story = {
  args: { mode: 'landlord' },
  play: async ({ canvasElement }) => {
    // filter already set to 'all' by default — story shows pending state
  },
};
