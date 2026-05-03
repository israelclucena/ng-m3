import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import {
  InsuranceTrackerComponent,
  InsuranceTrackerService,
} from '@israel-ui/core';

/** Today's date used by every story so expiry maths stay deterministic. */
const TODAY = '2026-05-03';
const ISO = (offsetDays: number): string => {
  const d = Date.parse(TODAY) + offsetDays * 86_400_000;
  return new Date(d).toISOString().slice(0, 10);
};

@Component({
  selector: 'iu-it-story-default',
  standalone: true,
  imports: [InsuranceTrackerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-insurance-tracker />`,
})
class WrapperDefault {
  constructor() {
    const svc = inject(InsuranceTrackerService);
    svc.reset();
    svc.today.set(TODAY);
    svc.addPolicy({
      propertyId: 'P-001',
      insurer: 'Fidelidade',
      policyNumber: 'FID-2026-0001',
      type: 'multirriscos',
      startDate: ISO(-300),
      endDate: ISO(65),
      premium: 240,
    });
    svc.addPolicy({
      propertyId: 'P-002',
      insurer: 'Allianz',
      policyNumber: 'ALZ-2025-7788',
      type: 'rc',
      startDate: ISO(-330),
      endDate: ISO(15),
      premium: 75,
    });
    svc.addPolicy({
      propertyId: 'P-003',
      insurer: 'Tranquilidade',
      policyNumber: 'TRQ-2024-4421',
      type: 'conteudo',
      startDate: ISO(-400),
      endDate: ISO(-20),
      premium: 110,
    });
    svc.addPolicy({
      propertyId: 'P-001',
      insurer: 'Lusitânia',
      policyNumber: 'LUS-2026-0033',
      type: 'rc',
      startDate: ISO(-100),
      endDate: ISO(265),
      premium: 60,
    });
  }
}

@Component({
  selector: 'iu-it-story-expired',
  standalone: true,
  imports: [InsuranceTrackerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-insurance-tracker />`,
})
class WrapperAllExpired {
  constructor() {
    const svc = inject(InsuranceTrackerService);
    svc.reset();
    svc.today.set(TODAY);
    svc.addPolicy({
      propertyId: 'P-001',
      insurer: 'Fidelidade',
      policyNumber: 'FID-2024-9912',
      type: 'multirriscos',
      startDate: ISO(-450),
      endDate: ISO(-85),
      premium: 240,
    });
    svc.addPolicy({
      propertyId: 'P-002',
      insurer: 'Generali',
      policyNumber: 'GEN-2024-2233',
      type: 'rc',
      startDate: ISO(-400),
      endDate: ISO(-35),
      premium: 80,
    });
    svc.addPolicy({
      propertyId: 'P-003',
      insurer: 'Ageas',
      policyNumber: 'AGE-2024-6655',
      type: 'conteudo',
      startDate: ISO(-500),
      endDate: ISO(-130),
      premium: 95,
    });
  }
}

@Component({
  selector: 'iu-it-story-empty',
  standalone: true,
  imports: [InsuranceTrackerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-insurance-tracker />`,
})
class WrapperEmpty {
  constructor() {
    const svc = inject(InsuranceTrackerService);
    svc.reset();
    svc.today.set(TODAY);
  }
}

const meta: Meta = {
  title: 'Sprint 043/InsuranceTracker',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'UI consumer for `InsuranceTrackerService`. Three-tab layout (Activas / A expirar / Expiradas) ' +
          'with policy cards (multirriscos, RC, conteúdo) and renew/remove quick actions. Modal form for ' +
          'adding new policies. Built only with `--md-sys-*` tokens (no `@material/web`).',
      },
    },
  },
};
export default meta;

/** Mixed bucket: 2 activas, 1 a expirar (15 dias), 1 expirada. */
export const Default: StoryObj = {
  render: () => ({ template: `<iu-it-story-default />` }),
  decorators: [moduleMetadata({ imports: [WrapperDefault] })],
};

/** Todas as apólices fora do prazo — renew CTA dominante. */
export const AllExpired: StoryObj = {
  render: () => ({ template: `<iu-it-story-expired />` }),
  decorators: [moduleMetadata({ imports: [WrapperAllExpired] })],
  args: {},
  play: async () => {
    // Default tab is "active"; users switch manually in the rendered story.
  },
};

/** Sem apólices — onboarding card visível. */
export const EmptyState: StoryObj = {
  render: () => ({ template: `<iu-it-story-empty />` }),
  decorators: [moduleMetadata({ imports: [WrapperEmpty] })],
};
