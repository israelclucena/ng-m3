import type { Meta, StoryObj } from '@storybook/angular';
import { BookingCheckoutComponent } from './booking-checkout.component';

// ── Mock data ─────────────────────────────────────────────────────────────────

const addDays = (d: Date, n: number): Date => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

const today = new Date();

const mockProperty = {
  id: 'prop-lisbon-001',
  title: 'Apartamento T2 — Príncipe Real',
  location: 'Príncipe Real, Lisboa',
  priceMonthly: 1650,
  beds: 2,
  baths: 1,
  area: 75,
  imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80',
  type: 'apartment' as const,
  available: true,
};

const mockRange = {
  start: addDays(today, 7),
  end: addDays(today, 14),
};

const mockShortRange = {
  start: addDays(today, 3),
  end: addDays(today, 5),
};

// ── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<BookingCheckoutComponent> = {
  title: 'Sprint 028/BookingCheckout',
  component: BookingCheckoutComponent,
  tags: ['autodocs'],
  argTypes: {
    landlordName:  { control: 'text' },
    landlordPhone: { control: 'text' },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
**BookingCheckoutComponent** — multi-step checkout flow for LisboaRent bookings.

Steps: **Review** → **Payment** → **Confirmation**

- Driven entirely by Angular Signals (no RxJS, no Reactive Forms)
- Uses \`createSignalForm()\` for inline payment validation
- Supports card, MB WAY, and bank transfer
- Emits \`checkoutComplete\` on success, \`cancelled\` on cancel

Feature flag: \`BOOKING_CONFIRMATION_FLOW\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<BookingCheckoutComponent>;

// ── Default: review step ──────────────────────────────────────────────────────

/**
 * Default — opens on the Review step, 7-night stay.
 * Click "Continuar para Pagamento" to advance.
 */
export const Default: Story = {
  args: {
    property:      mockProperty,
    selectedRange: mockRange,
    landlordName:  'Ana Ferreira',
    landlordPhone: '+351 912 345 678',
  },
};

// ── Short stay (2 nights) ─────────────────────────────────────────────────────

/**
 * ShortStay — 2-night weekend stay. Demonstrates compact price breakdown
 * with a lower total.
 */
export const ShortStay: Story = {
  args: {
    property:      mockProperty,
    selectedRange: mockShortRange,
    landlordName:  'João Silva',
  },
};

// ── Premium property ──────────────────────────────────────────────────────────

/**
 * PremiumProperty — higher nightly rate, showcasing the breakdown with
 * a larger deposit and cleaning fee.
 */
export const PremiumProperty: Story = {
  args: {
    property: {
      ...mockProperty,
      id:         'prop-lisbon-premium',
      title:      'Penthouse T3 — Chiado',
      location:   'Chiado, Lisboa',
      price:      3200,
      beds:       3,
      baths:      2,
      area:       120,
      imageUrl:   'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80',
    },
    selectedRange: {
      start: addDays(today, 10),
      end:   addDays(today, 17),
    },
    landlordName:  'Sofia Mendes',
    landlordPhone: '+351 963 456 789',
  },
};
