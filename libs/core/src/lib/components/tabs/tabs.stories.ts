import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TabsComponent } from './tabs.component';
import '../../material/material-web';

const meta: Meta<TabsComponent> = {
  title: 'Core/Tabs',
  component: TabsComponent,
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
      options: ['primary', 'secondary'],
      description: 'Tab variant (primary or secondary)',
    },
    activeTabIndex: {
      control: 'number',
      description: 'Index of the initially active tab',
    },
  },
};

export default meta;
type Story = StoryObj<TabsComponent>;

// --- Primary Tabs ---
export const PrimaryTabs: Story = {
  render: () => ({
    template: `
      <iu-tabs variant="primary" [activeTabIndex]="0">
        <md-primary-tab>Home</md-primary-tab>
        <md-primary-tab>Favoritos</md-primary-tab>
        <md-primary-tab>Explorar</md-primary-tab>
      </iu-tabs>
    `,
  }),
};

// --- Secondary Tabs ---
export const SecondaryTabs: Story = {
  render: () => ({
    template: `
      <iu-tabs variant="secondary" [activeTabIndex]="1">
        <md-secondary-tab>Visão geral</md-secondary-tab>
        <md-secondary-tab>Detalhes</md-secondary-tab>
        <md-secondary-tab>Avaliações</md-secondary-tab>
      </iu-tabs>
    `,
  }),
};

// --- With Icons ---
export const WithIcons: Story = {
  render: () => ({
    template: `
      <iu-tabs variant="primary" [activeTabIndex]="0">
        <md-primary-tab>
          <md-icon slot="icon">home</md-icon>
          Home
        </md-primary-tab>
        <md-primary-tab>
          <md-icon slot="icon">favorite</md-icon>
          Favoritos
        </md-primary-tab>
        <md-primary-tab>
          <md-icon slot="icon">explore</md-icon>
          Explorar
        </md-primary-tab>
      </iu-tabs>
    `,
  }),
};

// --- Scrollable (many tabs) ---
export const Scrollable: Story = {
  render: () => ({
    template: `
      <div style="max-width: 400px;">
        <iu-tabs variant="primary" [activeTabIndex]="0">
          <md-primary-tab>Tab 1</md-primary-tab>
          <md-primary-tab>Tab 2</md-primary-tab>
          <md-primary-tab>Tab 3</md-primary-tab>
          <md-primary-tab>Tab 4</md-primary-tab>
          <md-primary-tab>Tab 5</md-primary-tab>
          <md-primary-tab>Tab 6</md-primary-tab>
          <md-primary-tab>Tab 7</md-primary-tab>
          <md-primary-tab>Tab 8</md-primary-tab>
        </iu-tabs>
      </div>
    `,
  }),
};
