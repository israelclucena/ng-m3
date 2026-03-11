import type { Meta, StoryObj } from '@storybook/angular';
import { ManageListingsComponent } from './manage-listings.component';
import type { LandlordListing } from './manage-listings.component';

const LISTINGS: LandlordListing[] = [
  {
    id: 'l1',
    title: 'Apartamento T2 renovado em Príncipe Real',
    location: 'Príncipe Real, Lisboa',
    priceMonthly: 1450,
    bedrooms: 2,
    bathrooms: 1,
    areaSqm: 78,
    type: 'apartment',
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&auto=format&fit=crop',
    badges: ['available'],
    availableFrom: '1 Abr 2026',
    status: 'active',
    inquiries: 7,
    visits: 3,
    listedDate: '15 Fev 2026',
  },
  {
    id: 'l2',
    title: 'Penthouse com Terraço — Vista Tejo',
    location: 'Mouraria, Lisboa',
    priceMonthly: 3200,
    bedrooms: 3,
    bathrooms: 2,
    areaSqm: 142,
    type: 'penthouse',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&auto=format&fit=crop',
    badges: ['featured'],
    availableFrom: '1 Mar 2026',
    status: 'rented',
    inquiries: 24,
    visits: 9,
    listedDate: '1 Jan 2026',
  },
  {
    id: 'l3',
    title: 'Estúdio moderno — Metro Intendente',
    location: 'Intendente, Lisboa',
    priceMonthly: 750,
    bedrooms: 0,
    bathrooms: 1,
    areaSqm: 35,
    type: 'studio',
    badges: [],
    availableFrom: '1 Mar 2026',
    status: 'paused',
    inquiries: 2,
    visits: 1,
    listedDate: '20 Fev 2026',
  },
  {
    id: 'l4',
    title: 'Moradia T3 com jardim em Cascais',
    location: 'Cascais, Lisboa',
    priceMonthly: 2800,
    bedrooms: 3,
    bathrooms: 2,
    areaSqm: 180,
    type: 'house',
    badges: [],
    availableFrom: '15 Abr 2026',
    status: 'draft',
    inquiries: 0,
    visits: 0,
    listedDate: '10 Mar 2026',
  },
];

const meta: Meta<ManageListingsComponent> = {
  title: 'LisboaRent/ManageListings',
  component: ManageListingsComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<ManageListingsComponent>;

export const Default: Story = {
  args: { listings: LISTINGS },
};

export const ActiveOnly: Story = {
  args: { listings: LISTINGS.filter(l => l.status === 'active') },
};

export const EmptyState: Story = {
  args: { listings: [] },
};
