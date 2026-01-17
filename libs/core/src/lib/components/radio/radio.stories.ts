import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RadioComponent } from './radio.component';
import '../../material/material-web';

const meta: Meta<RadioComponent> = {
  title: 'Core/Radio',
  component: RadioComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }),
  ],
  parameters: {
  },
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Whether the radio is selected',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    name: {
      control: 'text',
      description: 'Radio group name',
    },
    value: {
      control: 'text',
      description: 'Radio value',
    },
    label: {
      control: 'text',
      description: 'Label text next to the radio',
    },
  },
};

export default meta;
type Story = StoryObj<RadioComponent>;

// --- Default ---
export const Default: Story = {
  args: {
    checked: false,
    disabled: false,
    name: 'demo',
    value: 'option1',
    label: '',
  },
};

// --- Checked ---
export const Checked: Story = {
  args: {
    checked: true,
    name: 'demo',
    value: 'option1',
    label: 'Selected option',
  },
};

// --- Disabled ---
export const Disabled: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; align-items: center;">
        <iu-radio [disabled]="true" name="dis" value="a" label="Disabled unselected"></iu-radio>
        <iu-radio [disabled]="true" [checked]="true" name="dis" value="b" label="Disabled selected"></iu-radio>
      </div>
    `,
  }),
};

// --- Radio Group ---
export const RadioGroup: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <iu-radio name="fruit" value="apple" [checked]="true" label="Maçã"></iu-radio>
        <iu-radio name="fruit" value="banana" label="Banana"></iu-radio>
        <iu-radio name="fruit" value="orange" label="Laranja"></iu-radio>
      </div>
    `,
  }),
};
