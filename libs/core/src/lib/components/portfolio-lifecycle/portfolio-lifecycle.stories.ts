import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { signal } from '@angular/core';
import { PortfolioLifecycleWidgetComponent } from './portfolio-lifecycle.component';
import {
  PortfolioMockService,
  type PortfolioProperty,
  type LeaseStatus,
} from '../../services/portfolio-mock.service';

const meta: Meta<PortfolioLifecycleWidgetComponent> = {
  title: 'Sprint 051 (Dashboard Consumer)/PortfolioLifecycleWidget',
  component: PortfolioLifecycleWidgetComponent,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Operational counterpart to PortfolioTaxLifecycleWidget. Aggregates the ' +
          'move-in / steady / move-out stage of every property in the mock portfolio, ' +
          'plus inventory delta count and suggested deduction (caução). Closes the ' +
          'triangle lifecycle × inventory × caução at portfolio scale, surfacing the ' +
          'operational state otherwise scattered across MoveInChecklist, MoveOutChecklist, ' +
          'PropertyInventory and DepositReturnEstimator (Sprints 040, 050).',
      },
    },
  },
};

export default meta;
type Story = StoryObj<PortfolioLifecycleWidgetComponent>;

/**
 * Override the lease.status of every property in the mock so the whole
 * portfolio lands in the requested lifecycle stage. Used by the focused
 * stories below.
 */
function withLeaseStatus(status: LeaseStatus) {
  return applicationConfig({
    providers: [
      {
        provide: PortfolioMockService,
        useFactory: () => {
          const base = new PortfolioMockService();
          const overridden: PortfolioProperty[] = base
            .properties()
            .map((p) => ({ ...p, lease: { ...p.lease, status } }));
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
    template: `<iu-portfolio-lifecycle />`,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Baseline: 8 Lisbon properties from PortfolioMockService with the seeded ' +
          'lease.status mix. Demonstrates a real portfolio with a few new tenants, ' +
          'most steady, and one or two near move-out.',
      },
    },
  },
};

export const AllInMoveOut: Story = {
  decorators: [withLeaseStatus('ending')],
  render: () => ({
    template: `<iu-portfolio-lifecycle />`,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Edge case: every lease is ending simultaneously. Surfaces inventory deltas ' +
          'and suggested deductions for all 8 properties, useful to validate the ' +
          'caução-aggregation KPI and the severity colour scale.',
      },
    },
  },
};

export const AllInMoveIn: Story = {
  decorators: [withLeaseStatus('new')],
  render: () => ({
    template: `<iu-portfolio-lifecycle />`,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Edge case: every property has a brand-new tenant. Move-in checklist progress ' +
          'sits between 30% and 80% (deterministic spread), inventory deltas all read 0, ' +
          'suggested deduction is zero. Validates the muted-KPI styling.',
      },
    },
  },
};
