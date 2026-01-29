import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MenuComponent } from './menu.component';
import { ButtonComponent } from '../button/button.component';
import '../../material/material-web';

const meta: Meta<MenuComponent> = {
  title: 'Core/Menu',
  component: MenuComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [ButtonComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }),
  ],
  parameters: {
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the menu is open',
    },
    anchor: {
      control: 'text',
      description: 'ID of the anchor element',
    },
    positioning: {
      control: 'select',
      options: ['absolute', 'fixed', 'popover'],
      description: 'Positioning strategy',
    },
  },
};

export default meta;
type Story = StoryObj<MenuComponent>;

// --- Basic ---
export const Basic: Story = {
  render: () => ({
    template: `
      <div style="position: relative;">
        <iu-button id="basic-anchor" variant="outlined" label="Abrir Menu"
          (clicked)="open = !open"></iu-button>
        <iu-menu [open]="open" anchor="basic-anchor" (closed)="open = false">
          <md-menu-item><div slot="headline">Editar</div></md-menu-item>
          <md-menu-item><div slot="headline">Duplicar</div></md-menu-item>
          <md-menu-item><div slot="headline">Eliminar</div></md-menu-item>
        </iu-menu>
      </div>
    `,
    props: { open: false },
  }),
};

// --- With Icons ---
export const WithIcons: Story = {
  render: () => ({
    template: `
      <div style="position: relative;">
        <iu-button id="icons-anchor" variant="outlined" label="Menu com Ícones"
          (clicked)="open = !open"></iu-button>
        <iu-menu [open]="open" anchor="icons-anchor" (closed)="open = false">
          <md-menu-item>
            <md-icon slot="start">edit</md-icon>
            <div slot="headline">Editar</div>
          </md-menu-item>
          <md-menu-item>
            <md-icon slot="start">content_copy</md-icon>
            <div slot="headline">Duplicar</div>
          </md-menu-item>
          <md-menu-item>
            <md-icon slot="start">delete</md-icon>
            <div slot="headline">Eliminar</div>
          </md-menu-item>
        </iu-menu>
      </div>
    `,
    props: { open: false },
  }),
};

// --- With Dividers ---
export const WithDividers: Story = {
  render: () => ({
    template: `
      <div style="position: relative;">
        <iu-button id="dividers-anchor" variant="outlined" label="Menu com Divisores"
          (clicked)="open = !open"></iu-button>
        <iu-menu [open]="open" anchor="dividers-anchor" (closed)="open = false">
          <md-menu-item>
            <md-icon slot="start">edit</md-icon>
            <div slot="headline">Editar</div>
          </md-menu-item>
          <md-menu-item>
            <md-icon slot="start">content_copy</md-icon>
            <div slot="headline">Duplicar</div>
          </md-menu-item>
          <md-divider></md-divider>
          <md-menu-item>
            <md-icon slot="start">delete</md-icon>
            <div slot="headline">Eliminar</div>
          </md-menu-item>
        </iu-menu>
      </div>
    `,
    props: { open: false },
  }),
};

// --- SubMenu ---
export const SubMenu: Story = {
  render: () => ({
    template: `
      <div style="position: relative;">
        <iu-button id="sub-anchor" variant="outlined" label="Menu com SubMenu"
          (clicked)="open = !open"></iu-button>
        <iu-menu [open]="open" anchor="sub-anchor" (closed)="open = false">
          <md-menu-item><div slot="headline">Ficheiro</div></md-menu-item>
          <md-sub-menu>
            <md-menu-item slot="item"><div slot="headline">Exportar</div></md-menu-item>
            <md-menu slot="menu">
              <md-menu-item><div slot="headline">PDF</div></md-menu-item>
              <md-menu-item><div slot="headline">CSV</div></md-menu-item>
              <md-menu-item><div slot="headline">Excel</div></md-menu-item>
            </md-menu>
          </md-sub-menu>
          <md-divider></md-divider>
          <md-menu-item><div slot="headline">Fechar</div></md-menu-item>
        </iu-menu>
      </div>
    `,
    props: { open: false },
  }),
};

// --- Positioning ---
export const Positioning: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 24px;">
        <div style="position: relative;">
          <iu-button id="abs-anchor" variant="outlined" label="Absolute"
            (clicked)="openAbs = !openAbs"></iu-button>
          <iu-menu [open]="openAbs" anchor="abs-anchor" positioning="absolute" (closed)="openAbs = false">
            <md-menu-item><div slot="headline">Item A</div></md-menu-item>
            <md-menu-item><div slot="headline">Item B</div></md-menu-item>
          </iu-menu>
        </div>
        <div style="position: relative;">
          <iu-button id="fixed-anchor" variant="outlined" label="Fixed"
            (clicked)="openFixed = !openFixed"></iu-button>
          <iu-menu [open]="openFixed" anchor="fixed-anchor" positioning="fixed" (closed)="openFixed = false">
            <md-menu-item><div slot="headline">Item A</div></md-menu-item>
            <md-menu-item><div slot="headline">Item B</div></md-menu-item>
          </iu-menu>
        </div>
      </div>
    `,
    props: { openAbs: false, openFixed: false },
  }),
};
