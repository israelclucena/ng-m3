import type { Meta, StoryObj } from '@storybook/angular';
import { LineChartComponent } from '@israel-ui/core';

const meta: Meta<LineChartComponent> = {
  title: 'Components/Charts/LineChart',
  component: LineChartComponent,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<LineChartComponent>;

export const Default: Story = {
  args: {
    title: 'Monthly Revenue',
    series: [
      {
        label: 'Revenue',
        color: '#6750A4',
        data: [
          { x: 'Jan', y: 100 },
          { x: 'Feb', y: 150 },
          { x: 'Mar', y: 130 },
          { x: 'Apr', y: 200 },
          { x: 'May', y: 180 },
        ],
      },
    ],
  },
};

export const MultipleSeries: Story = {
  args: {
    title: 'Revenue vs Expenses',
    series: [
      {
        label: 'Revenue',
        color: '#6750A4',
        data: [
          { x: 'Jan', y: 100 },
          { x: 'Feb', y: 150 },
          { x: 'Mar', y: 200 },
        ],
      },
      {
        label: 'Expenses',
        color: '#B3261E',
        data: [
          { x: 'Jan', y: 80 },
          { x: 'Feb', y: 90 },
          { x: 'Mar', y: 110 },
        ],
      },
    ],
    showLegend: true,
  },
};

export const CustomSize: Story = {
  args: {
    title: 'Small Chart',
    width: 320,
    height: 200,
    showLegend: false,
    series: [
      {
        label: 'Data',
        color: '#625B71',
        data: [
          { x: 'A', y: 10 },
          { x: 'B', y: 40 },
          { x: 'C', y: 25 },
        ],
      },
    ],
  },
};
