import type { Meta, StoryObj } from '@storybook/angular';
import { TenantApplicationFormComponent } from './tenant-application-form.component';
import { ApplicationStatusComponent } from './application-status.component';

// ─── TenantApplicationForm Stories ────────────────────────────────────────────

const formMeta: Meta<TenantApplicationFormComponent> = {
  title: 'LisboaRent/TenantApplicationForm',
  component: TenantApplicationFormComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Multi-step tenant application form. Steps: Personal → Employment → References → Cover Letter → Review. Feature flag: `TENANT_APPLICATION`.',
      },
    },
  },
};

export default formMeta;
type FormStory = StoryObj<TenantApplicationFormComponent>;

/** Default application form for a T2 in Chiado */
export const Default: FormStory = {
  args: {
    tenantId:      'tenant-001',
    tenantName:    'Ana Ferreira',
    tenantEmail:   'ana.ferreira@email.pt',
    propertyId:    'p1',
    propertyTitle: 'Apartamento T2 no Chiado',
    landlordId:    'landlord-001',
  },
};

/** Application for a studio listing */
export const StudioApplication: FormStory = {
  name: 'Studio Listing',
  args: {
    tenantId:      'tenant-002',
    tenantName:    'João Rodrigues',
    tenantEmail:   'joao.rod@gmail.com',
    propertyId:    'p2',
    propertyTitle: 'Estúdio no Intendente',
    landlordId:    'landlord-002',
  },
};

// ─── ApplicationStatus Stories ─────────────────────────────────────────────────

export const LandlordReviewPanel: StoryObj<ApplicationStatusComponent> = {
  name: 'Landlord Review Panel',
  render: () => ({
    props: { landlordId: 'landlord-001' },
    template: `<iu-application-status [landlordId]="landlordId" />`,
    moduleMetadata: { imports: [ApplicationStatusComponent] },
  }),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Landlord panel showing all applications with expand/approve/reject actions. Feature flag: `APPLICATION_REVIEW`.',
      },
    },
  },
};
