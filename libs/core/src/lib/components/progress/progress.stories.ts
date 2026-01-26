import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ProgressComponent } from './progress.component';
import '../../material/material-web';

const meta: Meta<ProgressComponent> = {
  title: 'Core/Progress',
  component: ProgressComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }),
  ],
  parameters: {
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['linear', 'circular'],
      description: 'Progress indicator type',
    },
    value: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: 'Determinate value (0–1)',
    },
    indeterminate: {
      control: 'boolean',
      description: 'Indeterminate (infinite animation)',
    },
    fourColor: {
      control: 'boolean',
      description: 'Four-color indeterminate animation',
    },
  },
};

export default meta;
type Story = StoryObj<ProgressComponent>;

// --- Playground ---
export const Playground: Story = {
  args: {
    type: 'linear',
    value: 0.5,
    indeterminate: false,
    fourColor: false,
  },
};

// --- Linear Determinate ---
export const LinearDeterminate: Story = {
  render: () => ({
    template: `
      <div style="width: 320px;">
        <iu-progress type="linear" [value]="0.6"></iu-progress>
      </div>
    `,
  }),
};

// --- Linear Indeterminate ---
export const LinearIndeterminate: Story = {
  render: () => ({
    template: `
      <div style="width: 320px;">
        <iu-progress type="linear" [indeterminate]="true"></iu-progress>
      </div>
    `,
  }),
};

// --- Circular Determinate ---
export const CircularDeterminate: Story = {
  args: {
    type: 'circular',
    value: 0.7,
    indeterminate: false,
  },
};

// --- Circular Indeterminate ---
export const CircularIndeterminate: Story = {
  args: {
    type: 'circular',
    indeterminate: true,
  },
};

// --- Four Color ---
export const FourColor: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
        <div style="width: 240px;">
          <iu-progress type="linear" [indeterminate]="true" [fourColor]="true"></iu-progress>
        </div>
        <iu-progress type="circular" [indeterminate]="true" [fourColor]="true"></iu-progress>
      </div>
    `,
  }),
};

// --- All Types ---
export const AllTypes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px; width: 320px;">
        <div>
          <p style="margin: 0 0 8px; font-size: 12px; color: #666;">Linear Determinate (60%)</p>
          <iu-progress type="linear" [value]="0.6"></iu-progress>
        </div>
        <div>
          <p style="margin: 0 0 8px; font-size: 12px; color: #666;">Linear Indeterminate</p>
          <iu-progress type="linear" [indeterminate]="true"></iu-progress>
        </div>
        <div style="display: flex; gap: 16px; align-items: center;">
          <div style="text-align: center;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #666;">Circular 70%</p>
            <iu-progress type="circular" [value]="0.7"></iu-progress>
          </div>
          <div style="text-align: center;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #666;">Circular ∞</p>
            <iu-progress type="circular" [indeterminate]="true"></iu-progress>
          </div>
        </div>
      </div>
    `,
  }),
};
