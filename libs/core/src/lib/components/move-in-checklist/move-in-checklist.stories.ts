import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { inject, Component, ChangeDetectionStrategy } from '@angular/core';
import { MoveInChecklistComponent, MoveInChecklistService } from '@israel-ui/core';

/**
 * Wrapper that resets the singleton service to a known state per story.
 * Storybook reuses providers across stories — without this each story
 * inherits the previous one's checked items.
 */
@Component({
  selector: 'iu-move-in-story-wrapper',
  standalone: true,
  imports: [MoveInChecklistComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-move-in-checklist />`,
})
class WrapperEmpty {
  constructor() {
    inject(MoveInChecklistService).resetAll();
  }
}

@Component({
  selector: 'iu-move-in-story-wrapper-progress',
  standalone: true,
  imports: [MoveInChecklistComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-move-in-checklist />`,
})
class WrapperInProgress {
  constructor() {
    const svc = inject(MoveInChecklistService);
    svc.resetAll();
    // Tick a representative subset (~50%) — utilities + admin essentials done,
    // financial + logistics + inspection still pending.
    [
      'electricity-transfer',
      'water-transfer',
      'internet-install',
      'address-change-finanças',
      'address-change-bank',
      'movers',
      'rent-insurance',
    ].forEach(id => svc.toggle(id));
  }
}

@Component({
  selector: 'iu-move-in-story-wrapper-complete',
  standalone: true,
  imports: [MoveInChecklistComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-move-in-checklist />`,
})
class WrapperComplete {
  constructor() {
    const svc = inject(MoveInChecklistService);
    svc.resetAll();
    svc.completeAll();
  }
}

const meta: Meta = {
  title: 'Sprint 040/MoveInChecklist',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Tenant move-in checklist for PT rentals — utilities transfers, address updates, deposit/rent payments, key handover, walk-through. Tracks completion per category with progress meter. Built only with `--md-sys-*` tokens (no @material/web components, since the library is in maintenance mode).',
      },
    },
  },
};

export default meta;

/** Estado inicial — todas as 16 tarefas por completar. */
export const Empty: StoryObj = {
  render: () => ({ template: `<iu-move-in-story-wrapper />` }),
  decorators: [
    moduleMetadata({ imports: [WrapperEmpty] }),
  ],
};

/** Mudança em curso — utilities tratadas, financial e key-handover pendentes. */
export const InProgress: StoryObj = {
  render: () => ({ template: `<iu-move-in-story-wrapper-progress />` }),
  decorators: [
    moduleMetadata({ imports: [WrapperInProgress] }),
  ],
};

/** Tudo feito — pronto para mudar. Estado celebrativo (100%). */
export const Complete: StoryObj = {
  render: () => ({ template: `<iu-move-in-story-wrapper-complete />` }),
  decorators: [
    moduleMetadata({ imports: [WrapperComplete] }),
  ],
};
