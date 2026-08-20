import type { Meta, StoryObj } from '@storybook/angular';
import { SignalFormsAsyncComponent } from '@israel-ui/core';

/**
 * Storybook stories for {@link SignalFormsAsyncComponent} — the async-validation PoC
 * in the Signal Forms migration line. Feature flag: `SIGNAL_FORMS_ASYNC`.
 */
const meta: Meta<SignalFormsAsyncComponent> = {
  title: 'LisboaRent/SignalFormsAsync',
  component: SignalFormsAsyncComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '**SignalFormsAsync** — reference-claim form built with Angular 22’s official ' +
          '`@angular/forms/signals` API. The fourth PoC in the migration line, proving the last ' +
          'unproven surface: **asynchronous validation**. A `reference` field is checked for ' +
          'uniqueness against a (mock) backend via `validateAsync(path, { params, factory: ' +
          'resource(), onSuccess, onError })`. Synchronous rules gate the async check (a too-short ' +
          'or invalid reference never hits the backend), `field().pending()` drives a live spinner ' +
          'and disables submit, and a debounce delays the resource until typing stops. Try ' +
          '`lisboarent`, `admin`, `arroios-t3` or `demo` — all taken. Feature flag: ' +
          '`SIGNAL_FORMS_ASYNC`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<SignalFormsAsyncComponent>;

/**
 * Default — type a reference and watch the availability check. `arroios-t3` (and
 * `lisboarent`, `admin`, `demo`) are taken; anything else resolves as available.
 */
export const Default: Story = {};

/**
 * Guided — type a reference and watch the state go **a verificar…** → **Disponível**;
 * try `demo` (taken) to see the async error surface after the round-trip.
 */
export const Guided: Story = {
  render: () => ({
    template: `
      <iu-signal-forms-async (claimed)="onClaim($event)" />
      <p style="margin-top:1rem;max-width:30rem;font:0.8125rem system-ui;color:#666">
        Escreva uma referência (ex.: <code>alfama-t2</code>) e veja o
        estado <b>a verificar…</b> → <b>Disponível</b>. Experimente
        <code>demo</code> para ver o erro assíncrono.
      </p>
    `,
    props: {
      onClaim: (payload: unknown) =>
        // eslint-disable-next-line no-console
        console.log('[SignalFormsAsync] claimed', payload),
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
        <iu-signal-forms-async />
      </div>
    `,
  }),
};
