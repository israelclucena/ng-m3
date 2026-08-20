import type { Meta, StoryObj } from '@storybook/angular';
import { SignalFormsRosterComponent } from '@israel-ui/core';

/**
 * Storybook stories for {@link SignalFormsRosterComponent} — the dynamic-array PoC
 * in the Signal Forms migration line. Feature flag: `SIGNAL_FORMS_ROSTER`.
 */
const meta: Meta<SignalFormsRosterComponent> = {
  title: 'LisboaRent/SignalFormsRoster',
  component: SignalFormsRosterComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '**SignalFormsRoster** — split-lease roster built with Angular 22’s official ' +
          '`@angular/forms/signals` API. The third PoC in the migration line, proving the surface ' +
          'the scalar PoCs never touched: a **dynamic array of sub-objects**. Co-tenants ' +
          '(`{name, email, sharePct}`) are validated per-item with `applyEach(path.tenants, …)`, the ' +
          'array carries a `minLength` (≥1 tenant), and a cross-item **tree rule** via ' +
          '`validate(path.tenants, …)` requires the shares to sum to 100 %. Add / remove tenants ' +
          'live — `form()` reconciles the field nodes. Feature flag: `SIGNAL_FORMS_ROSTER`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<SignalFormsRosterComponent>;

/**
 * Default — one blank tenant at 100 %. Add a second tenant and the shares no longer
 * sum to 100 %, surfacing the cross-item tree error after a submit attempt.
 */
export const Default: Story = {};

/**
 * Guided happy path — one tenant already holds 100 %. Fill name + a valid email and
 * submit to see the confirmation. Adding a tenant splits the share and re-arms the
 * sum rule; balance both to 50/50 to submit again.
 */
export const Guided: Story = {
  render: () => ({
    template: `
      <iu-signal-forms-roster (submitted)="onSubmit($event)" />
      <p style="margin-top:1rem;max-width:34rem;font:0.8125rem system-ui;color:#666">
        Cada inquilino precisa de nome + email válido; as quotas têm de somar
        <b>100&nbsp;%</b>. Adicione um inquilino para ver a regra cruzada re-armar
        (ex.: 50&nbsp;% + 50&nbsp;%), depois <b>Guardar contrato</b>.
      </p>
    `,
    props: {
      onSubmit: (payload: unknown) =>
        // eslint-disable-next-line no-console
        console.log('[SignalFormsRoster] submitted', payload),
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
        <iu-signal-forms-roster />
      </div>
    `,
  }),
};
