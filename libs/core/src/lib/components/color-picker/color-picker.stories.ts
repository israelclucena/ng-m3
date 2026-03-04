import type { Meta, StoryObj } from '@storybook/angular';
import { ColorPickerComponent } from '@israel-ui/core';

const meta: Meta<ColorPickerComponent> = {
  title: 'Sprint 007/ColorPicker',
  component: ColorPickerComponent,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    value: { control: 'color' },
    showOpacity: { control: 'boolean' },
  },
  args: {
    label: 'Brand color',
    value: '#6750a4',
    showOpacity: true,
  },
};

export default meta;
type Story = StoryObj<ColorPickerComponent>;

/**
 * Default — M3 palette with hex/rgb inputs and opacity slider.
 */
export const Default: Story = {};

/**
 * WithoutOpacity — simple color selection, no alpha channel.
 */
export const WithoutOpacity: Story = {
  args: {
    label: 'Background color',
    value: '#4a9c9c',
    showOpacity: false,
  },
};

/**
 * PresetRed — starts with an error-tone color selected.
 */
export const PresetRed: Story = {
  args: {
    label: 'Danger color',
    value: '#b3261e',
    showOpacity: false,
  },
};
