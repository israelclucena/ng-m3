import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RippleComponent } from './ripple.component';
import '../../material/material-web';

const meta: Meta<RippleComponent> = {
  title: 'Core/Ripple',
  component: RippleComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }),
  ],
  parameters: {
  },
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Disable ripple effect',
    },
  },
};

export default meta;
type Story = StoryObj<RippleComponent>;

// --- Interactive Demo ---
export const Interactive: Story = {
  render: () => ({
    template: `
      <div style="position: relative; width: 200px; height: 120px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: var(--md-sys-color-surface-container, #f3edf7); cursor: pointer; overflow: hidden; user-select: none;">
        <iu-ripple></iu-ripple>
        Click me
      </div>
    `,
  }),
};

// --- Disabled ---
export const Disabled: Story = {
  render: () => ({
    template: `
      <div style="position: relative; width: 200px; height: 120px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: var(--md-sys-color-surface-container, #f3edf7); cursor: not-allowed; overflow: hidden; user-select: none;">
        <iu-ripple [disabled]="true"></iu-ripple>
        Ripple disabled
      </div>
    `,
  }),
};
