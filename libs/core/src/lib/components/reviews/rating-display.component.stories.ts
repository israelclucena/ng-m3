import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { RatingDisplayComponent } from '@israel-ui/core';

const meta: Meta<RatingDisplayComponent> = {
  title: 'LisboaRent/RatingDisplay',
  component: RatingDisplayComponent,
  decorators: [
    applicationConfig({
      providers: [provideAnimations()],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**RatingDisplay** — compact star rating widget for LisboaRent.

Pure display: 1–5 filled/half/empty stars with optional numeric label
and review count. Three size variants (sm / md / lg).

Feature flag: \`REVIEWS_MODULE\`
        `.trim(),
      },
    },
  },
  argTypes: {
    rating: { control: { type: 'number', min: 0, max: 5, step: 0.1 } },
    count: { control: 'number' },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    showLabel: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<RatingDisplayComponent>;

/**
 * Default — average rating with label and review count.
 */
export const Default: Story = {
  args: {
    rating: 4.3,
    count: 128,
    size: 'md',
    showLabel: true,
  },
};

/**
 * HalfStars — decimal rating renders half-filled star.
 */
export const HalfStars: Story = {
  args: {
    rating: 3.5,
    count: 42,
    size: 'md',
    showLabel: true,
  },
};

/**
 * SmallNoLabel — compact mode for inline contexts (e.g. inside ReviewCard).
 */
export const SmallNoLabel: Story = {
  args: {
    rating: 5,
    size: 'sm',
    showLabel: false,
  },
};

/**
 * LargePerfectScore — 5-star rating in large size with high review count.
 */
export const LargePerfectScore: Story = {
  args: {
    rating: 5,
    count: 1247,
    size: 'lg',
    showLabel: true,
  },
};
