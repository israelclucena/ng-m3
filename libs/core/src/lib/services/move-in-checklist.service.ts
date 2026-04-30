import { Injectable, signal, computed } from '@angular/core';

/**
 * Categories of move-in tasks. Each maps to an icon + heading in the UI.
 */
export type MoveInCategory =
  | 'utilities'      // electricity, water, gas, internet
  | 'admin'          // change of address, tax updates
  | 'financial'      // deposit, first rent payment
  | 'logistics'      // movers, packing, key handover
  | 'inspection';    // walk-through, inventory, photos

/**
 * One actionable item the tenant must complete before/around move-in.
 */
export interface MoveInTask {
  /** Stable identifier (kebab-case). */
  readonly id: string;
  /** Short human-facing label. */
  readonly label: string;
  /** Optional helper text — surfaced under the label in the UI. */
  readonly hint?: string;
  /** Bucket the task belongs to. */
  readonly category: MoveInCategory;
  /** Number of days *before* move-in this should be done by (negative = after). */
  readonly daysBeforeMoveIn: number;
  /** Whether the tenant has marked this task done. */
  readonly done: boolean;
}

/**
 * Default PT-flavoured checklist seed — covers the most common moving-in
 * pain points (utilities transfer, address change, deposit, walk-through).
 */
const DEFAULT_TASKS: ReadonlyArray<MoveInTask> = [
  // Utilities (T-14..T-7)
  { id: 'electricity-transfer', label: 'Pedir transferência de contrato de eletricidade', hint: 'EDP / Endesa / outro fornecedor — número de contador atual',  category: 'utilities', daysBeforeMoveIn: 14, done: false },
  { id: 'water-transfer',       label: 'Transferência do contrato de água',                 hint: 'EPAL ou empresa municipal — leitura de contador',           category: 'utilities', daysBeforeMoveIn: 14, done: false },
  { id: 'gas-transfer',         label: 'Transferência do contrato de gás',                  hint: 'Galp / Goldenergy — só se aplicável',                       category: 'utilities', daysBeforeMoveIn: 14, done: false },
  { id: 'internet-install',     label: 'Marcar instalação de internet/TV',                  hint: 'MEO / NOS / Vodafone — agendar com 7-14 dias antecedência', category: 'utilities', daysBeforeMoveIn: 10, done: false },

  // Admin (T-7..T+30)
  { id: 'address-change-finanças', label: 'Atualizar morada nas Finanças',          hint: 'Portal das Finanças → Cidadão → Alterar morada fiscal', category: 'admin', daysBeforeMoveIn: -7, done: false },
  { id: 'address-change-cc',       label: 'Atualizar morada do Cartão de Cidadão',  hint: 'Online no portal CC ou Loja do Cidadão',                category: 'admin', daysBeforeMoveIn: -30, done: false },
  { id: 'address-change-bank',     label: 'Atualizar morada no banco',              hint: 'App ou balcão',                                          category: 'admin', daysBeforeMoveIn: -14, done: false },

  // Financial (T-3..T-0)
  { id: 'deposit',         label: 'Pagar caução ao senhorio', hint: 'Tipicamente 1-2 meses de renda — guardar comprovativo', category: 'financial', daysBeforeMoveIn: 3, done: false },
  { id: 'first-rent',      label: 'Pagar 1.ª renda',          hint: 'Confirmar IBAN no contrato',                            category: 'financial', daysBeforeMoveIn: 1, done: false },
  { id: 'rent-insurance',  label: 'Subscrever seguro multirriscos', hint: 'Recomendado — protege recheio + responsabilidade civil', category: 'financial', daysBeforeMoveIn: 1, done: false },

  // Logistics (T-7..T-0)
  { id: 'movers',          label: 'Contratar empresa de mudanças',  hint: 'Pedir 2-3 orçamentos — reservar com 7+ dias',  category: 'logistics', daysBeforeMoveIn: 7, done: false },
  { id: 'packing',         label: 'Embalar caixas + etiquetar',     hint: 'Quarto a quarto — fragilísimos separados',     category: 'logistics', daysBeforeMoveIn: 3, done: false },
  { id: 'key-handover',    label: 'Receber chaves do senhorio',     hint: 'Confirmar todas as cópias + cartão de garagem', category: 'logistics', daysBeforeMoveIn: 0, done: false },

  // Inspection (T-0)
  { id: 'walkthrough',     label: 'Walk-through inicial com senhorio', hint: 'Verificar estado de cada divisão',         category: 'inspection', daysBeforeMoveIn: 0, done: false },
  { id: 'meter-readings',  label: 'Anotar leituras de contadores',     hint: 'Eletricidade, água, gás — fotografia dos visores', category: 'inspection', daysBeforeMoveIn: 0, done: false },
  { id: 'inventory-photos', label: 'Fotografar inventário do recheio', hint: 'Especialmente em arrendamento mobilado',    category: 'inspection', daysBeforeMoveIn: 0, done: false },
];

/**
 * State + actions for the tenant move-in checklist.
 *
 * Provides the seed list, a writable mutable copy, and computed progress
 * counters by category. Pure signals — no RxJS.
 */
@Injectable({ providedIn: 'root' })
export class MoveInChecklistService {
  private readonly _tasks = signal<MoveInTask[]>(
    DEFAULT_TASKS.map(t => ({ ...t })),
  );

  /** All tasks (read-only). */
  readonly tasks = this._tasks.asReadonly();

  /** Total number of tasks. */
  readonly total = computed(() => this._tasks().length);

  /** Number of completed tasks. */
  readonly completed = computed(() => this._tasks().filter(t => t.done).length);

  /** Completion percentage, 0..100. */
  readonly progressPct = computed(() => {
    const total = this.total();
    return total === 0 ? 0 : Math.round((this.completed() / total) * 100);
  });

  /** Tasks grouped by category, preserving definition order within each group. */
  readonly byCategory = computed(() => {
    const groups = new Map<MoveInCategory, MoveInTask[]>();
    for (const t of this._tasks()) {
      const arr = groups.get(t.category) ?? [];
      arr.push(t);
      groups.set(t.category, arr);
    }
    return groups;
  });

  /** Per-category progress: { done, total, pct }. */
  readonly categoryProgress = computed(() => {
    const result = new Map<MoveInCategory, { done: number; total: number; pct: number }>();
    for (const [cat, items] of this.byCategory()) {
      const done = items.filter(t => t.done).length;
      const total = items.length;
      result.set(cat, { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) });
    }
    return result;
  });

  /** True once every task is checked. */
  readonly isComplete = computed(() => this.total() > 0 && this.completed() === this.total());

  /** Toggle a single task's done flag. */
  toggle(taskId: string): void {
    this._tasks.update(list =>
      list.map(t => t.id === taskId ? { ...t, done: !t.done } : t),
    );
  }

  /** Mark every task complete (e.g. for the "Complete" Storybook variant). */
  completeAll(): void {
    this._tasks.update(list => list.map(t => ({ ...t, done: true })));
  }

  /** Reset to the default seed (all unchecked). */
  resetAll(): void {
    this._tasks.set(DEFAULT_TASKS.map(t => ({ ...t })));
  }
}
