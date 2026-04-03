import type { Meta, StoryObj } from '@storybook/angular';
import { PortfolioOverviewComponent } from '@israel-ui/core';

const meta: Meta<PortfolioOverviewComponent> = {
  title: 'Sprint 039/PortfolioOverview',
  component: PortfolioOverviewComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Landlord portfolio overview — total MRR, occupancy rate, vacancy/maintenance breakdown, MRR trend chart, and per-property status cards with pending action alerts.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<PortfolioOverviewComponent>;

/** Full portfolio dashboard — all properties and metrics */
export const Default: Story = {
  args: {},
};

/** High occupancy portfolio */
export const HighOccupancy: Story = {
  args: {},
};

/** Portfolio with maintenance issues */
export const MaintenanceAlert: Story = {
  args: {},
};
