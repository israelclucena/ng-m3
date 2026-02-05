import type { Meta, StoryObj } from '@storybook/angular';
import { TopAppBarComponent } from './top-app-bar.component';

const meta: Meta<TopAppBarComponent> = {
  title: 'Core/TopAppBar',
  component: TopAppBarComponent,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['center-aligned', 'small', 'medium', 'large'],
    },
    headline: { control: 'text' },
    leadingIcon: { control: 'text' },
    trailingIcons: { control: 'object' },
    scrollBehavior: {
      control: 'select',
      options: ['fixed', 'elevate', 'collapse'],
    },
    scrolled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<TopAppBarComponent>;

export const Small: Story = {
  args: {
    variant: 'small',
    headline: 'Page title',
    leadingIcon: 'menu',
    trailingIcons: ['search', 'more_vert'],
  },
};

export const CenterAligned: Story = {
  args: {
    variant: 'center-aligned',
    headline: 'Title',
    leadingIcon: 'menu',
    trailingIcons: ['account_circle'],
  },
};

export const Medium: Story = {
  args: {
    variant: 'medium',
    headline: 'Medium headline',
    leadingIcon: 'arrow_back',
    trailingIcons: ['attach_file', 'event', 'more_vert'],
  },
};

export const Large: Story = {
  args: {
    variant: 'large',
    headline: 'Large headline',
    leadingIcon: 'arrow_back',
    trailingIcons: ['search', 'more_vert'],
  },
};

export const Scrolled: Story = {
  args: {
    variant: 'small',
    headline: 'Scrolled page',
    leadingIcon: 'menu',
    trailingIcons: ['search'],
    scrollBehavior: 'elevate',
    scrolled: true,
  },
};

export const NoIcons: Story = {
  args: {
    variant: 'small',
    headline: 'Simple title',
  },
};
