import { Injectable, signal, computed } from '@angular/core';

/**
 * Categories of move-out tasks. Each maps to an icon + heading in the UI.
 */
export type MoveOutCategory =
  | 'utilities'      // electricity / water / gas / internet termination or transfer
  | 'admin'          // address change, deposit reclaim, fiscal updates
  | 'financial'      // last rent, last utilities, deposit refund tracking
  | 'logistics'      // movers, packing, key handover
  | 'inspection';    // walk-through, inventory check, photos, meter readings

/**
 * One actionable item the tenant must complete around move-out.
 */
export interface MoveOutTask {
  /** Stable identifier (kebab-case). */
  readonly id: string;
  /** Short human-facing label. */
  readonly label: string;
  /** Optional helper text — surfaced under the label in the UI. */
  readonly hint?: string;
  /** Bucket the task belongs to. */
  readonly category: MoveOutCategory;
  /** Number of days *before* move-out this should be done by (negative = after). */
  readonly daysBeforeMoveOut: number;
  /** Whether the tenant has marked this task done. */
  readonly done: boolean;
}

/**
 * Default PT-flavoured move-out checklist seed — covers utility termination,
 * fiscal/legal address updates, deposit reclaim, walk-through and inventory
 * verification, and final cleaning. Aligned with NRAU practice (denúncia
 * antecedência mínima 30 dias / caução devolução até 30 dias após entrega).
 */
const DEFAULT_TASKS: ReadonlyArray<MoveOutTask> = [
  // Admin (T-60..T-30) — early legal notices
  { id: 'denuncia-contrato',      label: 'Enviar denúncia formal do contrato',         hint: 'Carta registada c/ AR — antecedência mínima 30-120 dias conforme NRAU art. 1098.º', category: 'admin', daysBeforeMoveOut: 60, done: false },
  { id: 'agendar-vistoria',       label: 'Agendar vistoria de saída com senhorio',     hint: 'Combinar dia + hora — prova de estado para devolução de caução',                  category: 'admin', daysBeforeMoveOut: 14, done: false },

  // Utilities (T-14..T-0)
  { id: 'electricity-cancel',     label: 'Cancelar ou transferir contrato eletricidade', hint: 'EDP / Endesa — leitura final + IBAN para reembolso',                            category: 'utilities', daysBeforeMoveOut: 14, done: false },
  { id: 'water-cancel',           label: 'Cancelar contrato de água',                    hint: 'EPAL ou municipal — leitura final',                                              category: 'utilities', daysBeforeMoveOut: 14, done: false },
  { id: 'gas-cancel',             label: 'Cancelar contrato de gás',                     hint: 'Galp / Goldenergy — só se aplicável',                                            category: 'utilities', daysBeforeMoveOut: 14, done: false },
  { id: 'internet-cancel',        label: 'Cancelar internet/TV',                         hint: 'MEO / NOS / Vodafone — confirmar fim de fidelização para evitar penalização',    category: 'utilities', daysBeforeMoveOut: 14, done: false },

  // Logistics (T-7..T-0)
  { id: 'movers',                 label: 'Contratar empresa de mudanças',                hint: 'Pedir 2-3 orçamentos — reservar com 7+ dias',                                    category: 'logistics', daysBeforeMoveOut: 7, done: false },
  { id: 'packing',                label: 'Embalar caixas + etiquetar',                   hint: 'Quarto a quarto — fragilísimos separados',                                       category: 'logistics', daysBeforeMoveOut: 3, done: false },
  { id: 'donate-discard',         label: 'Doar ou descartar mobília não levada',         hint: 'Cáritas, OLX, ecocentro municipal',                                              category: 'logistics', daysBeforeMoveOut: 5, done: false },
  { id: 'final-cleaning',         label: 'Limpeza final do imóvel',                      hint: 'Critério "estado em que recebeu" — fornos, frigorífico, casas de banho',         category: 'logistics', daysBeforeMoveOut: 1, done: false },
  { id: 'key-return',             label: 'Entregar chaves ao senhorio',                  hint: 'Todas as cópias + cartão de garagem + comando portão',                            category: 'logistics', daysBeforeMoveOut: 0, done: false },

  // Inspection (T-0)
  { id: 'walkthrough',            label: 'Walk-through final com senhorio',              hint: 'Verificar estado vs vistoria de entrada (Move-In Checklist)',                     category: 'inspection', daysBeforeMoveOut: 0, done: false },
  { id: 'meter-readings',         label: 'Anotar leituras finais de contadores',         hint: 'Eletricidade, água, gás — fotografia dos visores',                                category: 'inspection', daysBeforeMoveOut: 0, done: false },
  { id: 'inventory-checkout',     label: 'Conferir inventário do recheio',               hint: 'Comparar com inventário entrada — assinalar desgaste vs danos',                   category: 'inspection', daysBeforeMoveOut: 0, done: false },
  { id: 'photos-saida',           label: 'Fotografar estado de cada divisão',            hint: 'Prova para defender em caso de retenção indevida da caução',                       category: 'inspection', daysBeforeMoveOut: 0, done: false },

  // Admin pós-saída (T+1..T+30)
  { id: 'address-change-finanças', label: 'Atualizar morada nas Finanças',          hint: 'Portal das Finanças → Cidadão → Alterar morada fiscal', category: 'admin', daysBeforeMoveOut: -7, done: false },
  { id: 'address-change-cc',       label: 'Atualizar morada do Cartão de Cidadão',  hint: 'Online no portal CC ou Loja do Cidadão',                category: 'admin', daysBeforeMoveOut: -30, done: false },
  { id: 'address-change-bank',     label: 'Atualizar morada no banco',              hint: 'App ou balcão',                                          category: 'admin', daysBeforeMoveOut: -14, done: false },
  { id: 'redirect-mail',           label: 'Pedir reencaminhamento de correio CTT', hint: 'Serviço CTT 6 meses — €30 evita perder correspondência', category: 'admin', daysBeforeMoveOut: -3, done: false },

  // Financial
  { id: 'last-rent',              label: 'Pagar última renda (proporcional se aplicável)', hint: 'Confirmar acerto se denúncia for a meio de mês',  category: 'financial', daysBeforeMoveOut: 1,  done: false },
  { id: 'last-utilities',         label: 'Pagar últimas faturas de serviços',              hint: 'Eletricidade, água, gás, condomínio se aplicável', category: 'financial', daysBeforeMoveOut: -7, done: false },
  { id: 'deposit-reclaim',        label: 'Confirmar devolução da caução',                  hint: 'Senhorio dispõe de 30 dias após entrega (NRAU)',   category: 'financial', daysBeforeMoveOut: -30, done: false },
];

/**
 * State + actions for the tenant move-out checklist.
 *
 * Symmetric counterpart to {@link MoveInChecklistService}. Same five
 * categories, but task list reflects exit obligations: termination notices,
 * utility cancellation, walk-through, deposit reclaim. Pure signals.
 */
@Injectable({ providedIn: 'root' })
export class MoveOutChecklistService {
  private readonly _tasks = signal<MoveOutTask[]>(
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
    const groups = new Map<MoveOutCategory, MoveOutTask[]>();
    for (const t of this._tasks()) {
      const arr = groups.get(t.category) ?? [];
      arr.push(t);
      groups.set(t.category, arr);
    }
    return groups;
  });

  /** Per-category progress: { done, total, pct }. */
  readonly categoryProgress = computed(() => {
    const result = new Map<MoveOutCategory, { done: number; total: number; pct: number }>();
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

  /** Mark every task complete. */
  completeAll(): void {
    this._tasks.update(list => list.map(t => ({ ...t, done: true })));
  }

  /** Reset to the default seed (all unchecked). */
  resetAll(): void {
    this._tasks.set(DEFAULT_TASKS.map(t => ({ ...t })));
  }
}
