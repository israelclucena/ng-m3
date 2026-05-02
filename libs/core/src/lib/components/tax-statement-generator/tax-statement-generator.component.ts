import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  TaxStatementService,
  DeductibleExpenseCategory,
} from '../../services/tax-statement.service';

interface CategoryMeta {
  readonly id: DeductibleExpenseCategory;
  readonly label: string;
  readonly icon: string;
}

const CATEGORIES: ReadonlyArray<CategoryMeta> = [
  { id: 'imi',                 label: 'IMI',              icon: '🏛️' },
  { id: 'condominio',          label: 'Condomínio',       icon: '🏢' },
  { id: 'conservacao',         label: 'Conservação',      icon: '🔧' },
  { id: 'seguro_multirriscos', label: 'Seguro',           icon: '🛡️' },
  { id: 'outros',              label: 'Outros',           icon: '📋' },
];

/**
 * IRS Categoria F (rendimentos prediais) annual statement helper for PT
 * landlords. Aggregates yearly rent income + deductible expenses, surfaces
 * gross/net income and the effective rate already retained at source —
 * exactly what is needed for Modelo 3 / Anexo F.
 *
 * State lives in {@link TaxStatementService}. Component is purely view.
 *
 * @example
 * <iu-tax-statement-generator />
 */
@Component({
  selector: 'iu-tax-statement-generator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="tsg-root">
      <header class="tsg-header">
        <div>
          <h2 class="tsg-title">Resumo Anual IRS Cat. F</h2>
          <p class="tsg-subtitle">Rendimentos prediais · Modelo 3 / Anexo F</p>
        </div>
        <div class="tsg-year-block">
          <label class="tsg-year-label">Ano</label>
          <input
            type="number" min="1990" max="2099" step="1"
            class="tsg-year-input"
            [value]="svc.year()"
            (input)="onYear($event)"
          />
        </div>
      </header>

      <!-- Summary cards -->
      <section class="tsg-summary">
        <div class="tsg-card">
          <span class="tsg-card-label">Rendimento bruto</span>
          <strong class="tsg-card-value">{{ svc.totalGrossIncome() | number:'1.2-2' }} €</strong>
          <span class="tsg-card-sub">{{ svc.rentEntries().length }} entradas</span>
        </div>
        <div class="tsg-card">
          <span class="tsg-card-label">Despesas dedutíveis</span>
          <strong class="tsg-card-value tsg-card-value--deduct">− {{ svc.totalDeductions() | number:'1.2-2' }} €</strong>
          <span class="tsg-card-sub">{{ svc.deductibleExpenses().length }} despesas</span>
        </div>
        <div class="tsg-card tsg-card--net">
          <span class="tsg-card-label">Rendimento líquido</span>
          <strong class="tsg-card-value">{{ svc.netIncome() | number:'1.2-2' }} €</strong>
          <span class="tsg-card-sub">tributável</span>
        </div>
        <div class="tsg-card">
          <span class="tsg-card-label">Retido na fonte</span>
          <strong class="tsg-card-value">{{ svc.withholdingsTotal() | number:'1.2-2' }} €</strong>
          <span class="tsg-card-sub">{{ svc.effectiveRate() | number:'1.0-2' }}% efectivo</span>
        </div>
      </section>

      <!-- Rents -->
      <section>
        <header class="tsg-section-head">
          <h3 class="tsg-section-title">
            Rendas recebidas
            <span class="tsg-count">{{ svc.rentEntries().length }}</span>
          </h3>
        </header>

        <div class="tsg-add-row">
          <input
            type="month"
            class="tsg-input"
            [value]="rentMonth()"
            (input)="setRentMonth($event)"
            aria-label="Mês de referência"
          />
          <input
            type="number" min="0" step="10"
            class="tsg-input"
            placeholder="Bruto (€)"
            [value]="rentGross()"
            (input)="setRentGross($event)"
          />
          <input
            type="number" min="0" step="1"
            class="tsg-input"
            placeholder="Retenção (€)"
            [value]="rentWithhold()"
            (input)="setRentWithhold($event)"
          />
          <button
            type="button"
            class="tsg-add-btn"
            (click)="addRent()"
            [disabled]="!canAddRent()"
          >+ Renda</button>
        </div>

        @if (svc.rentEntries().length === 0) {
          <p class="tsg-empty">Sem rendas registadas para {{ svc.year() }}.</p>
        } @else {
          <ul class="tsg-list">
            @for (r of svc.rentEntries(); track r.id) {
              <li class="tsg-rent-item">
                <span class="tsg-rent-month">{{ r.month }}</span>
                <span class="tsg-rent-gross">{{ r.grossAmount | number:'1.2-2' }} €</span>
                <span class="tsg-rent-withhold">retenção {{ r.withholding | number:'1.2-2' }} €</span>
                <button
                  type="button"
                  class="tsg-remove"
                  (click)="svc.removeRentEntry(r.id)"
                  aria-label="Remover">×</button>
              </li>
            }
          </ul>
        }
      </section>

      <!-- Expenses -->
      <section>
        <header class="tsg-section-head">
          <h3 class="tsg-section-title">
            Despesas dedutíveis
            <span class="tsg-count">{{ svc.deductibleExpenses().length }}</span>
          </h3>
        </header>

        <div class="tsg-add-row tsg-add-row--exp">
          <input
            type="text"
            class="tsg-input"
            placeholder="Descrição"
            [value]="expDescription()"
            (input)="setExpDescription($event)"
          />
          <input
            type="number" min="0" step="1"
            class="tsg-input"
            placeholder="Valor (€)"
            [value]="expAmount()"
            (input)="setExpAmount($event)"
          />
          <select
            class="tsg-input"
            [value]="expCategory()"
            (change)="setExpCategory($event)"
          >
            @for (c of categories; track c.id) {
              <option [value]="c.id">{{ c.icon }} {{ c.label }}</option>
            }
          </select>
          <input
            type="date"
            class="tsg-input"
            [value]="expDate()"
            (input)="setExpDate($event)"
          />
          <button
            type="button"
            class="tsg-add-btn"
            (click)="addExpense()"
            [disabled]="!canAddExpense()"
          >+ Despesa</button>
        </div>

        @if (svc.deductibleExpenses().length === 0) {
          <p class="tsg-empty">Sem despesas registadas. Adiciona IMI, condomínio, etc.</p>
        } @else {
          <ul class="tsg-list">
            @for (e of svc.deductibleExpenses(); track e.id) {
              <li class="tsg-exp-item">
                <span class="tsg-exp-icon">{{ iconFor(e.category) }}</span>
                <span class="tsg-exp-desc">{{ e.description }}</span>
                <span class="tsg-exp-cat">{{ labelFor(e.category) }}</span>
                <span class="tsg-exp-date">{{ e.date }}</span>
                <span class="tsg-exp-amount">{{ e.amount | number:'1.2-2' }} €</span>
                <button
                  type="button"
                  class="tsg-remove"
                  (click)="svc.removeExpense(e.id)"
                  aria-label="Remover">×</button>
              </li>
            }
          </ul>
        }
      </section>

      <!-- Per-category breakdown -->
      @if (svc.byCategory().size > 0) {
        <section>
          <header class="tsg-section-head">
            <h3 class="tsg-section-title">Por categoria de despesa</h3>
          </header>
          <div class="tsg-breakdown">
            @for (entry of categoryEntries(); track entry.id) {
              <div class="tsg-breakdown-cell">
                <span class="tsg-breakdown-icon">{{ entry.icon }}</span>
                <div class="tsg-breakdown-text">
                  <span class="tsg-breakdown-label">{{ entry.label }}</span>
                  <strong class="tsg-breakdown-value">{{ entry.value | number:'1.2-2' }} €</strong>
                </div>
              </div>
            }
          </div>
        </section>
      }

      <footer class="tsg-footer">
        <button type="button" class="tsg-reset" (click)="svc.reset()">Reset</button>
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .tsg-root {
      background: var(--md-sys-color-surface-container, #fff);
      border-radius: 16px;
      padding: 24px;
      box-shadow: var(--md-sys-elevation-level1, 0 1px 3px rgba(0,0,0,.12));
      max-width: 980px;
      font-family: var(--md-sys-typescale-body-medium-font, system-ui, sans-serif);
      display: flex;
      flex-direction: column;
      gap: 22px;
    }

    .tsg-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }
    .tsg-title {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .tsg-subtitle {
      margin: 4px 0 0;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .tsg-year-block {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }
    .tsg-year-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .tsg-year-input {
      width: 100px;
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      border-radius: 8px;
      padding: 6px 10px;
      text-align: center;
      font-size: 18px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      background: var(--md-sys-color-surface, #fff);
    }

    .tsg-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }
    .tsg-card {
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 12px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .tsg-card--net {
      background: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
    }
    .tsg-card-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .tsg-card--net .tsg-card-label { color: inherit; opacity: 0.85; }
    .tsg-card-value {
      font-size: 22px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .tsg-card--net .tsg-card-value { color: inherit; }
    .tsg-card-value--deduct { color: var(--md-sys-color-error, #b3261e); }
    .tsg-card-sub {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .tsg-card--net .tsg-card-sub { color: inherit; opacity: 0.7; }

    .tsg-section-head { margin-bottom: 8px; }
    .tsg-section-title {
      margin: 0;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .tsg-count {
      background: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-on-secondary-container, #1d192b);
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 10px;
    }

    .tsg-add-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr auto;
      gap: 8px;
      margin-bottom: 10px;
    }
    .tsg-add-row--exp {
      grid-template-columns: 2fr 1fr 1.2fr 1.2fr auto;
    }
    .tsg-input {
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 14px;
      font-family: inherit;
    }
    .tsg-input:focus {
      outline: none;
      border-color: var(--md-sys-color-primary, #6750a4);
      border-width: 2px;
      padding: 7px 9px;
    }
    .tsg-add-btn {
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
      border: none;
      border-radius: 20px;
      padding: 0 16px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .tsg-add-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .tsg-empty {
      margin: 0;
      padding: 12px;
      text-align: center;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 10px;
      font-size: 12px;
    }

    .tsg-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .tsg-rent-item {
      display: grid;
      grid-template-columns: auto 1fr auto auto;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 8px;
      font-size: 14px;
    }
    .tsg-rent-month {
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .tsg-rent-gross {
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .tsg-rent-withhold {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .tsg-exp-item {
      display: grid;
      grid-template-columns: auto 1fr auto auto auto auto;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 8px;
      font-size: 13px;
    }
    .tsg-exp-icon { font-size: 18px; }
    .tsg-exp-desc { color: var(--md-sys-color-on-surface, #1c1b1f); }
    .tsg-exp-cat {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      background: var(--md-sys-color-surface, #fff);
      padding: 2px 8px;
      border-radius: 10px;
    }
    .tsg-exp-date {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .tsg-exp-amount {
      font-weight: 600;
      color: var(--md-sys-color-error, #b3261e);
    }

    .tsg-remove {
      background: transparent;
      border: none;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: 18px;
      cursor: pointer;
      width: 24px;
      height: 24px;
      border-radius: 50%;
    }
    .tsg-remove:hover {
      background: var(--md-sys-color-error-container, #f9dedc);
      color: var(--md-sys-color-on-error-container, #410e0b);
    }

    .tsg-breakdown {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 10px;
    }
    .tsg-breakdown-cell {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 10px;
    }
    .tsg-breakdown-icon { font-size: 22px; }
    .tsg-breakdown-text { display: flex; flex-direction: column; }
    .tsg-breakdown-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .tsg-breakdown-value {
      font-size: 16px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .tsg-footer {
      display: flex;
      justify-content: flex-end;
    }
    .tsg-reset {
      background: transparent;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      padding: 8px 18px;
      border-radius: 20px;
      font-size: 13px;
      cursor: pointer;
    }

    @media (max-width: 720px) {
      .tsg-add-row,
      .tsg-add-row--exp { grid-template-columns: 1fr; }
      .tsg-rent-item { grid-template-columns: auto 1fr auto; }
      .tsg-rent-withhold { grid-column: 2; }
      .tsg-exp-item { grid-template-columns: auto 1fr auto; }
      .tsg-exp-cat,
      .tsg-exp-date,
      .tsg-exp-amount { grid-column: 2; }
    }
  `],
})
export class TaxStatementGeneratorComponent {
  protected readonly svc = inject(TaxStatementService);
  protected readonly categories = CATEGORIES;

  protected readonly rentMonth     = signal<string>('');
  protected readonly rentGross     = signal<number>(0);
  protected readonly rentWithhold  = signal<number>(0);

  protected readonly expDescription = signal<string>('');
  protected readonly expAmount      = signal<number>(0);
  protected readonly expCategory    = signal<DeductibleExpenseCategory>('imi');
  protected readonly expDate        = signal<string>('');

  protected canAddRent(): boolean {
    return this.rentMonth().length > 0 && this.rentGross() > 0;
  }

  protected canAddExpense(): boolean {
    return this.expDescription().trim().length > 0
      && this.expAmount() > 0
      && this.expDate().length > 0;
  }

  protected onYear(e: Event): void {
    const n = Number((e.target as HTMLInputElement).value);
    this.svc.setYear(n);
  }

  protected setRentMonth(e: Event): void { this.rentMonth.set((e.target as HTMLInputElement).value); }
  protected setRentGross(e: Event): void { this.rentGross.set(Number((e.target as HTMLInputElement).value) || 0); }
  protected setRentWithhold(e: Event): void { this.rentWithhold.set(Number((e.target as HTMLInputElement).value) || 0); }

  protected setExpDescription(e: Event): void { this.expDescription.set((e.target as HTMLInputElement).value); }
  protected setExpAmount(e: Event): void { this.expAmount.set(Number((e.target as HTMLInputElement).value) || 0); }
  protected setExpCategory(e: Event): void {
    this.expCategory.set((e.target as HTMLSelectElement).value as DeductibleExpenseCategory);
  }
  protected setExpDate(e: Event): void { this.expDate.set((e.target as HTMLInputElement).value); }

  protected addRent(): void {
    if (!this.canAddRent()) return;
    this.svc.addRentEntry({
      month: this.rentMonth(),
      grossAmount: this.rentGross(),
      withholding: this.rentWithhold(),
    });
    this.rentMonth.set('');
    this.rentGross.set(0);
    this.rentWithhold.set(0);
  }

  protected addExpense(): void {
    if (!this.canAddExpense()) return;
    this.svc.addExpense({
      description: this.expDescription(),
      amount: this.expAmount(),
      category: this.expCategory(),
      date: this.expDate(),
    });
    this.expDescription.set('');
    this.expAmount.set(0);
    this.expDate.set('');
  }

  protected iconFor(cat: DeductibleExpenseCategory): string {
    return CATEGORIES.find(c => c.id === cat)?.icon ?? '📋';
  }

  protected labelFor(cat: DeductibleExpenseCategory): string {
    return CATEGORIES.find(c => c.id === cat)?.label ?? cat;
  }

  protected categoryEntries(): Array<{ id: DeductibleExpenseCategory; label: string; icon: string; value: number }> {
    const map = this.svc.byCategory();
    return CATEGORIES
      .filter(c => map.has(c.id))
      .map(c => ({ id: c.id, label: c.label, icon: c.icon, value: map.get(c.id) ?? 0 }));
  }
}
