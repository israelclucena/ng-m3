import type { Meta, StoryObj } from '@storybook/angular';
import { PropertyComparisonComponent } from '@israel-ui/core';
import { MOCK_MAP_MARKERS } from '@israel-ui/core';

const MOCK_PROPS = MOCK_MAP_MARKERS.map(m => m.property);

const meta: Meta<PropertyComparisonComponent> = {
  title: 'LisboaRent/PropertyComparison',
  component: PropertyComparisonComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Side-by-side property comparison table. Accepts 2–3 `PropertyData` items and renders ' +
          'a grid with best-value highlighting using M3 primary-container colour. ' +
          'Designed to work alongside `FavouritesService`. ' +
          'Feature flag: `PROPERTY_COMPARISON`.',
      },
    },
  },
  argTypes: {
    showRemove: { control: 'boolean' },
    removeProperty: { action: 'removeProperty' },
  },
};

export default meta;
type Story = StoryObj<PropertyComparisonComponent>;

// ─── Default — 2 properties ───────────────────────────────────────────────────

export const Default: Story = {
  name: 'Two Properties',
  args: {
    properties: [MOCK_PROPS[0], MOCK_PROPS[1]],
    showRemove: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Basic 2-property comparison. Best price (lowest) and best area/bedrooms (highest) ' +
          'are highlighted with the M3 primary-container colour.',
      },
    },
  },
};

// ─── Three-way comparison ─────────────────────────────────────────────────────

export const ThreeWay: Story = {
  name: 'Three-Way Comparison',
  args: {
    properties: [MOCK_PROPS[0], MOCK_PROPS[1], MOCK_PROPS[3]],
    showRemove: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          '3-column comparison with remove buttons on each header. ' +
          'Click ✕ to emit `removeProperty` — the host component should remove from the list.',
      },
    },
  },
};

// ─── Empty state ──────────────────────────────────────────────────────────────

export const Empty: Story = {
  name: 'Empty / Insufficient',
  args: {
    properties: [],
    showRemove: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When fewer than 2 properties are provided, the component shows an empty state ' +
          'prompting the user to add items to favourites.',
      },
    },
  },
};
