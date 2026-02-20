import type { Meta, StoryObj } from '@storybook/angular';
import { EmptyStateComponent } from '@israel-ui/core';

const meta: Meta<EmptyStateComponent> = {
  title: 'Components/EmptyState',
  component: EmptyStateComponent,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<EmptyStateComponent>;

export const Default: Story = {
  args: {
    icon: 'inbox',
    title: 'No messages',
    description: 'You have no messages in your inbox yet.',
    actionLabel: 'Compose',
  },
};

export const Small: Story = {
  args: {
    icon: 'search_off',
    title: 'No results',
    description: 'Try adjusting your search terms.',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    icon: 'cloud_off',
    title: 'Connection Lost',
    description: 'Please check your internet connection and try again.',
    actionLabel: 'Retry',
    size: 'lg',
  },
};
