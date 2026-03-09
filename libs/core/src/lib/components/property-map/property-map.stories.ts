import type { Meta, StoryObj } from '@storybook/angular';
import { PropertyMapComponent, MOCK_MAP_MARKERS } from '@israel-ui/core';

const meta: Meta<PropertyMapComponent> = {
  title: 'LisboaRent/PropertyMap',
  component: PropertyMapComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Interactive Leaflet map for LisboaRent property listings. ' +
          'Uses OpenStreetMap tiles — no API key needed. ' +
          'Renders M3-styled price-bubble markers with click-to-select and popup previews. ' +
          'Feature flag: `PROPERTY_MAP`.',
      },
    },
  },
  argTypes: {
    height: { control: 'text' },
    fitBounds: { control: 'boolean' },
    markerClick: { action: 'markerClick' },
    selectionChange: { action: 'selectionChange' },
  },
};

export default meta;
type Story = StoryObj<PropertyMapComponent>;

// ─── Default — all Lisboa markers ────────────────────────────────────────────

export const Default: Story = {
  name: 'Default (All Properties)',
  args: {
    markers: MOCK_MAP_MARKERS,
    height: '480px',
    fitBounds: true,
    center: { lat: 38.7223, lng: -9.1393, zoom: 11 },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Renders all 6 mock LisboaRent properties across the Lisboa region. ' +
          'Map auto-fits bounds to show all markers. Click a pin to open its popup.',
      },
    },
  },
};

// ─── City Centre — filtered subset ────────────────────────────────────────────

export const CityCentre: Story = {
  name: 'City Centre Only',
  args: {
    markers: MOCK_MAP_MARKERS.slice(0, 3),
    height: '420px',
    fitBounds: true,
    center: { lat: 38.7160, lng: -9.1390, zoom: 14 },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Filtered to show only city-centre properties (Príncipe Real, Mouraria, Intendente). ' +
          'Demonstrates the `fitBounds` behaviour when markers are geographically close.',
      },
    },
  },
};

// ─── Empty state ──────────────────────────────────────────────────────────────

export const EmptyState: Story = {
  name: 'Empty State (No Results)',
  args: {
    markers: [],
    height: '360px',
    fitBounds: false,
    center: { lat: 38.7223, lng: -9.1393, zoom: 12 },
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `markers` is empty the map renders a friendly overlay. ' +
          'The OSM base map is still visible underneath.',
      },
    },
  },
};
