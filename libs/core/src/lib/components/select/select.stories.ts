import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SelectComponent } from './select.component';
import '../../material/material-web';

const meta: Meta<SelectComponent> = {
  title: 'Core/Select',
  component: SelectComponent,
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
      options: ['outlined', 'filled'],
      description: 'M3 select variant',
    },
    label: {
      control: 'text',
      description: 'Label text',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    required: {
      control: 'boolean',
      description: 'Required field',
    },
    errorText: {
      control: 'text',
      description: 'Error message text',
    },
    supportingText: {
      control: 'text',
      description: 'Supporting helper text',
    },
  },
};

export default meta;
type Story = StoryObj<SelectComponent>;

// --- Outlined (default) ---
export const Outlined: Story = {
  render: () => ({
    template: `
      <iu-select variant="outlined" label="País">
        <md-select-option value="pt"><div slot="headline">Portugal</div></md-select-option>
        <md-select-option value="br"><div slot="headline">Brasil</div></md-select-option>
        <md-select-option value="es"><div slot="headline">Espanha</div></md-select-option>
      </iu-select>
    `,
  }),
};

// --- Filled ---
export const Filled: Story = {
  render: () => ({
    template: `
      <iu-select variant="filled" label="País">
        <md-select-option value="pt"><div slot="headline">Portugal</div></md-select-option>
        <md-select-option value="br"><div slot="headline">Brasil</div></md-select-option>
        <md-select-option value="es"><div slot="headline">Espanha</div></md-select-option>
      </iu-select>
    `,
  }),
};

// --- With Options ---
export const WithOptions: Story = {
  render: () => ({
    template: `
      <iu-select variant="outlined" label="Tipologia">
        <md-select-option value="t0"><div slot="headline">T0</div></md-select-option>
        <md-select-option value="t1"><div slot="headline">T1</div></md-select-option>
        <md-select-option value="t2"><div slot="headline">T2</div></md-select-option>
        <md-select-option value="t3"><div slot="headline">T3</div></md-select-option>
        <md-select-option value="t4"><div slot="headline">T4+</div></md-select-option>
      </iu-select>
    `,
  }),
};

// --- Disabled ---
export const Disabled: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px;">
        <iu-select variant="outlined" label="Outlined" [disabled]="true">
          <md-select-option value="a"><div slot="headline">Opção A</div></md-select-option>
        </iu-select>
        <iu-select variant="filled" label="Filled" [disabled]="true">
          <md-select-option value="a"><div slot="headline">Opção A</div></md-select-option>
        </iu-select>
      </div>
    `,
  }),
};

// --- Error ---
export const Error: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px;">
        <iu-select variant="outlined" label="País" errorText="Campo obrigatório">
          <md-select-option value="pt"><div slot="headline">Portugal</div></md-select-option>
        </iu-select>
        <iu-select variant="filled" label="País" errorText="Selecione uma opção">
          <md-select-option value="pt"><div slot="headline">Portugal</div></md-select-option>
        </iu-select>
      </div>
    `,
  }),
};

// --- Required ---
export const Required: Story = {
  render: () => ({
    template: `
      <iu-select variant="outlined" label="País *" [required]="true" supportingText="Campo obrigatório">
        <md-select-option value="pt"><div slot="headline">Portugal</div></md-select-option>
        <md-select-option value="br"><div slot="headline">Brasil</div></md-select-option>
      </iu-select>
    `,
  }),
};
