import { Injectable, signal, computed } from '@angular/core';

/** Subset of PT concelhos with custom IMI rates (urban property). */
export const PT_IMI_TAXAS_MUNICIPAIS: Readonly<Record<string, number>> = {
  Lisboa: 0.003,
  Porto: 0.003,
  Cascais: 0.0034,
  Sintra: 0.0036,
  'Vila Nova de Gaia': 0.0045,
  Almada: 0.0042,
  Oeiras: 0.0033,
  Braga: 0.0035,
  Funchal: 0.0035,
};

/** Default rate when concelho is not in the table or chosen as "Outro". */
export const PT_IMI_TAXA_DEFAULT = 0.004;

/** A scheduled IMI installment. */
export interface IMIPrestacao {
  readonly numero: 1 | 2 | 3;
  readonly mes: 'Maio' | 'Agosto' | 'Novembro';
  readonly valor: number;
}

/**
 * IMI (Imposto Municipal sobre Imóveis) calculator state.
 *
 * Computes annual IMI from VPT × concelho rate, splits into 1/2/3 installments
 * per AT rules (≤100€ → 1×; ≤500€ → 2×; >500€ → 3×) and estimates the família
 * jovem rebate ("isenção jovem", up to 3 deps × 30€/each / NRAU support program).
 *
 * Pure signals — no RxJS.
 */
@Injectable({ providedIn: 'root' })
export class IMICalculatorService {
  /** Valor Patrimonial Tributário (EUR). */
  readonly vpt = signal<number>(150_000);
  /** Concelho key — use any of {@link PT_IMI_TAXAS_MUNICIPAIS} or 'Outro'. */
  readonly concelho = signal<string>('Lisboa');
  /** Manual override of the municipal rate (decimal, e.g. 0.0035). */
  readonly taxaMunicipalOverride = signal<number | null>(null);
  /** Owner-occupied (uso próprio e permanente) — eligibility flag. */
  readonly usoProprio = signal<boolean>(true);
  /** Number of dependants in household (for família jovem dedução). */
  readonly agregadoFamiliar = signal<number>(0);

  /** Effective rate applied to VPT. */
  readonly taxaAplicavel = computed<number>(() => {
    const override = this.taxaMunicipalOverride();
    if (override !== null && Number.isFinite(override) && override > 0) return override;
    const c = this.concelho();
    return PT_IMI_TAXAS_MUNICIPAIS[c] ?? PT_IMI_TAXA_DEFAULT;
  });

  /** Annual IMI before rebates, rounded to cents. */
  readonly imiAnualBruto = computed<number>(() =>
    round2(this.vpt() * this.taxaAplicavel()),
  );

  /**
   * Estimated household-young rebate. PT rule of thumb:
   *  - 1 dependant: −20€  ·  2 deps: −40€  ·  3+ deps: −70€
   * Only applied when uso próprio.
   */
  readonly isencaoEstimada = computed<number>(() => {
    if (!this.usoProprio()) return 0;
    const n = this.agregadoFamiliar();
    if (n <= 0) return 0;
    if (n === 1) return 20;
    if (n === 2) return 40;
    return 70;
  });

  /** Final annual IMI after the rebate; never negative. */
  readonly imiAnual = computed<number>(() =>
    Math.max(0, round2(this.imiAnualBruto() - this.isencaoEstimada())),
  );

  /** Number of installments per AT rules (≤100€ → 1; ≤500€ → 2; otherwise 3). */
  readonly numeroPrestacoes = computed<1 | 2 | 3>(() => {
    const v = this.imiAnual();
    if (v <= 100) return 1;
    if (v <= 500) return 2;
    return 3;
  });

  /** Per-installment value, last one absorbs rounding remainder. */
  readonly imiPorPrestacao = computed<number>(() =>
    round2(this.imiAnual() / this.numeroPrestacoes()),
  );

  /** Full installment calendar (Maio / Agosto / Novembro per AT). */
  readonly prestacoesCalendario = computed<readonly IMIPrestacao[]>(() => {
    const total = this.imiAnual();
    const n = this.numeroPrestacoes();
    if (n === 1) {
      return [{ numero: 1, mes: 'Maio', valor: total }];
    }
    if (n === 2) {
      const each = round2(total / 2);
      return [
        { numero: 1, mes: 'Maio', valor: each },
        { numero: 2, mes: 'Novembro', valor: round2(total - each) },
      ];
    }
    const each = round2(total / 3);
    return [
      { numero: 1, mes: 'Maio', valor: each },
      { numero: 2, mes: 'Agosto', valor: each },
      { numero: 3, mes: 'Novembro', valor: round2(total - 2 * each) },
    ];
  });

  setVpt(v: number): void {
    this.vpt.set(Number.isFinite(v) && v >= 0 ? v : 0);
  }

  setConcelho(c: string): void {
    this.concelho.set(c);
  }

  setTaxaOverride(t: number | null): void {
    this.taxaMunicipalOverride.set(t);
  }

  reset(): void {
    this.vpt.set(150_000);
    this.concelho.set('Lisboa');
    this.taxaMunicipalOverride.set(null);
    this.usoProprio.set(true);
    this.agregadoFamiliar.set(0);
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
