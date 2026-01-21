import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IconButtonComponent } from './icon-button.component';
import '../../material/material-web';

const meta: Meta<IconButtonComponent> = {
  title: 'Core/IconButton',
  component: IconButtonComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }),
  ],
  parameters: {
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['standard', 'filled', 'tonal', 'outlined'],
      description: 'M3 icon button variant',
    },
    icon: {
      control: 'text',
      description: 'Material Symbols icon name',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    toggle: {
      control: 'boolean',
      description: 'Toggle mode',
    },
    selected: {
      control: 'boolean',
      description: 'Selected state (when toggle=true)',
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessible label',
    },
  },
};

export default meta;
type Story = StoryObj<IconButtonComponent>;

// --- Playground ---
export const Playground: Story = {
  args: {
    variant: 'standard',
    icon: 'settings',
    disabled: false,
    toggle: false,
    selected: false,
    ariaLabel: '',
  },
};

// --- Standard ---
export const Standard: Story = {
  args: {
    variant: 'standard',
    icon: 'settings',
    ariaLabel: 'Settings',
  },
};

// --- Filled ---
export const Filled: Story = {
  args: {
    variant: 'filled',
    icon: 'edit',
    ariaLabel: 'Edit',
  },
};

// --- Tonal ---
export const Tonal: Story = {
  args: {
    variant: 'tonal',
    icon: 'bookmark',
    ariaLabel: 'Bookmark',
  },
};

// --- Outlined ---
export const Outlined: Story = {
  args: {
    variant: 'outlined',
    icon: 'share',
    ariaLabel: 'Share',
  },
};

// --- Toggle ---
export const Toggle: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; align-items: center;">
        <iu-icon-button variant="standard" icon="favorite" [toggle]="true" [selected]="false" ariaLabel="Favorite"></iu-icon-button>
        <iu-icon-button variant="standard" icon="favorite" [toggle]="true" [selected]="true" ariaLabel="Favorite"></iu-icon-button>
        <iu-icon-button variant="filled" icon="bookmark" [toggle]="true" [selected]="false" ariaLabel="Bookmark"></iu-icon-button>
        <iu-icon-button variant="filled" icon="bookmark" [toggle]="true" [selected]="true" ariaLabel="Bookmark"></iu-icon-button>
      </div>
    `,
  }),
};

// --- Disabled ---
export const Disabled: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; align-items: center;">
        <iu-icon-button variant="standard" icon="settings" [disabled]="true" ariaLabel="Settings"></iu-icon-button>
        <iu-icon-button variant="filled" icon="edit" [disabled]="true" ariaLabel="Edit"></iu-icon-button>
        <iu-icon-button variant="tonal" icon="bookmark" [disabled]="true" ariaLabel="Bookmark"></iu-icon-button>
        <iu-icon-button variant="outlined" icon="share" [disabled]="true" ariaLabel="Share"></iu-icon-button>
      </div>
    `,
  }),
};

// --- All Variants ---
export const AllVariants: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; align-items: center;">
        <iu-icon-button variant="standard" icon="settings" ariaLabel="Settings"></iu-icon-button>
        <iu-icon-button variant="filled" icon="edit" ariaLabel="Edit"></iu-icon-button>
        <iu-icon-button variant="tonal" icon="bookmark" ariaLabel="Bookmark"></iu-icon-button>
        <iu-icon-button variant="outlined" icon="share" ariaLabel="Share"></iu-icon-button>
      </div>
    `,
  }),
};
