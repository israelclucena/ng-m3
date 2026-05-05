import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { signal } from '@angular/core';
import { PortfolioComplianceMatrixComponent } from './portfolio-compliance-matrix.component';
import {
  PortfolioMockService,
  type ComplianceState,
  type PortfolioProperty,
} from '../../services/portfolio-mock.service';

const meta: Meta<PortfolioComplianceMatrixComponent> = {
  title: 'Sprint 045 (Dashboard Consumer)/PortfolioComplianceMatrix',
  component: PortfolioComplianceMatrixComponent,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Property × dimension compliance matrix. Each row a Lisbon property, columns ' +
          'cover energy certificate, insurance and lease lifecycle status. ' +
          'Cells colour-coded ok/warning/expired. Aggregate footer with % portfolio ' +
          'compliance per dimension. Priority actions panel sorts critical issues first ' +
          '(expired CE / lapsed seguro / lease escalation due).',
      },
    },
  },
};

export default meta;
type Story = StoryObj<PortfolioComplianceMatrixComponent>;

function withOverride(
  mut: (p: PortfolioProperty, idx: number) => PortfolioProperty,
) {
  return applicationConfig({
    providers: [
      {
        provide: PortfolioMockService,
        useFactory: () => {
          const base = new PortfolioMockService();
          const overridden = base.properties().map((p, i) => mut(p, i));
          return {
            ...base,
            properties: signal(overridden),
          } as unknown as PortfolioMockService;
        },
      },
    ],
  });
}

const OK_STATE: ComplianceState = 'ok';

export const Default: Story = {
  render: () => ({
    template: `<iu-portfolio-compliance-matrix />`,
  }),
};

export const AllCompliant: Story = {
  decorators: [
    withOverride((p) => ({
      ...p,
      energy: { ...p.energy, state: OK_STATE, validUntil: '2030-12-31' },
      insurance: { ...p.insurance, state: OK_STATE, validUntil: '2027-12-31' },
      lease: { ...p.lease, status: 'active' },
    })),
  ],
  render: () => ({
    template: `<iu-portfolio-compliance-matrix />`,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Override: every property forced compliant — empty actions list.',
      },
    },
  },
};

export const MultipleViolations: Story = {
  decorators: [
    withOverride((p, i) => {
      if (i % 3 === 0) {
        return {
          ...p,
          energy: { ...p.energy, state: 'expired', validUntil: '2024-01-01' },
        };
      }
      if (i % 3 === 1) {
        return {
          ...p,
          insurance: { ...p.insurance, state: 'expired', validUntil: '2024-06-15' },
        };
      }
      return {
        ...p,
        energy: { ...p.energy, state: 'warning', validUntil: '2026-06-15' },
        insurance: { ...p.insurance, state: 'warning', validUntil: '2026-06-30' },
      };
    }),
  ],
  render: () => ({
    template: `<iu-portfolio-compliance-matrix />`,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Override: expired CE on every 3rd property + expired insurance on second pattern + warnings on third — exercises critical+soon action sorting.',
      },
    },
  },
};
