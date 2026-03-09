import type { Meta, StoryObj } from '@storybook/angular';
import { PaginatorComponent } from '@israel-ui/core';

const meta: Meta<PaginatorComponent> = {
  title: 'Components/Paginator',
  component: PaginatorComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'M3-styled paginator with keyboard navigation, ellipsis for large page counts, ' +
          'and an optional page-size selector. Signal-driven — no RxJS. ' +
          'Designed to extend the `PROPERTY_LISTING` page. ' +
          'Feature flag: `PAGINATOR`.',
      },
    },
  },
  argTypes: {
    length: { control: { type: 'number' } },
    pageSize: { control: { type: 'number' } },
    pageIndex: { control: { type: 'number' } },
    showInfo: { control: 'boolean' },
    page: { action: 'page' },
  },
};

export default meta;
type Story = StoryObj<PaginatorComponent>;

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  args: {
    length: 54,
    pageSize: 9,
    pageIndex: 0,
    pageSizeOptions: [6, 9, 12, 24],
    showInfo: true,
  },
};

// ─── Mid-page ─────────────────────────────────────────────────────────────────

export const MidPage: Story = {
  name: 'Mid-page (Ellipsis)',
  args: {
    length: 100,
    pageSize: 9,
    pageIndex: 5,
    pageSizeOptions: [6, 9, 12, 24],
    showInfo: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When there are many pages, ellipsis (…) replaces the hidden page numbers. ' +
          'The current page is always visible alongside its immediate neighbours.',
      },
    },
  },
};

// ─── Minimal (no size selector, no info) ─────────────────────────────────────

export const Minimal: Story = {
  name: 'Minimal (No Controls)',
  args: {
    length: 30,
    pageSize: 6,
    pageIndex: 0,
    pageSizeOptions: [],
    showInfo: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Minimal variant: no range info and no page-size selector. ' +
          'Use when space is tight or page size is fixed.',
      },
    },
  },
};
