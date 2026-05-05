import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { signal } from '@angular/core';
import { PortfolioFiscalSummaryComponent } from './portfolio-fiscal-summary.component';
import {
  PortfolioMockService,
  type PortfolioProperty,
} from '../../services/portfolio-mock.service';

const meta: Meta<PortfolioFiscalSummaryComponent> = {
  title: 'Sprint 045 (Dashboard Consumer)/PortfolioFiscalSummary',
  component: PortfolioFiscalSummaryComponent,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Aggregates IRS Categoria F outputs across the whole portfolio. ' +
          'For each property: rendimento bruto, dedutíveis (IMI + manutenção + outras), ' +
          'rendimento líquido, IRS no regime actual. Compares portfolio-wide actual vs ' +
          '"todas autónoma 28%" vs "todas englobamento" (escalões 2026) — recommends the ' +
          'cheaper portfolio-wide regime. Surfaces calculators de Sprint 042/043/044 numa única vista.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<PortfolioFiscalSummaryComponent>;

function withRegimeOverride(regime: 'taxaAutonoma28' | 'englobamento') {
  return applicationConfig({
    providers: [
      {
        provide: PortfolioMockService,
        useFactory: () => {
          const base = new PortfolioMockService();
          const overridden: PortfolioProperty[] = base
            .properties()
            .map((p) => ({ ...p, irsRegime: regime }));
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
    template: `<iu-portfolio-fiscal-summary />`,
  }),
};

export const AllAutonoma: Story = {
  decorators: [withRegimeOverride('taxaAutonoma28')],
  render: () => ({
    template: `<iu-portfolio-fiscal-summary />`,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Override: all 8 properties forced to taxa autónoma 28%.',
      },
    },
  },
};

export const AllEnglobamento: Story = {
  decorators: [withRegimeOverride('englobamento')],
  render: () => ({
    template: `<iu-portfolio-fiscal-summary />`,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Override: all 8 properties forced to englobamento (progressive).',
      },
    },
  },
};
