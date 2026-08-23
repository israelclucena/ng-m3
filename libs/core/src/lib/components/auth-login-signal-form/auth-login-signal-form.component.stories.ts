import type { Meta, StoryObj } from '@storybook/angular';
import { AuthLoginSignalFormComponent } from '@israel-ui/core';

const meta: Meta<AuthLoginSignalFormComponent> = {
  title: 'Auth/AuthLoginSignalForm',
  component: AuthLoginSignalFormComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '**AuthLoginSignalForm** — the LisboaRent login form rebuilt on Angular 22’s ' +
          'official Signal Forms API (`@angular/forms/signals` `form()` + declarative schema), a faithful ' +
          'side-by-side twin of `AuthLogin` (identical markup/styles/outputs; only the form engine differs). ' +
          'Completes the auth pair after `AuthRegisterSignalForm` (#060). Validators mirror the bespoke twin ' +
          'byte-for-byte (password min length 6). Feature flag: `AUTH_LOGIN_SIGNAL_FORM`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<AuthLoginSignalFormComponent>;

/** Default — blank login form. */
export const Default: Story = {};

/**
 * Filled — valid sample credentials typed in so the enabled submit button and a
 * clean (error-free) state are visible. Mirrors a happy path.
 */
export const Filled: Story = {
  name: 'Filled (valid credentials)',
  play: async ({ canvasElement }) => {
    const fill = (id: string, value: string) => {
      const el = canvasElement.querySelector<HTMLInputElement>(id);
      if (el) {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };
    fill('#alsf-email', 'israel@lisboarent.pt');
    fill('#alsf-password', 'MinhaPassword123!');
    canvasElement
      .querySelector<HTMLInputElement>('.iu-alsf__checkbox')
      ?.dispatchEvent(new Event('change', { bubbles: true }));
  },
};

/**
 * OnDarkSurface — the form rendered over a dark container, to sanity-check the
 * M3 token contrast (surface / on-surface / primary) outside the default canvas.
 */
export const OnDarkSurface: Story = {
  name: 'On Dark Surface',
  render: () => ({
    template: `<div style="background:#1c1b1f;padding:32px;border-radius:24px;">
      <iu-auth-login-signal-form />
    </div>`,
  }),
};
