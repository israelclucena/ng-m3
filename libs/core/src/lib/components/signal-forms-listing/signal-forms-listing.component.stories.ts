import type { Meta, StoryObj } from '@storybook/angular';
import { SignalFormsListingComponent } from '@israel-ui/core';

/**
 * Storybook stories for {@link SignalFormsListingComponent} — the complex,
 * cross-validated companion to `SignalFormsPoc`. Feature flag:
 * `SIGNAL_FORMS_LISTING`.
 */
const meta: Meta<SignalFormsListingComponent> = {
  title: 'LisboaRent/SignalFormsListing',
  component: SignalFormsListingComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '**SignalFormsListing** — property-listing form built with Angular 22’s official ' +
          '`@angular/forms/signals` API (`form()` + declarative `schema`). The complex sibling of ' +
          '`SignalFormsPoc`: it stresses **cross-field validation** via `validate(path, ({valueOf}) => …)` ' +
          '(deposit constrained to 1×–3× the monthly rent; a `studio` may not declare bedrooms), typed ' +
          'number/enum/date fields with `min`/`max` limits, and a custom runtime future-date guard. ' +
          'Mirrors the fields of the bespoke multi-step `AddProperty` form. Feature flag: `SIGNAL_FORMS_LISTING`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<SignalFormsListingComponent>;

/** Default — empty form; errors surface after touch or a submit attempt. */
export const Default: Story = {};

/**
 * Guided happy path — fill valid values (e.g. rent 1200 + deposit 2400 = 2×) and
 * submit to see the confirmation. Deposit outside 1×–3× surfaces a cross-field error.
 */
export const PreFilled: Story = {
  render: () => ({
    template: `
      <iu-signal-forms-listing
        (submitted)="onSubmit($event)" />
      <p style="margin-top:1rem;max-width:32rem;font:0.8125rem system-ui;color:#666">
        Título (≥8), tipo, renda ≥ €100 e caução entre 1× e 3× a renda,
        área ≥ 10&nbsp;m², data futura → <b>Publicar</b>.
        Experimente pôr a caução acima de 3× a renda para ver a validação cruzada.
      </p>
    `,
    props: {
      onSubmit: (payload: unknown) =>
        // eslint-disable-next-line no-console
        console.log('[SignalFormsListing] submitted', payload),
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
        <iu-signal-forms-listing />
      </div>
    `,
  }),
};
