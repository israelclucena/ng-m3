import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { LeaseAgreementFormComponent } from './lease-agreement-form.component';
import { LeaseAgreementViewerComponent } from './lease-agreement-viewer.component';
import { Component } from '@angular/core';

// ─── Form Stories ─────────────────────────────────────────────────────────────

const formMeta: Meta<LeaseAgreementFormComponent> = {
  title: 'LisboaRent/LeaseAgreementForm',
  component: LeaseAgreementFormComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Landlord-facing form to create a new lease agreement. Feature flag: `LEASE_MODULE`.',
      },
    },
  },
  argTypes: {
    landlordId:      { control: 'text' },
    landlordName:    { control: 'text' },
    propertyId:      { control: 'text' },
    propertyTitle:   { control: 'text' },
    propertyAddress: { control: 'text' },
    tenantId:        { control: 'text' },
    tenantName:      { control: 'text' },
  },
};

export default formMeta;
type FormStory = StoryObj<LeaseAgreementFormComponent>;

/** Default landlord-facing lease form */
export const Default: FormStory = {
  args: {
    landlordId:      'landlord-001',
    landlordName:    'Carlos Mendes',
    propertyId:      'p1',
    propertyTitle:   'Apartamento T2 no Chiado',
    propertyAddress: 'Rua Garrett 42, 2º Dto, 1200-204 Lisboa',
    tenantId:        'tenant-001',
    tenantName:      'Ana Ferreira',
  },
};

/** Pre-filled form for a short-term lease */
export const ShortTermLease: FormStory = {
  name: 'Short-Term / Furnished',
  args: {
    landlordId:      'landlord-002',
    landlordName:    'Maria Santos',
    propertyId:      'p3',
    propertyTitle:   'Estúdio Mobilado no Intendente',
    propertyAddress: 'Rua do Intendente 15, 3º Esq, 1100-300 Lisboa',
    tenantId:        'tenant-002',
    tenantName:      'João Rodrigues',
  },
};

// ─── Viewer Stories ────────────────────────────────────────────────────────────

/** Wrapper component to display the viewer with an injected lease ID */
@Component({
  selector: 'sb-lease-viewer-wrapper',
  standalone: true,
  imports: [LeaseAgreementViewerComponent],
  template: `
    <iu-lease-agreement-viewer
      [leaseId]="leaseId"
      [currentUserId]="currentUserId"
      [currentUserRole]="currentUserRole" />
  `,
})
class LeaseViewerWrapperComponent {
  leaseId = 'lease-001';
  currentUserId = 'tenant-001';
  currentUserRole: 'tenant' | 'landlord' = 'tenant';
}

@Component({
  selector: 'sb-lease-viewer-draft',
  standalone: true,
  imports: [LeaseAgreementViewerComponent],
  template: `
    <iu-lease-agreement-viewer
      [leaseId]="leaseId"
      [currentUserId]="currentUserId"
      [currentUserRole]="currentUserRole" />
  `,
})
class LeaseViewerDraftComponent {
  leaseId = 'lease-002';
  currentUserId = 'tenant-001';
  currentUserRole: 'tenant' | 'landlord' = 'tenant';
}

export const ViewerActiveLease: StoryObj = {
  name: 'Viewer — Active Lease',
  render: () => ({
    moduleMetadata: { imports: [LeaseViewerWrapperComponent] },
    template: '<sb-lease-viewer-wrapper />',
  }),
  parameters: {
    docs: {
      description: { story: 'Active lease — both parties have signed.' },
    },
  },
};

export const ViewerDraftAwaitingSignature: StoryObj = {
  name: 'Viewer — Draft (Awaiting Tenant Signature)',
  render: () => ({
    moduleMetadata: { imports: [LeaseViewerDraftComponent] },
    template: '<sb-lease-viewer-draft />',
  }),
  parameters: {
    docs: {
      description: { story: 'Draft lease — landlord signed, tenant CTA shown.' },
    },
  },
};
