import type { Meta, StoryObj } from '@storybook/angular';
import { PropertyAvailabilityComponent } from './property-availability.component';

interface DateRange { start: Date; end: Date; }

const meta: Meta<PropertyAvailabilityComponent> = {
  title: 'Sprint 027/PropertyAvailability',
  component: PropertyAvailabilityComponent,
  tags: ['autodocs'],
  argTypes: {
    propertyId: { control: 'text' },
    minStay: { control: { type: 'number', min: 1, max: 14 } },
    maxAdvanceDays: { control: { type: 'number', min: 30, max: 365 } },
  },
};

export default meta;
type Story = StoryObj<PropertyAvailabilityComponent>;

// ── Default: empty calendar, no bookings ──────────────────────────────────────

/**
 * Default story — fresh calendar with no booked dates.
 * User can freely select any range.
 */
export const Default: Story = {
  args: {
    propertyId: 'prop-001',
    bookedDates: [],
    minStay: 1,
    maxAdvanceDays: 90,
  },
};

// ── WithBookedDates: several booked ranges visible ─────────────────────────────

const today = new Date();
const addDays = (d: Date, n: number): Date => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

const bookedRanges: DateRange[] = [
  { start: addDays(today, 3),  end: addDays(today, 6) },
  { start: addDays(today, 12), end: addDays(today, 16) },
  { start: addDays(today, 25), end: addDays(today, 30) },
  { start: addDays(today, 40), end: addDays(today, 44) },
];

/**
 * WithBookedDates — calendar showing several blocked/booked ranges.
 * Booked dates appear in the error/red colour; user cannot select them.
 */
export const WithBookedDates: Story = {
  args: {
    propertyId: 'prop-lisbon-central',
    bookedDates: bookedRanges,
    minStay: 1,
    maxAdvanceDays: 90,
  },
};

// ── WithMinStay: minStay=3, some dates booked ──────────────────────────────────

const sparseBookings: DateRange[] = [
  { start: addDays(today, 8),  end: addDays(today, 10) },
  { start: addDays(today, 20), end: addDays(today, 22) },
];

/**
 * WithMinStay — calendar with a 3-night minimum stay requirement.
 * Selecting less than 3 nights resets the selection start instead of confirming.
 */
export const WithMinStay: Story = {
  args: {
    propertyId: 'prop-porto-suite',
    bookedDates: sparseBookings,
    minStay: 3,
    maxAdvanceDays: 60,
  },
};
