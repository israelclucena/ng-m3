import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { OccupancyChartComponent } from '@israel-ui/core';
import type { OccupancySummary } from './landlord-analytics.types';

/** Build a 12-month occupancy summary from a rate array (occupied = rate ≥ 50). */
function summary(
  propertyTitle: string,
  rates: number[],
): OccupancySummary {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const data = rates.map((occupancyRate, i) => ({
    month: months[i] ?? `M${i + 1}`,
    occupancyRate,
    occupied: occupancyRate >= 50,
  }));
  const yearlyAverage = Math.round(rates.reduce((s, r) => s + r, 0) / rates.length);
  return { propertyId: 'p1', propertyTitle, yearlyAverage, data };
}

const meta: Meta<OccupancyChartComponent> = {
  title: 'LisboaRent/LandlordAnalytics/OccupancyChart',
  component: OccupancyChartComponent,
  decorators: [
    applicationConfig({
      providers: [provideAnimations()],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**OccupancyChart** — monthly occupancy bar chart for a landlord's property.

Pure SVG (no external chart library), M3 colour tokens throughout. Bars are
tinted with \`--md-sys-color-primary\` when occupied and \`--md-sys-color-surface-variant\`
when vacant, with grid lines, per-bar rate labels, and an annual-average badge.

Feature flag: \`LANDLORD_ANALYTICS\`
        `.trim(),
      },
    },
  },
};

export default meta;
type Story = StoryObj<OccupancyChartComponent>;

/**
 * Default — a healthy year with strong occupancy across most months.
 */
export const Default: Story = {
  args: {
    summary: summary('T2 Bairro Alto, Lisboa', [
      92, 88, 95, 100, 100, 96, 90, 85, 78, 82, 88, 94,
    ]),
  },
};

/**
 * HighVacancy — a struggling property with several vacant months.
 */
export const HighVacancy: Story = {
  args: {
    summary: summary('Estúdio Intendente, Lisboa', [
      40, 30, 55, 60, 45, 20, 15, 25, 50, 65, 48, 35,
    ]),
  },
};

/**
 * FullYear — a property occupied every month of the year.
 */
export const FullYear: Story = {
  args: {
    summary: summary('Moradia T3 Cascais', [
      100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
    ]),
  },
};
