import type { Meta, StoryObj } from '@storybook/angular';
import { DonutChartComponent } from '@israel-ui/core';

const meta: Meta<DonutChartComponent> = {
  title: 'Components/Charts/DonutChart',
  component: DonutChartComponent,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<DonutChartComponent>;

export const Default: Story = {
  args: {
    title: 'Traffic Sources',
    centerLabel: 'Total',
    segments: [
      { label: 'Direct', value: 40, color: '#6750A4' },
      { label: 'Organic', value: 30, color: '#625B71' },
      { label: 'Referral', value: 20, color: '#7D5260' },
      { label: 'Social', value: 10, color: '#B3261E' },
    ],
  },
};

export const SmallNoLegend: Story = {
  args: {
    title: 'Mini',
    size: 160,
    showLegend: false,
    centerLabel: '75%',
    segments: [
      { label: 'Done', value: 75, color: '#6750A4' },
      { label: 'Remaining', value: 25, color: '#E8DEF8' },
    ],
  },
};

export const ThreeSegments: Story = {
  args: {
    title: 'Budget Allocation',
    segments: [
      { label: 'Engineering', value: 50, color: '#6750A4' },
      { label: 'Marketing', value: 30, color: '#625B71' },
      { label: 'Operations', value: 20, color: '#7D5260' },
    ],
  },
};
