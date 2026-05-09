import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { signal } from '@angular/core';
import { PortfolioTaxLifecycleWidgetComponent } from './portfolio-tax-lifecycle.component';
import {
  PortfolioMockService,
  type PortfolioProperty,
} from '../../services/portfolio-mock.service';

const meta: Meta<PortfolioTaxLifecycleWidgetComponent> = {
  title: 'Sprint 049 (Dashboard Consumer)/PortfolioTaxLifecycleWidget',
  component: PortfolioTaxLifecycleWidgetComponent,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Aggregates the recurring annual tax burden across the whole portfolio: ' +
          'IMI per property, AIMI portfolio-wide (singular dedução €600k, progressive ' +
          '0.7%/1.0%/1.5% on excess), IRS Cat. F retention per property at the regime ' +
          'configured in the mock. Optional projected events: a one-shot sale → ' +
          'mais-valias estimate (residente, 50% tributável, taxa autónoma 28%), and ' +
          'a one-shot purchase → IMT + IS estimate (HPP or outros, tabelas 2026). ' +
          'Surfaces calculators de Sprints 042-048 numa única vista de carga fiscal.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<PortfolioTaxLifecycleWidgetComponent>;

/**
 * Inflate every VPT by a multiplier so the portfolio total exceeds the
 * AIMI singular dedução (€600k), triggering the wealth tax. Used by the
 * `WealthTaxTriggered` story.
 */
function withVptInflation(factor: number) {
  return applicationConfig({
    providers: [
      {
        provide: PortfolioMockService,
        useFactory: () => {
          const base = new PortfolioMockService();
          const overridden: PortfolioProperty[] = base
            .properties()
            .map((p) => ({ ...p, vpt: Math.round(p.vpt * factor) }));
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
    template: `<iu-portfolio-tax-lifecycle />`,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Baseline: 8 Lisbon properties from PortfolioMockService. Sum of VPTs ' +
          'is below the €600k AIMI threshold, so AIMI shows as not due (muted card).',
      },
    },
  },
};

export const WealthTaxTriggered: Story = {
  decorators: [withVptInflation(3)],
  render: () => ({
    template: `<iu-portfolio-tax-lifecycle />`,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Override: every property VPT × 3 to push the portfolio total over the ' +
          '€600k AIMI dedução. Demonstrates the progressive escalões kicking in and ' +
          'the per-property AIMI prorata share in the table.',
      },
    },
  },
};

export const WithLifecycleEvents: Story = {
  render: () => ({
    props: {
      projectedSale: { propertyId: 'pt-004', salePrice: 850_000 },
      projectedPurchase: { value: 320_000, finalidade: 'hpp' },
    },
    template: `<iu-portfolio-tax-lifecycle
      [projectedSale]="projectedSale"
      [projectedPurchase]="projectedPurchase" />`,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Both lifecycle events filled in: a projected sale of pt-004 (Cascais T3, ' +
          'acquisition 580k) at 850k → mais-valias residente, plus a projected HPP ' +
          'purchase at 320k → IMT + IS. The events panel renders below the recurring ' +
          'aggregates.',
      },
    },
  },
};
