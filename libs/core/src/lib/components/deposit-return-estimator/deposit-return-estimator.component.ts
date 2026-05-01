import {
  Component, ChangeDetectionStrategy, inject, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DepositReturnService, DamageCategory } from '../../services/deposit-return.service';

interface CategoryMeta {
  readonly id: DamageCategory;
  readonly label: string;
  readonly icon: string;
}

const CATEGORIES: ReadonlyArray<CategoryMeta> = [
  { id: 'cleaning',         label: 'Limpeza',          icon: '🧽' },
  { id: 'repairs',          label: 'Reparações',       icon: '🔧' },
  { id: 'unpaid_rent',      label: 'Renda em dívida',  icon: '💶' },
  { id: 'unpaid_utilities', label: 'Despesas em dívida', icon: '💡' },
  { id: 'other',            label: 'Outros',           icon: '📋' },
];

/**
 * Caução return estimator for the Portuguese rental market (NRAU art. 13.º).
 *
 * Lets a landlord (or tenant simulating) declare the original deposit and add
 * itemised deductions (cleaning, repairs, unpaid rent/utilities, other) plus
 * an optional admin withholding %. The component shows the amount returnable
 * to the tenant, breakdown by category and a shortfall flag if deductions
 * exceed the deposit.
 *
 * State is kept in {@link DepositReturnService}; component is purely view.
 *
 * @example
 * <iu-deposit-return-estimator />
 */
@Component({
  selector: 'iu-deposit-return-estimator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="dre-root">
      <header class="dre-header">
        <div>
          <h2 class="dre-title">Devolução de Caução</h2>
          <p class="dre-subtitle">Calcula quanto devolver ao inquilino · NRAU art. 13.º</p>
        </div>
      </header>

      <section class="dre-top">
        <label class="dre-field">
          <span class="dre-label">Caução original (€)</span>
          <input
            type="number" min="0" step="50"
            class="dre-input"
            [value]="svc.caucaoOriginal()"
            (input)="onCaucao($event)"
          />
        </label>

        <label class="dre-field">
          <span class="dre-label">Retenção administrativa (%)</span>
          <span class="dre-helper">Opcional · custos diversos sem item próprio</span>
          <input
            type="number" min="0" max="100" step="1"
            class="dre-input"
            [value]="svc.withholdingPct()"
            (input)="onWithholding($event)"
          />
        </label>
      </section>

      <section class="dre-add">
        <h3 class="dre-section-title">Adicionar dedução</h3>
        <div class="dre-add-grid">
          <input
            type="text"
            class="dre-input"
            placeholder="Descrição (ex: pintura quarto)"
            [value]="draftLabel()"
            (input)="setLabel($event)"
          />
          <input
            type="number" min="0" step="10"
            class="dre-input"
            placeholder="Custo (€)"
            [value]="draftCost()"
            (input)="setCost($event)"
          />
          <select
            class="dre-input"
            [value]="draftCategory()"
            (change)="setCategory($event)"
          >
            @for (c of categories; track c.id) {
              <option [value]="c.id">{{ c.icon }} {{ c.label }}</option>
            }
          </select>
          <button type="button" class="dre-add-btn" (click)="addItem()" [disabled]="!canAdd()">
            + Adicionar
          </button>
        </div>
      </section>

      <section class="dre-items">
        <h3 class="dre-section-title">
          Deduções itemizadas
          <span class="dre-section-count">{{ svc.damageItems().length }}</span>
        </h3>

        @if (svc.damageItems().length === 0) {
          <p class="dre-empty">Sem deduções. A caução completa será devolvida.</p>
        } @else {
          <ul class="dre-list">
            @for (it of svc.damageItems(); track it.id) {
              <li class="dre-item">
                <span class="dre-item-icon">{{ iconFor(it.category) }}</span>
                <span class="dre-item-label">{{ it.label }}</span>
                <span class="dre-item-cat">{{ labelFor(it.category) }}</span>
                <span class="dre-item-cost">{{ it.cost | number:'1.0-2' }} €</span>
                <button
                  type="button"
                  class="dre-item-remove"
                  (click)="svc.removeItem(it.id)"
                  aria-label="Remover">×</button>
              </li>
            }
          </ul>
        }
      </section>

      <section class="dre-summary" [class.dre-summary--shortfall]="svc.hasShortfall()">
        <div class="dre-sum-row">
          <span>Caução original</span>
          <strong>{{ svc.caucaoOriginal() | number:'1.0-2' }} €</strong>
        </div>
        <div class="dre-sum-row">
          <span>Total deduções itemizadas</span>
          <strong>− {{ svc.itemsTotal() | number:'1.0-2' }} €</strong>
        </div>
        @if (svc.withholdingPct() > 0) {
          <div class="dre-sum-row">
            <span>Retenção {{ svc.withholdingPct() }}%</span>
            <strong>− {{ svc.withholdingAmount() | number:'1.0-2' }} €</strong>
          </div>
        }
        <div class="dre-sum-row dre-sum-row--total">
          <span>Devolver ao inquilino</span>
          <strong>{{ svc.returnAmount() | number:'1.0-2' }} €</strong>
        </div>
        <div class="dre-sum-pct">
          {{ svc.returnPct() }}% da caução ·
          @if (svc.hasShortfall()) {
            <span class="dre-shortfall">Deduções excedem caução em {{ (svc.totalDeductions() - svc.caucaoOriginal()) | number:'1.0-2' }} €</span>
          } @else {
            Devolução conforme art. 13.º NRAU
          }
        </div>
      </section>

      @if (svc.byCategory().size > 0) {
        <section class="dre-breakdown">
          <h3 class="dre-section-title">Por categoria</h3>
          <div class="dre-breakdown-grid">
            @for (entry of categoryEntries(); track entry.id) {
              <div class="dre-breakdown-cell">
                <span class="dre-breakdown-icon">{{ entry.icon }}</span>
                <div class="dre-breakdown-text">
                  <span class="dre-breakdown-label">{{ entry.label }}</span>
                  <strong class="dre-breakdown-value">{{ entry.value | number:'1.0-2' }} €</strong>
                </div>
              </div>
            }
          </div>
        </section>
      }

      <footer class="dre-footer">
        <button type="button" class="dre-reset" (click)="svc.reset()">Reset</button>
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .dre-root {
      background: var(--md-sys-color-surface-container, #fff);
      border-radius: 16px;
      padding: 24px;
      box-shadow: var(--md-sys-elevation-level1, 0 1px 3px rgba(0,0,0,.12));
      max-width: 920px;
      font-family: var(--md-sys-typescale-body-medium-font, system-ui, sans-serif);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .dre-header { }
    .dre-title {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .dre-subtitle {
      margin: 4px 0 0;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .dre-section-title {
      margin: 0 0 8px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .dre-section-count {
      background: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-on-secondary-container, #1d192b);
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 10px;
    }

    .dre-top {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .dre-field { display: flex; flex-direction: column; gap: 4px; }
    .dre-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .dre-helper {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .dre-input {
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 15px;
      font-family: inherit;
    }
    .dre-input:focus {
      outline: none;
      border-color: var(--md-sys-color-primary, #6750a4);
      border-width: 2px;
      padding: 9px 11px;
    }

    .dre-add-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1.2fr auto;
      gap: 8px;
    }
    .dre-add-btn {
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
      border: none;
      border-radius: 20px;
      padding: 0 18px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .dre-add-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .dre-empty {
      margin: 0;
      padding: 16px;
      text-align: center;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 12px;
      font-size: 13px;
    }

    .dre-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .dre-item {
      display: grid;
      grid-template-columns: auto 1fr auto auto auto;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 8px;
    }
    .dre-item-icon { font-size: 18px; }
    .dre-item-label {
      font-size: 14px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .dre-item-cat {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      background: var(--md-sys-color-surface, #fff);
      padding: 2px 8px;
      border-radius: 10px;
    }
    .dre-item-cost {
      font-size: 14px;
      font-weight: 600;
      color: var(--md-sys-color-error, #b3261e);
    }
    .dre-item-remove {
      background: transparent;
      border: none;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: 20px;
      cursor: pointer;
      width: 24px;
      height: 24px;
      border-radius: 50%;
    }
    .dre-item-remove:hover {
      background: var(--md-sys-color-error-container, #f9dedc);
      color: var(--md-sys-color-on-error-container, #410e0b);
    }

    .dre-summary {
      background: var(--md-sys-color-primary-container, #eaddff);
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .dre-summary--shortfall {
      background: #FFEBEE;
    }
    .dre-sum-row {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      color: var(--md-sys-color-on-primary-container, #21005d);
    }
    .dre-sum-row--total {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid rgba(0,0,0,.12);
      font-size: 18px;
    }
    .dre-sum-pct {
      margin-top: 4px;
      font-size: 12px;
      color: var(--md-sys-color-on-primary-container, #21005d);
      opacity: .85;
    }
    .dre-shortfall {
      color: var(--md-sys-color-error, #b3261e);
      font-weight: 600;
    }

    .dre-breakdown-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
    }
    .dre-breakdown-cell {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 10px;
    }
    .dre-breakdown-icon { font-size: 22px; }
    .dre-breakdown-text { display: flex; flex-direction: column; }
    .dre-breakdown-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .dre-breakdown-value {
      font-size: 16px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .dre-footer {
      display: flex;
      justify-content: flex-end;
    }
    .dre-reset {
      background: transparent;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      padding: 8px 18px;
      border-radius: 20px;
      font-size: 13px;
      cursor: pointer;
    }
    .dre-reset:hover {
      background: var(--md-sys-color-surface-container, #f3edf7);
    }

    @media (max-width: 720px) {
      .dre-top { grid-template-columns: 1fr; }
      .dre-add-grid { grid-template-columns: 1fr; }
      .dre-item { grid-template-columns: auto 1fr auto; row-gap: 4px; }
      .dre-item-cat { grid-column: 2; }
      .dre-item-remove { grid-row: 1; }
    }
  `],
})
export class DepositReturnEstimatorComponent {
  protected readonly svc = inject(DepositReturnService);

  protected readonly categories = CATEGORIES;

  protected readonly draftLabel = signal<string>('');
  protected readonly draftCost = signal<number>(0);
  protected readonly draftCategory = signal<DamageCategory>('cleaning');

  protected canAdd(): boolean {
    return this.draftLabel().trim().length > 0 && this.draftCost() > 0;
  }

  protected setLabel(e: Event): void {
    this.draftLabel.set((e.target as HTMLInputElement).value);
  }

  protected setCost(e: Event): void {
    const n = Number((e.target as HTMLInputElement).value);
    this.draftCost.set(Number.isFinite(n) && n >= 0 ? n : 0);
  }

  protected setCategory(e: Event): void {
    this.draftCategory.set((e.target as HTMLSelectElement).value as DamageCategory);
  }

  protected addItem(): void {
    if (!this.canAdd()) return;
    this.svc.addItem({
      label: this.draftLabel(),
      cost: this.draftCost(),
      category: this.draftCategory(),
    });
    this.draftLabel.set('');
    this.draftCost.set(0);
  }

  protected onCaucao(e: Event): void {
    const n = Number((e.target as HTMLInputElement).value);
    this.svc.setCaucao(n);
  }

  protected onWithholding(e: Event): void {
    const n = Number((e.target as HTMLInputElement).value);
    this.svc.setWithholdingPct(n);
  }

  protected iconFor(cat: DamageCategory): string {
    return CATEGORIES.find(c => c.id === cat)?.icon ?? '📋';
  }

  protected labelFor(cat: DamageCategory): string {
    return CATEGORIES.find(c => c.id === cat)?.label ?? cat;
  }

  protected categoryEntries(): Array<{ id: DamageCategory; label: string; icon: string; value: number }> {
    const map = this.svc.byCategory();
    return CATEGORIES
      .filter(c => map.has(c.id))
      .map(c => ({ id: c.id, label: c.label, icon: c.icon, value: map.get(c.id) ?? 0 }));
  }
}
