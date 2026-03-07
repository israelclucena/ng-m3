import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { PropertyDetailComponent, PropertyDetail } from './property-detail.component';

// ─── Sample Data ──────────────────────────────────────────────────────────────

const FULL_PROPERTY: PropertyDetail = {
  id: 'p1',
  title: 'Apartamento T2 renovado — Príncipe Real',
  location: 'Príncipe Real, Lisboa',
  priceMonthly: 1450,
  bedrooms: 2,
  bathrooms: 1,
  areaSqm: 78,
  type: 'apartment',
  imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop',
  images: [
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1556912167-f556f1f39faa?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&auto=format&fit=crop',
  ],
  badges: ['available', 'verified'],
  availableFrom: '1 Abr 2026',
  description: 'Apartamento T2 completamente renovado no coração de Lisboa, a dois passos do Jardim do Príncipe Real. Cozinha equipada, pavimento em madeira, tectos altos e muita luminosidade natural. Ideal para jovens profissionais ou casal. Edifício histórico com condomínio bem gerido.',
  features: [
    'Ar condicionado',
    'Cozinha equipada',
    'Máquina de lavar',
    'Internet incluída',
    'Arrecadação',
    'Vidros duplos',
    'Aquecimento central',
    'Porteiro',
  ],
  contactPhone: '+351 910 000 001',
  contactEmail: 'proprietario@lisboarent.pt',
  floor: 3,
  elevator: true,
  petsAllowed: false,
  furnished: true,
  yearBuilt: 1935,
  energyRating: 'C',
  condoFee: 120,
};

const PENTHOUSE: PropertyDetail = {
  id: 'p2',
  title: 'Penthouse com Terraço — Vista Tejo',
  location: 'Mouraria, Lisboa',
  priceMonthly: 3200,
  bedrooms: 3,
  bathrooms: 2,
  areaSqm: 142,
  type: 'penthouse',
  imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop',
  images: [
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1560185127-6a4ae3e4b02a?w=800&auto=format&fit=crop',
  ],
  badges: ['featured', 'new'],
  availableFrom: '15 Mar 2026',
  description: 'Penthouse exclusivo com terraço privativo de 80m² e vistas panorâmicas sobre o Tejo e a Mouraria. Acabamentos de luxo, piscina partilhada no terraço do edifício, concierge 24h. A propriedade mais premium da Lisboa histórica.',
  features: [
    'Terraço privativo 80m²',
    'Piscina partilhada',
    'Concierge 24h',
    'Estacionamento',
    'Ar condicionado',
    'Smart home',
    'Jacuzzi',
    'Ginásio no edifício',
  ],
  contactPhone: '+351 920 000 002',
  contactEmail: 'luxury@lisboarent.pt',
  floor: 8,
  elevator: true,
  petsAllowed: true,
  furnished: true,
  yearBuilt: 2018,
  energyRating: 'A',
  condoFee: 450,
};

const MINIMAL: PropertyDetail = {
  id: 'p3',
  title: 'Estúdio moderno — Metro Intendente',
  location: 'Intendente, Lisboa',
  priceMonthly: 750,
  bedrooms: 0,
  bathrooms: 1,
  areaSqm: 35,
  type: 'studio',
  badges: ['new'],
  availableFrom: '1 Mar 2026',
};

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<PropertyDetailComponent> = {
  title: 'LisboaRent/PropertyDetail',
  component: PropertyDetailComponent,
  decorators: [
    applicationConfig({ providers: [provideAnimations()] }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**PropertyDetail** — Full detail view for LisboaRent property listings.

- Image gallery with prev/next navigation and thumbnail strip
- Key specs bar (beds, baths, area, floor, energy rating)
- Description + amenities grid
- Property info table (furnished, pets, elevator, year, condo fee)
- Map placeholder
- Sticky contact sidebar (CTA + share buttons)
- M3 design tokens throughout

**Feature flag:** \`PROPERTY_DETAIL_VIEW\`
        `,
      },
    },
  },
  argTypes: {
    property: { control: 'object', description: 'PropertyDetail data (superset of PropertyData)' },
    closed: { action: 'closed' },
    contactClick: { action: 'contactClick' },
    scheduleClick: { action: 'scheduleClick' },
    favouriteToggle: { action: 'favouriteToggle' },
    shareClick: { action: 'shareClick' },
  },
};

export default meta;
type Story = StoryObj<PropertyDetailComponent>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/** Full-featured T2 apartment with gallery, amenities, and contact details */
export const Default: Story = {
  args: { property: FULL_PROPERTY },
};

/** Luxury penthouse with energy A rating, pets allowed, and gym */
export const Penthouse: Story = {
  args: { property: PENTHOUSE },
};

/** Minimal studio with no image, no extras — tests graceful degradation */
export const MinimalStudio: Story = {
  args: { property: MINIMAL },
  parameters: {
    docs: {
      description: {
        story: 'Minimal data — no image, no description, no extras. Tests graceful fallback rendering.',
      },
    },
  },
};
