import type { Meta, StoryObj } from '@storybook/angular';
import { SignalFormsPocComponent } from '@israel-ui/core';

/**
 * Storybook stories for {@link SignalFormsPocComponent} — the Angular 22 official
 * Signal Forms proof-of-concept. Feature flag: `SIGNAL_FORMS_POC`.
 */
const meta: Meta<SignalFormsPocComponent> = {
  title: 'LisboaRent/SignalFormsPoc',
  component: SignalFormsPocComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '**SignalFormsPoc** — property-inquiry form built with Angular 22’s official ' +
          '`@angular/forms/signals` API (`form()` + declarative `schema`), the GA replacement ' +
          'for the repo’s bespoke `createSignalForm` utility. Additive, side-by-side PoC — ' +
          'demonstrates two-way `[formField]` binding, inline validators (`required` / `email` / ' +
          '`minLength` / `maxLength`), touched-aware error display, and submit gating. ' +
          'Feature flag: `SIGNAL_FORMS_POC`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<SignalFormsPocComponent>;

/** Default — empty form; validation errors surface after touch or submit. */
export const Default: Story = {};

/**
 * Pre-filled valid state — demonstrates the happy path. The user can submit
 * immediately and see the success confirmation.
 */
export const PreFilled: Story = {
  render: () => ({
    template: `
      <iu-signal-forms-poc
        (submitted)="onSubmit($event)" />
      <p style="margin-top:1rem;font:0.8125rem system-ui;color:#666">
        Preencha nome + email válido + mensagem e carregue em <b>Enviar</b>.
      </p>
    `,
    props: {
      onSubmit: (payload: unknown) =>
        // eslint-disable-next-line no-console
        console.log('[SignalFormsPoc] submitted', payload),
    },
  }),
};

/**
 * On dark surfaces — the component reads M3 color tokens, so it adapts to the
 * surrounding theme container.
 */
export const OnDarkSurface: Story = {
  render: () => ({
    template: `
      <div style="padding:2rem;background:#1c1b1f;border-radius:1rem">
        <iu-signal-forms-poc />
      </div>
    `,
  }),
};
