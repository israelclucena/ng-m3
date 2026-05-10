import {
  Component, ChangeDetectionStrategy, inject, input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  PropertyInventoryService,
} from '../../services/property-inventory.service';
import type {
  InventoryItem,
  InventoryItemCondition,
  InventoryItemCategory,
  ConditionDeltaSeverity,
} from '../../services/property-inventory.service';

const CONDITION_OPTIONS: ReadonlyArray<{ value: InventoryItemCondition; label: string }> = [
  { value: 'new',      label: 'Novo' },
  { value: 'good',     label: 'Bom' },
  { value: 'fair',     label: 'Razoável' },
  { value: 'worn',     label: 'Desgastado' },
  { value: 'damaged',  label: 'Danificado' },
  { value: 'missing',  label: 'Em falta' },
];

const CATEGORY_LABEL: Record<InventoryItemCategory, string> = {
  furniture:   'Mobiliário',
  appliance:   'Electrodomésticos',
  electronics: 'Electrónica',
  kitchenware: 'Loiça/Cozinha',
  textiles:    'Têxteis',
  fixture:     'Apetrechos',
};

const SEVERITY_LABEL: Record<ConditionDeltaSeverity, string> = {
  unchanged: 'Sem alteração',
  wear:      'Desgaste normal',
  damage:    'Dano dedutível',
  loss:      'Em falta',
};

const SEVERITY_BADGE_CLASS: Record<ConditionDeltaSeverity, string> = {
  unchanged: 'sev-unchanged',
  wear:      'sev-wear',
  damage:    'sev-damage',
  loss:      'sev-loss',
};

/**
 * InventoryChecklistComponent — descritivo itemizado do recheio do imóvel.
 *
 * Apresenta items agrupados por sala com a condição registada no move-in,
 * dropdown para registar condição no move-out, e linha de delta agregada
 * com retenção sugerida (alimenta `DepositReturnEstimator`).
 *
 * Sem componentes `@material/web` — só M3 design tokens + native primitives.
 *
 * @example
 * <iu-inventory-checklist [moveOutMode]="true" />
 */
@Component({
  selector: 'iu-inventory-checklist',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="inv-root">

      <header class="inv-header">
        <div>
          <h2 class="inv-title">Inventário do Recheio</h2>
          <p class="inv-subtitle">
            {{ svc.totalItems() }} items · {{ svc.totalUnits() }} unidades · €{{ svc.totalReplacementCost() | number:'1.0-0' }} valor reposição
            @if (moveOutMode()) {
              · {{ svc.moveOutInspectionPct() }}% inspeccionado
            }
          </p>
        </div>
        @if (moveOutMode() && svc.deltaLines().length > 0) {
          <div class="inv-deduction-pill" [class.zero]="svc.totalSuggestedDeduction() === 0">
            <span class="inv-deduction-label">Retenção sugerida</span>
            <span class="inv-deduction-amount">€{{ svc.totalSuggestedDeduction() | number:'1.2-2' }}</span>
          </div>
        }
      </header>

      @if (moveOutMode()) {
        <div class="inv-bar">
          <div class="inv-bar-fill" [style.width.%]="svc.moveOutInspectionPct()"></div>
        </div>
      }

      @for (group of svc.byRoom(); track group.room) {
        <section class="inv-room">
          <header class="inv-room-header">
            <h3 class="inv-room-title">{{ group.room }}</h3>
            <span class="inv-room-meta">
              {{ group.items.length }} items · €{{ group.totalReplacementCost | number:'1.0-0' }}
            </span>
          </header>

          <ul class="inv-list">
            @for (item of group.items; track item.id) {
              <li class="inv-item">
                <div class="inv-item-main">
                  <span class="inv-item-label">{{ item.label }}</span>
                  <span class="inv-item-meta">
                    {{ categoryLabel(item.category) }}
                    · qtd {{ item.quantity }}
                    · €{{ item.replacementCostEur | number:'1.0-0' }}/un.
                  </span>
                  @if (item.notes) {
                    <span class="inv-item-notes">{{ item.notes }}</span>
                  }
                </div>

                <div class="inv-item-conditions">
                  <span class="inv-cond-tag inv-cond-in">
                    Entrada: {{ conditionLabel(item.conditionAtMoveIn) }}
                  </span>

                  @if (moveOutMode()) {
                    <label class="inv-cond-select">
                      <span class="inv-cond-select-label">Saída:</span>
                      <select
                        [value]="item.conditionAtMoveOut ?? ''"
                        (change)="onConditionChange(item, $event)"
                        [attr.aria-label]="'Condição de saída para ' + item.label"
                      >
                        <option value="" disabled>—</option>
                        @for (opt of conditionOptions; track opt.value) {
                          <option [value]="opt.value">{{ opt.label }}</option>
                        }
                      </select>
                    </label>
                  }
                </div>
              </li>
            }
          </ul>
        </section>
      }

      @if (moveOutMode() && svc.deltaLines().length > 0) {
        <section class="inv-delta">
          <h3 class="inv-delta-title">Delta de Condição</h3>
          <ul class="inv-delta-list">
            @for (line of svc.deltaLines(); track line.item.id) {
              <li class="inv-delta-item">
                <span class="inv-delta-label">{{ line.item.label }}</span>
                <span class="inv-sev-badge" [class]="severityClass(line.severity)">
                  {{ severityLabel(line.severity) }}
                </span>
                <span class="inv-delta-amount" [class.zero]="line.suggestedDeduction === 0">
                  €{{ line.suggestedDeduction | number:'1.2-2' }}
                </span>
              </li>
            }
          </ul>
        </section>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .inv-root {
      background: var(--md-sys-color-surface-container, #fff);
      border-radius: 16px;
      padding: 24px;
      box-shadow: var(--md-sys-elevation-level1, 0 1px 3px rgba(0,0,0,.12));
      max-width: 880px;
      font-family: var(--md-sys-typescale-body-medium-font, system-ui, sans-serif);
    }

    .inv-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 14px;
    }
    .inv-title {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .inv-subtitle {
      margin: 4px 0 0;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .inv-deduction-pill {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      padding: 8px 14px;
      border-radius: 12px;
      background: var(--md-sys-color-error-container, #f9dedc);
      color: var(--md-sys-color-on-error-container, #410e0b);
      flex-shrink: 0;
    }
    .inv-deduction-pill.zero {
      background: #E8F5E9;
      color: #2E7D32;
    }
    .inv-deduction-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .inv-deduction-amount {
      font-size: 18px;
      font-weight: 700;
    }

    .inv-bar {
      width: 100%;
      height: 6px;
      background: var(--md-sys-color-surface-container-highest, #e6e0e9);
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 24px;
    }
    .inv-bar-fill {
      height: 100%;
      background: var(--md-sys-color-primary, #6750a4);
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .inv-room { margin-bottom: 22px; }
    .inv-room:last-child { margin-bottom: 0; }
    .inv-room-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .inv-room-title {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .inv-room-meta {
      font-size: 12px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .inv-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .inv-item {
      display: flex;
      gap: 16px;
      padding: 10px 12px;
      border-radius: 10px;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .inv-item-main {
      flex: 1 1 240px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .inv-item-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .inv-item-meta {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .inv-item-notes {
      font-size: 12px;
      font-style: italic;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .inv-item-conditions {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }
    .inv-cond-tag {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 8px;
      background: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
    }
    .inv-cond-select {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .inv-cond-select select {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      cursor: pointer;
    }

    .inv-delta {
      margin-top: 22px;
      padding-top: 14px;
      border-top: 2px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .inv-delta-title {
      margin: 0 0 10px;
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .inv-delta-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .inv-delta-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 6px 10px;
      border-radius: 8px;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
    }
    .inv-delta-label { flex: 1; font-size: 13px; }
    .inv-delta-amount {
      font-size: 13px;
      font-weight: 700;
      color: var(--md-sys-color-error, #b3261e);
      min-width: 70px;
      text-align: right;
    }
    .inv-delta-amount.zero {
      color: #2E7D32;
    }

    .inv-sev-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .sev-unchanged {
      background: #E8F5E9;
      color: #2E7D32;
    }
    .sev-wear {
      background: #FFF8E1;
      color: #B26A00;
    }
    .sev-damage {
      background: #FFE6E0;
      color: #B3261E;
    }
    .sev-loss {
      background: #FFCDD2;
      color: #8A1414;
    }
  `],
})
export class InventoryChecklistComponent {
  readonly svc = inject(PropertyInventoryService);

  /** Quando true, mostra dropdowns de condição de saída + delta. */
  readonly moveOutMode = input<boolean>(false);

  readonly conditionOptions = CONDITION_OPTIONS;

  conditionLabel(c: InventoryItemCondition): string {
    return CONDITION_OPTIONS.find(o => o.value === c)?.label ?? c;
  }

  categoryLabel(c: InventoryItemCategory): string {
    return CATEGORY_LABEL[c];
  }

  severityLabel(s: ConditionDeltaSeverity): string {
    return SEVERITY_LABEL[s];
  }

  severityClass(s: ConditionDeltaSeverity): string {
    return SEVERITY_BADGE_CLASS[s];
  }

  onConditionChange(item: InventoryItem, ev: Event): void {
    const value = (ev.target as HTMLSelectElement).value as InventoryItemCondition | '';
    if (!value) return;
    this.svc.setMoveOutCondition(item.id, value);
  }
}
