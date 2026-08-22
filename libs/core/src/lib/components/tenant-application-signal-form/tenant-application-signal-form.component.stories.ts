import type { Meta, StoryObj } from '@storybook/angular';
import { TenantApplicationSignalFormComponent } from '@israel-ui/core';

const meta: Meta<TenantApplicationSignalFormComponent> = {
  title: 'Tenant/TenantApplicationSignalForm',
  component: TenantApplicationSignalFormComponent,
  tags: ['autodocs'],
  args: {
    tenantId: 'tenant-001',
    tenantName: 'Ana Ferreira',
    tenantEmail: 'ana@email.pt',
    propertyId: 'p1',
    propertyTitle: 'Apartamento T2 no Chiado',
    landlordId: 'landlord-001',
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '**TenantApplicationSignalForm** — the multi-step rental application rebuilt on Angular 22’s ' +
          'official Signal Forms API (`@angular/forms/signals` `form()` + declarative schema), a faithful ' +
          'side-by-side twin of `TenantApplicationForm` (identical 5-step flow, markup, styles, outputs; only the ' +
          'form engine differs). Migration #2 — exercises surfaces #060 didn’t: the NIF `pattern(/^\\d{9}$/)` ' +
          'validator, native number parse on income/occupants (`[formField]` on `<input type="number">`), and ' +
          'imperative field writes via `f.field().value.set()` for the segmented choosers. ' +
          'Feature flag: `TENANT_APPLICATION_SIGNAL_FORM`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<TenantApplicationSignalFormComponent>;

/** Default — blank application on the Personal step, tenant inputs pre-bound. */
export const Default: Story = {};

/**
 * Guided (Personal filled) — types a valid phone / NIF / nationality so the fields
 * render clean (no errors) and the NIF pattern is satisfied. Mirrors a happy first step.
 */
export const Guided: Story = {
  name: 'Guided (personal filled)',
  play: async ({ canvasElement }) => {
    const fill = (id: string, value: string) => {
      const el = canvasElement.querySelector<HTMLInputElement>(id);
      if (el) {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };
    fill('#tafs-phone', '912345678');
    fill('#tafs-nif', '123456789');
    fill('#tafs-nationality', 'Portuguesa');
    canvasElement
      .querySelectorAll<HTMLButtonElement>('.taf-seg-btn')[1]
      ?.click(); // "Sim" — has pets
  },
};

/**
 * OnDarkSurface — the form rendered over a dark container, to sanity-check the
 * M3 token contrast (surface / on-surface / primary) outside the default canvas.
 */
export const OnDarkSurface: Story = {
  name: 'On Dark Surface',
  render: (args) => ({
    props: args,
    template: `<div style="background:#1c1b1f;padding:32px;border-radius:24px;">
      <iu-tenant-application-signal-form
        [tenantId]="tenantId" [tenantName]="tenantName" [tenantEmail]="tenantEmail"
        [propertyId]="propertyId" [propertyTitle]="propertyTitle" [landlordId]="landlordId" />
    </div>`,
  }),
};
