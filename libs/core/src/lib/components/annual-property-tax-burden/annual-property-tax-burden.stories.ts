import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { inject, Component } from '@angular/core';
import { AnnualPropertyTaxBurdenComponent } from './annual-property-tax-burden.component';
import {
  AnnualPropertyTaxBurdenService,
  type PropertyDisposition,
} from '../../services/annual-property-tax-burden.service';

const meta: Meta<AnnualPropertyTaxBurdenComponent> = {
  title: 'Sprint 053/AnnualPropertyTaxBurden',
  component: AnnualPropertyTaxBurdenComponent,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Hybrid KPI + calendar view of the four annual PT real-estate taxes ' +
          '(IMI · AIMI · IRS Cat. F · Mais-Valias) for a single fiscal year. ' +
          'Consumes `AnnualPropertyTaxBurdenService` (Sprint 053). Differs from ' +
          '`PortfolioTaxLifecycleWidget` (Sprint 049) by focusing on the time ' +
          'axis: KPIs are secondary, the sorted dated payment timeline is primary.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<AnnualPropertyTaxBurdenComponent>;

export const Default: Story = {
  render: () => ({
    template: `<iu-annual-property-tax-burden />`,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Baseline: current year, no dispositions. Calendar lists only the ' +
          'recurring annual events (IMI 1-3 prestações + AIMI 30 Set if due + ' +
          'IRS Cat. F deadline 30 Jun do ano seguinte).',
      },
    },
  },
};

export const WithSale: Story = {
  decorators: [
    moduleMetadata({
      imports: [],
    }),
    applicationConfig({
      providers: [],
    }),
  ],
  render: () => {
    @Component({
      selector: 'iu-burden-story-with-sale',
      standalone: true,
      imports: [AnnualPropertyTaxBurdenComponent],
      template: `<iu-annual-property-tax-burden />`,
    })
    class WithSaleHost {
      constructor() {
        const svc = inject(AnnualPropertyTaxBurdenService);
        svc.reset();
        const sale: PropertyDisposition = {
          propertyId: 'pt-004',
          salePrice: 850_000,
          saleDate: `${new Date().getFullYear()}-07-15`,
          residencia: 'residente',
        };
        svc.setDispositions([sale]);
      }
    }
    return { template: `<iu-burden-story-with-sale />`, moduleMetadata: { imports: [WithSaleHost] } };
  },
  parameters: {
    docs: {
      description: {
        story:
          'A single disposition (pt-004 sold at €850k) added to the year — the ' +
          'mais-valias event appears in the calendar with the IRS deadline next year.',
      },
    },
  },
};

export const HistoricalYear: Story = {
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: AnnualPropertyTaxBurdenService,
          useFactory: () => {
            const svc = new AnnualPropertyTaxBurdenService();
            svc.setYear(2024);
            return svc;
          },
        },
      ],
    }),
  ],
  render: () => ({
    template: `<iu-annual-property-tax-burden />`,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Year-picker preset to 2024 — calendar dates shift back. Useful for ' +
          'auditing past tax cycles or comparing year-over-year.',
      },
    },
  },
};
