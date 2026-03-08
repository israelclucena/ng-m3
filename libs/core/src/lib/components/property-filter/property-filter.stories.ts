import type { Meta, StoryObj } from '@storybook/angular';
import { PropertyFilterComponent, PropertyFilterState } from '@israel-ui/core';

const meta: Meta<PropertyFilterComponent> = {
  title: 'LisboaRent/PropertyFilter',
  component: PropertyFilterComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'M3 sidebar filter panel for LisboaRent property listings. ' +
          'Signal-driven — emits `filterChange` on every update. ' +
          'Feature flag: `PROPERTY_FILTER_SIDEBAR`.',
      },
    },
  },
  argTypes: {
    resultCount: { control: { type: 'number' } },
    compact: { control: 'boolean' },
    filterChange: { action: 'filterChange' },
    filterReset: { action: 'filterReset' },
  },
};

export default meta;
type Story = StoryObj<PropertyFilterComponent>;

// ─── Default ─────────────────────────────────────────────────────────────────

export const Default: Story = {
  args: {
    resultCount: 24,
    compact: false,
  },
};

// ─── With result count ────────────────────────────────────────────────────────

export const WithCount: Story = {
  name: 'With Result Count',
  args: {
    resultCount: 7,
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the matching result count below the header. Updates reactively as filters change.',
      },
    },
  },
};

// ─── Compact mode ─────────────────────────────────────────────────────────────

export const Compact: Story = {
  name: 'Compact (Narrow Sidebar)',
  args: {
    resultCount: 12,
    compact: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact mode reduces padding — suitable for narrow sidebar layouts or mobile drawers.',
      },
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 240px; font-family: 'Google Sans', sans-serif;">
        <iu-property-filter
          [resultCount]="resultCount"
          [compact]="compact"
          (filterChange)="filterChange($event)"
          (filterReset)="filterReset()"
        />
      </div>
    `,
  }),
};
