import type { Meta, StoryObj } from '@storybook/angular';
import { MaintenanceRequestSignalFormComponent } from '@israel-ui/core';

const meta: Meta<MaintenanceRequestSignalFormComponent> = {
  title: 'Maintenance/MaintenanceRequestSignalForm',
  component: MaintenanceRequestSignalFormComponent,
  tags: ['autodocs'],
  args: {
    tenantId: 'tenant-001',
    tenantName: 'Ana Ferreira',
    landlordId: 'landlord-001',
    propertyId: 'p1',
    propertyTitle: 'Apartamento T2 no Chiado',
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '**MaintenanceRequestSignalForm** — the tenant maintenance-request form rebuilt on ' +
          'Angular 22’s official Signal Forms API (`@angular/forms/signals` `form()` + declarative schema), ' +
          'a faithful side-by-side twin of `MaintenanceRequestForm` (identical markup/styles/inputs/output; ' +
          'only the form engine differs). Exercises `<select>`/enum and `<textarea>` bound via `[formField]`, ' +
          'plus `minLength`/`maxLength` on title + description. A parity spec asserts both twins hand ' +
          '`MaintenanceRequestService.create()` a byte-identical payload. Feature flag: ' +
          '`MAINTENANCE_REQUEST_SIGNAL_FORM`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<MaintenanceRequestSignalFormComponent>;

/** Default — blank request form (both selects on their placeholder option). */
export const Default: Story = {};

/**
 * Filled — a valid urgent plumbing request typed in, so the enabled submit button
 * and clean (error-free) char counts are visible. Mirrors a happy path.
 */
export const Filled: Story = {
  name: 'Filled (valid request)',
  play: async ({ canvasElement }) => {
    const setSelect = (id: string, value: string) => {
      const el = canvasElement.querySelector<HTMLSelectElement>(id);
      if (el) {
        el.value = value;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };
    const setText = (id: string, value: string) => {
      const el = canvasElement.querySelector<HTMLInputElement | HTMLTextAreaElement>(id);
      if (el) {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };
    setSelect('#mrsf-category', 'plumbing');
    setSelect('#mrsf-priority', 'urgent');
    setText('#mrsf-title', 'Fuga de água na casa de banho');
    setText(
      '#mrsf-description',
      'A torneira do chuveiro pinga constantemente há três dias e começou a infiltrar para o teto do vizinho.',
    );
  },
};

/**
 * Errors — every field left invalid then submitted, so the required/min-length
 * error messages and red field borders are all visible at once.
 */
export const Errors: Story = {
  name: 'Validation errors',
  play: async ({ canvasElement }) => {
    canvasElement
      .querySelector<HTMLFormElement>('.mrsf-form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  },
};
