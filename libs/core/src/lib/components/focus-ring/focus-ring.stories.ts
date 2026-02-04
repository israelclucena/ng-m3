import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FocusRingComponent } from './focus-ring.component';
import '../../material/material-web';

const meta: Meta<FocusRingComponent> = {
  title: 'Core/FocusRing',
  component: FocusRingComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }),
  ],
  parameters: {
  },
  argTypes: {
    visible: {
      control: 'boolean',
      description: 'Force focus ring visible',
    },
    inward: {
      control: 'boolean',
      description: 'Render inward ring',
    },
  },
};

export default meta;
type Story = StoryObj<FocusRingComponent>;

// --- Visible Demo ---
export const Visible: Story = {
  render: () => ({
    template: `
      <button style="position: relative; padding: 12px 24px; border-radius: 8px; border: 1px solid #cac4d0; background: var(--md-sys-color-surface, #fff); cursor: pointer; font-size: 14px;">
        <iu-focus-ring [visible]="true"></iu-focus-ring>
        Focus ring always visible
      </button>
    `,
  }),
};

// --- Keyboard Focus Demo ---
export const KeyboardFocus: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px;">
        <button style="position: relative; padding: 12px 24px; border-radius: 8px; border: 1px solid #cac4d0; background: var(--md-sys-color-surface, #fff); cursor: pointer; font-size: 14px;">
          <iu-focus-ring></iu-focus-ring>
          Tab to focus me
        </button>
        <button style="position: relative; padding: 12px 24px; border-radius: 8px; border: 1px solid #cac4d0; background: var(--md-sys-color-surface, #fff); cursor: pointer; font-size: 14px;">
          <iu-focus-ring [inward]="true"></iu-focus-ring>
          Inward ring
        </button>
      </div>
    `,
  }),
};
