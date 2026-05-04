import type { Meta, StoryObj } from '@storybook/angular';
import { PortfolioYieldOverviewComponent } from './portfolio-yield-overview.component';

const meta: Meta<PortfolioYieldOverviewComponent> = {
  title: 'Sprint 045 (Dashboard Consumer)/PortfolioYieldOverview',
  component: PortfolioYieldOverviewComponent,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Per-property gross & net yield table for the landlord portfolio. ' +
          'Consumes `PortfolioMockService` (8 Lisbon properties) and computes ' +
          'realistic net yield with IMI, maintenance, deductible expenses and ' +
          'IRS Cat.F retention (28% autónoma or ~30% englobamento). Sortable ' +
          'columns, weighted aggregate KPIs, delta vs portfolio average.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<PortfolioYieldOverviewComponent>;

export const Default: Story = {
  render: () => ({
    template: `<iu-portfolio-yield-overview />`,
  }),
};
