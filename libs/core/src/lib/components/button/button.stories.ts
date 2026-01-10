import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ButtonComponent } from './button.component';
import '../../material/material-web';

const meta: Meta<ButtonComponent> = {
  title: 'Core/Button',
  component: ButtonComponent,
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
      options: ['primary', 'secondary', 'outlined', 'elevated', 'selected', 'danger', 'ghost', 'text'],
      description: 'M3 button variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size (sm=32px, md=40px, lg=48px)',
    },
    label: {
      control: 'text',
      description: 'Button text label',
    },
    icon: {
      control: 'text',
      description: 'Material Symbols icon name (e.g. upload, add)',
    },
    trailingIcon: {
      control: 'boolean',
      description: 'Icon renders after the label',
    },
    disabled: {
      control: 'boolean',
      description: 'Hard-disabled (not focusable)',
    },
    softDisabled: {
      control: 'boolean',
      description: 'Soft-disabled (focusable, ARIA pattern)',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state (soft-disabled + aria-busy)',
    },
    fullWidth: {
      control: 'boolean',
      description: '100% width of container',
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessible label (aria-label)',
    },
  },
};

export default meta;
type Story = StoryObj<ButtonComponent>;

// --- Playground (all controls) ---
export const Playground: Story = {
  args: {
    variant: 'primary',
    label: 'Confirmar',
    size: 'md',
    icon: '',
    trailingIcon: false,
    disabled: false,
    softDisabled: false,
    loading: false,
    fullWidth: false,
    ariaLabel: '',
  },
};

// --- Primary ---
export const Primary: Story = {
  args: {
    variant: 'primary',
    label: 'Guardar',
    icon: 'save',
  },
};

// --- Secondary (Tonal) ---
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    label: 'Cancelar',
    icon: 'close',
  },
};

// --- Outlined ---
export const Outlined: Story = {
  args: {
    variant: 'outlined',
    label: 'Ver detalhes',
    icon: 'info',
  },
};

// --- Elevated ---
export const Elevated: Story = {
  args: {
    variant: 'elevated',
    label: 'Elevated',
    icon: 'add',
  },
};

// --- Danger ---
export const Danger: Story = {
  args: {
    variant: 'danger',
    label: 'Eliminar',
    icon: 'delete',
  },
};

// --- Ghost / Text ---
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    label: 'Mais opções',
    icon: 'more_horiz',
  },
};

// --- With Trailing Icon ---
export const WithTrailingIcon: Story = {
  args: {
    variant: 'primary',
    label: 'Seguinte',
    icon: 'arrow_forward',
    trailingIcon: true,
  },
};

// --- Disabled ---
export const Disabled: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
        <iu-button variant="primary" [disabled]="true" label="Primary" icon="upload"></iu-button>
        <iu-button variant="outlined" [disabled]="true" label="Outlined"></iu-button>
        <iu-button variant="danger" [disabled]="true" label="Danger" icon="delete"></iu-button>
        <iu-button variant="ghost" [disabled]="true" label="Ghost"></iu-button>
        <iu-button variant="primary" [softDisabled]="true" label="Soft-disabled (focusable)"></iu-button>
      </div>
    `,
  }),
};

// --- Loading ---
export const Loading: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
        <iu-button variant="primary" [loading]="true" label="A guardar..." icon="upload"></iu-button>
        <iu-button variant="secondary" [loading]="true" label="A processar..."></iu-button>
        <iu-button variant="danger" [loading]="true" label="A eliminar..." icon="delete"></iu-button>
      </div>
    `,
  }),
};

// --- Full Width ---
export const FullWidth: Story = {
  render: () => ({
    template: `
      <div style="width: 320px; border: 1px dashed #cac4d0; padding: 16px; border-radius: 12px;">
        <iu-button variant="primary" [fullWidth]="true" label="Entrar" icon="login"></iu-button>
      </div>
    `,
  }),
};

// --- All Variants ---
export const AllVariants: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
        <iu-button variant="primary" label="Primary" icon="upload"></iu-button>
        <iu-button variant="secondary" label="Secondary" icon="close"></iu-button>
        <iu-button variant="outlined" label="Outlined" icon="info"></iu-button>
        <iu-button variant="elevated" label="Elevated" icon="add"></iu-button>
        <iu-button variant="selected" label="Selected" icon="check"></iu-button>
        <iu-button variant="danger" label="Danger" icon="delete"></iu-button>
        <iu-button variant="ghost" label="Ghost" icon="more_horiz"></iu-button>
      </div>
    `,
  }),
};

// --- All Sizes ---
export const AllSizes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
        <iu-button variant="primary" size="sm" label="Small"></iu-button>
        <iu-button variant="primary" size="md" label="Medium"></iu-button>
        <iu-button variant="primary" size="lg" label="Large"></iu-button>
      </div>
    `,
  }),
};
