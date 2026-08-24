import type { Meta, StoryObj } from '@storybook/angular';
import { PropertyBookingSignalFormComponent } from '@israel-ui/core';

const SAMPLE_PROPERTY = {
  id: '1',
  title: 'Apartamento T2 no Príncipe Real',
  location: 'Príncipe Real, Lisboa',
  priceMonthly: 1450,
  bedrooms: 2,
  bathrooms: 1,
  areaSqm: 78,
  type: 'apartment' as const,
  available: true,
  imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80',
  contactEmail: 'proprietario@lisboarent.pt',
};

const meta: Meta<PropertyBookingSignalFormComponent> = {
  title: 'LisboaRent/PropertyBookingSignalForm',
  component: PropertyBookingSignalFormComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**PropertyBookingSignalForm** — the booking/inquiry panel rebuilt on Angular 22’s official ' +
          'Signal Forms API (`@angular/forms/signals` `form()` + declarative schema), a faithful ' +
          'side-by-side twin of `PropertyBooking` (identical markup/styles/input/outputs; only the form ' +
          'engine differs). Proves the two-mode conditional form the earlier twins sidestepped: a visit/inquiry ' +
          'tab swaps which optional fields render and calls `f().reset()` on switch. All controls bind via ' +
          '`[formField]` (text/email, `<select>` slot, `<input type="date">`, 500-char `<textarea>`). A parity ' +
          'spec asserts both twins emit a byte-identical `BookingSubmitEvent.form`. Feature flag: ' +
          '`PROPERTY_BOOKING_SIGNAL_FORM`.',
      },
    },
  },
  argTypes: {
    property: { control: 'object' },
  },
};

export default meta;
type Story = StoryObj<PropertyBookingSignalFormComponent>;

/** Default — visit scheduling tab (initial state). */
export const Default: Story = {
  args: {
    property: SAMPLE_PROPERTY,
  },
};

/** InquiryMode — starts on the "Enviar Mensagem" tab (reset-on-switch clears the form). */
export const InquiryMode: Story = {
  name: 'Inquiry Mode',
  args: {
    property: {
      ...SAMPLE_PROPERTY,
      id: '2',
      title: 'Moradia T3 com jardim em Cascais',
      location: 'Cascais, Lisboa',
      priceMonthly: 2200,
      bedrooms: 3,
      bathrooms: 2,
      areaSqm: 140,
      imageUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&q=80',
    },
  },
  play: async ({ canvasElement }) => {
    const tab = canvasElement.querySelector<HTMLButtonElement>('.iu-pb__tab:last-child');
    tab?.click();
  },
};

/** NoImage — property without an image URL (placeholder state). */
export const NoImage: Story = {
  name: 'No Image Fallback',
  args: {
    property: {
      ...SAMPLE_PROPERTY,
      id: '3',
      title: 'Estúdio no Intendente',
      location: 'Intendente, Lisboa',
      priceMonthly: 780,
      bedrooms: 0,
      bathrooms: 1,
      areaSqm: 32,
      imageUrl: undefined,
    },
  },
};
