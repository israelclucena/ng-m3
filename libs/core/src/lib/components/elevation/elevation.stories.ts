import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ElevationComponent } from './elevation.component';
import '../../material/material-web';

const meta: Meta<ElevationComponent> = {
  title: 'Core/Elevation',
  component: ElevationComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }),
  ],
  parameters: {
  },
  argTypes: {
    level: {
      control: { type: 'range', min: 0, max: 5, step: 1 },
      description: 'M3 elevation level (0-5)',
    },
  },
};

export default meta;
type Story = StoryObj<ElevationComponent>;

// --- Playground ---
export const Playground: Story = {
  args: { level: 2 },
  render: (args) => ({
    props: args,
    template: `
      <div style="position: relative; width: 200px; height: 120px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: var(--md-sys-color-surface, #fff);">
        <iu-elevation [level]="level"></iu-elevation>
        <span>Level {{ level }}</span>
      </div>
    `,
  }),
};

// --- All Levels ---
export const AllLevels: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; flex-wrap: wrap;">
        @for (lvl of [0, 1, 2, 3, 4, 5]; track lvl) {
          <div style="position: relative; width: 120px; height: 80px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: var(--md-sys-color-surface, #fff);">
            <iu-elevation [level]="lvl"></iu-elevation>
            <span>Level {{ lvl }}</span>
          </div>
        }
      </div>
    `,
  }),
};
