import type { Meta, StoryObj } from '@storybook/angular';
import { DatePickerComponent } from '@israel-ui/core';

const meta: Meta<DatePickerComponent> = {
  title: 'Sprint 007/DatePicker',
  component: DatePickerComponent,
  tags: ['autodocs'],
  argTypes: {
    mode: { control: 'select', options: ['single', 'range'] },
    label: { control: 'text' },
    helperText: { control: 'text' },
    errorMessage: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: {
    label: 'Select date',
    mode: 'single',
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<DatePickerComponent>;

/**
 * Default — single date picker with calendar overlay.
 */
export const Default: Story = {
  args: {
    label: 'Check-in date',
    helperText: 'Click the field to open the calendar.',
  },
};

/**
 * RangeMode — select a start and end date for a trip.
 */
export const RangeMode: Story = {
  args: {
    label: 'Travel dates',
    mode: 'range',
    helperText: 'Click twice to set arrival and departure.',
  },
};

/**
 * WithMinMax — restricted date range (next 30 days only).
 */
export const WithMinMax: Story = {
  args: {
    label: 'Availability',
    minDate: new Date(),
    maxDate: new Date(Date.now() + 30 * 86400000),
    helperText: 'Only dates in the next 30 days are available.',
  },
};
