import type { Meta, StoryObj } from '@storybook/angular';
import { ActionCardComponent } from '@israel-ui/core';

const meta: Meta<ActionCardComponent> = {
  title: 'Components/Cards/ActionCard',
  component: ActionCardComponent,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<ActionCardComponent>;

export const Default: Story = {
  args: {
    title: 'Create New Project',
    description: 'Start a new project from scratch or use a template.',
    icon: 'add_circle',
    actionLabel: 'Get Started',
  },
};

export const Filled: Story = {
  args: {
    title: 'Import Data',
    description: 'Upload a CSV or connect to an external source.',
    icon: 'upload_file',
    actionLabel: 'Import',
    cardVariant: 'filled',
  },
};

export const NoIcon: Story = {
  args: {
    title: 'Quick Action',
    description: 'A minimal action card without icon.',
    actionLabel: 'Do it',
    cardVariant: 'elevated',
  },
};
