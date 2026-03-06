import type { Meta, StoryObj } from '@storybook/angular';
import { Component } from '@angular/core';
import { PropertyCardComponent, PropertyData } from '@israel-ui/core';

// ─── Sample Properties ────────────────────────────────────────────
const SAMPLE_AVAILABLE: PropertyData = {
  id: '1',
  title: 'Apartamento T2 em Príncipe Real',
  location: 'Príncipe Real, Lisboa',
  priceMonthly: 1450,
  bedrooms: 2,
  bathrooms: 1,
  areaSqm: 78,
  type: 'apartment',
  imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop',
  badges: ['available', 'verified'],
  isFavourited: false,
  availableFrom: '1 Abr 2026',
};

const SAMPLE_FEATURED: PropertyData = {
  id: '2',
  title: 'Penthouse com Terraço — Vista Tejo',
  location: 'Mouraria, Lisboa',
  priceMonthly: 3200,
  bedrooms: 3,
  bathrooms: 2,
  areaSqm: 142,
  type: 'penthouse',
  imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop',
  badges: ['featured', 'new'],
  isFavourited: true,
  availableFrom: '15 Mar 2026',
};

const SAMPLE_STUDIO: PropertyData = {
  id: '3',
  title: 'Estúdio moderno perto do metro',
  location: 'Intendente, Lisboa',
  priceMonthly: 750,
  bedrooms: 0,
  bathrooms: 1,
  areaSqm: 35,
  type: 'studio',
  badges: ['new'],
  isFavourited: false,
};

// ─── Grid wrapper for multi-card story ───────────────────────────
@Component({
  selector: 'story-property-grid',
  standalone: true,
  imports: [PropertyCardComponent],
  template: `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;padding:16px;max-width:1000px">
      <iu-property-card [property]="p1" />
      <iu-property-card [property]="p2" />
      <iu-property-card [property]="p3" />
    </div>
  `,
})
class PropertyGridWrapper {
  p1 = SAMPLE_AVAILABLE;
  p2 = SAMPLE_FEATURED;
  p3 = SAMPLE_STUDIO;
}

// ─── Meta ─────────────────────────────────────────────────────────
const meta: Meta<PropertyCardComponent> = {
  title: 'Sprint 010/PropertyCard',
  component: PropertyCardComponent,
  tags: ['autodocs'],
  argTypes: {
    property: { control: 'object' },
  },
  args: {
    property: SAMPLE_AVAILABLE,
  },
  decorators: [],
};

export default meta;
type Story = StoryObj<PropertyCardComponent>;

/**
 * Default — Standard available apartment listing with badges and specs.
 */
export const Default: Story = {
  args: {
    property: SAMPLE_AVAILABLE,
  },
  render: (args) => ({
    props: args,
    template: `<div style="max-width:340px"><iu-property-card [property]="property" /></div>`,
  }),
};

/**
 * Featured — Penthouse with featured/new badges and pre-set favourite state.
 */
export const Featured: Story = {
  args: {
    property: SAMPLE_FEATURED,
  },
  render: (args) => ({
    props: args,
    template: `<div style="max-width:340px"><iu-property-card [property]="property" /></div>`,
  }),
};

/**
 * Grid — Three cards in a responsive grid (as seen in the real listing page).
 */
export const PropertyGrid: Story = {
  render: () => ({
    component: PropertyGridWrapper,
    props: {},
  }),
};
