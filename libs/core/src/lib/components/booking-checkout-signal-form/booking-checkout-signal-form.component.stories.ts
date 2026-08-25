import type { Meta, StoryObj } from '@storybook/angular';
import { BookingCheckoutSignalFormComponent } from './booking-checkout-signal-form.component';

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
  bedrooms: 2,
  bathrooms: 1,
  areaSqm: 75,
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

const meta: Meta<BookingCheckoutSignalFormComponent> = {
  title: 'Sprint 066/BookingCheckoutSignalForm',
  component: BookingCheckoutSignalFormComponent,
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
**BookingCheckoutSignalFormComponent** — the Signal Forms twin of \`BookingCheckoutComponent\`,
and the **seventh and final** migration off the bespoke \`createSignalForm\` util onto Angular 22's
official \`@angular/forms/signals\` \`form()\`.

Steps: **Review** → **Payment** → **Confirmation** — advance to Payment to see the migrated form
(look for the \`form()\` badge in the header).

- Identical review/payment/confirmation state machine, styles, inputs and outputs as the bespoke twin
- **Only** the Payment step's form engine differs: \`createSignalForm({…})\` → \`form(model, schema)\`
- Card number/expiry keep explicit \`[value]\`/\`(input)\` bindings (they format on keystroke), so the
  native \`maxlength\` attrs never collide with \`[formField]\` (no NG8022)
- Method-scoped submit validation: card path validates 4 card fields, mbway path validates only the phone
- Emits \`checkoutComplete\` on success, \`cancelled\` on cancel

Feature flag: \`BOOKING_CHECKOUT_SIGNAL_FORM\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<BookingCheckoutSignalFormComponent>;

// ── Default: review step ──────────────────────────────────────────────────────

/**
 * Default — opens on the Review step, 7-night stay.
 * Click "Continuar para Pagamento" to reach the migrated `form()` payment step.
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
      priceMonthly: 3200,
      bedrooms:   3,
      bathrooms:  2,
      areaSqm:    120,
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
