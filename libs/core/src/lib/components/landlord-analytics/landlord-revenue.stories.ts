import type { Meta, StoryObj } from '@storybook/angular';
import { LandlordRevenueComponent } from '@israel-ui/core';

const meta: Meta<LandlordRevenueComponent> = {
  title: 'LandlordAnalytics/LandlordRevenue',
  component: LandlordRevenueComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**LandlordRevenueComponent** — Sprint 030.

Full landlord revenue dashboard: KPI cards (MRR, ARR, net profit, occupancy),
12-month bar chart (revenue vs expenses), and top-properties leaderboard.

Signal-based via \`RevenueAnalyticsService\`. Auto-loads on mount by default.

Feature flag: \`LANDLORD_REVENUE\`
        `,
      },
    },
  },
  argTypes: {
    landlordId: { control: 'text', description: 'Landlord identifier for data fetching' },
    autoLoad: { control: 'boolean', description: 'Auto-load analytics on init' },
  },
};

export default meta;
type Story = StoryObj<LandlordRevenueComponent>;

/** Full dashboard — auto-loads mock data */
export const Default: Story = {
  args: {
    landlordId: 'landlord-001',
    autoLoad: true,
  },
};

/** Loading state — auto-load disabled so spinner shows briefly */
export const Loading: Story = {
  args: {
    landlordId: 'landlord-loading',
    autoLoad: true,
  },
  parameters: {
    docs: {
      description: { story: 'Shows the spinner while data is fetching (600ms mock delay).' },
    },
  },
};

/** No data — auto-load disabled, shows empty state */
export const EmptyState: Story = {
  args: {
    landlordId: 'landlord-empty',
    autoLoad: false,
  },
  parameters: {
    docs: {
      description: { story: 'When autoLoad=false and no data is in the service, renders the empty state.' },
    },
  },
};
