import type { Meta, StoryObj } from '@storybook/angular';
import { AuthLoginComponent } from '@israel-ui/core';

const meta: Meta<AuthLoginComponent> = {
  title: 'Auth/AuthLogin',
  component: AuthLoginComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '**AuthLogin** — Signal-based login form for LisboaRent. ' +
          'Validates email + password client-side. Shows loading spinner during auth. ' +
          'Displays server errors from AuthService. Feature flag: `AUTH_MODULE`.',
      },
    },
  },
  decorators: [],
};

export default meta;
type Story = StoryObj<AuthLoginComponent>;

/** Default — empty login form. */
export const Default: Story = {};

/** WithEmail — pre-filled email for demo purposes. */
export const WithEmail: Story = {
  name: 'Pre-filled Email',
  play: async ({ canvasElement }) => {
    const emailInput = canvasElement.querySelector<HTMLInputElement>('#al-email');
    if (emailInput) {
      emailInput.value = 'israel@lisboarent.pt';
      emailInput.dispatchEvent(new Event('input'));
    }
  },
};

/** DarkMode — rendered on a dark surface. */
export const DarkSurface: Story = {
  name: 'Dark Surface',
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (story) => ({
      ...story(),
      props: {},
    }),
  ],
};
