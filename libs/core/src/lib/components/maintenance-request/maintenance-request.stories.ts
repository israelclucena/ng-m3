/**
 * @fileoverview Maintenance Request stories — Sprint 034
 *
 * CSF3 stories for MaintenanceRequestFormComponent and MaintenanceRequestListComponent.
 * Feature flag: MAINTENANCE_MODULE
 */
import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaintenanceRequestFormComponent } from './maintenance-request-form.component';
import { MaintenanceRequestListComponent } from './maintenance-request-list.component';

// ─── Composite demo component ─────────────────────────────────────────────────

@Component({
  selector: 'storybook-maintenance-demo',
  standalone: true,
  imports: [CommonModule, MaintenanceRequestFormComponent, MaintenanceRequestListComponent],
  template: `
    <div style="padding: 24px; display: flex; flex-direction: column; gap: 32px; max-width: 700px;">
      <iu-maintenance-request-form
        tenantId="tenant-001"
        tenantName="Ana Ferreira"
        landlordId="landlord-001"
        propertyId="p1"
        propertyTitle="Apartamento T2 no Chiado"
        (submitted)="onSubmitted($event)" />
      <iu-maintenance-request-list
        tenantId="tenant-001"
        view="tenant" />
    </div>
  `,
})
class MaintenanceDemoComponent {
  onSubmitted(req: unknown): void {
    console.log('Submitted:', req);
  }
}

@Component({
  selector: 'storybook-landlord-demo',
  standalone: true,
  imports: [CommonModule, MaintenanceRequestListComponent],
  template: `
    <div style="padding: 24px; max-width: 800px;">
      <iu-maintenance-request-list
        landlordId="landlord-001"
        view="landlord" />
    </div>
  `,
})
class LandlordViewDemoComponent {}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<MaintenanceRequestFormComponent> = {
  title: 'Sprint 034/MaintenanceRequest',
  component: MaintenanceRequestFormComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [provideHttpClient()],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
**Maintenance Request Module** — Sprint 034

Two-sided maintenance workflow for the LisboaRent platform:

- **\`iu-maintenance-request-form\`** — Tenant submits a request: category, priority, title, description via \`createSignalForm()\`
- **\`iu-maintenance-request-list\`** — Dual-view list: tenants see their own requests; landlords manage status transitions (pending → in-progress → resolved/rejected)

Feature flag: \`MAINTENANCE_MODULE\`
        `.trim(),
      },
    },
  },
};

export default meta;
type Story = StoryObj<MaintenanceRequestFormComponent>;

// ─── Stories ─────────────────────────────────────────────────────────────────

/**
 * Default — Tenant view: form + request list side by side.
 */
export const Default: Story = {
  render: () => ({
    props: {},
    template: `<storybook-maintenance-demo />`,
    moduleMetadata: { imports: [MaintenanceDemoComponent] },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Tenant view: submit form + read-only list of existing requests.',
      },
    },
  },
};

/**
 * LandlordView — Full landlord dashboard with status management.
 */
export const LandlordView: Story = {
  render: () => ({
    props: {},
    template: `<storybook-landlord-demo />`,
    moduleMetadata: { imports: [LandlordViewDemoComponent] },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Landlord view with expandable rows and status action buttons (In Progress / Resolved / Reject).',
      },
    },
  },
};

/**
 * FormOnly — Isolated form component for focused testing.
 */
export const FormOnly: Story = {
  render: () => ({
    props: {},
    template: `
      <div style="padding: 24px; max-width: 640px;">
        <iu-maintenance-request-form
          tenantId="tenant-002"
          tenantName="João Santos"
          landlordId="landlord-001"
          propertyId="p2"
          propertyTitle="Studio em Alfama" />
      </div>
    `,
    moduleMetadata: { imports: [MaintenanceRequestFormComponent] },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Isolated form component — test validation, submission flow, and success state.',
      },
    },
  },
};
