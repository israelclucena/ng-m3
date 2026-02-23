import type { Meta, StoryObj } from '@storybook/angular';
import { BarChartComponent } from '@israel-ui/core';

const meta: Meta<BarChartComponent> = {
  title: 'Components/Charts/BarChart',
  component: BarChartComponent,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<BarChartComponent>;

export const Default: Story = {
  args: {
    title: 'Sales by Category',
    data: [
      { label: 'Electronics', value: 450 },
      { label: 'Clothing', value: 300 },
      { label: 'Food', value: 200 },
      { label: 'Books', value: 150 },
    ],
  },
};

export const CustomColor: Story = {
  args: {
    title: 'Custom Bars',
    barColor: '#B3261E',
    data: [
      { label: 'Q1', value: 80 },
      { label: 'Q2', value: 120 },
      { label: 'Q3', value: 95 },
      { label: 'Q4', value: 140 },
    ],
  },
};

export const SmallWithGap: Story = {
  args: {
    title: 'Compact',
    width: 300,
    height: 180,
    barGap: 4,
    data: [
      { label: 'A', value: 30 },
      { label: 'B', value: 60 },
      { label: 'C', value: 45 },
    ],
  },
};
