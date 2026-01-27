import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SliderComponent } from './slider.component';
import '../../material/material-web';

const meta: Meta<SliderComponent> = {
  title: 'Core/Slider',
  component: SliderComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }),
  ],
  parameters: {
  },
  argTypes: {
    value: { control: 'number', description: 'Current value' },
    min: { control: 'number', description: 'Minimum value' },
    max: { control: 'number', description: 'Maximum value' },
    step: { control: 'number', description: 'Step increment (0 = continuous)' },
    labeled: { control: 'boolean', description: 'Show value label on thumb' },
    disabled: { control: 'boolean', description: 'Disabled state' },
    range: { control: 'boolean', description: 'Range mode (two thumbs)' },
    valueStart: { control: 'number', description: 'Start value (range mode)' },
    valueEnd: { control: 'number', description: 'End value (range mode)' },
  },
};

export default meta;
type Story = StoryObj<SliderComponent>;

// --- Continuous ---
export const Continuous: Story = {
  args: {
    value: 50,
    min: 0,
    max: 100,
    step: 0,
    labeled: false,
    disabled: false,
    range: false,
  },
};

// --- Discrete (with steps) ---
export const Discrete: Story = {
  args: {
    value: 40,
    min: 0,
    max: 100,
    step: 10,
    labeled: true,
    disabled: false,
    range: false,
  },
};

// --- Range ---
export const Range: Story = {
  render: () => ({
    template: `
      <iu-slider
        [range]="true"
        [min]="0"
        [max]="100"
        [valueStart]="25"
        [valueEnd]="75"
        [labeled]="true"
      ></iu-slider>
    `,
  }),
};

// --- Labeled ---
export const Labeled: Story = {
  args: {
    value: 60,
    min: 0,
    max: 100,
    step: 5,
    labeled: true,
  },
};

// --- Disabled ---
export const Disabled: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <iu-slider [value]="30" [disabled]="true"></iu-slider>
        <iu-slider [range]="true" [valueStart]="20" [valueEnd]="60" [disabled]="true"></iu-slider>
      </div>
    `,
  }),
};
