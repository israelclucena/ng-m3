import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { signal } from '@angular/core';
import { PortfolioYieldOverviewComponent } from './portfolio-yield-overview.component';
import {
  PortfolioMockService,
  type PortfolioProperty,
} from '../../services/portfolio-mock.service';

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

function withOverride(mut: (p: PortfolioProperty, idx: number) => PortfolioProperty) {
  return applicationConfig({
    providers: [
      {
        provide: PortfolioMockService,
        useFactory: () => {
          const base = new PortfolioMockService();
          const overridden = base.properties().map((p, i) => mut(p, i));
          return {
            ...base,
            properties: signal(overridden),
          } as unknown as PortfolioMockService;
        },
      },
    ],
  });
}

export const Default: Story = {
  render: () => ({
    template: `<iu-portfolio-yield-overview />`,
  }),
};

export const HighYieldPortfolio: Story = {
  decorators: [
    withOverride((p) => ({
      ...p,
      annualRent: Math.round(p.annualRent * 1.4),
      maintenanceCostAnnual: Math.round(p.maintenanceCostAnnual * 0.6),
    })),
  ],
  render: () => ({
    template: `<iu-portfolio-yield-overview />`,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Override: rents pumped 40% and maintenance dropped 40% — every row crosses ' +
          'the strong-yield band. Sanity check that aggregate KPIs scale correctly.',
      },
    },
  },
};

export const StressedPortfolio: Story = {
  decorators: [
    withOverride((p, i) => ({
      ...p,
      annualRent: i % 2 === 0 ? Math.round(p.annualRent * 0.55) : p.annualRent,
      maintenanceCostAnnual: Math.round(p.maintenanceCostAnnual * 1.8),
      irsRegime: 'englobamento',
    })),
  ],
  render: () => ({
    template: `<iu-portfolio-yield-overview />`,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Override: half the units halved their rent, maintenance up 80%, all in englobamento. ' +
          'Exercises negative-net-yield rows + delta-vs-average colouring.',
      },
    },
  },
};
