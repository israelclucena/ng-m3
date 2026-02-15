import type { Meta, StoryObj } from '@storybook/angular';
import { StatCardComponent } from '@israel-ui/core';

const meta: Meta<StatCardComponent> = {
  title: 'Components/Cards/StatCard',
  component: StatCardComponent,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<StatCardComponent>;

export const Default: Story = {
  args: {
    label: 'Total Revenue',
    value: '€12,450',
    change: '+12%',
    trend: 'up',
    icon: 'trending_up',
  },
};

export const NegativeTrend: Story = {
  args: {
    label: 'Bounce Rate',
    value: '34%',
    change: '-5%',
    trend: 'down',
    icon: 'trending_down',
    iconColor: '#e53935',
  },
};

export const Outlined: Story = {
  args: {
    label: 'Active Users',
    value: '1,280',
    change: '',
    trend: 'neutral',
    icon: 'group',
    cardVariant: 'outlined',
  },
};
