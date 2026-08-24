import type { Meta, StoryObj } from '@storybook/angular';
import { LeaseAgreementSignalFormComponent } from '@israel-ui/core';

const meta: Meta<LeaseAgreementSignalFormComponent> = {
  title: 'Lease/LeaseAgreementSignalForm',
  component: LeaseAgreementSignalFormComponent,
  tags: ['autodocs'],
  args: {
    landlordId: 'landlord-001',
    landlordName: 'Carlos Mendes',
    propertyId: 'p1',
    propertyTitle: 'Apartamento T2 no Chiado',
    propertyAddress: 'Rua Garrett 42, Lisboa',
    tenantId: 'tenant-001',
    tenantName: 'Ana Ferreira',
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '**LeaseAgreementSignalForm** — the landlord lease-agreement create form rebuilt on ' +
          'Angular 22’s official Signal Forms API (`@angular/forms/signals` `form()` + declarative schema), ' +
          'a faithful side-by-side twin of `LeaseAgreementForm` (identical markup/styles/inputs/outputs; ' +
          'only the form engine differs). Exercises a segmented `leaseType` chooser written imperatively via ' +
          '`f.leaseType().value.set()`, `<input type="date">` and `<input type="number">` bound via `[formField]` ' +
          '(native number parse), a `minLength(50)` terms textarea, and an optional notes field. A parity spec ' +
          'asserts both twins hand `LeaseAgreementService.create()` a byte-identical payload. Feature flag: ' +
          '`LEASE_AGREEMENT_SIGNAL_FORM`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<LeaseAgreementSignalFormComponent>;

/** Default — blank lease form (leaseType pre-selected on "Prazo Fixo"). */
export const Default: Story = {};

/**
 * Filled — a complete, valid lease typed in, so the summary block, the enabled
 * submit button and the error-free fields are all visible. Mirrors a happy path.
 */
export const Filled: Story = {
  name: 'Filled (valid lease)',
  play: async ({ canvasElement }) => {
    const setText = (id: string, value: string) => {
      const el = canvasElement.querySelector<HTMLInputElement | HTMLTextAreaElement>(id);
      if (el) {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };
    setText('#lafs-start', '2026-09-01');
    setText('#lafs-end', '2027-08-31');
    setText('#lafs-rent', '1200');
    setText('#lafs-deposit', '2400');
    setText(
      '#lafs-terms',
      'Contrato de arrendamento habitacional celebrado nos termos do NRAU, com renda mensal e depósito de segurança.',
    );
  },
};

/**
 * Errors — an empty form submitted, so the required error messages and red field
 * borders surface all at once (submit gating keeps the button disabled until valid).
 */
export const Errors: Story = {
  name: 'Validation errors',
  play: async ({ canvasElement }) => {
    canvasElement
      .querySelector<HTMLFormElement>('.laf-form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  },
};
