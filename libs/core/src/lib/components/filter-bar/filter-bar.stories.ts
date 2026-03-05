import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { FilterBarComponent, FilterConfig } from './filter-bar.component';

// ─── Filter configs ───────────────────────────────────────────────────────────

const allFilters: FilterConfig[] = [
  {
    key: 'search',
    type: 'text',
    label: 'Search',
    placeholder: 'Search properties…',
  },
  {
    key: 'type',
    type: 'select',
    label: 'Type',
    placeholder: 'All types',
    options: [
      { value: 'apartment', label: 'Apartment' },
      { value: 'studio', label: 'Studio' },
      { value: 'duplex', label: 'Duplex' },
      { value: 'office', label: 'Office' },
    ],
  },
  {
    key: 'availability',
    type: 'date-range',
    label: 'Availability',
  },
  {
    key: 'tags',
    type: 'tags',
    label: 'Tags',
    placeholder: 'Add tag…',
    maxTags: 5,
  },
];

const minimalFilters: FilterConfig[] = [
  {
    key: 'search',
    type: 'text',
    label: 'Search',
    placeholder: 'Search…',
  },
  {
    key: 'status',
    type: 'select',
    label: 'Status',
    placeholder: 'All',
    options: [
      { value: 'available', label: 'Available' },
      { value: 'rented', label: 'Rented' },
      { value: 'maintenance', label: 'Maintenance' },
    ],
  },
];

const dateRangeFilters: FilterConfig[] = [
  {
    key: 'checkIn',
    type: 'date-range',
    label: 'Check-in range',
  },
  {
    key: 'checkOut',
    type: 'date-range',
    label: 'Check-out range',
  },
  {
    key: 'tags',
    type: 'tags',
    label: 'Amenities',
    placeholder: 'Add amenity…',
  },
];

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<FilterBarComponent> = {
  title: 'Sprint 009/FilterBar',
  component: FilterBarComponent,
  decorators: [
    applicationConfig({
      providers: [provideAnimations()],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Reactive filter bar with Signal-based outputs. Supports text (debounced), select, date-range, and tag filters. Emits `filtersChange` on every change.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<FilterBarComponent>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/** Default: all filter types visible */
export const Default: Story = {
  args: {
    filters: allFilters,
  },
  parameters: {
    docs: { description: { story: 'All four filter types: text (debounced), select, date-range, and tags.' } },
  },
};

/** Minimal: text + select only */
export const Minimal: Story = {
  args: {
    filters: minimalFilters,
  },
  parameters: {
    docs: { description: { story: 'Minimal variant with only text search and a status select.' } },
  },
};

/** WithDateRange: focused on date-range and tags */
export const WithDateRange: Story = {
  args: {
    filters: dateRangeFilters,
  },
  parameters: {
    docs: { description: { story: 'Date-range-heavy variant for booking/calendar filtering, plus a tag input for amenities.' } },
  },
};
