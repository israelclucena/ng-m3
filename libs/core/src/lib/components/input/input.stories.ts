import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { InputComponent } from './input.component';
import '../../material/material-web';

const meta: Meta<InputComponent> = {
  title: 'Core/Input',
  component: InputComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }),
  ],
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['outlined', 'filled'],
      description: 'Visual variant (M3 text field)',
    },
    type: {
      control: 'select',
      options: ['text', 'password', 'email', 'number', 'search', 'tel'],
      description: 'HTML input type',
    },
    label:        { control: 'text' },
    placeholder:  { control: 'text' },
    hint:         { control: 'text' },
    errorMessage: { control: 'text' },
    disabled:     { control: 'boolean' },
    required:     { control: 'boolean' },
    fullWidth:    { control: 'boolean' },
    prefixIcon:   { control: 'text', description: 'Material icon name (leading)' },
    suffixIcon:   { control: 'text', description: 'Material icon name (trailing)' },
  },
};

export default meta;
type Story = StoryObj<InputComponent>;

// --- Default (Outlined) ---
export const Default: Story = {
  args: { label: 'Nome', placeholder: 'Introduza o seu nome', variant: 'outlined' },
  render: (args) => ({ props: args, template: `<iu-input [label]="label" [placeholder]="placeholder" [variant]="variant" />` }),
};

// --- Filled ---
export const Filled: Story = {
  args: { label: 'Email', placeholder: 'email@exemplo.com', variant: 'filled', type: 'email' },
  render: (args) => ({ props: args, template: `<iu-input [label]="label" [placeholder]="placeholder" [variant]="variant" [type]="type" />` }),
};

// --- Password ---
export const Password: Story = {
  args: { label: 'Password', placeholder: '••••••••', type: 'password', variant: 'outlined' },
  render: (args) => ({ props: args, template: `<iu-input [label]="label" [placeholder]="placeholder" [type]="type" [variant]="variant" />` }),
};

// --- With Prefix Icon ---
export const WithPrefixIcon: Story = {
  args: { label: 'Pesquisar', placeholder: 'Pesquisar imóveis...', prefixIcon: 'search', variant: 'outlined' },
  render: (args) => ({ props: args, template: `<iu-input [label]="label" [placeholder]="placeholder" [prefixIcon]="prefixIcon" [variant]="variant" />` }),
};

// --- With Hint ---
export const WithHint: Story = {
  args: { label: 'Telefone', placeholder: '+351 9XX XXX XXX', hint: 'Formato internacional', type: 'tel', variant: 'outlined' },
  render: (args) => ({ props: args, template: `<iu-input [label]="label" [placeholder]="placeholder" [hint]="hint" [type]="type" />` }),
};

// --- Error State ---
export const Error: Story = {
  args: { label: 'Email', placeholder: 'email@exemplo.com', errorMessage: 'Email inválido', type: 'email', variant: 'outlined' },
  render: (args) => ({ props: args, template: `<iu-input [label]="label" [placeholder]="placeholder" [errorMessage]="errorMessage" [type]="type" />` }),
};

// --- Disabled ---
export const Disabled: Story = {
  args: { label: 'Campo bloqueado', placeholder: 'Não editável', disabled: true, variant: 'outlined' },
  render: (args) => ({ props: args, template: `<iu-input [label]="label" [placeholder]="placeholder" [disabled]="disabled" />` }),
};

// --- Required ---
export const Required: Story = {
  args: { label: 'Campo obrigatório', placeholder: 'Preencha este campo', required: true, variant: 'outlined' },
  render: (args) => ({ props: args, template: `<iu-input [label]="label" [placeholder]="placeholder" [required]="required" />` }),
};

// --- All Variants ---
export const AllVariants: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 24px; width: 320px;">
        <iu-input label="Outlined" placeholder="Variante outlined" variant="outlined" />
        <iu-input label="Filled" placeholder="Variante filled" variant="filled" />
      </div>
    `,
  }),
};

// --- Playground ---
export const Playground: Story = {
  args: {
    label: 'Campo de teste',
    placeholder: 'Digite algo...',
    variant: 'outlined',
    type: 'text',
    hint: 'Texto de apoio',
    disabled: false,
    required: false,
    fullWidth: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div [style.width]="fullWidth ? '100%' : '320px'">
        <iu-input
          [label]="label"
          [placeholder]="placeholder"
          [variant]="variant"
          [type]="type"
          [hint]="hint"
          [disabled]="disabled"
          [required]="required"
          [fullWidth]="fullWidth"
        />
      </div>
    `,
  }),
};
