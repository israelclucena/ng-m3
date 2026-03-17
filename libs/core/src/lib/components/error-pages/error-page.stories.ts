/**
 * ErrorPageComponent — Storybook Stories
 *
 * Sprint 023 — Night Shift 2026-03-17
 * Feature flag: ERROR_PAGES
 */
import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { ErrorPageComponent } from './error-page.component';

const meta: Meta<ErrorPageComponent> = {
  title: 'Sprint 023/ErrorPage',
  component: ErrorPageComponent,
  decorators: [
    applicationConfig({
      providers: [provideRouter([])],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Generic error page for HTTP 500 and other server errors. ' +
          'Accepts `errorCode`, `title`, and `message` signal inputs. M3 tokens, standalone.',
      },
    },
  },
  argTypes: {
    errorCode: { control: { type: 'number' } },
    title: { control: 'text' },
    message: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<ErrorPageComponent>;

/** Default 500 state */
export const Default: Story = {
  name: '500 — Server Error',
  args: {
    errorCode: 500,
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Our team has been notified. Please try again.',
  },
};

/** 403 Forbidden variant */
export const Forbidden: Story = {
  name: '403 — Forbidden',
  args: {
    errorCode: 403,
    title: 'Access Denied',
    message: "You don't have permission to view this page. Contact your administrator.",
  },
};

/** Network error (status 0) */
export const NetworkError: Story = {
  name: '0 — Network Error',
  args: {
    errorCode: 0,
    title: 'No Connection',
    message: 'Could not reach the server. Please check your internet connection and try again.',
  },
};
