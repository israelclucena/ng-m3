import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CheckboxComponent } from './checkbox.component';
import '../../material/material-web';

const meta: Meta<CheckboxComponent> = {
  title: 'Core/Checkbox',
  component: CheckboxComponent,
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
      description: 'Whether the checkbox is checked',
    },
    indeterminate: {
      control: 'boolean',
      description: 'Indeterminate (mixed) state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    label: {
      control: 'text',
      description: 'Label text next to the checkbox',
    },
  },
};

export default meta;
type Story = StoryObj<CheckboxComponent>;

// --- Default ---
export const Default: Story = {
  args: {
    checked: false,
    indeterminate: false,
    disabled: false,
    label: '',
  },
};

// --- Checked ---
export const Checked: Story = {
  args: {
    checked: true,
    label: '',
  },
};

// --- Indeterminate ---
export const Indeterminate: Story = {
  args: {
    indeterminate: true,
    label: '',
  },
};

// --- Disabled ---
export const Disabled: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; align-items: center;">
        <iu-checkbox [disabled]="true" label="Disabled unchecked"></iu-checkbox>
        <iu-checkbox [disabled]="true" [checked]="true" label="Disabled checked"></iu-checkbox>
      </div>
    `,
  }),
};

// --- With Label ---
export const WithLabel: Story = {
  args: {
    checked: false,
    label: 'Aceitar termos e condições',
  },
};
