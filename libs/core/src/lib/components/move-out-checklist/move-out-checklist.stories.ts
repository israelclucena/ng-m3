import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { inject, Component, ChangeDetectionStrategy } from '@angular/core';
import { MoveOutChecklistComponent, MoveOutChecklistService } from '@israel-ui/core';

/**
 * Wrapper that resets the singleton service to a known state per story.
 * Storybook reuses providers across stories — without this each story
 * inherits the previous one's checked items.
 */
@Component({
  selector: 'iu-move-out-story-wrapper',
  standalone: true,
  imports: [MoveOutChecklistComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-move-out-checklist />`,
})
class WrapperEmpty {
  constructor() {
    inject(MoveOutChecklistService).resetAll();
  }
}

@Component({
  selector: 'iu-move-out-story-wrapper-progress',
  standalone: true,
  imports: [MoveOutChecklistComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-move-out-checklist />`,
})
class WrapperInProgress {
  constructor() {
    const svc = inject(MoveOutChecklistService);
    svc.resetAll();
    // Tick a representative subset (~50%) — denúncia sent + admin staged,
    // utilities cancelled, walk-through and key-return still pending.
    [
      'denuncia-contrato',
      'agendar-vistoria',
      'electricity-cancel',
      'water-cancel',
      'internet-cancel',
      'movers',
      'donate-discard',
    ].forEach(id => svc.toggle(id));
  }
}

@Component({
  selector: 'iu-move-out-story-wrapper-complete',
  standalone: true,
  imports: [MoveOutChecklistComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-move-out-checklist />`,
})
class WrapperComplete {
  constructor() {
    const svc = inject(MoveOutChecklistService);
    svc.resetAll();
    svc.completeAll();
  }
}

const meta: Meta = {
  title: 'Sprint 050/MoveOutChecklist',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Tenant move-out checklist for PT rentals — symmetric counterpart to MoveInChecklist (Sprint 040). Covers contract denúncia (NRAU art. 1098.º — 30-120 day notice), utility termination, final walk-through, inventory verification, deposit reclaim (NRAU 30-day return window). Built only with `--md-sys-*` tokens (no @material/web components).',
      },
    },
  },
};

export default meta;

/** Estado inicial — todas as tarefas por completar. */
export const Empty: StoryObj = {
  render: () => ({ template: `<iu-move-out-story-wrapper />` }),
  decorators: [
    moduleMetadata({ imports: [WrapperEmpty] }),
  ],
};

/** Saída em curso — denúncia enviada, utilities terminadas, walk-through pendente. */
export const InProgress: StoryObj = {
  render: () => ({ template: `<iu-move-out-story-wrapper-progress />` }),
  decorators: [
    moduleMetadata({ imports: [WrapperInProgress] }),
  ],
};

/** Tudo feito — saída concluída, à espera de devolução de caução. */
export const Complete: StoryObj = {
  render: () => ({ template: `<iu-move-out-story-wrapper-complete />` }),
  decorators: [
    moduleMetadata({ imports: [WrapperComplete] }),
  ],
};
