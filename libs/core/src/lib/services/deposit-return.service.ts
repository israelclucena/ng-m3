import { Injectable, signal, computed } from '@angular/core';

/**
 * Damage / withholding categories aligned with NRAU art. 13.º practice.
 */
export type DamageCategory =
  | 'cleaning'
  | 'repairs'
  | 'unpaid_rent'
  | 'unpaid_utilities'
  | 'other';

/**
 * Single line item the landlord wants to withhold from the caução.
 */
export interface DamageItem {
  readonly id: string;
  readonly label: string;
  readonly cost: number;
  readonly category: DamageCategory;
}

let __damageSeq = 0;
const nextId = () => `damage-${++__damageSeq}-${Date.now().toString(36)}`;

/**
 * State + computeds for the PT caução-return estimator.
 *
 * Tenants and landlords plug in the original deposit, list deductions
 * (with category) and an optional administrative withholding %, and read
 * back the amount owed back to the tenant + breakdown by category.
 *
 * No RxJS — pure signals.
 */
@Injectable({ providedIn: 'root' })
export class DepositReturnService {
  /** Original caução handed over at lease start (EUR). */
  readonly caucaoOriginal = signal<number>(0);

  /** Optional admin/withholding percentage applied on top of itemised deductions. */
  readonly withholdingPct = signal<number>(0);

  private readonly _items = signal<DamageItem[]>([]);

  /** Itemised deductions (read-only). */
  readonly damageItems = this._items.asReadonly();

  /** Sum of itemised deductions. */
  readonly itemsTotal = computed(() =>
    this._items().reduce((acc, it) => acc + (it.cost > 0 ? it.cost : 0), 0),
  );

  /** Withholding amount derived from `withholdingPct` over the original caução. */
  readonly withholdingAmount = computed(() => {
    const pct = this.withholdingPct();
    if (pct <= 0) return 0;
    return (this.caucaoOriginal() * pct) / 100;
  });

  /** Total deductions (items + withholding %). */
  readonly totalDeductions = computed(() =>
    this.itemsTotal() + this.withholdingAmount(),
  );

  /** Amount the landlord must return to the tenant (cannot exceed caução). */
  readonly returnAmount = computed(() => {
    const refund = this.caucaoOriginal() - this.totalDeductions();
    return refund > 0 ? refund : 0;
  });

  /** % of the caução actually returned to tenant. */
  readonly returnPct = computed(() => {
    const cau = this.caucaoOriginal();
    if (cau <= 0) return 0;
    return Math.round((this.returnAmount() / cau) * 100);
  });

  /** Subtotal grouped by damage category. */
  readonly byCategory = computed(() => {
    const map = new Map<DamageCategory, number>();
    for (const it of this._items()) {
      const prev = map.get(it.category) ?? 0;
      map.set(it.category, prev + (it.cost > 0 ? it.cost : 0));
    }
    return map;
  });

  /** True when deductions exceed the deposit (landlord is owed extra). */
  readonly hasShortfall = computed(() => this.totalDeductions() > this.caucaoOriginal());

  /** Add a new damage item. */
  addItem(input: { label: string; cost: number; category: DamageCategory }): void {
    const cost = Number.isFinite(input.cost) && input.cost >= 0 ? input.cost : 0;
    this._items.update(list => [
      ...list,
      { id: nextId(), label: input.label.trim() || 'Sem descrição', cost, category: input.category },
    ]);
  }

  /** Remove a single item. */
  removeItem(id: string): void {
    this._items.update(list => list.filter(it => it.id !== id));
  }

  /** Replace the caução amount. */
  setCaucao(value: number): void {
    this.caucaoOriginal.set(Number.isFinite(value) && value >= 0 ? value : 0);
  }

  /** Replace the withholding percentage (clamped 0..100). */
  setWithholdingPct(value: number): void {
    if (!Number.isFinite(value)) { this.withholdingPct.set(0); return; }
    if (value < 0) { this.withholdingPct.set(0); return; }
    if (value > 100) { this.withholdingPct.set(100); return; }
    this.withholdingPct.set(value);
  }

  /** Clear all items + reset caução and withholding to 0. */
  reset(): void {
    this._items.set([]);
    this.caucaoOriginal.set(0);
    this.withholdingPct.set(0);
  }
}
