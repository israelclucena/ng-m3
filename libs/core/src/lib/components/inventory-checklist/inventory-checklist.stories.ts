import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { inject, Component, ChangeDetectionStrategy } from '@angular/core';
import { InventoryChecklistComponent, PropertyInventoryService } from '@israel-ui/core';

@Component({
  selector: 'iu-inventory-story-wrapper',
  standalone: true,
  imports: [InventoryChecklistComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-inventory-checklist />`,
})
class WrapperMoveIn {
  constructor() {
    inject(PropertyInventoryService).resetAll();
  }
}

@Component({
  selector: 'iu-inventory-story-wrapper-moveout',
  standalone: true,
  imports: [InventoryChecklistComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-inventory-checklist [moveOutMode]="true" />`,
})
class WrapperMoveOutPartial {
  constructor() {
    const svc = inject(PropertyInventoryService);
    svc.resetAll();
    // Simulate partial move-out inspection: most items still have move-in
    // condition, a few are tagged with damage/missing for the delta panel.
    svc.setMoveOutCondition('i-frigo', 'good');         // unchanged
    svc.setMoveOutCondition('i-fogao', 'fair');         // 1 step → wear
    svc.setMoveOutCondition('i-sofa', 'damaged');       // 2 steps → damage
    svc.setMoveOutCondition('i-tv', 'missing');         // missing → loss
    svc.setMoveOutCondition('i-microondas', 'good');    // unchanged
    svc.setMoveOutCondition('i-cortinas', 'worn');      // 2 steps → damage
  }
}

@Component({
  selector: 'iu-inventory-story-wrapper-clean',
  standalone: true,
  imports: [InventoryChecklistComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-inventory-checklist [moveOutMode]="true" />`,
})
class WrapperMoveOutClean {
  constructor() {
    const svc = inject(PropertyInventoryService);
    svc.resetAll();
    // All items inspected and either unchanged or wear → zero deduction.
    for (const item of svc.items()) {
      svc.setMoveOutCondition(item.id, item.conditionAtMoveIn);
    }
  }
}

const meta: Meta = {
  title: 'Sprint 050/InventoryChecklist',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Inventário itemizado do recheio do imóvel — fecha o triângulo `PropertyInspection` × `PropertyInventory` × `DepositReturnEstimator`. NRAU art. 5.º exige descritivo prévio para defender retenções de caução; este service automatiza a delta move-in → move-out e sugere retenções (50% reposição para danos, 100% para perdas; desgaste normal não retém). Built only with `--md-sys-*` tokens (no @material/web components).',
      },
    },
  },
};

export default meta;

/** Estado inicial — vistoria de entrada com 15 items pré-povoados. */
export const MoveIn: StoryObj = {
  render: () => ({ template: `<iu-inventory-story-wrapper />` }),
  decorators: [
    moduleMetadata({ imports: [WrapperMoveIn] }),
  ],
};

/** Vistoria de saída com 6 items inspeccionados — mostra desgaste, dano e perda. */
export const MoveOutWithDeductions: StoryObj = {
  render: () => ({ template: `<iu-inventory-story-wrapper-moveout />` }),
  decorators: [
    moduleMetadata({ imports: [WrapperMoveOutPartial] }),
  ],
};

/** Saída perfeita — todos os items conservados; retenção sugerida = €0. */
export const MoveOutClean: StoryObj = {
  render: () => ({ template: `<iu-inventory-story-wrapper-clean />` }),
  decorators: [
    moduleMetadata({ imports: [WrapperMoveOutClean] }),
  ],
};
