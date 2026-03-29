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
        name: "Revenue",
        color: '#6750A4',
        data: [
          { label: "Jan", value: 100 },
          { label: "Feb", value: 150 },
          { label: "Mar", value: 130 },
          { label: "Apr", value: 200 },
          { label: "May", value: 180 },
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
        name: "Revenue",
        color: '#6750A4',
        data: [
          { label: "Jan", value: 100 },
          { label: "Feb", value: 150 },
          { label: "Mar", value: 200 },
        ],
      },
      {
        name: "Expenses",
        color: '#B3261E',
        data: [
          { label: "Jan", value: 80 },
          { label: "Feb", value: 90 },
          { label: "Mar", value: 110 },
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
        name: "Data",
        color: '#625B71',
        data: [
          { label: 'A', value: 10 },
          { label: 'B', value: 40 },
          { label: 'C', value: 25 },
        ],
      },
    ],
  },
};
