import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DividerComponent } from './divider.component';
import '../../material/material-web';

const meta: Meta<DividerComponent> = {
  title: 'Core/Divider',
  component: DividerComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }),
  ],
  parameters: {
  },
  argTypes: {
    inset: { control: 'boolean', description: 'Inset on both sides' },
    insetStart: { control: 'boolean', description: 'Inset on start side' },
    insetEnd: { control: 'boolean', description: 'Inset on end side' },
  },
};

export default meta;
type Story = StoryObj<DividerComponent>;

// --- Default ---
export const Default: Story = {
  render: () => ({
    template: `
      <div style="width: 400px; padding: 16px;">
        <p>Content above</p>
        <iu-divider></iu-divider>
        <p>Content below</p>
      </div>
    `,
  }),
};

// --- Inset ---
export const Inset: Story = {
  render: () => ({
    template: `
      <div style="width: 400px; padding: 16px;">
        <p>Content above</p>
        <iu-divider [inset]="true"></iu-divider>
        <p>Content below</p>
      </div>
    `,
  }),
};

// --- Inset Start ---
export const InsetStart: Story = {
  render: () => ({
    template: `
      <div style="width: 400px; padding: 16px;">
        <p>Content above</p>
        <iu-divider [insetStart]="true"></iu-divider>
        <p>Content below</p>
      </div>
    `,
  }),
};
