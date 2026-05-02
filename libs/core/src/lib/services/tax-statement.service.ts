import { Injectable, computed, signal } from '@angular/core';
import type { RentReceipt } from './rent-receipt.service';

/** Buckets for deductible expenses on Categoria F (IRS rendimentos prediais). */
export type DeductibleExpenseCategory =
  | 'imi'                  // IMI municipal property tax
  | 'condominio'           // condominium fees
  | 'conservacao'          // routine conservation works
  | 'seguro_multirriscos'  // building insurance
  | 'outros';              // other documented expenses

/** A single deductible expense the landlord paid out of pocket during the year. */
export interface DeductibleExpense {
  readonly id: string;
  readonly category: DeductibleExpenseCategory;
  readonly description: string;
  readonly amount: number;
  /** ISO date the expense was paid (`YYYY-MM-DD`). */
  readonly date: string;
}

/** A single rent line included in the year's gross income. */
export interface RentEntry {
  readonly id: string;
  readonly month: string;      // `YYYY-MM`
  readonly grossAmount: number;
  readonly withholding: number; // IRS retido na fonte (EUR)
}

let __expenseSeq = 0;
let __rentSeq = 0;
const nextExpenseId = () => `exp-${++__expenseSeq}-${Date.now().toString(36)}`;
const nextRentId    = () => `rent-${++__rentSeq}-${Date.now().toString(36)}`;

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * State + computeds for the IRS Categoria F (rendimentos prediais) annual
 * statement helper. The landlord enters/imports rent entries and deductible
 * expenses; the service derives gross income, deductions, net income and the
 * effective tax rate (informational — based on retained-at-source amounts).
 *
 * Pure signals, no RxJS. Service-only — see `TaxStatementGeneratorComponent`
 * for the UI surface.
 */
@Injectable({ providedIn: 'root' })
export class TaxStatementService {
  /** Tax year (e.g. 2025). */
  readonly year = signal<number>(new Date().getFullYear() - 1);

  /** Optional property identifier (free-form — useful when filing per-property). */
  readonly propertyId = signal<string>('');

  private readonly _rents    = signal<RentEntry[]>([]);
  private readonly _expenses = signal<DeductibleExpense[]>([]);

  /** Read-only list of rent entries for the year. */
  readonly rentEntries = this._rents.asReadonly();

  /** Read-only list of deductible expenses. */
  readonly deductibleExpenses = this._expenses.asReadonly();

  /** Sum of `grossAmount` across all rent entries. */
  readonly totalGrossIncome = computed(() =>
    round2(this._rents().reduce((acc, r) => acc + (r.grossAmount > 0 ? r.grossAmount : 0), 0)),
  );

  /** Sum of IRS withholdings already retained at source. */
  readonly withholdingsTotal = computed(() =>
    round2(this._rents().reduce((acc, r) => acc + (r.withholding > 0 ? r.withholding : 0), 0)),
  );

  /** Sum of all deductible expenses. */
  readonly totalDeductions = computed(() =>
    round2(this._expenses().reduce((acc, e) => acc + (e.amount > 0 ? e.amount : 0), 0)),
  );

  /** Gross − deductions, never negative. */
  readonly netIncome = computed(() => {
    const net = this.totalGrossIncome() - this.totalDeductions();
    return round2(net > 0 ? net : 0);
  });

  /**
   * Effective IRS rate already retained at source — `withholdings / gross`.
   * Returned as a percentage (0..100); 0 when there is no gross income.
   */
  readonly effectiveRate = computed(() => {
    const gross = this.totalGrossIncome();
    if (gross <= 0) return 0;
    return round2((this.withholdingsTotal() / gross) * 100);
  });

  /** Deductible expenses grouped by category, with subtotals. */
  readonly byCategory = computed(() => {
    const map = new Map<DeductibleExpenseCategory, number>();
    for (const e of this._expenses()) {
      const prev = map.get(e.category) ?? 0;
      map.set(e.category, round2(prev + (e.amount > 0 ? e.amount : 0)));
    }
    return map;
  });

  /** Replace the tax year (clamped to 1990..current year + 1). */
  setYear(year: number): void {
    if (!Number.isFinite(year)) return;
    const yr = Math.trunc(year);
    const cap = new Date().getFullYear() + 1;
    this.year.set(yr < 1990 ? 1990 : yr > cap ? cap : yr);
  }

  /** Replace the property identifier. */
  setPropertyId(id: string): void {
    this.propertyId.set(id.trim());
  }

  /** Append a rent entry. */
  addRentEntry(input: Omit<RentEntry, 'id'>): void {
    this._rents.update(list => [...list, { id: nextRentId(), ...input }]);
  }

  /** Remove a rent entry by id. */
  removeRentEntry(id: string): void {
    this._rents.update(list => list.filter(r => r.id !== id));
  }

  /** Append a deductible expense. */
  addExpense(input: Omit<DeductibleExpense, 'id'>): void {
    this._expenses.update(list => [...list, { id: nextExpenseId(), ...input }]);
  }

  /** Remove an expense by id. */
  removeExpense(id: string): void {
    this._expenses.update(list => list.filter(e => e.id !== id));
  }

  /**
   * Hydrate rent entries from `RentReceipt` objects (e.g. from
   * `RentReceiptService`). Entries whose `mesReferencia` does not start with
   * the current year are skipped.
   */
  importFromReceipts(receipts: ReadonlyArray<RentReceipt>): void {
    const yearPrefix = String(this.year()) + '-';
    const next: RentEntry[] = receipts
      .filter(r => r.mesReferencia.startsWith(yearPrefix))
      .map(r => ({
        id: nextRentId(),
        month: r.mesReferencia,
        grossAmount: r.valorMensal,
        withholding: r.valorRetido,
      }));
    this._rents.set(next);
  }

  /** Wipe entries + expenses but keep year/propertyId. */
  reset(): void {
    this._rents.set([]);
    this._expenses.set([]);
  }
}
