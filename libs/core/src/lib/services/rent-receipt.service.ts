import { Injectable, signal, computed } from '@angular/core';

/**
 * Inputs the landlord fills in to generate a single rent receipt.
 * Mirrors the AT (Portal das Finanças) recibo de renda fields.
 */
export interface RentReceiptInput {
  readonly nifSenhorio: string;
  readonly nomeSenhorio: string;
  readonly nifInquilino: string;
  readonly nomeInquilino: string;
  /** Reference month, ISO `YYYY-MM`. */
  readonly mesReferencia: string;
  /** Gross monthly rent (EUR). */
  readonly valorMensal: number;
  /** IRS withholding rate (%) — defaults to 25 (Categoria F). */
  readonly retencaoIRSPct: number;
  /** Property address — printed on the receipt. */
  readonly moradaImovel: string;
}

/**
 * A persisted rent receipt — ready for printing or archiving.
 */
export interface RentReceipt {
  readonly id: string;
  readonly numeroSerie: string;
  readonly emittedAt: number; // epoch ms
  readonly nifSenhorio: string;
  readonly nomeSenhorio: string;
  readonly nifInquilino: string;
  readonly nomeInquilino: string;
  readonly mesReferencia: string;
  readonly moradaImovel: string;
  readonly valorMensal: number;
  readonly retencaoIRSPct: number;
  readonly valorRetido: number;
  readonly valorLiquido: number;
}

let __seriesSeq = 0;
const nextSerie = (): string => {
  const yr = new Date().getFullYear();
  __seriesSeq += 1;
  return `${yr}/${String(__seriesSeq).padStart(5, '0')}`;
};

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Issue + archive PT rent receipts (recibos de renda).
 *
 * Default IRS withholding is 25% (Categoria F, regime geral) but configurable
 * (5–25% for long-term contracts under NRAU recent reforms). Tracks an
 * append-only history of generated receipts in a signal.
 */
@Injectable({ providedIn: 'root' })
export class RentReceiptService {
  private readonly _receipts = signal<RentReceipt[]>([]);

  /** Generated receipts (read-only). */
  readonly receipts = this._receipts.asReadonly();

  /** Total receipts emitted in this session. */
  readonly count = computed(() => this._receipts().length);

  /** Sum of all gross rents emitted. */
  readonly totalGross = computed(() =>
    this._receipts().reduce((acc, r) => acc + r.valorMensal, 0),
  );

  /** Sum of all withholdings. */
  readonly totalWithheld = computed(() =>
    this._receipts().reduce((acc, r) => acc + r.valorRetido, 0),
  );

  /** Generate, archive and return a new receipt. */
  generate(input: RentReceiptInput): RentReceipt {
    const valorMensal = Math.max(0, Number(input.valorMensal) || 0);
    const pct = clampPct(input.retencaoIRSPct);
    const valorRetido = round2((valorMensal * pct) / 100);
    const valorLiquido = round2(valorMensal - valorRetido);

    const receipt: RentReceipt = {
      id: `receipt-${Date.now().toString(36)}-${this._receipts().length + 1}`,
      numeroSerie: nextSerie(),
      emittedAt: Date.now(),
      nifSenhorio: (input.nifSenhorio ?? '').trim(),
      nomeSenhorio: (input.nomeSenhorio ?? '').trim(),
      nifInquilino: (input.nifInquilino ?? '').trim(),
      nomeInquilino: (input.nomeInquilino ?? '').trim(),
      mesReferencia: input.mesReferencia,
      moradaImovel: (input.moradaImovel ?? '').trim(),
      valorMensal: round2(valorMensal),
      retencaoIRSPct: pct,
      valorRetido,
      valorLiquido,
    };

    this._receipts.update(list => [receipt, ...list]);
    return receipt;
  }

  /** Drop a receipt from the in-session archive. */
  remove(id: string): void {
    this._receipts.update(list => list.filter(r => r.id !== id));
  }

  /** Wipe history. Does not reset the global series counter. */
  clear(): void {
    this._receipts.set([]);
  }
}

function clampPct(pct: number): number {
  if (!Number.isFinite(pct)) return 25;
  if (pct < 0) return 0;
  if (pct > 100) return 100;
  return pct;
}

/**
 * Validate a Portuguese NIF (Número de Identificação Fiscal).
 * Pure function — exported for re-use by forms.
 */
export function isValidNIF(nif: string): boolean {
  if (!/^[0-9]{9}$/.test(nif)) return false;
  const digits = nif.split('').map(d => Number(d));
  const checksum = digits
    .slice(0, 8)
    .reduce((acc, d, idx) => acc + d * (9 - idx), 0);
  const mod = checksum % 11;
  const expected = mod < 2 ? 0 : 11 - mod;
  return expected === digits[8];
}
