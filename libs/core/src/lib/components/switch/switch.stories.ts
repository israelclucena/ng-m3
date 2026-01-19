import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SwitchComponent } from './switch.component';
import '../../material/material-web';

const meta: Meta<SwitchComponent> = {
  title: 'Core/Switch',
  component: SwitchComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }),
  ],
  parameters: {
  },
  argTypes: {
    selected: {
      control: 'boolean',
      description: 'Whether the switch is on',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    icons: {
      control: 'boolean',
      description: 'Show check/cross icons on the handle',
    },
    label: {
      control: 'text',
      description: 'Label text next to the switch',
    },
  },
};

export default meta;
type Story = StoryObj<SwitchComponent>;

// --- Default ---
export const Default: Story = {
  args: {
    selected: false,
    disabled: false,
    icons: false,
    label: '',
  },
};

// --- Selected ---
export const Selected: Story = {
  args: {
    selected: true,
    label: 'Modo escuro',
  },
};

// --- With Icons ---
export const WithIcons: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <iu-switch [icons]="true" label="Com ícones (off)"></iu-switch>
        <iu-switch [icons]="true" [selected]="true" label="Com ícones (on)"></iu-switch>
      </div>
    `,
  }),
};

// --- Disabled ---
export const Disabled: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <iu-switch [disabled]="true" label="Disabled off"></iu-switch>
        <iu-switch [disabled]="true" [selected]="true" label="Disabled on"></iu-switch>
      </div>
    `,
  }),
};
