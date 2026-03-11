import type { Meta, StoryObj } from '@storybook/angular';
import { MyFavouritesComponent } from './my-favourites.component';
import type { PropertyData } from '../property-card/property-card.component';

const PROPS: PropertyData[] = [
  {
    id: 's1',
    title: 'Apartamento T2 renovado em Príncipe Real',
    location: 'Príncipe Real, Lisboa',
    priceMonthly: 1450,
    bedrooms: 2,
    bathrooms: 1,
    areaSqm: 78,
    type: 'apartment',
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop',
    badges: ['available', 'verified'],
    availableFrom: '1 Abr 2026',
  },
  {
    id: 's2',
    title: 'Penthouse com Terraço — Vista Tejo',
    location: 'Mouraria, Lisboa',
    priceMonthly: 3200,
    bedrooms: 3,
    bathrooms: 2,
    areaSqm: 142,
    type: 'penthouse',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop',
    badges: ['featured'],
    availableFrom: '15 Mar 2026',
  },
  {
    id: 's3',
    title: 'Estúdio moderno — Metro Intendente',
    location: 'Intendente, Lisboa',
    priceMonthly: 750,
    bedrooms: 0,
    bathrooms: 1,
    areaSqm: 35,
    type: 'studio',
    badges: ['new'],
    availableFrom: '1 Mar 2026',
  },
];

const meta: Meta<MyFavouritesComponent> = {
  title: 'LisboaRent/MyFavourites',
  component: MyFavouritesComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<MyFavouritesComponent>;

export const Default: Story = {
  args: { properties: PROPS },
};

export const SingleItem: Story = {
  args: { properties: [PROPS[0]] },
};

export const EmptyState: Story = {
  args: { properties: [] },
};
