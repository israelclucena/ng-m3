/**
 * NotFoundPageComponent — Storybook Stories
 *
 * Sprint 023 — Night Shift 2026-03-17
 * Feature flag: ERROR_PAGES
 */
import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { NotFoundPageComponent } from './not-found-page.component';

const meta: Meta<NotFoundPageComponent> = {
  title: 'Sprint 023/NotFoundPage',
  component: NotFoundPageComponent,
  decorators: [
    applicationConfig({
      providers: [provideRouter([])],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '404 Not Found page. Shown when a route is not matched. M3 tokens, standalone.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<NotFoundPageComponent>;

/** Default 404 state */
export const Default: Story = {
  name: '404 — Not Found',
};

/** Dark theme override */
export const DarkTheme: Story = {
  name: '404 — Dark Theme',
  decorators: [
    applicationConfig({
      providers: [provideRouter([])],
    }),
  ],
  render: () => ({
    component: NotFoundPageComponent,
    styles: [':host { filter: invert(1) hue-rotate(180deg); }'],
  }),
};

/** Compact viewport (mobile) */
export const Mobile: Story = {
  name: '404 — Mobile Viewport',
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
