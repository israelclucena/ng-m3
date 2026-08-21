import type { Meta, StoryObj } from '@storybook/angular';
import { AuthRegisterSignalFormComponent } from '@israel-ui/core';

const meta: Meta<AuthRegisterSignalFormComponent> = {
  title: 'Auth/AuthRegisterSignalForm',
  component: AuthRegisterSignalFormComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '**AuthRegisterSignalForm** — the LisboaRent registration form rebuilt on Angular 22’s ' +
          'official Signal Forms API (`@angular/forms/signals` `form()` + declarative schema), a faithful ' +
          'side-by-side twin of `AuthRegister` (identical markup/styles/outputs; only the form engine differs). ' +
          'Confirm-password is validated cross-field via `validate(path.confirmPassword, ({valueOf}) => …)`. ' +
          'Feature flag: `AUTH_REGISTER_SIGNAL_FORM`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<AuthRegisterSignalFormComponent>;

/** Default — blank registration form, tenant role selected. */
export const Default: Story = {};

/**
 * Guided — filled with valid sample data (landlord role) so the strength meter,
 * matching confirm field and enabled submit are all visible. Mirrors a happy path.
 */
export const Guided: Story = {
  name: 'Guided (filled + landlord)',
  play: async ({ canvasElement }) => {
    const fill = (id: string, value: string) => {
      const el = canvasElement.querySelector<HTMLInputElement>(id);
      if (el) {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };
    canvasElement.querySelectorAll<HTMLButtonElement>('.iu-arsf__role-btn')[1]?.click();
    fill('#arsf-name', 'Israel Lucena');
    fill('#arsf-email', 'israel@lisboarent.pt');
    fill('#arsf-password', 'MinhaPassword123!');
    fill('#arsf-confirm', 'MinhaPassword123!');
    canvasElement
      .querySelector<HTMLInputElement>('.iu-arsf__checkbox')
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
      <iu-auth-register-signal-form />
    </div>`,
  }),
};
