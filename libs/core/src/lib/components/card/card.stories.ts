import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CardComponent } from './card.component';
import { ButtonComponent } from '../button/button.component';
import '../../material/material-web';

const meta: Meta<CardComponent> = {
  title: 'Core/Card',
  component: CardComponent,
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
      options: ['elevated', 'filled', 'outlined'],
      description: 'Variante visual M3',
    },
    title:     { control: 'text' },
    subtitle:  { control: 'text' },
    avatar:    { control: 'text', description: 'Material icon name' },
    clickable: { control: 'boolean' },
    disabled:  { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    kind: {
      control: 'select',
      options: ['plain', 'action', 'profile', 'stat'],
      description: 'Forma semântica do card (Onda 9 / CARD_V2)',
    },
    loading:    { control: 'boolean', description: 'Skeleton + aria-busy' },
    empty:      { control: 'boolean', description: 'Mostra o slot [slot="empty"]' },
    selectable: { control: 'boolean', description: 'Toggle button com aria-pressed' },
    selected:   { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<CardComponent>;

// --- Elevated (default) ---
export const Elevated: Story = {
  args: { variant: 'elevated', title: 'Apartamento T2 — Alfama', subtitle: 'Lisboa · 1200€/mês' },
  render: (args) => ({
    props: args,
    template: `
      <iu-card [variant]="variant" [title]="title" [subtitle]="subtitle" style="width:320px">
        Espaçoso apartamento no coração de Alfama com vista para o Tejo.
        2 quartos, 1 casa de banho, varanda.
      </iu-card>
    `,
  }),
};

// --- Filled ---
export const Filled: Story = {
  args: { variant: 'filled', title: 'Moradia T3 — Cascais', subtitle: 'Cascais · 2800€/mês' },
  render: (args) => ({
    props: args,
    template: `
      <iu-card [variant]="variant" [title]="title" [subtitle]="subtitle" style="width:320px">
        Moradia com jardim privado e garagem dupla. Perto da praia e comércio local.
      </iu-card>
    `,
  }),
};

// --- Outlined ---
export const Outlined: Story = {
  args: { variant: 'outlined', title: 'Studio — Chiado', subtitle: 'Lisboa · 950€/mês' },
  render: (args) => ({
    props: args,
    template: `
      <iu-card [variant]="variant" [title]="title" [subtitle]="subtitle" style="width:320px">
        Studio moderno completamente equipado no Chiado. Ideal para profissionais.
      </iu-card>
    `,
  }),
};

// --- With Avatar Icon ---
export const WithAvatar: Story = {
  args: { variant: 'elevated', title: 'T1 — Benfica', subtitle: '780€/mês', avatar: 'apartment' },
  render: (args) => ({
    props: args,
    template: `
      <iu-card [variant]="variant" [title]="title" [subtitle]="subtitle" [avatar]="avatar" style="width:320px">
        Apartamento T1 recentemente renovado. Boa localização, perto do metro.
      </iu-card>
    `,
  }),
};

// --- With Footer Actions ---
export const WithFooter: Story = {
  args: { variant: 'elevated', title: 'T2 — Parque das Nações', subtitle: '1400€/mês' },
  render: (args) => ({
    moduleMetadata: { imports: [ButtonComponent] },
    props: args,
    template: `
      <iu-card [variant]="variant" [title]="title" [subtitle]="subtitle" style="width:320px">
        Moderno apartamento T2 com vista para o rio. Condomínio com piscina e ginásio.
        <div slot="footer">
          <iu-button variant="ghost" size="sm" label="Guardar"></iu-button>
          <iu-button variant="primary" size="sm" label="Ver detalhes"></iu-button>
        </div>
      </iu-card>
    `,
  }),
};

// --- Clickable ---
export const Clickable: Story = {
  args: { variant: 'elevated', title: 'T3 — Sintra', subtitle: '1650€/mês', clickable: true },
  render: (args) => ({
    props: args,
    template: `
      <iu-card [variant]="variant" [title]="title" [subtitle]="subtitle" [clickable]="clickable" style="width:320px">
        Clica no card para navegar. Moradia em Sintra com jardim e piscina privada.
      </iu-card>
    `,
  }),
};

// --- All Variants ---
export const AllVariants: Story = {
  render: () => ({
    template: `
      <div style="display:flex; gap: 16px; flex-wrap:wrap; align-items:flex-start">
        <iu-card variant="elevated" title="Elevated" subtitle="Sombra suave" style="width:220px">
          Conteúdo do card elevated.
        </iu-card>
        <iu-card variant="filled" title="Filled" subtitle="Fundo preenchido" style="width:220px">
          Conteúdo do card filled.
        </iu-card>
        <iu-card variant="outlined" title="Outlined" subtitle="Borda visível" style="width:220px">
          Conteúdo do card outlined.
        </iu-card>
      </div>
    `,
  }),
};

// --- LisboaRent Real Card ---
export const LisboaRentCard: Story = {
  render: () => ({
    moduleMetadata: { imports: [ButtonComponent] },
    template: `
      <iu-card variant="elevated" title="Apartamento T2 — Alfama" subtitle="Lisboa · 1 200€/mês" avatar="apartment" style="width:320px">
        <p>Espaçoso T2 no coração de Alfama. Vista para o Tejo, varanda, totalmente equipado.</p>
        <div slot="footer">
          <iu-button variant="ghost" size="sm" label="❤️ Guardar"></iu-button>
          <iu-button variant="primary" size="sm" label="Ver anúncio"></iu-button>
        </div>
      </iu-card>
    `,
  }),
};

// --- Playground ---
export const Playground: Story = {
  args: {
    variant:   'elevated',
    title:     'Título do card',
    subtitle:  'Subtítulo descritivo',
    avatar:    'home',
    clickable: false,
    disabled:  false,
    fullWidth: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <iu-card
        [variant]="variant"
        [title]="title"
        [subtitle]="subtitle"
        [avatar]="avatar"
        [clickable]="clickable"
        [disabled]="disabled"
        [fullWidth]="fullWidth"
        style="width:320px"
      >
        Conteúdo do card. Substitui por texto ou componentes filhos.
      </iu-card>
    `,
  }),
};

// ==========================================
// Onda 9 — CARD_V2: estados reais
// ==========================================

// --- Loading (skeleton) ---
export const Loading: Story = {
  args: { variant: 'elevated', loading: true, title: 'Apartamento T2 — Alfama' },
  render: (args) => ({
    props: args,
    template: `
      <iu-card [variant]="variant" [title]="title" [loading]="loading" style="width:320px">
        Este conteúdo só aparece quando o loading termina.
      </iu-card>
    `,
  }),
};

// --- Empty ---
export const Empty: Story = {
  args: { variant: 'outlined', empty: true, title: 'Portfolio' },
  render: (args) => ({
    props: args,
    template: `
      <iu-card [variant]="variant" [title]="title" [empty]="empty" style="width:320px">
        <div slot="empty">
          <span class="material-symbols-outlined" aria-hidden="true">home_work</span>
          <span>Ainda não adicionaste imóveis.</span>
        </div>
        Conteúdo escondido enquanto o card está vazio.
      </iu-card>
    `,
  }),
};

// --- Selectable (toggle com aria-pressed) ---
export const Selectable: Story = {
  args: { variant: 'filled', selectable: true, selected: false, title: 'Moradia T3 — Cascais', subtitle: 'Clica ou usa Enter/Space' },
  render: (args) => ({
    props: args,
    template: `
      <iu-card [variant]="variant" [title]="title" [subtitle]="subtitle"
               [selectable]="selectable" [(selected)]="selected" style="width:320px">
        Cartão selecionável — o estado sai em selectedChange.
      </iu-card>
    `,
  }),
};

// --- Kinds (plain | action | profile | stat) ---
export const Kinds: Story = {
  render: () => ({
    template: `
      <div style="display:flex; gap:16px; flex-wrap:wrap; align-items:flex-start">
        <iu-card kind="plain" variant="outlined" title="Plain" style="width:220px">Card comum.</iu-card>
        <iu-card kind="action" variant="elevated" title="Action" subtitle="Com footer" style="width:220px">
          Confirma a renovação do contrato.
          <div slot="footer"><iu-button variant="text" label="Adiar" /><iu-button variant="filled" label="Renovar" /></div>
        </iu-card>
        <iu-card kind="profile" variant="filled" avatar="person" title="Israel" subtitle="Landlord" style="width:220px">
          12 imóveis geridos.
        </iu-card>
        <iu-card kind="stat" variant="outlined" title="Yield bruto" style="width:220px">6,4%</iu-card>
      </div>
    `,
  }),
};
