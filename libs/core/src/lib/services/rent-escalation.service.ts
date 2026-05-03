import { Injectable, signal, computed } from '@angular/core';

/**
 * Annual update coefficients for residential rent contracts in Portugal,
 * published yearly by Portaria (INE/MoF). Values applicable to update of
 * monthly rent on each anniversary of the contract.
 *
 * Sources (Portarias):
 * - 2018: 1.0112 · 2019: 1.0103 · 2020: 1.0051 · 2021: 1.0000
 * - 2022: 1.0043 · 2023: 1.0543 · 2024: 1.0694 · 2025: 1.0228 · 2026: 1.0216
 *
 * Override per-year via `applyCoeficienteOverride` if a Portaria revision is
 * needed before code-side update.
 */
export const PT_RENT_ESCALATION_COEFICIENTS: Readonly<Record<number, number>> = {
  2018: 1.0112,
  2019: 1.0103,
  2020: 1.0051,
  2021: 1.0000,
  2022: 1.0043,
  2023: 1.0543,
  2024: 1.0694,
  2025: 1.0228,
  2026: 1.0216,
};

/** A single yearly escalation step in the history table. */
export interface EscalationRow {
  readonly year: number;
  readonly coeficiente: number;
  readonly rendaInicio: number;
  readonly rendaFim: number;
  readonly aumentoEur: number;
}

/**
 * Rent escalation calculator state.
 *
 * Computes the legal updated rent value applying yearly Portaria coefficients
 * between `anoInicio` and `anoAlvo`. Override individual years if needed.
 *
 * Pure signals — no RxJS. Aligned with NRAU art. 24.º (annual rent update).
 */
@Injectable({ providedIn: 'root' })
export class RentEscalationService {
  /** Current monthly rent (EUR). */
  readonly rendaActual = signal<number>(800);
  /** Year of the rent value entered above (start year of the simulation). */
  readonly anoInicio = signal<number>(2024);
  /** Target year for the projected updated rent. */
  readonly anoAlvo = signal<number>(2026);
  /** Per-year coefficient overrides; empty by default → uses {@link PT_RENT_ESCALATION_COEFICIENTS}. */
  readonly coeficientesOverride = signal<Readonly<Record<number, number>>>({});

  /** Effective coefficient for a given year (override > built-in > 1.0). */
  readonly coeficienteFor = (year: number): number => {
    const override = this.coeficientesOverride()[year];
    if (typeof override === 'number') return override;
    return PT_RENT_ESCALATION_COEFICIENTS[year] ?? 1.0;
  };

  /** Year-by-year history table for `anoInicio + 1` … `anoAlvo`. */
  readonly historicoEscalation = computed<EscalationRow[]>(() => {
    const start = this.anoInicio();
    const end = this.anoAlvo();
    if (end <= start) return [];
    let renda = this.rendaActual();
    const rows: EscalationRow[] = [];
    for (let y = start + 1; y <= end; y++) {
      const c = this.coeficienteFor(y);
      const fim = round2(renda * c);
      rows.push({
        year: y,
        coeficiente: c,
        rendaInicio: renda,
        rendaFim: fim,
        aumentoEur: round2(fim - renda),
      });
      renda = fim;
    }
    return rows;
  });

  /** Final updated rent at `anoAlvo`. */
  readonly rendaAtualizada = computed<number>(() => {
    const rows = this.historicoEscalation();
    if (rows.length === 0) return this.rendaActual();
    return rows[rows.length - 1].rendaFim;
  });

  /** Total increase (EUR) between start and target year. */
  readonly aumentoTotal = computed<number>(() =>
    round2(this.rendaAtualizada() - this.rendaActual()),
  );

  /** Total increase as percentage of starting rent. */
  readonly aumentoPct = computed<number>(() => {
    const r0 = this.rendaActual();
    if (r0 <= 0) return 0;
    return round2((this.aumentoTotal() / r0) * 100);
  });

  /** Set the starting rent. */
  setRenda(v: number): void {
    this.rendaActual.set(Number.isFinite(v) && v >= 0 ? v : 0);
  }

  /** Set both start and target years in one call. */
  setAnos(inicio: number, alvo: number): void {
    this.anoInicio.set(Math.trunc(inicio));
    this.anoAlvo.set(Math.trunc(alvo));
  }

  /** Override the coefficient for a specific year (e.g. before official Portaria). */
  applyCoeficienteOverride(year: number, valor: number): void {
    if (!Number.isFinite(valor) || valor <= 0) return;
    this.coeficientesOverride.update(o => ({ ...o, [year]: valor }));
  }

  /** Clear all overrides and reset rent + years to defaults. */
  reset(): void {
    this.rendaActual.set(800);
    this.anoInicio.set(2024);
    this.anoAlvo.set(2026);
    this.coeficientesOverride.set({});
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
