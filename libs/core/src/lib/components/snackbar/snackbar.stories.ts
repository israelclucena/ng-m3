import type { Meta, StoryObj } from '@storybook/angular';
import { SnackbarComponent } from './snackbar.component';

const meta: Meta<SnackbarComponent> = {
  title: 'Core/Snackbar',
  component: SnackbarComponent,
  tags: ['autodocs'],
  argTypes: {
    message: { control: 'text' },
    action: { control: 'text' },
    variant: {
      control: 'select',
      options: ['single', 'multi'],
    },
    duration: { control: 'number' },
    open: { control: 'boolean' },
    closeable: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<SnackbarComponent>;

export const Simple: Story = {
  args: {
    message: 'Item has been deleted',
    open: true,
    duration: 0,
  },
};

export const WithAction: Story = {
  args: {
    message: 'Email archived',
    action: 'Undo',
    open: true,
    duration: 0,
  },
};

export const MultiLine: Story = {
  args: {
    message: 'This is a longer message that spans multiple lines to show the multi-line variant',
    action: 'Action',
    variant: 'multi',
    open: true,
    duration: 0,
    closeable: true,
  },
};

export const Timed: Story = {
  args: {
    message: 'Changes saved automatically',
    open: true,
    duration: 4000,
  },
};

export const WithClose: Story = {
  args: {
    message: 'Connection restored',
    closeable: true,
    open: true,
    duration: 0,
  },
};
