import type { Meta, StoryObj } from '@storybook/angular';
import { MyBookingsComponent } from './my-bookings.component';
import type { BookingRecord } from './my-bookings.component';

const SAMPLE: BookingRecord[] = [
  {
    id: 'b1',
    propertyTitle: 'Apartamento T2 renovado em Príncipe Real',
    propertyLocation: 'Príncipe Real, Lisboa',
    propertyImageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&auto=format&fit=crop',
    date: '15 Mar 2026',
    time: '14:30',
    status: 'confirmed',
    type: 'visit',
    priceMonthly: 1450,
  },
  {
    id: 'b2',
    propertyTitle: 'Penthouse com Terraço — Vista Tejo',
    propertyLocation: 'Mouraria, Lisboa',
    propertyImageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&auto=format&fit=crop',
    date: '18 Mar 2026',
    status: 'pending',
    type: 'inquiry',
    priceMonthly: 3200,
  },
  {
    id: 'b3',
    propertyTitle: 'Estúdio moderno — Metro Intendente',
    propertyLocation: 'Intendente, Lisboa',
    date: '5 Mar 2026',
    time: '10:00',
    status: 'completed',
    type: 'visit',
    priceMonthly: 750,
  },
  {
    id: 'b4',
    propertyTitle: 'Moradia T3 com jardim — Cascais',
    propertyLocation: 'Cascais, Lisboa',
    date: '1 Mar 2026',
    status: 'cancelled',
    type: 'inquiry',
    priceMonthly: 2800,
  },
];

const meta: Meta<MyBookingsComponent> = {
  title: 'LisboaRent/MyBookings',
  component: MyBookingsComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<MyBookingsComponent>;

export const Default: Story = {
  args: { bookings: SAMPLE },
};

export const OnlyVisits: Story = {
  args: {
    bookings: SAMPLE.filter(b => b.type === 'visit'),
  },
};

export const EmptyState: Story = {
  args: { bookings: [] },
};
