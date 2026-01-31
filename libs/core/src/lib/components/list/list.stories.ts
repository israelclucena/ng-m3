import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ListComponent } from './list.component';
import { ListItemComponent } from './list-item.component';
import '../../material/material-web';

const meta: Meta<ListComponent> = {
  title: 'Core/List',
  component: ListComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [ListItemComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }),
  ],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<ListComponent>;

// --- One Line ---
export const OneLine: Story = {
  render: () => ({
    template: `
      <div style="width: 360px;">
        <iu-list>
          <iu-list-item headline="Apartamento T2 Alfama"></iu-list-item>
          <iu-list-item headline="Moradia T3 Cascais"></iu-list-item>
          <iu-list-item headline="Estúdio T0 Chiado"></iu-list-item>
        </iu-list>
      </div>
    `,
  }),
};

// --- Two Line ---
export const TwoLine: Story = {
  render: () => ({
    template: `
      <div style="width: 360px;">
        <iu-list>
          <iu-list-item headline="Apartamento T2" supportingText="Alfama, Lisboa — 1.200€/mês"></iu-list-item>
          <iu-list-item headline="Moradia T3" supportingText="Cascais — 2.500€/mês"></iu-list-item>
          <iu-list-item headline="Estúdio T0" supportingText="Chiado, Lisboa — 900€/mês"></iu-list-item>
        </iu-list>
      </div>
    `,
  }),
};

// --- Three Line ---
export const ThreeLine: Story = {
  render: () => ({
    template: `
      <div style="width: 360px;">
        <iu-list>
          <iu-list-item headline="Apartamento T2"
            supportingText="Alfama, Lisboa — 1.200€/mês. Renovado recentemente com cozinha equipada e varanda.">
          </iu-list-item>
          <iu-list-item headline="Moradia T3"
            supportingText="Cascais — 2.500€/mês. Jardim privado, garagem para 2 carros, piscina partilhada.">
          </iu-list-item>
        </iu-list>
      </div>
    `,
  }),
};

// --- With Icons ---
export const WithIcons: Story = {
  render: () => ({
    template: `
      <div style="width: 360px;">
        <iu-list>
          <iu-list-item headline="Apartamento T2" supportingText="Alfama, Lisboa">
            <md-icon slot="start">apartment</md-icon>
            <md-icon slot="end">chevron_right</md-icon>
          </iu-list-item>
          <iu-list-item headline="Moradia T3" supportingText="Cascais">
            <md-icon slot="start">house</md-icon>
            <md-icon slot="end">chevron_right</md-icon>
          </iu-list-item>
          <iu-list-item headline="Estúdio T0" supportingText="Chiado, Lisboa">
            <md-icon slot="start">studio</md-icon>
            <md-icon slot="end">chevron_right</md-icon>
          </iu-list-item>
        </iu-list>
      </div>
    `,
  }),
};

// --- With Dividers ---
export const WithDividers: Story = {
  render: () => ({
    template: `
      <div style="width: 360px;">
        <iu-list>
          <iu-list-item headline="Favoritos" type="button">
            <md-icon slot="start">favorite</md-icon>
          </iu-list-item>
          <md-divider></md-divider>
          <iu-list-item headline="Recentes" type="button">
            <md-icon slot="start">schedule</md-icon>
          </iu-list-item>
          <md-divider></md-divider>
          <iu-list-item headline="Arquivados" type="button">
            <md-icon slot="start">archive</md-icon>
          </iu-list-item>
        </iu-list>
      </div>
    `,
  }),
};

// --- Interactive ---
export const Interactive: Story = {
  render: () => ({
    template: `
      <div style="width: 360px;">
        <iu-list>
          <iu-list-item headline="Clicável" supportingText="type=button" type="button">
            <md-icon slot="start">touch_app</md-icon>
          </iu-list-item>
          <iu-list-item headline="Link" supportingText="type=link" type="link">
            <md-icon slot="start">link</md-icon>
          </iu-list-item>
          <iu-list-item headline="Texto estático" supportingText="type=text (default)" type="text">
            <md-icon slot="start">text_fields</md-icon>
          </iu-list-item>
          <iu-list-item headline="Desativado" supportingText="disabled=true" [disabled]="true" type="button">
            <md-icon slot="start">block</md-icon>
          </iu-list-item>
        </iu-list>
      </div>
    `,
  }),
};
