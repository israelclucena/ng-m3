import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FabComponent } from './fab.component';
import '../../material/material-web';

const meta: Meta<FabComponent> = {
  title: 'Core/FAB',
  component: FabComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }),
  ],
  parameters: {
  },
  argTypes: {
    icon: {
      control: 'text',
      description: 'Material Symbols icon name',
    },
    label: {
      control: 'text',
      description: 'Label text (makes it an Extended FAB)',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'FAB size (small=40px, medium=56px, large=96px)',
    },
    variant: {
      control: 'select',
      options: ['surface', 'primary', 'secondary', 'tertiary'],
      description: 'M3 color variant',
    },
    lowered: {
      control: 'boolean',
      description: 'Lowered elevation',
    },
  },
};

export default meta;
type Story = StoryObj<FabComponent>;

// --- Playground ---
export const Playground: Story = {
  args: {
    icon: 'add',
    label: '',
    size: 'medium',
    variant: 'surface',
    lowered: false,
  },
};

// --- Default ---
export const Default: Story = {
  args: {
    icon: 'add',
    size: 'medium',
    variant: 'primary',
  },
};

// --- Small ---
export const Small: Story = {
  args: {
    icon: 'add',
    size: 'small',
    variant: 'primary',
  },
};

// --- Large ---
export const Large: Story = {
  args: {
    icon: 'add',
    size: 'large',
    variant: 'primary',
  },
};

// --- Extended (with label) ---
export const Extended: Story = {
  args: {
    icon: 'navigation',
    label: 'Navigate',
    size: 'medium',
    variant: 'primary',
  },
};

// --- Lowered ---
export const Lowered: Story = {
  args: {
    icon: 'edit',
    size: 'medium',
    variant: 'surface',
    lowered: true,
  },
};

// --- All Variants ---
export const AllVariants: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
        <iu-fab icon="add" variant="surface"></iu-fab>
        <iu-fab icon="add" variant="primary"></iu-fab>
        <iu-fab icon="add" variant="secondary"></iu-fab>
        <iu-fab icon="add" variant="tertiary"></iu-fab>
      </div>
    `,
  }),
};

// --- All Sizes ---
export const AllSizes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; align-items: end; flex-wrap: wrap;">
        <iu-fab icon="add" size="small" variant="primary"></iu-fab>
        <iu-fab icon="add" size="medium" variant="primary"></iu-fab>
        <iu-fab icon="add" size="large" variant="primary"></iu-fab>
        <iu-fab icon="edit" size="medium" variant="secondary" label="Edit"></iu-fab>
      </div>
    `,
  }),
};
