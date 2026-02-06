import type { Meta, StoryObj } from '@storybook/angular';
import { BadgeComponent } from './badge.component';

const meta: Meta<BadgeComponent> = {
  title: 'Core/Badge',
  component: BadgeComponent,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['small', 'large'],
    },
    value: { control: 'text' },
    visible: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<BadgeComponent>;

export const Small: Story = {
  args: {
    variant: 'small',
    visible: true,
  },
};

export const Large: Story = {
  args: {
    variant: 'large',
    value: 3,
    visible: true,
  },
};

export const WithNumber: Story = {
  args: {
    variant: 'large',
    value: 99,
  },
};

export const Overflow: Story = {
  args: {
    variant: 'large',
    value: 1234,
  },
};

export const WithText: Story = {
  args: {
    variant: 'large',
    value: 'New',
  },
};

export const Hidden: Story = {
  args: {
    variant: 'large',
    value: 5,
    visible: false,
  },
};
