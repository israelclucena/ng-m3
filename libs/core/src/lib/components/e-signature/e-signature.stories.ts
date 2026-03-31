/**
 * @fileoverview Storybook stories for E-Signature components — Sprint 036
 *
 * Stories:
 *   - SignaturePadDefault — plain drawing pad
 *   - SignaturePadWithSigner — pad with signer name
 *   - LeaseSigningFlowLandlord — full flow (landlord role)
 *   - LeaseSigningFlowTenant — full flow (tenant role)
 */
import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { SignaturePadComponent } from './signature-pad.component';
import { LeaseSigningFlowComponent } from './lease-signing-flow.component';

// ─── SignaturePad ─────────────────────────────────────────────────────────────

const padMeta: Meta<SignaturePadComponent> = {
  title: 'E-Signature/SignaturePad',
  component: SignaturePadComponent,
  decorators: [
    applicationConfig({ providers: [provideAnimations()] }),
  ],
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    signerName: { control: 'text' },
    strokeWidth: { control: { type: 'number', min: 1, max: 6 } },
  },
};

export default padMeta;
type PadStory = StoryObj<SignaturePadComponent>;

/** Default signature pad — draw and confirm */
export const Default: PadStory = {
  args: {
    label: 'Assinatura Digital',
    signerName: '',
    strokeWidth: 2,
  },
};

/** Pad with signer identity badge */
export const WithSignerName: PadStory = {
  args: {
    label: 'Assinatura do Senhorio',
    signerName: 'João Costa',
    strokeWidth: 2,
  },
};

/** Thicker stroke, tenant label */
export const TenantPad: PadStory = {
  args: {
    label: 'Assinatura do Inquilino',
    signerName: 'Maria Silva',
    strokeWidth: 3,
  },
};

// ─── LeaseSigningFlow ─────────────────────────────────────────────────────────

const flowMeta: Meta<LeaseSigningFlowComponent> = {
  title: 'E-Signature/LeaseSigningFlow',
  component: LeaseSigningFlowComponent,
  decorators: [
    applicationConfig({ providers: [provideAnimations()] }),
  ],
  tags: ['autodocs'],
  argTypes: {
    currentRole: { control: 'radio', options: ['landlord', 'tenant'] },
  },
};

// Export only as named — the default export is the pad meta
export const LandlordFlow: StoryObj<LeaseSigningFlowComponent> = {
  render: (args) => ({
    props: args,
    template: `
      <iu-lease-signing-flow
        leaseId="lease-001"
        currentRole="landlord"
        currentUserName="João Costa"
      />`,
  }),
};

export const TenantFlow: StoryObj<LeaseSigningFlowComponent> = {
  render: (args) => ({
    props: args,
    template: `
      <iu-lease-signing-flow
        leaseId="lease-002"
        currentRole="tenant"
        currentUserName="Maria Silva"
      />`,
  }),
};
